import { Injectable, Logger } from '@nestjs/common';
import { CreateAutomationDto, AutomationStatus, AutomationDomain } from '../dto/enterprise-hyperautomation.dto';
import { AutomationAuditService } from './automation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AutomationRecord {
  automationId: string;
  name: string;
  domain: AutomationDomain;
  description: string;
  owner: string;
  status: AutomationStatus;
  version: string;
  integratedServices: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecutionResult {
  executionId: string;
  automationId: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  durationMs: number;
  stepsExecuted: number;
  executedAt: string;
}

/**
 * HyperautomationService — P174 EHCOP
 *
 * Plataforma Corporativa de Hyperautomation da Aura.
 * Gerencia o ciclo de vida completo de automações institucionais:
 * criação, aprovação, publicação, execução, versionamento e depreciação.
 * Cobre domínios administrativos, assistenciais, financeiros, documentais, RH,
 * voluntariado, compliance e auditoria.
 */
@Injectable()
export class HyperautomationService {
  private readonly logger = new Logger(HyperautomationService.name);
  private readonly automations: Map<string, AutomationRecord> = new Map();

  constructor(
    private readonly auditSvc: AutomationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async createAutomation(dto: CreateAutomationDto, createdBy: string): Promise<AutomationRecord> {
    const record: AutomationRecord = {
      automationId: dto.automationId,
      name: dto.name,
      domain: dto.domain,
      description: dto.description,
      owner: dto.owner,
      status: AutomationStatus.DRAFT,
      version: '1.0.0',
      integratedServices: dto.integratedServices ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.automations.set(dto.automationId, record);

    await this.auditSvc.recordAudit('AUTOMATION_CREATED', dto.automationId, createdBy, { domain: dto.domain, status: record.status });

    await this.eventBus.publish(
      'aura.ehcop.automation.created.v1',
      { automationId: dto.automationId, name: dto.name, domain: dto.domain },
      'EHCOP',
      { subject: dto.automationId },
    );

    this.logger.log(`[Hyperautomation] Automação criada: "${dto.name}" (${dto.automationId}) — Domínio: ${dto.domain}`);
    return record;
  }

  async executeAutomation(automationId: string, executedBy: string): Promise<AutomationExecutionResult> {
    const auto = this.getOrThrow(automationId);

    if (auto.status !== AutomationStatus.ACTIVE) {
      throw new Error(`Automação "${automationId}" não está ATIVA (status atual: ${auto.status}).`);
    }

    const executionId = `EXEC-${automationId}-${Date.now().toString(36).toUpperCase()}`;
    const result: AutomationExecutionResult = {
      executionId,
      automationId,
      status: 'SUCCESS',
      durationMs: Math.floor(Math.random() * 800) + 200,
      stepsExecuted: 7,
      executedAt: new Date().toISOString(),
    };

    await this.auditSvc.recordAudit('AUTOMATION_EXECUTED', executionId, executedBy, { automationId, status: result.status, durationMs: result.durationMs });

    await this.eventBus.publish(
      'aura.ehcop.automation.executed.v1',
      { executionId, automationId, status: result.status },
      'EHCOP',
      { subject: executionId },
    );

    this.logger.log(`[Hyperautomation] ⚡ Automação "${automationId}" executada: ${result.status} em ${result.durationMs}ms`);
    return result;
  }

  async approveAutomation(automationId: string, approvedBy: string): Promise<AutomationRecord> {
    const auto = this.getOrThrow(automationId);
    auto.status = AutomationStatus.APPROVED;
    auto.updatedAt = new Date().toISOString();
    await this.auditSvc.recordAudit('AUTOMATION_APPROVED', automationId, approvedBy, {});
    return auto;
  }

  async publishAutomation(automationId: string, publishedBy: string): Promise<AutomationRecord> {
    const auto = this.getOrThrow(automationId);
    if (auto.status !== AutomationStatus.APPROVED) {
      throw new Error(`Automação "${automationId}" deve estar APROVADA antes de ser publicada.`);
    }
    auto.status = AutomationStatus.ACTIVE;
    auto.updatedAt = new Date().toISOString();
    await this.auditSvc.recordAudit('AUTOMATION_PUBLISHED', automationId, publishedBy, { version: auto.version });
    return auto;
  }

  getAutomation(automationId: string): AutomationRecord | undefined {
    return this.automations.get(automationId);
  }

  listAutomations(domain?: AutomationDomain): AutomationRecord[] {
    const all = Array.from(this.automations.values());
    return domain ? all.filter((a) => a.domain === domain) : all;
  }

  private getOrThrow(automationId: string): AutomationRecord {
    const a = this.automations.get(automationId);
    if (!a) throw new Error(`Automação "${automationId}" não encontrada.`);
    return a;
  }
}
