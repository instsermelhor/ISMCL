import { Injectable, Logger } from '@nestjs/common';
import { RecommendationCategory, RecommendationFeedbackDto } from '../dto/cognitive-orchestration.dto';
import { CognitiveAuditService } from './cognitive-audit.service';
import { CognitiveMemoryService } from './cognitive-memory.service';
import { AIPerformanceMonitoringService } from './ai-performance-monitoring.service';
import { EventBusService } from '../../../core/event-bus/event-bus.service';

export interface AutonomousRecommendation {
  recommendationId: string;
  category: RecommendationCategory;
  title: string;
  rationale: string;
  evidence: string[];
  estimatedImpact: string;
  confidenceLevel: number;
  requiresHumanValidation: boolean;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  validatorUserId?: string;
  createdAt: string;
  validatedAt?: string;
}

@Injectable()
export class AutonomousRecommendationService {
  private readonly logger = new Logger(AutonomousRecommendationService.name);
  private recommendationStore: Map<string, AutonomousRecommendation> = new Map();

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly memoryService: CognitiveMemoryService,
    private readonly performanceMonitoring: AIPerformanceMonitoringService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedInitialRecommendations();
  }

  private seedInitialRecommendations() {
    const initialRecs: AutonomousRecommendation[] = [
      {
        recommendationId: 'REC-2026-0001',
        category: RecommendationCategory.CARE_QUALITY,
        title: 'Readequação de carga de atendimento multiprofissional para casos críticos',
        rationale: 'Casos com severidade alta apresentaram tempo médio de resposta 20% superior ao SLA.',
        evidence: ['BI Analytics KPI #CARE-09', 'EHR incidentes recentes'],
        estimatedImpact: 'Redução de 25% no tempo de acolhimento inicial',
        confidenceLevel: 0.93,
        requiresHumanValidation: true,
        status: 'PROPOSED',
        createdAt: new Date().toISOString(),
      },
      {
        recommendationId: 'REC-2026-0002',
        category: RecommendationCategory.OPERATIONAL_OPTIMIZATION,
        title: 'Alocação automática de salas virtuais de teleconsulta com 15 min de antecedência',
        rationale: 'Identificada latência na preparação de salas por profissionais de saúde.',
        evidence: ['Logs Teleconsulta Prompt 137', 'SLA SmartQueue'],
        estimatedImpact: 'Eliminação de 90% dos atrasos no início de consultas',
        confidenceLevel: 0.96,
        requiresHumanValidation: true,
        status: 'PROPOSED',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const rec of initialRecs) {
      this.recommendationStore.set(rec.recommendationId, rec);
    }
  }

  generateRecommendation(
    category: RecommendationCategory,
    title: string,
    rationale: string,
    evidence: string[],
    estimatedImpact: string,
    confidenceLevel = 0.9,
  ): AutonomousRecommendation {
    const recommendationId = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const rec: AutonomousRecommendation = {
      recommendationId,
      category,
      title,
      rationale,
      evidence,
      estimatedImpact,
      confidenceLevel,
      requiresHumanValidation: true,
      status: 'PROPOSED',
      createdAt: new Date().toISOString(),
    };

    this.recommendationStore.set(recommendationId, rec);

    this.auditService.logAudit('RecommendationGenerated', 'GenerateRecommendation', { recommendationId, category, title, confidenceLevel });

    this.eventBus.publish({
      id: recommendationId,
      source: 'aura/cognitive-orchestration/recommendations',
      type: 'aura.cognitive.recommendation.generated.v1',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { recommendationId, category, title, confidenceLevel },
    });

    return rec;
  }

  processHumanFeedback(dto: RecommendationFeedbackDto): AutonomousRecommendation {
    const rec = this.recommendationStore.get(dto.recommendationId);
    if (!rec) {
      throw new Error(`Recomendação não encontrada: ${dto.recommendationId}`);
    }

    rec.status = dto.approved ? 'APPROVED' : 'REJECTED';
    rec.validatorUserId = dto.validatorUserId;
    rec.validatedAt = new Date().toISOString();

    this.recommendationStore.set(dto.recommendationId, rec);

    // Save feedback into Cognitive Memory
    this.memoryService.recordMemory(
      'HUMAN_FEEDBACK',
      `REC_FEEDBACK_${rec.recommendationId}`,
      { approved: dto.approved, category: rec.category, comments: dto.comments },
      rec.confidenceLevel,
    );

    // Evaluate performance feedback
    this.performanceMonitoring.evaluateAgentPerformance('autonomous-recommendation-engine', 150, dto.approved);

    const eventType = dto.approved ? 'aura.cognitive.recommendation.approved.v1' : 'aura.cognitive.recommendation.rejected.v1';

    this.auditService.logAudit(
      dto.approved ? 'RecommendationApproved' : 'RecommendationRejected',
      `Human feedback by ${dto.validatorUserId}`,
      { recommendationId: rec.recommendationId, approved: dto.approved, comments: dto.comments },
      undefined,
      undefined,
      dto.validatorUserId,
    );

    this.eventBus.publish({
      id: `EVT-REC-${Date.now()}`,
      source: 'aura/cognitive-orchestration/recommendations',
      type: eventType,
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { recommendationId: rec.recommendationId, approved: dto.approved, validatorUserId: dto.validatorUserId },
    });

    return rec;
  }

  listRecommendations(category?: RecommendationCategory): AutonomousRecommendation[] {
    const all = Array.from(this.recommendationStore.values());
    if (category) {
      return all.filter((r) => r.category === category);
    }
    return all;
  }

  getRecommendation(recommendationId: string): AutonomousRecommendation | undefined {
    return this.recommendationStore.get(recommendationId);
  }
}
