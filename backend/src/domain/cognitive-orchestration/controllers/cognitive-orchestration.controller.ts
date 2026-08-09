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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import {
  DispatchCognitiveTaskDto,
  ExecuteReasoningDto,
  ReasoningQueryDto,
  RecommendationFeedbackDto,
  GenerateRecommendationDto,
  ModelRegistrationDto,
  RegisterModelDto,
  RouteTaskDto,
  ModelLifecycleState,
  ModelStatus,
  RecommendationCategory,
} from '../dto/cognitive-orchestration.dto';
import { CognitiveOrchestratorService } from '../services/cognitive-orchestrator.service';
import { MultiAgentCoordinationService } from '../services/multi-agent-coordination.service';
import { AITaskRoutingService } from '../services/ai-task-routing.service';
import { AICollaborationService } from '../services/ai-collaboration.service';
import { InstitutionalReasoningEngine } from '../services/institutional-reasoning.service';
import { AutonomousRecommendationService } from '../services/autonomous-recommendation.service';
import { ModelRegistryLifecycleService } from '../services/model-registry-lifecycle.service';
import { AIPerformanceMonitoringService } from '../services/ai-performance-monitoring.service';
import { CognitiveMemoryService } from '../services/cognitive-memory.service';
import { CognitiveAuditService } from '../services/cognitive-audit.service';

@ApiTags('Cognitive Orchestration Platform (ACOP)')
@ApiBearerAuth()
@Controller('api/v1/cognitive')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CognitiveOrchestrationController {
  constructor(
    private readonly cognitiveOrchestrator: CognitiveOrchestratorService,
    private readonly multiAgentCoordination: MultiAgentCoordinationService,
    private readonly taskRouting: AITaskRoutingService,
    private readonly aiCollaboration: AICollaborationService,
    private readonly reasoningEngine: InstitutionalReasoningEngine,
    private readonly recommendationService: AutonomousRecommendationService,
    private readonly modelRegistry: ModelRegistryLifecycleService,
    private readonly performanceMonitoring: AIPerformanceMonitoringService,
    private readonly memoryService: CognitiveMemoryService,
    private readonly auditService: CognitiveAuditService,
  ) {}

  // ── 1. Orquestração Cognitiva Central ────────────────────────────────────────

  @Post('orchestration/dispatch')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASE_MANAGER', 'HEALTH_PROFESSIONAL')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Despacha tarefa cognitiva para orquestração multi-agente',
    description: 'Roteia a tarefa para agentes especializados, inicia colaboração, raciocínio e gera recomendações. Nenhum agente atua isoladamente.',
  })
  @ApiResponse({ status: 200, description: 'Tarefa orquestrada com sucesso' })
  async dispatchCognitiveTask(@Body() dto: DispatchCognitiveTaskDto) {
    return this.cognitiveOrchestrator.orchestrate({
      taskId: dto.taskId,
      title: dto.title,
      description: dto.description,
      tenantId: 'TENANT-DEFAULT', // TODO: extrair do JWT via @Tenant() decorator
      targetDomains: dto.targetDomains,
      priority: dto.priority,
      caseId: dto.caseId,
      context: dto.taskContext?.metadata,
      requireReasoning: true,
      requireRecommendation: false,
    });
  }

  // ── 2. Coordenação Multi-Agente ───────────────────────────────────────────────

  @Get('agents')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO')
  @ApiOperation({
    summary: 'Lista todos os agentes especializados registrados',
    description: 'Retorna o catálogo completo dos 14 agentes especializados por domínio.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de agentes retornado' })
  listAgents() {
    return this.multiAgentCoordination.getAgentCatalog();
  }

  @Get('agents/health')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO')
  @ApiOperation({ summary: 'Verifica saúde do pool de agentes cognitivos' })
  getAgentHealth() {
    return this.multiAgentCoordination.getSystemHealth();
  }

  @Get('agents/routing-pool')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO', 'DATA_OFFICER')
  @ApiOperation({ summary: 'Status do pool de roteamento de agentes' })
  getRoutingPool() {
    return this.taskRouting.getAgentPoolStatus();
  }

  // ── 3. Raciocínio Institucional ───────────────────────────────────────────────

  @Post('reasoning/query')
  @Roles('SUPER_ADMIN', 'ADMIN', 'HEALTH_PROFESSIONAL', 'LEGAL_AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Executa raciocínio institucional baseado em evidências',
    description: 'Consolida Knowledge Graph, ECM, BI, Workflow Engine, Rules Engine, Base Vetorial e Histórico Institucional.',
  })
  queryInstitutionalReasoning(@Body() dto: ExecuteReasoningDto | ReasoningQueryDto) {
    return this.reasoningEngine.executeReasoning(dto);
  }

  // ── 4. Recomendações Autônomas ────────────────────────────────────────────────

  @Post('recommendations/generate')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASE_MANAGER', 'CLINICAL_DIRECTOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Gera recomendação institucional autônoma',
    description: 'Toda recomendação contém justificativa, evidências, impacto estimado, confiança e exige aprovação humana (Human-in-the-Loop).',
  })
  generateRecommendation(@Body() dto: GenerateRecommendationDto) {
    return this.recommendationService.generateRecommendation(dto);
  }

  @Post('recommendations/feedback')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASE_MANAGER', 'CLINICAL_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Processa feedback humano em recomendação (aprovação/rejeição)' })
  processRecommendationFeedback(@Body() dto: RecommendationFeedbackDto) {
    return this.recommendationService.processHumanFeedback(dto);
  }

  @Get('recommendations')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASE_MANAGER', 'CLINICAL_DIRECTOR')
  @ApiOperation({ summary: 'Lista recomendações institucionais, opcionalmente filtradas por categoria' })
  @ApiQuery({ name: 'category', enum: RecommendationCategory, required: false })
  listRecommendations(@Query('category') category?: RecommendationCategory) {
    return this.recommendationService.listRecommendations(category);
  }

  @Get('recommendations/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASE_MANAGER', 'CLINICAL_DIRECTOR')
  @ApiOperation({ summary: 'Obtém recomendação por ID' })
  @ApiParam({ name: 'id', description: 'ID da recomendação (ex: REC-2026-XXXXXX)' })
  getRecommendation(@Param('id') id: string) {
    return this.recommendationService.getRecommendation(id);
  }

  // ── 5. Gestão de Modelos ──────────────────────────────────────────────────────

  @Post('models/register')
  @Roles('SUPER_ADMIN', 'CISO')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra novo modelo de IA no catálogo corporativo' })
  registerModel(@Body() dto: RegisterModelDto) {
    return this.modelRegistry.registerModel(dto);
  }

  @Patch('models/:modelId/state')
  @Roles('SUPER_ADMIN', 'CISO')
  @ApiOperation({ summary: 'Transiciona o estado do ciclo de vida de um modelo (requer aprovação humana para DEPLOYED)' })
  @ApiParam({ name: 'modelId', description: 'ID do modelo registrado' })
  transitionModelState(
    @Param('modelId') modelId: string,
    @Body('newState') newState: ModelLifecycleState,
    @Body('humanApproverId') humanApproverId?: string,
  ) {
    return this.modelRegistry.transitionState(modelId, newState, humanApproverId);
  }

  @Patch('models/:modelId/promote')
  @Roles('SUPER_ADMIN', 'CISO')
  @ApiOperation({ summary: 'Promove modelo para PRODUCTION (Human-in-the-Loop obrigatório)' })
  @ApiParam({ name: 'modelId', description: 'ID do modelo a promover' })
  promoteModel(
    @Param('modelId') modelId: string,
    @Body('targetStatus') targetStatus: ModelStatus,
    @Body('humanApproverId') humanApproverId: string,
  ) {
    return this.modelRegistry.promoteModel(modelId, targetStatus, humanApproverId);
  }

  @Get('models')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO')
  @ApiOperation({ summary: 'Lista todos os modelos de IA registrados no catálogo' })
  listModels() {
    return this.modelRegistry.listModels();
  }

  @Get('models/:modelId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO')
  @ApiOperation({ summary: 'Obtém detalhes de um modelo por ID' })
  @ApiParam({ name: 'modelId', description: 'ID do modelo' })
  getModel(@Param('modelId') modelId: string) {
    return this.modelRegistry.getModel(modelId);
  }

  // ── 6. Monitoramento de Performance ──────────────────────────────────────────

  @Get('performance')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO', 'DATA_OFFICER')
  @ApiOperation({ summary: 'Obtém métricas de performance de todos os agentes e modelos' })
  getPerformanceMetrics() {
    return this.performanceMonitoring.getAllMetrics();
  }

  @Get('performance/:modelId/stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO', 'DATA_OFFICER')
  @ApiOperation({ summary: 'Obtém estatísticas agregadas de telemetria para um modelo específico' })
  @ApiParam({ name: 'modelId', description: 'ID do modelo ou agente' })
  async getAggregatedStats(@Param('modelId') modelId: string) {
    return this.performanceMonitoring.getAggregatedStats(modelId);
  }

  // ── 7. Memória Cognitiva ──────────────────────────────────────────────────────

  @Get('memory')
  @Roles('SUPER_ADMIN', 'ADMIN', 'DATA_OFFICER')
  @ApiOperation({ summary: 'Busca na memória cognitiva institucional' })
  @ApiQuery({ name: 'q', description: 'Termo de busca textual', required: false })
  searchCognitiveMemory(@Query('q') queryKey = '') {
    return this.memoryService.searchMemory(queryKey);
  }

  @Get('memory/all')
  @Roles('SUPER_ADMIN', 'ADMIN', 'DATA_OFFICER')
  @ApiOperation({ summary: 'Lista toda a memória cognitiva institucional' })
  getAllMemory() {
    return this.memoryService.getAllMemory();
  }

  // ── 8. Colaboração Multi-Agente ───────────────────────────────────────────────

  @Get('collaboration/sessions')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Lista sessões de colaboração multi-agente ativas' })
  getCollaborationSessions() {
    return this.aiCollaboration.getActiveSessions();
  }

  // ── 9. Auditoria Cognitiva ────────────────────────────────────────────────────

  @Get('audits')
  @Roles('SUPER_ADMIN', 'CISO', 'AUDITOR')
  @ApiOperation({ summary: 'Obtém trilha de auditoria cognitiva imutável (SHA-256)' })
  @ApiQuery({ name: 'agentId', description: 'Filtrar por agente específico', required: false })
  async getAuditLogs(@Query('agentId') agentId?: string) {
    return this.auditService.getAuditLogs(agentId);
  }

  // ── 10. Conflitos de Coordenação ─────────────────────────────────────────────

  @Get('coordination/conflicts')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO')
  @ApiOperation({ summary: 'Lista histórico de resolução de conflitos entre agentes' })
  getConflictLog() {
    return this.multiAgentCoordination.getConflictLog();
  }
}
