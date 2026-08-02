import { Injectable, Logger } from '@nestjs/common';
import { CreateEvolutionPlanDto } from '../dto/enterprise-architecture.dto';
import { ArchitectureAuditService } from './architecture-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface EvolutionMilestone {
  milestoneId: string;
  title: string;
  targetQuarter: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  affectedComponents: string[];
  owner: string;
  plannedAt: string;
  completedAt?: string;
}

/**
 * ArchitectureEvolutionService — P171 EAGO
 *
 * Gestão da Evolução Arquitetural Contínua.
 * Controla o roadmap de evolução, transições tecnológicas, refatorações,
 * migrações graduais e depreciação controlada sem romper a compatibilidade.
 */
@Injectable()
export class ArchitectureEvolutionService {
  private readonly logger = new Logger(ArchitectureEvolutionService.name);
  private readonly milestones: Map<string, EvolutionMilestone> = new Map();

  constructor(
    private readonly auditSvc: ArchitectureAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async planEvolution(dto: CreateEvolutionPlanDto, plannedBy = 'SYSTEM'): Promise<EvolutionMilestone> {
    const milestoneId = `EVO-${dto.targetQuarter}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const milestone: EvolutionMilestone = {
      milestoneId,
      title: dto.title,
      targetQuarter: dto.targetQuarter,
      status: 'PLANNED',
      affectedComponents: dto.affectedComponents ?? [],
      owner: dto.owner ?? plannedBy,
      plannedAt: now,
    };

    this.milestones.set(milestoneId, milestone);

    await this.auditSvc.recordAudit('ARCHITECTURE_EVOLUTION_PLANNED', milestoneId, plannedBy, {
      title: dto.title,
      targetQuarter: dto.targetQuarter,
      componentsCount: milestone.affectedComponents.length,
    });

    await this.eventBus.publish(
      'aura.eago.architecture.evolution.planned.v1',
      { milestoneId, title: dto.title, targetQuarter: dto.targetQuarter, owner: milestone.owner },
      'EAGO',
      { subject: milestoneId },
    );

    this.logger.log(`[ArchitectureEvolution] Marco de evolução "${milestoneId}" planejado para ${dto.targetQuarter}: "${dto.title}"`);
    return milestone;
  }

  async markMilestoneCompleted(milestoneId: string, completedBy: string): Promise<EvolutionMilestone> {
    const milestone = this.getOrThrow(milestoneId);
    milestone.status = 'COMPLETED';
    milestone.completedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('EVOLUTION_MILESTONE_COMPLETED', milestoneId, completedBy, {});
    this.logger.log(`[ArchitectureEvolution] ✅ Marco de evolução "${milestoneId}" concluído por ${completedBy}.`);
    return milestone;
  }

  getMilestone(milestoneId: string): EvolutionMilestone | undefined {
    return this.milestones.get(milestoneId);
  }

  listRoadmap(): EvolutionMilestone[] {
    return Array.from(this.milestones.values()).sort((a, b) => a.targetQuarter.localeCompare(b.targetQuarter));
  }

  private getOrThrow(milestoneId: string): EvolutionMilestone {
    const m = this.milestones.get(milestoneId);
    if (!m) throw new Error(`Marco de evolução "${milestoneId}" não encontrado.`);
    return m;
  }
}
