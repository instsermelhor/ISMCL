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
import { EnterpriseIntegrationService } from '../services/enterprise-integration.service';
import { APIGatewayService } from '../services/api-gateway.service';
import { ExternalConnectorService } from '../services/external-connector.service';
import { InteroperabilityService } from '../services/interoperability.service';
import { EventExchangeService } from '../services/event-exchange.service';
import { PartnerIntegrationService } from '../services/partner-integration.service';
import { IntegrationGovernanceService } from '../services/integration-governance.service';
import { IntegrationMonitoringService } from '../services/integration-monitoring.service';
import { IntegrationSecurityService } from '../services/integration-security.service';
import { IntegrationAuditService } from '../services/integration-audit.service';
import {
  CreateIntegrationDto,
  IntegrationProtocol,
  PublishEventToExchangeDto,
  RegisterPartnerDto,
  ReviewIntegrationDto,
  SecurityLevel,
} from '../dto/enterprise-integration.dto';

@ApiTags('EIIP — Enterprise Integration, Interoperability & Digital Ecosystem Platform (P166)')
@ApiBearerAuth()
@Controller('api/v1/integrations')
export class EnterpriseIntegrationController {
  constructor(
    private readonly integrationService: EnterpriseIntegrationService,
    private readonly apiGateway: APIGatewayService,
    private readonly externalConnector: ExternalConnectorService,
    private readonly interoperabilityService: InteroperabilityService,
    private readonly eventExchange: EventExchangeService,
    private readonly partnerService: PartnerIntegrationService,
    private readonly governanceService: IntegrationGovernanceService,
    private readonly monitoringService: IntegrationMonitoringService,
    private readonly securityService: IntegrationSecurityService,
    private readonly auditService: IntegrationAuditService,
  ) {}

  // ── 1. ENTERPRISE INTEGRATION HUB ───────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Propõe nova integração externa com parceiro ou sistema governamental' })
  async createIntegration(@Body() dto: CreateIntegrationDto) {
    return this.integrationService.createIntegration(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista integrações registradas com filtro por parceiro' })
  @ApiQuery({ name: 'partnerId', required: false, type: String })
  listIntegrations(@Query('partnerId') partnerId?: string) {
    return this.integrationService.listIntegrations(partnerId);
  }

  // ── 2. PARTNERS MANAGEMENT ──────────────────────────────────────────────────

  @Post('partners')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra e credencia parceiro institucional (governo, saúde, ONG)' })
  async registerPartner(@Body() dto: RegisterPartnerDto) {
    return this.partnerService.registerPartner(dto);
  }

  @Get('partners')
  @ApiOperation({ summary: 'Lista parceiros institucionais credenciados' })
  listPartners() {
    return this.partnerService.listPartners();
  }

  // ── 3. API GATEWAY & ROUTES ─────────────────────────────────────────────────

  @Get('gateway/routes')
  @ApiOperation({ summary: 'Lista rotas corporativas gerenciadas pelo API Gateway' })
  listGatewayRoutes() {
    return this.apiGateway.listRoutes();
  }

  @Post('gateway/routes/:routeId/release-version')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lança nova versão de rota no API Gateway' })
  async releaseAPIVersion(
    @Param('routeId') routeId: string,
    @Body() body: { newVersion: string },
  ) {
    return this.apiGateway.releaseAPIVersion(routeId, body.newVersion);
  }

  // ── 4. CONNECTORS & INTEROPERABILITY ────────────────────────────────────────

  @Get('connectors')
  @ApiOperation({ summary: 'Lista conectores institucionais padronizados (REST, GraphQL, gRPC, SAML)' })
  listConnectors() {
    return this.externalConnector.listConnectors();
  }

  @Post('interoperability/transform')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Traduz e transforma schemas/contratos (FHIR, OpenAPI, AsyncAPI)' })
  async transformSchema(@Body() body: { sourceSchema: string; targetSchema: string; payload: Record<string, any> }) {
    return this.interoperabilityService.transformSchema(body.sourceSchema, body.targetSchema, body.payload);
  }

  // ── 5. EVENT EXCHANGE ───────────────────────────────────────────────────────

  @Post('events/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publica evento externo no barramento de eventos' })
  async publishToExchange(@Body() dto: PublishEventToExchangeDto) {
    return this.eventExchange.publishToExchange(dto);
  }

  // ── 6. GOVERNANCE & SECURITY ────────────────────────────────────────────────

  @Post('governance/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revisa e aprova/rejeita proposta de integração externa' })
  async reviewIntegration(@Body() dto: ReviewIntegrationDto) {
    return this.governanceService.reviewIntegration(dto);
  }

  @Get('governance/reviews')
  @ApiOperation({ summary: 'Histórico de revisões de governança de integrações' })
  getGovernanceReviews() {
    return this.governanceService.getReviewHistory();
  }

  @Post(':integrationId/security-policy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aplica política de segurança (mTLS, OAuth 2.1, E2EE) em uma integração' })
  async enforceSecurityPolicy(
    @Param('integrationId') integrationId: string,
    @Body() body: { securityLevel: SecurityLevel },
  ) {
    return this.securityService.enforceSecurityPolicy(integrationId, body.securityLevel);
  }

  // ── 7. MONITORING & AUDIT TRAIL ─────────────────────────────────────────────

  @Get('monitoring/health')
  @ApiOperation({ summary: 'Obtém métricas em tempo real de latência, disponibilidade e SLA das integrações' })
  async getHealthMetrics() {
    return this.monitoringService.getHealthMetrics();
  }

  @Get('audit/trail')
  @ApiOperation({ summary: 'Consulta a trilha SHA-256 de auditoria das trocas de mensagens e APIs externas' })
  @ApiQuery({ name: 'subject', required: false, type: String })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditService.getAuditTrail(subject);
  }
}
