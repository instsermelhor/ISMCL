import { Injectable, Logger } from '@nestjs/common';
import { ActivateAutonomousAgentDto, AgentType } from '../dto/enterprise-hyperautomation.dto';
import { AutomationAuditService } from './automation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AgentInstance {
  agentId: string;
  agentType: AgentType;
  mission: string;
  status: 'IDLE' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED';
  permissions: Record<string, any>;
  actionsLog: AgentAction[];
  activatedAt: string;
}

export interface AgentAction {
  actionId: string;
  description: string;
  outcome: 'SUCCESS' | 'REQUIRES_HUMAN' | 'FAILED';
  executedAt: string;
}

/**
 * AutonomousAgentService — P174 EHCOP
 *
 * Catálogo e orquestrador de Agentes Autônomos Especializados da Plataforma Aura.
 * Cada agente possui escopo funcional definido, permissões mínimas (least privilege),
 * memória contextual opcional e registro integral de todas as ações executadas.
 * Disponíveis: Administrativo, Financeiro, Documental, Compliance, Atendimento,
 * Auditoria, Comunicação, Gestão de Casos e Analítico.
 */
@Injectable()
export class AutonomousAgentService {
  private readonly logger = new Logger(AutonomousAgentService.name);
  private readonly agents: Map<string, AgentInstance> = new Map();

  constructor(
    private readonly auditSvc: AutomationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async activateAgent(dto: ActivateAutonomousAgentDto, activatedBy: string): Promise<AgentInstance> {
    const agentId = `AGENT-${dto.agentType}-${Date.now().toString(36).toUpperCase()}`;

    const agent: AgentInstance = {
      agentId,
      agentType: dto.agentType,
      mission: dto.mission,
      status: 'ACTIVE',
      permissions: dto.permissions ?? { contextual_memory: false, max_actions: 10 },
      actionsLog: [],
      activatedAt: new Date().toISOString(),
    };

    this.agents.set(agentId, agent);

    await this.auditSvc.recordAudit('AUTONOMOUS_AGENT_ACTIVATED', agentId, activatedBy, {
      agentType: dto.agentType,
      mission: dto.mission,
      permissions: agent.permissions,
    });

    await this.eventBus.publish(
      'aura.ehcop.agent.activated.v1',
      { agentId, agentType: dto.agentType, mission: dto.mission },
      'EHCOP',
      { subject: agentId },
    );

    this.logger.log(`[AutonomousAgent] 🤖 Agente "${dto.agentType}" ativado: ${agentId} — Missão: "${dto.mission}"`);
    return agent;
  }

  async recordAgentAction(agentId: string, description: string, outcome: AgentAction['outcome']): Promise<AgentAction> {
    const agent = this.getOrThrow(agentId);
    const maxActions = agent.permissions['max_actions'] ?? 10;

    if (agent.actionsLog.length >= maxActions) {
      agent.status = 'SUSPENDED';
      throw new Error(`Agente "${agentId}" atingiu o limite de ${maxActions} ações e foi suspenso para revisão humana.`);
    }

    const action: AgentAction = {
      actionId: `ACT-${agentId}-${agent.actionsLog.length + 1}`,
      description,
      outcome,
      executedAt: new Date().toISOString(),
    };

    agent.actionsLog.push(action);
    await this.auditSvc.recordAudit('AGENT_ACTION_RECORDED', action.actionId, agentId, { description, outcome });
    return action;
  }

  getAgent(agentId: string): AgentInstance | undefined {
    return this.agents.get(agentId);
  }

  listAgents(type?: AgentType): AgentInstance[] {
    const all = Array.from(this.agents.values());
    return type ? all.filter((a) => a.agentType === type) : all;
  }

  private getOrThrow(agentId: string): AgentInstance {
    const a = this.agents.get(agentId);
    if (!a) throw new Error(`Agente "${agentId}" não encontrado.`);
    return a;
  }
}
