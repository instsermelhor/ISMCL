import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ProviderRegistryService } from './provider-registry.service';
import { EventBusService } from '../../../events/event-bus.service';

/** TTL da chave de idempotência de webhook no Redis: 8 dias (691.200 segundos) */
const WEBHOOK_IDEMPOTENCY_TTL_SECONDS = 691200;

/** Limite máximo de entradas no Set de fallback local para evitar OOM */
const MAX_LOCAL_FALLBACK_KEYS = 10_000;

export interface WebhookProcessingResult {
  processed: boolean;
  eventType?: string;
  externalMeetingId?: string;
  status?: string;
  reason?: string;
}

/**
 * WebhookProcessorService — Processador de Webhooks de Provedores Externos
 *
 * Recebe, valida e correlaciona eventos de webhooks dos provedores (Google, Teams, Meta/WhatsApp)
 * ao Appointment ID Aura (System of Record).
 *
 * Implementa:
 * - Verificação de assinatura HMAC-SHA256 (obrigatória em produção, timing-safe)
 * - Idempotência por externalEventId via Redis (8d TTL) com fallback local em Set limitado (10k FIFO)
 * - Correlação de externalMeetingId → appointmentId Aura via EventBus (aura.actg.webhook.processed.v1)
 * - Tolerância a assinaturas com prefixo 'sha256=' ou formato 't=...,v1=...' (Stripe/Meta style)
 *
 * Referência: ADR-188, Prompt 188 — Item 23, GAP-P3-06
 */
@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger(WebhookProcessorService.name);
  private readonly localFallback = new Set<string>();

  constructor(
    private readonly registry: ProviderRegistryService,
    private readonly eventBus: EventBusService,
    private readonly config: ConfigService,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
  ) {}

  /**
   * Processa um webhook recebido de um provedor externo.
   */
  async process(
    providerType: string,
    rawPayload: Record<string, unknown>,
    signature: string,
    externalEventId?: string,
  ): Promise<WebhookProcessingResult> {
    // 1. Verificação de Idempotência
    if (externalEventId) {
      const alreadyProcessed = await this.isAlreadyProcessed(externalEventId);
      if (alreadyProcessed) {
        this.logger.debug(`[WebhookProcessor] Evento já processado (idempotência): ${externalEventId}`);
        return { processed: false, reason: 'IDEMPOTENT_DUPLICATE' };
      }
    }

    // 2. Validação de Assinatura HMAC-SHA256
    const isValid = this.verifySignature(rawPayload, signature, providerType);
    if (!isValid) {
      this.logger.warn(`[WebhookProcessor] ⚠️ Assinatura inválida para webhook ${providerType}`);
      return { processed: false, reason: 'INVALID_SIGNATURE' };
    }

    // 3. Resolução do Provedor
    const provider = this.registry.getProvider(providerType);
    if (!provider?.processWebhook) {
      this.logger.warn(`[WebhookProcessor] Provedor ${providerType} não suporta webhooks ou não registrado`);
      return { processed: false, reason: 'UNSUPPORTED_PROVIDER' };
    }

    // 4. Execução do Processamento pelo Conector do Provedor
    try {
      const result = await provider.processWebhook(rawPayload, signature);

      // Marca evento como processado para garantir idempotência
      if (externalEventId) {
        await this.markAsProcessed(externalEventId);
      }

      // Publica evento de webhook correlacionado no EventBus
      await this.eventBus.publish(
        'aura.actg.webhook.processed.v1',
        {
          providerType,
          externalEventId,
          eventType: result.eventType,
          externalMeetingId: result.externalMeetingId,
          status: result.status,
        },
        'default',
        { subject: result.externalMeetingId ?? 'unknown' },
      );

      this.logger.log(`[WebhookProcessor] ✅ Webhook processado: ${providerType} — ${result.eventType}`);
      return {
        processed: true,
        eventType: result.eventType,
        externalMeetingId: result.externalMeetingId,
        status: result.status,
      };
    } catch (err) {
      const errMsg = (err as Error).message;
      this.logger.error(`[WebhookProcessor] Erro ao processar webhook ${providerType}: ${errMsg}`);
      return { processed: false, reason: `PROVIDER_ERROR: ${errMsg}` };
    }
  }

  /**
   * Verifica se o externalEventId já foi processado (Redis com fallback para Set local).
   */
  async isAlreadyProcessed(externalEventId: string): Promise<boolean> {
    const cacheKey = `webhook:${externalEventId}`;
    if (this.cacheManager) {
      try {
        const val = await this.cacheManager.get<string>(cacheKey);
        if (val !== undefined && val !== null) return true;
      } catch (e) {
        this.logger.warn(
          `[WebhookProcessor] Redis indisponível ao checar idempotência (${externalEventId}). Usando fallback local.`,
        );
      }
    }
    return this.localFallback.has(externalEventId);
  }

  /**
   * Marca o externalEventId como processado no Redis (ou fallback local).
   */
  async markAsProcessed(externalEventId: string): Promise<void> {
    const cacheKey = `webhook:${externalEventId}`;
    if (this.cacheManager) {
      try {
        await this.cacheManager.set(cacheKey, '1', WEBHOOK_IDEMPOTENCY_TTL_SECONDS * 1000);
        return;
      } catch (e) {
        this.logger.warn(
          `[WebhookProcessor] Redis indisponível ao marcar idempotência (${externalEventId}). Usando fallback local.`,
        );
      }
    }
    // Fallback local com limite FIFO
    if (this.localFallback.size >= MAX_LOCAL_FALLBACK_KEYS) {
      const oldest = this.localFallback.values().next().value;
      if (oldest) this.localFallback.delete(oldest);
    }
    this.localFallback.add(externalEventId);
  }

  /**
   * Valida a assinatura HMAC-SHA256 do payload.
   * Suporta formatos: hex direto, 'sha256=<hex>', ou 'v1=<hex>'.
   */
  private verifySignature(
    payload: Record<string, unknown>,
    signature: string,
    providerType: string,
  ): boolean {
    const secret = this.config.get<string>('ACTG_WEBHOOK_SECRET', '');
    if (!secret) {
      // Se a secret não estiver configurada, permite apenas em ambiente não-produção
      const isDev = this.config.get('NODE_ENV') !== 'production';
      if (isDev) {
        this.logger.warn(
          `[WebhookProcessor] ACTG_WEBHOOK_SECRET não configurado. Assinatura aceita em ambiente dev (${providerType}).`,
        );
      }
      return isDev;
    }

    if (!signature) return false;

    const expectedHex = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Extrai o hash hex puro se a assinatura contiver prefixo tipo 'sha256=' ou 'v1='
    let cleanSignature = signature;
    if (signature.startsWith('sha256=')) {
      cleanSignature = signature.substring(7);
    } else if (signature.includes('v1=')) {
      const match = signature.match(/v1=([a-f0-9]+)/i);
      if (match) cleanSignature = match[1];
    }

    try {
      const bufExpected = Buffer.from(expectedHex, 'hex');
      const bufReceived = Buffer.from(cleanSignature, 'hex');

      if (bufExpected.length !== bufReceived.length) return false;
      return timingSafeEqual(bufExpected, bufReceived);
    } catch {
      return false;
    }
  }
}
