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

import { BusinessContinuityService } from '../services/business-continuity.service';
import { BusinessImpactAnalysisService } from '../services/business-impact-analysis.service';
import { IncidentResponseService } from '../services/incident-response.service';
import { DisasterRecoveryService } from '../services/disaster-recovery.service';
import { CrisisManagementService } from '../services/crisis-management.service';
import { EmergencyCommunicationService } from '../services/emergency-communication.service';
import { RecoveryOrchestrationService } from '../services/recovery-orchestration.service';
import { OperationalResilienceService } from '../services/operational-resilience.service';
import { CrisisDashboardService } from '../services/crisis-dashboard.service';
import { ContinuityAuditService } from '../services/continuity-audit.service';

import {
  RegisterCriticalProcessDto,
  RunBIADto,
  CreateIncidentDto,
  InitiateRecoveryDto,
  DeclareCrisisDto,
  SendEmergencyNotificationDto,
  CriticalityLevel,
  IncidentSeverity,
  IncidentStatus,
  IncidentCategory,
  RecoveryStatus,
  CrisisStatus,
} from '../dto/business-continuity.dto';

/**
 * BusinessContinuityController — P169 BCORP (Fase XIX)
 *
 * REST API da plataforma Corporativa de Continuidade de Negócios, Gestão de Crises
 * e Resiliência Operacional (BCORP):
 * BCP, BIA, Incident Response, Disaster Recovery, Centro de Crises,
 * Comunicação de Emergência, Orquestração, Resiliência Operacional e Auditoria.
 */
@ApiBearerAuth()
@ApiTags('BCORP — Business Continuity, Crisis Management & Operational Resilience (P169)')
@Controller('bcorp')
export class BusinessContinuityController {
  constructor(
    private readonly bcpSvc: BusinessContinuityService,
    private readonly biaSvc: BusinessImpactAnalysisService,
    private readonly incidentSvc: IncidentResponseService,
    private readonly drSvc: DisasterRecoveryService,
    private readonly crisisSvc: CrisisManagementService,
    private readonly commSvc: EmergencyCommunicationService,
    private readonly orchSvc: RecoveryOrchestrationService,
    private readonly resilienceSvc: OperationalResilienceService,
    private readonly dashboardSvc: CrisisDashboardService,
    private readonly auditSvc: ContinuityAuditService,
  ) {}

  // ── DASHBOARD EXECUTIVO ─────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard executivo do Centro de Gestão de Crises' })
  @ApiResponse({ status: 200, description: 'Visão executiva consolidada retornada.' })
  getDashboard() {
    return this.dashboardSvc.getExecutiveDashboard();
  }

  // ── BUSINESS CONTINUITY (BCP) ───────────────────────────────────────────────

  @Post('processes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar processo crítico no Plano de Continuidade' })
  registerCriticalProcess(@Body() dto: RegisterCriticalProcessDto) {
    return this.bcpSvc.registerCriticalProcess(dto, 'API_USER');
  }

  @Post('plans/:planId/activate')
  @ApiOperation({ summary: 'Ativar Plano de Continuidade de Negócios' })
  activatePlan(
    @Param('planId') planId: string,
    @Body('reason') reason: string,
  ) {
    return this.bcpSvc.activatePlan(planId, 'API_USER', reason ?? 'Ativação via API');
  }

  @Post('plans/:planId/deactivate')
  @ApiOperation({ summary: 'Desativar Plano de Continuidade (retorno ao normal)' })
  deactivatePlan(@Param('planId') planId: string) {
    return this.bcpSvc.deactivatePlan(planId, 'API_USER');
  }

  @Get('plans/master')
  @ApiOperation({ summary: 'Obter Plano Mestre de Continuidade' })
  getMasterPlan() {
    return this.bcpSvc.getDefaultPlan();
  }

  @Get('processes')
  @ApiOperation({ summary: 'Listar processos críticos por nível de criticidade' })
  @ApiQuery({ name: 'criticality', required: false, enum: CriticalityLevel })
  listProcesses(@Query('criticality') criticality?: CriticalityLevel) {
    return this.bcpSvc.listProcesses(criticality);
  }

  // ── BUSINESS IMPACT ANALYSIS (BIA) ──────────────────────────────────────────

  @Post('bia/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Análise de Impacto nos Negócios (BIA)' })
  runBIA(@Body() dto: RunBIADto) {
    return this.biaSvc.runBIA(dto, 'API_USER');
  }

  @Get('bia/reports')
  @ApiOperation({ summary: 'Listar relatórios de BIA gerados' })
  listBiaReports() {
    return this.biaSvc.listReports();
  }

  @Get('bia/reports/:reportId')
  @ApiOperation({ summary: 'Obter relatório de BIA por ID' })
  getBiaReport(@Param('reportId') reportId: string) {
    const r = this.biaSvc.getReport(reportId);
    if (!r) return { error: 'Relatório BIA não encontrado', reportId };
    return r;
  }

  // ── INCIDENT RESPONSE ───────────────────────────────────────────────────────

  @Post('incidents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar incidente de segurança ou operacional' })
  createIncident(@Body() dto: CreateIncidentDto) {
    return this.incidentSvc.createIncident(dto, 'API_USER');
  }

  @Post('incidents/:incidentId/status')
  @ApiOperation({ summary: 'Avançar status do incidente na esteira NIST' })
  advanceIncidentStatus(
    @Param('incidentId') incidentId: string,
    @Body('status') status: IncidentStatus,
    @Body('notes') notes: string,
  ) {
    return this.incidentSvc.advanceStatus(incidentId, status, notes ?? '', 'API_USER');
  }

  @Post('incidents/:incidentId/lessons')
  @ApiOperation({ summary: 'Registrar lições aprendidas (Pós-Incidente)' })
  recordLessonsLearned(
    @Param('incidentId') incidentId: string,
    @Body('lessons') lessons: string,
  ) {
    return this.incidentSvc.recordLessonsLearned(incidentId, lessons, 'API_USER');
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Listar incidentes com filtros' })
  @ApiQuery({ name: 'severity', required: false, enum: IncidentSeverity })
  @ApiQuery({ name: 'status', required: false, enum: IncidentStatus })
  @ApiQuery({ name: 'category', required: false, enum: IncidentCategory })
  listIncidents(
    @Query('severity') severity?: IncidentSeverity,
    @Query('status') status?: IncidentStatus,
    @Query('category') category?: IncidentCategory,
  ) {
    return this.incidentSvc.listIncidents(severity, status, category);
  }

  @Get('incidents/:incidentId')
  @ApiOperation({ summary: 'Obter detalhamento de incidente e linha do tempo' })
  getIncident(@Param('incidentId') incidentId: string) {
    const i = this.incidentSvc.getIncident(incidentId);
    if (!i) return { error: 'Incidente não encontrado', incidentId };
    return i;
  }

  // ── DISASTER RECOVERY ───────────────────────────────────────────────────────

  @Post('dr/initiate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar operação de Recuperação de Desastres (DR)' })
  initiateRecovery(@Body() dto: InitiateRecoveryDto) {
    return this.drSvc.initiateRecovery(dto, 'API_USER');
  }

  @Post('dr/:recoveryId/step')
  @ApiOperation({ summary: 'Avançar passo da operação de DR' })
  advanceDrStep(
    @Param('recoveryId') recoveryId: string,
    @Body('stepName') stepName: string,
    @Body('result') result: 'DONE' | 'FAILED',
  ) {
    return this.drSvc.advanceStep(recoveryId, stepName, result ?? 'DONE', 'API_USER');
  }

  @Post('dr/:recoveryId/validate')
  @ApiOperation({ summary: 'Validar integridade dos dados pós-restauração' })
  validateDrIntegrity(@Param('recoveryId') recoveryId: string) {
    return this.drSvc.validateIntegrity(recoveryId, 'API_USER');
  }

  @Post('dr/:recoveryId/complete')
  @ApiOperation({ summary: 'Concluir operação de DR e medir RTO efetivo' })
  completeRecovery(@Param('recoveryId') recoveryId: string) {
    return this.drSvc.completeRecovery(recoveryId, 'API_USER');
  }

  @Post('dr/test')
  @ApiOperation({ summary: 'Executar teste periódico de DR' })
  runPeriodicDrTest(@Body('incidentId') incidentId: string) {
    return this.drSvc.runPeriodicTest(incidentId ?? 'INC-TEST', 'API_USER');
  }

  @Get('dr/operations')
  @ApiOperation({ summary: 'Listar operações de recuperação' })
  @ApiQuery({ name: 'status', required: false, enum: RecoveryStatus })
  listDrOperations(@Query('status') status?: RecoveryStatus) {
    return this.drSvc.listOperations(status);
  }

  // ── CRISIS MANAGEMENT ───────────────────────────────────────────────────────

  @Post('crisis/declare')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Declarar crise corporativa' })
  declareCrisis(@Body() dto: DeclareCrisisDto) {
    return this.crisisSvc.declareCrisis(dto, 'API_USER');
  }

  @Post('crisis/:crisisId/decision')
  @ApiOperation({ summary: 'Registrar decisão do comitê de crise' })
  recordCrisisDecision(
    @Param('crisisId') crisisId: string,
    @Body('description') description: string,
  ) {
    return this.crisisSvc.recordDecision(crisisId, description, 'API_USER');
  }

  @Post('crisis/:crisisId/decisions/:decisionId/approve')
  @ApiOperation({ summary: 'Aprovar decisão do comitê de crise' })
  approveCrisisDecision(
    @Param('crisisId') crisisId: string,
    @Param('decisionId') decisionId: string,
  ) {
    return this.crisisSvc.approveDecision(crisisId, decisionId, 'API_USER');
  }

  @Post('crisis/:crisisId/resolve')
  @ApiOperation({ summary: 'Resolver e encerrar crise' })
  resolveCrisis(
    @Param('crisisId') crisisId: string,
    @Body('summary') summary: string,
  ) {
    return this.crisisSvc.resolveCrisis(crisisId, 'API_USER', summary ?? 'Crise resolvida.');
  }

  @Get('crisis')
  @ApiOperation({ summary: 'Listar crises corporativas' })
  @ApiQuery({ name: 'status', required: false, enum: CrisisStatus })
  listCrises(@Query('status') status?: CrisisStatus) {
    return this.crisisSvc.listCrises(status);
  }

  // ── EMERGENCY COMMUNICATION ─────────────────────────────────────────────────

  @Post('communication/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disparar comunicação de emergência multicanal' })
  sendEmergencyNotification(@Body() dto: SendEmergencyNotificationDto) {
    return this.commSvc.sendNotification(dto, 'API_USER');
  }

  @Post('communication/:notificationId/confirm')
  @ApiOperation({ summary: 'Registrar confirmação de recebimento' })
  confirmNotification(
    @Param('notificationId') notificationId: string,
    @Body('recipient') recipient: string,
    @Body('channel') channel: any,
  ) {
    return this.commSvc.recordConfirmation(notificationId, recipient, channel);
  }

  @Get('communication')
  @ApiOperation({ summary: 'Listar notificações de emergência enviadas' })
  listNotifications(@Query('crisisId') crisisId?: string) {
    return this.commSvc.listNotifications(crisisId);
  }

  // ── RECOVERY ORCHESTRATION ──────────────────────────────────────────────────

  @Post('orchestration/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar workflow orquestrado de recuperação' })
  startOrchestratedRecovery(
    @Body('planId') planId: string,
    @Body('incidentId') incidentId: string,
  ) {
    return this.orchSvc.startOrchestratedRecovery(planId, incidentId, 'API_USER');
  }

  @Post('orchestration/:executionId/next')
  @ApiOperation({ summary: 'Executar próximo passo do workflow orquestrado' })
  executeNextOrchestrationStep(@Param('executionId') executionId: string) {
    return this.orchSvc.executeNextStep(executionId, 'API_USER');
  }

  @Post('orchestration/:executionId/approve/:stepId')
  @ApiOperation({ summary: 'Aprovar manualmente passo do workflow orquestrado' })
  approveOrchestrationStep(
    @Param('executionId') executionId: string,
    @Param('stepId') stepId: string,
  ) {
    return this.orchSvc.approveStep(executionId, stepId, 'API_USER');
  }

  @Get('orchestration')
  @ApiOperation({ summary: 'Listar execuções de orquestração' })
  listOrchestrationExecutions() {
    return this.orchSvc.listExecutions();
  }

  // ── OPERATIONAL RESILIENCE ──────────────────────────────────────────────────

  @Post('resilience/assess')
  @ApiOperation({ summary: 'Executar avaliação da resiliência operacional' })
  assessResilience() {
    return this.resilienceSvc.assessResilience('API_USER');
  }

  @Get('resilience/latest')
  @ApiOperation({ summary: 'Obter último relatório de resiliência' })
  getLatestResilienceReport() {
    return this.resilienceSvc.getLatestReport();
  }

  // ── CONTINUITY AUDIT ────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Trilha imutável de auditoria BCORP (SHA-256)' })
  @ApiQuery({ name: 'subject', required: false })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditSvc.getAuditTrail(subject);
  }
}
