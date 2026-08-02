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

import { TenantProvisioningService } from '../services/tenant-provisioning.service';
import { WhiteLabelService } from '../services/white-label.service';
import { FederationGovernanceService } from '../services/federation-governance.service';
import { TenantIsolationService } from '../services/tenant-isolation.service';
import { TenantLicensingService } from '../services/tenant-licensing.service';
import { FMIPDashboardService } from '../services/fmip-dashboard.service';
import { FederationAuditService } from '../services/federation-audit.service';

import {
  RegisterTenantDto,
  ConfigureWhiteLabelDto,
  EstablishFederationDto,
  ReviewTenantDto,
  TenantStatus,
  TenantTier,
  IsolationStrategy,
} from '../dto/federated-multi-tenant.dto';

/**
 * FederatedMultiTenantController — P167 FMIP
 *
 * REST API da plataforma federated multi-tenant:
 * provisionamento, white-label, federação, isolamento, licenciamento e dashboard.
 */
@ApiBearerAuth()
@ApiTags('FMIP — Federated Multi-Institution Platform (P167)')
@Controller('fmip')
export class FederatedMultiTenantController {
  constructor(
    private readonly tenantSvc: TenantProvisioningService,
    private readonly whiteLabelSvc: WhiteLabelService,
    private readonly federationSvc: FederationGovernanceService,
    private readonly isolationSvc: TenantIsolationService,
    private readonly licensingSvc: TenantLicensingService,
    private readonly dashboardSvc: FMIPDashboardService,
    private readonly auditSvc: FederationAuditService,
  ) {}

  // ── DASHBOARD ───────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard executivo da plataforma federada FMIP' })
  @ApiResponse({ status: 200, description: 'Dashboard consolidado retornado.' })
  getDashboard() {
    return this.dashboardSvc.getDashboard();
  }

  // ── TENANT PROVISIONING ─────────────────────────────────────────────────────

  @Post('tenants/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar novo tenant federado' })
  @ApiResponse({ status: 201, description: 'Tenant registrado em status PROVISIONING.' })
  registerTenant(@Body() dto: RegisterTenantDto) {
    return this.tenantSvc.registerTenant(dto, 'API_USER');
  }

  @Post('tenants/:tenantId/activate')
  @ApiOperation({ summary: 'Ativar tenant provisionado' })
  activateTenant(@Param('tenantId') tenantId: string) {
    return this.tenantSvc.activateTenant(tenantId, 'API_USER');
  }

  @Post('tenants/:tenantId/suspend')
  @ApiOperation({ summary: 'Suspender tenant ativo' })
  suspendTenant(
    @Param('tenantId') tenantId: string,
    @Body('reason') reason: string,
  ) {
    return this.tenantSvc.suspendTenant(tenantId, reason ?? 'Não especificado', 'API_USER');
  }

  @Post('tenants/:tenantId/decommission')
  @ApiOperation({ summary: 'Descomissionar tenant permanentemente' })
  decommissionTenant(
    @Param('tenantId') tenantId: string,
    @Body('reason') reason: string,
  ) {
    return this.tenantSvc.decommissionTenant(tenantId, reason ?? 'Não especificado', 'API_USER');
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Listar todos os tenants com filtros opcionais' })
  @ApiQuery({ name: 'status', required: false, enum: TenantStatus })
  @ApiQuery({ name: 'tier', required: false, enum: TenantTier })
  listTenants(
    @Query('status') status?: TenantStatus,
    @Query('tier') tier?: TenantTier,
  ) {
    return this.tenantSvc.listTenants(status, tier);
  }

  @Get('tenants/:tenantId')
  @ApiOperation({ summary: 'Obter detalhes de um tenant específico' })
  getTenant(@Param('tenantId') tenantId: string) {
    const t = this.tenantSvc.getTenant(tenantId);
    if (!t) return { error: 'Tenant não encontrado', tenantId };
    return t;
  }

  // ── WHITE LABEL ─────────────────────────────────────────────────────────────

  @Post('white-label/configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configurar identidade visual e módulos habilitados de um tenant' })
  @ApiResponse({ status: 200, description: 'Configuração white-label aplicada.' })
  configureWhiteLabel(@Body() dto: ConfigureWhiteLabelDto) {
    return this.whiteLabelSvc.configure(dto, 'API_USER');
  }

  @Get('white-label/:tenantId')
  @ApiOperation({ summary: 'Obter configuração white-label de um tenant' })
  getWhiteLabel(@Param('tenantId') tenantId: string) {
    const cfg = this.whiteLabelSvc.getConfig(tenantId);
    if (!cfg) return { error: 'Configuração white-label não encontrada', tenantId };
    return cfg;
  }

  @Get('white-label')
  @ApiOperation({ summary: 'Listar todas as configurações white-label' })
  listWhiteLabels() {
    return this.whiteLabelSvc.listConfigs();
  }

  @Get('white-label/modules/permitted')
  @ApiOperation({ summary: 'Listar módulos disponíveis para white-label' })
  getPermittedModules() {
    return { modules: this.whiteLabelSvc.getPermittedModules() };
  }

  // ── FEDERATION ──────────────────────────────────────────────────────────────

  @Post('federations/establish')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Estabelecer vínculo de federação entre tenants' })
  @ApiResponse({ status: 201, description: 'Federação criada em status PENDING_APPROVAL.' })
  establishFederation(@Body() dto: EstablishFederationDto) {
    return this.federationSvc.establishFederation(dto, 'API_USER');
  }

  @Post('federations/:federationId/approve')
  @ApiOperation({ summary: 'Aprovar federação pendente' })
  approveFederation(@Param('federationId') federationId: string) {
    return this.federationSvc.approveFederation(federationId, 'API_USER');
  }

  @Post('federations/:federationId/revoke')
  @ApiOperation({ summary: 'Revogar federação ativa' })
  revokeFederation(
    @Param('federationId') federationId: string,
    @Body('reason') reason: string,
  ) {
    return this.federationSvc.revokeFederation(federationId, reason ?? 'Não especificado', 'API_USER');
  }

  @Get('federations')
  @ApiOperation({ summary: 'Listar todas as federações, opcionalmente filtradas por tenant' })
  @ApiQuery({ name: 'tenantId', required: false })
  listFederations(@Query('tenantId') tenantId?: string) {
    return this.federationSvc.listFederations(tenantId);
  }

  @Get('federations/:federationId')
  @ApiOperation({ summary: 'Obter detalhes de uma federação' })
  getFederation(@Param('federationId') federationId: string) {
    const f = this.federationSvc.getFederation(federationId);
    if (!f) return { error: 'Federação não encontrada', federationId };
    return f;
  }

  @Get('federations/check-data-flow')
  @ApiOperation({ summary: 'Verificar se fluxo de dados entre tenants é permitido' })
  @ApiQuery({ name: 'sourceTenantId', required: true })
  @ApiQuery({ name: 'targetTenantId', required: true })
  @ApiQuery({ name: 'dataCategory', required: true })
  checkDataFlow(
    @Query('sourceTenantId') sourceTenantId: string,
    @Query('targetTenantId') targetTenantId: string,
    @Query('dataCategory') dataCategory: string,
  ) {
    const permitted = this.federationSvc.isDataFlowPermitted(sourceTenantId, targetTenantId, dataCategory);
    return { sourceTenantId, targetTenantId, dataCategory, permitted };
  }

  // ── ISOLATION ───────────────────────────────────────────────────────────────

  @Post('isolation/audit/:tenantId')
  @ApiOperation({ summary: 'Executar auditoria de isolamento para tenant' })
  @ApiQuery({ name: 'strategy', required: false, enum: IsolationStrategy })
  async auditIsolation(
    @Param('tenantId') tenantId: string,
    @Query('strategy') strategy: IsolationStrategy = IsolationStrategy.SCHEMA_PER_TENANT,
  ) {
    return this.isolationSvc.auditIsolation(tenantId, strategy, 'API_USER');
  }

  @Get('isolation/reports')
  @ApiOperation({ summary: 'Listar todos os relatórios de isolamento' })
  listIsolationReports() {
    return this.isolationSvc.listReports();
  }

  @Get('isolation/reports/:tenantId')
  @ApiOperation({ summary: 'Obter relatório de isolamento de um tenant' })
  getIsolationReport(@Param('tenantId') tenantId: string) {
    const r = this.isolationSvc.getReport(tenantId);
    if (!r) return { error: 'Relatório não encontrado', tenantId };
    return r;
  }

  @Get('isolation/aggregate-score')
  @ApiOperation({ summary: 'Score médio de isolamento de todos os tenants' })
  getAggregateIsolationScore() {
    return { averageIsolationScore: this.isolationSvc.getAggregateIsolationScore() };
  }

  // ── LICENSING ───────────────────────────────────────────────────────────────

  @Post('licenses/grant/:tenantId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Conceder licença a um tenant' })
  @ApiQuery({ name: 'tier', required: true, enum: TenantTier })
  @ApiQuery({ name: 'expiresInDays', required: false })
  grantLicense(
    @Param('tenantId') tenantId: string,
    @Query('tier') tier: TenantTier,
    @Query('expiresInDays') expiresInDays?: number,
  ) {
    return this.licensingSvc.grantLicense(tenantId, tier, 'API_USER', expiresInDays);
  }

  @Post('licenses/revoke/:tenantId')
  @ApiOperation({ summary: 'Revogar licença de um tenant' })
  async revokeLicense(
    @Param('tenantId') tenantId: string,
    @Body('reason') reason: string,
  ) {
    await this.licensingSvc.revokeLicense(tenantId, reason ?? 'Não especificado', 'API_USER');
    return { message: `Licença do tenant "${tenantId}" revogada.` };
  }

  @Get('licenses')
  @ApiOperation({ summary: 'Listar todas as licenças ativas' })
  listLicenses() {
    return this.licensingSvc.listLicenses();
  }

  @Get('licenses/:tenantId')
  @ApiOperation({ summary: 'Obter licença de um tenant' })
  getLicense(@Param('tenantId') tenantId: string) {
    const lic = this.licensingSvc.getLicense(tenantId);
    if (!lic) return { error: 'Licença não encontrada', tenantId };
    return lic;
  }

  @Get('licenses/check-module')
  @ApiOperation({ summary: 'Verificar se um módulo está habilitado para um tenant' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'module', required: true })
  checkModuleAccess(
    @Query('tenantId') tenantId: string,
    @Query('module') module: string,
  ) {
    const allowed = this.licensingSvc.isModuleAllowed(tenantId, module);
    return { tenantId, module, allowed };
  }

  // ── AUDIT ────────────────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Trilha de auditoria imutável FMIP (SHA-256)' })
  @ApiQuery({ name: 'tenantId', required: false })
  getAuditTrail(@Query('tenantId') tenantId?: string) {
    return this.auditSvc.getAuditTrail(tenantId);
  }
}
