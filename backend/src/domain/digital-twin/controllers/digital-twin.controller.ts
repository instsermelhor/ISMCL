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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DigitalTwinCoreService } from '../services/digital-twin-core.service';
import { OrganizationalSimulationService } from '../services/organizational-simulation.service';
import { StrategicScenarioModelingService } from '../services/strategic-scenario-modeling.service';
import { ImpactAnalysisService } from '../services/impact-analysis.service';
import { PredictiveSimulationService } from '../services/predictive-simulation.service';
import { ResourceOptimizationService } from '../services/resource-optimization.service';
import { InstitutionalForecastService } from '../services/institutional-forecast.service';
import { TwinSynchronizationService } from '../services/twin-synchronization.service';
import { ExecutiveSimulationDashboardService } from '../services/executive-simulation-dashboard.service';
import { DigitalTwinGovernanceService } from '../services/digital-twin-governance.service';
import {
  AnalyzeImpactDto,
  CreateScenarioDto,
  GenerateForecastDto,
  OptimizeResourcesDto,
  RunSimulationDto,
  SyncDigitalTwinDto,
} from '../dto/digital-twin.dto';

@ApiTags('ADT — Digital Twin Platform (P157)')
@ApiBearerAuth()
@Controller('api/v1/digital-twin')
export class DigitalTwinController {
  constructor(
    private readonly twinCore: DigitalTwinCoreService,
    private readonly simulation: OrganizationalSimulationService,
    private readonly scenarioModeling: StrategicScenarioModelingService,
    private readonly impactAnalysis: ImpactAnalysisService,
    private readonly predictiveSimulation: PredictiveSimulationService,
    private readonly resourceOptimization: ResourceOptimizationService,
    private readonly forecast: InstitutionalForecastService,
    private readonly twinSync: TwinSynchronizationService,
    private readonly executiveDashboard: ExecutiveSimulationDashboardService,
    private readonly governance: DigitalTwinGovernanceService,
  ) {}

  // ── 1. DIGITAL TWIN CORE ─────────────────────────────────────────────────────

  @Get('state')
  @ApiOperation({ summary: 'Retorna o estado atual do Digital Twin organizacional' })
  @ApiResponse({ status: 200, description: 'Estado atual do Digital Twin' })
  getDigitalTwinState() {
    return this.twinCore.getCurrentState();
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Força atualização do estado do Digital Twin' })
  async refreshDigitalTwinState() {
    return this.twinCore.refreshState();
  }

  // ── 2. SYNCHRONIZATION ───────────────────────────────────────────────────────

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sincroniza o Digital Twin com todos os módulos operacionais' })
  async syncDigitalTwin(@Body() dto: SyncDigitalTwinDto) {
    return this.twinSync.syncWithOperationalModules(dto);
  }

  @Get('sync/last')
  @ApiOperation({ summary: 'Retorna o resultado da última sincronização executada' })
  getLastSync() {
    return this.twinSync.getLastSync();
  }

  @Get('sync/history')
  @ApiOperation({ summary: 'Retorna o histórico completo de sincronizações' })
  getSyncHistory() {
    return this.twinSync.getSyncHistory();
  }

  // ── 3. SCENARIOS ─────────────────────────────────────────────────────────────

  @Post('scenarios')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria novo cenário estratégico no Digital Twin' })
  @ApiResponse({ status: 201, description: 'Cenário criado com sucesso' })
  async createScenario(@Body() dto: CreateScenarioDto) {
    return this.scenarioModeling.createScenario(dto);
  }

  @Get('scenarios')
  @ApiOperation({ summary: 'Lista todos os cenários estratégicos disponíveis' })
  listScenarios() {
    return this.scenarioModeling.listScenarios();
  }

  @Get('scenarios/:id')
  @ApiOperation({ summary: 'Detalha um cenário estratégico específico' })
  @ApiParam({ name: 'id', type: String })
  getScenario(@Param('id') id: string) {
    return this.scenarioModeling.getScenario(id);
  }

  @Post('scenarios/compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compara múltiplos cenários estratégicos' })
  async compareScenarios(@Body() body: { scenarioIds: string[] }) {
    return this.scenarioModeling.compareScenarios(body.scenarioIds);
  }

  // ── 4. SIMULATIONS ───────────────────────────────────────────────────────────

  @Post('simulations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Executa nova simulação organizacional no Digital Twin' })
  @ApiResponse({ status: 201, description: 'Simulação executada com sucesso' })
  async runSimulation(@Body() dto: RunSimulationDto) {
    return this.simulation.runSimulation(dto);
  }

  @Get('simulations')
  @ApiOperation({ summary: 'Lista todas as simulações executadas' })
  listSimulations() {
    return this.simulation.listSimulations();
  }

  @Get('simulations/:id')
  @ApiOperation({ summary: 'Detalha resultado de uma simulação específica' })
  @ApiParam({ name: 'id', type: String })
  getSimulation(@Param('id') id: string) {
    return this.simulation.getSimulation(id);
  }

  // ── 5. IMPACT ANALYSIS ───────────────────────────────────────────────────────

  @Post('impact-analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa análise multidimensional de impacto de uma simulação' })
  async analyzeImpact(@Body() dto: AnalyzeImpactDto) {
    return this.impactAnalysis.analyzeImpact(dto);
  }

  @Get('impact-analysis')
  @ApiOperation({ summary: 'Lista todas as análises de impacto realizadas' })
  listImpactAnalyses() {
    return this.impactAnalysis.listAnalyses();
  }

  // ── 6. RESOURCE OPTIMIZATION ─────────────────────────────────────────────────

  @Post('resource-optimization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calcula otimização de recursos com alternativas custo-benefício' })
  async optimizeResources(@Body() dto: OptimizeResourcesDto) {
    return this.resourceOptimization.optimizeResources(dto);
  }

  @Get('resource-optimization')
  @ApiOperation({ summary: 'Lista otimizações de recursos calculadas' })
  listOptimizations() {
    return this.resourceOptimization.listOptimizations();
  }

  // ── 7. FORECAST ──────────────────────────────────────────────────────────────

  @Post('forecast')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gera previsão institucional para o horizonte selecionado' })
  @ApiResponse({ status: 201, description: 'Previsão gerada com sucesso' })
  async generateForecast(@Body() dto: GenerateForecastDto) {
    return this.forecast.generateForecast(dto);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Lista todas as previsões institucionais geradas' })
  listForecasts() {
    return this.forecast.listForecasts();
  }

  @Post('forecast/predictive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa simulação preditiva com intervalos de confiança' })
  async runPredictiveSimulation(@Body() dto: GenerateForecastDto) {
    return this.predictiveSimulation.runPredictiveSimulation(dto);
  }

  // ── 8. EXECUTIVE DASHBOARD ───────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Retorna o painel executivo consolidado do Digital Twin' })
  @ApiQuery({ name: 'query', required: false, type: String, description: 'Consulta em linguagem natural' })
  async getExecutiveDashboard(@Query('query') query?: string) {
    return this.executiveDashboard.generateExecutiveDashboard(query);
  }

  // ── 9. GOVERNANCE & AUDIT ─────────────────────────────────────────────────────

  @Get('governance/audit')
  @ApiOperation({ summary: 'Consulta a trilha imutável de auditoria do Digital Twin (SHA-256)' })
  @ApiQuery({ name: 'component', required: false, type: String })
  getAuditTrail(@Query('component') component?: string) {
    return this.governance.getAuditTrail(component);
  }

  @Get('governance/model-version')
  @ApiOperation({ summary: 'Retorna a versão atual do modelo do Digital Twin' })
  getModelVersion() {
    return { modelVersion: this.governance.getCurrentModelVersion() };
  }
}
