// ============================================================
// IAMContext — Central de Identidade Institucional
// Instituto Ser Melhor — Plataforma Integrada
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  IAMContextType,
  IAMUser,
  InstitutionalRole,
  PlatformModule,
  PermissionAction,
  AuditLog,
  AISecuritySuggestion,
  IAMSession,
  TrustedDevice,
  LoginResult,
  AuditEventType,
  ImpersonationState,
} from '../types/iam';
import { ROLE_REDIRECT_MAP } from '../types/iam';
import {
  MOCK_IAM_USERS,
  MOCK_AUDIT_LOGS,
  MOCK_AI_SUGGESTIONS,
  MOCK_SESSIONS,
  MOCK_TRUSTED_DEVICES,
  USER_CREDENTIALS,
} from '../data/iam-mock';
import {
  getInitialSuperAdminConfig,
  verifyPasswordHash,
  saveSuperAdminPasswordChange,
} from '../services/SecureCredentialsService';

// ----------------------------------------------------------------

const IAMContext = createContext<IAMContextType | null>(null);

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateAuditLog(
  user: IAMUser | null,
  eventType: AuditEventType,
  extras: Partial<AuditLog> = {}
): AuditLog {
  return {
    id: generateId('log'),
    timestamp: new Date().toISOString(),
    userId: user?.id ?? 'system',
    userName: user?.name ?? 'Sistema',
    userRole: user?.primaryRole ?? 'beneficiary',
    eventType,
    ipAddress: '127.0.0.1', // Em produção: IP real
    userAgent: navigator.userAgent,
    details: {},
    severity: 'info',
    hash: Math.random().toString(36).slice(2), // Em produção: assinatura HMAC
    ...extras,
  };
}

function loadUserFromStorage(): IAMUser | null {
  try {
    const raw = localStorage.getItem('iam_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const primaryRole = parsed.primaryRole ?? parsed.roles?.[0] ?? 'beneficiary';
        const roles = Array.isArray(parsed.roles) && parsed.roles.length > 0 ? parsed.roles : [primaryRole];
        const permissions = Array.isArray(parsed.permissions) ? parsed.permissions : [];
        return {
          ...parsed,
          primaryRole,
          roles,
          permissions,
        } as IAMUser;
      }
    }
  } catch {
    // ignora
  }
  return null;
}

function persistUser(user: IAMUser | null) {
  if (user) {
    localStorage.setItem('iam_user', JSON.stringify(user));
    // Compatibilidade com AuthContext legado
    localStorage.setItem('user_email', user.email);
    localStorage.setItem('user_name', user.name);
    localStorage.setItem('user_role', user.primaryRole);
    localStorage.setItem('user_subtitle', getRoleSubtitle(user));
  } else {
    ['iam_user', 'user_email', 'user_name', 'user_role', 'user_subtitle'].forEach(k =>
      localStorage.removeItem(k)
    );
  }
}

function getRoleSubtitle(user: IAMUser): string {
  const labels: Record<InstitutionalRole, string> = {
    super_user_universal: 'Governança Global Aura',
    beneficiary: 'Portal do Beneficiário',
    legal_guardian: 'Área da Família',
    professional: 'Workspace Clínico',
    volunteer_professional: 'Profissional Voluntário',
    admin_volunteer: 'Voluntário Administrativo',
    admin_collaborator: 'ERP Social',
    coordinator: 'Coordenação',
    manager: 'Gestão',
    director: 'Diretoria',
    president: 'Presidência',
    super_admin: 'Super Administrador',
    auditor: 'Auditoria',
  };
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.primaryRole ?? 'beneficiary'];
  const additionalRoles = roles.filter(r => r !== user?.primaryRole);
  const base = labels[user?.primaryRole ?? 'beneficiary'] ?? 'Acesso Geral';
  return additionalRoles.length > 0
    ? `${base} + ${additionalRoles.length} papel(éis) adicional(ais)`
    : base;
}

// ----------------------------------------------------------------
// Provider
// ----------------------------------------------------------------

// ---- Rate Limiting — Brute Force Protection (Prompt 177 ETAPA 6) ----
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30_000; // 30 segundos
interface LoginAttempts { count: number; lockedUntil: number | null; }
// Mapa de tentativas por e-mail (module-scoped, persiste na memória da sessão)
const loginAttemptsMap: Record<string, LoginAttempts> = {};

function getAttempts(email: string): LoginAttempts {
  return loginAttemptsMap[email] ?? { count: 0, lockedUntil: null };
}
function recordFailure(email: string): LoginAttempts {
  const prev = getAttempts(email);
  const count = prev.count + 1;
  // Progressivo: 30s * 2^(tentativas extras)
  const lockoutMs = count >= MAX_ATTEMPTS
    ? BASE_LOCKOUT_MS * Math.pow(2, Math.max(0, count - MAX_ATTEMPTS))
    : null;
  const updated: LoginAttempts = {
    count,
    lockedUntil: lockoutMs ? Date.now() + lockoutMs : null,
  };
  loginAttemptsMap[email] = updated;
  return updated;
}
function resetAttempts(email: string) {
  delete loginAttemptsMap[email];
}

export function IAMProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<IAMUser | null>(loadUserFromStorage);
  const [users, setUsers] = useState<IAMUser[]>(MOCK_IAM_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [aiSuggestions, setAiSuggestions] = useState<AISecuritySuggestion[]>(MOCK_AI_SUGGESTIONS);
  const [activeSessions, setActiveSessions] = useState<IAMSession[]>(MOCK_SESSIONS);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>(MOCK_TRUSTED_DEVICES);
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'sms' | 'email' | undefined>();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const isAuthenticated = !!currentUser;

  // ---- Adiciona log de auditoria ----
  const addAuditLog = useCallback((log: AuditLog) => {
    setAuditLogs(prev => [log, ...prev]);
  }, []);

  // ---- Login com Rate Limiting e Proteção Força Bruta (Prompt 177 ETAPA 6) ----
  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const lowerEmail = email.toLowerCase().trim();

      // ── Rate Limiting: verifica bloqueio temporário ──────────────
      const attempts = getAttempts(lowerEmail);
      if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
        const remainingSec = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
        addAuditLog(generateAuditLog(null, 'login_failure', {
          details: { email: lowerEmail, reason: 'rate_limited', remainingSec },
          severity: 'critical',
        }));
        return {
          success: false,
          error: `Conta temporariamente bloqueada por segurança. Aguarde ${remainingSec}s antes de tentar novamente.`,
          lockedUntil: attempts.lockedUntil,
        };
      }

      await new Promise(r => setTimeout(r, 900)); // simula latência de rede

      const superAdminSec = getInitialSuperAdminConfig();

      let found = users.find(u => u.id === 'usr-001' || u.email.toLowerCase() === lowerEmail);

      // Verificação específica do Super Administrador com credenciais seguras (Prompt 177)
      if (superAdminSec.email && lowerEmail === superAdminSec.email.toLowerCase()) {
        const isPassValid = await verifyPasswordHash(password, superAdminSec.initialPass);
        if (!isPassValid) {
          const att = recordFailure(lowerEmail);
          addAuditLog(generateAuditLog(null, 'login_failure', {
            details: { email: lowerEmail, reason: 'invalid_credentials', attempt: att.count },
            severity: att.count >= MAX_ATTEMPTS ? 'critical' : 'warning',
          }));
          const attLeft = Math.max(0, MAX_ATTEMPTS - att.count);
          const lockMsg = att.lockedUntil
            ? ` Conta bloqueada por ${Math.ceil((att.lockedUntil - Date.now()) / 1000)}s.`
            : attLeft > 0 ? ` ${attLeft} tentativa(s) restante(s) antes do bloqueio.` : '';
          return { success: false, error: `E-mail ou senha incorretos.${lockMsg}` };
        }

        if (!found) {
          found = users.find(u => u.id === 'usr-001');
        }

        if (found) {
          found = {
            ...found,
            email: superAdminSec.email,
            mustChangePassword: superAdminSec.mustChangePassword,
          };
        }
      } else {
        const cred = USER_CREDENTIALS[lowerEmail];
        if (!cred || cred.password !== password) {
          const att = recordFailure(lowerEmail);
          addAuditLog(generateAuditLog(null, 'login_failure', {
            details: { email: lowerEmail, reason: 'invalid_credentials', attempt: att.count },
            severity: att.count >= MAX_ATTEMPTS ? 'critical' : 'warning',
          }));
          const attLeft = Math.max(0, MAX_ATTEMPTS - att.count);
          const lockMsg = att.lockedUntil
            ? ` Conta bloqueada por ${Math.ceil((att.lockedUntil - Date.now()) / 1000)}s.`
            : attLeft > 0 ? ` ${attLeft} tentativa(s) restante(s) antes do bloqueio.` : '';
          return { success: false, error: `E-mail ou senha incorretos.${lockMsg}` };
        }
        found = users.find(u => u.id === cred.userId);
      }

      if (!found) {
        return { success: false, error: 'Usuário não encontrado na base de dados.' };
      }
      if (found.status !== 'active') {
        addAuditLog(generateAuditLog(found, 'login_failure', {
          details: { reason: `account_${found.status}` },
          severity: 'warning',
        }));
        const msgs: Record<string, string> = {
          suspended: 'Conta suspensa. Contate o administrador.',
          blocked: 'Conta bloqueada. Contate o administrador.',
          inactive: 'Conta inativa. Contate o administrador.',
        };
        return { success: false, error: msgs[found.status] ?? 'Acesso negado.' };
      }

      // ── Login bem-sucedido: reset contador de tentativas ─────────
      resetAttempts(lowerEmail);

      const updatedUser = {
        ...found,
        lastLogin: new Date().toISOString(),
        lastLoginIp: '127.0.0.1',
        lastLoginDevice: navigator.userAgent.includes('Mobile') ? 'Dispositivo Móvel' : 'Navegador',
      };
      setCurrentUser(updatedUser);
      persistUser(updatedUser);

      addAuditLog(generateAuditLog(updatedUser, 'login_success', {
        details: {
          mfaEnabled: found.mfaEnabled,
          mustChangePassword: updatedUser.mustChangePassword,
          userAgent: navigator.userAgent,
        },
        severity: 'info',
      }));

      return {
        success: true,
        requiresMfa: false,
        requiresPasswordChange: updatedUser.mustChangePassword ?? false,
        redirectPath: getRedirectPathForUser(updatedUser),
      };
    },
    [users, addAuditLog]
  );

  // ---- MFA — stubs para futura implementação com backend real ----
  const requestMfa = useCallback(
    async (_method: 'totp' | 'sms' | 'email'): Promise<boolean> => {
      await new Promise(r => setTimeout(r, 500));
      return true;
    },
    []
  );

  const verifyMfa = useCallback(
    async (_code: string): Promise<boolean> => {
      await new Promise(r => setTimeout(r, 700));
      return true;
    },
    []
  );

  // ---- Logout ----
  const logout = useCallback(() => {
    if (currentUser) {
      addAuditLog(generateAuditLog(currentUser, 'logout', {
        details: { sessionDuration: 'calculado em produção' },
        severity: 'info',
      }));
    }
    setCurrentUser(null);
    persistUser(null);
    setMfaPending(false);
    setPendingUserId(null);
  }, [currentUser, addAuditLog]);

  // ---- Autorização ----
  const hasPermission = useCallback(
    (module: PlatformModule, action: PermissionAction): boolean => {
      if (!currentUser) return false;
      const roles = Array.isArray(currentUser.roles) ? currentUser.roles : [currentUser.primaryRole];
      if (roles.includes('super_user_universal')) return true;
      const perms = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];
      return perms.some(
        p => p && p.module === module && p.action === action
      );
    },
    [currentUser]
  );

  const hasRole = useCallback(
    (role: InstitutionalRole): boolean => {
      if (!currentUser) return false;
      const roles = Array.isArray(currentUser.roles) ? currentUser.roles : [currentUser.primaryRole];
      if (roles.includes('super_user_universal')) return true;
      return roles.includes(role);
    },
    [currentUser]
  );

  function getRedirectPathForUser(user: IAMUser): string {
    const roles = Array.isArray(user?.roles) ? user.roles : (user?.primaryRole ? [user.primaryRole] : []);
    if (roles.includes('super_user_universal')) return ROLE_REDIRECT_MAP.super_user_universal;
    if (roles.includes('super_admin')) return '/painel-supremo';
    if (roles.includes('auditor')) return ROLE_REDIRECT_MAP.auditor;
    if (roles.includes('director') || roles.includes('president'))
      return ROLE_REDIRECT_MAP.director;
    if (roles.includes('manager')) return ROLE_REDIRECT_MAP.manager;
    if (roles.includes('coordinator')) return ROLE_REDIRECT_MAP.coordinator;
    if (roles.includes('volunteer_professional') || roles.includes('professional'))
      return ROLE_REDIRECT_MAP.professional;
    if (roles.includes('admin_collaborator')) return ROLE_REDIRECT_MAP.admin_collaborator;
    if (roles.includes('admin_volunteer')) return ROLE_REDIRECT_MAP.admin_volunteer;
    if (roles.includes('legal_guardian')) return ROLE_REDIRECT_MAP.legal_guardian;
    if (roles.includes('beneficiary')) return ROLE_REDIRECT_MAP.beneficiary;
    return '/dashboard';
  }

  const getRedirectPath = useCallback((): string => {
    if (!currentUser) return '/login';
    return getRedirectPathForUser(currentUser);
  }, [currentUser]);

  // ---- Gerenciamento de usuários (Super Admin) ----

  const createUser = useCallback(async (data: Partial<IAMUser>): Promise<IAMUser> => {
    await new Promise(r => setTimeout(r, 600));
    const newUser: IAMUser = {
      id: generateId('usr'),
      email: data.email ?? '',
      name: data.name ?? '',
      initials: (data.name ?? 'US').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
      roles: data.roles ?? ['admin_collaborator'],
      primaryRole: data.primaryRole ?? data.roles?.[0] ?? 'admin_collaborator',
      permissions: data.permissions ?? [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mfaEnabled: false,
      ...data,
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog(generateAuditLog(currentUser, 'user_created', {
      resourceId: newUser.id,
      resourceType: 'user',
      details: { newUser: newUser.name, role: newUser.primaryRole },
      severity: 'info',
    }));
    return newUser;
  }, [currentUser, addAuditLog]);

  const updateUser = useCallback(async (id: string, data: Partial<IAMUser>): Promise<IAMUser> => {
    await new Promise(r => setTimeout(r, 400));
    let updated!: IAMUser;
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== id) return u;
        updated = { ...u, ...data, updatedAt: new Date().toISOString() };
        return updated;
      })
    );
    addAuditLog(generateAuditLog(currentUser, 'profile_change', {
      resourceId: id,
      resourceType: 'user',
      details: { changes: Object.keys(data) },
      severity: 'warning',
    }));
    if (currentUser?.id === id) {
      setCurrentUser(updated);
      persistUser(updated);
    }
    return updated;
  }, [currentUser, addAuditLog]);

  const blockUser = useCallback(async (id: string, reason: string): Promise<void> => {
    await updateUser(id, { status: 'blocked', statusReason: reason });
    addAuditLog(generateAuditLog(currentUser, 'user_blocked', {
      resourceId: id,
      resourceType: 'user',
      details: { reason },
      severity: 'critical',
    }));
  }, [updateUser, currentUser, addAuditLog]);

  const suspendUser = useCallback(async (id: string, reason: string): Promise<void> => {
    await updateUser(id, { status: 'suspended', statusReason: reason });
    addAuditLog(generateAuditLog(currentUser, 'user_suspended' as AuditEventType, {
      resourceId: id,
      details: { reason },
      severity: 'warning',
    }));
  }, [updateUser, currentUser, addAuditLog]);

  const reactivateUser = useCallback(async (id: string): Promise<void> => {
    await updateUser(id, { status: 'active', statusReason: undefined });
    addAuditLog(generateAuditLog(currentUser, 'user_reactivated', {
      resourceId: id,
      details: {},
      severity: 'info',
    }));
  }, [updateUser, currentUser, addAuditLog]);

  const resetPassword = useCallback(async (id: string): Promise<void> => {
    await new Promise(r => setTimeout(r, 400));
    addAuditLog(generateAuditLog(currentUser, 'password_reset', {
      resourceId: id,
      details: { initiatedBy: currentUser?.id },
      severity: 'warning',
    }));
  }, [currentUser, addAuditLog]);

  const addRole = useCallback(async (userId: string, role: InstitutionalRole): Promise<void> => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== userId || u.roles.includes(role)) return u;
        return { ...u, roles: [...u.roles, role], updatedAt: new Date().toISOString() };
      })
    );
    addAuditLog(generateAuditLog(currentUser, 'role_added', {
      resourceId: userId,
      details: { role },
      severity: 'warning',
    }));
  }, [currentUser, addAuditLog]);

  const removeRole = useCallback(async (userId: string, role: InstitutionalRole): Promise<void> => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== userId) return u;
        return {
          ...u,
          roles: u.roles.filter(r => r !== role),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    addAuditLog(generateAuditLog(currentUser, 'role_removed', {
      resourceId: userId,
      details: { role },
      severity: 'warning',
    }));
  }, [currentUser, addAuditLog]);

  // ---- Sugestões de IA ----

  const approveAISuggestion = useCallback(async (id: string, notes?: string): Promise<void> => {
    setAiSuggestions(prev =>
      prev.map(s =>
        s.id !== id
          ? s
          : {
              ...s,
              status: 'approved',
              reviewedBy: currentUser?.name,
              reviewedAt: new Date().toISOString(),
              reviewNotes: notes,
            }
      )
    );
    addAuditLog(generateAuditLog(currentUser, 'ai_suggestion_approved', {
      resourceId: id,
      details: { notes },
      severity: 'warning',
    }));
  }, [currentUser, addAuditLog]);

  const rejectAISuggestion = useCallback(async (id: string, notes?: string): Promise<void> => {
    setAiSuggestions(prev =>
      prev.map(s =>
        s.id !== id
          ? s
          : {
              ...s,
              status: 'rejected',
              reviewedBy: currentUser?.name,
              reviewedAt: new Date().toISOString(),
              reviewNotes: notes,
            }
      )
    );
    addAuditLog(generateAuditLog(currentUser, 'ai_suggestion_rejected', {
      resourceId: id,
      details: { notes },
      severity: 'info',
    }));
  }, [currentUser, addAuditLog]);

  // ---- Sessões ----

  const revokeSession = useCallback(async (sessionId: string): Promise<void> => {
    setActiveSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, status: 'revoked' as const } : s))
    );
    addAuditLog(generateAuditLog(currentUser, 'session_revoked', {
      resourceId: sessionId,
      details: {},
      severity: 'warning',
    }));
  }, [currentUser, addAuditLog]);

  // ---- Dispositivos ----

  const revokeDevice = useCallback(async (deviceId: string): Promise<void> => {
    setTrustedDevices(prev =>
      prev.map(d => (d.id === deviceId ? { ...d, status: 'revoked' as const } : d))
    );
    addAuditLog(generateAuditLog(currentUser, 'device_revoked', {
      resourceId: deviceId,
      details: {},
      severity: 'warning',
    }));
  }, [currentUser, addAuditLog]);

  // ---- Solicitar / Remover MFA (Super Admin) ----

  const requestMfaForUser = useCallback(async (userId: string): Promise<void> => {
    setUsers(prev =>
      prev.map(u =>
        u.id !== userId ? u : { ...u, mfaRequired: true, updatedAt: new Date().toISOString() }
      )
    );
    addAuditLog(generateAuditLog(currentUser, 'permission_change', {
      resourceId: userId,
      details: { action: 'mfa_requested', requestedBy: currentUser?.name },
      severity: 'warning',
    }));
  }, [currentUser, addAuditLog]);

  const disableMfaForUser = useCallback(async (userId: string): Promise<void> => {
    setUsers(prev =>
      prev.map(u =>
        u.id !== userId
          ? u
          : { ...u, mfaRequired: false, mfaEnabled: false, mfaMethod: undefined, updatedAt: new Date().toISOString() }
      )
    );
    addAuditLog(generateAuditLog(currentUser, 'permission_change', {
      resourceId: userId,
      details: { action: 'mfa_disabled', disabledBy: currentUser?.name },
      severity: 'warning',
    }));
  }, [currentUser, addAuditLog]);

  const [impersonationState, setImpersonationState] = useState<ImpersonationState | null>(null);

  const startImpersonation = useCallback(async (targetUserId: string, reason: string): Promise<boolean> => {
    if (!currentUser) return false;
    const roles = Array.isArray(currentUser.roles) ? currentUser.roles : [currentUser.primaryRole];
    const isSuperUser = roles.includes('super_user_universal');
    if (!isSuperUser) return false;

    const target = users.find(u => u.id === targetUserId);
    if (!target) return false;

    const state: ImpersonationState = {
      isImpersonating: true,
      adminUser: currentUser,
      targetUser: target,
      reason,
      token: `imp_${Date.now()}`,
    };

    setImpersonationState(state);
    setCurrentUser(target);

    addAuditLog(generateAuditLog(currentUser, 'impersonation_started', {
      eventType: 'impersonation_started',
      details: {
        action: 'IMPERSONATION_STARTED',
        targetUserId: target.id,
        targetUserEmail: target.email,
        reason,
      },
      severity: 'warning',
    }));

    return true;
  }, [currentUser, users, addAuditLog]);

  const stopImpersonation = useCallback(async (): Promise<void> => {
    if (!impersonationState?.adminUser) return;
    const admin = impersonationState.adminUser;

    setCurrentUser(admin);
    setImpersonationState(null);

    addAuditLog(generateAuditLog(admin, 'impersonation_ended', {
      eventType: 'impersonation_ended',
      details: {
        action: 'IMPERSONATION_ENDED',
      },
      severity: 'info',
    }));
  }, [impersonationState, addAuditLog]);

  // ----------------------------------------------------------------

  const value: IAMContextType = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    requestMfa,
    verifyMfa,
    hasPermission,
    hasRole,
    getRedirectPath,
    users,
    createUser,
    updateUser,
    blockUser,
    suspendUser,
    reactivateUser,
    resetPassword,
    requestMfaForUser,
    disableMfaForUser,
    addRole,
    removeRole,
    auditLogs,
    aiSuggestions,
    approveAISuggestion,
    rejectAISuggestion,
    activeSessions,
    revokeSession,
    trustedDevices,
    revokeDevice,
    impersonationState,
    startImpersonation,
    stopImpersonation,
    mfaPending,
    mfaMethod,
  };

  return <IAMContext.Provider value={value}>{children}</IAMContext.Provider>;
}

// ----------------------------------------------------------------
// Hook
// ----------------------------------------------------------------

export function useIAM(): IAMContextType {
  const ctx = useContext(IAMContext);
  if (!ctx) throw new Error('useIAM deve ser usado dentro de <IAMProvider>');
  return ctx;
}
