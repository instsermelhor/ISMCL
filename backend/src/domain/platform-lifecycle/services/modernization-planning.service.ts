import { Injectable, Logger } from '@nestjs/common';
import { CreateModernizationPlanDto, ModernizationStrategy } from '../dto/platform-lifecycle.dto';
import { LifecycleAuditService } from './lifecycle-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ModernizationPlanRecord {
  planId: string;
  title: string;
  strategy: ModernizationStrategy;
  rationale: string;
  affectedComponents: string[];
  estimatedDurationHours: number;
  estimatedRoiPercent: number;
  scheduledQuarter: string;
  status: 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
}

/**
 * ModernizationPlanningService — Planejamento de Modernização (P162 EPLM)
 *
 * Cria planos de refatoração, substituição de componentes, atualização
 * de frameworks, migração de infraestrutura, evolução de APIs e modernização
 * de modelos de IA com cronograma e análise de impactos.
 */
@Injectable()
export class ModernizationPlanningService {
  private readonly logger = new Logger(ModernizationPlanningService.name);
  private planStore: Map<string, ModernizationPlanRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: LifecycleAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedPlans();
  }

  private seedPlans(): void {
    const seedPlan: ModernizationPlanRecord = {
      planId: `MOD-${Date.now()}-SEED`,
      title: 'Migração para Node.js 22 LTS',
      strategy: ModernizationStrategy.REPLATFORM,
      rationale: 'Node 22 LTS provê V8 12.x, melhorias de performance até 15% e ESM nativo',
      affectedComponents: ['ALL_MICROSERVICES'],
      estimatedDurationHours: 40,
      estimatedRoiPercent: 15,
      scheduledQuarter: '2026-Q3',
      status: 'PROPOSED',
      createdAt: new Date().toISOString(),
    };
    this.planStore.set(seedPlan.planId, seedPlan);
  }

  async createModernizationPlan(dto: CreateModernizationPlanDto): Promise<ModernizationPlanRecord> {
    const planId = `MOD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const record: ModernizationPlanRecord = {
      planId,
      title: dto.title,
      strategy: dto.strategy,
      rationale: dto.rationale,
      affectedComponents: dto.affectedComponents ?? [],
      estimatedDurationHours: dto.estimatedDurationHours ?? 40,
      estimatedRoiPercent: 20,
      scheduledQuarter: '2026-Q4',
      status: 'PROPOSED',
      createdAt: new Date().toISOString(),
    };

    this.planStore.set(planId, record);

    await this.audit.record('CREATE_MODERNIZATION_PLAN', dto.title, 'CEA', {
      strategy: dto.strategy, affectedComponents: dto.affectedComponents,
    });

    await this.eventBus.publish(
      'aura.lifecycle.modernization.plan.created.v1',
      { planId, title: dto.title, strategy: dto.strategy },
      this.SYSTEM_TENANT,
      { subject: planId },
    );

    this.logger.log(`[ModernizationPlanning] Plan created: ${planId} — ${dto.title}`);
    return record;
  }

  listPlans(): ModernizationPlanRecord[] {
    return Array.from(this.planStore.values());
  }
}
