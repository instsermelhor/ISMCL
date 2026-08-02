import { Injectable, Logger } from '@nestjs/common';
import { DelegateTaskDto, TaskAssigneeType, TaskPriority } from '../dto/autonomous-operations.dto';
import { ImprovementGovernanceService } from './improvement-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface DelegatedTaskRecord {
  taskId: string;
  title: string;
  assigneeType: TaskAssigneeType;
  assigneeId: string;
  priority: TaskPriority;
  dueDate: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  delegatedAt: string;
}

/**
 * AITaskDelegationService — Delegação Inteligente de Tarefas (P164 AOCP)
 *
 * Distribui automaticamente atividades operacionais para agentes de IA,
 * equipes técnicas, gestores ou responsáveis institucionais com prazos e dependências.
 */
@Injectable()
export class AITaskDelegationService {
  private readonly logger = new Logger(AITaskDelegationService.name);
  private taskStore: Map<string, DelegatedTaskRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly governance: ImprovementGovernanceService,
    private readonly eventBus: EventBusService,
  ) {}

  async delegateTask(dto: DelegateTaskDto): Promise<DelegatedTaskRecord> {
    const taskId = `TASK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const dueDate = dto.dueDate ?? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const record: DelegatedTaskRecord = {
      taskId,
      title: dto.title,
      assigneeType: dto.assigneeType,
      assigneeId: dto.assigneeId,
      priority: dto.priority,
      dueDate,
      status: 'ASSIGNED',
      delegatedAt: new Date().toISOString(),
    };

    this.taskStore.set(taskId, record);

    await this.governance.recordAudit('DELEGATE_TASK', dto.title, 'CAIO', {
      taskId, assigneeType: dto.assigneeType, assigneeId: dto.assigneeId,
    });

    await this.eventBus.publish(
      'aura.operations.task.delegated.v1',
      { taskId, title: dto.title, assigneeId: dto.assigneeId, priority: dto.priority },
      this.SYSTEM_TENANT,
      { subject: taskId },
    );

    this.logger.log(`[AITaskDelegation] Delegated task ${taskId} ("${dto.title}") to ${dto.assigneeId}`);
    return record;
  }

  listTasks(assigneeId?: string): DelegatedTaskRecord[] {
    return Array.from(this.taskStore.values()).filter(
      (t) => !assigneeId || t.assigneeId === assigneeId,
    );
  }
}
