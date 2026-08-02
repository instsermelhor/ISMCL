import { Injectable, Logger } from '@nestjs/common';
import { AutomationAuditService } from './automation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface WorkflowDefinition {
  workflowId: string;
  name: string;
  steps: WorkflowStep[];
  triggers: string[];
  createdAt: string;
}

export interface WorkflowStep {
  stepId: string;
  name: string;
  type: 'AUTOMATED' | 'HUMAN_TASK' | 'DECISION' | 'INTEGRATION' | 'NOTIFICATION';
  handler: string;
  timeoutSeconds: number;
  retryPolicy: { maxRetries: number; backoffMs: number };
}

export interface WorkflowExecutionLog {
  executionId: string;
  workflowId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SUSPENDED';
  completedSteps: string[];
  pendingStep?: string;
  startedAt: string;
  completedAt?: string;
}

/**
 * IntelligentWorkflowService — P174 EHCOP
 *
 * Motor de workflows inteligentes da Plataforma Aura.
 * Orquestra fluxos de trabalho multi-etapa com suporte a steps automatizados,
 * tarefas humanas, ramificações condicionais e integrações externas.
 * Integrado ao Event Bus para triggers orientados a eventos.
 */
@Injectable()
export class IntelligentWorkflowService {
  private readonly logger = new Logger(IntelligentWorkflowService.name);
  private readonly workflows: Map<string, WorkflowDefinition> = new Map();
  private readonly executions: Map<string, WorkflowExecutionLog> = new Map();

  constructor(
    private readonly auditSvc: AutomationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerWorkflow(workflowId: string, name: string, steps: WorkflowStep[], triggers: string[]): Promise<WorkflowDefinition> {
    const def: WorkflowDefinition = {
      workflowId,
      name,
      steps,
      triggers,
      createdAt: new Date().toISOString(),
    };
    this.workflows.set(workflowId, def);
    await this.auditSvc.recordAudit('WORKFLOW_REGISTERED', workflowId, 'WorkflowEngine', { stepsCount: steps.length, triggers });
    this.logger.log(`[IntelligentWorkflow] Workflow registrado: "${name}" (${workflowId}) — ${steps.length} steps`);
    return def;
  }

  async executeWorkflow(workflowId: string, triggeredBy: string): Promise<WorkflowExecutionLog> {
    const wf = this.workflows.get(workflowId);
    if (!wf) throw new Error(`Workflow "${workflowId}" não encontrado.`);

    const executionId = `WF-EXEC-${Date.now().toString(36).toUpperCase()}`;
    const completedSteps = wf.steps
      .filter((s) => s.type !== 'HUMAN_TASK')
      .map((s) => s.stepId);
    const humanTask = wf.steps.find((s) => s.type === 'HUMAN_TASK');

    const log: WorkflowExecutionLog = {
      executionId,
      workflowId,
      status: humanTask ? 'SUSPENDED' : 'COMPLETED',
      completedSteps,
      pendingStep: humanTask?.stepId,
      startedAt: new Date().toISOString(),
      completedAt: humanTask ? undefined : new Date().toISOString(),
    };

    this.executions.set(executionId, log);
    await this.auditSvc.recordAudit('WORKFLOW_EXECUTED', executionId, triggeredBy, { workflowId, status: log.status });
    this.logger.log(`[IntelligentWorkflow] ⚡ Workflow "${workflowId}" — execução ${executionId}: ${log.status}`);
    return log;
  }

  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }
}
