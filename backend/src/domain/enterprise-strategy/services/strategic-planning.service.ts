import { Injectable, Logger } from '@nestjs/common';
import {
  CreateStrategicPlanDto,
  StrategicPlanStatus,
} from '../dto/enterprise-strategy.dto';
import { StrategyAuditService } from './strategy-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface StrategicObjective {
  id: string;
  description: string;
  priority: number;
}

export interface StrategicPlan {
  planId: string;
  name: string;
  mission: string;
  vision: string;
  values: string[];
  principles: string[];
  objectives: StrategicObjective[];
  startYear: number;
  endYear: number;
  status: StrategicPlanStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  history: Array<{ version: number; snapshot: any; changedAt: string; changedBy: string }>;
}

/**
 * StrategicPlanningService — P168 ESGP
 *
 * Gerencia o planejamento estratégico institucional com versionamento completo.
 * Controla missão, visão, valores, princípios, objetivos e planos de ação.
 */
@Injectable()
export class StrategicPlanningService {
  private readonly logger = new Logger(StrategicPlanningService.name);
  private readonly plans: Map<string, StrategicPlan> = new Map();

  constructor(
    private readonly auditSvc: StrategyAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async createPlan(dto: CreateStrategicPlanDto, createdBy = 'SYSTEM'): Promise<StrategicPlan> {
    const planId = `SP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const now = new Date().toISOString();

    const plan: StrategicPlan = {
      planId,
      name: dto.name,
      mission: dto.mission,
      vision: dto.vision,
      values: dto.values ?? [],
      principles: dto.principles ?? [],
      objectives: [],
      startYear: dto.startYear,
      endYear: dto.endYear,
      status: StrategicPlanStatus.DRAFT,
      version: 1,
      createdAt: now,
      updatedAt: now,
      history: [],
    };

    this.plans.set(planId, plan);

    await this.auditSvc.recordAudit('STRATEGIC_PLAN_CREATED', planId, createdBy, {
      name: dto.name,
      startYear: dto.startYear,
      endYear: dto.endYear,
    });

    await this.eventBus.publish(
      'aura.strategy.objective.created.v1',
      { planId, name: dto.name, status: plan.status },
      'ESGP',
      { subject: planId },
    );

    this.logger.log(`[StrategicPlanning] Plano "${planId}" criado: ${dto.name}`);
    return plan;
  }

  async activatePlan(planId: string, activatedBy: string): Promise<StrategicPlan> {
    const plan = this.getPlanOrThrow(planId);
    this.snapshotVersion(plan, activatedBy);
    plan.status = StrategicPlanStatus.ACTIVE;
    plan.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('STRATEGIC_PLAN_ACTIVATED', planId, activatedBy, {});
    await this.eventBus.publish('aura.strategy.plan.activated.v1', { planId }, 'ESGP', { subject: planId });
    this.logger.log(`[StrategicPlanning] Plano "${planId}" ativado.`);
    return plan;
  }

  async addObjective(
    planId: string,
    description: string,
    priority: number,
    addedBy: string,
  ): Promise<StrategicObjective> {
    const plan = this.getPlanOrThrow(planId);
    const obj: StrategicObjective = {
      id: `OBJ-${Date.now().toString(36).toUpperCase()}`,
      description,
      priority,
    };
    plan.objectives.push(obj);
    plan.version += 1;
    plan.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('STRATEGIC_OBJECTIVE_ADDED', planId, addedBy, { description, priority });
    this.logger.log(`[StrategicPlanning] Objetivo "${obj.id}" adicionado ao plano "${planId}".`);
    return obj;
  }

  getPlan(planId: string): StrategicPlan | undefined {
    return this.plans.get(planId);
  }

  listPlans(status?: StrategicPlanStatus): StrategicPlan[] {
    const all = Array.from(this.plans.values());
    return status ? all.filter((p) => p.status === status) : all;
  }

  private getPlanOrThrow(planId: string): StrategicPlan {
    const p = this.plans.get(planId);
    if (!p) throw new Error(`Plano estratégico "${planId}" não encontrado.`);
    return p;
  }

  private snapshotVersion(plan: StrategicPlan, changedBy: string): void {
    plan.history.push({
      version: plan.version,
      snapshot: { ...plan, history: [] },
      changedAt: new Date().toISOString(),
      changedBy,
    });
    plan.version += 1;
  }
}
