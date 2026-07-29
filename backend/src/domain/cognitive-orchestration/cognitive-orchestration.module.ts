import { Module } from '@nestjs/common';
import { CognitiveOrchestrationController } from './controllers/cognitive-orchestration.controller';
import { CognitiveAuditService } from './services/cognitive-audit.service';
import { CognitiveMemoryService } from './services/cognitive-memory.service';
import { AIPerformanceMonitoringService } from './services/ai-performance-monitoring.service';
import { ModelRegistryLifecycleService } from './services/model-registry-lifecycle.service';
import { AITaskRoutingService } from './services/ai-task-routing.service';
import { AICollaborationService } from './services/ai-collaboration.service';
import { InstitutionalReasoningEngine } from './services/institutional-reasoning.service';
import { AutonomousRecommendationService } from './services/autonomous-recommendation.service';
import { EventBusService } from '../../core/event-bus/event-bus.service';

@Module({
  controllers: [CognitiveOrchestrationController],
  providers: [
    CognitiveAuditService,
    CognitiveMemoryService,
    AIPerformanceMonitoringService,
    ModelRegistryLifecycleService,
    AITaskRoutingService,
    AICollaborationService,
    InstitutionalReasoningEngine,
    AutonomousRecommendationService,
    EventBusService,
  ],
  exports: [
    CognitiveAuditService,
    CognitiveMemoryService,
    AIPerformanceMonitoringService,
    ModelRegistryLifecycleService,
    AITaskRoutingService,
    AICollaborationService,
    InstitutionalReasoningEngine,
    AutonomousRecommendationService,
  ],
})
export class CognitiveOrchestrationModule {}
