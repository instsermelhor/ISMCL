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

import { EnterpriseObservabilityService } from '../services/enterprise-observability.service';
import { TelemetryService } from '../services/telemetry.service';
import { DistributedTracingService } from '../services/distributed-tracing.service';
import { MetricsService } from '../services/metrics.service';
import { LoggingService } from '../services/logging.service';
import { ReliabilityEngineeringService } from '../services/reliability-engineering.service';
import { SLOManagementService } from '../services/slo-management.service';
import { ChaosEngineeringService } from '../services/chaos-engineering.service';
import { AutonomousOperationsService } from '../services/autonomous-operations.service';
import { ObservabilityAuditService } from '../services/observability-audit.service';

import {
  RecordTelemetryDto,
  DefineSloDto,
  ExecuteChaosExperimentDto,
  TriggerAutonomousActionDto,
  LogLevel,
  AnomalySeverity,
} from '../dto/enterprise-observability.dto';

/**
 * EnterpriseObservabilityController — P173 EORP (Fase XXIII)
 *
 * REST API da Observabilidade Corporativa, Engenharia de Confiabilidade (SRE)
 * e Operações Autônomas (EORP):
 * Visão unificada, OpenTelemetry, Distributed Tracing, Métricas, Logs (LGPD),
 * Score SRE, SLOs/Error Budgets, Chaos Engineering, AIOps e Auditoria Imutável.
 */
@ApiBearerAuth()
@ApiTags('EORP — Enterprise Observability, SRE & Autonomous Operations (P173)')
@Controller('eorp')
export class EnterpriseObservabilityController {
  constructor(
    private readonly obsSvc: EnterpriseObservabilityService,
    private readonly telemetrySvc: TelemetryService,
    private readonly tracingSvc: DistributedTracingService,
    private readonly metricsSvc: MetricsService,
    private readonly loggingSvc: LoggingService,
    private readonly sreSvc: ReliabilityEngineeringService,
    private readonly sloSvc: SLOManagementService,
    private readonly chaosSvc: ChaosEngineeringService,
    private readonly aiopsSvc: AutonomousOperationsService,
    private readonly auditSvc: ObservabilityAuditService,
  ) {}

  // ── ENTERPRISE OBSERVABILITY OVERVIEW ──────────────────────────────────────

  @Get('overview')
  @ApiOperation({ summary: 'Visão executiva unificada da observabilidade corporativa' })
  @ApiResponse({ status: 200, description: 'Saúde geral de 100% dos componentes retornada.' })
  getObservabilityOverview() {
    return this.obsSvc.getOverview();
  }

  @Post('components/heartbeat')
  @ApiOperation({ summary: 'Atualizar heartbeat e status de componente monitorado' })
  updateHeartbeat(
    @Body('componentName') componentName: string,
    @Body('status') status: any,
  ) {
    return this.obsSvc.updateComponentHeartbeat(componentName, status);
  }

  // ── TELEMETRY (OPENTELEMETRY) ───────────────────────────────────────────────

  @Post('telemetry/record')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar telemetria OpenTelemetry (Métrica, Log, Trace, Evento)' })
  recordTelemetry(@Body() dto: RecordTelemetryDto) {
    return this.telemetrySvc.recordTelemetry(dto);
  }

  @Get('telemetry/recent')
  @ApiOperation({ summary: 'Obter telemetria recente coletada' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecentTelemetry(@Query('limit') limit?: number) {
    return this.telemetrySvc.getRecentTelemetry(limit ? Number(limit) : 50);
  }

  @Get('telemetry/trace/:traceId')
  @ApiOperation({ summary: 'Obter registros de telemetria por ID de rastreamento (traceId)' })
  getTelemetryByTrace(@Param('traceId') traceId: string) {
    return this.telemetrySvc.getTelemetryByTrace(traceId);
  }

  // ── DISTRIBUTED TRACING ─────────────────────────────────────────────────────

  @Post('tracing/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar rastreamento distribuído (Distributed Trace)' })
  startTrace(
    @Body('rootService') rootService: string,
    @Body('operationName') operationName: string,
  ) {
    return this.tracingSvc.startTrace(rootService ?? 'Gateway', operationName ?? 'HTTP_REQ');
  }

  @Post('tracing/:traceId/span')
  @ApiOperation({ summary: 'Adicionar span de microsserviço ao rastreamento distribuído' })
  addTraceSpan(
    @Param('traceId') traceId: string,
    @Body('serviceName') serviceName: string,
    @Body('operationName') operationName: string,
    @Body('durationMs') durationMs: number,
    @Body('statusCode') statusCode?: number,
  ) {
    return this.tracingSvc.addSpanToTrace(traceId, serviceName, operationName, Number(durationMs) || 10, Number(statusCode) || 200);
  }

  @Get('tracing/:traceId')
  @ApiOperation({ summary: 'Obter grafo completo de rastreamento distribuído' })
  getTraceGraph(@Param('traceId') traceId: string) {
    const t = this.tracingSvc.getTrace(traceId);
    if (!t) return { error: 'Trace não encontrado', traceId };
    return t;
  }

  @Get('tracing')
  @ApiOperation({ summary: 'Listar todos os rastreamentos distribuídos executados' })
  @ApiQuery({ name: 'onlyWithErrors', required: false, type: Boolean })
  listTraces(@Query('onlyWithErrors') onlyWithErrors?: string) {
    return this.tracingSvc.listTraces(onlyWithErrors === 'true');
  }

  // ── METRICS (OPENMETRICS / PROMETHEUS) ──────────────────────────────────────

  @Post('metrics/datapoint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar data point de métrica OpenMetrics/Prometheus' })
  pushDataPoint(
    @Body('metricName') metricName: string,
    @Body('value') value: number,
  ) {
    this.metricsSvc.pushDataPoint(metricName, Number(value));
    return { status: 'pushed', metricName, value };
  }

  @Get('metrics/summary')
  @ApiOperation({ summary: 'Obter estatísticas agregadas de métrica (p50, p95, p99, min, max, avg)' })
  @ApiQuery({ name: 'metricName' })
  getMetricSummary(@Query('metricName') metricName: string) {
    const s = this.metricsSvc.getMetricSummary(metricName);
    if (!s) return { error: 'Métrica sem data points registrados', metricName };
    return s;
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Listar todas as métricas registradas' })
  listMetrics() {
    return this.metricsSvc.listMetrics();
  }

  // ── LOGGING ─────────────────────────────────────────────────────────────────

  @Post('logging/log')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar log centralizado com mascaramento automático LGPD' })
  logMessage(
    @Body('level') level: LogLevel,
    @Body('serviceName') serviceName: string,
    @Body('message') message: string,
    @Body('context') context: Record<string, any>,
    @Body('traceId') traceId?: string,
  ) {
    return this.loggingSvc.log(level ?? LogLevel.INFO, serviceName ?? 'App', message ?? '', context ?? {}, traceId);
  }

  @Get('logging/search')
  @ApiOperation({ summary: 'Pesquisa avançada em logs centralizados com filtros de nível e serviço' })
  @ApiQuery({ name: 'query' })
  @ApiQuery({ name: 'level', required: false, enum: LogLevel })
  @ApiQuery({ name: 'serviceName', required: false })
  searchLogs(
    @Query('query') query: string,
    @Query('level') level?: LogLevel,
    @Query('serviceName') serviceName?: string,
  ) {
    return this.loggingSvc.searchLogs(query, level, serviceName);
  }

  // ── SRE & RELIABILITY ───────────────────────────────────────────────────────

  @Post('sre/reliability-score')
  @ApiOperation({ summary: 'Calcular Reliability Score SRE oficial (0-100), MTTR e MTBF' })
  calculateReliabilityScore() {
    return this.sreSvc.calculateReliabilityScore('API_USER');
  }

  // ── SLO & ERROR BUDGETS ─────────────────────────────────────────────────────

  @Post('slo/define')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir novo SLO de Confiabilidade' })
  defineSlo(@Body() dto: DefineSloDto) {
    return this.sloSvc.defineSlo(dto, 'API_USER');
  }

  @Post('slo/:sloId/evaluate')
  @ApiOperation({ summary: 'Avaliar consumo de Error Budget e Burn Rate do SLO' })
  evaluateSloStatus(@Param('sloId') sloId: string) {
    return this.sloSvc.evaluateSloStatus(sloId);
  }

  @Get('slo')
  @ApiOperation({ summary: 'Listar todos os SLOs de confiabilidade definidos' })
  listSlos() {
    return this.sloSvc.listSlos();
  }

  @Get('slo/:sloId')
  @ApiOperation({ summary: 'Obter SLO específico pelo ID' })
  getSlo(@Param('sloId') sloId: string) {
    const s = this.sloSvc.getSlo(sloId);
    if (!s) return { error: 'SLO não encontrado', sloId };
    return s;
  }

  // ── CHAOS ENGINEERING ───────────────────────────────────────────────────────

  @Post('chaos/execute')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Executar experimento controlado de Chaos Engineering (requer autorização SRE)' })
  executeChaosExperiment(@Body() dto: ExecuteChaosExperimentDto) {
    return this.chaosSvc.executeExperiment(dto);
  }

  @Get('chaos/experiments')
  @ApiOperation({ summary: 'Listar histórico completo de experimentos de Chaos Engineering' })
  listChaosExperiments() {
    return this.chaosSvc.listExperiments();
  }

  @Get('chaos/experiments/:experimentId')
  @ApiOperation({ summary: 'Obter resultado de experimento de Chaos pelo ID' })
  getChaosExperiment(@Param('experimentId') experimentId: string) {
    const e = this.chaosSvc.getExperiment(experimentId);
    if (!e) return { error: 'Experimento não encontrado', experimentId };
    return e;
  }

  // ── AIOPS & AUTONOMOUS OPERATIONS ───────────────────────────────────────────

  @Post('aiops/anomalies/detect')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar anomalia detectada pelo motor AIOps' })
  detectAnomaly(
    @Body('metricOrService') metricOrService: string,
    @Body('severity') severity: AnomalySeverity,
    @Body('description') description: string,
    @Body('suggestedAction') suggestedAction: string,
  ) {
    return this.aiopsSvc.detectAnomaly(
      metricOrService,
      severity ?? AnomalySeverity.HIGH,
      description ?? 'Desvio atípico detectado',
      suggestedAction ?? 'Auto-scaling automático',
    );
  }

  @Post('aiops/actions/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar ação autônoma recomendada pela IA (auditada SHA-256)' })
  executeAutonomousAction(@Body() dto: TriggerAutonomousActionDto) {
    return this.aiopsSvc.executeAutonomousAction(dto, 'AIOPS_ENGINE');
  }

  @Get('aiops/anomalies')
  @ApiOperation({ summary: 'Listar todas as anomalias detectadas pelo AIOps' })
  listAnomalies() {
    return this.aiopsSvc.listAnomalies();
  }

  @Get('aiops/actions')
  @ApiOperation({ summary: 'Listar log de ações autônomas executadas pelo motor AIOps' })
  listAutonomousActions() {
    return this.aiopsSvc.listActionLogs();
  }

  // ── AUDIT ────────────────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Trilha imutável de auditoria EORP com assinatura SHA-256' })
  @ApiQuery({ name: 'subject', required: false })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditSvc.getAuditTrail(subject);
  }

  @Get('audit/count')
  @ApiOperation({ summary: 'Obter total de entradas na trilha de auditoria EORP' })
  getAuditCount() {
    return { count: this.auditSvc.getAuditCount() };
  }
}
