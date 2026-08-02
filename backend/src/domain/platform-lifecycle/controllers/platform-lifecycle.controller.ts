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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { PlatformLifecycleService } from '../services/platform-lifecycle.service';
import { ArchitectureSustainabilityService } from '../services/architecture-sustainability.service';
import { TechnicalDebtManagementService } from '../services/technical-debt-management.service';
import { DependencyGovernanceService } from '../services/dependency-governance.service';
import { TechnologyEvolutionService } from '../services/technology-evolution.service';
import { ArchitectureComplianceService } from '../services/architecture-compliance.service';
import { VersionManagementService } from '../services/version-management.service';
import { ModernizationPlanningService } from '../services/modernization-planning.service';
import { PlatformHealthAssessmentService } from '../services/platform-health-assessment.service';
import { LifecycleAuditService } from '../services/lifecycle-audit.service';
import {
  AssessDependencyDto,
  ComponentType,
  CreateModernizationPlanDto,
  LifecyclePhase,
  RegisterComponentDto,
  RegisterTechnicalDebtDto,
  TechnicalDebtCategory,
  TechnicalDebtSeverity,
} from '../dto/platform-lifecycle.dto';

@ApiTags('EPLM — Enterprise Platform Lifecycle Management (P162)')
@ApiBearerAuth()
@Controller('api/v1/lifecycle')
export class PlatformLifecycleController {
  constructor(
    private readonly lifecycleService: PlatformLifecycleService,
    private readonly sustainabilityService: ArchitectureSustainabilityService,
    private readonly debtService: TechnicalDebtManagementService,
    private readonly dependencyService: DependencyGovernanceService,
    private readonly evolutionService: TechnologyEvolutionService,
    private readonly complianceService: ArchitectureComplianceService,
    private readonly versionService: VersionManagementService,
    private readonly modernizationService: ModernizationPlanningService,
    private readonly healthService: PlatformHealthAssessmentService,
    private readonly auditService: LifecycleAuditService,
  ) {}

  // ── 1. PLATFORM LIFECYCLE ─────────────────────────────────────────────────────

  @Post('components')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra novo componente no inventário do ciclo de vida' })
  @ApiResponse({ status: 201, description: 'Componente registrado com sucesso' })
  async registerComponent(@Body() dto: RegisterComponentDto) {
    return this.lifecycleService.registerComponent(dto);
  }

  @Get('components')
  @ApiOperation({ summary: 'Lista componentes com filtros por fase e tipo' })
  @ApiQuery({ name: 'phase', required: false, enum: LifecyclePhase })
  @ApiQuery({ name: 'type', required: false, enum: ComponentType })
  listComponents(
    @Query('phase') phase?: LifecyclePhase,
    @Query('type') type?: ComponentType,
  ) {
    return this.lifecycleService.listComponents(phase, type);
  }

  @Post('components/:componentId/deprecate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca componente como deprecated com justificativa' })
  async deprecateComponent(
    @Param('componentId') componentId: string,
    @Body() body: { reason: string },
  ) {
    return this.lifecycleService.deprecateComponent(componentId, body.reason);
  }

  // ── 2. ARCHITECTURE SUSTAINABILITY ───────────────────────────────────────────

  @Get('architecture/sustainability')
  @ApiOperation({ summary: 'Executa avaliação de sustentabilidade arquitetural' })
  async assessSustainability() {
    return this.sustainabilityService.assessSustainability();
  }

  @Get('architecture/compliance')
  @ApiOperation({ summary: 'Verifica conformidade da arquitetura com os padrões corporativos' })
  async checkArchitectureCompliance() {
    return this.complianceService.checkArchitectureCompliance();
  }

  // ── 3. TECHNICAL DEBT ─────────────────────────────────────────────────────────

  @Post('technical-debt')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra novo item de dívida técnica priorizado' })
  async registerDebt(@Body() dto: RegisterTechnicalDebtDto) {
    return this.debtService.registerDebt(dto);
  }

  @Get('technical-debt')
  @ApiOperation({ summary: 'Lista dívida técnica com filtros por severidade e categoria' })
  @ApiQuery({ name: 'severity', required: false, enum: TechnicalDebtSeverity })
  @ApiQuery({ name: 'category', required: false, enum: TechnicalDebtCategory })
  listDebt(
    @Query('severity') severity?: TechnicalDebtSeverity,
    @Query('category') category?: TechnicalDebtCategory,
  ) {
    return this.debtService.listDebt(severity, category);
  }

  // ── 4. DEPENDENCIES ───────────────────────────────────────────────────────────

  @Post('dependencies/assess')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avalia dependência: versão, licença, vulnerabilidades e risco' })
  async assessDependency(@Body() dto: AssessDependencyDto) {
    return this.dependencyService.assessDependency(dto);
  }

  @Get('dependencies')
  @ApiOperation({ summary: 'Lista dependências da plataforma com filtro por nível de risco' })
  @ApiQuery({ name: 'riskLevel', required: false, type: String })
  listDependencies(@Query('riskLevel') riskLevel?: string) {
    return this.dependencyService.listDependencies(riskLevel);
  }

  // ── 5. TECHNOLOGY ROADMAP ─────────────────────────────────────────────────────

  @Get('technology/roadmap')
  @ApiOperation({ summary: 'Gera o roadmap estratégico de evolução tecnológica da plataforma' })
  async getTechnologyRoadmap() {
    return this.evolutionService.generateRoadmap();
  }

  // ── 6. VERSIONS ───────────────────────────────────────────────────────────────

  @Post('versions/release')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra novo release de versão da plataforma' })
  async releaseVersion(@Body() body: { tag: string; releaseType: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX'; commitHash: string; relatedAdrIds?: string[] }) {
    return this.versionService.releaseVersion(body.tag, body.releaseType, body.commitHash, body.relatedAdrIds);
  }

  @Get('versions')
  @ApiOperation({ summary: 'Lista o histórico de versões da plataforma por ordem cronológica' })
  listVersions() {
    return this.versionService.listVersions();
  }

  // ── 7. MODERNIZATION PLANS ────────────────────────────────────────────────────

  @Post('modernization/plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria plano de modernização arquitetural ou tecnológica' })
  async createModernizationPlan(@Body() dto: CreateModernizationPlanDto) {
    return this.modernizationService.createModernizationPlan(dto);
  }

  @Get('modernization/plans')
  @ApiOperation({ summary: 'Lista planos de modernização da plataforma' })
  listModernizationPlans() {
    return this.modernizationService.listPlans();
  }

  // ── 8. PLATFORM HEALTH INDEX ─────────────────────────────────────────────────

  @Get('health')
  @ApiOperation({ summary: 'Calcula o Índice Corporativo de Saúde da Plataforma (PHI)' })
  async getPlatformHealthIndex() {
    return this.healthService.calculatePlatformHealthIndex();
  }

  // ── 9. AUDIT TRAIL ────────────────────────────────────────────────────────────

  @Get('audit/trail')
  @ApiOperation({ summary: 'Consulta a trilha SHA-256 de auditoria do ciclo de vida' })
  @ApiQuery({ name: 'component', required: false, type: String })
  getAuditTrail(@Query('component') component?: string) {
    return this.auditService.getTrail(component);
  }
}
