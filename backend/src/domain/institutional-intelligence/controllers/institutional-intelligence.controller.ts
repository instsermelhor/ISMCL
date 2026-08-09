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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { InstitutionalIntelligenceService } from '../services/institutional-intelligence.service';
import { DecisionIntelligenceService } from '../services/decision-intelligence.service';
import { PredictiveAnalyticsService } from '../services/predictive-analytics.service';
import { RecommendationEngineService } from '../services/recommendation-engine.service';
import { InstitutionalKnowledgeGraphService } from '../services/institutional-knowledge-graph.service';
import { AIGovernanceService } from '../services/ai-governance.service';
import { ContinuousOptimizationService } from '../services/continuous-optimization.service';
import {
  UnifiedOrganizationalViewDto,
  ScenarioSimulationDto,
  PredictiveRiskResultDto,
  PredictiveModelQueryDto,
  CreateRecommendationDto,
  FeedbackRecommendationDto,
  KnowledgeGraphQueryDto,
  AIModelGovernanceDto,
  ContinuousOptimizationActionDto,
} from '../dto/institutional-intelligence.dto';

@ApiTags('Institutional Intelligence Center (AIIC)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('institutional-intelligence')
export class InstitutionalIntelligenceController {
  constructor(
    private readonly institutionalService: InstitutionalIntelligenceService,
    private readonly decisionService: DecisionIntelligenceService,
    private readonly predictiveService: PredictiveAnalyticsService,
    private readonly recommendationService: RecommendationEngineService,
    private readonly knowledgeGraphService: InstitutionalKnowledgeGraphService,
    private readonly aiGovernanceService: AIGovernanceService,
    private readonly optimizationService: ContinuousOptimizationService,
  ) {}

  @Get('audit')
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @ApiOperation({ summary: 'Executa a auditoria pré-implementação dos Prompts 120-150' })
  @ApiResponse({ status: 200, description: 'Auditoria pré-implementação concluída com sucesso' })
  async getPreImplementationAudit() {
    return this.institutionalService.validatePreImplementationAudit();
  }

  @Get('unified-view')
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.DIRECTOR)
  @ApiOperation({ summary: 'Obtém a Visão Unificada da Organização consolidada pelo AIIC' })
  @ApiResponse({ status: 200, type: UnifiedOrganizationalViewDto })
  async getUnifiedView(): Promise<UnifiedOrganizationalViewDto> {
    return this.institutionalService.getUnifiedOrganizationalView();
  }

  @Post('decision/simulate')
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.DIRECTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simula um cenário estratégico de decisão com análise de impacto' })
  @ApiResponse({ status: 200, type: ScenarioSimulationDto })
  async simulateDecisionScenario(
    @Body() body: { title: string; description: string; parameters: Record<string, any> },
  ): Promise<ScenarioSimulationDto> {
    return this.decisionService.simulateScenario(body.title, body.description, body.parameters);
  }

  @Post('predictive/risk')
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calcula previsões de risco (Evasão, Sobrecarga, Financeiro, Operacional)' })
  @ApiResponse({ status: 200, type: PredictiveRiskResultDto })
  async calculatePredictiveRisk(
    @Body() query: PredictiveModelQueryDto,
  ): Promise<PredictiveRiskResultDto> {
    return this.predictiveService.predictRisk(query.riskCategory, query.targetId || 'SYSTEM_GLOBAL');
  }

  @Post('recommendations')
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @ApiOperation({ summary: 'Cria uma nova recomendação inteligente explicável' })
  @ApiResponse({ status: 201, description: 'Recomendação criada com sucesso' })
  async createRecommendation(@Body() dto: CreateRecommendationDto) {
    return this.recommendationService.createRecommendation(dto);
  }

  @Patch('recommendations/:id/feedback')
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @ApiOperation({ summary: 'Registra o feedback de aceitação ou rejeição de uma recomendação' })
  @ApiResponse({ status: 200, description: 'Feedback processado para o modelo' })
  async processRecommendationFeedback(
    @Param('id') recommendationId: string,
    @Body() dto: FeedbackRecommendationDto,
  ) {
    return this.recommendationService.processFeedback(recommendationId, dto);
  }

  @Get('knowledge-graph')
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.DIRECTOR)
  @ApiOperation({ summary: 'Consulta o Grafo Institucional do Conhecimento' })
  @ApiResponse({ status: 200, description: 'Nós e relacionamentos semânticos retornados' })
  async queryKnowledgeGraph(@Query() query: KnowledgeGraphQueryDto) {
    return this.knowledgeGraphService.queryGraph(query.searchQuery, query.nodeType);
  }

  @Get('ai-governance/models')
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @ApiOperation({ summary: 'Lista os modelos no Catálogo de Governança de IA' })
  @ApiResponse({ status: 200, type: [AIModelGovernanceDto] })
  async listAIModels(): Promise<AIModelGovernanceDto[]> {
    return this.aiGovernanceService.listModels();
  }

  @Post('ai-governance/models/:id/approve')
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Homologa um modelo de IA em produção (Human-in-the-Loop)' })
  @ApiResponse({ status: 200, type: AIModelGovernanceDto })
  async approveAIModel(@Param('id') modelId: string): Promise<AIModelGovernanceDto> {
    return this.aiGovernanceService.approveModel(modelId);
  }

  @Get('optimization/plans')
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.DIRECTOR)
  @ApiOperation({ summary: 'Lista planos de ação de otimização contínua organizacionais' })
  @ApiResponse({ status: 200, type: [ContinuousOptimizationActionDto] })
  async listOptimizationPlans(): Promise<ContinuousOptimizationActionDto[]> {
    return this.optimizationService.listOptimizationPlans();
  }
}
