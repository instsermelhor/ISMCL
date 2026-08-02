import { Injectable, Logger } from '@nestjs/common';
import { RegisterPromptDto, PromptStatus } from '../dto/enterprise-ai-governance.dto';
import { AIAuditService } from './ai-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface PromptRecord {
  promptId: string;
  objective: string;
  content: string;
  version: string;
  author: string;
  compatibleModel?: string;
  restrictions: string[];
  status: PromptStatus;
  history: { version: string; updatedAt: string; updatedBy: string }[];
  registeredAt: string;
}

@Injectable()
export class PromptGovernanceService {
  private readonly logger = new Logger(PromptGovernanceService.name);
  private readonly prompts: Map<string, PromptRecord> = new Map();

  constructor(
    private readonly auditSvc: AIAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerPrompt(dto: RegisterPromptDto, registeredBy: string): Promise<PromptRecord> {
    const record: PromptRecord = {
      promptId: dto.promptId, objective: dto.objective, content: dto.content,
      version: dto.version, author: dto.author, compatibleModel: dto.compatibleModel,
      restrictions: dto.restrictions ?? [], status: PromptStatus.DRAFT,
      history: [{ version: dto.version, updatedAt: new Date().toISOString(), updatedBy: registeredBy }],
      registeredAt: new Date().toISOString(),
    };
    this.prompts.set(dto.promptId, record);
    await this.auditSvc.recordAudit('PROMPT_REGISTERED', dto.promptId, registeredBy, { version: dto.version });
    this.logger.log(`[PromptGovernance] Prompt registrado: "${dto.objective}" (${dto.promptId})`);
    return record;
  }

  async approvePrompt(promptId: string, approvedBy: string): Promise<PromptRecord> {
    const p = this.getOrThrow(promptId);
    p.status = PromptStatus.APPROVED;
    await this.auditSvc.recordAudit('PROMPT_APPROVED', promptId, approvedBy, { version: p.version });
    await this.eventBus.publish('aura.eaigp.prompt.approved.v1', { promptId, version: p.version }, 'EAIGP', { subject: promptId });
    return p;
  }

  async activatePrompt(promptId: string, activatedBy: string): Promise<PromptRecord> {
    const p = this.getOrThrow(promptId);
    if (p.status !== PromptStatus.APPROVED) throw new Error(`Prompt "${promptId}" deve estar APPROVED.`);
    p.status = PromptStatus.ACTIVE;
    await this.auditSvc.recordAudit('PROMPT_ACTIVATED', promptId, activatedBy, {});
    return p;
  }

  async updatePrompt(promptId: string, newContent: string, newVersion: string, updatedBy: string): Promise<PromptRecord> {
    const p = this.getOrThrow(promptId);
    p.content = newContent;
    p.version = newVersion;
    p.status = PromptStatus.PENDING_APPROVAL;
    p.history.push({ version: newVersion, updatedAt: new Date().toISOString(), updatedBy });
    await this.auditSvc.recordAudit('PROMPT_UPDATED', promptId, updatedBy, { newVersion });
    await this.eventBus.publish('aura.eaigp.prompt.updated.v1', { promptId, version: newVersion }, 'EAIGP', { subject: promptId });
    return p;
  }

  getPrompt(promptId: string): PromptRecord | undefined { return this.prompts.get(promptId); }
  listPrompts(status?: PromptStatus): PromptRecord[] {
    const all = Array.from(this.prompts.values());
    return status ? all.filter((p) => p.status === status) : all;
  }

  private getOrThrow(promptId: string): PromptRecord {
    const p = this.prompts.get(promptId);
    if (!p) throw new Error(`Prompt "${promptId}" não encontrado.`);
    return p;
  }
}
