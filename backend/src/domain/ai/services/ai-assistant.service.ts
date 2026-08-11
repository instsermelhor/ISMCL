import { Injectable, Logger } from '@nestjs/common';
import {
  InvokeAssistantDto,
  AssistantRole,
  AIRiskClassification,
} from '../dto/ai.dto';
import { AiGatewayService } from './ai-gateway.service';
import { RagKnowledgeService } from './rag-knowledge.service';
import { PromptGovernanceService } from './prompt-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AssistantInvocationResponse {
  invocationId: string;
  assistantRole: AssistantRole;
  assistantName: string;
  responseContent: string;
  sourcesUsed: string[];
  riskClassification: AIRiskClassification;
  requiresHumanReview: boolean;
  provider: string;
  modelName: string;
  latencyMs: number;
  invokedAt: string;
}

const ASSISTANT_NAMES: Record<AssistantRole, string> = {
  [AssistantRole.BENEFICIARY]: 'Assistente Virtual do Beneficiário',
  [AssistantRole.PSYCHOLOGIST]: 'Assistente Especializado em Psicologia',
  [AssistantRole.PSYCHIATRIST]: 'Assistente Especializado em Psiquiatria',
  [AssistantRole.SOCIAL_WORKER]: 'Assistente de Serviço Social & Impacto',
  [AssistantRole.VOLUNTEER]: 'Assistente de Voluntariado',
  [AssistantRole.ADMINISTRATIVE]: 'Assistente Administrativo & Processos',
  [AssistantRole.FINANCIAL]: 'Assistente de Governança Financeira',
  [AssistantRole.LEGAL]: 'Assistente Jurídico Institucional & Compliance',
  [AssistantRole.EXECUTIVE]: 'Assistente Executivo da Diretoria',
  [AssistantRole.SUPER_ADMIN]: 'Assistente Global do Super Administrador',
};

/**
 * AiAssistantService — Serviço de Assistentes Inteligentes Especializados
 *
 * Funcionalidades:
 * - 10 Assistentes Especializados por papel de usuário no ecossistema Aura
 * - Integração completa: AI Gateway (LLMs) + RAG (Base de Conhecimento) + Prompt Governance
 * - Classificação de Risco de IA Responsável (LOW, MODERATE, HIGH, CRITICAL)
 * - Flag de `requiresHumanReview = true` para todas as recomendações clínicas/assistenciais
 * - Citação obrigatória de fontes institucionais
 * - Emissão de eventos CloudEvents `aura.ai.assistant.invoked.v1`
 *
 * Referências: P111 AEAI, P141 AEAI-KP Etapa 7
 */
@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly ragService: RagKnowledgeService,
    private readonly promptGov: PromptGovernanceService,
    private readonly eventBus: EventBusService,
  ) {}

  async invoke(dto: InvokeAssistantDto, userId: string, tenantId = 'default'): Promise<AssistantInvocationResponse> {
    const invocationId = `INV-${Date.now()}`;
    const invokedAt = new Date().toISOString();
    const assistantName = ASSISTANT_NAMES[dto.assistantRole] ?? 'Assistente Aura';

    // 1. Busca prompt homologado no Prompt Governance
    const promptTpl = this.promptGov.findApprovedForRole(dto.assistantRole);
    const systemPrompt = promptTpl?.systemPrompt ?? `Você é o ${assistantName}. Atue com ética, precisão e sigilo (LGPD Art. 11).`;

    // 2. Executa busca RAG se habilitada
    let sourcesUsed: string[] = [];
    let ragContext = '';

    const sanitizedPrompt = this.sanitizePii(dto.userPrompt);

    if (dto.enableRag !== false) {
      const ragResult = await this.ragService.queryRag({ query: sanitizedPrompt, topK: 2 }, tenantId);
      sourcesUsed = ragResult.sourcesUsed;
      if (sourcesUsed.length > 0) {
        ragContext = `\n\n[CONTEXTO DA BASE DE CONHECIMENTO INSTITUCIONAL]:\n${ragResult.synthesizedAnswer}`;
      }
    }

    // 3. Invoca AI Gateway com prompt sanitizado
    const llmResp = await this.aiGateway.generateCompletion({
      systemPrompt: `${systemPrompt}${ragContext}`,
      userPrompt: sanitizedPrompt,
    });

    // 4. Classificação de Risco e IA Responsável
    const isClinicalOrLegal = [
      AssistantRole.PSYCHOLOGIST,
      AssistantRole.PSYCHIATRIST,
      AssistantRole.SOCIAL_WORKER,
      AssistantRole.LEGAL,
    ].includes(dto.assistantRole);

    const riskClassification = isClinicalOrLegal ? AIRiskClassification.HIGH : AIRiskClassification.LOW;
    const requiresHumanReview = isClinicalOrLegal;

    let finalContent = llmResp.content;
    if (requiresHumanReview) {
      finalContent += '\n\n⚠️ *Aviso de IA Responsável: Esta recomendação foi gerada por assistente de inteligência artificial e EXIGE validação prévia do profissional responsável antes de qualquer aplicação clínica/assistencial.*';
    }

    const response: AssistantInvocationResponse = {
      invocationId,
      assistantRole: dto.assistantRole,
      assistantName,
      responseContent: finalContent,
      sourcesUsed,
      riskClassification,
      requiresHumanReview,
      provider: `${llmResp.provider} (${llmResp.modelName})`,
      modelName: llmResp.modelName,
      latencyMs: llmResp.latencyMs,
      invokedAt,
    };

    this.logger.log(`[AiAssistant] 💬 ${assistantName} invocado por ${userId} | Risco: ${riskClassification} | Latência: ${llmResp.latencyMs}ms`);

    await this.eventBus.publish(
      'aura.ai.assistant.invoked.v1',
      { invocationId, assistantRole: dto.assistantRole, userId, riskClassification, sourcesCount: sourcesUsed.length },
      tenantId,
      { subject: invocationId },
    );

    return response;
  }

  /**
   * Desidentifica informações pessoais sensíveis (PII / PHI) antes de enviar ao gateway LLM.
   * Mascara CPFs, E-mails e Telefones.
   */
  sanitizePii(text: string): string {
    if (!text) return text;
    return text
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF_DESIDENTIFICADO]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL_DESIDENTIFICADO]')
      .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, '[TELEFONE_DESIDENTIFICADO]');
  }
}

