import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';

/**
 * CloudEvents v1.0.3 envelope — padrão corporativo de eventos da Plataforma Aura.
 * Referência: P124 (AEEDA), P125 (AEAP), P131 (AFPI)
 */
export interface AuraCloudEvent<T = unknown> {
  specversion: '1.0';
  id: string;
  source: string;
  type: string;
  subject?: string;
  datacontenttype: 'application/json';
  dataschema?: string;
  time: string;
  tenantid: string;
  correlationid?: string;
  data: T;
}

export interface PublishOptions {
  /** ID de correlação para rastrear fluxos de negócio */
  correlationId?: string;
  /** Subject específico do evento (e.g. ID do recurso afetado) */
  subject?: string;
  /** Origem customizada do evento */
  source?: string;
  /** Atraso em ms antes de publicar (para retry/delay patterns) */
  delay?: number;
}

/**
 * EventBusService — Barramento de Eventos da Plataforma Aura
 *
 * Implementa o padrão CloudEvents v1.0.3 sobre o EventEmitter2 do NestJS.
 * Em produção, este serviço será estendido para publicar no Apache Kafka 3.7
 * via KafkaProducer (configurado no Sprint 3).
 *
 * Funcionalidades:
 * - Publicação de eventos com envelope CloudEvents v1.0.3
 * - Inscrição em tipos de eventos (wildcard support)
 * - Dead Letter Queue local para eventos que falham (em memória, dev only)
 * - Logging estruturado de todos os eventos publicados
 * - Correlação de eventos via correlationId
 *
 * Convenção de tipos de eventos:
 * `aura.<domain>.<entity>.<action>.v<version>`
 * Ex: `aura.clinical.patient.created.v1`
 *
 * Referências: P124 (AEEDA), P131 (AFPI)
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly dlq: AuraCloudEvent[] = []; // DLQ em memória para dev
  private readonly APP_SOURCE = 'https://api.aura.sermelhor.org.br';

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Publica um evento no barramento interno.
   *
   * @param eventType - Tipo do evento (convenção: `aura.<domain>.<entity>.<action>.v1`)
   * @param data - Payload tipado do evento
   * @param tenantId - ID do tenant (obrigatório para multi-tenancy)
   * @param options - Opções adicionais de publicação
   */
  async publish<T = unknown>(
    eventType: string,
    data: T,
    tenantId: string,
    options: PublishOptions = {},
  ): Promise<AuraCloudEvent<T>> {
    const event: AuraCloudEvent<T> = {
      specversion: '1.0',
      id: randomUUID(),
      source: options.source ?? this.APP_SOURCE,
      type: eventType,
      subject: options.subject,
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      tenantid: tenantId,
      correlationid: options.correlationId ?? randomUUID(),
      data,
    };

    this.logger.debug({
      eventId: event.id,
      eventType,
      tenantId,
      correlationId: event.correlationid,
      message: `[EventBus] Publishing: ${eventType}`,
    });

    try {
      if (options.delay && options.delay > 0) {
        setTimeout(() => {
          this.eventEmitter.emit(eventType, event);
        }, options.delay);
      } else {
        this.eventEmitter.emit(eventType, event);
      }
    } catch (error) {
      this.logger.error(
        { event, error: error instanceof Error ? error.message : String(error) },
        `[EventBus] Failed to publish: ${eventType}. Sending to DLQ.`,
      );
      this.dlq.push(event as AuraCloudEvent);
    }

    return event;
  }

  /**
   * Inscreve um handler para um tipo de evento.
   * Suporta wildcard: `aura.clinical.*` captura todos os eventos clínicos.
   */
  subscribe<T = unknown>(
    eventType: string,
    handler: (event: AuraCloudEvent<T>) => void | Promise<void>,
  ): void {
    this.eventEmitter.on(eventType, handler);
    this.logger.debug(`[EventBus] Subscribed to: ${eventType}`);
  }

  /**
   * Retorna os eventos na Dead Letter Queue (apenas para dev/debug).
   */
  getDlq(): AuraCloudEvent[] {
    return [...this.dlq];
  }

  /**
   * Reprocessa os eventos da DLQ.
   */
  async replayDlq(): Promise<number> {
    const count = this.dlq.length;
    while (this.dlq.length > 0) {
      const event = this.dlq.shift();
      if (event) {
        this.eventEmitter.emit(event.type, event);
      }
    }
    this.logger.log(`[EventBus] Replayed ${count} events from DLQ.`);
    return count;
  }
}
