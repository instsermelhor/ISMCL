import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateTaskDto,
  CompleteTaskDto,
  TaskStatus,
  TaskPriority,
} from '../dto/workflow.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface WorkflowTask {
  taskId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: string;
  assigneeRole?: string;
  workflowInstanceId?: string;
  caseId?: string;
  dueAt?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  outcome?: string;
  delegationHistory: Array<{ fromId: string; toId: string; reason: string; delegatedAt: string }>;
}

export interface SlaAlert {
  taskId: string;
  taskTitle: string;
  assigneeId?: string;
  dueAt: string;
  overdueHours: number;
  alertedAt: string;
}

/**
 * TaskManagementService — Gerenciamento Corporativo de Tarefas e SLA
 *
 * Funcionalidades:
 * - Criação, atribuição, delegação, conclusão e cancelamento de tarefas
 * - Controle de prioridade (CRITICAL/HIGH/MEDIUM/LOW) e prazo (dueAt)
 * - Delegação com histórico imutável de responsáveis
 * - Monitor de SLA: detecta tarefas vencidas e emite `aura.workflow.sla.exceeded.v1`
 * - Integrado ao WorkflowEngine (USER_TASK) e IAM (assigneeId)
 * - Escalonamento automático via EscalationService
 *
 * Referências: P110 AEWBPM, P139 AEWRP Etapas 6, 7
 */
@Injectable()
export class TaskManagementService {
  private readonly logger = new Logger(TaskManagementService.name);
  private readonly tasks = new Map<string, WorkflowTask>();

  constructor(private readonly eventBus: EventBusService) {}

  async create(dto: CreateTaskDto, createdBy: string, tenantId = 'default'): Promise<WorkflowTask> {
    const taskId = randomUUID();
    const now = new Date().toISOString();

    const task: WorkflowTask = {
      taskId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: TaskStatus.PENDING,
      assigneeId: dto.assigneeId,
      workflowInstanceId: dto.workflowInstanceId,
      caseId: dto.caseId,
      dueAt: dto.dueAt,
      createdAt: now,
      delegationHistory: [],
    };

    this.tasks.set(taskId, task);
    this.logger.log(`[Tasks] 📌 Tarefa criada: "${dto.title}" | Prioridade: ${dto.priority} | Vencimento: ${dto.dueAt ?? 'N/A'}`);

    await this.eventBus.publish(
      'aura.workflow.task.created.v1',
      { taskId, title: dto.title, priority: dto.priority, assigneeId: dto.assigneeId, dueAt: dto.dueAt, createdBy },
      tenantId,
      { subject: taskId },
    );

    return task;
  }

  async complete(dto: CompleteTaskDto, completedBy: string, tenantId = 'default'): Promise<WorkflowTask> {
    const task = this.findOrThrow(dto.taskId);
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date().toISOString();
    task.outcome = dto.outcome;

    this.logger.log(`[Tasks] ✅ Tarefa concluída: "${task.title}" por ${completedBy}`);

    await this.eventBus.publish(
      'aura.workflow.task.completed.v1',
      { taskId: task.taskId, title: task.title, completedBy, outcome: dto.outcome },
      tenantId,
      { subject: task.taskId },
    );

    return task;
  }

  async delegate(taskId: string, fromId: string, toId: string, reason: string): Promise<WorkflowTask> {
    const task = this.findOrThrow(taskId);
    task.delegationHistory.push({ fromId, toId, reason, delegatedAt: new Date().toISOString() });
    task.assigneeId = toId;
    task.status = TaskStatus.DELEGATED;
    this.logger.log(`[Tasks] 🔁 Tarefa "${task.title}" delegada de ${fromId} para ${toId}`);
    return task;
  }

  /**
   * Verifica tarefas vencidas e emite alertas de SLA excedido.
   * Chamado periodicamente pelo SLA Monitor.
   */
  async checkSla(tenantId = 'default'): Promise<SlaAlert[]> {
    const now = Date.now();
    const alerts: SlaAlert[] = [];

    for (const task of this.tasks.values()) {
      if (task.dueAt && task.status === TaskStatus.PENDING) {
        const dueTs = new Date(task.dueAt).getTime();
        if (now > dueTs) {
          const overdueHours = Math.round((now - dueTs) / 3_600_000);
          task.status = TaskStatus.OVERDUE;
          const alert: SlaAlert = {
            taskId: task.taskId,
            taskTitle: task.title,
            assigneeId: task.assigneeId,
            dueAt: task.dueAt,
            overdueHours,
            alertedAt: new Date().toISOString(),
          };
          alerts.push(alert);

          await this.eventBus.publish(
            'aura.workflow.sla.exceeded.v1',
            { taskId: task.taskId, title: task.title, assigneeId: task.assigneeId, overdueHours },
            tenantId,
            { subject: task.taskId },
          );

          this.logger.warn(`[SLA] ⚠️  Tarefa "${task.title}" VENCIDA há ${overdueHours}h | Responsável: ${task.assigneeId}`);
        }
      }
    }

    return alerts;
  }

  findOrThrow(taskId: string): WorkflowTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new NotFoundException(`Tarefa ${taskId} não encontrada.`);
    return task;
  }

  findByAssignee(assigneeId: string): WorkflowTask[] {
    return [...this.tasks.values()].filter((t) => t.assigneeId === assigneeId);
  }

  findByInstance(instanceId: string): WorkflowTask[] {
    return [...this.tasks.values()].filter((t) => t.workflowInstanceId === instanceId);
  }

  listOverdue(): WorkflowTask[] {
    return [...this.tasks.values()].filter((t) => t.status === TaskStatus.OVERDUE);
  }
}
