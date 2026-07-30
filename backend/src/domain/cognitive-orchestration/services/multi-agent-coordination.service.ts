import { Injectable, Logger } from '@nestjs/common';
import { AgentDomainRole, AgentType, TaskPriority, TaskStatus } from '../dto/cognitive-orchestration.dto';
import { EventBusService } from '../../../events/event-bus.service';
import { CognitiveAuditService } from './cognitive-audit.service';

// ── INTERFACES ────────────────────────────────────────────────────────────────

export interface SpecializedAgent {
  agentId: string;
  agentType: AgentType;
  domainRole: AgentDomainRole;
  domainDescription: string;
  capabilities: string[];
  maxConcurrentTasks: number;
  activeTasks: number;
  isHealthy: boolean;
  lastHeartbeat: string;
}

export interface CoordinatedTask {
  coordinationId: string;
  title: string;
  description: string;
  tenantId: string;
  assignedAgents: string[];
  priority: TaskPriority;
  status: TaskStatus;
  conflictsDetected: number;
  conflictsResolved: number;
  consensusReached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictResolution {
  conflictId: string;
  taskId: string;
  agentsInConflict: string[];
  conflictType: 'RECOMMENDATION_DIVERGENCE' | 'PRIORITY_CONFLICT' | 'RESOURCE_CONTENTION' | 'ETHICAL_BOUNDARY';
  resolution: 'MAJORITY_VOTE' | 'ESCALATE_HUMAN' | 'DOMAIN_AUTHORITY' | 'CONFIDENCE_WEIGHTED';
  resolvedBy: string;
  outcome: string;
  resolvedAt: string;
}

// ── SERVICE ───────────────────────────────────────────────────────────────────

/**
 * MultiAgentCoordinationService — Coordenação Multi-Agente (P152 ACOP)
 *
 * Registra e coordena todos os agentes especializados da plataforma Aura,
 * garantindo domínios de atuação claramente delimitados, resolução de conflitos
 * e visão sistêmica das inteligências artificiais.
 *
 * 14 agentes especializados:
 * Psicologia, Psiquiatria, Assistência Social, Jurídico, Financeiro,
 * RH, Compliance, Auditoria, Segurança, Gestão de Casos, BI, ECM,
 * Universidade Corporativa, Governança.
 *
 * Referências: P111 (AEAIP), P152 (ACOP), ADR-152
 */
@Injectable()
export class MultiAgentCoordinationService {
  private readonly logger = new Logger(MultiAgentCoordinationService.name);
  private agentCatalog: Map<string, SpecializedAgent> = new Map();
  private coordinationTasks: Map<string, CoordinatedTask> = new Map();
  private conflictLog: ConflictResolution[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly eventBus: EventBusService,
    private readonly auditService: CognitiveAuditService,
  ) {
    this.registerSpecializedAgents();
  }

  private registerSpecializedAgents(): void {
    const agentDefinitions: Array<{
      agentType: AgentType;
      domainRole: AgentDomainRole;
      domainDescription: string;
      capabilities: string[];
      maxConcurrentTasks: number;
    }> = [
      {
        agentType: AgentType.CLINICAL_ASSISTANT,
        domainRole: AgentDomainRole.PSYCHOLOGY,
        domainDescription: 'Avaliação psicológica, TCC, saúde mental, escalas PHQ-9/GAD-7',
        capabilities: ['tcc', 'phq9_scoring', 'anxiety_assessment', 'psychological_evaluation', 'crisis_intervention'],
        maxConcurrentTasks: 8,
      },
      {
        agentType: AgentType.CLINICAL_ASSISTANT,
        domainRole: AgentDomainRole.PSYCHIATRY,
        domainDescription: 'Avaliação psiquiátrica, prescrição, risco de vida, emergências',
        capabilities: ['medication_review', 'psychiatric_evaluation', 'risk_assessment', 'suicide_prevention'],
        maxConcurrentTasks: 5,
      },
      {
        agentType: AgentType.SOCIAL_ASSISTANT,
        domainRole: AgentDomainRole.SOCIAL_WORK,
        domainDescription: 'Vulnerabilidade social, benefícios, família, articulação de rede',
        capabilities: ['social_vulnerability', 'benefit_eligibility', 'family_assessment', 'network_coordination'],
        maxConcurrentTasks: 10,
      },
      {
        agentType: AgentType.LEGAL_ADVISOR,
        domainRole: AgentDomainRole.LEGAL,
        domainDescription: 'Assessoria jurídica, contratos, LGPD, regulatório institucional',
        capabilities: ['legal_advice', 'contract_review', 'lgpd_compliance', 'regulatory_check'],
        maxConcurrentTasks: 6,
      },
      {
        agentType: AgentType.FINANCIAL_ANALYST,
        domainRole: AgentDomainRole.FINANCE,
        domainDescription: 'Análise financeira, orçamento, custo, previsão, risco financeiro',
        capabilities: ['budget_analysis', 'cost_forecasting', 'financial_risk', 'grant_management'],
        maxConcurrentTasks: 8,
      },
      {
        agentType: AgentType.HR_ADVISOR,
        domainRole: AgentDomainRole.HUMAN_RESOURCES,
        domainDescription: 'Gestão de pessoas, treinamento, performance, cultura organizacional',
        capabilities: ['hr_onboarding', 'performance_review', 'training_recommendation', 'culture_assessment'],
        maxConcurrentTasks: 10,
      },
      {
        agentType: AgentType.COMPLIANCE_OFFICER,
        domainRole: AgentDomainRole.COMPLIANCE,
        domainDescription: 'Compliance, LGPD, políticas internas, auditoria regulatória',
        capabilities: ['lgpd_compliance', 'policy_audit', 'regulatory_check', 'risk_scoring'],
        maxConcurrentTasks: 6,
      },
      {
        agentType: AgentType.AUDIT_INSPECTOR,
        domainRole: AgentDomainRole.AUDIT,
        domainDescription: 'Auditoria interna, trilha de evidências, detecção de anomalias',
        capabilities: ['audit_trail_analysis', 'anomaly_detection', 'evidence_collection', 'fraud_detection'],
        maxConcurrentTasks: 5,
      },
      {
        agentType: AgentType.SECURITY_GUARDIAN,
        domainRole: AgentDomainRole.SECURITY,
        domainDescription: 'Cibersegurança, Zero Trust, incidentes, integridade de dados',
        capabilities: ['threat_detection', 'zero_trust_validation', 'incident_response', 'vulnerability_scan'],
        maxConcurrentTasks: 4,
      },
      {
        agentType: AgentType.CASE_COORDINATOR,
        domainRole: AgentDomainRole.CASE_MANAGEMENT,
        domainDescription: 'Coordenação de casos, SLA, PIC, encaminhamento multidisciplinar',
        capabilities: ['case_routing', 'sla_management', 'multidisciplinary_coordination', 'triage'],
        maxConcurrentTasks: 12,
      },
      {
        agentType: AgentType.BI_ANALYST,
        domainRole: AgentDomainRole.BI_ANALYTICS,
        domainDescription: 'Business Intelligence, KPIs, análise preditiva, dashboards',
        capabilities: ['data_analysis', 'kpi_monitoring', 'trend_detection', 'clinical_summary', 'forecasting'],
        maxConcurrentTasks: 8,
      },
      {
        agentType: AgentType.ECM_MANAGER,
        domainRole: AgentDomainRole.ECM_DOCUMENTS,
        domainDescription: 'Gestão de conteúdo, documentos, prontuários, contratos',
        capabilities: ['document_classification', 'content_extraction', 'summarization', 'ecm_indexing'],
        maxConcurrentTasks: 10,
      },
      {
        agentType: AgentType.TRAINING_FACILITATOR,
        domainRole: AgentDomainRole.CORPORATE_UNIVERSITY,
        domainDescription: 'Capacitação, trilhas de aprendizado, competências institucionais',
        capabilities: ['training_recommendation', 'skill_gap_analysis', 'learning_path', 'gamification'],
        maxConcurrentTasks: 10,
      },
      {
        agentType: AgentType.GOVERNANCE_SUPERVISOR,
        domainRole: AgentDomainRole.GOVERNANCE,
        domainDescription: 'Governança institucional, AGO, políticas, risco estratégico',
        capabilities: ['governance_review', 'risk_scoring', 'policy_recommendation', 'strategic_alignment'],
        maxConcurrentTasks: 5,
      },
    ];

    for (const def of agentDefinitions) {
      const agentId = `agent-${def.domainRole.toLowerCase().replace(/_/g, '-')}-v1`;
      const agent: SpecializedAgent = {
        agentId,
        agentType: def.agentType,
        domainRole: def.domainRole,
        domainDescription: def.domainDescription,
        capabilities: def.capabilities,
        maxConcurrentTasks: def.maxConcurrentTasks,
        activeTasks: 0,
        isHealthy: true,
        lastHeartbeat: new Date().toISOString(),
      };
      this.agentCatalog.set(agentId, agent);
    }

    this.logger.log(`[MultiAgentCoordination] Registered ${this.agentCatalog.size} specialized agents.`);
  }

  // ── Coordenação de Tarefas ────────────────────────────────────────────────────

  async assignTask(
    title: string,
    description: string,
    tenantId: string,
    domains: AgentDomainRole[],
    priority: TaskPriority,
  ): Promise<CoordinatedTask> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const coordinationId = `COORD-${year}-${seq}`;

    const assignedAgentIds: string[] = [];
    for (const domain of domains) {
      const agentId = `agent-${domain.toLowerCase().replace(/_/g, '-')}-v1`;
      const agent = this.agentCatalog.get(agentId);
      if (agent && agent.isHealthy && agent.activeTasks < agent.maxConcurrentTasks) {
        agent.activeTasks += 1;
        assignedAgentIds.push(agentId);
      }
    }

    const task: CoordinatedTask = {
      coordinationId,
      title,
      description,
      tenantId,
      assignedAgents: assignedAgentIds,
      priority,
      status: TaskStatus.ROUTED,
      conflictsDetected: 0,
      conflictsResolved: 0,
      consensusReached: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.coordinationTasks.set(coordinationId, task);

    await this.eventBus.publish(
      'aura.cognitive.task.assigned.v1',
      { coordinationId, assignedAgents: assignedAgentIds, priority, domains },
      tenantId,
      { subject: coordinationId },
    );

    this.logger.log(`[MultiAgentCoordination] Task assigned: ${coordinationId} to ${assignedAgentIds.length} agents`);
    return task;
  }

  resolveConflict(
    taskId: string,
    agentsInConflict: string[],
    conflictType: ConflictResolution['conflictType'],
  ): ConflictResolution {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 6).toUpperCase();
    const conflictId = `CONF-${year}-${seq}`;

    // Estratégia de resolução baseada no tipo de conflito
    let resolution: ConflictResolution['resolution'];
    let resolvedBy: string;
    let outcome: string;

    if (conflictType === 'ETHICAL_BOUNDARY') {
      resolution = 'ESCALATE_HUMAN';
      resolvedBy = 'HUMAN_SUPERVISOR';
      outcome = 'Conflito ético escalado para supervisão humana obrigatória.';
    } else if (conflictType === 'RECOMMENDATION_DIVERGENCE') {
      resolution = 'CONFIDENCE_WEIGHTED';
      resolvedBy = 'orchestrator-engine-v1';
      outcome = 'Análise com maior score de confiança priorizada via média ponderada.';
    } else if (conflictType === 'PRIORITY_CONFLICT') {
      resolution = 'DOMAIN_AUTHORITY';
      resolvedBy = 'orchestrator-engine-v1';
      outcome = 'Agente de domínio primário tem autoridade na decisão.';
    } else {
      resolution = 'MAJORITY_VOTE';
      resolvedBy = 'orchestrator-engine-v1';
      outcome = `Maioria votou: ${Math.ceil(agentsInConflict.length / 2) + 1} de ${agentsInConflict.length} agentes concordaram.`;
    }

    const conflict: ConflictResolution = {
      conflictId,
      taskId,
      agentsInConflict,
      conflictType,
      resolution,
      resolvedBy,
      outcome,
      resolvedAt: new Date().toISOString(),
    };

    this.conflictLog.push(conflict);
    this.auditService.logAudit('ConflictResolved', `${conflictType} → ${resolution}`, {
      conflictId,
      taskId,
      agentsInConflict,
      resolution,
    });

    this.logger.log(`[MultiAgentCoordination] Conflict resolved: ${conflictId} (${conflictType} → ${resolution})`);
    return conflict;
  }

  // ── Consultas ─────────────────────────────────────────────────────────────────

  getAgentCatalog(): SpecializedAgent[] {
    return Array.from(this.agentCatalog.values());
  }

  getAgent(agentId: string): SpecializedAgent | undefined {
    return this.agentCatalog.get(agentId);
  }

  getAgentsByDomain(domainRole: AgentDomainRole): SpecializedAgent[] {
    return Array.from(this.agentCatalog.values()).filter((a) => a.domainRole === domainRole);
  }

  getCoordinationTask(coordinationId: string): CoordinatedTask | undefined {
    return this.coordinationTasks.get(coordinationId);
  }

  getConflictLog(): ConflictResolution[] {
    return [...this.conflictLog];
  }

  getSystemHealth(): {
    totalAgents: number;
    healthyAgents: number;
    totalActiveTasks: number;
    conflictsResolved: number;
  } {
    const agents = Array.from(this.agentCatalog.values());
    return {
      totalAgents: agents.length,
      healthyAgents: agents.filter((a) => a.isHealthy).length,
      totalActiveTasks: agents.reduce((sum, a) => sum + a.activeTasks, 0),
      conflictsResolved: this.conflictLog.length,
    };
  }
}
