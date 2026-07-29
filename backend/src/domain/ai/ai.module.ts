import { Module } from '@nestjs/common';
import { AiController } from './controllers/ai.controller';
import { AiGatewayService } from './services/ai-gateway.service';
import { RagKnowledgeService } from './services/rag-knowledge.service';
import { PromptGovernanceService } from './services/prompt-governance.service';
import { AiAssistantService } from './services/ai-assistant.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * AiModule — Plataforma Corporativa de Inteligência Artificial, Gestão do Conhecimento e RAG (AEAI-KP)
 *
 * Integra:
 * - AiGatewayService (AI Gateway unificado com fallback multi-provedor LLM)
 * - RagKnowledgeService (RAG + Banco Vetorial + Citação de Fontes Institucionais)
 * - PromptGovernanceService (Governança de Prompts, Homologação e IA Responsável)
 * - AiAssistantService (10 Assistentes Inteligentes Especializados)
 *
 * Referências: P111 AEAI, P115 AEDM, P141 AEAI-KP
 */
@Module({
  imports: [EventBusModule],
  controllers: [AiController],
  providers: [
    AiGatewayService,
    RagKnowledgeService,
    PromptGovernanceService,
    AiAssistantService,
  ],
  exports: [
    AiGatewayService,
    RagKnowledgeService,
    PromptGovernanceService,
    AiAssistantService,
  ],
})
export class AiModule {}
