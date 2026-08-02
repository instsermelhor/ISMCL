import { Injectable, Logger } from '@nestjs/common';
import { CollectTelemetryDto } from '../dto/unified-operations.dto';
import { SreGovernanceService } from './sre-governance.service';

export interface TelemetryRecord extends CollectTelemetryDto {
  telemetryId: string;
  timestamp: string;
}

export interface CorrelatedTelemetryContext {
  contextId: string;
  serviceName: string;
  logsCount: number;
  metricsCount: number;
  tracesCount: number;
  eventsCount: number;
  correlatedAt: string;
}

/**
 * EnterpriseObservabilityService — Coleta & Correlação de Observabilidade (P156 AUOC)
 *
 * Coleta e agrega em tempo real Logs, Métricas (Prometheus), Traces Distribuídos (OpenTelemetry/Jaeger)
 * e Telemetria de Negócio de todos os microsserviços. Correlaciona evidências automaticamente.
 */
@Injectable()
export class EnterpriseObservabilityService {
  private readonly logger = new Logger(EnterpriseObservabilityService.name);
  private telemetryStore: TelemetryRecord[] = [];

  constructor(private readonly sreGovernance: SreGovernanceService) {}

  async collectTelemetry(dto: CollectTelemetryDto): Promise<TelemetryRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const telemetryId = `TEL-${year}-${seq}`;

    const record: TelemetryRecord = {
      ...dto,
      telemetryId,
      timestamp: new Date().toISOString(),
    };

    this.telemetryStore.push(record);
    if (this.telemetryStore.length > 500) {
      this.telemetryStore.shift(); // Mantém janela deslizante
    }

    await this.sreGovernance.recordOperationalAudit('enterprise-observability', 'TelemetryCollected', {
      telemetryId,
      serviceName: dto.serviceName,
      type: dto.telemetryType,
      value: dto.value,
    });

    this.logger.debug(`[EnterpriseObservability] Ingested ${dto.telemetryType} from ${dto.serviceName}: ${dto.name}=${dto.value}`);
    return record;
  }

  getCorrelatedContext(serviceName: string): CorrelatedTelemetryContext {
    const records = this.telemetryStore.filter((t) => t.serviceName === serviceName);
    const logsCount = records.filter((t) => t.telemetryType === 'log').length;
    const metricsCount = records.filter((t) => t.telemetryType === 'metric').length;
    const tracesCount = records.filter((t) => t.telemetryType === 'trace').length;
    const eventsCount = records.filter((t) => t.telemetryType === 'event').length;

    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 6).toUpperCase();

    return {
      contextId: `CTX-${year}-${seq}`,
      serviceName,
      logsCount,
      metricsCount,
      tracesCount,
      eventsCount,
      correlatedAt: new Date().toISOString(),
    };
  }

  queryTelemetry(serviceName?: string, type?: CollectTelemetryDto['telemetryType']): TelemetryRecord[] {
    return this.telemetryStore.filter((t) => {
      const matchService = !serviceName || t.serviceName === serviceName;
      const matchType = !type || t.telemetryType === type;
      return matchService && matchType;
    });
  }
}
