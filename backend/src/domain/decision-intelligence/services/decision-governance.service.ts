import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DecisionStatus, EvaluateDecisionDto } from '../dto/decision-intelligence.dto';
import { DecisionRecommendationRecord, DecisionRecommendationService } from './decision-recommendation.service';
import { DecisionAuditService } from './decision-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

/**
 * DecisionGovernanceService — Governança da Decisão Humana (P159 ADIP)
 *
 * Assegura que nenhuma recomendação automatizada substitua o julgamento humano em
 * processos críticos (Human-in-the-Loop). Controla aprovações, rejeições,
 * justificativas obrigatórias e exceções institucionais.
 */
@Injectable()
export class DecisionGovernanceService {
  private readonly logger = new Logger(DecisionGovernanceService.name);
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly recommendationService: DecisionRecommendationService,
    private readonly audit: DecisionAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async approveDecision(dto: EvaluateDecisionDto): Promise<DecisionRecommendationRecord> {
    const item = this.recommendationService.getRecommendation(dto.recommendationId);
    if (!item) throw new NotFoundException(`Recomendação não encontrada: ${dto.recommendationId}`);

    const updated: DecisionRecommendationRecord = {
      ...item,
      status: DecisionStatus.APPROVED,
      evaluatedBy: dto.evaluatedBy,
      evaluatedAt: new Date().toISOString(),
      evaluationJustification: dto.justification,
    };

    this.recommendationService.updateRecord(updated);

    await this.audit.recordDecisionAudit('APPROVE_DECISION', dto.recommendationId, dto.evaluatedBy, {
      selectedOptionId: dto.selectedOptionId, justification: dto.justification,
    });

    await this.eventBus.publish(
      'aura.decision.approved.v1',
      { recommendationId: dto.recommendationId, approvedBy: dto.evaluatedBy },
      this.SYSTEM_TENANT,
      { subject: dto.recommendationId },
    );

    this.logger.log(`[DecisionGovernance] Approved: ${dto.recommendationId} by ${dto.evaluatedBy}`);
    return updated;
  }

  async rejectDecision(dto: EvaluateDecisionDto): Promise<DecisionRecommendationRecord> {
    const item = this.recommendationService.getRecommendation(dto.recommendationId);
    if (!item) throw new NotFoundException(`Recomendação não encontrada: ${dto.recommendationId}`);

    const updated: DecisionRecommendationRecord = {
      ...item,
      status: DecisionStatus.REJECTED,
      evaluatedBy: dto.evaluatedBy,
      evaluatedAt: new Date().toISOString(),
      evaluationJustification: dto.justification,
    };

    this.recommendationService.updateRecord(updated);

    await this.audit.recordDecisionAudit('REJECT_DECISION', dto.recommendationId, dto.evaluatedBy, {
      justification: dto.justification,
    });

    await this.eventBus.publish(
      'aura.decision.rejected.v1',
      { recommendationId: dto.recommendationId, rejectedBy: dto.evaluatedBy },
      this.SYSTEM_TENANT,
      { subject: dto.recommendationId },
    );

    this.logger.log(`[DecisionGovernance] Rejected: ${dto.recommendationId} by ${dto.evaluatedBy}`);
    return updated;
  }
}
