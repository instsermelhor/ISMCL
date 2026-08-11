import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
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
 * Tópicos de eventos críticos que recebem persistência via Redis Streams (dual-write).
 * Estes eventos NÃO podem ser perdidos em caso de falha do processo antes de serem
 * consumidos pelos subscribers in-process.
 *
 * Referência: ANO-009, Sprint R4, AURA_ARCHITECTURE_REMEDIATION_PLAN.md
 */
const CRITICAL_EVENT_TOPICS: readonly string[] = [
  'aura.security.breakglass',
  'aura.audit',
  'aura.financial.transaction',
  'aura.ehr.note.signed',
  'aura.actg.webhook.processed',
  'aura.identity.user',
] as const;

/** Chave do Redis Stream para eventos críticos */
const REDIS_STREAM_KEY = 'stream:aura:events';

/** Máximo de entradas no stream antes de truncar (para controlar tamanho) */
const STREAM_MAXLEN = 10_000;

/**
 * EventBusService — Barramento de Eventos da Plataforma Aura
 *
 * Implementa o padrão CloudEvents v1.0.3 com **dual-write** para eventos críticos:
 * 1. `EventEmitter2` in-process (todos os eventos — compatibilidade retroativa)
 * 2. Redis Streams via `XADD` (apenas eventos críticos — durabilidade e replay)
 *
 * O dual-write garante que eventos de alta criticidade (BreakGlass, Audit, Financeiro)
 * sejam persistidos mesmo que o processo caia antes do subscriber in-process os consumir.
 *
 * Se o Redis estiver indisponível, o dual-write falha silenciosamente e o evento
 * continua sendo emitido in-process normalmente (graceful degradation).
 *
 * Funcionalidades:
 * - Publicação de eventos com envelope CloudEvents v1.0.3
 * - Dual-write automático em Redis Streams para eventos críticos
 * - Inscrição em tipos de eventos (wildcard support via EventEmitter2)
 * - Dead Letter Queue local para eventos que falham (em memória, dev only)
 * - Logging estruturado de todos os eventos publicados
 * - Correlação de eventos via correlationId
 * - Replay de eventos do Redis Stream via `consumeStream()`
 *
 * Convenção de tipos de eventos:
 * `aura.<domain>.<entity>.<action>.v<version>`
 * Ex: `aura.clinical.patient.created.v1`
 *
 * Referências: P124 (AEEDA), P131 (AFPI), ANO-009 Sprint R4
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly dlq: AuraCloudEvent[] = []; // DLQ em memória para dev
  private readonly APP_SOURCE = 'https://api.aura.sermelhor.org.br';

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
  ) {}

  /**
   * Publica um evento no barramento interno.
   *
   * Para eventos críticos, executa dual-write em Redis Streams além do EventEmitter2.
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

    // ── Dual-Write: Redis Streams para eventos críticos (ANO-009) ────────────
    if (this.isCriticalEvent(eventType)) {
      await this.writeToRedisStream(event);
    }

    // ── In-Process EventEmitter2 (todos os eventos) ──────────────────────────
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
   * Consome eventos do Redis Stream a partir de um ID de cursor.
   * Útil para replay de eventos críticos após reinicialização do processo.
   *
   * @param lastId - ID do último evento consumido (use '0' para consumir desde o início)
   * @param count  - Máximo de eventos a retornar (padrão: 100)
   */
  async consumeStream(lastId: string = '0', count: number = 100): Promise<AuraCloudEvent[]> {
    if (!this.cacheManager) {
      this.logger.warn('[EventBus] consumeStream: Redis não disponível. Retornando array vazio.');
      return [];
    }

    try {
      // Acessa o cliente ioredis subjacente para operações de stream
      const redisClient = (this.cacheManager as any).store?.client;
      if (!redisClient || typeof redisClient.xrange !== 'function') {
        this.logger.warn('[EventBus] consumeStream: cliente Redis sem suporte a XRANGE.');
        return [];
      }

      const entries: [string, string[]][] = await redisClient.xrange(
        REDIS_STREAM_KEY,
        lastId === '0' ? '-' : lastId,
        '+',
        'COUNT',
        count,
      );

      return entries
        .map(([, fields]) => {
          const payloadIdx = fields.indexOf('payload');
          if (payloadIdx === -1) return null;
          try {
            return JSON.parse(fields[payloadIdx + 1]) as AuraCloudEvent;
          } catch {
            return null;
          }
        })
        .filter((e): e is AuraCloudEvent => e !== null);
    } catch (error) {
      this.logger.error(`[EventBus] Erro ao consumir Redis Stream: ${error}`);
      return [];
    }
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

  // ── Helpers Privados ────────────────────────────────────────────────────────

  /**
   * Verifica se um tipo de evento é crítico e deve ser persistido no Redis Stream.
   */
  private isCriticalEvent(eventType: string): boolean {
    return CRITICAL_EVENT_TOPICS.some((prefix) => eventType.startsWith(prefix));
  }

  /**
   * Persiste o evento no Redis Stream com graceful degradation.
   * Falha silenciosamente se Redis estiver indisponível — o evento continua
   * sendo emitido in-process normalmente.
   */
  private async writeToRedisStream(event: AuraCloudEvent): Promise<void> {
    if (!this.cacheManager) return;

    try {
      const redisClient = (this.cacheManager as any).store?.client;
      if (!redisClient || typeof redisClient.xadd !== 'function') return;

      await redisClient.xadd(
        REDIS_STREAM_KEY,
        'MAXLEN',
        '~',
        STREAM_MAXLEN,
        '*', // Auto-generate Stream ID
        'type', event.type,
        'tenantId', event.tenantid,
        'correlationId', event.correlationid ?? '',
        'payload', JSON.stringify(event),
      );

      this.logger.debug(
        `[EventBus] ✅ Dual-write Redis Stream: ${event.type} [${event.id}]`,
      );
    } catch (error) {
      // Graceful degradation — não propaga o erro para não bloquear o fluxo principal
      this.logger.warn(
        `[EventBus] ⚠️ Dual-write Redis Stream falhou (graceful): ${event.type} — ${error}`,
      );
    }
  }
}
