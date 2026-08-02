import { Injectable, Logger } from '@nestjs/common';
import { OKRManagementService } from './okr-management.service';
import { InstitutionalKpiService } from './institutional-kpi.service';
import { StrategicPortfolioService } from './strategic-portfolio.service';
import { BudgetAlignmentService } from './budget-alignment.service';
import { StrategicRiskService } from './strategic-risk.service';
import { BalancedScorecardService } from './balanced-scorecard.service';
import { StrategyAuditService } from './strategy-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface PerformanceSnapshot {
  snapshotId: string;
  generatedAt: string;
  strategicExecution: {
    activePlans: number;
    activeOKRs: number;
    okrCompletionRate: number;
    averageOKRProgress: number;
    atRiskOKRs: number;
  };
  kpiPerformance: {
    totalKPIs: number;
    onTarget: number;
    belowTarget: number;
    belowMin: number;
    stretchAchieved: number;
  };
  portfolioHealth: {
    totalItems: number;
    inProgress: number;
    completed: number;
    budgetUtilization: number;
  };
  riskExposure: {
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    openRisks: number;
  };
  budgetHealth: {
    totalAllocated: number;
    totalSpent: number;
    utilizationRate: number;
  };
  overallPerformanceIndex: number; // 0–100
  aiRecommendations: string[];
  evaluatedAt: string;
}

/**
 * PerformanceEvaluationService — P168 ESGP
 *
 * Avaliação contínua da execução estratégica com IA preditiva.
 * Consolida OKRs, KPIs, portfólio, riscos e orçamento em um
 * índice único de desempenho com recomendações automáticas.
 */
@Injectable()
export class PerformanceEvaluationService {
  private readonly logger = new Logger(PerformanceEvaluationService.name);
  private readonly snapshots: PerformanceSnapshot[] = [];

  constructor(
    private readonly okrSvc: OKRManagementService,
    private readonly kpiSvc: InstitutionalKpiService,
    private readonly portfolioSvc: StrategicPortfolioService,
    private readonly budgetSvc: BudgetAlignmentService,
    private readonly riskSvc: StrategicRiskService,
    private readonly bscSvc: BalancedScorecardService,
    private readonly auditSvc: StrategyAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async evaluatePerformance(evaluatedBy = 'SYSTEM'): Promise<PerformanceSnapshot> {
    // OKR metrics
    const allOKRs = this.okrSvc.listOKRs();
    const activeOKRs = allOKRs.filter((o) => o.status === 'ACTIVE');
    const completedOKRs = allOKRs.filter((o) => o.status === 'COMPLETED');
    const atRiskOKRs = allOKRs.filter((o) => o.status === 'AT_RISK');
    const avgOKRProgress = activeOKRs.length
      ? activeOKRs.reduce((s, o) => s + o.overallProgress, 0) / activeOKRs.length
      : 0;
    const okrCompletion = allOKRs.length ? completedOKRs.length / allOKRs.length : 0;

    // KPI metrics
    const allKPIs = this.kpiSvc.listKPIs();
    let kpiOnTarget = 0, kpiBelowTarget = 0, kpiBelowMin = 0, kpiStretch = 0;
    for (const kpi of allKPIs) {
      if (kpi.currentValue === undefined) continue;
      const { status } = this.kpiSvc.assessTarget(kpi.kpiId);
      if (status === 'STRETCH_ACHIEVED') kpiStretch++;
      else if (status === 'ON_TARGET') kpiOnTarget++;
      else if (status === 'BELOW_TARGET') kpiBelowTarget++;
      else kpiBelowMin++;
    }

    // Portfolio metrics
    const portfolioSummary = this.portfolioSvc.getPortfolioSummary();

    // Risk metrics
    const allRisks = this.riskSvc.listRisks();
    const criticalRisks = allRisks.filter((r) => r.riskLevel === 'CRITICAL').length;
    const highRisks = allRisks.filter((r) => r.riskLevel === 'HIGH').length;
    const openRisks = allRisks.filter((r) => r.status === 'OPEN').length;

    // Budget metrics
    const budgetSummary = this.budgetSvc.getBudgetSummary();

    // Overall Performance Index (0–100)
    const opi = this.calculateOPI(avgOKRProgress, okrCompletion, kpiOnTarget + kpiStretch, allKPIs.length, criticalRisks, portfolioSummary.budgetUtilization);

    // AI-powered recommendations
    const recommendations = this.generateRecommendations(avgOKRProgress, criticalRisks, kpiBelowMin, portfolioSummary.budgetUtilization);

    const snapshotId = `PERF-${Date.now().toString(36).toUpperCase()}`;
    const snapshot: PerformanceSnapshot = {
      snapshotId,
      generatedAt: new Date().toISOString(),
      strategicExecution: {
        activePlans: 0,
        activeOKRs: activeOKRs.length,
        okrCompletionRate: Math.round(okrCompletion * 100),
        averageOKRProgress: Math.round(avgOKRProgress * 100),
        atRiskOKRs: atRiskOKRs.length,
      },
      kpiPerformance: {
        totalKPIs: allKPIs.length,
        onTarget: kpiOnTarget,
        belowTarget: kpiBelowTarget,
        belowMin: kpiBelowMin,
        stretchAchieved: kpiStretch,
      },
      portfolioHealth: {
        totalItems: portfolioSummary.total,
        inProgress: portfolioSummary.byStatus?.IN_PROGRESS ?? 0,
        completed: portfolioSummary.byStatus?.COMPLETED ?? 0,
        budgetUtilization: portfolioSummary.budgetUtilization,
      },
      riskExposure: {
        totalRisks: allRisks.length,
        criticalRisks,
        highRisks,
        openRisks,
      },
      budgetHealth: {
        totalAllocated: budgetSummary.totalAllocated,
        totalSpent: budgetSummary.totalSpent,
        utilizationRate: budgetSummary.utilizationRate,
      },
      overallPerformanceIndex: opi,
      aiRecommendations: recommendations,
      evaluatedAt: new Date().toISOString(),
    };

    this.snapshots.push(snapshot);

    await this.auditSvc.recordAudit('PERFORMANCE_EVALUATED', snapshotId, evaluatedBy, {
      overallPerformanceIndex: opi,
      criticalRisks,
      atRiskOKRs: atRiskOKRs.length,
    });

    await this.eventBus.publish(
      'aura.strategy.performance.evaluated.v1',
      { snapshotId, overallPerformanceIndex: opi, recommendations: recommendations.length },
      'ESGP',
      { subject: snapshotId },
    );

    this.logger.log(`[PerformanceEvaluation] Snapshot "${snapshotId}" — OPI: ${opi}/100`);
    return snapshot;
  }

  getLatestSnapshot(): PerformanceSnapshot | undefined {
    return this.snapshots[this.snapshots.length - 1];
  }

  listSnapshots(): PerformanceSnapshot[] {
    return [...this.snapshots];
  }

  private calculateOPI(
    avgOKRProgress: number,
    okrCompletion: number,
    kpiOnTargetCount: number,
    totalKPIs: number,
    criticalRisks: number,
    budgetUtilization: number,
  ): number {
    const okrScore = ((avgOKRProgress + okrCompletion) / 2) * 40;
    const kpiScore = totalKPIs > 0 ? (kpiOnTargetCount / totalKPIs) * 30 : 15;
    const riskPenalty = criticalRisks * 5;
    const budgetScore = Math.abs(budgetUtilization - 80) < 20 ? 20 : 10; // Ideal: 70–90%
    return Math.max(0, Math.round(okrScore + kpiScore - riskPenalty + budgetScore));
  }

  private generateRecommendations(
    avgProgress: number,
    criticalRisks: number,
    kpiBelowMin: number,
    budgetUtilization: number,
  ): string[] {
    const recs: string[] = [];
    if (avgProgress < 0.4) recs.push('Progresso médio dos OKRs crítico — revisar planos de execução e remover impedimentos.');
    if (criticalRisks > 0) recs.push(`${criticalRisks} risco(s) crítico(s) identificado(s) — acionar plano de resposta imediatamente.`);
    if (kpiBelowMin > 0) recs.push(`${kpiBelowMin} KPI(s) abaixo do mínimo aceitável — investigar causas e propor ações corretivas.`);
    if (budgetUtilization > 95) recs.push('Utilização orçamentária acima de 95% — avaliar realocação ou captação de recursos emergencial.');
    if (budgetUtilization < 30) recs.push('Baixa execução orçamentária — verificar gargalos de contratação e execução de projetos.');
    if (recs.length === 0) recs.push('Execução estratégica dentro dos parâmetros esperados. Manter cadência de revisão trimestral.');
    return recs;
  }
}
