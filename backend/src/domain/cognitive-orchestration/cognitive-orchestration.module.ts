import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { CognitiveOrchestrationController } from './controllers/cognitive-orchestration.controller';
import { CognitiveOrchestratorService } from './services/cognitive-orchestrator.service';
import { MultiAgentCoordinationService } from './services/multi-agent-coordination.service';
import { CognitiveAuditService } from './services/cognitive-audit.service';
import { CognitiveMemoryService } from './services/cognitive-memory.service';
import { AIPerformanceMonitoringService } from './services/ai-performance-monitoring.service';
import { ModelRegistryLifecycleService } from './services/model-registry-lifecycle.service';
import { AITaskRoutingService } from './services/ai-task-routing.service';
import { AICollaborationService } from './services/ai-collaboration.service';
import { InstitutionalReasoningEngine } from './services/institutional-reasoning.service';
import { AutonomousRecommendationService } from './services/autonomous-recommendation.service';

/**
 * CognitiveOrchestrationModule — Centro de Orquestração Cognitiva (P152 ACOP)
 *
 * Coordena todas as inteligências artificiais da plataforma Aura,
 * evitando decisões isoladas e garantindo uma visão sistêmica.
 *
 * Microsserviços implementados:
 * 1. CognitiveOrchestratorService     — Orquestrador Central
 * 2. MultiAgentCoordinationService    — Coordenação Multi-Agente (14 domínios)
 * 3. AITaskRoutingService             — Roteamento Inteligente de Tarefas
 * 4. InstitutionalReasoningEngine     — Motor de Raciocínio Institucional
 * 5. AutonomousRecommendationService  — Recomendações Autônomas
 * 6. ModelRegistryLifecycleService    — Gestão do Ciclo de Vida de Modelos
 * 7. AICollaborationService           — Colaboração Multi-Agente
 * 8. CognitiveMemoryService           — Memória Cognitiva Institucional
 * 9. AIPerformanceMonitoringService   — Monitoramento de Performance
 * 10. CognitiveAuditService           — Auditoria Cognitiva Imutável
 *
 * Referências: P111 (AEAIP), P112 (AEDIP), P152 (ACOP), ADR-152
 */
@Module({
  imports: [EventBusModule],
  controllers: [CognitiveOrchestrationController],
  providers: [
    // ── Serviços Centrais ──────────────────────────────────────────────────────
    CognitiveOrchestratorService,
    MultiAgentCoordinationService,

    // ── Serviços Especializados ────────────────────────────────────────────────
    CognitiveAuditService,
    CognitiveMemoryService,
    AIPerformanceMonitoringService,
    ModelRegistryLifecycleService,
    AITaskRoutingService,
    AICollaborationService,
    InstitutionalReasoningEngine,
    AutonomousRecommendationService,
  ],
  exports: [
    CognitiveOrchestratorService,
    MultiAgentCoordinationService,
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
