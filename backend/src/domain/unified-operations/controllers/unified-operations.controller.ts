import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
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
import { UnifiedOperationsService } from '../services/unified-operations.service';
import { EnterpriseObservabilityService } from '../services/enterprise-observability.service';
import { AiOpsIntelligenceService } from '../services/ai-ops-intelligence.service';
import { IncidentManagementService } from '../services/incident-management.service';
import { ServiceHealthMonitoringService } from '../services/service-health-monitoring.service';
import { PredictiveFailureAnalysisService } from '../services/predictive-failure-analysis.service';
import { BusinessObservabilityService } from '../services/business-observability.service';
import { ResilienceManagementService } from '../services/resilience-management.service';
import { OperationalAutomationService } from '../services/operational-automation.service';
import { SreGovernanceService } from '../services/sre-governance.service';
import {
  CalculateBusinessImpactDto,
  CollectTelemetryDto,
  CreateIncidentDto,
  DetectAnomalyDto,
  EvaluateSloDto,
  IncidentStatus,
  ResolveIncidentDto,
  RunChaosTestDto,
  TriggerAutoRemediationDto,
} from '../dto/unified-operations.dto';

@ApiTags('AUOC — Unified Operations Center (P156)')
@ApiBearerAuth()
@Controller('api/v1/operations')
export class UnifiedOperationsController {
  constructor(
    private readonly unifiedOps: UnifiedOperationsService,
    private readonly observability: EnterpriseObservabilityService,
    private readonly aiOps: AiOpsIntelligenceService,
    private readonly incidentMgmt: IncidentManagementService,
    private readonly healthMonitoring: ServiceHealthMonitoringService,
    private readonly predictiveAnalysis: PredictiveFailureAnalysisService,
    private readonly businessObservability: BusinessObservabilityService,
    private readonly resilience: ResilienceManagementService,
    private readonly automation: OperationalAutomationService,
    private readonly sreGovernance: SreGovernanceService,
  ) {}

  // ── 1. UNIFIED OPERATIONS DASHBOARD ─────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Retorna o painel consolidado do Centro Unificado de Operações' })
  @ApiResponse({ status: 200, description: 'Dashboard operacional gerado com sucesso' })
  async getOperationalDashboard() {
    return this.unifiedOps.getOperationalDashboard();
  }

  // ── 2. TELEMETRY & OBSERVABILITY ─────────────────────────────────────────────

  @Post('telemetry')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingerição de telemetria (log, métrica, trace ou evento)' })
  @ApiResponse({ status: 201, description: 'Telemetria coletada com sucesso' })
  async collectTelemetry(@Body() dto: CollectTelemetryDto) {
    return this.observability.collectTelemetry(dto);
  }

  @Get('telemetry')
  @ApiOperation({ summary: 'Consulta telemetria coletada com filtros por serviço e tipo' })
  @ApiQuery({ name: 'serviceName', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ['log', 'metric', 'trace', 'event'] })
  async queryTelemetry(@Query('serviceName') serviceName?: string, @Query('type') type?: any) {
    return this.observability.queryTelemetry(serviceName, type);
  }

  @Get('telemetry/context/:serviceName')
  @ApiOperation({ summary: 'Obtém contexto correlacionado de telemetria de um microsserviço' })
  @ApiParam({ name: 'serviceName', type: String })
  async getCorrelatedContext(@Param('serviceName') serviceName: string) {
    return this.observability.getCorrelatedContext(serviceName);
  }

  // ── 3. AIOPS ─────────────────────────────────────────────────────────────────

  @Post('aiops/detect-anomalies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aciona AIOps para detecção de anomalias em um serviço' })
  @ApiResponse({ status: 200, description: 'Análise AIOps concluída' })
  async detectAnomalies(@Body() dto: DetectAnomalyDto) {
    return this.aiOps.detectAnomalies(dto);
  }

  @Get('aiops/anomalies')
  @ApiOperation({ summary: 'Lista todas as anomalias detectadas pelo AIOps' })
  async listAnomalies() {
    return this.aiOps.listAnomalies();
  }

  // ── 4. INCIDENT MANAGEMENT ───────────────────────────────────────────────────

  @Post('incidents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abre um novo incidente corporativo' })
  @ApiResponse({ status: 201, description: 'Incidente aberto com sucesso' })
  async createIncident(@Body() dto: CreateIncidentDto) {
    return this.incidentMgmt.createIncident(dto);
  }

  @Patch('incidents/:id/resolve')
  @ApiOperation({ summary: 'Resolve um incidente e registra pós-mortem e lições aprendidas' })
  @ApiParam({ name: 'id', type: String })
  async resolveIncident(@Param('id') id: string, @Body() dto: ResolveIncidentDto) {
    return this.incidentMgmt.resolveIncident({ ...dto, incidentId: id });
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Lista todos os incidentes, com filtro por status' })
  @ApiQuery({ name: 'status', required: false, enum: IncidentStatus })
  async listIncidents(@Query('status') status?: IncidentStatus) {
    return this.incidentMgmt.listIncidents(status);
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Detalha um incidente específico' })
  @ApiParam({ name: 'id', type: String })
  async getIncident(@Param('id') id: string) {
    return this.incidentMgmt.getIncident(id);
  }

  // ── 5. SERVICE HEALTH ────────────────────────────────────────────────────────

  @Get('health')
  @ApiOperation({ summary: 'Retorna a saúde consolidada de todos os microsserviços monitorados' })
  async getAllHealthStatus() {
    return this.healthMonitoring.getAllHealthStatus();
  }

  @Get('health/:serviceName')
  @ApiOperation({ summary: 'Executa health check ativo em um microsserviço específico' })
  @ApiParam({ name: 'serviceName', type: String })
  async runHealthCheck(@Param('serviceName') serviceName: string) {
    return this.healthMonitoring.runHealthCheck(serviceName);
  }

  // ── 6. PREDICTIVE FAILURE ────────────────────────────────────────────────────

  @Post('predictive/failures')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa análise preditiva de falha para um componente' })
  async analyzePredictiveFailures(@Body() body: { targetComponent: string }) {
    return this.predictiveAnalysis.analyzePredictiveFailures(body.targetComponent);
  }

  @Get('predictive/failures')
  @ApiOperation({ summary: 'Lista previsões de falha geradas pelo serviço preditivo' })
  async listPredictions() {
    return this.predictiveAnalysis.listPredictions();
  }

  // ── 7. BUSINESS IMPACT ──────────────────────────────────────────────────────

  @Post('business-impact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calcula o impacto de negócio de um incidente técnico' })
  async calculateBusinessImpact(@Body() dto: CalculateBusinessImpactDto) {
    return this.businessObservability.calculateBusinessImpact(dto);
  }

  @Get('business-impact')
  @ApiOperation({ summary: 'Lista todos os impactos de negócio calculados' })
  async listBusinessImpacts() {
    return this.businessObservability.listImpacts();
  }

  // ── 8. RESILIENCE & CHAOS ────────────────────────────────────────────────────

  @Post('resilience/chaos-test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa teste de caos (Chaos Engineering) em um componente' })
  async runChaosTest(@Body() dto: RunChaosTestDto) {
    return this.resilience.runChaosTest(dto);
  }

  @Get('resilience/chaos-tests')
  @ApiOperation({ summary: 'Lista todos os resultados de testes de resiliência' })
  async listChaosTestResults() {
    return this.resilience.listTestResults();
  }

  // ── 9. OPERATIONAL AUTOMATION ────────────────────────────────────────────────

  @Post('automation/remediate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aciona autorremediação auditada em um serviço' })
  async triggerAutoRemediation(@Body() dto: TriggerAutoRemediationDto) {
    return this.automation.triggerAutoRemediation(dto);
  }

  @Get('automation/remediations')
  @ApiOperation({ summary: 'Lista todas as ações de autorremediação registradas' })
  async listRemediations() {
    return this.automation.listRemediations();
  }

  // ── 10. SRE GOVERNANCE ───────────────────────────────────────────────────────

  @Post('sre/evaluate-slo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avalia SLI/SLO/Error Budget de um microsserviço' })
  async evaluateSlo(@Body() dto: EvaluateSloDto) {
    return this.sreGovernance.evaluateSlo(dto);
  }

  // ── 11. AUDIT TRAIL ──────────────────────────────────────────────────────────

  @Get('audits')
  @ApiOperation({ summary: 'Consulta a trilha imutável de auditoria operacional (SHA-256)' })
  @ApiQuery({ name: 'componentName', required: false, type: String })
  async getAuditTrail(@Query('componentName') componentName?: string) {
    return this.sreGovernance.getAuditTrail(componentName);
  }
}
