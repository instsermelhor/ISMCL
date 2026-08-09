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
  CalculateChangeImpactDto,
  CreateImprovementPlanDto,
  DetectEvolutionOpportunitiesDto,
  EvaluateInnovationDto,
  EvolutionType,
  GenerateStrategicRecommendationDto,
  ImprovementCategory,
  InnovationPhase,
  LearningCategory,
  ProcessGovernanceApprovalDto,
  ProposeProcessOptimizationDto,
  RecordLearningDto,
  StrategicCategory,
  SubmitGovernanceApprovalDto,
  SubmitInnovationProposalDto,
} from '../dto/autonomous-evolution.dto';
import { AutonomousEvolutionEngineService } from '../services/autonomous-evolution-engine.service';
import { ContinuousImprovementService } from '../services/continuous-improvement.service';
import { AdaptiveProcessOptimizationService } from '../services/adaptive-process-optimization.service';
import { InnovationManagementService } from '../services/innovation-management.service';
import { ChangeImpactAnalysisService } from '../services/change-impact-analysis.service';
import { InstitutionalLearningService } from '../services/institutional-learning.service';
import { StrategicRecommendationService } from '../services/strategic-recommendation.service';
import { GovernanceApprovalService } from '../services/governance-approval.service';
import { EvolutionKnowledgeBaseService } from '../services/evolution-knowledge-base.service';
import { ContinuousEvolutionAuditService } from '../services/continuous-evolution-audit.service';

@ApiTags('Autonomous Evolution Engine (AAEE)')
@ApiBearerAuth()
@Controller('api/v1/evolution')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AutonomousEvolutionController {
  constructor(
    private readonly evolutionEngine: AutonomousEvolutionEngineService,
    private readonly continuousImprovement: ContinuousImprovementService,
    private readonly adaptiveOptimization: AdaptiveProcessOptimizationService,
    private readonly innovationManagement: InnovationManagementService,
    private readonly changeImpactAnalysis: ChangeImpactAnalysisService,
    private readonly institutionalLearning: InstitutionalLearningService,
    private readonly strategicRecommendation: StrategicRecommendationService,
    private readonly governanceApproval: GovernanceApprovalService,
    private readonly knowledgeBase: EvolutionKnowledgeBaseService,
    private readonly evolutionAudit: ContinuousEvolutionAuditService,
  ) {}

  // ── 1. Motor de Evolução Autônoma ───────────────────────────────────────────

  @Post('opportunities/detect')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CINO', 'CEA')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detecta automaticamente oportunidades de evolução na plataforma',
    description: 'Analisa arquitetura, workflows, desempenho, utilização de módulos e qualidade dos serviços.',
  })
  @ApiResponse({ status: 200, description: 'Oportunidades de evolução detectadas' })
  detectOpportunities(@Body() dto: DetectEvolutionOpportunitiesDto) {
    return this.evolutionEngine.detectEvolutionOpportunities(dto);
  }

  @Post('cycles/run')
  @Roles('SUPER_ADMIN', 'CINO', 'CEA', 'CTO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa ciclo completo de evolução autônoma (Observação → Análise → Recomendação)' })
  runEvolutionCycle() {
    return this.evolutionEngine.generateEvolutionCycle();
  }

  @Get('opportunities')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CINO', 'CEA')
  @ApiOperation({ summary: 'Lista oportunidades de evolução registradas' })
  @ApiQuery({ name: 'type', enum: EvolutionType, required: false })
  listOpportunities(@Query('type') type?: EvolutionType) {
    return this.evolutionEngine.getOpportunities(type);
  }

  // ── 2. Melhoria Contínua ───────────────────────────────────────────────────

  @Post('improvements/plan')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CINO', 'OPERATIONS_HEAD')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria plano estruturado de melhoria contínua' })
  createImprovementPlan(@Body() dto: CreateImprovementPlanDto) {
    return this.continuousImprovement.createImprovementPlan(dto);
  }

  @Get('improvements/bottlenecks')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_HEAD')
  @ApiOperation({ summary: 'Identifica gargalos, redundâncias e desperdícios operacionais' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'moduleId', required: false })
  identifyBottlenecks(@Query('tenantId') tenantId: string, @Query('moduleId') moduleId?: string) {
    return this.continuousImprovement.identifyBottlenecks(tenantId, moduleId);
  }

  @Get('improvements')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_HEAD')
  @ApiOperation({ summary: 'Lista planos de melhoria contínua' })
  listImprovementPlans() {
    return this.continuousImprovement.listImprovementPlans();
  }

  // ── 3. Otimização Adaptativa de Processos ───────────────────────────────────

  @Post('processes/:processId/analyze')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEA', 'OPERATIONS_HEAD')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analisa tempos, filas e eficiência de um processo' })
  @ApiParam({ name: 'processId', description: 'ID do processo (ex: PROC-INTAKE-001)' })
  analyzeProcess(@Param('processId') processId: string) {
    return this.adaptiveOptimization.analyzeProcessMetrics(processId);
  }

  @Post('processes/optimize')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEA', 'OPERATIONS_HEAD')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Propõe otimização adaptativa parametrizável para um processo' })
  proposeProcessOptimization(@Body() dto: ProposeProcessOptimizationDto) {
    return this.adaptiveOptimization.proposeOptimization(dto);
  }

  @Patch('processes/proposals/:proposalId/apply')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEA')
  @ApiOperation({ summary: 'Aplica ajuste parametrizável aprovado por supervisor humano' })
  @ApiParam({ name: 'proposalId', description: 'ID da proposta de otimização' })
  applyOptimization(@Param('proposalId') proposalId: string, @Body('approverId') approverId: string) {
    return this.adaptiveOptimization.applyParametricAdjustment(proposalId, approverId);
  }

  // ── 4. Gestão da Inovação ──────────────────────────────────────────────────

  @Post('innovations')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CINO', 'INNOVATION_PROPOSER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submete nova proposta de inovação institucional' })
  submitInnovation(@Body() dto: SubmitInnovationProposalDto) {
    return this.innovationManagement.submitProposal(dto);
  }

  @Post('innovations/evaluate')
  @Roles('SUPER_ADMIN', 'CINO', 'EVALUATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avalia proposta de inovação (score de impacto, risco e prioridade)' })
  evaluateInnovation(@Body() dto: EvaluateInnovationDto) {
    return this.innovationManagement.evaluateProposal(dto);
  }

  @Patch('innovations/:id/approve-pilot')
  @Roles('SUPER_ADMIN', 'CINO', 'CEO')
  @ApiOperation({ summary: 'Aprova piloto experimental para proposta de inovação' })
  @ApiParam({ name: 'id', description: 'ID da inovação (ex: INV-2026-XXXX)' })
  approveInnovationPilot(@Param('id') id: string, @Body('approverId') approverId: string) {
    return this.innovationManagement.approvePilot(id, approverId);
  }

  @Get('innovations')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CINO')
  @ApiOperation({ summary: 'Lista propostas de inovação priorizadas por score' })
  @ApiQuery({ name: 'phase', enum: InnovationPhase, required: false })
  listInnovations(@Query('phase') phase?: InnovationPhase) {
    return this.innovationManagement.listInnovations(phase);
  }

  // ── 5. Análise de Impacto de Mudanças ──────────────────────────────────────

  @Post('changes/impact')
  @Roles('SUPER_ADMIN', 'CISO', 'CEA', 'DEVSECOPS')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcula matriz multidimensional de impacto de mudança (10 dimensões)',
    description: 'Avalia arquitetura, segurança, LGPD, integrações, workflows, banco, IA, docs, treinamento e KPIs.',
  })
  calculateChangeImpact(@Body() dto: CalculateChangeImpactDto) {
    return this.changeImpactAnalysis.calculateImpact(dto);
  }

  @Get('changes/impact/:impactAnalysisId')
  @Roles('SUPER_ADMIN', 'CISO', 'CEA')
  @ApiOperation({ summary: 'Obtém matriz de impacto detalhada por ID' })
  @ApiParam({ name: 'impactAnalysisId', description: 'ID da análise de impacto' })
  getImpactMatrix(@Param('impactAnalysisId') impactAnalysisId: string) {
    return this.changeImpactAnalysis.getImpactMatrix(impactAnalysisId);
  }

  // ── 6. Aprendizagem Institucional ──────────────────────────────────────────

  @Post('learning')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CINO', 'DATA_OFFICER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra aprendizado institucional e atualiza automaticamente a Base de Conhecimento' })
  recordLearning(@Body() dto: RecordLearningDto) {
    return this.institutionalLearning.recordLearning(dto);
  }

  @Get('learning/lessons')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CINO', 'DATA_OFFICER')
  @ApiOperation({ summary: 'Consulta lições aprendidas e melhores práticas institucionais' })
  @ApiQuery({ name: 'category', enum: LearningCategory, required: false })
  @ApiQuery({ name: 'tag', required: false })
  queryLessonsLearned(@Query('category') category?: LearningCategory, @Query('tag') tag?: string) {
    return this.institutionalLearning.queryLessonsLearned(category, tag);
  }

  // ── 7. Recomendações Estratégicas ──────────────────────────────────────────

  @Post('recommendations/strategic/generate')
  @Roles('SUPER_ADMIN', 'CEO', 'CSO', 'CINO', 'CEA')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gera recomendação estratégica com justificativa, evidências, custo e riscos' })
  generateStrategicRecommendation(@Body() dto: GenerateStrategicRecommendationDto) {
    return this.strategicRecommendation.generateStrategicRecommendation(dto);
  }

  @Patch('recommendations/strategic/:id/review')
  @Roles('SUPER_ADMIN', 'CEO', 'CSO')
  @ApiOperation({ summary: 'Revisa recomendação estratégica (Human-in-the-Loop)' })
  @ApiParam({ name: 'id', description: 'ID da recomendação estratégica' })
  reviewStrategicRecommendation(
    @Param('id') id: string,
    @Body('reviewerId') reviewerId: string,
    @Body('approved') approved: boolean,
    @Body('comments') comments?: string,
  ) {
    return this.strategicRecommendation.reviewRecommendation(id, reviewerId, approved, comments);
  }

  @Get('recommendations/strategic')
  @Roles('SUPER_ADMIN', 'CEO', 'CSO', 'CINO')
  @ApiOperation({ summary: 'Lista recomendações estratégicas institucionais' })
  @ApiQuery({ name: 'category', enum: StrategicCategory, required: false })
  listStrategicRecommendations(@Query('category') category?: StrategicCategory) {
    return this.strategicRecommendation.listStrategicRecommendations(category);
  }

  // ── 8. Governança & Aprovação ───────────────────────────────────────────────

  @Post('governance/submit')
  @Roles('SUPER_ADMIN', 'CISO', 'CEA', 'DEVSECOPS')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submete solicitação formal de aprovação para mudança estrutural' })
  submitGovernanceApproval(@Body() dto: SubmitGovernanceApprovalDto) {
    return this.governanceApproval.submitForApproval(dto);
  }

  @Post('governance/approve-step')
  @Roles('SUPER_ADMIN', 'CISO', 'CEA', 'GOVERNANCE_HEAD')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Processa etapa de aprovação de governança (multi-layer HITL mandatory)' })
  processGovernanceApproval(@Body() dto: ProcessGovernanceApprovalDto) {
    return this.governanceApproval.processApprovalStep(dto);
  }

  @Get('governance/approvals')
  @Roles('SUPER_ADMIN', 'CISO', 'CEA', 'GOVERNANCE_HEAD')
  @ApiOperation({ summary: 'Lista solicitações de aprovação de governança' })
  listGovernanceApprovals() {
    return this.governanceApproval.listApprovals();
  }

  // ── 9. Base de Conhecimento Evolutiva ──────────────────────────────────────

  @Get('knowledge/search')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEA', 'DATA_OFFICER')
  @ApiOperation({ summary: 'Busca na Base Institucional de Conhecimento Evolutivo' })
  @ApiQuery({ name: 'q', description: 'Termo de busca', required: false })
  @ApiQuery({ name: 'category', required: false })
  searchKnowledge(@Query('q') query = '', @Query('category') category?: string) {
    return this.knowledgeBase.searchKnowledge(query, category);
  }

  @Get('knowledge/decisions')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEA')
  @ApiOperation({ summary: 'Obtém histórico de decisões arquiteturais (ADRs)' })
  getDecisionHistory() {
    return this.knowledgeBase.getDecisionHistory();
  }

  // ── 10. Auditoria de Evolução Contínua ─────────────────────────────────────

  @Get('audits')
  @Roles('SUPER_ADMIN', 'CISO', 'AUDITOR')
  @ApiOperation({ summary: 'Obtém trilha imutável de auditoria da evolução autônoma (SHA-256)' })
  @ApiQuery({ name: 'componentName', required: false })
  getEvolutionAuditTrail(@Query('componentName') componentName?: string) {
    return this.evolutionAudit.getEvolutionAuditTrail(componentName);
  }
}
