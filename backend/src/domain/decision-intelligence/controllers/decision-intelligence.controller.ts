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
import { DecisionIntelligenceService } from '../services/decision-intelligence.service';
import { DecisionRecommendationService } from '../services/decision-recommendation.service';
import { DecisionGovernanceService } from '../services/decision-governance.service';
import { EvidenceManagementService } from '../services/evidence-management.service';
import { PredictiveAnalyticsService } from '../services/predictive-analytics.service';
import { PrescriptiveAnalyticsService } from '../services/prescriptive-analytics.service';
import { ExecutiveKpiIntelligenceService } from '../services/executive-kpi-intelligence.service';
import { ExecutiveAnalyticsService } from '../services/executive-analytics.service';
import { DecisionAuditService } from '../services/decision-audit.service';
import {
  CreateDecisionRecommendationDto,
  DecisionDomain,
  DecisionStatus,
  EvaluateDecisionDto,
  EvidenceType,
  RecordEvidenceDto,
  RegisterKpiDto,
  RunPredictiveAnalyticsDto,
  RunPrescriptiveAnalyticsDto,
} from '../dto/decision-intelligence.dto';

@ApiTags('ADIP — Decision Intelligence Platform (P159)')
@ApiBearerAuth()
@Controller('api/v1/decision')
export class DecisionIntelligenceController {
  constructor(
    private readonly decisionHub: DecisionIntelligenceService,
    private readonly recommendationService: DecisionRecommendationService,
    private readonly governanceService: DecisionGovernanceService,
    private readonly evidenceService: EvidenceManagementService,
    private readonly predictiveService: PredictiveAnalyticsService,
    private readonly prescriptiveService: PrescriptiveAnalyticsService,
    private readonly kpiService: ExecutiveKpiIntelligenceService,
    private readonly executiveAnalytics: ExecutiveAnalyticsService,
    private readonly auditService: DecisionAuditService,
  ) {}

  // ── 1. RECOMMENDATIONS & DECISION HUB ────────────────────────────────────────

  @Post('recommendations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicita nova recomendação de decisão prescritiva com XAI' })
  @ApiResponse({ status: 201, description: 'Recomendação gerada com sucesso' })
  async createRecommendation(@Body() dto: CreateDecisionRecommendationDto) {
    return this.decisionHub.processDecisionRequest(dto);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Lista recomendações de decisão com filtros por domínio e status' })
  @ApiQuery({ name: 'domain', required: false, enum: DecisionDomain })
  @ApiQuery({ name: 'status', required: false, enum: DecisionStatus })
  listRecommendations(
    @Query('domain') domain?: DecisionDomain,
    @Query('status') status?: DecisionStatus,
  ) {
    return this.recommendationService.listRecommendations(domain, status);
  }

  @Get('recommendations/:id')
  @ApiOperation({ summary: 'Detalha uma recomendação específica com relatório XAI' })
  @ApiParam({ name: 'id', type: String })
  getRecommendation(@Param('id') id: string) {
    return this.recommendationService.getRecommendation(id);
  }

  // ── 2. HUMAN GOVERNANCE (APPROVE / REJECT) ──────────────────────────────────

  @Post('recommendations/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprova formalmente recomendação de decisão (Human-in-the-Loop)' })
  async approveDecision(
    @Param('id') id: string,
    @Body() body: { selectedOptionId: string; justification: string; evaluatedBy: string },
  ) {
    const dto: EvaluateDecisionDto = {
      recommendationId: id,
      selectedOptionId: body.selectedOptionId,
      justification: body.justification,
      evaluatedBy: body.evaluatedBy ?? 'GESTOR',
    };
    return this.governanceService.approveDecision(dto);
  }

  @Post('recommendations/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeita recomendação de decisão com justificativa humana' })
  async rejectDecision(
    @Param('id') id: string,
    @Body() body: { justification: string; evaluatedBy: string },
  ) {
    const dto: EvaluateDecisionDto = {
      recommendationId: id,
      selectedOptionId: 'REJECTED',
      justification: body.justification,
      evaluatedBy: body.evaluatedBy ?? 'GESTOR',
    };
    return this.governanceService.rejectDecision(dto);
  }

  // ── 3. EVIDENCES ─────────────────────────────────────────────────────────────

  @Post('evidences')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra e vincula nova evidência de decisão' })
  async recordEvidence(@Body() dto: RecordEvidenceDto) {
    return this.evidenceService.recordEvidence(dto);
  }

  @Get('evidences')
  @ApiOperation({ summary: 'Lista evidências cadastradas com filtro por tipo' })
  @ApiQuery({ name: 'evidenceType', required: false, enum: EvidenceType })
  listEvidences(@Query('evidenceType') evidenceType?: EvidenceType) {
    return this.evidenceService.listEvidences(evidenceType);
  }

  // ── 4. ANALYTICS (PREDICTIVE & PRESCRIPTIVE) ─────────────────────────────────

  @Post('analytics/predictive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa análise preditiva de demanda, recursos e riscos' })
  async runPredictiveAnalysis(@Body() dto: RunPredictiveAnalyticsDto) {
    return this.predictiveService.runPredictiveAnalysis(dto);
  }

  @Post('analytics/prescriptive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa análise prescritiva com matriz de trade-offs' })
  async runPrescriptiveAnalysis(@Body() dto: RunPrescriptiveAnalyticsDto) {
    return this.prescriptiveService.runPrescriptiveAnalysis(dto);
  }

  // ── 5. KPIS & EXECUTIVE DASHBOARD ────────────────────────────────────────────

  @Get('kpis')
  @ApiOperation({ summary: 'Lista KPIs executivos estratégicos com desvio percentual' })
  @ApiQuery({ name: 'domain', required: false, enum: DecisionDomain })
  listKpis(@Query('domain') domain?: DecisionDomain) {
    return this.kpiService.listKpis(domain);
  }

  @Post('kpis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra novo KPI estratégico corporativo' })
  async registerKpi(@Body() dto: RegisterKpiDto) {
    return this.kpiService.registerKpi(dto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Retorna o painel executivo consolidado de Decision Intelligence' })
  async getExecutiveDashboard() {
    return this.executiveAnalytics.generateExecutiveDashboard();
  }

  // ── 6. AUDIT TRAIL ───────────────────────────────────────────────────────────

  @Get('audit/trail')
  @ApiOperation({ summary: 'Consulta a trilha imutável de auditoria de decisão (SHA-256)' })
  @ApiQuery({ name: 'recommendationId', required: false, type: String })
  getAuditTrail(@Query('recommendationId') recommendationId?: string) {
    return this.auditService.getAuditTrail(recommendationId);
  }
}
