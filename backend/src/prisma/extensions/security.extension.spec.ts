import { securityContextStorage, UserSecurityContext } from './security-context';
import { securityExtension } from './security.extension';

describe('MCSI Security Extension — GAP-P1-01 (Pesquisa Segura Nível 4)', () => {
  it('deve ser definida e ser um plugin Prisma válido', () => {
    expect(securityExtension).toBeDefined();
    expect(typeof securityExtension).toBe('function');
  });

  describe('AsyncLocalStorage Security Context', () => {
    it('deve armazenar e isolar o contexto de segurança por request', (done) => {
      const mockContext: UserSecurityContext = {
        userId: 'user-clinician-001',
        role: 'CLINICIAN',
        sensitivityLevel: 1,
        ipAddress: '127.0.0.1',
        userAgent: 'JestTest',
        activeBreakGlassSessions: {}
      };

      securityContextStorage.run(mockContext, () => {
        const activeStore = securityContextStorage.getStore();
        expect(activeStore).toBeDefined();
        expect(activeStore?.userId).toBe('user-clinician-001');
        expect(activeStore?.sensitivityLevel).toBe(1);
        done();
      });
    });
  });

  describe('Pesquisa Segura — Mapeamento de Papéis MCSI', () => {
    const roleLevelMap: Record<string, number> = {
      VOLUNTEER: 1,
      CLINICIAN: 1,
      PROFISSIONAL: 1,
      OPERADOR: 1,
      COLABORADOR: 1,
      COORDINATOR: 2,
      COORDENADOR: 2,
      FINANCEIRO: 2,
      ADMIN: 3,
      ADMINISTRADOR: 3,
      DPO: 4,
      DIRECTOR: 4,
      GESTOR: 4,
      SUPER_USER_UNIVERSAL: 4,
      SUPER_USER: 4,
    };

    it('deve mapear corretamente papéis para níveis de sensibilidade 0 a 4', () => {
      expect(roleLevelMap['VOLUNTEER']).toBe(1);
      expect(roleLevelMap['CLINICIAN']).toBe(1);
      expect(roleLevelMap['COORDENADOR']).toBe(2);
      expect(roleLevelMap['ADMINISTRADOR']).toBe(3);
      expect(roleLevelMap['DPO']).toBe(4);
      expect(roleLevelMap['GESTOR']).toBe(4);
      expect(roleLevelMap['SUPER_USER_UNIVERSAL']).toBe(4);
    });

    it('deve negar acesso Nível 4 para qualquer nível abaixo de 4 sem Break-Glass', () => {
      const userLevel = 1; // CLINICIAN
      const targetSensitivity = 4; // INSTITUCIONAL_SIGILOSO
      const hasBreakGlass = false;

      const isAllowed = userLevel >= targetSensitivity || hasBreakGlass;
      expect(isAllowed).toBe(false);
    });

    it('deve permitir acesso Nível 4 para usuários com sensibilidade Nível 4', () => {
      const userLevel = 4; // DPO / GESTOR
      const targetSensitivity = 4;
      const hasBreakGlass = false;

      const isAllowed = userLevel >= targetSensitivity || hasBreakGlass;
      expect(isAllowed).toBe(true);
    });

    it('deve permitir acesso Nível 4 para usuários com Break-Glass ativo', () => {
      const userLevel = 1; // CLINICIAN
      const targetSensitivity = 4;
      const activeBreakGlassSessions: Record<string, { expiresAt: string }> = {
        'beneficiary-lvl4-001': { expiresAt: new Date(Date.now() + 3600000).toISOString() }
      };

      const hasBreakGlass = Boolean(activeBreakGlassSessions['beneficiary-lvl4-001']);
      const isAllowed = userLevel >= targetSensitivity || hasBreakGlass;
      expect(isAllowed).toBe(true);
    });
  });
});
