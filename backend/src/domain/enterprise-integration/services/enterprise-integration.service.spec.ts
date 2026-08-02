import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { IntegrationAuditService } from './integration-audit.service';
import { EnterpriseIntegrationService } from './enterprise-integration.service';
import { APIGatewayService } from './api-gateway.service';
import { ExternalConnectorService } from './external-connector.service';
import { InteroperabilityService } from './interoperability.service';
import { EventExchangeService } from './event-exchange.service';
import { PartnerIntegrationService } from './partner-integration.service';
import { IntegrationGovernanceService } from './integration-governance.service';
import { IntegrationMonitoringService } from './integration-monitoring.service';
import { IntegrationSecurityService } from './integration-security.service';

import {
  IntegrationProtocol,
  IntegrationStatus,
  PartnerType,
  SecurityLevel,
} from '../dto/enterprise-integration.dto';

// ── Mock ─────────────────────────────────────────────────────────────────────

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Prompt 166 — EIIP: Enterprise Integration, Interoperability & Digital Ecosystem Platform', () => {
  let auditService: IntegrationAuditService;
  let integrationService: EnterpriseIntegrationService;
  let apiGateway: APIGatewayService;
  let connectorService: ExternalConnectorService;
  let interoperabilityService: InteroperabilityService;
  let eventExchange: EventExchangeService;
  let partnerService: PartnerIntegrationService;
  let governanceService: IntegrationGovernanceService;
  let monitoringService: IntegrationMonitoringService;
  let securityService: IntegrationSecurityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationAuditService,
        EnterpriseIntegrationService,
        APIGatewayService,
        ExternalConnectorService,
        InteroperabilityService,
        EventExchangeService,
        PartnerIntegrationService,
        IntegrationGovernanceService,
        IntegrationMonitoringService,
        IntegrationSecurityService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditService = module.get(IntegrationAuditService);
    integrationService = module.get(EnterpriseIntegrationService);
    apiGateway = module.get(APIGatewayService);
    connectorService = module.get(ExternalConnectorService);
    interoperabilityService = module.get(InteroperabilityService);
    eventExchange = module.get(EventExchangeService);
    partnerService = module.get(PartnerIntegrationService);
    governanceService = module.get(IntegrationGovernanceService);
    monitoringService = module.get(IntegrationMonitoringService);
    securityService = module.get(IntegrationSecurityService);

    jest.clearAllMocks();
  });

  // ── 1. IntegrationAuditService ─────────────────────────────────────────────

  describe('IntegrationAuditService', () => {
    it('should record an audit entry with SHA-256 signature', async () => {
      const entry = await auditService.recordAudit('TEST_ACTION', 'subject-1', 'CInO');
      expect(entry.auditId).toMatch(/^EIIP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
    });

    it('should publish aura.integration.audit.completed.v1 event', async () => {
      await auditService.recordAudit('ACTION', 'sub', 'CISO');
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.integration.audit.completed.v1',
        expect.objectContaining({ action: 'ACTION' }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 2. EnterpriseIntegrationService ────────────────────────────────────────

  describe('EnterpriseIntegrationService', () => {
    it('should propose a new external integration', async () => {
      const res = await integrationService.createIntegration({
        integrationName: 'Integração e-SUS',
        partnerId: 'PARTNER-HEALTH-01',
        protocol: IntegrationProtocol.REST,
        securityLevel: SecurityLevel.MTLS_STRICT,
      });
      expect(res.integrationId).toMatch(/^INT-/);
      expect(res.status).toBe(IntegrationStatus.PROPOSED);
    });

    it('should list integrations by partnerId', () => {
      const list = integrationService.listIntegrations('PARTNER-MDS-01');
      expect(list.length).toBeGreaterThan(0);
    });
  });

  // ── 3. APIGatewayService ────────────────────────────────────────────────────

  describe('APIGatewayService', () => {
    it('should list API Gateway routes', () => {
      const routes = apiGateway.listRoutes();
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].requiresMtls).toBeDefined();
    });

    it('should release a new API version', async () => {
      const route = await apiGateway.releaseAPIVersion('ROUTE-BENEFICIARIES-V1', '2.0.0');
      expect(route?.activeVersion).toBe('2.0.0');
    });
  });

  // ── 4. ExternalConnectorService ─────────────────────────────────────────────

  describe('ExternalConnectorService', () => {
    it('should list all standardized protocol connectors', () => {
      const connectors = connectorService.listConnectors();
      expect(connectors.length).toBeGreaterThanOrEqual(7);
      const restConnector = connectorService.getConnector(IntegrationProtocol.REST);
      expect(restConnector?.isOperational).toBe(true);
    });
  });

  // ── 5. InteroperabilityService ──────────────────────────────────────────────

  describe('InteroperabilityService', () => {
    it('should transform schemas and log audit', async () => {
      const res = await interoperabilityService.transformSchema('AuraBeneficiaryV1', 'FHIR_Patient_R4', { id: 1 });
      expect(res.transformationId).toMatch(/^TRANS-/);
      expect(res.transformationSuccessRatePercent).toBe(100);
    });
  });

  // ── 6. EventExchangeService ─────────────────────────────────────────────────

  describe('EventExchangeService', () => {
    it('should publish events to the exchange with DLQ enabled', async () => {
      const pub = await eventExchange.publishToExchange({
        topic: 'aura.external.data.synced.v1',
        payload: { count: 10 },
      });
      expect(pub.publicationId).toMatch(/^EVT-PUB-/);
      expect(pub.deadLetterQueueConfigured).toBe(true);
    });
  });

  // ── 7. PartnerIntegrationService ────────────────────────────────────────────

  describe('PartnerIntegrationService', () => {
    it('should register and credential a new institutional partner', async () => {
      const partner = await partnerService.registerPartner({
        partnerName: 'Secretaria da Saúde SP',
        partnerType: PartnerType.HEALTHCARE_PROVIDER,
        contactEmail: 'saude@sp.gov.br',
      });
      expect(partner.partnerId).toMatch(/^PARTNER-/);
      expect(partner.isCredentialed).toBe(true);
    });
  });

  // ── 8. IntegrationGovernanceService ─────────────────────────────────────────

  describe('IntegrationGovernanceService', () => {
    it('should approve an integration proposal', async () => {
      const review = await governanceService.reviewIntegration({
        integrationId: 'INT-89123',
        decision: IntegrationStatus.APPROVED,
        reviewNotes: 'Aprovado mTLS',
        reviewedBy: 'CInO',
      });
      expect(review.reviewId).toMatch(/^REV-/);
      expect(review.decision).toBe(IntegrationStatus.APPROVED);
    });
  });

  // ── 9. IntegrationMonitoringService ─────────────────────────────────────────

  describe('IntegrationMonitoringService', () => {
    it('should return real-time integration health metrics', async () => {
      const health = await monitoringService.getHealthMetrics();
      expect(health.healthId).toMatch(/^HEALTH-/);
      expect(health.overallAvailabilityPercent).toBeGreaterThan(99);
      expect(health.averageLatencyMs).toBeLessThan(100);
    });
  });

  // ── 10. IntegrationSecurityService ─────────────────────────────────────────

  describe('IntegrationSecurityService', () => {
    it('should enforce mTLS and security policy', async () => {
      const policy = await securityService.enforceSecurityPolicy('INT-89123', SecurityLevel.MTLS_STRICT);
      expect(policy.policyId).toMatch(/^SEC-POL-/);
      expect(policy.mtlsEnabled).toBe(true);
      expect(policy.oauth21TokenValidation).toBe(true);
    });
  });
});
