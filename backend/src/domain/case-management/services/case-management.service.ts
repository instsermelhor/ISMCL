import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  UpdateCaseStatusDto,
  EvaluateOutcomeDto,
  CloseCaseDto,
  CaseStatus,
} from '../dto/case-management.dto';
import { CaseTimelineService } from './case-timeline.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface OutcomeAssessment {
  caseId: string;
  clinicalEvolutionScore: number;
  psychosocialEvolutionScore: number;
  adherencePercentage: number;
  overallResolutivityScore: number;
  evaluatedAt: string;
}

export interface CaseClosureRecord {
  caseId: string;
  dischargeReason: string;
  finalSummary: string;
  closedAt: string;
}

/**
 * CaseManagementService — Gestão Longitudinal do Ciclo de Vida do Caso Assistencial
 *
 * Gerencia o acompanhamento completo:
 * - Alteração de status (ACTIVE, IN_REVIEW, ON_HOLD, CLOSED, REOPENED)
 * - Avaliação de Resultados (Resolutividade, Evolução Clínica e Psicossocial)
 * - Encerramento auditável e alta assistencial
 * - Reabertura de caso com linha do tempo contínua
 *
 * Referências: P110 (AEWBPM), P123 (AEDA), P135 (AECMP Etapas 8 e 9)
 */
@Injectable()
export class CaseManagementService {
  private readonly logger = new Logger(CaseManagementService.name);

  // Storage de avaliações e encerramentos
  private readonly outcomesStore = new Map<string, OutcomeAssessment>();
  private readonly closureStore = new Map<string, CaseClosureRecord>();

  constructor(
    private readonly timelineService: CaseTimelineService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Atualiza o status do caso assistencial.
   */
  async updateStatus(
    caseId: string,
    dto: UpdateCaseStatusDto,
    tenantId = 'default',
  ) {
    this.logger.log(`[CaseManagement] Caso ${caseId} alterado para status ${dto.status}`);

    await this.timelineService.addEntry(
      caseId,
      'STATUS_CHANGED',
      `Status do Caso alterado para ${dto.status}`,
      dto.justification,
    );

    await this.eventBus.publish(
      'aura.case.status.updated.v1',
      { caseId, status: dto.status, justification: dto.justification },
      tenantId,
      { subject: caseId },
    );

    return { caseId, status: dto.status, updatedAt: new Date().toISOString() };
  }

  /**
   * Avalia a resolutividade e os resultados do plano assistencial.
   */
  async evaluateOutcome(dto: EvaluateOutcomeDto, tenantId = 'default'): Promise<OutcomeAssessment> {
    const overallResolutivityScore = Math.round(
      dto.clinicalEvolutionScore * 0.4 +
        dto.psychosocialEvolutionScore * 0.4 +
        dto.adherencePercentage * 0.2,
    );

    const assessment: OutcomeAssessment = {
      caseId: dto.caseId,
      clinicalEvolutionScore: dto.clinicalEvolutionScore,
      psychosocialEvolutionScore: dto.psychosocialEvolutionScore,
      adherencePercentage: dto.adherencePercentage,
      overallResolutivityScore,
      evaluatedAt: new Date().toISOString(),
    };

    this.outcomesStore.set(dto.caseId, assessment);

    await this.timelineService.addEntry(
      dto.caseId,
      'OUTCOME_MEASURED',
      `Avaliação de Resultados: Score ${overallResolutivityScore}%`,
      `Evolução clínica: ${dto.clinicalEvolutionScore}%, Psicossocial: ${dto.psychosocialEvolutionScore}%, Adesão: ${dto.adherencePercentage}%.`,
    );

    await this.eventBus.publish(
      'aura.case.outcome.measured.v1',
      {
        caseId: dto.caseId,
        overallResolutivityScore,
        adherencePercentage: dto.adherencePercentage,
      },
      tenantId,
      { subject: dto.caseId },
    );

    return assessment;
  }

  /**
   * Encerra oficialmente o caso assistencial (Alta ou Arquivamento).
   */
  async closeCase(dto: CloseCaseDto, tenantId = 'default'): Promise<CaseClosureRecord> {
    const record: CaseClosureRecord = {
      caseId: dto.caseId,
      dischargeReason: dto.dischargeReason,
      finalSummary: dto.finalSummary,
      closedAt: new Date().toISOString(),
    };

    this.closureStore.set(dto.caseId, record);

    this.logger.log(
      `[CaseManagement] 🏁 Caso ${dto.caseId} ENCERRADO com sucesso! Motivo: ${dto.dischargeReason}`,
    );

    await this.timelineService.addEntry(
      dto.caseId,
      'CASE_CLOSED',
      `Caso Encerrado: ${dto.dischargeReason}`,
      dto.finalSummary,
    );

    await this.eventBus.publish(
      'aura.case.closed.v1',
      {
        caseId: dto.caseId,
        dischargeReason: dto.dischargeReason,
        closedAt: record.closedAt,
      },
      tenantId,
      { subject: dto.caseId },
    );

    return record;
  }

  /**
   * Reabre um caso previamente encerrado.
   */
  async reopenCase(caseId: string, reason: string, tenantId = 'default') {
    this.closureStore.delete(caseId);

    this.logger.warn(`[CaseManagement] 🔄 Caso ${caseId} REABERTO! Motivo: ${reason}`);

    await this.timelineService.addEntry(
      caseId,
      'CASE_REOPENED',
      'Caso Assistencial Reaberto',
      reason,
    );

    await this.eventBus.publish(
      'aura.case.reopened.v1',
      { caseId, reason },
      tenantId,
      { subject: caseId },
    );

    return { caseId, status: CaseStatus.ACTIVE, reopenedAt: new Date().toISOString() };
  }
}
