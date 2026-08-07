import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ProviderRegistryService } from './provider-registry.service';
import { EventBusService } from '../../../events/event-bus.service';

/**
 * WebhookProcessorService — Processador de Webhooks de Provedores Externos
 *
 * Recebe, valida e correlaciona eventos de webhooks dos provedores (Google, Teams, Meta)
 * ao Appointment ID Aura (System of Record).
 *
 * Implementa:
 * - Verificação de assinatura HMAC-SHA256 (obrigatória)
 * - Correlação de externalMeetingId → appointmentId Aura
 * - Idempotência por externalEventId
 * - Publicação de CloudEvents correlacionados
 *
 * Referência: ADR-188, Prompt 188 — Item 23
 */
@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger(WebhookProcessorService.name);
  private readonly processedEvents = new Set<string>();

  constructor(
    private readonly registry: ProviderRegistryService,
    private readonly eventBus: EventBusService,
    private readonly config: ConfigService,
  ) {}

  async process(
    providerType: string,
    rawPayload: Record<string, unknown>,
    signature: string,
    externalEventId?: string,
  ): Promise<{ processed: boolean; eventType?: string }> {
    if (externalEventId && this.processedEvents.has(externalEventId)) {
      this.logger.debug(`[WebhookProcessor] Evento já processado (idempotência): ${externalEventId}`);
      return { processed: false };
    }

    const isValid = this.verifySignature(rawPayload, signature, providerType);
    if (!isValid) {
      this.logger.warn(`[WebhookProcessor] ⚠️ Assinatura inválida para webhook ${providerType}`);
      return { processed: false };
    }

    const provider = this.registry.getProvider(providerType);
    if (!provider?.processWebhook) {
      this.logger.warn(`[WebhookProcessor] Provedor ${providerType} não suporta webhooks`);
      return { processed: false };
    }

    try {
      const result = await provider.processWebhook(rawPayload, signature);

      if (externalEventId) this.processedEvents.add(externalEventId);

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
      return { processed: true, eventType: result.eventType };
    } catch (err) {
      this.logger.error(`[WebhookProcessor] Erro ao processar webhook: ${(err as Error).message}`);
      return { processed: false };
    }
  }

  private verifySignature(
    payload: Record<string, unknown>,
    signature: string,
    providerType: string,
  ): boolean {
    const secret = this.config.get<string>('ACTG_WEBHOOK_SECRET', '');
    if (!secret) {
      return this.config.get('NODE_ENV') !== 'production';
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }
}
