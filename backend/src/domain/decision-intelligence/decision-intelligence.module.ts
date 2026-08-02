import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { DecisionAuditService } from './services/decision-audit.service';
import { EvidenceManagementService } from './services/evidence-management.service';
import { ExplainableAiDecisionService } from './services/explainable-ai-decision.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import { PrescriptiveAnalyticsService } from './services/prescriptive-analytics.service';
import { ExecutiveKpiIntelligenceService } from './services/executive-kpi-intelligence.service';
import { DecisionRecommendationService } from './services/decision-recommendation.service';
import { DecisionGovernanceService } from './services/decision-governance.service';
import { ExecutiveAnalyticsService } from './services/executive-analytics.service';
import { DecisionIntelligenceService } from './services/decision-intelligence.service';
import { DecisionIntelligenceController } from './controllers/decision-intelligence.controller';

/**
 * DecisionIntelligenceModule — Fase X · Prompt 159 (ADIP)
 *
 * Plataforma Corporativa de Inteligência para Apoio à Decisão, Gestão
 * Baseada em Evidências e Analytics Executivo da Plataforma Aura.
 * Composta por 10 microsserviços desacoplados com orientação a eventos (CloudEvents v1.0.3).
 */
@Module({
  imports: [EventBusModule],
  controllers: [DecisionIntelligenceController],
  providers: [
    DecisionAuditService,
    EvidenceManagementService,
    ExplainableAiDecisionService,
    PredictiveAnalyticsService,
    PrescriptiveAnalyticsService,
    ExecutiveKpiIntelligenceService,
    DecisionRecommendationService,
    DecisionGovernanceService,
    ExecutiveAnalyticsService,
    DecisionIntelligenceService,
  ],
  exports: [
    DecisionIntelligenceService,
    DecisionRecommendationService,
    DecisionGovernanceService,
    EvidenceManagementService,
    ExplainableAiDecisionService,
    PredictiveAnalyticsService,
    PrescriptiveAnalyticsService,
    ExecutiveKpiIntelligenceService,
    ExecutiveAnalyticsService,
    DecisionAuditService,
  ],
})
export class DecisionIntelligenceModule {}
