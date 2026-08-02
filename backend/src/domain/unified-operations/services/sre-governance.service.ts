import { Injectable, Logger } from '@nestjs/common';
import { EvaluateSloDto, SloBreachType } from '../dto/unified-operations.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface SloEvaluationResult {
  evaluationId: string;
  serviceName: string;
  targetAvailabilityPercentage: number;
  currentAvailabilityPercentage: number;
  targetLatencyMs: number;
  currentAvgLatencyMs: number;
  errorBudgetPercentage: number;
  remainingErrorBudgetPercentage: number;
  isBreached: boolean;
  breachType?: SloBreachType;
  evaluatedAt: string;
}

export interface OperationalAuditEntry {
  auditId: string;
  logId: string;
  timestamp: string;
  componentName: string;
  actionName: string;
  details: Record<string, any>;
  sha256Signature: string;
}

/**
 * SreGovernanceService — Governança SRE & Trilhas Imutáveis de Operações (P156 AUOC)
 *
 * Monitora SLIs, SLOs, SLAs e Error Budgets de todos os microsserviços da Plataforma Aura.
 * Emite alertas ao estourar o Error Budget e registra auditoria imutável (SHA-256) de ações operacionais.
 */
@Injectable()
export class SreGovernanceService {
  private readonly logger = new Logger(SreGovernanceService.name);
  private auditTrail: OperationalAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async evaluateSlo(dto: EvaluateSloDto): Promise<SloEvaluationResult> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const evaluationId = `SLO-EVAL-${year}-${seq}`;

    // Simula telemetria de produção
    const currentAvailabilityPercentage = 99.82;
    const currentAvgLatencyMs = 210;
    const errorBudgetPercentage = 100 - dto.targetAvailabilityPercentage; // ex: 0.1%
    const currentErrorPercentage = 100 - currentAvailabilityPercentage; // ex: 0.18%
    const remainingErrorBudgetPercentage = Math.max(0, Math.round(((errorBudgetPercentage - currentErrorPercentage) / errorBudgetPercentage) * 100));

    const isBreached = currentAvailabilityPercentage < dto.targetAvailabilityPercentage;
    const breachType = isBreached ? SloBreachType.AVAILABILITY_DROPPED : undefined;

    const result: SloEvaluationResult = {
      evaluationId,
      serviceName: dto.serviceName,
      targetAvailabilityPercentage: dto.targetAvailabilityPercentage,
      currentAvailabilityPercentage,
      targetLatencyMs: dto.targetLatencyMs,
      currentAvgLatencyMs,
      errorBudgetPercentage,
      remainingErrorBudgetPercentage,
      isBreached,
      breachType,
      evaluatedAt: new Date().toISOString(),
    };

    if (isBreached) {
      await this.eventBus.publish(
        'aura.operations.slo.breached.v1',
        { evaluationId, serviceName: dto.serviceName, breachType, remainingErrorBudgetPercentage },
        this.SYSTEM_TENANT,
        { subject: evaluationId },
      );
    }

    this.logger.log(`[SreGovernance] Evaluated ${dto.serviceName} → SLO Breached: ${isBreached} (ErrorBudget: ${remainingErrorBudgetPercentage}%)`);
    return result;
  }

  async recordOperationalAudit(componentName: string, actionName: string, details: Record<string, any>): Promise<OperationalAuditEntry> {
    const timestamp = new Date().toISOString();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const year = new Date().getFullYear();
    const auditId = `AUD-OPS-${Date.now()}-${seq}`;
    const logId = `OPS-AUD-${year}-${seq}`;

    const payload = JSON.stringify({ logId, timestamp, componentName, actionName, details });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: OperationalAuditEntry = {
      auditId,
      logId,
      timestamp,
      componentName,
      actionName,
      details,
      sha256Signature,
    };

    this.auditTrail.push(entry);

    await this.eventBus.publish(
      'aura.operations.audit.completed.v1',
      { auditId, logId, componentName, actionName, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    return entry;
  }

  getAuditTrail(componentName?: string): OperationalAuditEntry[] {
    return componentName ? this.auditTrail.filter((a) => a.componentName === componentName) : [...this.auditTrail];
  }
}
