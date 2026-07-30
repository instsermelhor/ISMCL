import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { InstitutionalIntelligenceController } from './controllers/institutional-intelligence.controller';
import { InstitutionalIntelligenceService } from './services/institutional-intelligence.service';
import { DecisionIntelligenceService } from './services/decision-intelligence.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import { RecommendationEngineService } from './services/recommendation-engine.service';
import { InstitutionalKnowledgeGraphService } from './services/institutional-knowledge-graph.service';
import { AIGovernanceService } from './services/ai-governance.service';
import { ContinuousOptimizationService } from './services/continuous-optimization.service';

@Module({
  imports: [EventBusModule],
  controllers: [InstitutionalIntelligenceController],
  providers: [
    InstitutionalIntelligenceService,
    DecisionIntelligenceService,
    PredictiveAnalyticsService,
    RecommendationEngineService,
    InstitutionalKnowledgeGraphService,
    AIGovernanceService,
    ContinuousOptimizationService,
  ],
  exports: [
    InstitutionalIntelligenceService,
    DecisionIntelligenceService,
    PredictiveAnalyticsService,
    RecommendationEngineService,
    InstitutionalKnowledgeGraphService,
    AIGovernanceService,
    ContinuousOptimizationService,
  ],
})
export class InstitutionalIntelligenceModule {}
