import { Injectable, Logger } from '@nestjs/common';
import { AlignBudgetDto } from '../dto/enterprise-strategy.dto';
import { StrategyAuditService } from './strategy-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface BudgetAllocation {
  allocationId: string;
  portfolioItemId: string;
  allocatedAmount: number;
  spentAmount: number;
  fundingSource: string;
  fiscalYear: number;
  utilizationRate: number; // 0–1
  alignedAt: string;
  updatedAt: string;
}

export interface BudgetScenario {
  scenarioId: string;
  name: string;
  description: string;
  totalBudget: number;
  allocations: Array<{ portfolioItemId: string; amount: number; percentage: number }>;
  createdAt: string;
}

/**
 * BudgetAlignmentService — P168 ESGP
 *
 * Integra estratégia e orçamento: relaciona objetivos, programas e despesas.
 * Permite rastrear receitas, captações, convênios e investimentos por objetivo.
 * Suporta simulação de cenários orçamentários.
 */
@Injectable()
export class BudgetAlignmentService {
  private readonly logger = new Logger(BudgetAlignmentService.name);
  private readonly allocations: Map<string, BudgetAllocation> = new Map();
  private readonly scenarios: Map<string, BudgetScenario> = new Map();

  constructor(
    private readonly auditSvc: StrategyAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async alignBudget(dto: AlignBudgetDto, alignedBy = 'SYSTEM'): Promise<BudgetAllocation> {
    const allocationId = `BUD-${dto.portfolioItemId}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const allocation: BudgetAllocation = {
      allocationId,
      portfolioItemId: dto.portfolioItemId,
      allocatedAmount: dto.allocatedAmount,
      spentAmount: 0,
      fundingSource: dto.fundingSource,
      fiscalYear: dto.fiscalYear ?? new Date().getFullYear(),
      utilizationRate: 0,
      alignedAt: now,
      updatedAt: now,
    };

    this.allocations.set(allocationId, allocation);

    await this.auditSvc.recordAudit('BUDGET_ALIGNED', allocationId, alignedBy, {
      portfolioItemId: dto.portfolioItemId,
      allocatedAmount: dto.allocatedAmount,
      fundingSource: dto.fundingSource,
    });

    await this.eventBus.publish(
      'aura.strategy.budget.aligned.v1',
      { allocationId, portfolioItemId: dto.portfolioItemId, allocatedAmount: dto.allocatedAmount },
      'ESGP',
      { subject: allocationId },
    );

    this.logger.log(`[BudgetAlignment] R$ ${dto.allocatedAmount.toLocaleString('pt-BR')} alocado para "${dto.portfolioItemId}"`);
    return allocation;
  }

  async recordExpenditure(allocationId: string, amount: number, recordedBy: string): Promise<BudgetAllocation> {
    const alloc = this.getAllocOrThrow(allocationId);
    alloc.spentAmount += amount;
    alloc.utilizationRate = alloc.allocatedAmount > 0 ? alloc.spentAmount / alloc.allocatedAmount : 0;
    alloc.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('EXPENDITURE_RECORDED', allocationId, recordedBy, {
      amount,
      spentAmount: alloc.spentAmount,
      utilizationRate: alloc.utilizationRate,
    });

    this.logger.log(`[BudgetAlignment] Despesa R$ ${amount.toLocaleString('pt-BR')} registrada — utilização: ${(alloc.utilizationRate * 100).toFixed(1)}%`);
    return alloc;
  }

  simulateScenario(
    name: string,
    description: string,
    totalBudget: number,
    weights: Record<string, number>, // portfolioItemId → peso 0–1
  ): BudgetScenario {
    const scenarioId = `SCN-${Date.now().toString(36).toUpperCase()}`;
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

    const allocations = Object.entries(weights).map(([portfolioItemId, weight]) => {
      const percentage = weight / totalWeight;
      return { portfolioItemId, amount: Math.round(totalBudget * percentage), percentage };
    });

    const scenario: BudgetScenario = {
      scenarioId,
      name,
      description,
      totalBudget,
      allocations,
      createdAt: new Date().toISOString(),
    };

    this.scenarios.set(scenarioId, scenario);
    this.logger.log(`[BudgetAlignment] Cenário "${scenarioId}" simulado — orçamento: R$ ${totalBudget.toLocaleString('pt-BR')}`);
    return scenario;
  }

  getBudgetSummary(fiscalYear?: number): Record<string, any> {
    const year = fiscalYear ?? new Date().getFullYear();
    const allocs = Array.from(this.allocations.values()).filter((a) => a.fiscalYear === year);
    const totalAllocated = allocs.reduce((s, a) => s + a.allocatedAmount, 0);
    const totalSpent = allocs.reduce((s, a) => s + a.spentAmount, 0);

    return {
      fiscalYear: year,
      totalAllocated,
      totalSpent,
      balance: totalAllocated - totalSpent,
      utilizationRate: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
      allocationCount: allocs.length,
    };
  }

  listAllocations(fiscalYear?: number): BudgetAllocation[] {
    const all = Array.from(this.allocations.values());
    return fiscalYear ? all.filter((a) => a.fiscalYear === fiscalYear) : all;
  }

  listScenarios(): BudgetScenario[] {
    return Array.from(this.scenarios.values());
  }

  private getAllocOrThrow(allocationId: string): BudgetAllocation {
    const a = this.allocations.get(allocationId);
    if (!a) throw new Error(`Alocação "${allocationId}" não encontrada.`);
    return a;
  }
}
