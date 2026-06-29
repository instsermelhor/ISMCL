// ============================================================
// IAM — Identity & Access Management — Type Definitions
// Instituto Ser Melhor — Plataforma Integrada
// ============================================================

// ------ PERFIS INSTITUCIONAIS --------------------------------

export type InstitutionalRole =
  | 'beneficiary'         // Beneficiário
  | 'legal_guardian'      // Responsável Legal
  | 'professional'        // Profissional Clínico
  | 'volunteer_professional' // Profissional Voluntário
  | 'admin_volunteer'     // Voluntário Administrativo
  | 'admin_collaborator'  // Colaborador Administrativo
  | 'coordinator'         // Coordenador
  | 'manager'             // Gestor
  | 'director'            // Diretor
  | 'president'           // Presidente
  | 'super_admin'         // Super Administrador
  | 'auditor';            // Auditor

// ------ MÓDULOS / RECURSOS DA PLATAFORMA ---------------------

export type PlatformModule =
  | 'dashboard'
  | 'beneficiaries'
  | 'professionals'
  | 'calendar'
  | 'records'
  | 'messages'
  | 'financial'
  | 'cgi'
  | 'mcsi'
  | 'iam'
  | 'telehealth'
  | 'beneficiary_portal'
  | 'professional_portal'
  | 'audit_panel'
  | 'admin_center'
  | 'settings'
  | 'reports'
  | 'notifications'
  | 'integrations';

// ------ AÇÕES / OPERAÇÕES ------------------------------------

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'export'
  | 'import'
  | 'sign'
  | 'share'
  | 'delegate'
  | 'administer'
  | 'audit';

// ------ PERMISSÃO GRANULAR (RBAC + ABAC) ---------------------

export interface Permission {
  id: string;
  module: PlatformModule;
  action: PermissionAction;
  label: string;
  description?: string;
  // ABAC attributes
  requiresMfa?: boolean;
  timeRestriction?: { start: string; end: string }; // HH:MM
  ipRestriction?: string[];
  dataScope?: 'own' | 'team' | 'unit' | 'all';
}

export interface RolePermissions {
  role: InstitutionalRole;
  label: string;
  permissions: Permission[];
  inheritFrom?: InstitutionalRole[]; // herança de permissões
}

// ------ USUÁRIO IAM ------------------------------------------

export interface IAMUser {
  id: string;
  email: string;
  name: string;
  cpf?: string;
  phone?: string;
  avatar?: string;
  initials: string;

  // Perfis e papéis (múltiplos)
  roles: InstitutionalRole[];
  primaryRole: InstitutionalRole;
  permissions: Permission[];

  // Status
  status: 'active' | 'inactive' | 'suspended' | 'blocked' | 'pending';
  statusReason?: string;

  // Metadados
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;

  // MFA — mfaRequired: solicitado pelo Super Admin no cadastro
  //          mfaEnabled: habilitado pelo próprio usuário após solicitação
  mfaEnabled: boolean;
  mfaRequired: boolean;   // Super Admin solicita ativação no próximo login
  mfaMethod?: 'totp' | 'sms' | 'email';

  // Sessão
  sessionTimeout?: number; // minutos
  allowMultipleSessions?: boolean;

  // Voluntário clínico adicional
  volunteerData?: VolunteerData;

  // Menor de idade
  isMinor?: boolean;
  legalGuardians?: LegalGuardianRef[];

  // Configurações pessoais
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;

  // Contexto adicional
  unit?: string;           // unidade/filial
  department?: string;     // departamento
  specialty?: string;      // especialidade (profissionais)
  crp?: string;
  crm?: string;
  cress?: string;
  registrationNumber?: string;
}

// ------ DADOS VOLUNTARIADO -----------------------------------

export interface VolunteerData {
  startDate: string;
  area?: string;
  hoursPerWeek?: number;
  totalHours?: number;
  projects?: string[];
  certificates?: VolunteerCertificate[];
  declarations?: string[];
  schedule?: Record<string, string[]>; // dia -> horários
  status: 'active' | 'inactive' | 'on_leave';
}

export interface VolunteerCertificate {
  id: string;
  title: string;
  hours: number;
  period: string;
  issuedAt: string;
  signedBy: string;
}

// ------ RESPONSÁVEL LEGAL ------------------------------------

export interface LegalGuardianRef {
  id: string;
  name: string;
  relationship: 'mother' | 'father' | 'tutor' | 'guardian' | 'judicial_rep' | 'child_council' | 'other';
  cpf?: string;
  phone?: string;
  authorizations: {
    attendance: boolean;
    teleconsultation: boolean;
    documentIssuance: boolean;
  };
  guardianshipStatus?: string;
  judicialDecision?: string;
  documentPath?: string;
}

// ------ SESSÃO -----------------------------------------------

export interface IAMSession {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  deviceName?: string;
  isTrusted: boolean;
  mfaVerified: boolean;
  status: 'active' | 'expired' | 'revoked';
}

// ------ DISPOSITIVO CONFIÁVEL --------------------------------

export interface TrustedDevice {
  id: string;
  userId: string;
  name: string;
  fingerprint: string;
  addedAt: string;
  lastSeen: string;
  status: 'trusted' | 'revoked';
  browser?: string;
  os?: string;
}

// ------ LOG DE AUDITORIA -------------------------------------

export type AuditEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'mfa_success'
  | 'mfa_failure'
  | 'password_change'
  | 'password_reset'
  | 'profile_change'
  | 'permission_change'
  | 'role_added'
  | 'role_removed'
  | 'user_created'
  | 'user_blocked'
  | 'user_suspended'
  | 'user_reactivated'
  | 'device_trusted'
  | 'device_revoked'
  | 'session_revoked'
  | 'exceptional_access'
  | 'delegation_created'
  | 'delegation_revoked'
  | 'module_accessed'
  | 'data_exported'
  | 'data_imported'
  | 'config_changed'
  | 'ai_suggestion_approved'
  | 'ai_suggestion_rejected';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: InstitutionalRole;
  eventType: AuditEventType;
  module?: PlatformModule;
  action?: PermissionAction;
  resourceId?: string;
  resourceType?: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  details: Record<string, unknown>;
  severity: 'info' | 'warning' | 'critical';
  hash?: string; // assinatura digital do log (imutabilidade)
}

// ------ DELEGAÇÃO DE ACESSO ----------------------------------

export interface AccessDelegation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  permissions: Permission[];
  reason: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'expired' | 'revoked';
  approvedBy?: string;
  createdAt: string;
}

// ------ SUGESTÃO DE IA ---------------------------------------

export interface AISecuritySuggestion {
  id: string;
  type:
    | 'inactive_account'
    | 'excess_privileges'
    | 'incompatible_access'
    | 'anomalous_behavior'
    | 'permission_review'
    | 'preventive_block';
  userId: string;
  userName: string;
  description: string;
  suggestedAction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// ------ GRUPO DE ACESSO --------------------------------------

export interface AccessGroup {
  id: string;
  name: string;
  description?: string;
  roles: InstitutionalRole[];
  permissions: Permission[];
  members: string[]; // userIds
  createdBy: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

// ------ CONTEXTO IAM -----------------------------------------

export interface IAMContextType {
  // Usuário atual
  currentUser: IAMUser | null;
  isAuthenticated: boolean;

  // Autenticação
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  requestMfa: (method: 'totp' | 'sms' | 'email') => Promise<boolean>;
  verifyMfa: (code: string) => Promise<boolean>;

  // Autorização
  hasPermission: (module: PlatformModule, action: PermissionAction) => boolean;
  hasRole: (role: InstitutionalRole) => boolean;
  getRedirectPath: () => string;

  // Usuários (admin)
  users: IAMUser[];
  createUser: (data: Partial<IAMUser>) => Promise<IAMUser>;
  updateUser: (id: string, data: Partial<IAMUser>) => Promise<IAMUser>;
  blockUser: (id: string, reason: string) => Promise<void>;
  suspendUser: (id: string, reason: string) => Promise<void>;
  reactivateUser: (id: string) => Promise<void>;
  resetPassword: (id: string) => Promise<void>;
  requestMfaForUser: (id: string) => Promise<void>;  // Super Admin solicita MFA
  disableMfaForUser: (id: string) => Promise<void>;  // Super Admin remove solicitação
  addRole: (userId: string, role: InstitutionalRole) => Promise<void>;
  removeRole: (userId: string, role: InstitutionalRole) => Promise<void>;

  // Auditoria
  auditLogs: AuditLog[];
  aiSuggestions: AISecuritySuggestion[];
  approveAISuggestion: (id: string, notes?: string) => Promise<void>;
  rejectAISuggestion: (id: string, notes?: string) => Promise<void>;

  // Sessões
  activeSessions: IAMSession[];
  revokeSession: (sessionId: string) => Promise<void>;

  // Dispositivos
  trustedDevices: TrustedDevice[];
  revokeDevice: (deviceId: string) => Promise<void>;

  // MFA em andamento
  mfaPending: boolean;
  mfaMethod?: 'totp' | 'sms' | 'email';
}

export interface LoginResult {
  success: boolean;
  requiresMfa?: boolean;
  mfaMethod?: 'totp' | 'sms' | 'email';
  redirectPath?: string;
  error?: string;
}

// ------ MAPA DE REDIRECIONAMENTO -----------------------------

export const ROLE_REDIRECT_MAP: Record<InstitutionalRole, string> = {
  beneficiary: '/portal-beneficiario',
  legal_guardian: '/area-familia',
  professional: '/portal-profissional',
  volunteer_professional: '/portal-profissional',
  admin_volunteer: '/portal-voluntario',
  admin_collaborator: '/erp-social',
  coordinator: '/dashboard',
  manager: '/dashboard-gerencial',
  director: '/dashboard-executivo',
  president: '/dashboard-executivo',
  super_admin: '/central-admin',
  auditor: '/painel-auditoria',
};

export const ROLE_LABELS: Record<InstitutionalRole, string> = {
  beneficiary: 'Beneficiário',
  legal_guardian: 'Responsável Legal',
  professional: 'Profissional Clínico',
  volunteer_professional: 'Profissional Voluntário',
  admin_volunteer: 'Voluntário Administrativo',
  admin_collaborator: 'Colaborador Administrativo',
  coordinator: 'Coordenador',
  manager: 'Gestor',
  director: 'Diretor',
  president: 'Presidente',
  super_admin: 'Super Administrador',
  auditor: 'Auditor',
};

export const ROLE_COLORS: Record<InstitutionalRole, { bg: string; text: string; border: string }> = {
  beneficiary:           { bg: 'bg-sky-100',    text: 'text-sky-700',    border: 'border-sky-200' },
  legal_guardian:        { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  professional:          { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-200' },
  volunteer_professional:{ bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200' },
  admin_volunteer:       { bg: 'bg-lime-100',   text: 'text-lime-700',   border: 'border-lime-200' },
  admin_collaborator:    { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200' },
  coordinator:           { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  manager:               { bg: 'bg-rose-100',   text: 'text-rose-700',   border: 'border-rose-200' },
  director:              { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  president:             { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  super_admin:           { bg: 'bg-slate-800',  text: 'text-white',      border: 'border-slate-700' },
  auditor:               { bg: 'bg-zinc-100',   text: 'text-zinc-700',   border: 'border-zinc-200' },
};
