import { Injectable, Logger } from '@nestjs/common';
import {
  RegisterCriticalProcessDto,
  CriticalityLevel,
} from '../dto/business-continuity.dto';
import { ContinuityAuditService } from './continuity-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'ACTIVATED' | 'SUSPENDED';

export interface CriticalProcess {
  processId: string;
  name: string;
  criticality: CriticalityLevel;
  rtoHours: number;
  rpoHours: number;
  owner: string;
  dependencies: string[];
  continuityProcedure: string;
  isActivated: boolean;
  lastTestedAt?: string;
  registeredAt: string;
}

export interface BusinessContinuityPlan {
  planId: string;
  name: string;
  status: PlanStatus;
  processes: CriticalProcess[];
  activatedAt?: string;
  activatedBy?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * BusinessContinuityService — P169 BCORP
 *
 * Gestão do Plano Corporativo de Continuidade de Negócios (BCP).
 * Define processos críticos, RTO, RPO, dependências e procedimentos.
 * Permite ativação automática ou manual do plano de continuidade.
 */
@Injectable()
export class BusinessContinuityService {
  private readonly logger = new Logger(BusinessContinuityService.name);
  private readonly plans: Map<string, BusinessContinuityPlan> = new Map();
  private readonly processes: Map<string, CriticalProcess> = new Map();

  // Plano padrão do Instituto Ser Melhor
  private readonly DEFAULT_PLAN_ID = 'BCP-ISM-MASTER';

  constructor(
    private readonly auditSvc: ContinuityAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.initDefaultPlan();
  }

  private initDefaultPlan(): void {
    this.plans.set(this.DEFAULT_PLAN_ID, {
      planId: this.DEFAULT_PLAN_ID,
      name: 'Plano Mestre de Continuidade — Instituto Ser Melhor',
      status: 'ACTIVE',
      processes: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async registerCriticalProcess(dto: RegisterCriticalProcessDto, registeredBy = 'SYSTEM'): Promise<CriticalProcess> {
    const processId = `PROC-${dto.criticality}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const process: CriticalProcess = {
      processId,
      name: dto.name,
      criticality: dto.criticality,
      rtoHours: dto.rtoHours,
      rpoHours: dto.rpoHours,
      owner: dto.owner,
      dependencies: dto.dependencies ?? [],
      continuityProcedure: dto.continuityProcedure ?? 'Procedimento a ser definido.',
      isActivated: false,
      registeredAt: now,
    };

    this.processes.set(processId, process);

    // Adicionar ao plano master
    const plan = this.plans.get(this.DEFAULT_PLAN_ID)!;
    plan.processes.push(process);
    plan.version += 1;
    plan.updatedAt = now;

    await this.auditSvc.recordAudit('CRITICAL_PROCESS_REGISTERED', processId, registeredBy, {
      name: dto.name,
      criticality: dto.criticality,
      rtoHours: dto.rtoHours,
      rpoHours: dto.rpoHours,
    });

    this.logger.log(`[BusinessContinuity] Processo crítico "${processId}" registrado: ${dto.name} (${dto.criticality})`);
    return process;
  }

  async activatePlan(planId: string, activatedBy: string, reason: string): Promise<BusinessContinuityPlan> {
    const plan = this.getPlanOrThrow(planId);
    plan.status = 'ACTIVATED';
    plan.activatedAt = new Date().toISOString();
    plan.activatedBy = activatedBy;
    plan.updatedAt = plan.activatedAt;

    // Marcar todos os processos VITAL e CRITICAL como ativados
    plan.processes
      .filter((p) => p.criticality === CriticalityLevel.VITAL || p.criticality === CriticalityLevel.CRITICAL)
      .forEach((p) => { p.isActivated = true; });

    await this.auditSvc.recordAudit('BCP_ACTIVATED', planId, activatedBy, { reason, processesActivated: plan.processes.filter((p) => p.isActivated).length });

    await this.eventBus.publish(
      'aura.bcorp.continuity.activated.v1',
      { planId, activatedBy, reason, timestamp: plan.activatedAt },
      'BCORP',
      { subject: planId },
    );

    this.logger.warn(`[BusinessContinuity] ⚠️ PLANO DE CONTINUIDADE "${planId}" ATIVADO por ${activatedBy} — Motivo: ${reason}`);
    return plan;
  }

  async deactivatePlan(planId: string, deactivatedBy: string): Promise<BusinessContinuityPlan> {
    const plan = this.getPlanOrThrow(planId);
    plan.status = 'ACTIVE';
    plan.updatedAt = new Date().toISOString();
    plan.processes.forEach((p) => { p.isActivated = false; });

    await this.auditSvc.recordAudit('BCP_DEACTIVATED', planId, deactivatedBy, {});
    this.logger.log(`[BusinessContinuity] Plano "${planId}" desativado por ${deactivatedBy}.`);
    return plan;
  }

  async recordProcessTest(processId: string, result: 'PASS' | 'FAIL', testedBy: string): Promise<CriticalProcess> {
    const proc = this.getProcessOrThrow(processId);
    proc.lastTestedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('PROCESS_CONTINUITY_TESTED', processId, testedBy, { result });
    this.logger.log(`[BusinessContinuity] Teste do processo "${processId}": ${result}`);
    return proc;
  }

  getPlan(planId: string): BusinessContinuityPlan | undefined {
    return this.plans.get(planId);
  }

  getDefaultPlan(): BusinessContinuityPlan {
    return this.plans.get(this.DEFAULT_PLAN_ID)!;
  }

  listProcesses(criticality?: CriticalityLevel): CriticalProcess[] {
    const all = Array.from(this.processes.values());
    return criticality ? all.filter((p) => p.criticality === criticality) : all;
  }

  getProcessesExceedingRTO(elapsedHours: number): CriticalProcess[] {
    return Array.from(this.processes.values()).filter((p) => p.rtoHours < elapsedHours);
  }

  private getPlanOrThrow(planId: string): BusinessContinuityPlan {
    const p = this.plans.get(planId);
    if (!p) throw new Error(`Plano de continuidade "${planId}" não encontrado.`);
    return p;
  }

  private getProcessOrThrow(processId: string): CriticalProcess {
    const p = this.processes.get(processId);
    if (!p) throw new Error(`Processo crítico "${processId}" não encontrado.`);
    return p;
  }
}
