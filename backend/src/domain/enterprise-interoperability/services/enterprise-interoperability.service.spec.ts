import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EnterpriseIntegrationService } from './enterprise-integration.service';
import { ApiGatewayManagementService } from './api-gateway-management.service';
import { ExternalConnectorService } from './external-connector.service';
import { InteroperabilityHubService } from './interoperability-hub.service';
import { ConsentManagementService } from './consent-management.service';
import { DataExchangeService } from './data-exchange.service';
import { PartnerIntegrationService } from './partner-integration.service';
import { IntegrationMonitoringService } from './integration-monitoring.service';
import { IntegrationGovernanceService } from './integration-governance.service';
import { ExternalAuditService } from './external-audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  CircuitBreakerState,
  ConnectorType,
  ConsentStatus,
  ExchangeStatus,
  IntegrationSecurityLevel,
  PartnerType,
  ProtocolType,
} from '../dto/enterprise-interoperability.dto';

// ── Mock Factories ─────────────────────────────────────────────────────────────

const mockEventBusService = {
  emit: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue({ id: 'evt-interop-mock-001', type: 'mock.event', data: {} }),
  subscribe: jest.fn(),
  getDlq: jest.fn().mockReturnValue([]),
  replayDlq: jest.fn().mockResolvedValue(0),
};

const mockEventEmitter = {
  emit: jest.fn(),
  on: jest.fn(),
};

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('AEIDIP — Enterprise Interoperability Platform Services (P155)', () => {
  let enterpriseIntegration: EnterpriseIntegrationService;
  let apiGateway: ApiGatewayManagementService;
  let externalConnector: ExternalConnectorService;
  let interoperabilityHub: InteroperabilityHubService;
  let consentManagement: ConsentManagementService;
  let dataExchange: DataExchangeService;
  let partnerIntegration: PartnerIntegrationService;
  let monitoringService: IntegrationMonitoringService;
  let governanceService: IntegrationGovernanceService;
  let externalAudit: ExternalAuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterpriseIntegrationService,
        ApiGatewayManagementService,
        ExternalConnectorService,
        InteroperabilityHubService,
        ConsentManagementService,
        DataExchangeService,
        PartnerIntegrationService,
        IntegrationMonitoringService,
        IntegrationGovernanceService,
        ExternalAuditService,
        { provide: EventBusService, useValue: mockEventBusService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    enterpriseIntegration = module.get<EnterpriseIntegrationService>(EnterpriseIntegrationService);
    apiGateway             = module.get<ApiGatewayManagementService>(ApiGatewayManagementService);
    externalConnector      = module.get<ExternalConnectorService>(ExternalConnectorService);
    interoperabilityHub    = module.get<InteroperabilityHubService>(InteroperabilityHubService);
    consentManagement      = module.get<ConsentManagementService>(ConsentManagementService);
    dataExchange           = module.get<DataExchangeService>(DataExchangeService);
    partnerIntegration     = module.get<PartnerIntegrationService>(PartnerIntegrationService);
    monitoringService      = module.get<IntegrationMonitoringService>(IntegrationMonitoringService);
    governanceService      = module.get<IntegrationGovernanceService>(IntegrationGovernanceService);
    externalAudit          = module.get<ExternalAuditService>(ExternalAuditService);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. ExternalAuditService
  // ════════════════════════════════════════════════════════════════════════════

  describe('ExternalAuditService', () => {
    it('deve registrar auditoria externa assinada com SHA-256 e publicar CloudEvent', async () => {
      const audit = await externalAudit.recordAudit({
        serviceName: 'test-service',
        actionName: 'ExternalDataSent',
        partnerCode: 'MINISTERIO_DA_SAUDE_SUS',
        details: { recordsCount: 15 },
        supervisorId: 'AUDITOR-01',
      });

      expect(audit).toBeDefined();
      expect(audit.auditId).toMatch(/^AUD-EXT-/);
      expect(audit.logId).toMatch(/^EXT-AUD-2026-/);
      expect(audit.sha256Signature).toHaveLength(64);
      expect(audit.supervisorId).toBe('AUDITOR-01');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.interoperability.audit.completed.v1',
        expect.objectContaining({ auditId: audit.auditId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve filtrar trilha de auditoria por código do parceiro', async () => {
      await externalAudit.recordAudit({
        serviceName: 'test-service',
        actionName: 'ActionA',
        partnerCode: 'SUAS_CADUNICO_SOCIAL',
        details: {},
      });

      const trail = externalAudit.getAuditTrail('SUAS_CADUNICO_SOCIAL');
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.every((t) => t.partnerCode === 'SUAS_CADUNICO_SOCIAL')).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. ConsentManagementService
  // ════════════════════════════════════════════════════════════════════════════

  describe('ConsentManagementService', () => {
    it('deve registrar e validar consentimento LGPD ativo', async () => {
      const consent = await consentManagement.grantConsent({
        tenantId: 'TENANT-001',
        beneficiaryId: 'BEN-2026-0002',
        partnerCode: 'MINISTERIO_DA_SAUDE_SUS',
        purpose: 'Compartilhamento de exames e histórico vacinal',
        allowedDataScope: ['vaccines', 'lab_results'],
        validUntil: '2028-12-31T23:59:59Z',
      });

      expect(consent).toBeDefined();
      expect(consent.consentId).toMatch(/^CNS-2026-/);
      expect(consent.status).toBe(ConsentStatus.GRANTED);

      const isValid = consentManagement.validateConsent('BEN-2026-0002', 'MINISTERIO_DA_SAUDE_SUS', 'vaccines');
      expect(isValid).toBe(true);
    });

    it('deve revogar consentimento LGPD e impedir compartilhamento futuro', async () => {
      const consent = await consentManagement.grantConsent({
        tenantId: 'TENANT-001',
        beneficiaryId: 'BEN-REVOKE-001',
        partnerCode: 'SUAS_CADUNICO_SOCIAL',
        purpose: 'Avaliação vulnerabilidade',
        allowedDataScope: ['vulnerability_score'],
        validUntil: '2028-12-31T23:59:59Z',
      });

      const revoked = await consentManagement.revokeConsent({
        consentId: consent.consentId,
        revocationReason: 'Solicitação pelo beneficiário',
        requestedBy: 'BEN-REVOKE-001',
      });

      expect(revoked.status).toBe(ConsentStatus.REVOKED);

      const isValid = consentManagement.validateConsent('BEN-REVOKE-001', 'SUAS_CADUNICO_SOCIAL', 'vulnerability_score');
      expect(isValid).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. PartnerIntegrationService
  // ════════════════════════════════════════════════════════════════════════════

  describe('PartnerIntegrationService', () => {
    it('deve cadastrar parceiro institucional e gerar hash de credencial', async () => {
      const partner = await partnerIntegration.registerPartner({
        partnerCode: 'JUSTICA_TRIBUNAL_ESTADUAL',
        name: 'Tribunal de Justiça do Estado — Vara de Família',
        partnerType: PartnerType.JUSTICE_SYSTEM,
        contactEmail: 'interop@tjes.jus.br',
        allowedScopes: ['court_orders', 'protective_measures'],
        targetSla: '99.9%',
      });

      expect(partner).toBeDefined();
      expect(partner.partnerId).toMatch(/^PTR-2026-/);
      expect(partner.apiKeyHash).toHaveLength(64);
      expect(partner.isActive).toBe(true);
    });

    it('deve validar escopo de acesso autorizado para parceiro', () => {
      const isAllowed = partnerIntegration.validatePartnerAccess('MINISTERIO_DA_SAUDE_SUS', 'fhir_r4_clinical_notes');
      expect(isAllowed).toBe(true);

      const isDenied = partnerIntegration.validatePartnerAccess('MINISTERIO_DA_SAUDE_SUS', 'unauthorized_scope');
      expect(isDenied).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. ExternalConnectorService
  // ════════════════════════════════════════════════════════════════════════════

  describe('ExternalConnectorService', () => {
    it('deve configurar conector externo parametrizável e listar defaults', async () => {
      const connector = await externalConnector.configureConnector({
        connectorType: ConnectorType.GOV_BR_SSO,
        name: 'Conector SSO Cidadão Gov.br',
        endpointUrl: 'https://sso.acesso.gov.br/v2',
        protocol: ProtocolType.REST_OPENAPI,
        securityLevel: IntegrationSecurityLevel.HIGH_CONFIDENTIALITY,
      });

      expect(connector).toBeDefined();
      expect(connector.connectorId).toMatch(/^CON-2026-/);
      expect(connector.isConnected).toBe(true);

      const all = externalConnector.listConnectors();
      expect(all.length).toBeGreaterThanOrEqual(4); // 3 defaults + 1 new
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. ApiGatewayManagementService
  // ════════════════════════════════════════════════════════════════════════════

  describe('ApiGatewayManagementService', () => {
    it('deve registrar rota no API Gateway e validar requisição com rate-limiting', async () => {
      const route = await apiGateway.registerRoute({
        path: '/api/v1/interop/test-path',
        method: 'POST',
        targetPartnerCode: 'MINISTERIO_DA_SAUDE_SUS',
        rateLimitPerMinute: 10,
        monthlyQuota: 1000,
        requireMtls: true,
      });

      expect(route).toBeDefined();
      expect(route.routeId).toMatch(/^GW-RTE-2026-/);

      // Rejeita por falta de mTLS
      const valNoMtls = apiGateway.validateRequest('/api/v1/interop/test-path', 'POST', 'MINISTERIO_DA_SAUDE_SUS', false);
      expect(valNoMtls.allowed).toBe(false);
      expect(valNoMtls.rejectReason).toContain('mTLS');

      // Permite com mTLS
      const valOk = apiGateway.validateRequest('/api/v1/interop/test-path', 'POST', 'MINISTERIO_DA_SAUDE_SUS', true);
      expect(valOk.allowed).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. InteroperabilityHubService
  // ════════════════════════════════════════════════════════════════════════════

  describe('InteroperabilityHubService', () => {
    it('deve traduzir protocolo e normalizar payload', async () => {
      const translation = await interoperabilityHub.translateAndMapPayload(
        ProtocolType.REST_OPENAPI,
        ProtocolType.EVENT_DRIVEN_KAFKA,
        { recordId: 'REC-001', data: 'test' },
        'MINISTERIO_DA_SAUDE_SUS',
      );

      expect(translation).toBeDefined();
      expect(translation.translationId).toMatch(/^TRN-2026-/);
      expect(translation.schemaValid).toBe(true);
      expect(translation.translatedPayload._interopMeta).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. DataExchangeService
  // ════════════════════════════════════════════════════════════════════════════

  describe('DataExchangeService', () => {
    it('deve executar transação de intercâmbio de dados com sucesso', async () => {
      const exchange = await dataExchange.executeDataExchange({
        tenantId: 'TENANT-001',
        partnerCode: 'MINISTERIO_DA_SAUDE_SUS',
        connectorType: ConnectorType.SUS_RNDS,
        protocol: ProtocolType.REST_OPENAPI,
        transactionType: 'EHR_SYNC',
        payload: { patientId: 'P-100', status: 'OK' },
      });

      expect(exchange).toBeDefined();
      expect(exchange.transactionId).toMatch(/^TX-2026-/);
      expect(exchange.status).toBe(ExchangeStatus.SUCCESS);
      expect(exchange.encryptionApplied).toBe(true);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.interoperability.data_exchange.completed.v1',
        expect.objectContaining({ transactionId: exchange.transactionId }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve bloquear intercâmbio quando consentimento LGPD informado for inválido', async () => {
      const exchange = await dataExchange.executeDataExchange({
        tenantId: 'TENANT-001',
        partnerCode: 'MINISTERIO_DA_SAUDE_SUS',
        connectorType: ConnectorType.SUS_RNDS,
        protocol: ProtocolType.REST_OPENAPI,
        transactionType: 'EHR_SYNC',
        payload: { patientId: 'P-100' },
        consentId: 'CNS-INVALIDO-999',
      });

      expect(exchange.status).toBe(ExchangeStatus.BLOCKED_BY_CONSENT);
      expect(exchange.rejectionReason).toContain('Consentimento ausente');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. IntegrationMonitoringService
  // ════════════════════════════════════════════════════════════════════════════

  describe('IntegrationMonitoringService', () => {
    it('deve registrar telemetria e gerar alerta ao detectar falhas recorrentes', async () => {
      const partnerCode = 'PARTNER_FAIL_TEST';
      for (let i = 0; i < 12; i++) {
        await monitoringService.recordTelemetry(partnerCode, 800, false);
      }

      const metrics = monitoringService.getMetrics(partnerCode);
      expect(metrics[0].status).toBe('DEGRADED');

      const alerts = monitoringService.getAlerts(partnerCode);
      expect(alerts.length).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.interoperability.failure.detected.v1',
        expect.objectContaining({ partnerCode }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. IntegrationGovernanceService
  // ════════════════════════════════════════════════════════════════════════════

  describe('IntegrationGovernanceService', () => {
    it('deve aprovar conformidade para parceiro ativo e escopo válido em HTTPS', async () => {
      const gov = await governanceService.validateGovernance({
        partnerCode: 'MINISTERIO_DA_SAUDE_SUS',
        protocol: ProtocolType.REST_OPENAPI,
        targetEndpoint: 'https://rnds-api.saude.gov.br/v1',
        requestedScopes: ['fhir_r4_clinical_notes'],
      });

      expect(gov.isCompliant).toBe(true);
      expect(gov.violations).toHaveLength(0);
    });

    it('deve reprovar conformidade se endpoint for HTTP inseguro', async () => {
      const gov = await governanceService.validateGovernance({
        partnerCode: 'MINISTERIO_DA_SAUDE_SUS',
        protocol: ProtocolType.REST_OPENAPI,
        targetEndpoint: 'http://insecure-endpoint.gov.br',
        requestedScopes: ['fhir_r4_clinical_notes'],
      });

      expect(gov.isCompliant).toBe(false);
      expect(gov.securityCompliancePassed).toBe(false);
      expect(gov.violations[0]).toContain('HTTP não permitido');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. EnterpriseIntegrationService (Orquestrador Principal)
  // ════════════════════════════════════════════════════════════════════════════

  describe('EnterpriseIntegrationService', () => {
    it('deve executar fluxo orquestrado end-to-end com sucesso', async () => {
      const result = await enterpriseIntegration.executeIntegrationFlow(
        'MINISTERIO_DA_SAUDE_SUS',
        {
          tenantId: 'TENANT-001',
          partnerCode: 'MINISTERIO_DA_SAUDE_SUS',
          connectorType: ConnectorType.SUS_RNDS,
          protocol: ProtocolType.REST_OPENAPI,
          transactionType: 'FULL_HEALTH_RECORD',
          payload: { data: 'sample' },
        },
        'fhir_r4_clinical_notes',
      );

      expect(result).toBeDefined();
      expect(result.flowId).toMatch(/^FLOW-2026-/);
      expect(result.status).toBe(ExchangeStatus.SUCCESS);
      expect(result.governancePassed).toBe(true);
      expect(result.circuitBreakerState).toBe(CircuitBreakerState.CLOSED);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.interoperability.integration.created.v1',
        expect.objectContaining({ flowId: result.flowId }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve bloquear fluxo se o parceiro for não-conforme na governança', async () => {
      const result = await enterpriseIntegration.executeIntegrationFlow(
        'PARCEIRO_INEXISTENTE_999',
        {
          tenantId: 'TENANT-001',
          partnerCode: 'PARCEIRO_INEXISTENTE_999',
          connectorType: ConnectorType.CUSTOM_PARTNER_API,
          protocol: ProtocolType.REST_OPENAPI,
          transactionType: 'TEST',
          payload: {},
        },
      );

      expect(result.status).toBe(ExchangeStatus.BLOCKED_BY_GOVERNANCE);
      expect(result.governancePassed).toBe(false);
    });
  });
});
