import { PolicyEngine } from './policy.engine';
import { SubjectAttributes, ResourceAttributes, EnvironmentAttributes } from './policy.types';

describe('AURA MULTI-TENANCY MASTER & ISOLAMENTO TOTAL TEST SUITE (PROMPT 201)', () => {
  let policyEngine: PolicyEngine;

  beforeEach(() => {
    policyEngine = new PolicyEngine();
  });

  const baseEnv: EnvironmentAttributes = {
    ipAddress: '192.168.1.10',
    deviceTrusted: true,
    riskScore: 10,
    mfaVerified: true,
  };

  describe('Cenário 1 — Teste 1: Tenant A não lê dados do Tenant B (Anti-IDOR)', () => {
    it('deve BLOQUEAR (403/DENY) usuário do Tenant A tentando acessar recurso do Tenant B', () => {
      const subjectA: SubjectAttributes = {
        userId: 'user-a-1',
        tenantId: 'tenant-a',
        role: 'CLINICIAN',
        permissions: ['ehr:records:read'],
      };

      const resourceB: ResourceAttributes = {
        resourceType: 'BeneficiaryRecord',
        resourceId: 'rec-b-99',
        tenantId: 'tenant-b',
        sensitivityLevel: 'CONFIDENTIAL',
      };

      const decision = policyEngine.evaluate(subjectA, resourceB, 'ehr:records:read', baseEnv);

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Tenant mismatch');
    });
  });

  describe('Cenário 2 — Teste 2: Tenant A não altera registros do Tenant B', () => {
    it('deve BLOQUEAR tentativa de mutação/update cross-tenant', () => {
      const subjectA: SubjectAttributes = {
        userId: 'admin-a',
        tenantId: 'tenant-a',
        role: 'ADMIN',
        permissions: ['beneficiaries:update'],
      };

      const resourceB: ResourceAttributes = {
        resourceType: 'Beneficiary',
        resourceId: 'benef-b-1',
        tenantId: 'tenant-b',
        sensitivityLevel: 'INTERNAL',
      };

      const decision = policyEngine.evaluate(subjectA, resourceB, 'beneficiaries:update', baseEnv);

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Tenant mismatch');
    });
  });

  describe('Cenário 3 — Teste 3: Tenant A não exclui registros do Tenant B', () => {
    it('deve BLOQUEAR tentativa de exclusão cross-tenant', () => {
      const subjectA: SubjectAttributes = {
        userId: 'admin-a',
        tenantId: 'tenant-a',
        role: 'ADMIN',
        permissions: ['cases:delete'],
      };

      const resourceB: ResourceAttributes = {
        resourceType: 'Case',
        resourceId: 'case-b-12',
        tenantId: 'tenant-b',
        sensitivityLevel: 'CONFIDENTIAL',
      };

      const decision = policyEngine.evaluate(subjectA, resourceB, 'cases:delete', baseEnv);

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Tenant mismatch');
    });
  });

  describe('Cenário 4 — Teste 4: Tenant A não exporta dados do Tenant B', () => {
    it('deve BLOQUEAR exportação de relatório pertencente a outro tenant', () => {
      const subjectA: SubjectAttributes = {
        userId: 'fin-a',
        tenantId: 'tenant-a',
        role: 'FINANCIAL',
        permissions: ['financial:reports:export'],
      };

      const resourceB: ResourceAttributes = {
        resourceType: 'FinancialReport',
        resourceId: 'rep-b-2026',
        tenantId: 'tenant-b',
        sensitivityLevel: 'RESTRICTED',
      };

      const decision = policyEngine.evaluate(subjectA, resourceB, 'financial:reports:export', baseEnv);

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Tenant mismatch');
    });
  });

  describe('Cenário 5 — Teste 5: Isolamento de Agendamentos e Atendimentos', () => {
    it('deve BLOQUEAR agendamento em profissional de unidade/tenant distinto', () => {
      const subjectA: SubjectAttributes = {
        userId: 'patient-a',
        tenantId: 'tenant-a',
        role: 'BENEFICIARY',
        permissions: ['scheduling:appointments:create'],
      };

      const resourceB: ResourceAttributes = {
        resourceType: 'AppointmentSlot',
        resourceId: 'slot-b-100',
        tenantId: 'tenant-b',
        sensitivityLevel: 'INTERNAL',
      };

      const decision = policyEngine.evaluate(subjectA, resourceB, 'scheduling:appointments:create', baseEnv);

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Tenant mismatch');
    });
  });

  describe('Cenário 6 — Teste 6: Acesso Global Controlado e Auditado por Super User', () => {
    it('deve PERMITIR acesso do SUPER_USER_UNIVERSAL independente do tenant do recurso', () => {
      const superUser: SubjectAttributes = {
        userId: 'super-admin-root',
        tenantId: 'global-hq',
        role: 'SUPER_USER_UNIVERSAL',
        permissions: ['*:*:*'],
      };

      const resourceB: ResourceAttributes = {
        resourceType: 'AuditLog',
        resourceId: 'log-b-55',
        tenantId: 'tenant-b',
        sensitivityLevel: 'RESTRICTED',
      };

      const decision = policyEngine.evaluate(superUser, resourceB, 'audit:logs:read', baseEnv);

      expect(decision.allowed).toBe(true);
    });
  });

  describe('Cenário 7 — Teste 7: Assistido possui isolamento máximo (Tenant + Ownership)', () => {
    it('deve permitir acesso do assistido apenas quando tenant E ownership coincidirem', () => {
      const patientA: SubjectAttributes = {
        userId: 'patient-a',
        tenantId: 'tenant-a',
        role: 'BENEFICIARY',
        permissions: ['beneficiaries:profile:read'],
      };

      const myResource: ResourceAttributes = {
        resourceType: 'BeneficiaryProfile',
        resourceId: 'prof-a',
        ownerId: 'patient-a',
        tenantId: 'tenant-a',
        sensitivityLevel: 'CONFIDENTIAL',
      };

      const otherResource: ResourceAttributes = {
        resourceType: 'BeneficiaryProfile',
        resourceId: 'prof-other',
        ownerId: 'patient-other',
        tenantId: 'tenant-a',
        sensitivityLevel: 'CONFIDENTIAL',
      };

      const allowDecision = policyEngine.evaluate(patientA, myResource, 'beneficiaries:profile:read', baseEnv);
      expect(allowDecision.allowed).toBe(true);

      const denyDecision = policyEngine.evaluate(patientA, otherResource, 'beneficiaries:profile:read', baseEnv);
      expect(denyDecision.allowed).toBe(false);
    });
  });
});
