import { Injectable, Logger } from '@nestjs/common';
import {
  GenerateRecommendationDto,
  RecommendationCategory,
  RecommendationPriority,
  RecommendationStatus,
  ReviewRecommendationDto,
} from '../dto/autonomous-operations.dto';
import { ImprovementGovernanceService } from './improvement-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface OperationalRecommendation {
  recommendationId: string;
  title: string;
  category: RecommendationCategory;
  justification: string;
  priority: RecommendationPriority;
  expectedImpact: string;
  estimatedEffortHours: number;
  status: RecommendationStatus;
  suggestedLead: string;
  proposedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

/**
 * OperationalRecommendationService — Recomendações Operacionais Explicáveis (P164 AOCP)
 *
 * Gera recomendações sobre processos, arquitetura, desempenho, segurança, custos,
 * governança e IA com justificativa, evidências, impacto, esforço e responsáveis.
 */
@Injectable()
export class OperationalRecommendationService {
  private readonly logger = new Logger(OperationalRecommendationService.name);
  private recommendationStore: Map<string, OperationalRecommendation> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly governance: ImprovementGovernanceService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedRecommendations();
  }

  private seedRecommendations(): void {
    const seed: GenerateRecommendationDto = {
      title: 'Adoção de HTTP/2 Push para Assets do Portal do Beneficiário',
      category: RecommendationCategory.PERFORMANCE,
      justification: 'Primeira renderização do portal do beneficiário em conexões móveis 3G é de 3.2s',
      priority: RecommendationPriority.MEDIUM,
      expectedImpact: 'Redução do tempo de carregamento de 3.2s para 800ms',
      estimatedEffortHours: 8,
    };
    const id = `REC-${Date.now()}-SEED`;
    this.recommendationStore.set(id, {
      recommendationId: id,
      title: seed.title,
      category: seed.category,
      justification: seed.justification,
      priority: seed.priority,
      expectedImpact: seed.expectedImpact ?? 'Melhoria de performance',
      estimatedEffortHours: seed.estimatedEffortHours ?? 8,
      status: RecommendationStatus.PROPOSED,
      suggestedLead: 'Principal Frontend Architect',
      proposedAt: new Date().toISOString(),
    });
  }

  async generateRecommendation(dto: GenerateRecommendationDto): Promise<OperationalRecommendation> {
    const recommendationId = `REC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const rec: OperationalRecommendation = {
      recommendationId,
      title: dto.title,
      category: dto.category,
      justification: dto.justification,
      priority: dto.priority,
      expectedImpact: dto.expectedImpact ?? 'Otimização operacional',
      estimatedEffortHours: dto.estimatedEffortHours ?? 16,
      status: RecommendationStatus.PROPOSED,
      suggestedLead: 'Chief Enterprise Architect',
      proposedAt: new Date().toISOString(),
    };

    this.recommendationStore.set(recommendationId, rec);

    await this.governance.recordAudit('GENERATE_RECOMMENDATION', dto.title, 'CAIO', {
      recommendationId, category: dto.category, priority: dto.priority,
    });

    await this.eventBus.publish(
      'aura.operations.recommendation.generated.v1',
      { recommendationId, title: dto.title, category: dto.category, priority: dto.priority },
      this.SYSTEM_TENANT,
      { subject: recommendationId },
    );

    this.logger.log(`[OperationalRecommendation] Proposed: ${recommendationId} — ${dto.title}`);
    return rec;
  }

  async reviewRecommendation(dto: ReviewRecommendationDto): Promise<OperationalRecommendation | null> {
    const rec = this.recommendationStore.get(dto.recommendationId);
    if (!rec) return null;

    rec.status = dto.decision;
    rec.reviewedAt = new Date().toISOString();
    rec.reviewedBy = dto.reviewedBy;
    rec.reviewNotes = dto.reviewNotes;

    this.recommendationStore.set(dto.recommendationId, rec);

    await this.governance.recordAudit('REVIEW_RECOMMENDATION', rec.title, dto.reviewedBy, {
      recommendationId: dto.recommendationId, decision: dto.decision,
    });

    const eventName = dto.decision === RecommendationStatus.APPROVED
      ? 'aura.operations.governance.approval.granted.v1'
      : 'aura.operations.governance.approval.rejected.v1';

    await this.eventBus.publish(
      eventName,
      { recommendationId: dto.recommendationId, decision: dto.decision, reviewedBy: dto.reviewedBy },
      this.SYSTEM_TENANT,
      { subject: dto.recommendationId },
    );

    this.logger.log(`[OperationalRecommendation] Reviewed ${dto.recommendationId} → ${dto.decision}`);
    return rec;
  }

  listRecommendations(status?: RecommendationStatus): OperationalRecommendation[] {
    return Array.from(this.recommendationStore.values()).filter(
      (r) => !status || r.status === status,
    );
  }
}
