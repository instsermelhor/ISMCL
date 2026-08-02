import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { ImprovementGovernanceService } from './services/improvement-governance.service';
import { AIOperationsOrchestratorService } from './services/ai-operations-orchestrator.service';
import { MultiAgentCoordinationService } from './services/multi-agent-coordination.service';
import { ContinuousImprovementService } from './services/continuous-improvement.service';
import { OperationalRecommendationService } from './services/operational-recommendation.service';
import { AITaskDelegationService } from './services/ai-task-delegation.service';
import { OperationalOptimizationService } from './services/operational-optimization.service';
import { AIPerformanceMonitoringService } from './services/ai-performance-monitoring.service';
import { AutonomousAssistanceService } from './services/autonomous-assistance.service';
import { OperationalLearningService } from './services/operational-learning.service';

// Controller
import { AutonomousOperationsController } from './controllers/autonomous-operations.controller';

/**
 * AutonomousOperationsModule — Prompt 164 (AOCP)
 *
 * Autonomous Operations, AI Orchestration & Continuous Improvement Platform
 * (Fase XIV — Instituto Ser Melhor).
 *
 * Coordenador central de operações assistidas por IA, multiagentes e melhoria contínua.
 * Integra-se com: EnterpriseReadinessModule (P163), PlatformLifecycleModule (P162),
 * GovernanceComplianceModule (P161), MissionIntelligenceModule (P160).
 */
@Module({
  imports: [EventBusModule],
  controllers: [AutonomousOperationsController],
  providers: [
    ImprovementGovernanceService,
    AIOperationsOrchestratorService,
    MultiAgentCoordinationService,
    ContinuousImprovementService,
    OperationalRecommendationService,
    AITaskDelegationService,
    OperationalOptimizationService,
    AIPerformanceMonitoringService,
    AutonomousAssistanceService,
    OperationalLearningService,
  ],
  exports: [
    ImprovementGovernanceService,
    AIOperationsOrchestratorService,
    MultiAgentCoordinationService,
    OperationalRecommendationService,
    OperationalLearningService,
  ],
})
export class AutonomousOperationsModule {}
