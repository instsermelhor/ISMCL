import { Injectable, Logger } from '@nestjs/common';
import { AgentDomainRole, TaskPriority } from '../dto/cognitive-orchestration.dto';
import { EventBusService } from '../../../events/event-bus.service';
import { CognitiveAuditService } from './cognitive-audit.service';
import { CognitiveMemoryService } from './cognitive-memory.service';
import { AITaskRoutingService } from './ai-task-routing.service';
import { AICollaborationService } from './ai-collaboration.service';
import { InstitutionalReasoningEngine } from './institutional-reasoning.service';
import { AutonomousRecommendationService } from './autonomous-recommendation.service';
import { AIPerformanceMonitoringService } from './ai-performance-monitoring.service';

// ── INTERFACES ────────────────────────────────────────────────────────────────

export interface OrchestratedTaskRequest {
  taskId: string;
  title: string;
  description: string;
  tenantId: string;
  targetDomains: AgentDomainRole[];
  priority: TaskPriority;
  caseId?: string;
  context?: Record<string, any>;
  requireReasoning?: boolean;
  requireRecommendation?: boolean;
}

export interface OrchestratedTaskResult {
  orchestrationId: string;
  taskId: string;
  tenantId: string;
  status: 'COMPLETED' | 'ESCALATED' | 'FAILED';
  selectedAgents: Array<{ agentId: string; domainRole: AgentDomainRole }>;
  consensusScore: number;
  synthesizedAnalysis: string;
  reasoningResult?: Record<string, any>;
  recommendationIds?: string[];
  auditTrailRef: string;
  orchestratedAt: string;
  durationMs: number;
}

// ── SERVICE ───────────────────────────────────────────────────────────────────

/**
 * CognitiveOrchestratorService — Orquestrador Cognitivo Central (P152 ACOP)
 *
 * Coordena todos os agentes inteligentes do ecossistema Aura, distribuindo tarefas,
 * consolidando análises, supervisionando modelos de IA e produzindo recomendações
 * institucionais consistentes.
 *
 * Nenhum agente atua isoladamente em processos críticos.
 * Toda decisão permanece sob governança humana (Human-in-the-Loop).
 *
 * Referências: P111 (AEAIP), P112 (AEDIP), P152 (ACOP), ADR-152
 */
@Injectable()
export class CognitiveOrchestratorService {
  private readonly logger = new Logger(CognitiveOrchestratorService.name);
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly eventBus: EventBusService,
    private readonly auditService: CognitiveAuditService,
    private readonly memoryService: CognitiveMemoryService,
    private readonly taskRouting: AITaskRoutingService,
    private readonly collaboration: AICollaborationService,
    private readonly reasoning: InstitutionalReasoningEngine,
    private readonly recommendation: AutonomousRecommendationService,
    private readonly performance: AIPerformanceMonitoringService,
  ) {}

  /**
   * Orquestra uma tarefa cognitiva end-to-end:
   * 1. Roteia para agentes especializados
   * 2. Inicia sessão de colaboração multi-agente
   * 3. Executa raciocínio institucional (se solicitado)
   * 4. Gera recomendação autônoma (se solicitado)
   * 5. Persiste na memória cognitiva
   * 6. Audita toda a operação
   */
  async orchestrate(request: OrchestratedTaskRequest): Promise<OrchestratedTaskResult> {
    const start = Date.now();
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orchestrationId = `ORCH-${year}-${seq}`;

    this.logger.log(`[CognitiveOrchestrator] Starting orchestration: ${orchestrationId} for task: ${request.taskId}`);

    await this.eventBus.publish(
      'aura.cognitive.orchestration.started.v1',
      { orchestrationId, taskId: request.taskId, priority: request.priority, domains: request.targetDomains },
      request.tenantId,
      { subject: orchestrationId },
    );

    // ── Etapa 1: Seleção de agentes ────────────────────────────────────────────
    const selectedAgents = this.taskRouting.selectOptimalAgents(request.targetDomains, request.priority);

    // ── Etapa 2: Colaboração multi-agente ──────────────────────────────────────
    const collaborationSession = await this.collaboration.initiateCollaborationSession({
      topic: request.title,
      participants: selectedAgents.map((a) => ({ agentId: a.agentId, role: a.domainRole })),
      contextPayload: { taskId: request.taskId, caseId: request.caseId, ...request.context },
    });

    // ── Etapa 3: Raciocínio institucional (opcional) ───────────────────────────
    let reasoningResult: Record<string, any> | undefined;
    if (request.requireReasoning !== false) {
      const reasoning = await this.reasoning.executeReasoning({
        tenantId: request.tenantId,
        goal: request.description,
        contextData: request.context,
      });
      reasoningResult = {
        reasoningId: reasoning.reasoningId,
        confidenceScore: reasoning.confidenceScore,
        summary: reasoning.reasoningSummary,
        evidenceSources: reasoning.evidenceChain.length,
      };
    }

    // ── Etapa 4: Recomendação autônoma (opcional) ──────────────────────────────
    const recommendationIds: string[] = [];
    if (request.requireRecommendation && request.priority === TaskPriority.CRITICAL || request.priority === TaskPriority.URGENT_EMERGENCY) {
      const rec = await this.recommendation.generateRecommendation({
        tenantId: request.tenantId,
        category: this.inferRecommendationCategory(request.targetDomains),
        title: `Recomendação Orquestrada: ${request.title}`,
        description: request.description,
        suggestedActions: [`Revisar análise consolidada dos ${selectedAgents.length} agentes especializados`],
        confidenceScore: collaborationSession.consensusScore,
        evidenceReferences: [request.taskId, ...(request.caseId ? [request.caseId] : [])],
      });
      recommendationIds.push(rec.recommendationId);
    }

    // ── Etapa 5: Persistência na memória cognitiva ─────────────────────────────
    await this.memoryService.storeMemory({
      tenantId: request.tenantId,
      entityId: request.caseId ?? request.taskId,
      memoryType: 'short_term',
      key: `ORCHESTRATION_${orchestrationId}`,
      content: {
        taskId: request.taskId,
        domains: request.targetDomains,
        consensusScore: collaborationSession.consensusScore,
        agentCount: selectedAgents.length,
        priority: request.priority,
      },
      importance: this.priorityToImportance(request.priority),
      tags: ['orchestration', ...request.targetDomains.map((d) => d.toLowerCase())],
    });

    // ── Etapa 6: Libera agentes ────────────────────────────────────────────────
    for (const agent of selectedAgents) {
      this.taskRouting.releaseAgentLoad(agent.agentId);
    }

    const durationMs = Date.now() - start;

    // ── Auditoria da orquestração ──────────────────────────────────────────────
    const auditEntry = this.auditService.logAudit(
      'AIOrchestrationExecuted',
      'CognitiveOrchestrate',
      {
        orchestrationId,
        taskId: request.taskId,
        agentCount: selectedAgents.length,
        consensusScore: collaborationSession.consensusScore,
        durationMs,
        reasoningExecuted: !!reasoningResult,
        recommendationsGenerated: recommendationIds.length,
      },
    );

    // ── Monitoramento de performance ───────────────────────────────────────────
    this.performance.evaluateAgentPerformance('cognitive-orchestrator', durationMs, true);

    const result: OrchestratedTaskResult = {
      orchestrationId,
      taskId: request.taskId,
      tenantId: request.tenantId,
      status: collaborationSession.status === 'CONSENSUS_REACHED' ? 'COMPLETED' : 'ESCALATED',
      selectedAgents: selectedAgents.map((a) => ({ agentId: a.agentId, domainRole: a.domainRole })),
      consensusScore: collaborationSession.consensusScore,
      synthesizedAnalysis: collaborationSession.collaborationSummary,
      reasoningResult,
      recommendationIds,
      auditTrailRef: auditEntry.auditId,
      orchestratedAt: new Date().toISOString(),
      durationMs,
    };

    await this.eventBus.publish(
      'aura.cognitive.orchestration.completed.v1',
      { orchestrationId, taskId: request.taskId, status: result.status, consensusScore: result.consensusScore },
      request.tenantId,
      { subject: orchestrationId, correlationId: request.taskId },
    );

    this.logger.log(
      `[CognitiveOrchestrator] Completed: ${orchestrationId} | Status: ${result.status} | Score: ${result.consensusScore} | ${durationMs}ms`,
    );
    return result;
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private inferRecommendationCategory(domains: AgentDomainRole[]) {
    const domainCategoryMap: Partial<Record<AgentDomainRole, any>> = {
      [AgentDomainRole.PSYCHOLOGY]: 'CARE_QUALITY',
      [AgentDomainRole.PSYCHIATRY]: 'CARE_QUALITY',
      [AgentDomainRole.SOCIAL_WORK]: 'RESOURCE_ALLOCATION',
      [AgentDomainRole.LEGAL]: 'RISK_MANAGEMENT',
      [AgentDomainRole.FINANCE]: 'OPERATIONAL_OPTIMIZATION',
      [AgentDomainRole.COMPLIANCE]: 'SECURITY_GOVERNANCE',
      [AgentDomainRole.GOVERNANCE]: 'STRATEGIC_KPI',
    };

    for (const domain of domains) {
      if (domainCategoryMap[domain]) return domainCategoryMap[domain];
    }
    return 'PROCESS_IMPROVEMENT';
  }

  private priorityToImportance(priority: TaskPriority): number {
    const map: Record<TaskPriority, number> = {
      [TaskPriority.LOW]: 0.3,
      [TaskPriority.MEDIUM]: 0.5,
      [TaskPriority.HIGH]: 0.75,
      [TaskPriority.CRITICAL]: 0.92,
      [TaskPriority.URGENT_EMERGENCY]: 1.0,
    };
    return map[priority] ?? 0.5;
  }
}
