import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { AIAuditService } from './services/ai-audit.service';
import { AIGovernanceService } from './services/ai-governance.service';
import { AIRegistryService } from './services/ai-registry.service';
import { ModelOpsService } from './services/modelops.service';
import { LLMOpsService } from './services/llmops.service';
import { PromptGovernanceService } from './services/prompt-governance.service';
import { AIRiskManagementService } from './services/ai-risk-management.service';
import { AIExplainabilityService } from './services/ai-explainability.service';
import { AIEvaluationService } from './services/ai-evaluation.service';
import { CognitiveAgentGovernanceService } from './services/cognitive-agent-governance.service';

// Controller
import { EnterpriseAIGovernanceController } from './controllers/enterprise-ai-governance.controller';

/**
 * EnterpriseAIGovernanceModule — P175 EAIGP (Fase XXV)
 *
 * Plataforma Corporativa de Governança de IA, ModelOps, LLMOps
 * e Gestão de Agentes Cognitivos. Alinhada a ISO/IEC 42001, NIST AI RMF
 * e princípios de Responsible AI.
 *
 * Componentes:
 * - AIAuditService                    — Trilha imutável SHA-256
 * - AIGovernanceService               — Políticas de governança de IA
 * - AIRegistryService                 — Catálogo corporativo de ativos de IA
 * - ModelOpsService                   — Deploy/Rollback de modelos
 * - LLMOpsService                     — Configuração de LLMs (provider-agnostic)
 * - PromptGovernanceService           — Catálogo governado de prompts oficiais
 * - AIRiskManagementService           — Classificação e mitigação de riscos de IA
 * - AIExplainabilityService           — IA Explicável (XAI)
 * - AIEvaluationService               — Avaliação contínua (drift, hallucinations)
 * - CognitiveAgentGovernanceService   — Governança de agentes cognitivos
 */
@Module({
  imports: [EventBusModule],
  providers: [
    AIAuditService,
    AIGovernanceService,
    AIRegistryService,
    ModelOpsService,
    LLMOpsService,
    PromptGovernanceService,
    AIRiskManagementService,
    AIExplainabilityService,
    AIEvaluationService,
    CognitiveAgentGovernanceService,
  ],
  controllers: [EnterpriseAIGovernanceController],
  exports: [
    AIAuditService,
    AIGovernanceService,
    AIRegistryService,
    ModelOpsService,
    LLMOpsService,
    PromptGovernanceService,
    AIRiskManagementService,
    AIExplainabilityService,
    AIEvaluationService,
    CognitiveAgentGovernanceService,
  ],
})
export class EnterpriseAIGovernanceModule {}
