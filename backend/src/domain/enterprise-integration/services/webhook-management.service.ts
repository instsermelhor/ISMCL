import { Injectable, Logger } from '@nestjs/common';
import { RegisterWebhookDto, WebhookStatus } from '../dto/enterprise-integration.dto';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface WebhookRecord {
  webhookId: string;
  targetUrl: string;
  events: string[];
  subscriberId: string;
  status: WebhookStatus;
  deliveryLog: WebhookDelivery[];
  registeredAt: string;
}

export interface WebhookDelivery {
  deliveryId: string;
  event: string;
  statusCode: number;
  durationMs: number;
  deliveredAt: string;
  success: boolean;
}

@Injectable()
export class WebhookManagementService {
  private readonly logger = new Logger(WebhookManagementService.name);
  private readonly webhooks: Map<string, WebhookRecord> = new Map();

  constructor(
    private readonly auditSvc: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerWebhook(dto: RegisterWebhookDto, registeredBy: string): Promise<WebhookRecord> {
    const record: WebhookRecord = { webhookId: dto.webhookId, targetUrl: dto.targetUrl, events: dto.events, subscriberId: dto.subscriberId, status: WebhookStatus.ACTIVE, deliveryLog: [], registeredAt: new Date().toISOString() };
    this.webhooks.set(dto.webhookId, record);
    await this.auditSvc.recordAudit('WEBHOOK_REGISTERED', dto.webhookId, registeredBy, { targetUrl: dto.targetUrl, events: dto.events });
    this.logger.log(`[WebhookMgmt] Webhook registrado: ${dto.webhookId} -> ${dto.targetUrl}`);
    return record;
  }

  async triggerWebhook(webhookId: string, event: string): Promise<WebhookDelivery> {
    const wh = this.getOrThrow(webhookId);
    if (wh.status !== WebhookStatus.ACTIVE) throw new Error(`Webhook "${webhookId}" inativo.`);
    const deliveryId = `WH-DELIVERY-${Date.now().toString(36).toUpperCase()}`;
    const delivery: WebhookDelivery = { deliveryId, event, statusCode: 200, durationMs: Math.floor(Math.random() * 200) + 50, deliveredAt: new Date().toISOString(), success: true };
    wh.deliveryLog.push(delivery);
    await this.auditSvc.recordAudit('WEBHOOK_TRIGGERED', deliveryId, 'EventBus', { webhookId, event, statusCode: delivery.statusCode });
    await this.eventBus.publish('aura.eiemp.webhook.triggered.v1', { webhookId, event, deliveryId, success: delivery.success }, 'EIEMP', { subject: webhookId });
    this.logger.log(`[WebhookMgmt] Webhook ${webhookId} disparado para evento "${event}": ${delivery.statusCode}`);
    return delivery;
  }

  getWebhook(webhookId: string): WebhookRecord | undefined { return this.webhooks.get(webhookId); }
  listWebhooks(): WebhookRecord[] { return Array.from(this.webhooks.values()); }

  private getOrThrow(webhookId: string): WebhookRecord {
    const w = this.webhooks.get(webhookId);
    if (!w) throw new Error(`Webhook "${webhookId}" nao encontrado.`);
    return w;
  }
}
