import { PolicyEngine, EvaluationSubject, EvaluationResource, AccessContext } from './policy.engine';
import { AuraRole } from '../../../shared/decorators/roles.decorator';

describe('PolicyEngine', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine();
  });

  const defaultContext: AccessContext = {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    isTrustedDevice: true,
    requestTime: new Date(),
    riskScore: 0,
    mfaVerified: true,
  };

  it('should allow access when user has matching tenant and explicit permission', () => {
    const subject: EvaluationSubject = {
      id: 'user-1',
      tenantId: 'tenant-a',
      roles: [AuraRole.PROFESSIONAL],
      permissions: ['clinical_record:read'],
    };

    const resource: EvaluationResource = {
      id: 'record-123',
      type: 'clinical_record',
      tenantId: 'tenant-a',
      classification: 'INTERNAL',
    };

    const decision = engine.evaluate(subject, resource, 'READ', defaultContext);

    expect(decision.allowed).toBe(true);
    expect(decision.reason).toContain('Acesso concedido');
  });

  it('should DENY access when tenants mismatch (Multi-tenant Isolation)', () => {
    const subject: EvaluationSubject = {
      id: 'user-1',
      tenantId: 'tenant-a',
      roles: [AuraRole.ADMIN],
      permissions: ['*'],
    };

    const resource: EvaluationResource = {
      id: 'record-999',
      type: 'clinical_record',
      tenantId: 'tenant-b',
      classification: 'INTERNAL',
    };

    const decision = engine.evaluate(subject, resource, 'READ', defaultContext);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('Isolamento de organização/tenant violado');
  });

  it('should DENY access to RESTRICTED resource if MFA is not verified', () => {
    const subject: EvaluationSubject = {
      id: 'user-1',
      tenantId: 'tenant-a',
      roles: [AuraRole.PROFESSIONAL],
      permissions: ['clinical_record:read'],
    };

    const resource: EvaluationResource = {
      id: 'record-sensitive',
      type: 'clinical_record',
      tenantId: 'tenant-a',
      classification: 'RESTRICTED',
    };

    const noMfaContext = { ...defaultContext, mfaVerified: false };

    const decision = engine.evaluate(subject, resource, 'READ', noMfaContext);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('MFA obrigatória');
    expect(decision.requiredMfa).toBe(true);
  });

  it('should DENY access if risk score is excessive (≥ 80)', () => {
    const subject: EvaluationSubject = {
      id: 'user-1',
      tenantId: 'tenant-a',
      roles: [AuraRole.SUPER_ADMIN],
      permissions: ['*'],
    };

    const resource: EvaluationResource = {
      id: 'res-1',
      type: 'any',
      tenantId: 'tenant-a',
      classification: 'PUBLIC',
    };

    const highRiskContext = { ...defaultContext, riskScore: 85 };

    const decision = engine.evaluate(subject, resource, 'READ', highRiskContext);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('Zero Trust');
  });
});
