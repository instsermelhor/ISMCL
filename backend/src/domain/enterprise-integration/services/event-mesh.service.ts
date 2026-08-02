import { Injectable, Logger } from '@nestjs/common';
import { PublishEventMeshEventDto, EventMeshRoutingPolicy } from '../dto/enterprise-integration.dto';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface EventMeshSubscription {
  subscriptionId: string;
  subscriberId: string;
  topics: string[];
  routingPolicy: EventMeshRoutingPolicy;
  active: boolean;
  createdAt: string;
}

export interface EventMeshMessage {
  messageId: string;
  topic: string;
  source: string;
  payload: Record<string, any>;
  routingPolicy: EventMeshRoutingPolicy;
  deliveredTo: string[];
  publishedAt: string;
}

@Injectable()
export class EventMeshService {
  private readonly logger = new Logger(EventMeshService.name);
  private readonly subscriptions: Map<string, EventMeshSubscription> = new Map();
  private readonly messages: EventMeshMessage[] = [];

  constructor(
    private readonly auditSvc: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async subscribe(subscriberId: string, topics: string[], routingPolicy: EventMeshRoutingPolicy): Promise<EventMeshSubscription> {
    const subscriptionId = `SUB-${subscriberId}-${Date.now().toString(36).toUpperCase()}`;
    const sub: EventMeshSubscription = { subscriptionId, subscriberId, topics, routingPolicy, active: true, createdAt: new Date().toISOString() };
    this.subscriptions.set(subscriptionId, sub);
    await this.auditSvc.recordAudit('EVENT_MESH_SUBSCRIPTION_CREATED', subscriptionId, subscriberId, { topics, routingPolicy });
    this.logger.log(`[EventMesh] Assinatura criada: ${subscriberId} -> [${topics.join(', ')}] (${subscriptionId})`);
    return sub;
  }

  async publish(dto: PublishEventMeshEventDto): Promise<EventMeshMessage> {
    const messageId = `MSG-${Date.now().toString(36).toUpperCase()}`;
    const deliveredTo = Array.from(this.subscriptions.values())
      .filter((s) => s.active && s.topics.some((t) => dto.topic.startsWith(t)))
      .map((s) => s.subscriberId);

    const message: EventMeshMessage = { messageId, topic: dto.topic, source: dto.source, payload: dto.payload, routingPolicy: dto.routingPolicy, deliveredTo, publishedAt: new Date().toISOString() };
    this.messages.push(message);

    await this.eventBus.publish('aura.eiemp.event.published.v1', { messageId, topic: dto.topic, source: dto.source, deliveredTo: deliveredTo.length }, 'EIEMP', { subject: messageId });
    await this.auditSvc.recordAudit('EVENT_MESH_MESSAGE_PUBLISHED', messageId, dto.source, { topic: dto.topic, deliveredTo: deliveredTo.length });
    this.logger.log(`[EventMesh] Evento publicado: ${dto.topic} -> ${deliveredTo.length} assinante(s)`);
    return message;
  }

  listSubscriptions(): EventMeshSubscription[] { return Array.from(this.subscriptions.values()); }
  getMessageHistory(topic?: string): EventMeshMessage[] {
    return topic ? this.messages.filter((m) => m.topic === topic) : [...this.messages];
  }
}
