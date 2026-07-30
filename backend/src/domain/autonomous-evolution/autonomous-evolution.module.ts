import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { CognitiveOrchestrationModule } from '../cognitive-orchestration/cognitive-orchestration.module';
import { ArchitectureGovernanceModule } from '../architecture-governance/architecture-governance.module';
import { AutonomousEvolutionController } from './controllers/autonomous-evolution.controller';
import { AutonomousEvolutionEngineService } from './services/autonomous-evolution-engine.service';
import { ContinuousImprovementService } from './services/continuous-improvement.service';
import { AdaptiveProcessOptimizationService } from './services/adaptive-process-optimization.service';
import { InnovationManagementService } from './services/innovation-management.service';
import { ChangeImpactAnalysisService } from './services/change-impact-analysis.service';
import { InstitutionalLearningService } from './services/institutional-learning.service';
import { StrategicRecommendationService } from './services/strategic-recommendation.service';
import { GovernanceApprovalService } from './services/governance-approval.service';
import { EvolutionKnowledgeBaseService } from './services/evolution-knowledge-base.service';
import { ContinuousEvolutionAuditService } from './services/continuous-evolution-audit.service';

/**
 * AutonomousEvolutionModule — Motor de Evolução Autônoma (P153 AAEE)
 *
 * Integra os 10 microsserviços da Fase IV do Projeto Aura:
 * 1. AutonomousEvolutionEngineService
 * 2. ContinuousImprovementService
 * 3. AdaptiveProcessOptimizationService
 * 4. InnovationManagementService
 * 5. ChangeImpactAnalysisService
 * 6. InstitutionalLearningService
 * 7. StrategicRecommendationService
 * 8. GovernanceApprovalService
 * 9. EvolutionKnowledgeBaseService
 * 10. ContinuousEvolutionAuditService
 *
 * Referências: P148 (AEAGO), P151 (AIIC), P152 (ACOP), P153 (AAEE), ADR-153
 */
@Module({
  imports: [
    EventBusModule,
    CognitiveOrchestrationModule,
    ArchitectureGovernanceModule,
  ],
  controllers: [AutonomousEvolutionController],
  providers: [
    AutonomousEvolutionEngineService,
    ContinuousImprovementService,
    AdaptiveProcessOptimizationService,
    InnovationManagementService,
    ChangeImpactAnalysisService,
    InstitutionalLearningService,
    StrategicRecommendationService,
    GovernanceApprovalService,
    EvolutionKnowledgeBaseService,
    ContinuousEvolutionAuditService,
  ],
  exports: [
    AutonomousEvolutionEngineService,
    ContinuousImprovementService,
    AdaptiveProcessOptimizationService,
    InnovationManagementService,
    ChangeImpactAnalysisService,
    InstitutionalLearningService,
    StrategicRecommendationService,
    GovernanceApprovalService,
    EvolutionKnowledgeBaseService,
    ContinuousEvolutionAuditService,
  ],
})
export class AutonomousEvolutionModule {}
