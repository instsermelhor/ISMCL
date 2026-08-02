import { Injectable, Logger } from '@nestjs/common';
import { StrategicPlanningService } from './strategic-planning.service';
import { OKRManagementService } from './okr-management.service';
import { BalancedScorecardService } from './balanced-scorecard.service';
import { InstitutionalKpiService } from './institutional-kpi.service';
import { StrategicPortfolioService } from './strategic-portfolio.service';
import { BudgetAlignmentService } from './budget-alignment.service';
import { StrategicRiskService } from './strategic-risk.service';
import { PerformanceEvaluationService } from './performance-evaluation.service';
import { StrategyAuditService } from './strategy-audit.service';

export interface ESGPExecutiveDashboard {
  generatedAt: string;
  strategicPlanning: {
    totalPlans: number;
    activePlans: number;
    objectives: number;
  };
  okrSummary: {
    total: number;
    active: number;
    completed: number;
    atRisk: number;
    avgProgress: number;
  };
  kpiSummary: {
    total: number;
    onTarget: number;
    belowMin: number;
    stretchAchieved: number;
  };
  portfolioSummary: {
    total: number;
    inProgress: number;
    completed: number;
    budgetUtilization: number;
  };
  riskSummary: {
    total: number;
    critical: number;
    high: number;
    heatmap: Record<string, number>;
  };
  budgetSummary: {
    totalAllocated: number;
    totalSpent: number;
    utilizationRate: number;
    balance: number;
  };
  bscSummary: {
    totalObjectives: number;
    scorecards: number;
  };
  latestPerformanceIndex: number;
  aiRecommendations: string[];
  auditEventsCount: number;
}

/**
 * ExecutiveDashboardService — P168 ESGP
 *
 * Dashboard executivo consolidando todos os indicadores da plataforma
 * de estratégia, governança e performance para tomada de decisão da liderança.
 */
@Injectable()
export class ExecutiveDashboardService {
  private readonly logger = new Logger(ExecutiveDashboardService.name);

  constructor(
    private readonly planSvc: StrategicPlanningService,
    private readonly okrSvc: OKRManagementService,
    private readonly bscSvc: BalancedScorecardService,
    private readonly kpiSvc: InstitutionalKpiService,
    private readonly portfolioSvc: StrategicPortfolioService,
    private readonly budgetSvc: BudgetAlignmentService,
    private readonly riskSvc: StrategicRiskService,
    private readonly perfSvc: PerformanceEvaluationService,
    private readonly auditSvc: StrategyAuditService,
  ) {}

  getDashboard(): ESGPExecutiveDashboard {
    const plans = this.planSvc.listPlans();
    const activePlans = plans.filter((p) => p.status === 'ACTIVE');
    const totalObjectives = plans.reduce((s, p) => s + p.objectives.length, 0);

    const allOKRs = this.okrSvc.listOKRs();
    const activeOKRs = allOKRs.filter((o) => o.status === 'ACTIVE');
    const avgProgress = activeOKRs.length
      ? Math.round((activeOKRs.reduce((s, o) => s + o.overallProgress, 0) / activeOKRs.length) * 100)
      : 0;

    const allKPIs = this.kpiSvc.listKPIs();
    let kpiOnTarget = 0, kpiBelowMin = 0, kpiStretch = 0;
    for (const kpi of allKPIs) {
      if (kpi.currentValue === undefined) continue;
      const { status } = this.kpiSvc.assessTarget(kpi.kpiId);
      if (status === 'STRETCH_ACHIEVED') kpiStretch++;
      else if (status === 'ON_TARGET') kpiOnTarget++;
      else if (status === 'BELOW_MIN') kpiBelowMin++;
    }

    const portfolioSummary = this.portfolioSvc.getPortfolioSummary();
    const allRisks = this.riskSvc.listRisks();
    const budgetSummary = this.budgetSvc.getBudgetSummary();
    const bscObjectives = this.bscSvc.listObjectives();
    const bscScorecards = this.bscSvc.listScorecards();
    const latestPerf = this.perfSvc.getLatestSnapshot();
    const auditCount = this.auditSvc.getAuditTrail().length;

    const dashboard: ESGPExecutiveDashboard = {
      generatedAt: new Date().toISOString(),
      strategicPlanning: {
        totalPlans: plans.length,
        activePlans: activePlans.length,
        objectives: totalObjectives,
      },
      okrSummary: {
        total: allOKRs.length,
        active: activeOKRs.length,
        completed: allOKRs.filter((o) => o.status === 'COMPLETED').length,
        atRisk: allOKRs.filter((o) => o.status === 'AT_RISK').length,
        avgProgress,
      },
      kpiSummary: {
        total: allKPIs.length,
        onTarget: kpiOnTarget + kpiStretch,
        belowMin: kpiBelowMin,
        stretchAchieved: kpiStretch,
      },
      portfolioSummary: {
        total: portfolioSummary.total,
        inProgress: portfolioSummary.byStatus?.IN_PROGRESS ?? 0,
        completed: portfolioSummary.byStatus?.COMPLETED ?? 0,
        budgetUtilization: portfolioSummary.budgetUtilization,
      },
      riskSummary: {
        total: allRisks.length,
        critical: allRisks.filter((r) => r.riskLevel === 'CRITICAL').length,
        high: allRisks.filter((r) => r.riskLevel === 'HIGH').length,
        heatmap: this.riskSvc.getRiskHeatmap(),
      },
      budgetSummary: {
        totalAllocated: budgetSummary.totalAllocated,
        totalSpent: budgetSummary.totalSpent,
        utilizationRate: budgetSummary.utilizationRate,
        balance: budgetSummary.balance,
      },
      bscSummary: {
        totalObjectives: bscObjectives.length,
        scorecards: bscScorecards.length,
      },
      latestPerformanceIndex: latestPerf?.overallPerformanceIndex ?? 0,
      aiRecommendations: latestPerf?.aiRecommendations ?? [],
      auditEventsCount: auditCount,
    };

    this.logger.log(
      `[ExecutiveDashboard] Gerado — OPI: ${dashboard.latestPerformanceIndex}, OKRs ativos: ${dashboard.okrSummary.active}, KPIs: ${dashboard.kpiSummary.total}`,
    );
    return dashboard;
  }
}
