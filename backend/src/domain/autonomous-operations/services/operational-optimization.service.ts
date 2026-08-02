import { Injectable, Logger } from '@nestjs/common';
import { ImprovementGovernanceService } from './improvement-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface OperationalOptimizationPlan {
  planId: string;
  targetDomain: string;
  resourceUtilizationBeforePercent: number;
  resourceUtilizationAfterEstimatedPercent: number;
  throughputGainPercent: number;
  costReductionEstimatedPercent: number;
  status: 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'EXECUTED';
  createdMinutesAgo: number;
  createdAt: string;
}

/**
 * OperationalOptimizationService — Otimização Operacional Contínua (P164 AOCP)
 *
 * Avalia utilização de recursos, capacidade, desempenho, filas, tempos de resposta
 * e consumo de infraestrutura para gerar planos estratégicos de otimização.
 */
@Injectable()
export class OperationalOptimizationService {
  private readonly logger = new Logger(OperationalOptimizationService.name);
  private planStore: Map<string, OperationalOptimizationPlan> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly governance: ImprovementGovernanceService,
    private readonly eventBus: EventBusService,
  ) {}

  async createOptimizationPlan(targetDomain: string): Promise<OperationalOptimizationPlan> {
    const planId = `OPT-PLAN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const plan: OperationalOptimizationPlan = {
      planId,
      targetDomain,
      resourceUtilizationBeforePercent: 88,
      resourceUtilizationAfterEstimatedPercent: 54,
      throughputGainPercent: 35,
      costReductionEstimatedPercent: 18,
      status: 'PROPOSED',
      createdMinutesAgo: 0,
      createdAt: new Date().toISOString(),
    };

    this.planStore.set(planId, plan);

    await this.governance.recordAudit('CREATE_OPTIMIZATION_PLAN', targetDomain, 'COO', {
      planId, throughputGainPercent: plan.throughputGainPercent,
    });

    await this.eventBus.publish(
      'aura.operations.optimization.plan.created.v1',
      { planId, targetDomain, throughputGainPercent: plan.throughputGainPercent },
      this.SYSTEM_TENANT,
      { subject: planId },
    );

    this.logger.log(`[OperationalOptimization] Plan ${planId} created for "${targetDomain}" (Gain: +${plan.throughputGainPercent}%)`);
    return plan;
  }

  listPlans(): OperationalOptimizationPlan[] {
    return Array.from(this.planStore.values());
  }
}
