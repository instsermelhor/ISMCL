import { Injectable, Logger } from '@nestjs/common';
import { GenerateRecommendationDto, RecommendationCategory, RecommendationFeedbackDto } from '../dto/cognitive-orchestration.dto';
import { CognitiveAuditService } from './cognitive-audit.service';
import { CognitiveMemoryService } from './cognitive-memory.service';
import { AIPerformanceMonitoringService } from './ai-performance-monitoring.service';
import { EventBusService } from '../../../events/event-bus.service';

// ── INTERFACES ────────────────────────────────────────────────────────────────

export type RecommendationStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

export interface AutonomousRecommendation {
  recommendationId: string;
  tenantId?: string;
  targetEntityId?: string;
  category: RecommendationCategory;
  title: string;
  description?: string;
  rationale: string;
  evidence: string[];
  suggestedActions?: string[];
  estimatedImpact: string;
  confidenceLevel: number;
  confidenceScore?: number; // alias
  requiresHumanValidation: boolean;
  requiresHumanApproval: boolean; // alias
  status: RecommendationStatus;
  validatorUserId?: string;
  reviewedBy?: string; // alias
  reviewerComments?: string;
  createdAt: string;
  validatedAt?: string;
}

// ── SERVICE ───────────────────────────────────────────────────────────────────

/**
 * AutonomousRecommendationService — Recomendações Institucionais Autônomas (P152 ACOP)
 *
 * Gera, gerencia e processa recomendações inteligentes para o Instituto Ser Melhor,
 * cobrindo melhoria de processos, otimização operacional, recursos, capacitação,
 * riscos, segurança, qualidade assistencial e indicadores estratégicos.
 *
 * Toda recomendação contém: justificativa, evidências, impacto estimado,
 * nível de confiança e responsável pela validação (Human-in-the-Loop obrigatório).
 *
 * Referências: P112 (AEDIP), P152 (ACOP), ADR-152
 */
@Injectable()
export class AutonomousRecommendationService {
  private readonly logger = new Logger(AutonomousRecommendationService.name);
  private recommendationStore: Map<string, AutonomousRecommendation> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly memoryService: CognitiveMemoryService,
    private readonly performanceMonitoring: AIPerformanceMonitoringService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedInitialRecommendations();
  }

  private seedInitialRecommendations(): void {
    const initials: AutonomousRecommendation[] = [
      {
        recommendationId: 'REC-2026-0001',
        tenantId: this.SYSTEM_TENANT,
        category: RecommendationCategory.CARE_QUALITY,
        title: 'Readequação de carga de atendimento multiprofissional para casos críticos',
        description: 'Redistribuição de carga de trabalho para casos PHQ-9 > 20.',
        rationale: 'Casos com severidade alta apresentaram tempo médio de resposta 20% superior ao SLA.',
        evidence: ['BI Analytics KPI #CARE-09', 'EHR incidentes recentes', 'Série histórica Q2-2026'],
        suggestedActions: [
          'Implementar escalonamento automático para casos PHQ-9 > 20',
          'Notificar equipe multidisciplinar em até 2h',
          'Reservar slot emergencial na agenda de Psiquiatria',
        ],
        estimatedImpact: 'Redução de 25% no tempo de acolhimento inicial e melhoria de 15% nos indicadores de satisfação',
        confidenceLevel: 0.93,
        confidenceScore: 0.93,
        requiresHumanValidation: true,
        requiresHumanApproval: true,
        status: 'PROPOSED',
        createdAt: new Date().toISOString(),
      },
      {
        recommendationId: 'REC-2026-0002',
        tenantId: this.SYSTEM_TENANT,
        category: RecommendationCategory.OPERATIONAL_OPTIMIZATION,
        title: 'Alocação automática de salas virtuais de teleconsulta com 15 min de antecedência',
        description: 'Sistema de pré-alocação automática de salas LiveKit baseado em agenda.',
        rationale: 'Identificada latência na preparação de salas por profissionais de saúde.',
        evidence: ['Logs Teleconsulta Prompt 137', 'SLA SmartQueue', 'Análise de absenteísmo Q2-2026'],
        suggestedActions: [
          'Configurar trigger automático D-15min antes da consulta',
          'Enviar link de acesso por FCM e e-mail ao profissional',
          'Preparar ambiente de teleatendimento com prontuário pré-carregado',
        ],
        estimatedImpact: 'Eliminação de 90% dos atrasos no início de consultas e redução de 12% no absenteísmo',
        confidenceLevel: 0.96,
        confidenceScore: 0.96,
        requiresHumanValidation: true,
        requiresHumanApproval: true,
        status: 'PROPOSED',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const rec of initials) {
      this.recommendationStore.set(rec.recommendationId, rec);
    }
  }

  // ── Método principal P152 (assinatura do spec — objeto DTO) ────────────────

  /**
   * Gera uma recomendação institucional autônoma.
   * Compatível com a assinatura do spec P152 (aceita DTO objeto).
   */
  async generateRecommendation(dto: GenerateRecommendationDto): Promise<AutonomousRecommendation> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const recommendationId = `REC-${year}-${seq}`;

    const rec: AutonomousRecommendation = {
      recommendationId,
      tenantId: dto.tenantId,
      targetEntityId: dto.targetEntityId,
      category: dto.category,
      title: dto.title,
      description: dto.description,
      rationale: dto.description,
      evidence: dto.evidenceReferences ?? [],
      suggestedActions: dto.suggestedActions,
      estimatedImpact: `Impacto estimado com base em ${dto.evidenceReferences?.length ?? 0} referências de evidência.`,
      confidenceLevel: dto.confidenceScore,
      confidenceScore: dto.confidenceScore,
      requiresHumanValidation: true,
      requiresHumanApproval: true,
      status: 'PROPOSED',
      createdAt: new Date().toISOString(),
    };

    this.recommendationStore.set(recommendationId, rec);

    this.auditService.logAudit('RecommendationGenerated', 'GenerateRecommendation', {
      recommendationId,
      category: dto.category,
      title: dto.title,
      confidenceScore: dto.confidenceScore,
    });

    await this.eventBus.publish(
      'aura.cognitive.recommendation.generated.v1',
      { recommendationId, category: dto.category, title: dto.title, confidenceScore: dto.confidenceScore },
      dto.tenantId,
      { subject: recommendationId },
    );

    this.logger.log(`[AutonomousRec] Generated: ${recommendationId} (${dto.category} — confidence: ${dto.confidenceScore})`);
    return rec;
  }

  /**
   * Processa revisão humana de uma recomendação.
   * Compatível com a assinatura do spec P152.
   */
  async reviewRecommendation(
    recommendationId: string,
    reviewerId: string,
    approved: boolean,
    comments?: string,
  ): Promise<AutonomousRecommendation> {
    const rec = this.recommendationStore.get(recommendationId);
    if (!rec) {
      throw new Error(`Recomendação não encontrada: ${recommendationId}`);
    }

    rec.status = approved ? 'APPROVED' : 'REJECTED';
    rec.validatorUserId = reviewerId;
    rec.reviewedBy = reviewerId;
    rec.reviewerComments = comments;
    rec.validatedAt = new Date().toISOString();

    this.recommendationStore.set(recommendationId, rec);

    // Salva feedback na memória cognitiva para aprendizado contínuo
    this.memoryService.recordMemory(
      'HUMAN_FEEDBACK',
      `REC_FEEDBACK_${recommendationId}`,
      { approved, category: rec.category, comments, confidence: rec.confidenceLevel },
      rec.confidenceLevel,
    );

    // Atualiza métricas de performance
    this.performanceMonitoring.evaluateAgentPerformance('autonomous-recommendation-engine', 150, approved);

    const eventType = approved
      ? 'aura.cognitive.recommendation.approved.v1'
      : 'aura.cognitive.recommendation.rejected.v1';

    this.auditService.logAudit(
      approved ? 'RecommendationApproved' : 'RecommendationRejected',
      `Human review by ${reviewerId}`,
      { recommendationId, approved, comments },
      undefined,
      undefined,
      reviewerId,
    );

    await this.eventBus.publish(
      eventType,
      { recommendationId, approved, reviewerId, comments },
      rec.tenantId ?? this.SYSTEM_TENANT,
      { subject: recommendationId },
    );

    this.logger.log(`[AutonomousRec] Reviewed: ${recommendationId} → ${rec.status} by ${reviewerId}`);
    return rec;
  }

  /**
   * @deprecated Usar reviewRecommendation() — mantido para backward-compat.
   */
  processHumanFeedback(dto: RecommendationFeedbackDto): AutonomousRecommendation {
    const rec = this.recommendationStore.get(dto.recommendationId);
    if (!rec) {
      throw new Error(`Recomendação não encontrada: ${dto.recommendationId}`);
    }

    rec.status = dto.approved ? 'APPROVED' : 'REJECTED';
    rec.validatorUserId = dto.validatorUserId;
    rec.reviewedBy = dto.validatorUserId;
    rec.validatedAt = new Date().toISOString();

    this.recommendationStore.set(dto.recommendationId, rec);

    this.memoryService.recordMemory(
      'HUMAN_FEEDBACK',
      `REC_FEEDBACK_${rec.recommendationId}`,
      { approved: dto.approved, category: rec.category, comments: dto.comments },
      rec.confidenceLevel,
    );

    this.performanceMonitoring.evaluateAgentPerformance('autonomous-recommendation-engine', 150, dto.approved);

    const eventType = dto.approved
      ? 'aura.cognitive.recommendation.approved.v1'
      : 'aura.cognitive.recommendation.rejected.v1';

    this.auditService.logAudit(
      dto.approved ? 'RecommendationApproved' : 'RecommendationRejected',
      `Human feedback by ${dto.validatorUserId}`,
      { recommendationId: rec.recommendationId, approved: dto.approved, comments: dto.comments },
      undefined,
      undefined,
      dto.validatorUserId,
    );

    this.eventBus
      .publish(
        eventType,
        { recommendationId: rec.recommendationId, approved: dto.approved, validatorUserId: dto.validatorUserId },
        rec.tenantId ?? this.SYSTEM_TENANT,
      )
      .catch((e) => this.logger.error(e));

    return rec;
  }

  listRecommendations(category?: RecommendationCategory): AutonomousRecommendation[] {
    const all = Array.from(this.recommendationStore.values());
    return category ? all.filter((r) => r.category === category) : all;
  }

  getRecommendation(recommendationId: string): AutonomousRecommendation | undefined {
    return this.recommendationStore.get(recommendationId);
  }
}
