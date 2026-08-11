/**
 * IAMContext — Testes do Redirecionamento por Papel Pós-Login (GAP-P3-01)
 *
 * Verifica que cada papel institucional redireciona para o destino correto
 * definido no ROLE_REDIRECT_MAP, garantindo que nenhum papel fique sem
 * destino ou use hardcodes fora do mapa central.
 *
 * Ref: REMEDIATION-AURA-001 (R3-01), GAP-P3-01
 */

import { ROLE_REDIRECT_MAP, InstitutionalRole } from '../types/iam';

// ---------------------------------------------------------------------------
// Utilitário: simula a lógica de getRedirectPathForUser usando o ROLE_PRIORITY
// (extrai a lógica pura para torná-la testável independentemente do React)
// ---------------------------------------------------------------------------

const ROLE_PRIORITY: InstitutionalRole[] = [
  'super_user_universal',
  'super_admin',
  'auditor',
  'president',
  'director',
  'manager',
  'coordinator',
  'professional',
  'volunteer_professional',
  'admin_collaborator',
  'admin_volunteer',
  'legal_guardian',
  'beneficiary',
];

function getRedirectPath(roles: InstitutionalRole[]): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      return ROLE_REDIRECT_MAP[role] ?? '/dashboard';
    }
  }
  return '/dashboard';
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe('GAP-P3-01 — Redirecionamento por papel pós-login', () => {

  describe('Papéis com destinos específicos no ROLE_REDIRECT_MAP', () => {
    it('super_user_universal → /painel-supremo', () => {
      expect(getRedirectPath(['super_user_universal'])).toBe('/painel-supremo');
    });

    it('super_admin → /painel-supremo (via mapa, não hardcode)', () => {
      expect(getRedirectPath(['super_admin'])).toBe(ROLE_REDIRECT_MAP.super_admin);
    });

    it('auditor → /painel-auditoria', () => {
      expect(getRedirectPath(['auditor'])).toBe('/painel-auditoria');
    });

    it('president → /dashboard-executivo', () => {
      expect(getRedirectPath(['president'])).toBe('/dashboard-executivo');
    });

    it('director → /dashboard-executivo', () => {
      expect(getRedirectPath(['director'])).toBe('/dashboard-executivo');
    });

    it('manager → /dashboard-gerencial', () => {
      expect(getRedirectPath(['manager'])).toBe('/dashboard-gerencial');
    });

    it('coordinator → /dashboard', () => {
      expect(getRedirectPath(['coordinator'])).toBe('/dashboard');
    });

    it('professional → /portal-profissional', () => {
      expect(getRedirectPath(['professional'])).toBe('/portal-profissional');
    });

    it('volunteer_professional → /portal-profissional', () => {
      expect(getRedirectPath(['volunteer_professional'])).toBe('/portal-profissional');
    });

    it('admin_collaborator → /erp-social', () => {
      expect(getRedirectPath(['admin_collaborator'])).toBe('/erp-social');
    });

    it('admin_volunteer → /portal-voluntario', () => {
      expect(getRedirectPath(['admin_volunteer'])).toBe('/portal-voluntario');
    });

    it('legal_guardian → /area-familia', () => {
      expect(getRedirectPath(['legal_guardian'])).toBe('/area-familia');
    });

    it('beneficiary → /portal-beneficiario', () => {
      expect(getRedirectPath(['beneficiary'])).toBe('/portal-beneficiario');
    });
  });

  describe('Fallback para papéis desconhecidos ou usuário sem papel', () => {
    it('array vazio → /dashboard (fallback)', () => {
      expect(getRedirectPath([])).toBe('/dashboard');
    });

    it('papel inexistente → /dashboard (fallback)', () => {
      expect(getRedirectPath(['unknown_role' as InstitutionalRole])).toBe('/dashboard');
    });
  });

  describe('Prioridade de papéis múltiplos', () => {
    it('super_user_universal tem prioridade sobre qualquer outro papel', () => {
      expect(getRedirectPath(['beneficiary', 'professional', 'super_user_universal']))
        .toBe('/painel-supremo');
    });

    it('super_admin tem prioridade sobre papéis operacionais', () => {
      expect(getRedirectPath(['professional', 'manager', 'super_admin']))
        .toBe(ROLE_REDIRECT_MAP.super_admin);
    });

    it('auditor tem prioridade sobre manager', () => {
      expect(getRedirectPath(['manager', 'auditor'])).toBe('/painel-auditoria');
    });

    it('director tem prioridade sobre coordinator', () => {
      expect(getRedirectPath(['coordinator', 'director'])).toBe('/dashboard-executivo');
    });

    it('professional tem prioridade sobre beneficiary', () => {
      expect(getRedirectPath(['beneficiary', 'professional'])).toBe('/portal-profissional');
    });
  });

  describe('Integridade do ROLE_REDIRECT_MAP', () => {
    it('todos os papéis do ROLE_PRIORITY devem estar no ROLE_REDIRECT_MAP', () => {
      for (const role of ROLE_PRIORITY) {
        expect(ROLE_REDIRECT_MAP[role]).toBeDefined();
        expect(typeof ROLE_REDIRECT_MAP[role]).toBe('string');
        expect(ROLE_REDIRECT_MAP[role].length).toBeGreaterThan(0);
      }
    });

    it('todos os destinos devem começar com /', () => {
      for (const [role, path] of Object.entries(ROLE_REDIRECT_MAP)) {
        expect(path).toMatch(/^\//);
      }
    });
  });
});
