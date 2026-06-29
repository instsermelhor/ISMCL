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
    if (raw) return JSON.parse(raw) as IAMUser;
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
  const additionalRoles = user.roles.filter(r => r !== user.primaryRole);
  const base = labels[user.primaryRole] ?? user.primaryRole;
  return additionalRoles.length > 0
    ? `${base} + ${additionalRoles.length} papel(éis) adicional(ais)`
    : base;
}

// ----------------------------------------------------------------
// Provider
// ----------------------------------------------------------------

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

  // ---- Login ----
  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      await new Promise(r => setTimeout(r, 900)); // simula latência

      const lowerEmail = email.toLowerCase().trim();
      const cred = USER_CREDENTIALS[lowerEmail];

      if (!cred || cred.password !== password) {
        addAuditLog(generateAuditLog(null, 'login_failure', {
          details: { email: lowerEmail, reason: 'invalid_credentials' },
          severity: 'warning',
        }));
        return { success: false, error: 'E-mail ou senha incorretos.' };
      }

      const found = users.find(u => u.id === cred.userId);
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

      // Verificar se MFA é obrigatório
      if (found.mfaEnabled) {
        setPendingUserId(found.id);
        setMfaPending(true);
        setMfaMethod(found.mfaMethod ?? 'totp');
        return {
          success: true,
          requiresMfa: true,
          mfaMethod: found.mfaMethod ?? 'totp',
        };
      }

      // Login direto sem MFA
      const updatedUser = {
        ...found,
        lastLogin: new Date().toISOString(),
        lastLoginIp: '127.0.0.1',
        lastLoginDevice: 'Navegador',
      };
      setCurrentUser(updatedUser);
      persistUser(updatedUser);

      addAuditLog(generateAuditLog(updatedUser, 'login_success', {
        details: { mfaUsed: false },
        severity: 'info',
      }));

      return {
        success: true,
        requiresMfa: false,
        redirectPath: getRedirectPathForUser(updatedUser),
      };
    },
    [users, addAuditLog]
  );

  // ---- MFA ----
  const requestMfa = useCallback(
    async (_method: 'totp' | 'sms' | 'email'): Promise<boolean> => {
      // Em produção: enviar código por SMS/email ou gerar TOTP
      await new Promise(r => setTimeout(r, 500));
      return true;
    },
    []
  );

  const verifyMfa = useCallback(
    async (code: string): Promise<boolean> => {
      await new Promise(r => setTimeout(r, 700));

      // Em produção: validar código real
      // Para demo: qualquer código de 6 dígitos ou "123456" é válido
      const isValid = code === '123456' || /^\d{6}$/.test(code);

      if (!isValid || !pendingUserId) {
        addAuditLog(generateAuditLog(currentUser, 'mfa_failure', {
          details: { reason: 'invalid_code' },
          severity: 'warning',
        }));
        return false;
      }

      const found = users.find(u => u.id === pendingUserId);
      if (!found) return false;

      const updatedUser = {
        ...found,
        lastLogin: new Date().toISOString(),
        lastLoginIp: '127.0.0.1',
        lastLoginDevice: 'Navegador',
      };

      setCurrentUser(updatedUser);
      persistUser(updatedUser);
      setMfaPending(false);
      setPendingUserId(null);

      addAuditLog(generateAuditLog(updatedUser, 'mfa_success', {
        details: { method: mfaMethod },
        severity: 'info',
      }));
      addAuditLog(generateAuditLog(updatedUser, 'login_success', {
        details: { mfaUsed: true },
        severity: 'info',
      }));

      return true;
    },
    [pendingUserId, users, currentUser, mfaMethod, addAuditLog]
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
      return currentUser.permissions.some(
        p => p.module === module && p.action === action
      );
    },
    [currentUser]
  );

  const hasRole = useCallback(
    (role: InstitutionalRole): boolean => {
      if (!currentUser) return false;
      return currentUser.roles.includes(role);
    },
    [currentUser]
  );

  function getRedirectPathForUser(user: IAMUser): string {
    // Super admin e auditor têm prioridade
    if (user.roles.includes('super_admin')) return ROLE_REDIRECT_MAP.super_admin;
    if (user.roles.includes('auditor')) return ROLE_REDIRECT_MAP.auditor;
    if (user.roles.includes('director') || user.roles.includes('president'))
      return ROLE_REDIRECT_MAP.director;
    if (user.roles.includes('manager')) return ROLE_REDIRECT_MAP.manager;
    if (user.roles.includes('coordinator')) return ROLE_REDIRECT_MAP.coordinator;
    if (user.roles.includes('volunteer_professional') || user.roles.includes('professional'))
      return ROLE_REDIRECT_MAP.professional;
    if (user.roles.includes('admin_collaborator')) return ROLE_REDIRECT_MAP.admin_collaborator;
    if (user.roles.includes('admin_volunteer')) return ROLE_REDIRECT_MAP.admin_volunteer;
    if (user.roles.includes('legal_guardian')) return ROLE_REDIRECT_MAP.legal_guardian;
    if (user.roles.includes('beneficiary')) return ROLE_REDIRECT_MAP.beneficiary;
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
