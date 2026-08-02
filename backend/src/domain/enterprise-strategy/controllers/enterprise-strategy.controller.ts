import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';

import { StrategicPlanningService } from '../services/strategic-planning.service';
import { OKRManagementService } from '../services/okr-management.service';
import { BalancedScorecardService } from '../services/balanced-scorecard.service';
import { InstitutionalKpiService } from '../services/institutional-kpi.service';
import { StrategicPortfolioService } from '../services/strategic-portfolio.service';
import { BudgetAlignmentService } from '../services/budget-alignment.service';
import { StrategicRiskService } from '../services/strategic-risk.service';
import { PerformanceEvaluationService } from '../services/performance-evaluation.service';
import { ExecutiveDashboardService } from '../services/executive-dashboard.service';
import { StrategyAuditService } from '../services/strategy-audit.service';

import {
  CreateStrategicPlanDto,
  CreateOKRDto,
  UpdateOKRProgressDto,
  CreateBscObjectiveDto,
  CreateKpiDto,
  RecordKpiValueDto,
  CreatePortfolioItemDto,
  AlignBudgetDto,
  CreateStrategicRiskDto,
  StrategicPlanStatus,
  OKRLevel,
  OKRStatus,
  KpiCategory,
  KpiPeriodicity,
  BscPerspective,
  PortfolioItemType,
  PortfolioItemStatus,
  StrategicRiskCategory,
  StrategicRiskLevel,
} from '../dto/enterprise-strategy.dto';

/**
 * EnterpriseStrategyController — P168 ESGP (Fase XVIII)
 *
 * REST API da plataforma de Estratégia, Governança e Performance:
 * planejamento estratégico, OKRs, BSC, KPIs, portfólio, orçamento,
 * riscos estratégicos, avaliação de desempenho e dashboard executivo.
 */
@ApiBearerAuth()
@ApiTags('ESGP — Enterprise Strategy, Governance & Performance (P168)')
@Controller('esgp')
export class EnterpriseStrategyController {
  constructor(
    private readonly planSvc: StrategicPlanningService,
    private readonly okrSvc: OKRManagementService,
    private readonly bscSvc: BalancedScorecardService,
    private readonly kpiSvc: InstitutionalKpiService,
    private readonly portfolioSvc: StrategicPortfolioService,
    private readonly budgetSvc: BudgetAlignmentService,
    private readonly riskSvc: StrategicRiskService,
    private readonly perfSvc: PerformanceEvaluationService,
    private readonly dashboardSvc: ExecutiveDashboardService,
    private readonly auditSvc: StrategyAuditService,
  ) {}

  // ── EXECUTIVE DASHBOARD ─────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard executivo ESGP consolidado' })
  @ApiResponse({ status: 200, description: 'Dashboard estratégico retornado.' })
  getDashboard() {
    return this.dashboardSvc.getDashboard();
  }

  // ── STRATEGIC PLANNING ──────────────────────────────────────────────────────

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar plano estratégico institucional' })
  @ApiResponse({ status: 201, description: 'Plano estratégico criado.' })
  createPlan(@Body() dto: CreateStrategicPlanDto) {
    return this.planSvc.createPlan(dto, 'API_USER');
  }

  @Post('plans/:planId/activate')
  @ApiOperation({ summary: 'Ativar plano estratégico' })
  activatePlan(@Param('planId') planId: string) {
    return this.planSvc.activatePlan(planId, 'API_USER');
  }

  @Post('plans/:planId/objectives')
  @ApiOperation({ summary: 'Adicionar objetivo estratégico ao plano' })
  addObjective(
    @Param('planId') planId: string,
    @Body('description') description: string,
    @Body('priority') priority: number,
  ) {
    return this.planSvc.addObjective(planId, description, priority ?? 5, 'API_USER');
  }

  @Get('plans')
  @ApiOperation({ summary: 'Listar planos estratégicos' })
  @ApiQuery({ name: 'status', required: false, enum: StrategicPlanStatus })
  listPlans(@Query('status') status?: StrategicPlanStatus) {
    return this.planSvc.listPlans(status);
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Obter plano estratégico por ID' })
  getPlan(@Param('planId') planId: string) {
    const p = this.planSvc.getPlan(planId);
    if (!p) return { error: 'Plano não encontrado', planId };
    return p;
  }

  // ── OKR MANAGEMENT ──────────────────────────────────────────────────────────

  @Post('okrs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar OKR institucional' })
  @ApiResponse({ status: 201, description: 'OKR criado.' })
  createOKR(@Body() dto: CreateOKRDto) {
    return this.okrSvc.createOKR(dto, 'API_USER');
  }

  @Post('okrs/:okrId/activate')
  @ApiOperation({ summary: 'Ativar OKR' })
  activateOKR(@Param('okrId') okrId: string) {
    return this.okrSvc.activateOKR(okrId, 'API_USER');
  }

  @Post('okrs/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar progresso de Key Result de OKR' })
  updateOKRProgress(@Body() dto: UpdateOKRProgressDto) {
    return this.okrSvc.updateProgress(dto, 'API_USER');
  }

  @Get('okrs')
  @ApiOperation({ summary: 'Listar OKRs com filtros opcionais' })
  @ApiQuery({ name: 'level', required: false, enum: OKRLevel })
  @ApiQuery({ name: 'cycle', required: false })
  @ApiQuery({ name: 'status', required: false, enum: OKRStatus })
  listOKRs(
    @Query('level') level?: OKRLevel,
    @Query('cycle') cycle?: string,
    @Query('status') status?: OKRStatus,
  ) {
    return this.okrSvc.listOKRs(level, cycle, status);
  }

  @Get('okrs/:okrId')
  @ApiOperation({ summary: 'Obter OKR por ID' })
  getOKR(@Param('okrId') okrId: string) {
    const o = this.okrSvc.getOKR(okrId);
    if (!o) return { error: 'OKR não encontrado', okrId };
    return o;
  }

  @Get('okrs/:okrId/children')
  @ApiOperation({ summary: 'Listar OKRs filhos (cascata)' })
  getChildOKRs(@Param('okrId') okrId: string) {
    return this.okrSvc.getChildOKRs(okrId);
  }

  // ── BALANCED SCORECARD ──────────────────────────────────────────────────────

  @Post('bsc/objectives')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar objetivo no Balanced Scorecard' })
  createBscObjective(@Body() dto: CreateBscObjectiveDto) {
    return this.bscSvc.createObjective(dto, 'API_USER');
  }

  @Post('bsc/objectives/:id/score')
  @ApiOperation({ summary: 'Atribuir score a objetivo BSC (0–100)' })
  scoreBscObjective(@Param('id') bscObjId: string, @Body('score') score: number) {
    return this.bscSvc.scoreObjective(bscObjId, score, 'API_USER');
  }

  @Post('bsc/scorecards/generate')
  @ApiOperation({ summary: 'Gerar scorecard BSC para plano estratégico' })
  generateScorecard(
    @Body('strategicPlanId') strategicPlanId: string,
    @Body('name') name: string,
  ) {
    return this.bscSvc.generateScorecard(strategicPlanId, name ?? 'Scorecard BSC');
  }

  @Get('bsc/objectives')
  @ApiOperation({ summary: 'Listar objetivos BSC por perspectiva' })
  @ApiQuery({ name: 'perspective', required: false, enum: BscPerspective })
  listBscObjectives(@Query('perspective') perspective?: BscPerspective) {
    return this.bscSvc.listObjectives(perspective);
  }

  @Get('bsc/scorecards')
  @ApiOperation({ summary: 'Listar scorecards BSC gerados' })
  listScorecards() {
    return this.bscSvc.listScorecards();
  }

  // ── INSTITUTIONAL KPIs ──────────────────────────────────────────────────────

  @Post('kpis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar KPI no catálogo corporativo' })
  createKPI(@Body() dto: CreateKpiDto) {
    return this.kpiSvc.createKPI(dto, 'API_USER');
  }

  @Post('kpis/record')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar valor de KPI para período' })
  recordKpiValue(@Body() dto: RecordKpiValueDto) {
    return this.kpiSvc.recordValue(dto, 'API_USER');
  }

  @Get('kpis/:kpiId/assess')
  @ApiOperation({ summary: 'Avaliar KPI em relação às metas' })
  assessKpiTarget(@Param('kpiId') kpiId: string) {
    return this.kpiSvc.assessTarget(kpiId);
  }

  @Get('kpis/:kpiId/history')
  @ApiOperation({ summary: 'Histórico de valores de um KPI' })
  getKpiHistory(@Param('kpiId') kpiId: string) {
    return this.kpiSvc.getKPIHistory(kpiId);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Listar KPIs do catálogo' })
  @ApiQuery({ name: 'category', required: false, enum: KpiCategory })
  @ApiQuery({ name: 'periodicity', required: false, enum: KpiPeriodicity })
  listKPIs(
    @Query('category') category?: KpiCategory,
    @Query('periodicity') periodicity?: KpiPeriodicity,
  ) {
    return this.kpiSvc.listKPIs(category, periodicity);
  }

  @Get('kpis/:kpiId')
  @ApiOperation({ summary: 'Obter KPI por ID' })
  getKPI(@Param('kpiId') kpiId: string) {
    const k = this.kpiSvc.getKPI(kpiId);
    if (!k) return { error: 'KPI não encontrado', kpiId };
    return k;
  }

  // ── STRATEGIC PORTFOLIO ─────────────────────────────────────────────────────

  @Post('portfolio')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar item ao portfólio estratégico' })
  addPortfolioItem(@Body() dto: CreatePortfolioItemDto) {
    return this.portfolioSvc.addItem(dto, 'API_USER');
  }

  @Post('portfolio/:itemId/progress')
  @ApiOperation({ summary: 'Atualizar progresso e despesa de item de portfólio' })
  updatePortfolioProgress(
    @Param('itemId') itemId: string,
    @Body('progress') progress: number,
    @Body('spentBudget') spentBudget: number,
  ) {
    return this.portfolioSvc.updateProgress(itemId, progress, spentBudget ?? 0, 'API_USER');
  }

  @Post('portfolio/reprioritize')
  @ApiOperation({ summary: 'Repriorizar portfólio automaticamente' })
  reprioritizePortfolio() {
    return this.portfolioSvc.reprioritize();
  }

  @Get('portfolio/summary')
  @ApiOperation({ summary: 'Resumo executivo do portfólio estratégico' })
  getPortfolioSummary() {
    return this.portfolioSvc.getPortfolioSummary();
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Listar portfólio estratégico' })
  @ApiQuery({ name: 'type', required: false, enum: PortfolioItemType })
  @ApiQuery({ name: 'status', required: false, enum: PortfolioItemStatus })
  listPortfolio(
    @Query('type') type?: PortfolioItemType,
    @Query('status') status?: PortfolioItemStatus,
  ) {
    return this.portfolioSvc.listPortfolio(type, status);
  }

  @Get('portfolio/:itemId')
  @ApiOperation({ summary: 'Obter item de portfólio por ID' })
  getPortfolioItem(@Param('itemId') itemId: string) {
    const i = this.portfolioSvc.getItem(itemId);
    if (!i) return { error: 'Item não encontrado', itemId };
    return i;
  }

  // ── BUDGET ALIGNMENT ────────────────────────────────────────────────────────

  @Post('budget/align')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alinhar orçamento a item de portfólio estratégico' })
  alignBudget(@Body() dto: AlignBudgetDto) {
    return this.budgetSvc.alignBudget(dto, 'API_USER');
  }

  @Post('budget/expenditure/:allocationId')
  @ApiOperation({ summary: 'Registrar despesa em alocação orçamentária' })
  recordExpenditure(
    @Param('allocationId') allocationId: string,
    @Body('amount') amount: number,
  ) {
    return this.budgetSvc.recordExpenditure(allocationId, amount, 'API_USER');
  }

  @Post('budget/scenario/simulate')
  @ApiOperation({ summary: 'Simular cenário orçamentário' })
  simulateScenario(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('totalBudget') totalBudget: number,
    @Body('weights') weights: Record<string, number>,
  ) {
    return this.budgetSvc.simulateScenario(name, description ?? '', totalBudget, weights ?? {});
  }

  @Get('budget/summary')
  @ApiOperation({ summary: 'Resumo orçamentário por ano fiscal' })
  @ApiQuery({ name: 'fiscalYear', required: false })
  getBudgetSummary(@Query('fiscalYear') fiscalYear?: number) {
    return this.budgetSvc.getBudgetSummary(fiscalYear);
  }

  @Get('budget/scenarios')
  @ApiOperation({ summary: 'Listar cenários orçamentários simulados' })
  listScenarios() {
    return this.budgetSvc.listScenarios();
  }

  @Get('budget')
  @ApiOperation({ summary: 'Listar alocações orçamentárias' })
  @ApiQuery({ name: 'fiscalYear', required: false })
  listAllocations(@Query('fiscalYear') fiscalYear?: number) {
    return this.budgetSvc.listAllocations(fiscalYear);
  }

  // ── STRATEGIC RISK ──────────────────────────────────────────────────────────

  @Post('risks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Identificar risco estratégico' })
  identifyRisk(@Body() dto: CreateStrategicRiskDto) {
    return this.riskSvc.identifyRisk(dto, 'API_USER');
  }

  @Post('risks/:riskId/mitigate')
  @ApiOperation({ summary: 'Atualizar status e plano de mitigação de risco' })
  updateRiskMitigation(
    @Param('riskId') riskId: string,
    @Body('action') action: string,
    @Body('status') status: any,
    @Body('notes') notes: string,
  ) {
    return this.riskSvc.updateMitigationStatus(riskId, action, status, notes ?? '', 'API_USER');
  }

  @Get('risks/heatmap')
  @ApiOperation({ summary: 'Mapa de calor dos riscos estratégicos' })
  getRiskHeatmap() {
    return this.riskSvc.getRiskHeatmap();
  }

  @Get('risks')
  @ApiOperation({ summary: 'Listar riscos estratégicos' })
  @ApiQuery({ name: 'category', required: false, enum: StrategicRiskCategory })
  @ApiQuery({ name: 'level', required: false, enum: StrategicRiskLevel })
  @ApiQuery({ name: 'status', required: false })
  listRisks(
    @Query('category') category?: StrategicRiskCategory,
    @Query('level') level?: StrategicRiskLevel,
    @Query('status') status?: any,
  ) {
    return this.riskSvc.listRisks(category, level, status);
  }

  @Get('risks/:riskId')
  @ApiOperation({ summary: 'Obter risco estratégico por ID' })
  getRisk(@Param('riskId') riskId: string) {
    const r = this.riskSvc.getRisk(riskId);
    if (!r) return { error: 'Risco não encontrado', riskId };
    return r;
  }

  // ── PERFORMANCE EVALUATION ─────────────────────────────────────────────────

  @Post('performance/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar avaliação de desempenho estratégico com IA' })
  evaluatePerformance() {
    return this.perfSvc.evaluatePerformance('API_USER');
  }

  @Get('performance/latest')
  @ApiOperation({ summary: 'Obter última avaliação de desempenho' })
  getLatestPerformance() {
    const snap = this.perfSvc.getLatestSnapshot();
    if (!snap) return { message: 'Nenhuma avaliação realizada ainda.' };
    return snap;
  }

  @Get('performance/history')
  @ApiOperation({ summary: 'Histórico de avaliações de desempenho' })
  getPerformanceHistory() {
    return this.perfSvc.listSnapshots();
  }

  // ── AUDIT ────────────────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Trilha de auditoria imutável ESGP (SHA-256)' })
  @ApiQuery({ name: 'subject', required: false })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditSvc.getAuditTrail(subject);
  }
}
