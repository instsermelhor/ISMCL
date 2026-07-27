import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AddGoalDto, UpdateGoalProgressDto, GoalCategory } from '../dto/case-management.dto';
import { CaseTimelineService } from './case-timeline.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AssistentialGoal {
  goalId: string;
  caseId: string;
  title: string;
  category: GoalCategory;
  completionPercentage: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  deadline?: string;
  progressNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * GoalManagementService — Gestão de Metas Assistenciais & Percentuais de Evolução
 *
 * Gerencia as metas de curto, médio e longo prazo do beneficiário:
 * - Clínicas (adesão a medicamentos, estabilização)
 * - Psicossociais (fortalecimento de vínculos, auto-estima)
 * - Educacionais / Profissionalizantes
 * - Familiares e Administrativas
 *
 * Registra o progresso percentual (0-100%) e emite o evento `aura.case.goal.completed.v1` ao atingir 100%.
 *
 * Referências: P110 (AEWBPM), P135 (AECMP Etapa 7)
 */
@Injectable()
export class GoalManagementService {
  private readonly logger = new Logger(GoalManagementService.name);

  // Storage de metas por caso
  private readonly goalsStore = new Map<string, AssistentialGoal[]>();

  constructor(
    private readonly timelineService: CaseTimelineService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Adiciona uma nova meta ao caso assistencial.
   */
  async addGoal(dto: AddGoalDto, tenantId = 'default'): Promise<AssistentialGoal> {
    const goalId = randomUUID();
    const now = new Date().toISOString();

    const goal: AssistentialGoal = {
      goalId,
      caseId: dto.caseId,
      title: dto.title,
      category: dto.category,
      completionPercentage: 0,
      status: 'PENDING',
      deadline: dto.deadline,
      createdAt: now,
      updatedAt: now,
    };

    const caseGoals = this.goalsStore.get(dto.caseId) ?? [];
    caseGoals.push(goal);
    this.goalsStore.set(dto.caseId, caseGoals);

    await this.timelineService.addEntry(
      dto.caseId,
      'GOAL_ADDED',
      `Meta Adicionada: ${dto.title}`,
      `Nova meta cadastrada na categoria ${dto.category}.`,
    );

    return goal;
  }

  /**
   * Atualiza a evolução percentual de uma meta.
   */
  async updateProgress(dto: UpdateGoalProgressDto, tenantId = 'default'): Promise<AssistentialGoal> {
    let targetGoal: AssistentialGoal | undefined;

    for (const goals of this.goalsStore.values()) {
      const g = goals.find((item) => item.goalId === dto.goalId);
      if (g) {
        targetGoal = g;
        break;
      }
    }

    if (!targetGoal) {
      throw new NotFoundException(`Meta ${dto.goalId} não encontrada.`);
    }

    targetGoal.completionPercentage = dto.completionPercentage;
    targetGoal.progressNotes = dto.progressNotes;
    targetGoal.updatedAt = new Date().toISOString();

    if (dto.completionPercentage >= 100) {
      targetGoal.status = 'COMPLETED';
      this.logger.log(`[GoalManagement] 🎯 Meta CONCLUÍDA: "${targetGoal.title}" (Caso: ${targetGoal.caseId})`);

      await this.timelineService.addEntry(
        targetGoal.caseId,
        'GOAL_COMPLETED',
        `Meta Concluída: ${targetGoal.title}`,
        `Meta atingiu 100% de conclusão. Notas: ${dto.progressNotes ?? 'Sem observações.'}`,
      );

      await this.eventBus.publish(
        'aura.case.goal.completed.v1',
        {
          goalId: targetGoal.goalId,
          caseId: targetGoal.caseId,
          title: targetGoal.title,
          category: targetGoal.category,
        },
        tenantId,
        { subject: targetGoal.caseId },
      );
    } else {
      targetGoal.status = 'IN_PROGRESS';
    }

    return targetGoal;
  }

  /**
   * Lista todas as metas de um caso.
   */
  async getGoalsForCase(caseId: string): Promise<AssistentialGoal[]> {
    return this.goalsStore.get(caseId) ?? [];
  }
}
