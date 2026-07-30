import { Injectable, Logger } from '@nestjs/common';
import { GenerateStrategicRecommendationDto, StrategicCategory } from '../dto/autonomous-evolution.dto';
import { ContinuousEvolutionAuditService } from './continuous-evolution-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface StrategicRecommendationRecord {
  recommendationId: string;
  tenantId: string;
  category: StrategicCategory;
  title: string;
  description: string;
  rationale: string;
  evidences: string[];
  expectedImpact: string;
  estimatedCostBrl: number;
  identifiedRisks: string[];
  requiresHumanReview: boolean;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'IN_IMPLEMENTATION';
  reviewerId?: string;
  reviewerComments?: string;
  generatedAt: string;
  reviewedAt?: string;
}

/**
 * StrategicRecommendationService — Recomendações Estratégicas Institucionais (P153 AAEE)
 *
 * Produz sugestões de alto nível alinhadas à visão estratégica do Instituto Ser Melhor:
 * - Expansão da Plataforma
 * - Novos Serviços e Módulos
 * - Modernização Tecnológica
 * - Eficiência Operacional
 * - Gestão de Pessoas e Capacitação
 * - Sustentabilidade Financeira
 * - Impacto Social Medível
 *
 * Cada recomendação contém: justificativa, evidências, benefícios, riscos, custo e impacto.
 */
@Injectable()
export class StrategicRecommendationService {
  private readonly logger = new Logger(StrategicRecommendationService.name);
  private recommendationRegistry: Map<string, StrategicRecommendationRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ContinuousEvolutionAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedRecommendations();
  }

  private seedRecommendations(): void {
    const seeds: StrategicRecommendationRecord[] = [
      {
        recommendationId: 'STR-REC-2026-0001',
        tenantId: this.SYSTEM_TENANT,
        category: StrategicCategory.TECHNOLOGY_MODERNIZATION,
        title: 'Adocão de Cluster Distribuído de Inferência para Agentes Especiais (ACOP)',
        description: 'Redução da dependência de provedores externos via implantação de modelos locais fine-tuned.',
        rationale: 'Análise de custos do Q2-2026 indicou aumento de 28% no consumo de tokens externos.',
        evidences: ['FinOps Telemetry Prompt 130', 'ACOP Performance Metrics Prompt 152'],
        expectedImpact: 'Redução de 45% nos custos operacionais com LLM e autonomia tecnológica completa.',
        estimatedCostBrl: 35000.00,
        identifiedRisks: ['Necessidade de infraestrutura com GPU dedicada local'],
        requiresHumanReview: true,
        status: 'PROPOSED',
        generatedAt: new Date().toISOString(),
      },
      {
        recommendationId: 'STR-REC-2026-0002',
        tenantId: this.SYSTEM_TENANT,
        category: StrategicCategory.SOCIAL_IMPACT,
        title: 'Módulo de Monitoramento de Impacto Social em Tempo Real',
        description: 'Dashboard público com métricas consolidadas de transformação social e acolhimentos.',
        rationale: 'Exigência de transparência institucional perante conselhos fiscais e doadores.',
        evidences: ['BI Institutional Intelligence Prompt 151', 'AGO Compliance Audit Prompt 148'],
        expectedImpact: 'Aumento de 60% na captação de recursos via transparência de impacto em tempo real.',
        estimatedCostBrl: 18000.00,
        identifiedRisks: ['Exposição indevida de dados (mitigado por anonimização estrita LGPD)'],
        requiresHumanReview: true,
        status: 'PROPOSED',
        generatedAt: new Date().toISOString(),
      },
    ];

    for (const rec of seeds) {
      this.recommendationRegistry.set(rec.recommendationId, rec);
    }
  }

  async generateStrategicRecommendation(
    dto: GenerateStrategicRecommendationDto,
  ): Promise<StrategicRecommendationRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const recommendationId = `STR-REC-${year}-${seq}`;

    const record: StrategicRecommendationRecord = {
      recommendationId,
      tenantId: dto.tenantId,
      category: dto.category,
      title: dto.title,
      description: dto.description,
      rationale: dto.rationale,
      evidences: dto.evidences,
      expectedImpact: dto.expectedImpact,
      estimatedCostBrl: dto.estimatedCostBrl,
      identifiedRisks: dto.identifiedRisks,
      requiresHumanReview: true,
      status: 'PROPOSED',
      generatedAt: new Date().toISOString(),
    };

    this.recommendationRegistry.set(recommendationId, record);

    await this.auditService.recordEvolutionAudit({
      componentName: 'strategic-recommendation',
      actionName: 'RecommendationGenerated',
      details: { recommendationId, title: dto.title, category: dto.category, cost: dto.estimatedCostBrl },
    });

    await this.eventBus.publish(
      'aura.evolution.strategic_recommendation.generated.v1',
      {
        recommendationId,
        category: dto.category,
        title: dto.title,
        expectedImpact: dto.expectedImpact,
        estimatedCostBrl: dto.estimatedCostBrl,
      },
      dto.tenantId,
      { subject: recommendationId },
    );

    this.logger.log(`[StrategicRecommendation] Generated: ${recommendationId} (${dto.category} :: ${dto.title})`);
    return record;
  }

  async reviewRecommendation(
    recommendationId: string,
    reviewerId: string,
    approved: boolean,
    comments?: string,
  ): Promise<StrategicRecommendationRecord> {
    const record = this.recommendationRegistry.get(recommendationId);
    if (!record) {
      throw new Error(`Recomendação estratégica não encontrada: ${recommendationId}`);
    }

    record.status = approved ? 'APPROVED' : 'REJECTED';
    record.reviewerId = reviewerId;
    record.reviewerComments = comments;
    record.reviewedAt = new Date().toISOString();

    await this.auditService.recordEvolutionAudit({
      componentName: 'strategic-recommendation',
      actionName: approved ? 'RecommendationApproved' : 'RecommendationRejected',
      details: { recommendationId, approved, reviewerId, comments },
      humanSupervisorId: reviewerId,
    });

    this.logger.log(`[StrategicRecommendation] Reviewed: ${recommendationId} → ${record.status} by ${reviewerId}`);
    return record;
  }

  listStrategicRecommendations(category?: StrategicCategory): StrategicRecommendationRecord[] {
    const all = Array.from(this.recommendationRegistry.values());
    return category ? all.filter((r) => r.category === category) : all;
  }
}
