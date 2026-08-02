import { Injectable, Logger } from '@nestjs/common';
import { BusinessContinuityService } from './business-continuity.service';
import { DisasterRecoveryService } from './disaster-recovery.service';
import { EmergencyCommunicationService } from './emergency-communication.service';
import { ContinuityAuditService } from './continuity-audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import { CommunicationChannel } from '../dto/business-continuity.dto';

export interface WorkflowExecutionStep {
  stepId: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startedAt?: string;
  completedAt?: string;
  requiresHumanApproval: boolean;
  approvedBy?: string;
}

export interface RecoveryWorkflowExecution {
  executionId: string;
  workflowName: string;
  planId: string;
  incidentId: string;
  status: 'INITIATED' | 'RUNNING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED';
  steps: WorkflowExecutionStep[];
  startedAt: string;
  completedAt?: string;
  executedBy: string;
}

/**
 * RecoveryOrchestrationService — P169 BCORP
 *
 * Automação e orquestração de planos de recuperação:
 * ativação de BCP, restauração de serviços, redistribuição de cargas,
 * priorização de sistemas e monitoramento de workflows de recuperação.
 * Toda automação permite intervenção e aprovação humana explícita.
 */
@Injectable()
export class RecoveryOrchestrationService {
  private readonly logger = new Logger(RecoveryOrchestrationService.name);
  private readonly executions: Map<string, RecoveryWorkflowExecution> = new Map();

  constructor(
    private readonly bcpSvc: BusinessContinuityService,
    private readonly drSvc: DisasterRecoveryService,
    private readonly commSvc: EmergencyCommunicationService,
    private readonly auditSvc: ContinuityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async startOrchestratedRecovery(
    planId: string,
    incidentId: string,
    executedBy = 'SYSTEM',
  ): Promise<RecoveryWorkflowExecution> {
    const executionId = `ORCH-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const steps: WorkflowExecutionStep[] = [
      {
        stepId: 'STEP-1-ACTIVATE-BCP',
        name: 'Ativar Plano de Continuidade Institucional',
        status: 'PENDING',
        requiresHumanApproval: true,
      },
      {
        stepId: 'STEP-2-ISOLATE-IMPACTED',
        name: 'Isolar Sistemas e Ambientes Afetados',
        status: 'PENDING',
        requiresHumanApproval: false,
      },
      {
        stepId: 'STEP-3-INITIATE-DR',
        name: 'Iniciar Failover e Restauração de Backups',
        status: 'PENDING',
        requiresHumanApproval: false,
      },
      {
        stepId: 'STEP-4-EMERGENCY-COMM',
        name: 'Disparar Comunicação de Emergência aos Comitês',
        status: 'PENDING',
        requiresHumanApproval: false,
      },
      {
        stepId: 'STEP-5-VALIDATE-INTEGRITY',
        name: 'Validar Integridade e Aprovar Retorno de Tráfego',
        status: 'PENDING',
        requiresHumanApproval: true,
      },
    ];

    const execution: RecoveryWorkflowExecution = {
      executionId,
      workflowName: 'Orquestração Automatizada de Recuperação Operacional',
      planId,
      incidentId,
      status: 'INITIATED',
      steps,
      startedAt: now,
      executedBy,
    };

    this.executions.set(executionId, execution);

    await this.auditSvc.recordAudit('RECOVERY_ORCHESTRATION_STARTED', executionId, executedBy, {
      planId,
      incidentId,
    });

    this.logger.warn(`[RecoveryOrchestration] Workflow de recuperação "${executionId}" iniciado.`);
    return execution;
  }

  async executeNextStep(executionId: string, executedBy: string): Promise<RecoveryWorkflowExecution> {
    const exec = this.getOrThrow(executionId);
    const nextStep = exec.steps.find((s) => s.status === 'PENDING');

    if (!nextStep) {
      exec.status = 'COMPLETED';
      exec.completedAt = new Date().toISOString();
      await this.auditSvc.recordAudit('RECOVERY_ORCHESTRATION_COMPLETED', executionId, executedBy, {});
      return exec;
    }

    if (nextStep.requiresHumanApproval && !nextStep.approvedBy) {
      exec.status = 'WAITING_APPROVAL';
      this.logger.warn(`[RecoveryOrchestration] Passo "${nextStep.stepId}" aguarda aprovação humana.`);
      return exec;
    }

    nextStep.status = 'RUNNING';
    nextStep.startedAt = new Date().toISOString();
    exec.status = 'RUNNING';

    // Executar lógica do passo
    await this.runStepLogic(nextStep, exec, executedBy);

    nextStep.status = 'COMPLETED';
    nextStep.completedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('ORCHESTRATION_STEP_EXECUTED', executionId, executedBy, {
      stepId: nextStep.stepId,
    });

    return exec;
  }

  async approveStep(executionId: string, stepId: string, approvedBy: string): Promise<RecoveryWorkflowExecution> {
    const exec = this.getOrThrow(executionId);
    const step = exec.steps.find((s) => s.stepId === stepId);
    if (!step) throw new Error(`Passo "${stepId}" não encontrado na orquestração "${executionId}".`);

    step.approvedBy = approvedBy;
    await this.auditSvc.recordAudit('ORCHESTRATION_STEP_APPROVED', executionId, approvedBy, { stepId });

    this.logger.log(`[RecoveryOrchestration] Passo "${stepId}" aprovado por ${approvedBy}.`);
    return this.executeNextStep(executionId, approvedBy);
  }

  getExecution(executionId: string): RecoveryWorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  listExecutions(): RecoveryWorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  private async runStepLogic(step: WorkflowExecutionStep, exec: RecoveryWorkflowExecution, user: string): Promise<void> {
    switch (step.stepId) {
      case 'STEP-1-ACTIVATE-BCP':
        await this.bcpSvc.activatePlan(exec.planId, user, 'Orquestração automatizada de emergência');
        break;
      case 'STEP-3-INITIATE-DR':
        await this.drSvc.initiateRecovery({
          incidentId: exec.incidentId,
          scenarioDescription: 'Restauração automatizada via orquestração',
        }, user);
        break;
      case 'STEP-4-EMERGENCY-COMM':
        await this.commSvc.sendNotification({
          crisisId: exec.incidentId,
          message: 'Orquestração de recuperação ativada. Monitorar canal oficial.',
          channels: [CommunicationChannel.EMAIL, CommunicationChannel.PORTAL],
        }, user);
        break;
      default:
        this.logger.log(`[RecoveryOrchestration] Passo genérico "${step.stepId}" executado.`);
    }
  }

  private getOrThrow(executionId: string): RecoveryWorkflowExecution {
    const e = this.executions.get(executionId);
    if (!e) throw new Error(`Orquestração "${executionId}" não encontrada.`);
    return e;
  }
}
