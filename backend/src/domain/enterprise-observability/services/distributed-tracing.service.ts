import { Injectable, Logger } from '@nestjs/common';
import { ObservabilityAuditService } from './observability-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface TraceSpan {
  spanId: string;
  serviceName: string;
  operationName: string;
  durationMs: number;
  statusCode: number;
  hasError: boolean;
  circuitBreakerTriggered: boolean;
  retryCount: number;
  startedAt: string;
}

export interface DistributedTraceGraph {
  traceId: string;
  rootService: string;
  totalDurationMs: number;
  spansCount: number;
  hasErrors: boolean;
  spans: TraceSpan[];
  completedAt: string;
}

/**
 * DistributedTracingService — P173 EORP
 *
 * Rastreamento distribuído end-to-end (Distributed Tracing).
 * Acompanha o fluxo completo de cada requisição através de todos os microsserviços,
 * identificando latências, gargalos, falhas, retries e disparos de circuit breakers.
 */
@Injectable()
export class DistributedTracingService {
  private readonly logger = new Logger(DistributedTracingService.name);
  private readonly traces: Map<string, DistributedTraceGraph> = new Map();

  constructor(
    private readonly auditSvc: ObservabilityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async startTrace(rootService: string, operationName: string): Promise<string> {
    const traceId = `TRACE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const rootSpan: TraceSpan = {
      spanId: `SPAN-ROOT-1`,
      serviceName: rootService,
      operationName,
      durationMs: 0,
      statusCode: 200,
      hasError: false,
      circuitBreakerTriggered: false,
      retryCount: 0,
      startedAt: now,
    };

    const graph: DistributedTraceGraph = {
      traceId,
      rootService,
      totalDurationMs: 0,
      spansCount: 1,
      hasErrors: false,
      spans: [rootSpan],
      completedAt: now,
    };

    this.traces.set(traceId, graph);
    return traceId;
  }

  async addSpanToTrace(
    traceId: string,
    serviceName: string,
    operationName: string,
    durationMs: number,
    statusCode = 200,
    circuitBreakerTriggered = false,
    retryCount = 0,
  ): Promise<TraceSpan> {
    const trace = this.getOrThrow(traceId);
    const spanId = `SPAN-${serviceName.replace(/\s+/g, '')}-${trace.spans.length + 1}`;
    const hasError = statusCode >= 400;

    const span: TraceSpan = {
      spanId,
      serviceName,
      operationName,
      durationMs,
      statusCode,
      hasError,
      circuitBreakerTriggered,
      retryCount,
      startedAt: new Date().toISOString(),
    };

    trace.spans.push(span);
    trace.spansCount = trace.spans.length;
    trace.totalDurationMs += durationMs;
    if (hasError) trace.hasErrors = true;
    trace.completedAt = new Date().toISOString();

    await this.eventBus.publish(
      'aura.eorp.trace.completed.v1',
      { traceId, spansCount: trace.spansCount, totalDurationMs: trace.totalDurationMs, hasErrors: trace.hasErrors },
      'EORP',
      { subject: traceId },
    );

    return span;
  }

  getTrace(traceId: string): DistributedTraceGraph | undefined {
    return this.traces.get(traceId);
  }

  listTraces(onlyWithErrors = false): DistributedTraceGraph[] {
    const all = Array.from(this.traces.values());
    return onlyWithErrors ? all.filter((t) => t.hasErrors) : all;
  }

  private getOrThrow(traceId: string): DistributedTraceGraph {
    const t = this.traces.get(traceId);
    if (!t) throw new Error(`Trace "${traceId}" não encontrado.`);
    return t;
  }
}
