import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { StrategyAuditService } from './strategy-audit.service';
import { StrategicPlanningService } from './strategic-planning.service';
import { OKRManagementService } from './okr-management.service';
import { BalancedScorecardService } from './balanced-scorecard.service';
import { InstitutionalKpiService } from './institutional-kpi.service';
import { StrategicPortfolioService } from './strategic-portfolio.service';
import { BudgetAlignmentService } from './budget-alignment.service';
import { StrategicRiskService } from './strategic-risk.service';
import { PerformanceEvaluationService } from './performance-evaluation.service';
import { ExecutiveDashboardService } from './executive-dashboard.service';

import {
  OKRLevel,
  OKRStatus,
  BscPerspective,
  KpiCategory,
  KpiPeriodicity,
  PortfolioItemType,
  StrategicRiskCategory,
  StrategicRiskLevel,
} from '../dto/enterprise-strategy.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

describe('P168 ESGP — Enterprise Strategy, Governance & Performance Platform', () => {
  let auditSvc: StrategyAuditService;
  let planSvc: StrategicPlanningService;
  let okrSvc: OKRManagementService;
  let bscSvc: BalancedScorecardService;
  let kpiSvc: InstitutionalKpiService;
  let portfolioSvc: StrategicPortfolioService;
  let budgetSvc: BudgetAlignmentService;
  let riskSvc: StrategicRiskService;
  let perfSvc: PerformanceEvaluationService;
  let dashboardSvc: ExecutiveDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategyAuditService,
        StrategicPlanningService,
        OKRManagementService,
        BalancedScorecardService,
        InstitutionalKpiService,
        StrategicPortfolioService,
        BudgetAlignmentService,
        StrategicRiskService,
        PerformanceEvaluationService,
        ExecutiveDashboardService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get(StrategyAuditService);
    planSvc = module.get(StrategicPlanningService);
    okrSvc = module.get(OKRManagementService);
    bscSvc = module.get(BalancedScorecardService);
    kpiSvc = module.get(InstitutionalKpiService);
    portfolioSvc = module.get(StrategicPortfolioService);
    budgetSvc = module.get(BudgetAlignmentService);
    riskSvc = module.get(StrategicRiskService);
    perfSvc = module.get(PerformanceEvaluationService);
    dashboardSvc = module.get(ExecutiveDashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── StrategyAuditService ───────────────────────────────────────────────────
  describe('StrategyAuditService', () => {
    it('deve registrar auditoria com SHA-256 válido', async () => {
      const entry = await auditSvc.recordAudit('PLAN_CREATED', 'SP-001', 'CEO', { test: true });
      expect(entry.auditId).toMatch(/^ESGP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
      expect(entry.action).toBe('PLAN_CREATED');
    });

    it('deve filtrar trilha por subject', async () => {
      await auditSvc.recordAudit('ACT_A', 'subj-x', 'CEO', {});
      await auditSvc.recordAudit('ACT_B', 'subj-y', 'CEO', {});
      const trail = auditSvc.getAuditTrail('subj-x');
      expect(trail.every((e) => e.subject === 'subj-x')).toBe(true);
    });
  });

  // ── StrategicPlanningService ───────────────────────────────────────────────
  describe('StrategicPlanningService', () => {
    it('deve criar plano estratégico', async () => {
      const plan = await planSvc.createPlan({
        name: 'Plano ISM 2024–2027',
        mission: 'Promover desenvolvimento humano',
        vision: 'Ser referência nacional',
        startYear: 2024,
        endYear: 2027,
      });
      expect(plan.planId).toMatch(/^SP-/);
      expect(plan.status).toBe('DRAFT');
      expect(plan.version).toBe(1);
    });

    it('deve ativar plano e incrementar versão', async () => {
      const plan = await planSvc.createPlan({
        name: 'Plano Teste',
        mission: 'Missão',
        vision: 'Visão',
        startYear: 2025,
        endYear: 2028,
      });
      const activated = await planSvc.activatePlan(plan.planId, 'CEO');
      expect(activated.status).toBe('ACTIVE');
      expect(activated.version).toBeGreaterThan(1);
    });

    it('deve adicionar objetivo estratégico ao plano', async () => {
      const plan = await planSvc.createPlan({
        name: 'P3',
        mission: 'M',
        vision: 'V',
        startYear: 2025,
        endYear: 2027,
      });
      const obj = await planSvc.addObjective(plan.planId, 'Ampliar atendimento 30%', 1, 'CEO');
      expect(obj.id).toMatch(/^OBJ-/);
      const updated = planSvc.getPlan(plan.planId);
      expect(updated?.objectives).toHaveLength(1);
    });
  });

  // ── OKRManagementService ───────────────────────────────────────────────────
  describe('OKRManagementService', () => {
    it('deve criar OKR com Key Results', async () => {
      const okr = await okrSvc.createOKR({
        objective: 'Ampliar cobertura psicossocial',
        level: OKRLevel.INSTITUTIONAL,
        cycle: 'Q1-2025',
        owner: 'Diretoria',
        keyResults: [
          { description: '1.200 atendimentos/mês', target: 1200, unit: 'atendimentos' },
          { description: '90% satisfação', target: 90, unit: '%' },
        ],
      });
      expect(okr.okrId).toMatch(/^OKR-/);
      expect(okr.keyResults).toHaveLength(2);
      expect(okr.overallProgress).toBe(0);
    });

    it('deve atualizar progresso e recalcular automaticamente', async () => {
      const okr = await okrSvc.createOKR({
        objective: 'Obj teste',
        level: OKRLevel.TEAM,
        cycle: 'Q2-2025',
        owner: 'Equipe',
        keyResults: [{ description: 'Meta KR1', target: 100, unit: 'un' }],
      });
      await okrSvc.activateOKR(okr.okrId, 'MANAGER');
      const updated = await okrSvc.updateProgress({
        okrId: okr.okrId,
        keyResultId: okr.keyResults[0].id,
        currentValue: 60,
      });
      expect(updated.overallProgress).toBeCloseTo(0.6);
    });

    it('deve marcar OKR como COMPLETED ao atingir 100%', async () => {
      const okr = await okrSvc.createOKR({
        objective: 'Obj completo',
        level: OKRLevel.COORDINATION,
        cycle: 'Q3-2025',
        owner: 'Coord',
        keyResults: [{ description: 'KR', target: 100, unit: 'un' }],
      });
      await okrSvc.activateOKR(okr.okrId, 'MGR');
      const completed = await okrSvc.updateProgress({
        okrId: okr.okrId,
        keyResultId: okr.keyResults[0].id,
        currentValue: 100,
      });
      expect(completed.status).toBe(OKRStatus.COMPLETED);
    });

    it('deve listar OKRs por nível', async () => {
      await okrSvc.createOKR({ objective: 'OKR Institucional', level: OKRLevel.INSTITUTIONAL, cycle: 'Q1', owner: 'CEO', keyResults: [] });
      await okrSvc.createOKR({ objective: 'OKR Equipe', level: OKRLevel.TEAM, cycle: 'Q1', owner: 'Team', keyResults: [] });
      const institutional = okrSvc.listOKRs(OKRLevel.INSTITUTIONAL);
      expect(institutional.every((o) => o.level === OKRLevel.INSTITUTIONAL)).toBe(true);
    });
  });

  // ── BalancedScorecardService ───────────────────────────────────────────────
  describe('BalancedScorecardService', () => {
    it('deve criar objetivo BSC por perspectiva', async () => {
      const obj = await bscSvc.createObjective({
        description: 'Maximizar impacto social por beneficiário',
        perspective: BscPerspective.BENEFICIARIES,
        strategicPlanId: 'SP-001',
      });
      expect(obj.bscObjId).toMatch(/^BSC-/);
      expect(obj.perspective).toBe(BscPerspective.BENEFICIARIES);
    });

    it('deve pontuar objetivo e gerar scorecard', async () => {
      const obj = await bscSvc.createObjective({
        description: 'Processos de atendimento ágeis',
        perspective: BscPerspective.INTERNAL_PROCESSES,
        strategicPlanId: 'SP-001',
      });
      await bscSvc.scoreObjective(obj.bscObjId, 75, 'CEO');
      const scorecard = bscSvc.generateScorecard('SP-001', 'Scorecard 2025');
      expect(scorecard.scorecardId).toMatch(/^SC-/);
      expect(scorecard.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('deve listar objetivos por perspectiva', () => {
      const objs = bscSvc.listObjectives(BscPerspective.BENEFICIARIES);
      expect(Array.isArray(objs)).toBe(true);
    });
  });

  // ── InstitutionalKpiService ────────────────────────────────────────────────
  describe('InstitutionalKpiService', () => {
    it('deve criar KPI com metadados completos', async () => {
      const kpi = await kpiSvc.createKPI({
        name: 'Taxa de Reinserção Social',
        category: KpiCategory.SOCIAL_IMPACT,
        formula: '(Reinsertos / Total) * 100',
        periodicity: KpiPeriodicity.MONTHLY,
        owner: 'Coordenação de Impacto',
        dataSource: 'Sistema de Casos',
        unit: '%',
        targets: { min: 40, target: 65, stretch: 80 },
      });
      expect(kpi.kpiId).toMatch(/^KPI-SOCIAL_IMPACT-/);
      expect(kpi.targets.target).toBe(65);
    });

    it('deve registrar valor e calcular tendência', async () => {
      const kpi = await kpiSvc.createKPI({
        name: 'Atendimentos Mensais',
        category: KpiCategory.CARE,
        formula: 'SUM(atendimentos)',
        periodicity: KpiPeriodicity.MONTHLY,
        owner: 'Diretor Assistencial',
        dataSource: 'EHR',
        unit: 'atendimentos',
        targets: { min: 800, target: 1000, stretch: 1200 },
      });
      await kpiSvc.recordValue({ kpiId: kpi.kpiId, value: 850 });
      const updated = await kpiSvc.recordValue({ kpiId: kpi.kpiId, value: 920 });
      expect(updated.trend).toBe('UP');
      expect(updated.currentValue).toBe(920);
    });

    it('deve avaliar KPI em relação às metas', async () => {
      const kpi = await kpiSvc.createKPI({
        name: 'Satisfação Beneficiários',
        category: KpiCategory.SOCIAL_IMPACT,
        formula: 'AVG(nota)',
        periodicity: KpiPeriodicity.QUARTERLY,
        owner: 'Coord. Qualidade',
        dataSource: 'NPS Sistema',
        unit: '%',
        targets: { min: 60, target: 80, stretch: 95 },
      });
      await kpiSvc.recordValue({ kpiId: kpi.kpiId, value: 85 });
      const assessment = kpiSvc.assessTarget(kpi.kpiId);
      expect(assessment.status).toBe('ON_TARGET');
    });
  });

  // ── StrategicPortfolioService ──────────────────────────────────────────────
  describe('StrategicPortfolioService', () => {
    it('deve adicionar item ao portfólio com score de prioridade', async () => {
      const item = await portfolioSvc.addItem({
        name: 'Prog. Saúde Mental Comunitária',
        type: PortfolioItemType.PROGRAM,
        description: 'Ampliar acesso a SM',
        linkedOkrId: 'OKR-001',
        budget: 200000,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });
      expect(item.itemId).toMatch(/^PF-PROGRAM-/);
      expect(item.priorityScore).toBeGreaterThan(0);
    });

    it('deve atualizar progresso e status automaticamente', async () => {
      const item = await portfolioSvc.addItem({
        name: 'Proj. ERP Social Módulo II',
        type: PortfolioItemType.PROJECT,
        description: 'Módulo II',
        linkedOkrId: 'OKR-002',
        budget: 80000,
      });
      const updated = await portfolioSvc.updateProgress(item.itemId, 0.5, 40000, 'PM');
      expect(updated.progress).toBe(0.5);
      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('deve repriorizar portfólio automaticamente', async () => {
      await portfolioSvc.addItem({ name: 'P1', type: PortfolioItemType.PROJECT, description: 'd', linkedOkrId: 'o1', budget: 1000 });
      await portfolioSvc.addItem({ name: 'P2', type: PortfolioItemType.PROGRAM, description: 'd', linkedOkrId: 'o2', budget: 5000 });
      const sorted = await portfolioSvc.reprioritize();
      expect(sorted[0].priorityScore).toBeGreaterThanOrEqual(sorted[sorted.length - 1].priorityScore);
    });
  });

  // ── BudgetAlignmentService ─────────────────────────────────────────────────
  describe('BudgetAlignmentService', () => {
    it('deve alinhar orçamento a item de portfólio', async () => {
      const alloc = await budgetSvc.alignBudget({
        portfolioItemId: 'PF-PROGRAM-001',
        allocatedAmount: 200000,
        fundingSource: 'Convênio Municipal',
        fiscalYear: 2025,
      });
      expect(alloc.allocationId).toMatch(/^BUD-/);
      expect(alloc.allocatedAmount).toBe(200000);
      expect(alloc.utilizationRate).toBe(0);
    });

    it('deve registrar despesa e calcular utilização', async () => {
      const alloc = await budgetSvc.alignBudget({
        portfolioItemId: 'PF-001',
        allocatedAmount: 100000,
        fundingSource: 'Captação privada',
        fiscalYear: 2025,
      });
      const updated = await budgetSvc.recordExpenditure(alloc.allocationId, 45000, 'CFO');
      expect(updated.spentAmount).toBe(45000);
      expect(updated.utilizationRate).toBeCloseTo(0.45);
    });

    it('deve simular cenário orçamentário', () => {
      const scenario = budgetSvc.simulateScenario(
        'Cenário Otimista',
        'Maior captação',
        1000000,
        { 'prog-01': 0.6, 'prog-02': 0.4 },
      );
      expect(scenario.scenarioId).toMatch(/^SCN-/);
      expect(scenario.totalBudget).toBe(1000000);
      expect(scenario.allocations).toHaveLength(2);
    });

    it('deve resumir orçamento por ano fiscal', async () => {
      await budgetSvc.alignBudget({ portfolioItemId: 'PF-X', allocatedAmount: 50000, fundingSource: 'ISM', fiscalYear: 2025 });
      const summary = budgetSvc.getBudgetSummary(2025);
      expect(summary.fiscalYear).toBe(2025);
      expect(summary.totalAllocated).toBeGreaterThan(0);
    });
  });

  // ── StrategicRiskService ───────────────────────────────────────────────────
  describe('StrategicRiskService', () => {
    it('deve identificar risco e calcular score pela matriz 4×4', async () => {
      const risk = await riskSvc.identifyRisk({
        description: 'Redução repasses governamentais',
        category: StrategicRiskCategory.FINANCIAL,
        likelihood: StrategicRiskLevel.HIGH,
        impact: StrategicRiskLevel.CRITICAL,
        linkedObjectiveId: 'OKR-001',
      });
      expect(risk.riskId).toMatch(/^RISK-FINANCIAL-/);
      expect(risk.riskScore).toBe(12); // HIGH(3) × CRITICAL(4)
      expect(risk.riskLevel).toBe(StrategicRiskLevel.CRITICAL);
    });

    it('deve atualizar status de mitigação', async () => {
      const risk = await riskSvc.identifyRisk({
        description: 'Risco de TI',
        category: StrategicRiskCategory.TECHNOLOGICAL,
        likelihood: StrategicRiskLevel.MEDIUM,
        impact: StrategicRiskLevel.MEDIUM,
        linkedObjectiveId: 'OKR-002',
      });
      const updated = await riskSvc.updateMitigationStatus(
        risk.riskId, 'Plano de contingência implementado', 'MITIGATED', 'Risco controlado', 'CTO',
      );
      expect(updated.status).toBe('MITIGATED');
      expect(updated.responseHistory).toHaveLength(1);
    });

    it('deve gerar heatmap de riscos', async () => {
      await riskSvc.identifyRisk({ description: 'R1', category: StrategicRiskCategory.OPERATIONAL, likelihood: StrategicRiskLevel.LOW, impact: StrategicRiskLevel.LOW, linkedObjectiveId: 'o1' });
      const heatmap = riskSvc.getRiskHeatmap();
      expect(typeof heatmap).toBe('object');
    });

    it('deve calcular score LOW corretamente', async () => {
      const risk = await riskSvc.identifyRisk({
        description: 'Risco baixo',
        category: StrategicRiskCategory.REPUTATIONAL,
        likelihood: StrategicRiskLevel.LOW,
        impact: StrategicRiskLevel.LOW,
        linkedObjectiveId: 'OKR-X',
      });
      expect(risk.riskScore).toBe(1);
      expect(risk.riskLevel).toBe(StrategicRiskLevel.LOW);
    });
  });

  // ── PerformanceEvaluationService ──────────────────────────────────────────
  describe('PerformanceEvaluationService', () => {
    it('deve gerar snapshot de desempenho com OPI válido', async () => {
      const snapshot = await perfSvc.evaluatePerformance('CEO');
      expect(snapshot.snapshotId).toMatch(/^PERF-/);
      expect(snapshot.overallPerformanceIndex).toBeGreaterThanOrEqual(0);
      expect(snapshot.overallPerformanceIndex).toBeLessThanOrEqual(100);
    });

    it('deve gerar recomendações de IA', async () => {
      const snapshot = await perfSvc.evaluatePerformance('CEO');
      expect(Array.isArray(snapshot.aiRecommendations)).toBe(true);
      expect(snapshot.aiRecommendations.length).toBeGreaterThan(0);
    });

    it('deve acumular histórico de snapshots', async () => {
      await perfSvc.evaluatePerformance('CEO');
      await perfSvc.evaluatePerformance('CEO');
      expect(perfSvc.listSnapshots()).toHaveLength(2);
    });
  });

  // ── ExecutiveDashboardService ─────────────────────────────────────────────
  describe('ExecutiveDashboardService', () => {
    it('deve gerar dashboard executivo completo', () => {
      const dash = dashboardSvc.getDashboard();
      expect(dash.generatedAt).toBeDefined();
      expect(dash.okrSummary).toBeDefined();
      expect(dash.kpiSummary).toBeDefined();
      expect(dash.riskSummary).toBeDefined();
      expect(dash.budgetSummary).toBeDefined();
    });
  });
});
