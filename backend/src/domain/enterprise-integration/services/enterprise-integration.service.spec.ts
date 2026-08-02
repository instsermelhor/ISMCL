import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { IntegrationAuditService } from './integration-audit.service';
import { EnterpriseIntegrationService } from './enterprise-integration.service';
import { APIGatewayService } from './api-gateway.service';
import { APILifecycleService } from './api-lifecycle.service';
import { EventMeshService } from './event-mesh.service';
import { ServiceMeshService } from './service-mesh.service';
import { IntegrationCatalogService } from './integration-catalog.service';
import { WebhookManagementService } from './webhook-management.service';
import { ExternalConnectorService } from './external-connector.service';
import { PartnerIntegrationService } from './partner-integration.service';

import {
  APILifecycleStage, ConnectorType, WebhookStatus, PartnerStatus, EventMeshRoutingPolicy,
} from '../dto/enterprise-integration.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

describe('P176 EIEMP — Enterprise Integration, API Economy & Event Mesh Platform', () => {
  let auditSvc: IntegrationAuditService;
  let integrationSvc: EnterpriseIntegrationService;
  let gatewaySvc: APIGatewayService;
  let lifecycleSvc: APILifecycleService;
  let eventMeshSvc: EventMeshService;
  let serviceMeshSvc: ServiceMeshService;
  let catalogSvc: IntegrationCatalogService;
  let webhookSvc: WebhookManagementService;
  let connectorSvc: ExternalConnectorService;
  let partnerSvc: PartnerIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationAuditService, EnterpriseIntegrationService, APIGatewayService,
        APILifecycleService, EventMeshService, ServiceMeshService,
        IntegrationCatalogService, WebhookManagementService,
        ExternalConnectorService, PartnerIntegrationService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get(IntegrationAuditService);
    integrationSvc = module.get(EnterpriseIntegrationService);
    gatewaySvc = module.get(APIGatewayService);
    lifecycleSvc = module.get(APILifecycleService);
    eventMeshSvc = module.get(EventMeshService);
    serviceMeshSvc = module.get(ServiceMeshService);
    catalogSvc = module.get(IntegrationCatalogService);
    webhookSvc = module.get(WebhookManagementService);
    connectorSvc = module.get(ExternalConnectorService);
    partnerSvc = module.get(PartnerIntegrationService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── IntegrationAuditService ───────────────────────────────────────────────
  describe('IntegrationAuditService', () => {
    it('deve registrar auditoria SHA-256 válida', async () => {
      const entry = await auditSvc.recordAudit('API_PUBLISHED', 'API-SOC-V2', 'CIO', { version: '2.0.0' });
      expect(entry.auditId).toMatch(/^EIEMP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
    });
  });

  // ── EnterpriseIntegrationService ──────────────────────────────────────────
  describe('EnterpriseIntegrationService', () => {
    it('deve gerar relatório de saúde da plataforma de integração', async () => {
      const report = await integrationSvc.generateHealthReport('CIO');
      expect(report.reportId).toMatch(/^EIEMP-HEALTH-/);
      expect(report.publishedAPIs).toBeGreaterThan(0);
      expect(report.activePartners).toBeGreaterThan(0);
      expect(report.avgGatewayLatencyMs).toBeLessThan(100);
    });
  });

  // ── APIGatewayService ─────────────────────────────────────────────────────
  describe('APIGatewayService', () => {
    it('deve registrar rota e processar requisição via gateway', async () => {
      const route = await gatewaySvc.registerRoute('API-BENEFITS', '/api/v2/benefits', 'BenefitsService', 100, true, 60, 'CIO');
      expect(route.active).toBe(true);

      const req = await gatewaySvc.processRequest(route.routeId, 'GET', 'PARTNER-NGO-001');
      expect(req.statusCode).toBe(200);
      expect(req.latencyMs).toBeGreaterThan(0);
    });

    it('deve rejeitar requisição para rota inexistente', async () => {
      await expect(gatewaySvc.processRequest('ROUTE-INEXISTENTE', 'POST', 'CLIENT')).rejects.toThrow();
    });
  });

  // ── APILifecycleService ───────────────────────────────────────────────────
  describe('APILifecycleService', () => {
    it('deve registrar, publicar e deprecar API', async () => {
      const api = await lifecycleSvc.registerAPI({
        apiId: 'API-VOLUNTEERS-V1', name: 'API de Voluntariado', version: '1.0.0',
        basePath: '/api/v1/volunteers', owner: 'ISM-Tech', rateLimitRpm: 60,
      }, 'CIO');
      expect(api.stage).toBe(APILifecycleStage.DRAFT);

      const published = await lifecycleSvc.publishAPI('API-VOLUNTEERS-V1', 'CIO');
      expect(published.stage).toBe(APILifecycleStage.PUBLISHED);

      const deprecated = await lifecycleSvc.deprecateAPI('API-VOLUNTEERS-V1', 'CIO', 'Versão 2 disponível');
      expect(deprecated.stage).toBe(APILifecycleStage.DEPRECATED);
    });
  });

  // ── EventMeshService ──────────────────────────────────────────────────────
  describe('EventMeshService', () => {
    it('deve criar assinatura e publicar evento com roteamento por tópico', async () => {
      await eventMeshSvc.subscribe('PartnerNGO', ['aura.benefits'], EventMeshRoutingPolicy.TOPIC_FILTER);
      await eventMeshSvc.subscribe('InternalWorkflow', ['aura.volunteers'], EventMeshRoutingPolicy.TOPIC_FILTER);

      const msg = await eventMeshSvc.publish({
        topic: 'aura.benefits.approved.v1', source: 'BenefitsService',
        payload: { benefitId: 'BEN-042' }, routingPolicy: EventMeshRoutingPolicy.TOPIC_FILTER,
      });

      expect(msg.messageId).toMatch(/^MSG-/);
      expect(msg.deliveredTo).toContain('PartnerNGO');
      expect(msg.deliveredTo).not.toContain('InternalWorkflow');
    });
  });

  // ── ServiceMeshService ────────────────────────────────────────────────────
  describe('ServiceMeshService', () => {
    it('deve descobrir serviço e gerenciar circuit breaker', async () => {
      const svc = await serviceMeshSvc.discoverService('SVC-BENEFITS', 'BenefitsService', '2.0.0', 'http://benefits:3000', 'http://benefits:3000/health', true);
      expect(svc.status).toBe('UP');
      expect(svc.mtlsEnabled).toBe(true);

      const opened = await serviceMeshSvc.openCircuitBreaker('SVC-BENEFITS', 'Alta taxa de timeouts');
      expect(opened.circuitBreakerOpen).toBe(true);
      expect(opened.status).toBe('DEGRADED');

      const closed = await serviceMeshSvc.closeCircuitBreaker('SVC-BENEFITS');
      expect(closed.circuitBreakerOpen).toBe(false);
      expect(closed.status).toBe('UP');
    });
  });

  // ── IntegrationCatalogService ─────────────────────────────────────────────
  describe('IntegrationCatalogService', () => {
    it('deve registrar entradas e realizar busca avançada no catálogo', async () => {
      await catalogSvc.registerEntry('API de Benefícios v2', 'API', 'Gerencia benefícios sociais', 'ISM-Tech', ['beneficios', 'social'], undefined, 'CIO');
      await catalogSvc.registerEntry('Webhook Notificações ONG', 'WEBHOOK', 'Notifica parceiros sobre aprovações', 'ISM-Tech', ['webhook', 'ong']);

      const results = catalogSvc.search('benefí');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category).toBe('API');

      const webhooks = catalogSvc.listAll('WEBHOOK');
      expect(webhooks.every((e) => e.category === 'WEBHOOK')).toBe(true);
    });
  });

  // ── WebhookManagementService ──────────────────────────────────────────────
  describe('WebhookManagementService', () => {
    it('deve registrar e disparar webhook com log de entrega', async () => {
      await webhookSvc.registerWebhook({
        webhookId: 'WH-BENEFIT-ONG', targetUrl: 'https://ong.org.br/hooks/benefits',
        events: ['BENEFIT_APPROVED', 'BENEFIT_REJECTED'], subscriberId: 'ONG-SAUDE-SP',
      }, 'API_USER');

      const delivery = await webhookSvc.triggerWebhook('WH-BENEFIT-ONG', 'BENEFIT_APPROVED');
      expect(delivery.success).toBe(true);
      expect(delivery.statusCode).toBe(200);

      const wh = webhookSvc.getWebhook('WH-BENEFIT-ONG');
      expect(wh?.deliveryLog.length).toBe(1);
    });
  });

  // ── ExternalConnectorService ──────────────────────────────────────────────
  describe('ExternalConnectorService', () => {
    it('deve instalar e testar conector Gov.br', async () => {
      const conn = await connectorSvc.installConnector({
        connectorId: 'CONN-GOVBR-CPF', name: 'CPF Validation Gov.br',
        type: ConnectorType.GOVERNMENT, endpointUrl: 'https://api.gov.br/cpf/validate', authMethod: 'OAuth2',
      }, 'CIO');
      expect(conn.status).toBe('ACTIVE');
      expect(conn.type).toBe(ConnectorType.GOVERNMENT);

      const test = await connectorSvc.testConnector('CONN-GOVBR-CPF');
      expect(test.success).toBe(true);
      expect(test.latencyMs).toBeGreaterThan(0);
    });
  });

  // ── PartnerIntegrationService ─────────────────────────────────────────────
  describe('PartnerIntegrationService', () => {
    it('deve registrar, promover a sandbox e ativar parceiro com escopos', async () => {
      const p = await partnerSvc.registerPartner({
        partnerId: 'PARTNER-SAUDE-SP', partnerName: 'ONG Saúde para Todos SP',
        partnerType: 'ONG', technicalContact: 'ti@saudesp.org.br',
        requestedScopes: ['READ_BENEFITS', 'READ_VOLUNTEERS'],
      }, 'CIO');
      expect(p.status).toBe(PartnerStatus.PENDING);

      const sandbox = await partnerSvc.promoteToSandbox('PARTNER-SAUDE-SP', 'CIO');
      expect(sandbox.status).toBe(PartnerStatus.SANDBOX);
      expect(sandbox.apiKey).toBeTruthy();
      expect(sandbox.sandboxUrl).toContain('PARTNER-SAUDE-SP');

      const active = await partnerSvc.activatePartner('PARTNER-SAUDE-SP', ['READ_BENEFITS'], 'CGO');
      expect(active.status).toBe(PartnerStatus.ACTIVE);
      expect(active.grantedScopes).toContain('READ_BENEFITS');
    });

    it('deve rejeitar ativação de parceiro sem sandbox', async () => {
      await partnerSvc.registerPartner({
        partnerId: 'PARTNER-EDU-MG', partnerName: 'Instituto Educa MG', partnerType: 'Instituto', technicalContact: 'ti@educamg.org.br',
      }, 'CIO');
      await expect(partnerSvc.activatePartner('PARTNER-EDU-MG', [], 'CGO')).rejects.toThrow(/SANDBOX/);
    });
  });
});
