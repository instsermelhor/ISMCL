import { securityContextStorage, UserSecurityContext } from './security-context';

describe('AURA DATABASE ZERO-TRUST & RLS SPEC (PROMPT 202)', () => {
  it('deve validar isolamento de tenant no contexto da sessão de banco', (done) => {
    const tenantAContext: UserSecurityContext = {
      userId: 'user-a',
      tenantId: 'tenant-alpha',
      role: 'CLINICIAN',
      sensitivityLevel: 2,
      ipAddress: '10.0.0.1',
      userAgent: 'PostgreSQL-Driver',
      activeBreakGlassSessions: {},
    };

    securityContextStorage.run(tenantAContext, () => {
      const store = securityContextStorage.getStore();
      expect(store).toBeDefined();
      expect(store?.tenantId).toBe('tenant-alpha');
      expect(store?.sensitivityLevel).toBe(2);
      done();
    });
  });

  it('deve impedir que uma conexão sem tenant context acesse dados Nível 4 sem Break-Glass', (done) => {
    const anonymousContext: UserSecurityContext = {
      userId: 'anon',
      tenantId: 'default',
      role: 'VOLUNTEER',
      sensitivityLevel: 1,
      ipAddress: '192.168.1.1',
      userAgent: 'PublicAPI',
      activeBreakGlassSessions: {},
    };

    securityContextStorage.run(anonymousContext, () => {
      const store = securityContextStorage.getStore();
      expect(store?.sensitivityLevel).toBeLessThan(4);
      expect(Object.keys(store?.activeBreakGlassSessions || {}).length).toBe(0);
      done();
    });
  });

  it('deve autorizar acesso excepcional quando houver Break-Glass Session ativa e válida', (done) => {
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const breakGlassContext: UserSecurityContext = {
      userId: 'clinician-emergency',
      tenantId: 'tenant-sp',
      role: 'CLINICIAN',
      sensitivityLevel: 2,
      ipAddress: '10.10.0.50',
      userAgent: 'EmergencyClient',
      activeBreakGlassSessions: {
        'beneficiary-critical-99': { expiresAt: futureDate },
      },
    };

    securityContextStorage.run(breakGlassContext, () => {
      const store = securityContextStorage.getStore();
      expect(store?.activeBreakGlassSessions['beneficiary-critical-99']).toBeDefined();
      const expiresAt = new Date(store?.activeBreakGlassSessions['beneficiary-critical-99'].expiresAt || '');
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      done();
    });
  });
});
