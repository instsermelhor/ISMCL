import { Injectable, Logger } from '@nestjs/common';
import { CreateDecisionRecommendationDto } from '../dto/decision-intelligence.dto';
import { DecisionRecommendationRecord, DecisionRecommendationService } from './decision-recommendation.service';
import { EvidenceManagementService } from './evidence-management.service';
import { ExplainableAiDecisionService } from './explainable-ai-decision.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { PrescriptiveAnalyticsService } from './prescriptive-analytics.service';
import { DecisionAuditService } from './decision-audit.service';

/**
 * DecisionIntelligenceService — Hub Central de Decision Intelligence (P159 ADIP)
 *
 * Orquestra o fluxo completo de apoio à decisão baseada em evidências:
 * 1. Consome dados de BI, Digital Twin (P157), EKIP (P158), AUOC (P156) e ACOP (P152)
 * 2. Anexa evidências rastreáveis e executa análises preditivas/prescritivas
 * 3. Gera relatório transparente de IA Explicável (XAI)
 * 4. Emite a recomendação prescrevendo a melhor alternativa com Human-in-the-Loop
 * 5. Registra o ciclo completo na trilha imutável SHA-256
 */
@Injectable()
export class DecisionIntelligenceService {
  private readonly logger = new Logger(DecisionIntelligenceService.name);

  constructor(
    private readonly recommendationService: DecisionRecommendationService,
    private readonly evidenceService: EvidenceManagementService,
    private readonly xaiService: ExplainableAiDecisionService,
    private readonly predictiveService: PredictiveAnalyticsService,
    private readonly prescriptiveService: PrescriptiveAnalyticsService,
    private readonly audit: DecisionAuditService,
  ) {}

  async processDecisionRequest(dto: CreateDecisionRecommendationDto): Promise<DecisionRecommendationRecord> {
    this.logger.log(`[DecisionIntelligenceHub] Processing decision request: "${dto.title}" (${dto.domain})`);

    // 1. Gera recomendação fundamentada com evidências e XAI
    const recommendation = await this.recommendationService.createRecommendation(dto);

    // 2. Executa análise preditiva associada
    await this.predictiveService.runPredictiveAnalysis({
      domain: dto.domain,
      timeHorizonMonths: 12,
    });

    // 3. Executa análise prescritiva com alternativas de trade-off
    await this.prescriptiveService.runPrescriptiveAnalysis({
      decisionContextId: recommendation.recommendationId,
      constraints: dto.constraints ?? {},
    });

    return recommendation;
  }
}
