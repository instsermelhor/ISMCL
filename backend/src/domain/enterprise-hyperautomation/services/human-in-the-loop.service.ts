import { Injectable, Logger } from '@nestjs/common';
import { HumanLoopResolutionDto, HumanLoopAction } from '../dto/enterprise-hyperautomation.dto';
import { AutomationAuditService } from './automation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export type AutonomyLevel = 'FULL_AUTO' | 'SUPERVISED' | 'HUMAN_REQUIRED';

export interface HumanLoopTask {
  loopId: string;
  processName: string;
  context: Record<string, any>;
  autonomyLevel: AutonomyLevel;
  status: 'PENDING' | 'RESOLVED' | 'DELEGATED' | 'INTERRUPTED';
  requestedAt: string;
  resolution?: {
    action: HumanLoopAction;
    reviewerName: string;
    justification?: string;
    resolvedAt: string;
  };
}

/**
 * HumanInTheLoopService — P174 EHCOP
 *
 * Supervisão Humana de Automações (Human-in-the-Loop).
 * Garante que processos de alta criticidade ou contextos ambíguos
 * sejam aprovados, revisados, delegados ou interrompidos por um
 * responsável humano antes de prosseguir.
 * Configura níveis de autonomia (FULL_AUTO, SUPERVISED, HUMAN_REQUIRED) por processo.
 */
@Injectable()
export class HumanInTheLoopService {
  private readonly logger = new Logger(HumanInTheLoopService.name);
  private readonly loopTasks: Map<string, HumanLoopTask> = new Map();

  constructor(
    private readonly auditSvc: AutomationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async requestHumanApproval(
    loopId: string,
    processName: string,
    context: Record<string, any>,
    autonomyLevel: AutonomyLevel = 'SUPERVISED',
  ): Promise<HumanLoopTask> {
    const task: HumanLoopTask = {
      loopId,
      processName,
      context,
      autonomyLevel,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };

    this.loopTasks.set(loopId, task);

    await this.auditSvc.recordAudit('HUMAN_APPROVAL_REQUESTED', loopId, 'SYSTEM', { processName, autonomyLevel });

    await this.eventBus.publish(
      'aura.ehcop.human.approval.requested.v1',
      { loopId, processName, autonomyLevel },
      'EHCOP',
      { subject: loopId },
    );

    this.logger.warn(`[HumanInTheLoop] 🙋 Aprovação humana solicitada: "${processName}" (${loopId}) — Autonomia: ${autonomyLevel}`);
    return task;
  }

  async resolveLoop(dto: HumanLoopResolutionDto): Promise<HumanLoopTask> {
    const task = this.getOrThrow(dto.loopId);

    task.resolution = {
      action: dto.action,
      reviewerName: dto.reviewerName,
      justification: dto.justification,
      resolvedAt: new Date().toISOString(),
    };

    task.status = dto.action === HumanLoopAction.INTERRUPT ? 'INTERRUPTED'
      : dto.action === HumanLoopAction.DELEGATE ? 'DELEGATED'
      : 'RESOLVED';

    await this.auditSvc.recordAudit('HUMAN_LOOP_RESOLVED', dto.loopId, dto.reviewerName, {
      action: dto.action,
      justification: dto.justification ?? 'N/A',
    });

    this.logger.log(`[HumanInTheLoop] ✅ Loop "${dto.loopId}" resolvido por "${dto.reviewerName}": ${dto.action}`);
    return task;
  }

  getLoopTask(loopId: string): HumanLoopTask | undefined {
    return this.loopTasks.get(loopId);
  }

  listPendingLoops(): HumanLoopTask[] {
    return Array.from(this.loopTasks.values()).filter((t) => t.status === 'PENDING');
  }

  private getOrThrow(loopId: string): HumanLoopTask {
    const t = this.loopTasks.get(loopId);
    if (!t) throw new Error(`Loop "${loopId}" não encontrado.`);
    return t;
  }
}
