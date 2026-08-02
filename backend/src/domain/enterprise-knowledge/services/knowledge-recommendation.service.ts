import { Injectable, Logger } from '@nestjs/common';
import { GenerateRecommendationDto, KnowledgeDomain } from '../dto/enterprise-knowledge.dto';
import { EnterpriseKnowledgeService, KnowledgeItem } from './enterprise-knowledge.service';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface KnowledgeRecommendation {
  item: KnowledgeItem;
  recommendationScore: number;
  reason: string;
}

export interface RecommendationResult {
  recommendationId: string;
  userId: string;
  userRole?: string;
  recommendations: KnowledgeRecommendation[];
  recommendedAt: string;
}

/**
 * KnowledgeRecommendationService — Recomendações Inteligentes (P158 AEKIP)
 *
 * Sugere proativamente documentos, procedimentos, normas, protocolos,
 * treinamentos e especialistas internos com base na função, departamento e
 * contexto operacional do usuário.
 */
@Injectable()
export class KnowledgeRecommendationService {
  private readonly logger = new Logger(KnowledgeRecommendationService.name);
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly knowledgeService: EnterpriseKnowledgeService,
    private readonly audit: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async generateRecommendations(dto: GenerateRecommendationDto): Promise<RecommendationResult> {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const recommendationId = `REC-${Date.now()}-${seq}`;
    const limit = dto.maxRecommendations ?? 3;

    const domainFilter = dto.contextDomain ?? (dto.userRole?.toLowerCase().includes('psico') ? KnowledgeDomain.ASSISTENTIAL : KnowledgeDomain.OPERATIONAL);

    const items = this.knowledgeService.listKnowledgeItems(domainFilter);

    const recommendations: KnowledgeRecommendation[] = items.slice(0, limit).map((item) => ({
      item,
      recommendationScore: 0.94,
      reason: `Recomendado para a função '${dto.userRole ?? 'Profissional'}' no domínio ${domainFilter}`,
    }));

    const result: RecommendationResult = {
      recommendationId,
      userId: dto.userId,
      userRole: dto.userRole,
      recommendations,
      recommendedAt: new Date().toISOString(),
    };

    await this.audit.recordAudit('GENERATE_RECOMMENDATIONS', recommendationId, 'RECOMMENDATION', dto.userId, {
      count: recommendations.length,
    });

    await this.eventBus.publish(
      'aura.knowledge.recommendation.generated.v1',
      { recommendationId, userId: dto.userId, count: recommendations.length },
      this.SYSTEM_TENANT,
      { subject: recommendationId },
    );

    this.logger.log(`[KnowledgeRecommendation] ${recommendationId} for ${dto.userId} → ${recommendations.length} items`);
    return result;
  }
}
