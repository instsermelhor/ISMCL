import { Injectable, Logger } from '@nestjs/common';
import { AgentDomainRole, TaskPriority, RouteTaskDto } from '../dto/cognitive-orchestration.dto';
import { CognitiveAuditService } from './cognitive-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

// ── INTERFACES ────────────────────────────────────────────────────────────────

export interface DomainAgentStatus {
  agentId: string;
  domainRole: AgentDomainRole;
  capabilities: string[];
  currentLoad: number; // 0 to 10
  isAvailable: boolean;
  minAuthorizationLevel: number;
  avgLatencyMs: number;
  costPer1kTokensBrl: number;
}

export interface RoutingDecision {
  routingId: string;
  taskType: string;
  priority: TaskPriority;
  selectedModelId: string;
  selectedAgentId: string;
  estimatedLatencyMs: number;
  estimatedCostBrl: number;
  matchedCapabilities: string[];
  routedAt: string;
  rationale: string;
}

// ── SERVICE ───────────────────────────────────────────────────────────────────

/**
 * AITaskRoutingService — Roteamento Inteligente de Tarefas (P152 ACOP)
 *
 * Distribui automaticamente solicitações conforme especialidade, prioridade,
 * carga, disponibilidade, criticidade e nível de autorização.
 *
 * Referências: P110 (AEWPOP), P111 (AEAIP), P152 (ACOP)
 */
@Injectable()
export class AITaskRoutingService {
  private readonly logger = new Logger(AITaskRoutingService.name);
  private agentRegistry: Map<AgentDomainRole, DomainAgentStatus[]> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedAgents();
  }

  private seedAgents(): void {
    const agentConfigs: Partial<Record<AgentDomainRole, Partial<DomainAgentStatus>>> = {
      [AgentDomainRole.PSYCHOLOGY]: { avgLatencyMs: 180, costPer1kTokensBrl: 0.003, capabilities: ['tcc', 'phq9_scoring', 'anxiety_assessment'] },
      [AgentDomainRole.PSYCHIATRY]: { avgLatencyMs: 200, costPer1kTokensBrl: 0.004, capabilities: ['medication_review', 'psychiatric_evaluation', 'risk_assessment'] },
      [AgentDomainRole.SOCIAL_WORK]: { avgLatencyMs: 150, costPer1kTokensBrl: 0.002, capabilities: ['social_vulnerability', 'benefit_eligibility', 'family_assessment'] },
      [AgentDomainRole.LEGAL]: { avgLatencyMs: 220, costPer1kTokensBrl: 0.005, capabilities: ['legal_advice', 'contract_review', 'compliance_check'] },
      [AgentDomainRole.FINANCE]: { avgLatencyMs: 160, costPer1kTokensBrl: 0.003, capabilities: ['budget_analysis', 'cost_forecasting', 'financial_risk'] },
      [AgentDomainRole.HUMAN_RESOURCES]: { avgLatencyMs: 140, costPer1kTokensBrl: 0.002, capabilities: ['hr_onboarding', 'performance_review', 'training_recommendation'] },
      [AgentDomainRole.COMPLIANCE]: { avgLatencyMs: 190, costPer1kTokensBrl: 0.003, capabilities: ['lgpd_compliance', 'policy_audit', 'regulatory_check'] },
      [AgentDomainRole.AUDIT]: { avgLatencyMs: 210, costPer1kTokensBrl: 0.004, capabilities: ['audit_trail_analysis', 'anomaly_detection', 'evidence_collection'] },
      [AgentDomainRole.SECURITY]: { avgLatencyMs: 120, costPer1kTokensBrl: 0.003, capabilities: ['threat_detection', 'zero_trust_validation', 'incident_response'] },
      [AgentDomainRole.CASE_MANAGEMENT]: { avgLatencyMs: 170, costPer1kTokensBrl: 0.003, capabilities: ['case_routing', 'sla_management', 'multidisciplinary_coordination'] },
      [AgentDomainRole.BI_ANALYTICS]: { avgLatencyMs: 300, costPer1kTokensBrl: 0.005, capabilities: ['data_analysis', 'kpi_monitoring', 'trend_detection', 'clinical_summary'] },
      [AgentDomainRole.ECM_DOCUMENTS]: { avgLatencyMs: 130, costPer1kTokensBrl: 0.002, capabilities: ['document_classification', 'content_extraction', 'summarization'] },
      [AgentDomainRole.CORPORATE_UNIVERSITY]: { avgLatencyMs: 150, costPer1kTokensBrl: 0.002, capabilities: ['training_recommendation', 'skill_gap_analysis', 'learning_path'] },
      [AgentDomainRole.GOVERNANCE]: { avgLatencyMs: 200, costPer1kTokensBrl: 0.004, capabilities: ['governance_review', 'risk_scoring', 'policy_recommendation'] },
    };

    for (const role of Object.values(AgentDomainRole)) {
      const cfg = agentConfigs[role] || {};
      this.agentRegistry.set(role, [
        {
          agentId: `agent-${role.toLowerCase().replace(/_/g, '-')}-v1`,
          domainRole: role,
          capabilities: cfg.capabilities || ['general'],
          currentLoad: Math.floor(Math.random() * 3),
          isAvailable: true,
          minAuthorizationLevel: 1,
          avgLatencyMs: cfg.avgLatencyMs ?? 200,
          costPer1kTokensBrl: cfg.costPer1kTokensBrl ?? 0.003,
        },
      ]);
    }
  }

  // ── Método principal P152 (assinatura do spec) ──────────────────────────────

  /**
   * Roteia uma tarefa para o agente/modelo mais adequado.
   * Compatível com a assinatura do spec P152.
   */
  async routeTask(dto: RouteTaskDto): Promise<RoutingDecision> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const routingId = `RTE-${year}-${seq}`;

    // Encontrar agentes com as capabilities necessárias
    let bestAgent: DomainAgentStatus | null = null;
    let bestScore = -Infinity;

    for (const agents of this.agentRegistry.values()) {
      for (const agent of agents) {
        if (!agent.isAvailable || agent.currentLoad >= 8) continue;

        const capabilityMatch = dto.requiredCapabilities.filter((cap) =>
          agent.capabilities.includes(cap),
        ).length;

        if (capabilityMatch === 0 && dto.requiredCapabilities.length > 0) continue;

        const latencyOk = !dto.maxLatencyMs || agent.avgLatencyMs <= dto.maxLatencyMs;
        const costOk = !dto.maxCostBrl || agent.costPer1kTokensBrl * ((dto.contentLengthTokens ?? 1000) / 1000) <= dto.maxCostBrl;

        if (!latencyOk || !costOk) continue;

        // Score: capability match + load inversely proportional
        const score = capabilityMatch * 10 - agent.currentLoad * 2;
        if (score > bestScore) {
          bestScore = score;
          bestAgent = agent;
        }
      }
    }

    // Fallback: qualquer agente disponível
    if (!bestAgent) {
      for (const agents of this.agentRegistry.values()) {
        const available = agents.find((a) => a.isAvailable && a.currentLoad < 8);
        if (available) {
          bestAgent = available;
          break;
        }
      }
    }

    if (!bestAgent) {
      throw new Error('[AITaskRouting] Nenhum agente disponível para roteamento.');
    }

    bestAgent.currentLoad += 1;

    const decision: RoutingDecision = {
      routingId,
      taskType: dto.taskType,
      priority: dto.priority,
      selectedModelId: bestAgent.agentId,
      selectedAgentId: bestAgent.agentId,
      estimatedLatencyMs: bestAgent.avgLatencyMs,
      estimatedCostBrl: bestAgent.costPer1kTokensBrl * ((dto.contentLengthTokens ?? 1000) / 1000),
      matchedCapabilities: dto.requiredCapabilities.filter((cap) => bestAgent!.capabilities.includes(cap)),
      routedAt: new Date().toISOString(),
      rationale: `Agente ${bestAgent.agentId} selecionado por melhor score de capacidades (${bestScore}) e menor carga (${bestAgent.currentLoad}).`,
    };

    await this.eventBus.publish(
      'aura.cognitive.agent.selected.v1',
      { routingId, selectedAgentId: bestAgent.agentId, taskType: dto.taskType, priority: dto.priority },
      this.SYSTEM_TENANT,
      { subject: routingId },
    );

    this.logger.log(`[AITaskRouting] Task routed: ${routingId} → ${bestAgent.agentId}`);
    return decision;
  }

  // ── Métodos de compatibilidade com implementações anteriores ─────────────────

  /**
   * @deprecated Usar routeTask() — mantido para backward-compat.
   */
  selectOptimalAgents(domains: AgentDomainRole[], priority: TaskPriority): DomainAgentStatus[] {
    const selected: DomainAgentStatus[] = [];

    for (const domain of domains) {
      const agents = this.agentRegistry.get(domain) || [];
      const available = agents.filter((a) => a.isAvailable && a.currentLoad < 8);

      if (available.length > 0) {
        available.sort((a, b) => a.currentLoad - b.currentLoad);
        const chosen = available[0];
        chosen.currentLoad += 1;
        selected.push(chosen);
      }
    }

    this.logger.log(`[AITaskRouting] Selected ${selected.length} agents for domains: ${domains.join(', ')} (Priority: ${priority})`);

    for (const s of selected) {
      this.eventBus
        .publish(
          'aura.cognitive.agent.selected.v1',
          { agentId: s.agentId, domainRole: s.domainRole, priority },
          this.SYSTEM_TENANT,
        )
        .catch((e) => this.logger.error(e));
    }

    return selected;
  }

  releaseAgentLoad(agentId: string): void {
    for (const agents of this.agentRegistry.values()) {
      const agent = agents.find((a) => a.agentId === agentId);
      if (agent && agent.currentLoad > 0) {
        agent.currentLoad -= 1;
        break;
      }
    }
  }

  getAgentPoolStatus(): DomainAgentStatus[] {
    const pool: DomainAgentStatus[] = [];
    for (const agents of this.agentRegistry.values()) {
      pool.push(...agents);
    }
    return pool;
  }
}
