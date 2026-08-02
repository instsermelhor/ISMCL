import {
  Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';

import { EnterpriseIntegrationService } from '../services/enterprise-integration.service';
import { APIGatewayService } from '../services/api-gateway.service';
import { APILifecycleService } from '../services/api-lifecycle.service';
import { EventMeshService } from '../services/event-mesh.service';
import { ServiceMeshService } from '../services/service-mesh.service';
import { IntegrationCatalogService } from '../services/integration-catalog.service';
import { WebhookManagementService } from '../services/webhook-management.service';
import { ExternalConnectorService } from '../services/external-connector.service';
import { PartnerIntegrationService } from '../services/partner-integration.service';
import { IntegrationAuditService } from '../services/integration-audit.service';

import {
  RegisterAPIDto, RegisterConnectorDto, RegisterWebhookDto, RegisterPartnerDto,
  PublishEventMeshEventDto, APILifecycleStage, ConnectorType, PartnerStatus, EventMeshRoutingPolicy,
} from '../dto/enterprise-integration.dto';

/**
 * EnterpriseIntegrationController — P176 EIEMP (Fase XXVI)
 *
 * REST API da Plataforma Corporativa de Integração, API Economy e Event Mesh:
 * API Gateway, Ciclo de Vida de APIs, Event Mesh, Service Mesh,
 * Catálogo de Integrações, Webhooks, Conectores Externos,
 * Portal de Parceiros e Auditoria Imutável SHA-256.
 */
@ApiBearerAuth()
@ApiTags('EIEMP — Enterprise Integration, API Economy & Event Mesh (P176)')
@Controller('eiemp')
export class EnterpriseIntegrationController {
  constructor(
    private readonly integrationSvc: EnterpriseIntegrationService,
    private readonly gatewaySvc: APIGatewayService,
    private readonly lifecycleSvc: APILifecycleService,
    private readonly eventMeshSvc: EventMeshService,
    private readonly serviceMeshSvc: ServiceMeshService,
    private readonly catalogSvc: IntegrationCatalogService,
    private readonly webhookSvc: WebhookManagementService,
    private readonly connectorSvc: ExternalConnectorService,
    private readonly partnerSvc: PartnerIntegrationService,
    private readonly auditSvc: IntegrationAuditService,
  ) {}

  // ── HEALTH / OVERVIEW ─────────────────────────────────────────────────────
  @Post('health-report')
  @ApiOperation({ summary: 'Gerar relatório de saúde da plataforma de integração EIEMP' })
  generateHealthReport() {
    return this.integrationSvc.generateHealthReport('API_USER');
  }

  // ── API GATEWAY ───────────────────────────────────────────────────────────
  @Post('gateway/routes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar rota no API Gateway corporativo' })
  registerRoute(
    @Body('apiId') apiId: string, @Body('path') path: string,
    @Body('targetService') targetService: string, @Body('rateLimitRpm') rateLimitRpm: number,
    @Body('authRequired') authRequired: boolean, @Body('cacheTtlSeconds') cacheTtlSeconds: number,
  ) {
    return this.gatewaySvc.registerRoute(apiId, path, targetService, rateLimitRpm ?? 60, authRequired ?? true, cacheTtlSeconds ?? 0, 'API_USER');
  }

  @Post('gateway/routes/:routeId/process')
  @ApiOperation({ summary: 'Processar requisição via API Gateway (roteamento, autenticação, rate limiting)' })
  processRequest(@Param('routeId') routeId: string, @Body('method') method: string, @Body('clientId') clientId: string) {
    return this.gatewaySvc.processRequest(routeId, method ?? 'GET', clientId ?? 'ANONYMOUS');
  }

  @Get('gateway/routes')
  @ApiOperation({ summary: 'Listar rotas do API Gateway' })
  listRoutes() { return this.gatewaySvc.listRoutes(); }

  @Get('gateway/requests')
  @ApiOperation({ summary: 'Histórico de requisições processadas pelo Gateway' })
  getRequestLog() { return this.gatewaySvc.getRequestLog(); }

  // ── API LIFECYCLE ─────────────────────────────────────────────────────────
  @Post('apis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nova API no ciclo de vida corporativo' })
  registerAPI(@Body() dto: RegisterAPIDto) {
    return this.lifecycleSvc.registerAPI(dto, 'API_USER');
  }

  @Post('apis/:apiId/publish')
  @ApiOperation({ summary: 'Publicar API no catálogo corporativo' })
  publishAPI(@Param('apiId') apiId: string, @Body('publishedBy') publishedBy: string) {
    return this.lifecycleSvc.publishAPI(apiId, publishedBy ?? 'API_USER');
  }

  @Post('apis/:apiId/deprecate')
  @ApiOperation({ summary: 'Deprecar versão de API' })
  deprecateAPI(@Param('apiId') apiId: string, @Body('deprecatedBy') deprecatedBy: string, @Body('reason') reason: string) {
    return this.lifecycleSvc.deprecateAPI(apiId, deprecatedBy ?? 'API_USER', reason ?? 'Versão descontinuada');
  }

  @Get('apis')
  @ApiOperation({ summary: 'Listar APIs por estágio do ciclo de vida' })
  @ApiQuery({ name: 'stage', required: false, enum: APILifecycleStage })
  listAPIs(@Query('stage') stage?: APILifecycleStage) {
    return this.lifecycleSvc.listAPIs(stage);
  }

  // ── EVENT MESH ────────────────────────────────────────────────────────────
  @Post('event-mesh/subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar assinatura no Event Mesh (tópicos, política de roteamento)' })
  subscribeEventMesh(
    @Body('subscriberId') subscriberId: string, @Body('topics') topics: string[],
    @Body('routingPolicy') routingPolicy: EventMeshRoutingPolicy,
  ) {
    return this.eventMeshSvc.subscribe(subscriberId, topics ?? [], routingPolicy ?? EventMeshRoutingPolicy.TOPIC_FILTER);
  }

  @Post('event-mesh/publish')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar evento no Event Mesh (CloudEvents compatible)' })
  publishEventMesh(@Body() dto: PublishEventMeshEventDto) {
    return this.eventMeshSvc.publish(dto);
  }

  @Get('event-mesh/subscriptions')
  @ApiOperation({ summary: 'Listar assinaturas ativas no Event Mesh' })
  listSubscriptions() { return this.eventMeshSvc.listSubscriptions(); }

  @Get('event-mesh/history')
  @ApiOperation({ summary: 'Histórico de mensagens do Event Mesh' })
  @ApiQuery({ name: 'topic', required: false })
  getMessageHistory(@Query('topic') topic?: string) {
    return this.eventMeshSvc.getMessageHistory(topic);
  }

  // ── SERVICE MESH ──────────────────────────────────────────────────────────
  @Post('service-mesh/discover')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar serviço no Service Mesh (mTLS, circuit breaker)' })
  discoverService(
    @Body('serviceId') serviceId: string, @Body('serviceName') serviceName: string,
    @Body('version') version: string, @Body('endpoint') endpoint: string,
    @Body('healthEndpoint') healthEndpoint: string, @Body('mtlsEnabled') mtlsEnabled: boolean,
  ) {
    return this.serviceMeshSvc.discoverService(serviceId, serviceName, version ?? '1.0.0', endpoint, healthEndpoint ?? `${endpoint}/health`, mtlsEnabled ?? true);
  }

  @Post('service-mesh/:serviceId/circuit-breaker/open')
  @ApiOperation({ summary: 'Abrir Circuit Breaker para serviço (proteção de cascata)' })
  openCircuitBreaker(@Param('serviceId') serviceId: string, @Body('reason') reason: string) {
    return this.serviceMeshSvc.openCircuitBreaker(serviceId, reason ?? 'Alta taxa de erros');
  }

  @Post('service-mesh/:serviceId/circuit-breaker/close')
  @ApiOperation({ summary: 'Fechar Circuit Breaker (restaurar tráfego)' })
  closeCircuitBreaker(@Param('serviceId') serviceId: string) {
    return this.serviceMeshSvc.closeCircuitBreaker(serviceId);
  }

  @Get('service-mesh/services')
  @ApiOperation({ summary: 'Listar serviços registrados no Service Mesh' })
  listServices() { return this.serviceMeshSvc.listServices(); }

  // ── INTEGRATION CATALOG ───────────────────────────────────────────────────
  @Post('catalog')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar entrada no Catálogo Corporativo de Integrações' })
  registerCatalogEntry(
    @Body('name') name: string, @Body('category') category: any,
    @Body('description') description: string, @Body('owner') owner: string,
    @Body('tags') tags: string[], @Body('documentationUrl') documentationUrl?: string,
  ) {
    return this.catalogSvc.registerEntry(name, category, description, owner, tags ?? [], documentationUrl, 'API_USER');
  }

  @Get('catalog/search')
  @ApiOperation({ summary: 'Busca avançada no Catálogo de Integrações' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'category', required: false })
  searchCatalog(@Query('query') query: string, @Query('category') category?: any) {
    return this.catalogSvc.search(query ?? '', category);
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Listar todas as entradas do Catálogo de Integrações' })
  listCatalog(@Query('category') category?: any) {
    return this.catalogSvc.listAll(category);
  }

  // ── WEBHOOKS ──────────────────────────────────────────────────────────────
  @Post('webhooks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar webhook para notificações de eventos' })
  registerWebhook(@Body() dto: RegisterWebhookDto) {
    return this.webhookSvc.registerWebhook(dto, 'API_USER');
  }

  @Post('webhooks/:webhookId/trigger')
  @ApiOperation({ summary: 'Disparar webhook manualmente para evento específico' })
  triggerWebhook(@Param('webhookId') webhookId: string, @Body('event') event: string) {
    return this.webhookSvc.triggerWebhook(webhookId, event ?? 'TEST_EVENT');
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'Listar webhooks registrados' })
  listWebhooks() { return this.webhookSvc.listWebhooks(); }

  // ── EXTERNAL CONNECTORS ───────────────────────────────────────────────────
  @Post('connectors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Instalar conector externo (Gov.br, ERP, CRM, Saúde, IA)' })
  installConnector(@Body() dto: RegisterConnectorDto) {
    return this.connectorSvc.installConnector(dto, 'API_USER');
  }

  @Post('connectors/:connectorId/test')
  @ApiOperation({ summary: 'Testar conectividade do conector externo' })
  testConnector(@Param('connectorId') connectorId: string) {
    return this.connectorSvc.testConnector(connectorId);
  }

  @Get('connectors')
  @ApiOperation({ summary: 'Listar conectores instalados por tipo' })
  @ApiQuery({ name: 'type', required: false, enum: ConnectorType })
  listConnectors(@Query('type') type?: ConnectorType) {
    return this.connectorSvc.listConnectors(type);
  }

  // ── PARTNER PORTAL ────────────────────────────────────────────────────────
  @Post('partners')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar parceiro no Portal de Integração' })
  registerPartner(@Body() dto: RegisterPartnerDto) {
    return this.partnerSvc.registerPartner(dto, 'API_USER');
  }

  @Post('partners/:partnerId/sandbox')
  @ApiOperation({ summary: 'Promover parceiro para ambiente sandbox com credenciais' })
  promoteToSandbox(@Param('partnerId') partnerId: string, @Body('approvedBy') approvedBy: string) {
    return this.partnerSvc.promoteToSandbox(partnerId, approvedBy ?? 'API_USER');
  }

  @Post('partners/:partnerId/activate')
  @ApiOperation({ summary: 'Ativar parceiro em produção com escopos concedidos' })
  activatePartner(
    @Param('partnerId') partnerId: string,
    @Body('grantedScopes') grantedScopes: string[], @Body('approvedBy') approvedBy: string,
  ) {
    return this.partnerSvc.activatePartner(partnerId, grantedScopes ?? [], approvedBy ?? 'API_USER');
  }

  @Get('partners')
  @ApiOperation({ summary: 'Listar parceiros por status' })
  @ApiQuery({ name: 'status', required: false, enum: PartnerStatus })
  listPartners(@Query('status') status?: PartnerStatus) {
    return this.partnerSvc.listPartners(status);
  }

  // ── AUDIT ─────────────────────────────────────────────────────────────────
  @Get('audit')
  @ApiOperation({ summary: 'Trilha imutável de auditoria EIEMP com assinatura SHA-256' })
  @ApiQuery({ name: 'subject', required: false })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditSvc.getAuditTrail(subject);
  }

  @Get('audit/count')
  @ApiOperation({ summary: 'Total de entradas na trilha de auditoria EIEMP' })
  getAuditCount() { return { count: this.auditSvc.getAuditCount() }; }
}
