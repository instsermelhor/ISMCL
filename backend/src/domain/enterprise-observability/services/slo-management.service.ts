import { Injectable, Logger } from '@nestjs/common';
import { DefineSloDto } from '../dto/enterprise-observability.dto';
import { ObservabilityAuditService } from './observability-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface SloStatusRecord {
  sloId: string;
  description: string;
  targetPercentage: number;
  currentPercentage: number;
  errorBudgetRemainingPercentage: number; // 0-100%
  errorBudgetStatus: 'HEALTHY' | 'WARNING' | 'EXHAUSTED';
  burnRate: number; // e.g. 1.0 = normal, 14.4 = 2% per hour
  windowDays: number;
  evaluatedAt: string;
}

/**
 * SLOManagementService — P173 EORP
 *
 * Gestão de Indicadores (SLI), Objetivos (SLO) e Error Budgets de Confiabilidade.
 * Calcula o consumo em tempo real do Error Budget, taxa de queima (Burn Rate)
 * e gera alertas automáticos antes do esgotamento do orçamento de erros.
 */
@Injectable()
export class SLOManagementService {
  private readonly logger = new Logger(SLOManagementService.name);
  private readonly slos: Map<string, SloStatusRecord> = new Map();

  constructor(
    private readonly auditSvc: ObservabilityAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.initDefaultSlos();
  }

  private initDefaultSlos(): void {
    const defaults: DefineSloDto[] = [
      { sloId: 'SLO-API-AVAILABILITY-99.9', description: 'Disponibilidade de APIs REST do Gateway', sliMetricName: 'http_requests_success_ratio', targetPercentage: 99.9, windowDays: 30 },
      { sloId: 'SLO-LATENCY-P95-200MS', description: 'Latência p95 das APIs abaixo de 200ms', sliMetricName: 'http_request_duration_seconds_p95', targetPercentage: 95.0, windowDays: 30 },
    ];

    defaults.forEach((d) => this.defineSloSync(d));
  }

  async defineSlo(dto: DefineSloDto, definedBy = 'SRE'): Promise<SloStatusRecord> {
    const record = this.defineSloSync(dto);

    await this.auditSvc.recordAudit('SLO_DEFINED', dto.sloId, definedBy, {
      targetPercentage: dto.targetPercentage,
      windowDays: dto.windowDays,
    });

    this.logger.log(`[SLOManagement] SLO definido "${dto.sloId}": Alvo ${dto.targetPercentage}%`);
    return record;
  }

  async evaluateSloStatus(sloId: string): Promise<SloStatusRecord> {
    const slo = this.getOrThrow(sloId);

    // Simula cálculo contínuo de SLI
    const currentPercentage = 99.95;
    const allowedDowntime = 100 - slo.targetPercentage;
    const actualDowntime = 100 - currentPercentage;
    const errorBudgetRemainingPercentage = Math.max(0, Math.round(((allowedDowntime - actualDowntime) / allowedDowntime) * 100));

    slo.currentPercentage = currentPercentage;
    slo.errorBudgetRemainingPercentage = errorBudgetRemainingPercentage;
    slo.errorBudgetStatus = errorBudgetRemainingPercentage > 20 ? 'HEALTHY' : errorBudgetRemainingPercentage > 0 ? 'WARNING' : 'EXHAUSTED';
    slo.burnRate = 0.8;
    slo.evaluatedAt = new Date().toISOString();

    await this.eventBus.publish(
      'aura.eorp.slo.calculated.v1',
      { sloId, currentPercentage, errorBudgetRemainingPercentage, status: slo.errorBudgetStatus },
      'EORP',
      { subject: sloId },
    );

    await this.eventBus.publish(
      'aura.eorp.error.budget.updated.v1',
      { sloId, remainingPercentage: errorBudgetRemainingPercentage },
      'EORP',
      { subject: sloId },
    );

    this.logger.log(`[SLOManagement] SLO "${sloId}" avaliado: ${currentPercentage}% (Error Budget Restante: ${errorBudgetRemainingPercentage}%)`);
    return slo;
  }

  getSlo(sloId: string): SloStatusRecord | undefined {
    return this.slos.get(sloId);
  }

  listSlos(): SloStatusRecord[] {
    return Array.from(this.slos.values());
  }

  private defineSloSync(dto: DefineSloDto): SloStatusRecord {
    const record: SloStatusRecord = {
      sloId: dto.sloId,
      description: dto.description,
      targetPercentage: dto.targetPercentage,
      currentPercentage: 99.99,
      errorBudgetRemainingPercentage: 100,
      errorBudgetStatus: 'HEALTHY',
      burnRate: 0.5,
      windowDays: dto.windowDays,
      evaluatedAt: new Date().toISOString(),
    };
    this.slos.set(dto.sloId, record);
    return record;
  }

  private getOrThrow(sloId: string): SloStatusRecord {
    const s = this.slos.get(sloId);
    if (!s) throw new Error(`SLO "${sloId}" não encontrado.`);
    return s;
  }
}
