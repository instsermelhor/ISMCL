import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { FederationAuditService } from './federation-audit.service';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { WhiteLabelService } from './white-label.service';
import { FederationGovernanceService } from './federation-governance.service';
import { TenantIsolationService } from './tenant-isolation.service';
import { TenantLicensingService } from './tenant-licensing.service';
import { FMIPDashboardService } from './fmip-dashboard.service';

import {
  TenantStatus,
  TenantTier,
  IsolationStrategy,
  FederationTrustLevel,
} from '../dto/federated-multi-tenant.dto';

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('P167 FMIP — Federated Multi-Institution Platform', () => {
  let auditSvc: FederationAuditService;
  let tenantSvc: TenantProvisioningService;
  let whiteLabelSvc: WhiteLabelService;
  let federationSvc: FederationGovernanceService;
  let isolationSvc: TenantIsolationService;
  let licensingSvc: TenantLicensingService;
  let dashboardSvc: FMIPDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FederationAuditService,
        TenantProvisioningService,
        WhiteLabelService,
        FederationGovernanceService,
        TenantIsolationService,
        TenantLicensingService,
        FMIPDashboardService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get<FederationAuditService>(FederationAuditService);
    tenantSvc = module.get<TenantProvisioningService>(TenantProvisioningService);
    whiteLabelSvc = module.get<WhiteLabelService>(WhiteLabelService);
    federationSvc = module.get<FederationGovernanceService>(FederationGovernanceService);
    isolationSvc = module.get<TenantIsolationService>(TenantIsolationService);
    licensingSvc = module.get<TenantLicensingService>(TenantLicensingService);
    dashboardSvc = module.get<FMIPDashboardService>(FMIPDashboardService);
  });

  // ── FederationAuditService ─────────────────────────────────────────────────
  describe('FederationAuditService', () => {
    it('deve registrar auditoria com SHA-256', async () => {
      const entry = await auditSvc.recordAudit('TEST_ACTION', 'tenant-abc', 'USER_01', { test: true });
      expect(entry.auditId).toMatch(/^FMIP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
      expect(entry.action).toBe('TEST_ACTION');
    });

    it('deve filtrar trilha por tenantId', async () => {
      await auditSvc.recordAudit('ACTION_A', 'tenant-x', 'USER_01', {});
      await auditSvc.recordAudit('ACTION_B', 'tenant-y', 'USER_01', {});
      const trail = auditSvc.getAuditTrail('tenant-x');
      expect(trail.every((e) => e.tenantId === 'tenant-x')).toBe(true);
    });
  });

  // ── TenantProvisioningService ──────────────────────────────────────────────
  describe('TenantProvisioningService', () => {
    it('deve registrar e recuperar tenant', async () => {
      const tenant = await tenantSvc.registerTenant({
        organizationName: 'Fundação Esperança',
        tenantSlug: 'esperanca',
        tier: TenantTier.ENTERPRISE_FOUNDATION,
      });
      expect(tenant.status).toBe(TenantStatus.PROVISIONING);
      expect(tenant.tenantSlug).toBe('esperanca');
      const found = tenantSvc.getTenant(tenant.tenantId);
      expect(found).toBeDefined();
    });

    it('deve ativar tenant em PROVISIONING', async () => {
      const tenant = await tenantSvc.registerTenant({
        organizationName: 'OSC Renovar',
        tenantSlug: 'renovar',
        tier: TenantTier.COMMUNITY_OSC,
      });
      const activated = await tenantSvc.activateTenant(tenant.tenantId, 'ADMIN');
      expect(activated.status).toBe(TenantStatus.ACTIVE);
    });

    it('deve suspender tenant ativo', async () => {
      const tenant = await tenantSvc.registerTenant({
        organizationName: 'OSC Ativa',
        tenantSlug: 'ativa',
        tier: TenantTier.COMMUNITY_OSC,
      });
      await tenantSvc.activateTenant(tenant.tenantId, 'ADMIN');
      const suspended = await tenantSvc.suspendTenant(tenant.tenantId, 'Auditoria', 'ADMIN');
      expect(suspended.status).toBe(TenantStatus.SUSPENDED);
    });

    it('deve listar tenants por status', async () => {
      const all = tenantSvc.listTenants();
      expect(Array.isArray(all)).toBe(true);
      // Instituto Ser Melhor deve estar ativo
      const active = tenantSvc.listTenants(TenantStatus.ACTIVE);
      expect(active.some((t) => t.tenantId === 'ser-melhor')).toBe(true);
    });
  });

  // ── WhiteLabelService ──────────────────────────────────────────────────────
  describe('WhiteLabelService', () => {
    it('deve configurar identidade visual e módulos', async () => {
      const cfg = await whiteLabelSvc.configure({
        tenantId: 'esperanca',
        customDomain: 'https://painel.esperanca.org.br',
        logoUrl: 'https://cdn.esperanca.org.br/logo.png',
        primaryColorHex: '#2B6CB0',
        enabledModules: ['beneficiary-management', 'case-management'],
      });
      expect(cfg.customDomain).toBe('https://painel.esperanca.org.br');
      expect(cfg.enabledModules).toContain('beneficiary-management');
    });

    it('deve rejeitar módulos não permitidos', async () => {
      const cfg = await whiteLabelSvc.configure({
        tenantId: 'test-tenant',
        customDomain: 'https://test.org.br',
        enabledModules: ['beneficiary-management', 'ADMIN_PANEL_SISTEMA_ISM'],
      });
      expect(cfg.enabledModules).not.toContain('ADMIN_PANEL_SISTEMA_ISM');
    });

    it('deve retornar lista de módulos permitidos', () => {
      const modules = whiteLabelSvc.getPermittedModules();
      expect(modules.length).toBeGreaterThan(0);
      expect(modules).toContain('beneficiary-management');
    });
  });

  // ── FederationGovernanceService ────────────────────────────────────────────
  describe('FederationGovernanceService', () => {
    it('deve criar federação em PENDING_APPROVAL', async () => {
      const fed = await federationSvc.establishFederation({
        sourceTenantId: 'ser-melhor',
        targetTenantId: 'esperanca',
        trustLevel: FederationTrustLevel.LIMITED_REFERRAL_ONLY,
        agreementDetails: 'Encaminhamento psicossocial',
      });
      expect(fed.status).toBe('PENDING_APPROVAL');
      expect(fed.federationId).toMatch(/^FED-/);
    });

    it('deve aprovar federação pendente', async () => {
      const fed = await federationSvc.establishFederation({
        sourceTenantId: 'ser-melhor',
        targetTenantId: 'renovar',
        trustLevel: FederationTrustLevel.LIMITED_REFERRAL_ONLY,
      });
      const approved = await federationSvc.approveFederation(fed.federationId, 'CPlO');
      expect(approved.status).toBe('ACTIVE');
    });

    it('deve validar política de fluxo de dados', async () => {
      const fed = await federationSvc.establishFederation({
        sourceTenantId: 'ser-melhor',
        targetTenantId: 'fundacao-vida',
        trustLevel: FederationTrustLevel.LIMITED_REFERRAL_ONLY,
      });
      await federationSvc.approveFederation(fed.federationId, 'CPlO');
      const permitted = federationSvc.isDataFlowPermitted('ser-melhor', 'fundacao-vida', 'REFERRAL_METADATA');
      expect(permitted).toBe(true);
      const blocked = federationSvc.isDataFlowPermitted('ser-melhor', 'fundacao-vida', 'FULL_PII_RECORD');
      expect(blocked).toBe(false);
    });

    it('deve revogar federação', async () => {
      const fed = await federationSvc.establishFederation({
        sourceTenantId: 'ser-melhor',
        targetTenantId: 'org-teste',
        trustLevel: FederationTrustLevel.NONE,
      });
      const revoked = await federationSvc.revokeFederation(fed.federationId, 'Expiração contratual', 'CPlO');
      expect(revoked.status).toBe('REVOKED');
    });
  });

  // ── TenantIsolationService ─────────────────────────────────────────────────
  describe('TenantIsolationService', () => {
    it('deve auditar isolamento DATABASE_PER_TENANT com score máximo', async () => {
      const report = await isolationSvc.auditIsolation('ser-melhor', IsolationStrategy.DATABASE_PER_TENANT);
      expect(report.isolationScore).toBe(100);
      expect(report.dataIsolationVerified).toBe(true);
      expect(report.networkIsolationVerified).toBe(true);
      expect(report.lgpdCompliant).toBe(true);
    });

    it('deve auditar isolamento LOGICAL_SHARED_DB com score reduzido', async () => {
      const report = await isolationSvc.auditIsolation('tenant-shared', IsolationStrategy.LOGICAL_SHARED_DB);
      expect(report.isolationScore).toBeLessThan(100);
      expect(report.dataIsolationVerified).toBe(false);
      expect(report.findings.length).toBeGreaterThan(0);
    });

    it('deve calcular score agregado', async () => {
      await isolationSvc.auditIsolation('ser-melhor', IsolationStrategy.DATABASE_PER_TENANT);
      const avgScore = isolationSvc.getAggregateIsolationScore();
      expect(avgScore).toBeGreaterThanOrEqual(0);
      expect(avgScore).toBeLessThanOrEqual(100);
    });
  });

  // ── TenantLicensingService ─────────────────────────────────────────────────
  describe('TenantLicensingService', () => {
    it('deve conceder licença COMMUNITY_OSC com limites corretos', async () => {
      const lic = await licensingSvc.grantLicense('osc-test', TenantTier.COMMUNITY_OSC);
      expect(lic.licenseType).toBe('OSC_FREE');
      expect(lic.maxBeneficiaries).toBe(500);
      expect(lic.status).toBe('ACTIVE');
    });

    it('deve conceder licença ENTERPRISE_FULL sem limite', async () => {
      const lic = await licensingSvc.grantLicense('ism-main', TenantTier.MAINTAINER_INSTITUTE);
      expect(lic.licenseType).toBe('ENTERPRISE_FULL');
      expect(lic.allowedModules).toContain('ALL');
    });

    it('deve verificar acesso a módulo autorizado', async () => {
      await licensingSvc.grantLicense('tenant-check', TenantTier.ENTERPRISE_FOUNDATION);
      expect(licensingSvc.isModuleAllowed('tenant-check', 'case-management')).toBe(true);
      expect(licensingSvc.isModuleAllowed('tenant-check', 'governance-lite')).toBe(false);
    });

    it('deve revogar licença', async () => {
      await licensingSvc.grantLicense('tenant-revoke', TenantTier.COMMUNITY_OSC);
      await licensingSvc.revokeLicense('tenant-revoke', 'Descumprimento contratual', 'ADMIN');
      const lic = licensingSvc.getLicense('tenant-revoke');
      expect(lic?.status).toBe('SUSPENDED');
    });
  });

  // ── FMIPDashboardService ───────────────────────────────────────────────────
  describe('FMIPDashboardService', () => {
    it('deve gerar dashboard completo', () => {
      const dash = dashboardSvc.getDashboard();
      expect(dash.generatedAt).toBeDefined();
      expect(dash.platform.totalTenants).toBeGreaterThan(0);
      expect(dash.maintainerTenantStatus).toBe('ACTIVE');
    });
  });
});
