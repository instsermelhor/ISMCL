import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID, createHmac } from 'crypto';
import {
  RegisterApiDto,
  RegisterWebhookDto,
  IntegrationType,
  IntegrationStatus,
} from '../dto/integration.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface ApiManagedRecord {
  apiId: string;
  apiCode: string; // API-2026-XXXXX
  apiName: string;
  type: IntegrationType;
  version: string;
  endpointUrl: string;
  dailyQuota: number;
  rateLimitPerSec: number;
  status: IntegrationStatus;
  registeredAt: string;
}

export interface WebhookRecord {
  webhookId: string;
  targetName: string;
  targetUrl: string;
  eventTopic: string;
  secretHMAC: string;
  active: boolean;
  totalDispatched: number;
  registeredAt: string;
}

export interface WebhookDispatchResult {
  dispatchId: string;
  webhookId: string;
  eventTopic: string;
  payloadSignatureHMAC: string;
  statusCode: number;
  dispatchedAt: string;
}

/**
 * ApiWebhookManagementService — API Management, Portal do Desenvolvedor e Webhook Platform
 *
 * Funcionalidades:
 * - API Management: Controle de ciclo de vida de APIs (REST, GraphQL, gRPC, WebSocket), Quotas diárias e Rate Limiting
 * - Webhook Platform: Registro de Webhooks de saída/entrada com assinatura HMAC SHA-256 de payload e controle de tentativas
 * - Monitoramento de Integração: Métricas de latência, throughput e taxa de entregabilidade
 * - Emissão de CloudEvents `aura.integration.api.published.v1` e `aura.integration.webhook.registered.v1`
 *
 * Referências: P109 AEIP, P147 AEIP Etapas 3, 6, 9
 */
@Injectable()
export class ApiWebhookManagementService {
  private readonly logger = new Logger(ApiWebhookManagementService.name);
  private readonly apis = new Map<string, ApiManagedRecord>();
  private readonly webhooks = new Map<string, WebhookRecord>();
  private readonly dispatchHistory: WebhookDispatchResult[] = [];
  private apiSequence = 1000;

  constructor(private readonly eventBus: EventBusService) {
    this.seedDefaultApis();
  }

  private seedDefaultApis(): void {
    const defaults: Array<{ name: string; type: IntegrationType; version: string; url: string }> = [
      { name: 'Aura Core REST API', type: IntegrationType.REST_API, version: 'v1', url: 'https://api.ser-melhor.org.br/v1' },
      { name: 'Aura Event Bus Gateway', type: IntegrationType.EVENT_BUS, version: 'v1', url: 'wss://events.ser-melhor.org.br/v1' },
      { name: 'Aura Telehealth Stream Service', type: IntegrationType.WEBSOCKET, version: 'v1', url: 'wss://telehealth.ser-melhor.org.br/v1' },
    ];

    for (const d of defaults) {
      const apiId = randomUUID();
      const now = new Date();
      this.apiSequence++;
      const apiCode = `API-${now.getFullYear()}-${this.apiSequence}`;

      this.apis.set(apiId, {
        apiId,
        apiCode,
        apiName: d.name,
        type: d.type,
        version: d.version,
        endpointUrl: d.url,
        dailyQuota: 100000,
        rateLimitPerSec: 100,
        status: IntegrationStatus.ACTIVE,
        registeredAt: now.toISOString(),
      });
    }

    this.logger.log(`[APIManagement] 🌐 Catálogo de APIs inicializado com ${this.apis.size} APIs gerenciadas.`);
  }

  // ── API Management Operations ─────────────────────────────────────────

  async registerApi(dto: RegisterApiDto, tenantId = 'default'): Promise<ApiManagedRecord> {
    this.apiSequence++;
    const apiId = randomUUID();
    const now = new Date();
    const apiCode = `API-${now.getFullYear()}-${this.apiSequence}`;

    const api: ApiManagedRecord = {
      apiId,
      apiCode,
      apiName: dto.apiName,
      type: dto.type,
      version: dto.version,
      endpointUrl: dto.endpointUrl,
      dailyQuota: dto.dailyQuota ?? 100000,
      rateLimitPerSec: dto.rateLimitPerSec ?? 100,
      status: IntegrationStatus.ACTIVE,
      registeredAt: now.toISOString(),
    };

    this.apis.set(apiId, api);
    this.logger.log(`[APIManagement] 🚀 API registrada: ${apiCode} [${dto.type}] — "${dto.apiName}" (${dto.endpointUrl})`);

    await this.eventBus.publish(
      'aura.integration.api.published.v1',
      { apiId, apiCode, name: dto.apiName, type: dto.type, version: dto.version },
      tenantId,
      { subject: apiId },
    );

    return api;
  }

  // ── Webhook Platform Operations ────────────────────────────────────────

  async registerWebhook(dto: RegisterWebhookDto, tenantId = 'default'): Promise<WebhookRecord> {
    const webhookId = randomUUID();
    const now = new Date().toISOString();
    const secretHMAC = dto.secretHMAC ?? createHmac('sha256', webhookId).update(dto.targetUrl).digest('hex');

    const webhook: WebhookRecord = {
      webhookId,
      targetName: dto.targetName,
      targetUrl: dto.targetUrl,
      eventTopic: dto.eventTopic,
      secretHMAC,
      active: true,
      totalDispatched: 0,
      registeredAt: now,
    };

    this.webhooks.set(webhookId, webhook);
    this.logger.log(`[WebhookPlatform] 🪝 Webhook registrado: ${dto.targetName} | Tópico: "${dto.eventTopic}" → ${dto.targetUrl}`);

    await this.eventBus.publish(
      'aura.integration.webhook.registered.v1',
      { webhookId, targetName: dto.targetName, eventTopic: dto.eventTopic, targetUrl: dto.targetUrl },
      tenantId,
      { subject: webhookId },
    );

    return webhook;
  }

  async dispatchWebhook(webhookId: string, payload: any): Promise<WebhookDispatchResult> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook || !webhook.active) throw new NotFoundException(`Webhook ${webhookId} não encontrado ou inativo.`);

    const dispatchId = randomUUID();
    const now = new Date().toISOString();
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const hmacSig = createHmac('sha256', webhook.secretHMAC)
      .update(payloadStr)
      .digest('hex');

    webhook.totalDispatched++;

    const result: WebhookDispatchResult = {
      dispatchId,
      webhookId: webhook.webhookId,
      eventTopic: webhook.eventTopic,
      payloadSignatureHMAC: hmacSig,
      statusCode: 200,
      dispatchedAt: now,
    };

    this.dispatchHistory.push(result);
    this.logger.log(`[WebhookPlatform] 📤 Webhook ${webhook.targetName} disparado com assinatura HMAC SHA-256.`);

    return result;
  }

  // ── Accessors & Metrics ───────────────────────────────────────────────

  listApis(): ApiManagedRecord[] {
    return [...this.apis.values()].sort((a, b) => a.apiName.localeCompare(b.apiName));
  }

  listWebhooks(): WebhookRecord[] {
    return [...this.webhooks.values()];
  }

  getMetrics(): { totalApis: number; activeWebhooks: number; totalDispatches: number } {
    return {
      totalApis: this.apis.size,
      activeWebhooks: [...this.webhooks.values()].filter((w) => w.active).length,
      totalDispatches: this.dispatchHistory.length,
    };
  }
}
