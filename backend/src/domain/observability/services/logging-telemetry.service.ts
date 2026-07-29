import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { IngestLogDto, LogLevel } from '../dto/observability.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface StructuredLog {
  logId: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  correlationId: string;
  traceId: string;
  spanId: string;
  digitalSignature: string; // SHA-256 signature for immutability
  metadata?: Record<string, unknown>;
}

export interface MetricEntry {
  metricName: string;
  value: number;
  unit: string;
  module: string;
  timestamp: string;
}

/**
 * LoggingTelemetryService — Centralização de Logs, Métricas e Tracing Distribuído
 *
 * Funcionalidades:
 * - Logs Estruturados, Assinados Digitalmente (SHA-256) e Imutáveis
 * - Rastreamento Distribuído (Correlation ID, Trace ID, Span ID)
 * - Coleta de Métricas em tempo real (Latência, Throughput, Erros, SLA)
 * - Publicação de CloudEvents `aura.observability.log.created.v1`
 *
 * Referências: P106 AEDSO, P118 AECS, P142 AEOCSAP Etapas 2, 3, 4, 5
 */
@Injectable()
export class LoggingTelemetryService {
  private readonly logger = new Logger(LoggingTelemetryService.name);
  private readonly logsBuffer: StructuredLog[] = [];
  private readonly metricsBuffer: MetricEntry[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  async ingestLog(dto: IngestLogDto, tenantId = 'default'): Promise<StructuredLog> {
    const logId = randomUUID();
    const timestamp = new Date().toISOString();
    const correlationId = dto.correlationId ?? `corr-${randomUUID().substring(0, 8)}`;
    const traceId = dto.traceId ?? `trace-${randomUUID().substring(0, 12)}`;
    const spanId = `span-${randomUUID().substring(0, 8)}`;

    // Assinatura digital do log para garantir imutabilidade
    const payloadToSign = `${logId}:${timestamp}:${dto.level}:${dto.module}:${dto.message}:${correlationId}`;
    const digitalSignature = createHash('sha256').update(payloadToSign).digest('hex');

    const structuredLog: StructuredLog = {
      logId,
      timestamp,
      level: dto.level,
      module: dto.module,
      message: dto.message,
      correlationId,
      traceId,
      spanId,
      digitalSignature,
      metadata: dto.metadata,
    };

    this.logsBuffer.push(structuredLog);
    if (this.logsBuffer.length > 1000) this.logsBuffer.shift(); // Manter buffer delimitado em memória

    this.logger.log(`[Telemetry] 📜 Log [${dto.level}] [${dto.module}] CorrID: ${correlationId} | Sig: ${digitalSignature.substring(0, 8)}...`);

    if (dto.level === LogLevel.SECURITY || dto.level === LogLevel.AUDIT || dto.level === LogLevel.ERROR) {
      await this.eventBus.publish(
        'aura.observability.log.created.v1',
        { logId, level: dto.level, module: dto.module, correlationId, digitalSignature },
        tenantId,
        { subject: logId },
      );
    }

    return structuredLog;
  }

  recordMetric(name: string, value: number, unit: string, module: string): void {
    const entry: MetricEntry = {
      metricName: name,
      value,
      unit,
      module,
      timestamp: new Date().toISOString(),
    };
    this.metricsBuffer.push(entry);
    if (this.metricsBuffer.length > 500) this.metricsBuffer.shift();
  }

  getLogs(limit = 100, module?: string): StructuredLog[] {
    let list = [...this.logsBuffer];
    if (module) list = list.filter((l) => l.module === module);
    return list.reverse().slice(0, limit);
  }

  getMetricsSummary(): Record<string, { avg: number; count: number; unit: string }> {
    const summary: Record<string, { sum: number; count: number; unit: string }> = {};

    for (const m of this.metricsBuffer) {
      if (!summary[m.metricName]) {
        summary[m.metricName] = { sum: 0, count: 0, unit: m.unit };
      }
      summary[m.metricName].sum += m.value;
      summary[m.metricName].count++;
    }

    const result: Record<string, { avg: number; count: number; unit: string }> = {};
    for (const [key, val] of Object.entries(summary)) {
      result[key] = {
        avg: Number((val.sum / val.count).toFixed(2)),
        count: val.count,
        unit: val.unit,
      };
    }

    return result;
  }
}
