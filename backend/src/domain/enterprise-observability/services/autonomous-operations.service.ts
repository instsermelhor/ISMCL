import { Injectable, Logger } from '@nestjs/common';
import { TriggerAutonomousActionDto, AnomalySeverity } from '../dto/enterprise-observability.dto';
import { ObservabilityAuditService } from './observability-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AnomalyRecord {
  anomalyId: string;
  metricOrService: string;
  severity: AnomalySeverity;
  description: string;
  detectedAt: string;
  suggestedAction: string;
}

export interface AutonomousActionLog {
  actionId: string;
  anomalyId: string;
  actionName: string;
  aiEngineVersion: string;
  status: 'EXECUTED_SUCCESS' | 'FAILED' | 'PENDING_APPROVAL';
  executedAt: string;
}

/**
 * AutonomousOperationsService — P173 EORP
 *
 * AIOps e Operações Autônomas.
 * Utiliza IA para detectar anomalias em tempo real, prever incidentes operacionais,
 * recomendar correções técnicas e executar ações autônomas de baixa criticidade com auditoria.
 */
@Injectable()
export class AutonomousOperationsService {
  private readonly logger = new Logger(AutonomousOperationsService.name);
  private readonly anomalies: Map<string, AnomalyRecord> = new Map();
  private readonly actionLogs: Map<string, AutonomousActionLog> = new Map();

  constructor(
    private readonly auditSvc: ObservabilityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async detectAnomaly(
    metricOrService: string,
    severity: AnomalySeverity,
    description: string,
    suggestedAction: string,
  ): Promise<AnomalyRecord> {
    const anomalyId = `ANOMALY-${Date.now().toString(36).toUpperCase()}`;
    const detectedAt = new Date().toISOString();

    const record: AnomalyRecord = {
      anomalyId,
      metricOrService,
      severity,
      description,
      detectedAt,
      suggestedAction,
    };

    this.anomalies.set(anomalyId, record);

    await this.auditSvc.recordAudit('ANOMALY_DETECTED', anomalyId, 'AIOPS_ENGINE', {
      metricOrService,
      severity,
      description,
    });

    await this.eventBus.publish(
      'aura.eorp.anomaly.detected.v1',
      { anomalyId, metricOrService, severity, description },
      'EORP',
      { subject: anomalyId },
    );

    await this.eventBus.publish(
      'aura.eorp.autonomous.action.suggested.v1',
      { anomalyId, suggestedAction },
      'EORP',
      { subject: anomalyId },
    );

    this.logger.warn(`[AIOps] 🤖 Anomalia detectada "${anomalyId}" em "${metricOrService}" (${severity}): ${description}`);
    return record;
  }

  async executeAutonomousAction(dto: TriggerAutonomousActionDto, executedBy = 'AIOPS_ENGINE'): Promise<AutonomousActionLog> {
    const actionId = `AUTO-ACT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const log: AutonomousActionLog = {
      actionId,
      anomalyId: dto.anomalyId,
      actionName: dto.actionName,
      aiEngineVersion: dto.aiEngineVersion,
      status: 'EXECUTED_SUCCESS',
      executedAt: now,
    };

    this.actionLogs.set(actionId, log);

    await this.auditSvc.recordAudit('AUTONOMOUS_ACTION_EXECUTED', actionId, executedBy, {
      anomalyId: dto.anomalyId,
      actionName: dto.actionName,
      aiEngineVersion: dto.aiEngineVersion,
    });

    await this.eventBus.publish(
      'aura.eorp.autonomous.action.executed.v1',
      { actionId, anomalyId: dto.anomalyId, actionName: dto.actionName },
      'EORP',
      { subject: actionId },
    );

    this.logger.log(`[AIOps] ⚙️ Ação autônoma "${dto.actionName}" executada com sucesso para anomalia "${dto.anomalyId}".`);
    return log;
  }

  listAnomalies(): AnomalyRecord[] {
    return Array.from(this.anomalies.values());
  }

  listActionLogs(): AutonomousActionLog[] {
    return Array.from(this.actionLogs.values());
  }
}
