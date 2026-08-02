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

import { HyperautomationService } from '../services/hyperautomation.service';
import { IntelligentWorkflowService } from '../services/intelligent-workflow.service';
import { RpaOrchestrationService } from '../services/rpa-orchestration.service';
import { AutonomousAgentService } from '../services/autonomous-agent.service';
import { ProcessMiningService } from '../services/process-mining.service';
import { DecisionAutomationService } from '../services/decision-automation.service';
import { HumanInTheLoopService } from '../services/human-in-the-loop.service';
import { AutomationGovernanceService } from '../services/automation-governance.service';
import { AutomationAnalyticsService } from '../services/automation-analytics.service';
import { AutomationAuditService } from '../services/automation-audit.service';

import {
  CreateAutomationDto,
  ExecuteRpaTaskDto,
  ActivateAutonomousAgentDto,
  AutomateDecisionDto,
  HumanLoopResolutionDto,
  AutomationDomain,
  AgentType,
} from '../dto/enterprise-hyperautomation.dto';

/**
 * EnterpriseHyperautomationController — P174 EHCOP (Fase XXIV)
 *
 * REST API da Plataforma Corporativa de Hyperautomation, Orquestração Cognitiva
 * e Agentes Autônomos (EHCOP): Automações, Workflows Inteligentes, RPA,
 * Agentes Especializados, Process Mining, Decision Automation (XAI),
 * Human-in-the-Loop, Governança, Analytics e Auditoria SHA-256.
 */
@ApiBearerAuth()
@ApiTags('EHCOP — Enterprise Hyperautomation & Cognitive Orchestration (P174)')
@Controller('ehcop')
export class EnterpriseHyperautomationController {
  constructor(
    private readonly hyperSvc: HyperautomationService,
    private readonly workflowSvc: IntelligentWorkflowService,
    private readonly rpaSvc: RpaOrchestrationService,
    private readonly agentSvc: AutonomousAgentService,
    private readonly miningSvc: ProcessMiningService,
    private readonly decisionSvc: DecisionAutomationService,
    private readonly loopSvc: HumanInTheLoopService,
    private readonly govSvc: AutomationGovernanceService,
    private readonly analyticsSvc: AutomationAnalyticsService,
    private readonly auditSvc: AutomationAuditService,
  ) {}

  // ── HYPERAUTOMATION ────────────────────────────────────────────────────────

  @Post('automations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova automação institucional' })
  createAutomation(@Body() dto: CreateAutomationDto) {
    return this.hyperSvc.createAutomation(dto, 'API_USER');
  }

  @Post('automations/:automationId/approve')
  @ApiOperation({ summary: 'Aprovar automação para produção' })
  approveAutomation(@Param('automationId') automationId: string, @Body('approvedBy') approvedBy: string) {
    return this.hyperSvc.approveAutomation(automationId, approvedBy ?? 'API_USER');
  }

  @Post('automations/:automationId/publish')
  @ApiOperation({ summary: 'Publicar automação aprovada (ativa)' })
  publishAutomation(@Param('automationId') automationId: string, @Body('publishedBy') publishedBy: string) {
    return this.hyperSvc.publishAutomation(automationId, publishedBy ?? 'API_USER');
  }

  @Post('automations/:automationId/execute')
  @ApiOperation({ summary: 'Executar automação ativa' })
  executeAutomation(@Param('automationId') automationId: string) {
    return this.hyperSvc.executeAutomation(automationId, 'API_USER');
  }

  @Get('automations')
  @ApiOperation({ summary: 'Listar automações institucionais' })
  @ApiQuery({ name: 'domain', required: false, enum: AutomationDomain })
  listAutomations(@Query('domain') domain?: AutomationDomain) {
    return this.hyperSvc.listAutomations(domain);
  }

  @Get('automations/:automationId')
  @ApiOperation({ summary: 'Obter automação pelo ID' })
  getAutomation(@Param('automationId') automationId: string) {
    const a = this.hyperSvc.getAutomation(automationId);
    if (!a) return { error: 'Automação não encontrada', automationId };
    return a;
  }

  // ── INTELLIGENT WORKFLOWS ─────────────────────────────────────────────────

  @Post('workflows')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar workflow inteligente multi-etapa' })
  registerWorkflow(@Body() body: { workflowId: string; name: string; steps: any[]; triggers: string[] }) {
    return this.workflowSvc.registerWorkflow(body.workflowId, body.name, body.steps ?? [], body.triggers ?? []);
  }

  @Post('workflows/:workflowId/execute')
  @ApiOperation({ summary: 'Executar workflow inteligente' })
  executeWorkflow(@Param('workflowId') workflowId: string) {
    return this.workflowSvc.executeWorkflow(workflowId, 'API_USER');
  }

  @Get('workflows')
  @ApiOperation({ summary: 'Listar workflows registrados' })
  listWorkflows() {
    return this.workflowSvc.listWorkflows();
  }

  // ── RPA ORCHESTRATION ─────────────────────────────────────────────────────

  @Post('rpa/tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enfileirar tarefa RPA para execução' })
  enqueueRpaTask(@Body() dto: ExecuteRpaTaskDto) {
    return this.rpaSvc.enqueueTask(dto, 'API_USER');
  }

  @Post('rpa/tasks/:taskId/execute')
  @ApiOperation({ summary: 'Executar tarefa RPA enfileirada' })
  executeRpaTask(@Param('taskId') taskId: string) {
    return this.rpaSvc.executeTask(taskId);
  }

  @Get('rpa/tasks')
  @ApiOperation({ summary: 'Listar tarefas RPA' })
  @ApiQuery({ name: 'domain', required: false, enum: AutomationDomain })
  listRpaTasks(@Query('domain') domain?: AutomationDomain) {
    return this.rpaSvc.listTasks(domain);
  }

  @Get('rpa/queue/depth')
  @ApiOperation({ summary: 'Obter profundidade atual da fila de tarefas RPA' })
  getRpaQueueDepth() {
    return { queueDepth: this.rpaSvc.getQueueDepth() };
  }

  // ── AUTONOMOUS AGENTS ─────────────────────────────────────────────────────

  @Post('agents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ativar agente autônomo especializado' })
  activateAgent(@Body() dto: ActivateAutonomousAgentDto) {
    return this.agentSvc.activateAgent(dto, 'API_USER');
  }

  @Post('agents/:agentId/actions')
  @ApiOperation({ summary: 'Registrar ação executada por agente autônomo' })
  recordAgentAction(
    @Param('agentId') agentId: string,
    @Body('description') description: string,
    @Body('outcome') outcome: any,
  ) {
    return this.agentSvc.recordAgentAction(agentId, description, outcome ?? 'SUCCESS');
  }

  @Get('agents')
  @ApiOperation({ summary: 'Listar agentes autônomos ativos' })
  @ApiQuery({ name: 'type', required: false, enum: AgentType })
  listAgents(@Query('type') type?: AgentType) {
    return this.agentSvc.listAgents(type);
  }

  @Get('agents/:agentId')
  @ApiOperation({ summary: 'Obter agente autônomo pelo ID' })
  getAgent(@Param('agentId') agentId: string) {
    const a = this.agentSvc.getAgent(agentId);
    if (!a) return { error: 'Agente não encontrado', agentId };
    return a;
  }

  // ── PROCESS MINING ────────────────────────────────────────────────────────

  @Post('process-mining')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Executar mineração de processo institucional' })
  mineProcess(@Body('processName') processName: string, @Body('domain') domain: AutomationDomain) {
    return this.miningSvc.mineProcess(processName ?? 'Processo', domain ?? AutomationDomain.ADMINISTRATIVE, 'API_USER');
  }

  @Get('process-mining/results')
  @ApiOperation({ summary: 'Listar resultados de mineração de processos' })
  @ApiQuery({ name: 'domain', required: false, enum: AutomationDomain })
  listMiningResults(@Query('domain') domain?: AutomationDomain) {
    return this.miningSvc.listMiningResults(domain);
  }

  // ── DECISION AUTOMATION ───────────────────────────────────────────────────

  @Post('decisions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Executar decisão automatizada (regras institucionais + IA explicável)' })
  automateDecision(@Body() dto: AutomateDecisionDto) {
    return this.decisionSvc.automateDecision(dto, 'API_USER');
  }

  @Get('decisions')
  @ApiOperation({ summary: 'Listar decisões automatizadas realizadas' })
  listDecisions() {
    return this.decisionSvc.listDecisions();
  }

  @Get('decisions/:decisionId')
  @ApiOperation({ summary: 'Obter decisão específica com explicação (XAI)' })
  getDecision(@Param('decisionId') decisionId: string) {
    const d = this.decisionSvc.getDecision(decisionId);
    if (!d) return { error: 'Decisão não encontrada', decisionId };
    return d;
  }

  // ── HUMAN-IN-THE-LOOP ─────────────────────────────────────────────────────

  @Post('human-loop/request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar aprovação humana para processo crítico' })
  requestHumanApproval(
    @Body('loopId') loopId: string,
    @Body('processName') processName: string,
    @Body('context') context: Record<string, any>,
    @Body('autonomyLevel') autonomyLevel?: any,
  ) {
    return this.loopSvc.requestHumanApproval(loopId, processName, context ?? {}, autonomyLevel ?? 'SUPERVISED');
  }

  @Post('human-loop/resolve')
  @ApiOperation({ summary: 'Resolver tarefa de aprovação humana' })
  resolveHumanLoop(@Body() dto: HumanLoopResolutionDto) {
    return this.loopSvc.resolveLoop(dto);
  }

  @Get('human-loop/pending')
  @ApiOperation({ summary: 'Listar tarefas pendentes de aprovação humana' })
  listPendingLoops() {
    return this.loopSvc.listPendingLoops();
  }

  // ── GOVERNANCE ────────────────────────────────────────────────────────────

  @Post('governance/policies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar política de governança para automação' })
  registerPolicy(
    @Body('automationId') automationId: string,
    @Body('approvedBy') approvedBy: string,
    @Body('version') version: string,
    @Body('requiresHumanReview') requiresHumanReview: boolean,
  ) {
    return this.govSvc.registerPolicy(automationId, approvedBy ?? 'API_USER', version ?? '1.0.0', requiresHumanReview ?? false);
  }

  @Post('governance/:automationId/deprecate')
  @ApiOperation({ summary: 'Deprecar automação (desativar com justificativa)' })
  deprecateAutomation(
    @Param('automationId') automationId: string,
    @Body('deprecatedBy') deprecatedBy: string,
    @Body('reason') reason: string,
  ) {
    return this.govSvc.deprecateAutomation(automationId, deprecatedBy ?? 'API_USER', reason ?? 'Descontinuada');
  }

  @Get('governance/policies')
  @ApiOperation({ summary: 'Listar políticas de governança registradas' })
  listPolicies() {
    return this.govSvc.listPolicies();
  }

  // ── ANALYTICS ─────────────────────────────────────────────────────────────

  @Post('analytics/report')
  @ApiOperation({ summary: 'Gerar relatório executivo de indicadores de automação (ROA, produtividade)' })
  generateAnalyticsReport() {
    return this.analyticsSvc.generateAnalyticsReport('API_USER');
  }

  // ── AUDIT ─────────────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Trilha imutável de auditoria EHCOP com assinatura SHA-256' })
  @ApiQuery({ name: 'subject', required: false })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditSvc.getAuditTrail(subject);
  }

  @Get('audit/count')
  @ApiOperation({ summary: 'Total de entradas na trilha de auditoria EHCOP' })
  getAuditCount() {
    return { count: this.auditSvc.getAuditCount() };
  }
}
