import {
  Controller,
  Get,
  Post,
  Body,
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
import { ContinuousComplianceService } from '../services/continuous-compliance.service';
import { AutonomousGovernanceService } from '../services/autonomous-governance.service';
import { PolicyValidationService } from '../services/policy-validation.service';
import { RegulatoryMonitoringService } from '../services/regulatory-monitoring.service';
import { ComplianceEvidenceService } from '../services/compliance-evidence.service';
import { InstitutionalAssuranceService } from '../services/institutional-assurance.service';
import { EnterpriseRiskValidationService } from '../services/enterprise-risk-validation.service';
import { GovernanceRecommendationService } from '../services/governance-recommendation.service';
import { GovernanceDashboardService } from '../services/governance-dashboard.service';
import { ContinuousAuditService } from '../services/continuous-audit.service';
import {
  AssessEnterpriseRiskDto,
  ComplianceFramework,
  GenerateGovernanceRecommendationDto,
  RecordComplianceEvidenceDto,
  RiskCategory,
  RunComplianceCheckDto,
  ValidatePolicyDto,
} from '../dto/governance-compliance.dto';

@ApiTags('AGCC — Autonomous Governance & Compliance Platform (P161)')
@ApiBearerAuth()
@Controller('api/v1/governance')
export class GovernanceComplianceController {
  constructor(
    private readonly continuousCompliance: ContinuousComplianceService,
    private readonly autonomousGovernance: AutonomousGovernanceService,
    private readonly policyValidation: PolicyValidationService,
    private readonly regulatoryMonitoring: RegulatoryMonitoringService,
    private readonly complianceEvidence: ComplianceEvidenceService,
    private readonly institutionalAssurance: InstitutionalAssuranceService,
    private readonly riskValidation: EnterpriseRiskValidationService,
    private readonly recommendationService: GovernanceRecommendationService,
    private readonly governanceDashboard: GovernanceDashboardService,
    private readonly auditService: ContinuousAuditService,
  ) {}

  // ── 1. CONTINUOUS COMPLIANCE & AUTONOMOUS GOVERNANCE ─────────────────────────

  @Post('compliance/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa verificação contínua de conformidade (LGPD, Zero Trust, etc.)' })
  @ApiResponse({ status: 200, description: 'Resultado da verificação de conformidade' })
  async runComplianceCheck(@Body() dto: RunComplianceCheckDto) {
    return this.continuousCompliance.runComplianceCheck(dto);
  }

  @Get('autonomous/check')
  @ApiOperation({ summary: 'Executa inspeção contínua de governança em microsserviços e workflows' })
  async runAutonomousCheck() {
    return this.autonomousGovernance.runAutonomousCheck();
  }

  // ── 2. POLICY VALIDATION & REGULATORY MONITORING ────────────────────────────

  @Post('policies/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valida conformidade e ausência de conflitos em políticas ou POPs' })
  async validatePolicy(@Body() dto: ValidatePolicyDto) {
    return this.policyValidation.validatePolicy(dto);
  }

  @Get('regulatory/requirements')
  @ApiOperation({ summary: 'Lista os requisitos regulatórios legais mapeados na plataforma' })
  listRegulatoryRequirements() {
    return this.regulatoryMonitoring.listRequirements();
  }

  // ── 3. EVIDENCES & ASSURANCE ────────────────────────────────────────────────

  @Post('evidences')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra e preserva evidência de conformidade auditável' })
  async recordEvidence(@Body() dto: RecordComplianceEvidenceDto) {
    return this.complianceEvidence.recordEvidence(dto);
  }

  @Get('evidences')
  @ApiOperation({ summary: 'Lista evidências de conformidade por framework' })
  @ApiQuery({ name: 'framework', required: false, enum: ComplianceFramework })
  listEvidences(@Query('framework') framework?: ComplianceFramework) {
    return this.complianceEvidence.listEvidences(framework);
  }

  @Get('assurance/check')
  @ApiOperation({ summary: 'Executa validação de garantia institucional e integridade' })
  async runAssuranceCheck() {
    return this.institutionalAssurance.runAssuranceCheck();
  }

  // ── 4. ENTERPRISE RISKS ─────────────────────────────────────────────────────

  @Post('risks/assess')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avalia e atualiza a matriz corporativa de riscos' })
  async assessRisk(@Body() dto: AssessEnterpriseRiskDto) {
    return this.riskValidation.assessRisk(dto);
  }

  @Get('risks')
  @ApiOperation({ summary: 'Lista a matriz corporativa de riscos com filtro por categoria' })
  @ApiQuery({ name: 'category', required: false, enum: RiskCategory })
  listRisks(@Query('category') category?: RiskCategory) {
    return this.riskValidation.listRisks(category);
  }

  // ── 5. RECOMMENDATIONS & DASHBOARD ──────────────────────────────────────────

  @Post('recommendations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gera recomendação de governança fundamentada em evidências' })
  async generateRecommendation(@Body() dto: GenerateGovernanceRecommendationDto) {
    return this.recommendationService.generateRecommendation(dto);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Lista as recomendações de governança ativas' })
  listRecommendations() {
    return this.recommendationService.listRecommendations();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Retorna o painel executivo consolidado de governança e conformidade' })
  async getGovernanceDashboard() {
    return this.governanceDashboard.generateGovernanceDashboard();
  }

  // ── 6. AUDIT TRAIL ──────────────────────────────────────────────────────────

  @Get('audit/trail')
  @ApiOperation({ summary: 'Consulta a trilha imutável de auditoria de conformidade (SHA-256)' })
  @ApiQuery({ name: 'scope', required: false, type: String })
  getAuditTrail(@Query('scope') scope?: string) {
    return this.auditService.getAuditTrail(scope);
  }
}
