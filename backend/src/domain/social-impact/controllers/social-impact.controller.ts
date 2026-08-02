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
import { SocialImpactService } from '../services/social-impact.service';
import { OutcomeMeasurementService } from '../services/outcome-measurement.service';
import { ProgramEvaluationService } from '../services/program-evaluation.service';
import { InstitutionalIndicatorsService } from '../services/institutional-indicators.service';
import { ESGMetricsService } from '../services/esg-metrics.service';
import { BeneficiaryEvolutionService } from '../services/beneficiary-evolution.service';
import { EvidenceConsolidationService } from '../services/evidence-consolidation.service';
import { AccountabilityService } from '../services/accountability.service';
import { ImpactDashboardService } from '../services/impact-dashboard.service';
import { SocialImpactAuditService } from '../services/social-impact-audit.service';
import {
  CalculateSocialImpactDto,
  EvaluateProgramDto,
  GenerateAccountabilityReportDto,
  ImpactDimension,
  RecordBeneficiaryEvolutionDto,
} from '../dto/social-impact.dto';

@ApiTags('SIIP — Social Impact Intelligence & Accountability Platform (P165)')
@ApiBearerAuth()
@Controller('api/v1/impact')
export class SocialImpactController {
  constructor(
    private readonly socialImpactService: SocialImpactService,
    private readonly outcomeMeasurement: OutcomeMeasurementService,
    private readonly programEvaluation: ProgramEvaluationService,
    private readonly indicatorsService: InstitutionalIndicatorsService,
    private readonly esgService: ESGMetricsService,
    private readonly beneficiaryEvolution: BeneficiaryEvolutionService,
    private readonly evidenceConsolidation: EvidenceConsolidationService,
    private readonly accountabilityService: AccountabilityService,
    private readonly dashboardService: ImpactDashboardService,
    private readonly auditService: SocialImpactAuditService,
  ) {}

  // ── 1. SOCIAL IMPACT FRAMEWORK ──────────────────────────────────────────────

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calcula o impacto social em uma dimensão parametrizada' })
  async calculateImpact(@Body() dto: CalculateSocialImpactDto) {
    return this.socialImpactService.calculateImpact(dto);
  }

  // ── 2. OUTCOME MEASUREMENT & BENEFICIARY EVOLUTION ─────────────────────────

  @Post('outcomes/measure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mede os resultados e evolução longitudinal de um programa' })
  async measureProgramOutcomes(@Body() body: { programName: string }) {
    return this.outcomeMeasurement.measureProgramOutcomes(body.programName);
  }

  @Post('beneficiaries/evolution')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra evolução longitudinal de beneficiário (pseudonimização LGPD)' })
  async recordBeneficiaryEvolution(@Body() dto: RecordBeneficiaryEvolutionDto) {
    return this.beneficiaryEvolution.recordEvolution(dto);
  }

  @Get('beneficiaries/evolution')
  @ApiOperation({ summary: 'Lista os registros de evolução longitudinal dos beneficiários' })
  listBeneficiaryEvolutions() {
    return this.beneficiaryEvolution.listEvolutions();
  }

  // ── 3. PROGRAM EVALUATION & SROI ─────────────────────────────────────────────

  @Post('programs/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avalia programa social (efetividade, SROI, custo/resultado)' })
  async evaluateProgram(@Body() dto: EvaluateProgramDto) {
    return this.programEvaluation.evaluateProgram(dto);
  }

  @Get('programs/evaluations')
  @ApiOperation({ summary: 'Lista avaliações de programas sociais e SROI' })
  listProgramEvaluations() {
    return this.programEvaluation.listEvaluations();
  }

  // ── 4. INDICATORS & ESG METRICS ──────────────────────────────────────────────

  @Get('indicators')
  @ApiOperation({ summary: 'Lista os indicadores institucionais estratégicos' })
  listIndicators() {
    return this.indicatorsService.listIndicators();
  }

  @Get('esg/scorecard')
  @ApiOperation({ summary: 'Calcula e exibe o scorecard de métricas ESG institucionais' })
  async getESGScorecard() {
    return this.esgService.calculateESGMetrics();
  }

  // ── 5. EVIDENCE CONSOLIDATION & ACCOUNTABILITY ──────────────────────────────

  @Post('evidences/consolidate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consolida pacote de evidências auditáveis provenientes do ERP, EHR e BI' })
  async consolidateEvidences() {
    return this.evidenceConsolidation.consolidateEvidences();
  }

  @Post('accountability/reports')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gera relatório de prestação de contas com assinatura SHA-256' })
  async generateAccountabilityReport(@Body() dto: GenerateAccountabilityReportDto) {
    return this.accountabilityService.generateAccountabilityReport(dto);
  }

  @Get('accountability/reports')
  @ApiOperation({ summary: 'Lista os relatórios de prestação de contas gerados' })
  listAccountabilityReports() {
    return this.accountabilityService.listReports();
  }

  // ── 6. IMPACT DASHBOARDS & AUDIT TRAIL ──────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Painel executivo consolidado de impacto social e transparência' })
  async getImpactDashboard() {
    return this.dashboardService.generateImpactDashboard();
  }

  @Get('audit/trail')
  @ApiOperation({ summary: 'Consulta a trilha SHA-256 de auditoria de impacto social' })
  @ApiQuery({ name: 'subject', required: false, type: String })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditService.getAuditTrail(subject);
  }
}
