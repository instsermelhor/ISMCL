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
import { EnterpriseReadinessService } from '../services/enterprise-readiness.service';
import { ProductionCertificationService } from '../services/production-certification.service';
import { FunctionalValidationService } from '../services/functional-validation.service';
import { NonfunctionalValidationService } from '../services/nonfunctional-validation.service';
import { ComplianceCertificationService } from '../services/compliance-certification.service';
import { ReleaseGovernanceService } from '../services/release-governance.service';
import { DeploymentApprovalService } from '../services/deployment-approval.service';
import { ProductionRiskAssessmentService } from '../services/production-risk-assessment.service';
import { CertificationEvidenceService } from '../services/certification-evidence.service';
import { EnterpriseReadinessDashboardService } from '../services/enterprise-readiness-dashboard.service';
import {
  AssessProductionRiskDto,
  AssessReadinessDto,
  CertifyComplianceDto,
  ReleaseStatus,
  RunFunctionalValidationDto,
  RunNonfunctionalValidationDto,
  SubmitReleaseCandidateDto,
} from '../dto/enterprise-readiness.dto';

@ApiTags('ERCP — Enterprise Readiness, Certification & Production Governance Platform (P163)')
@ApiBearerAuth()
@Controller('api/v1/readiness')
export class EnterpriseReadinessController {
  constructor(
    private readonly readinessService: EnterpriseReadinessService,
    private readonly productionCertService: ProductionCertificationService,
    private readonly functionalValidation: FunctionalValidationService,
    private readonly nonfunctionalValidation: NonfunctionalValidationService,
    private readonly complianceCert: ComplianceCertificationService,
    private readonly releaseGovernance: ReleaseGovernanceService,
    private readonly deploymentApproval: DeploymentApprovalService,
    private readonly riskAssessment: ProductionRiskAssessmentService,
    private readonly evidenceService: CertificationEvidenceService,
    private readonly dashboardService: EnterpriseReadinessDashboardService,
  ) {}

  // ── 1. ENTERPRISE READINESS ASSESSMENT ───────────────────────────────────────

  @Post('assess')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avalia prontidão de módulo para produção (8 domínios)' })
  @ApiResponse({ status: 200, description: 'Índice de prontidão e domínios avaliados' })
  async assessReadiness(@Body() dto: AssessReadinessDto) {
    return this.readinessService.assessReadiness(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Histórico de avaliações de prontidão' })
  getReadinessHistory() {
    return this.readinessService.getHistory();
  }

  // ── 2. FUNCTIONAL & NONFUNCTIONAL VALIDATION ──────────────────────────────────

  @Post('validations/functional')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa validação funcional completa de um módulo' })
  async runFunctionalValidation(@Body() dto: RunFunctionalValidationDto) {
    return this.functionalValidation.runFunctionalValidation(dto);
  }

  @Post('validations/nonfunctional')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa validação de requisitos não funcionais (desempenho, resiliência, etc.)' })
  async runNonfunctionalValidation(@Body() dto: RunNonfunctionalValidationDto) {
    return this.nonfunctionalValidation.runNonfunctionalValidation(dto);
  }

  // ── 3. COMPLIANCE CERTIFICATION ───────────────────────────────────────────────

  @Post('certifications/compliance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emite certificado de conformidade institucional (LGPD, Zero Trust, etc.)' })
  async certifyCompliance(@Body() dto: CertifyComplianceDto) {
    return this.complianceCert.certifyCompliance(dto);
  }

  @Get('certifications')
  @ApiOperation({ summary: 'Lista os certificados de conformidade emitidos' })
  listCertificates() {
    return this.complianceCert.listCertificates();
  }

  @Post('certifications/production')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emite a certificação final de produção para um conjunto de módulos' })
  async certifyForProduction(@Body() body: { moduleNames: string[] }) {
    return this.productionCertService.certifyForProduction(body.moduleNames);
  }

  // ── 4. RELEASE GOVERNANCE ─────────────────────────────────────────────────────

  @Post('releases/candidates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submete candidato a release para revisão e aprovação formal' })
  async submitReleaseCandidate(@Body() dto: SubmitReleaseCandidateDto) {
    return this.releaseGovernance.submitReleaseCandidate(dto);
  }

  @Post('releases/:releaseId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprova release candidate para produção (requer autoridade formal)' })
  async approveRelease(
    @Param('releaseId') releaseId: string,
    @Body() body: { approvedBy: string; notes?: string },
  ) {
    return this.releaseGovernance.approveRelease(releaseId, body.approvedBy, body.notes);
  }

  @Post('releases/:releaseId/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bloqueia release candidate com justificativa formal' })
  async blockRelease(
    @Param('releaseId') releaseId: string,
    @Body() body: { blockedBy: string; reason: string },
  ) {
    return this.releaseGovernance.blockRelease(releaseId, body.blockedBy, body.reason);
  }

  @Get('releases')
  @ApiOperation({ summary: 'Lista candidatos a release com filtro por status' })
  @ApiQuery({ name: 'status', required: false, enum: ReleaseStatus })
  listReleases(@Query('status') status?: ReleaseStatus) {
    return this.releaseGovernance.listReleaseCandidates(status);
  }

  // ── 5. PRODUCTION RISK & DEPLOYMENT APPROVAL ──────────────────────────────────

  @Post('risks/production')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avalia riscos de produção antes da implantação' })
  async assessProductionRisk(@Body() dto: AssessProductionRiskDto) {
    return this.riskAssessment.assessProductionRisk(dto);
  }

  @Post('approvals/deployment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gera parecer técnico consolidado de aprovação de implantação' })
  async generateDeploymentApproval(@Body() body: { releaseTag: string; testCoveragePercent: number; decidedBy: string }) {
    return this.deploymentApproval.generateDeploymentApproval(body.releaseTag, body.testCoveragePercent, body.decidedBy);
  }

  @Get('approvals')
  @ApiOperation({ summary: 'Lista pareceres de aprovação de implantação' })
  listApprovals() {
    return this.deploymentApproval.listApprovals();
  }

  // ── 6. EVIDENCES & DASHBOARD ──────────────────────────────────────────────────

  @Get('evidences')
  @ApiOperation({ summary: 'Lista evidências de certificação SHA-256' })
  @ApiQuery({ name: 'subject', required: false, type: String })
  listEvidences(@Query('subject') subject?: string) {
    return this.evidenceService.getEvidences(subject);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Painel executivo consolidado de prontidão, certificações e releases' })
  async getDashboard() {
    return this.dashboardService.generateDashboard();
  }
}
