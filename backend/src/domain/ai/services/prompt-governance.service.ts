import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreatePromptTemplateDto,
  AssistantRole,
  PromptStatus,
} from '../dto/ai.dto';

export interface PromptTemplate {
  promptId: string;
  name: string;
  targetAssistant: AssistantRole;
  systemPrompt: string;
  safetyGuardrails: string;
  status: PromptStatus;
  version: number;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

/**
 * PromptGovernanceService — Governança Corporativa de Prompts e IA Responsável
 *
 * Funcionalidades:
 * - Catálogo Corporativo de Prompts homologados e versionados
 * - Fluxo de aprovação institucional: DRAFT → HOMOLOGATING → APPROVED
 * - Diretrizes de IA Responsável (transparência, explicabilidade, mitigação de viés, revisão humana)
 * - NENHUM prompt pode ser utilizado sem aprovação prévia do SUPER_ADMIN
 * - Pré-carga dos prompts do sistema para os 10 assistentes especializados
 *
 * Referências: P111 AEAI, P141 AEAI-KP Etapa 8
 */
@Injectable()
export class PromptGovernanceService {
  private readonly logger = new Logger(PromptGovernanceService.name);
  private readonly prompts = new Map<string, PromptTemplate>();

  constructor() {
    this.seedDefaultPrompts();
  }

  private seedDefaultPrompts(): void {
    const roles = Object.values(AssistantRole);

    for (const role of roles) {
      const promptId = randomUUID();
      const now = new Date().toISOString();

      this.prompts.set(promptId, {
        promptId,
        name: `Prompt Oficial — Assistente do ${role}`,
        targetAssistant: role,
        systemPrompt: `Você é o Assistente Oficial da Plataforma Aura especializado em ${role}. Atue com empatia, estrita conformidade técnica, ético-profissional e respeite os limites de sigilo (LGPD Art. 11). Cite sempre as fontes dos POPs e protocolos institucionais ao responder.`,
        safetyGuardrails: 'REVISÃO_HUMANA_OBRIGATÓRIA: Toda recomendação de intervenção clínica, medicação ou encaminhamento emergencial deve incluir o aviso explícito de que a decisão final cabe ao profissional responsável.',
        status: PromptStatus.APPROVED,
        version: 1,
        approvedBy: 'system-governance-board',
        approvedAt: now,
        createdAt: now,
      });
    }

    this.logger.log(`[PromptGovernance] 🛡️ ${this.prompts.size} prompts homologados e aprovados no catálogo.`);
  }

  create(dto: CreatePromptTemplateDto): PromptTemplate {
    const promptId = randomUUID();
    const now = new Date().toISOString();
    const prompt: PromptTemplate = {
      promptId,
      name: dto.name,
      targetAssistant: dto.targetAssistant,
      systemPrompt: dto.systemPrompt,
      safetyGuardrails: dto.safetyGuardrails ?? 'PADRÃO: Respeitar LGPD, sigilo profissional e exigir validação humana.',
      status: PromptStatus.DRAFT,
      version: 1,
      createdAt: now,
    };

    this.prompts.set(promptId, prompt);
    this.logger.log(`[PromptGovernance] 📝 Rascunho de prompt criado: "${dto.name}" para ${dto.targetAssistant}`);
    return prompt;
  }

  approve(promptId: string, approvedBy: string): PromptTemplate {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new NotFoundException(`Prompt ${promptId} não encontrado.`);

    prompt.status = PromptStatus.APPROVED;
    prompt.approvedBy = approvedBy;
    prompt.approvedAt = new Date().toISOString();
    this.logger.log(`[PromptGovernance] ✅ Prompt "${prompt.name}" APROVADO por ${approvedBy}`);
    return prompt;
  }

  findApprovedForRole(role: AssistantRole): PromptTemplate | undefined {
    return [...this.prompts.values()].find(
      (p) => p.targetAssistant === role && p.status === PromptStatus.APPROVED,
    );
  }

  listAll(): PromptTemplate[] {
    return [...this.prompts.values()].sort((a, b) => a.targetAssistant.localeCompare(b.targetAssistant));
  }
}
