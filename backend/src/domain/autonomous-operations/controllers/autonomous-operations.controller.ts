import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AIOperationsOrchestratorService } from '../services/ai-operations-orchestrator.service';
import { MultiAgentCoordinationService } from '../services/multi-agent-coordination.service';
import { ContinuousImprovementService } from '../services/continuous-improvement.service';
import { OperationalRecommendationService } from '../services/operational-recommendation.service';
import { AITaskDelegationService } from '../services/ai-task-delegation.service';
import { OperationalOptimizationService } from '../services/operational-optimization.service';
import { AIPerformanceMonitoringService } from '../services/ai-performance-monitoring.service';
import { AutonomousAssistanceService } from '../services/autonomous-assistance.service';
import { OperationalLearningService } from '../services/operational-learning.service';
import { ImprovementGovernanceService } from '../services/improvement-governance.service';
import {
  CoordinateAgentsDto,
  DelegateTaskDto,
  GenerateRecommendationDto,
  RecommendationStatus,
  RecordOperationalLearningDto,
  ReviewRecommendationDto,
} from '../dto/autonomous-operations.dto';

@ApiTags('AOCP — Autonomous Operations, AI Orchestration & Continuous Improvement Platform (P164)')
@ApiBearerAuth()
@Controller('api/v1/operations')
export class AutonomousOperationsController {
  constructor(
    private readonly orchestratorService: AIOperationsOrchestratorService,
    private readonly multiAgentService: MultiAgentCoordinationService,
    private readonly continuousImprovement: ContinuousImprovementService,
    private readonly recommendationService: OperationalRecommendationService,
    private readonly taskDelegation: AITaskDelegationService,
    private readonly optimizationService: OperationalOptimizationService,
    private readonly aiPerformance: AIPerformanceMonitoringService,
    private readonly assistanceService: AutonomousAssistanceService,
    private readonly learningService: OperationalLearningService,
    private readonly governanceService: ImprovementGovernanceService,
  ) {}

  // ── 1. AI OPERATIONS ORCHESTRATOR ──────────────────────────────────────────

  @Get('orchestrator/status')
  @ApiOperation({ summary: 'Obtém o status do Orquestrador Central de Operações de IA' })
  async getOrchestratorStatus() {
    return this.orchestratorService.getOrchestratorStatus();
  }

  // ── 2. MULTI-AGENT COORDINATION ─────────────────────────────────────────────

  @Post('agents/coordinate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Coordena agentes de IA especialistas em torno de uma demanda' })
  async coordinateAgents(@Body() dto: CoordinateAgentsDto) {
    return this.multiAgentService.coordinateAgents(dto);
  }

  @Get('agents')
  @ApiOperation({ summary: 'Lista os 11 agentes especialistas registrados e seu status' })
  listAgents() {
    return this.multiAgentService.listAgents();
  }

  // ── 3. CONTINUOUS IMPROVEMENT & RECOMMENDATIONS ────────────────────────────

  @Get('improvements/opportunities')
  @ApiOperation({ summary: 'Identifica automaticamente oportunidades de melhoria contínua' })
  async detectOpportunities() {
    return this.continuousImprovement.detectOpportunities();
  }

  @Post('recommendations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gera recomendação operacional explicável' })
  async generateRecommendation(@Body() dto: GenerateRecommendationDto) {
    return this.recommendationService.generateRecommendation(dto);
  }

  @Post('recommendations/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revisa e aprova/rejeita recomendação sob governança humana' })
  async reviewRecommendation(@Body() dto: ReviewRecommendationDto) {
    return this.recommendationService.reviewRecommendation(dto);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Lista recomendações operacionais com filtro por status' })
  @ApiQuery({ name: 'status', required: false, enum: RecommendationStatus })
  listRecommendations(@Query('status') status?: RecommendationStatus) {
    return this.recommendationService.listRecommendations(status);
  }

  // ── 4. AI TASK DELEGATION ───────────────────────────────────────────────────

  @Post('tasks/delegate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Delega tarefa operacional para agente de IA, equipe ou gestor' })
  async delegateTask(@Body() dto: DelegateTaskDto) {
    return this.taskDelegation.delegateTask(dto);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Lista tarefas delegadas com filtro por responsável' })
  @ApiQuery({ name: 'assigneeId', required: false, type: String })
  listTasks(@Query('assigneeId') assigneeId?: string) {
    return this.taskDelegation.listTasks(assigneeId);
  }

  // ── 5. OPTIMIZATION & AI PERFORMANCE ───────────────────────────────────────

  @Post('optimizations/plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria plano de otimização operacional para um domínio' })
  async createOptimizationPlan(@Body() body: { targetDomain: string }) {
    return this.optimizationService.createOptimizationPlan(body.targetDomain);
  }

  @Get('optimizations/plans')
  @ApiOperation({ summary: 'Lista os planos de otimização operacional propostos' })
  listOptimizationPlans() {
    return this.optimizationService.listPlans();
  }

  @Get('ai/performance')
  @ApiOperation({ summary: 'Monitora métricas de desempenho dos agentes e modelos de IA' })
  async getAIPerformanceMetrics() {
    return this.aiPerformance.getPerformanceMetrics();
  }

  // ── 6. AUTONOMOUS ASSISTANCE & OPERATIONAL LEARNING ─────────────────────────

  @Post('assistance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fornece assistência autônoma em tempo real para operadores e gestores' })
  async provideAssistance(@Body() body: { userRole: string; query: string }) {
    return this.assistanceService.provideAssistance(body.userRole, body.query);
  }

  @Post('learning')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra aprendizado operacional e lição aprendida antes/depois' })
  async recordLearning(@Body() dto: RecordOperationalLearningDto) {
    return this.learningService.recordLearning(dto);
  }

  @Get('learning')
  @ApiOperation({ summary: 'Lista a base de conhecimentos de aprendizagem operacional' })
  listLearnings() {
    return this.learningService.listLearnings();
  }

  // ── 7. GOVERNANCE AUDIT TRAIL ───────────────────────────────────────────────

  @Get('audit/trail')
  @ApiOperation({ summary: 'Consulta a trilha SHA-256 de auditoria de operações de IA' })
  @ApiQuery({ name: 'subject', required: false, type: String })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.governanceService.getAuditTrail(subject);
  }
}
