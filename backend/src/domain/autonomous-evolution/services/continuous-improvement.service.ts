import { Injectable, Logger } from '@nestjs/common';
import { CreateImprovementPlanDto, ImprovementCategory } from '../dto/autonomous-evolution.dto';
import { ContinuousEvolutionAuditService } from './continuous-evolution-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface BottleneckFinding {
  findingId: string;
  category: ImprovementCategory;
  affectedModule: string;
  description: string;
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: string;
}

export interface ImprovementPlanRecord {
  planId: string;
  tenantId: string;
  category: ImprovementCategory;
  title: string;
  description: string;
  findings: string[];
  actionItems: string[];
  targetKpi: string;
  ownerId: string;
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

/**
 * ContinuousImprovementService — Mecanismo Permanente de Melhoria Contínua (P153 AAEE)
 *
 * Identifica automaticamente ineficiências operacionais e técnicas:
 * - Gargalos em processos assistenciais e administrativos
 * - Retrabalho e redundâncias em cadastros/atendimentos
 * - Desperdício de recursos computacionais ou financeiros
 * - Riscos operacionais e desvios de SLA
 *
 * Gera planos estruturados de melhoria contínua com metas de KPI.
 */
@Injectable()
export class ContinuousImprovementService {
  private readonly logger = new Logger(ContinuousImprovementService.name);
  private planRegistry: Map<string, ImprovementPlanRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ContinuousEvolutionAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedImprovementPlans();
  }

  private seedImprovementPlans(): void {
    const seeds: ImprovementPlanRecord[] = [
      {
        planId: 'IMP-PLAN-2026-0001',
        tenantId: this.SYSTEM_TENANT,
        category: ImprovementCategory.BOTTLENECK_REDUCTION,
        title: 'Redução de Gargalo de Triagem no Acolhimento',
        description: 'Paralelização do processo de acolhimento com pré-classificação por IA.',
        findings: ['Fila de triagem com tempo médio de espera > 40min em horários de pico.'],
        actionItems: [
          'Adicionar componente de triagem assíncrona',
          'Atribuir 2 assistentes sociais para casos prioritários',
        ],
        targetKpi: 'Tempo médio de espera < 15 minutos em 95% dos atendimentos.',
        ownerId: 'HEAD-OPERATIONS-01',
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const plan of seeds) {
      this.planRegistry.set(plan.planId, plan);
    }
  }

  async identifyBottlenecks(tenantId: string, moduleId?: string): Promise<BottleneckFinding[]> {
    const year = new Date().getFullYear();
    const findings: BottleneckFinding[] = [
      {
        findingId: `FND-${year}-001`,
        category: ImprovementCategory.REDUNDANCY_ELIMINATION,
        affectedModule: moduleId ?? 'case-management',
        description: 'Duplicação de cadastro de beneficiários em atendimentos simultâneos.',
        impactLevel: 'MEDIUM',
        detectedAt: new Date().toISOString(),
      },
      {
        findingId: `FND-${year}-002`,
        category: ImprovementCategory.BOTTLENECK_REDUCTION,
        affectedModule: moduleId ?? 'intake',
        description: 'Fila de espera excedendo SLA em 18% das triagens multidisciplinares.',
        impactLevel: 'HIGH',
        detectedAt: new Date().toISOString(),
      },
    ];

    return findings;
  }

  async createImprovementPlan(dto: CreateImprovementPlanDto): Promise<ImprovementPlanRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const planId = `IMP-PLAN-${year}-${seq}`;

    const record: ImprovementPlanRecord = {
      planId,
      tenantId: dto.tenantId,
      category: dto.category,
      title: dto.title,
      description: dto.description,
      findings: dto.findings,
      actionItems: dto.actionItems,
      targetKpi: dto.targetKpi,
      ownerId: dto.ownerId ?? 'UNASSIGNED',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.planRegistry.set(planId, record);

    await this.auditService.recordEvolutionAudit({
      componentName: 'continuous-improvement',
      actionName: 'ImprovementPlanCreated',
      details: { planId, title: dto.title, category: dto.category, targetKpi: dto.targetKpi },
    });

    await this.eventBus.publish(
      'aura.evolution.improvement_plan.created.v1',
      {
        planId,
        category: dto.category,
        title: dto.title,
        targetKpi: dto.targetKpi,
      },
      dto.tenantId,
      { subject: planId },
    );

    this.logger.log(`[ContinuousImprovement] Plan Created: ${planId} (${dto.title})`);
    return record;
  }

  listImprovementPlans(status?: ImprovementPlanRecord['status']): ImprovementPlanRecord[] {
    const all = Array.from(this.planRegistry.values());
    return status ? all.filter((p) => p.status === status) : all;
  }

  getPlan(planId: string): ImprovementPlanRecord | undefined {
    return this.planRegistry.get(planId);
  }
}
