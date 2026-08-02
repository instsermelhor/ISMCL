import { Injectable, Logger } from '@nestjs/common';
import { RecordTelemetryDto, TelemetryType } from '../dto/enterprise-observability.dto';
import { ObservabilityAuditService } from './observability-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface TelemetryRecord {
  telemetryId: string;
  type: TelemetryType;
  name: string;
  serviceName: string;
  value: number;
  labels: Record<string, any>;
  traceId?: string;
  timestamp: string;
}

/**
 * TelemetryService — P173 EORP
 *
 * Coleta padronizada de telemetria compatível com OpenTelemetry (OTel).
 * Registra métricas, logs, traces, eventos e exceções correlacionáveis
 * por traceId em todos os microsserviços da Plataforma Aura.
 */
@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly telemetryStore: TelemetryRecord[] = [];

  constructor(
    private readonly auditSvc: ObservabilityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async recordTelemetry(dto: RecordTelemetryDto): Promise<TelemetryRecord> {
    const telemetryId = `OTEL-${dto.type}-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const record: TelemetryRecord = {
      telemetryId,
      type: dto.type,
      name: dto.name,
      serviceName: dto.serviceName,
      value: dto.value,
      labels: dto.labels ?? {},
      traceId: dto.traceId,
      timestamp,
    };

    this.telemetryStore.push(record);

    await this.eventBus.publish(
      'aura.eorp.telemetry.collected.v1',
      { telemetryId, type: dto.type, name: dto.name, serviceName: dto.serviceName, value: dto.value },
      'EORP',
      { subject: telemetryId },
    );

    return record;
  }

  getTelemetryByTrace(traceId: string): TelemetryRecord[] {
    return this.telemetryStore.filter((t) => t.traceId === traceId);
  }

  getRecentTelemetry(limit = 50): TelemetryRecord[] {
    return this.telemetryStore.slice(-limit).reverse();
  }
}
