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
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import {
  ApiGatewayRouteDto,
  ConfigureConnectorDto,
  ConnectorType,
  CreateConsentDto,
  DataExchangeTransactionDto,
  IntegrationGovernanceCheckDto,
  PartnerType,
  RegisterPartnerDto,
  RevokeConsentDto,
} from '../dto/enterprise-interoperability.dto';
import { EnterpriseIntegrationService } from '../services/enterprise-integration.service';
import { ApiGatewayManagementService } from '../services/api-gateway-management.service';
import { ExternalConnectorService } from '../services/external-connector.service';
import { InteroperabilityHubService } from '../services/interoperability-hub.service';
import { ConsentManagementService } from '../services/consent-management.service';
import { DataExchangeService } from '../services/data-exchange.service';
import { PartnerIntegrationService } from '../services/partner-integration.service';
import { IntegrationMonitoringService } from '../services/integration-monitoring.service';
import { IntegrationGovernanceService } from '../services/integration-governance.service';
import { ExternalAuditService } from '../services/external-audit.service';

@ApiTags('Enterprise Interoperability Platform (AEIDIP)')
@ApiBearerAuth()
@Controller('api/v1/interoperability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnterpriseInteroperabilityController {
  constructor(
    private readonly enterpriseIntegration: EnterpriseIntegrationService,
    private readonly apiGateway: ApiGatewayManagementService,
    private readonly externalConnector: ExternalConnectorService,
    private readonly interoperabilityHub: InteroperabilityHubService,
    private readonly consentManagement: ConsentManagementService,
    private readonly dataExchange: DataExchangeService,
    private readonly partnerIntegration: PartnerIntegrationService,
    private readonly monitoringService: IntegrationMonitoringService,
    private readonly governanceService: IntegrationGovernanceService,
    private readonly externalAudit: ExternalAuditService,
  ) {}

  // ── 1. Gestão de Parceiros Institucionais ───────────────────────────────────

  @Post('partners')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO', 'CIO')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra novo parceiro institucional (órgãos públicos, saúde, justiça, etc.)' })
  @ApiResponse({ status: 201, description: 'Parceiro registrado com sucesso' })
  registerPartner(@Body() dto: RegisterPartnerDto) {
    return this.partnerIntegration.registerPartner(dto);
  }

  @Get('partners')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO', 'CIO')
  @ApiOperation({ summary: 'Lista parceiros institucionais cadastrados' })
  @ApiQuery({ name: 'type', enum: PartnerType, required: false })
  listPartners(@Query('type') type?: PartnerType) {
    return this.partnerIntegration.listPartners(type);
  }

  // ── 2. Conectores Externos ──────────────────────────────────────────────────

  @Post('connectors/configure')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO', 'CIO')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Configura conector externo parametrizável (SUS, SUAS, ICP-Brasil, etc.)' })
  configureConnector(@Body() dto: ConfigureConnectorDto) {
    return this.externalConnector.configureConnector(dto);
  }

  @Get('connectors')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CISO' as AuraRole, 'CIO' as AuraRole)
  @ApiOperation({ summary: 'Lista conectores externos ativos' })
  @ApiQuery({ name: 'type', enum: ConnectorType, required: false })
  listConnectors(@Query('type') type?: ConnectorType) {
    return type ? this.externalConnector.getConnectorsByType(type) : this.externalConnector.listConnectors();
  }

  // ── 3. API Gateway Corporativo ─────────────────────────────────────────────

  @Post('gateway/routes')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CISO' as AuraRole, 'CIO' as AuraRole)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra rota no API Gateway corporativo com rate-limiting, cota e mTLS' })
  registerGatewayRoute(@Body() dto: ApiGatewayRouteDto) {
    return this.apiGateway.registerRoute(dto);
  }

  @Get('gateway/routes')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CISO' as AuraRole, 'CIO' as AuraRole)
  @ApiOperation({ summary: 'Lista rotas registradas no API Gateway corporativo' })
  listGatewayRoutes() {
    return this.apiGateway.listRoutes();
  }

  // ── 4. Gestão de Consentimentos (LGPD) ──────────────────────────────────────

  @Post('consents')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CASE_MANAGER' as AuraRole, 'HEALTH_PROFESSIONAL' as AuraRole)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra consentimento LGPD para compartilhamento de dados com parceiro externo' })
  grantConsent(@Body() dto: CreateConsentDto) {
    return this.consentManagement.grantConsent(dto);
  }

  @Patch('consents/revoke')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CASE_MANAGER' as AuraRole, 'HEALTH_PROFESSIONAL' as AuraRole)
  @ApiOperation({ summary: 'Revoga consentimento LGPD de beneficiário' })
  revokeConsent(@Body() dto: RevokeConsentDto) {
    return this.consentManagement.revokeConsent(dto);
  }

  @Get('consents')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CASE_MANAGER' as AuraRole, 'HEALTH_PROFESSIONAL' as AuraRole)
  @ApiOperation({ summary: 'Lista consentimentos LGPD registrados' })
  @ApiQuery({ name: 'beneficiaryId', required: false })
  listConsents(@Query('beneficiaryId') beneficiaryId?: string) {
    return this.consentManagement.listConsents(beneficiaryId);
  }

  // ── 5. Intercâmbio de Dados & Fluxo Orquestrado ────────────────────────────

  @Post('integration/execute')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CIO' as AuraRole, 'CISO' as AuraRole)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa fluxo orquestrado de integração corporativa com resiliência (Circuit Breaker)' })
  executeIntegrationFlow(
    @Body('partnerCode') partnerCode: string,
    @Body('dataExchange') dto: DataExchangeTransactionDto,
    @Body('requestedScope') requestedScope?: string,
  ) {
    return this.enterpriseIntegration.executeIntegrationFlow(partnerCode, dto, requestedScope);
  }

  @Post('data-exchange')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CIO' as AuraRole, 'CISO' as AuraRole)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa transação direta de intercâmbio de dados com validação de consentimento' })
  executeDataExchange(@Body() dto: DataExchangeTransactionDto) {
    return this.dataExchange.executeDataExchange(dto);
  }

  // ── 6. Governança & Conformidade ───────────────────────────────────────────

  @Post('governance/validate')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CISO' as AuraRole, 'CCO' as AuraRole)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valida conformidade de governança (técnica, jurídica, LGPD e segurança) para integração' })
  validateGovernance(@Body() dto: IntegrationGovernanceCheckDto) {
    return this.governanceService.validateGovernance(dto);
  }

  // ── 7. Monitoramento & Alertas ─────────────────────────────────────────────

  @Get('monitoring/metrics')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CISO' as AuraRole, 'CIO' as AuraRole)
  @ApiOperation({ summary: 'Obtém métricas de saúde, latência e disponibilidade das integrações' })
  @ApiQuery({ name: 'partnerCode', required: false })
  getMonitoringMetrics(@Query('partnerCode') partnerCode?: string) {
    return this.monitoringService.getMetrics(partnerCode);
  }

  @Get('monitoring/alerts')
  @Roles('SUPER_ADMIN' as AuraRole, 'ADMIN' as AuraRole, 'CISO' as AuraRole, 'CIO' as AuraRole)
  @ApiOperation({ summary: 'Lista alertas de integrações degradadas ou falhas' })
  @ApiQuery({ name: 'partnerCode', required: false })
  getMonitoringAlerts(@Query('partnerCode') partnerCode?: string) {
    return this.monitoringService.getAlerts(partnerCode);
  }

  // ── 8. Auditoria Imutável Externa ──────────────────────────────────────────

  @Get('audits')
  @Roles('SUPER_ADMIN' as AuraRole, 'CISO' as AuraRole, 'AUDITOR' as AuraRole)
  @ApiOperation({ summary: 'Consulta trilha imutável de auditoria externa (assinada com SHA-256)' })
  @ApiQuery({ name: 'partnerCode', required: false })
  getAuditTrail(@Query('partnerCode') partnerCode?: string) {
    return this.externalAudit.getAuditTrail(partnerCode);
  }
}
