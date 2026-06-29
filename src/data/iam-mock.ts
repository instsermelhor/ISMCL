// ============================================================
// IAM — Mock Data Store
// Instituto Ser Melhor — Plataforma Integrada
// ============================================================

import type {
  IAMUser,
  Permission,
  AuditLog,
  AISecuritySuggestion,
  IAMSession,
  TrustedDevice,
  InstitutionalRole,
} from '../types/iam';

// ------ PERMISSÕES BASE POR PERFIL ---------------------------

export function buildPermissions(roles: InstitutionalRole[]): Permission[] {
  const perms: Permission[] = [];

  const addPerm = (
    module: Permission['module'],
    action: Permission['action'],
    extra?: Partial<Permission>
  ) => {
    perms.push({
      id: `${module}:${action}`,
      module,
      action,
      label: `${action} em ${module}`,
      ...extra,
    });
  };

  for (const role of roles) {
    switch (role) {
      case 'super_admin':
        (['dashboard','beneficiaries','professionals','calendar','records',
          'messages','financial','cgi','mcsi','iam','telehealth',
          'beneficiary_portal','professional_portal','audit_panel',
          'admin_center','settings','reports','notifications','integrations'] as Permission['module'][])
          .forEach(m =>
            (['view','create','edit','delete','export','import','sign','share','delegate','administer','audit'] as Permission['action'][])
              .forEach(a => addPerm(m, a))
          );
        break;
      case 'auditor':
        (['dashboard','audit_panel','reports','iam','mcsi','cgi'] as Permission['module'][])
          .forEach(m => (['view','audit','export'] as Permission['action'][]).forEach(a => addPerm(m, a)));
        break;
      case 'director':
      case 'president':
        (['dashboard','beneficiaries','professionals','calendar','records',
          'financial','cgi','reports','notifications','settings'] as Permission['module'][])
          .forEach(m => (['view','export','audit'] as Permission['action'][]).forEach(a => addPerm(m, a)));
        addPerm('iam', 'view');
        break;
      case 'manager':
        (['dashboard','beneficiaries','professionals','calendar','records',
          'messages','financial','cgi','reports','notifications'] as Permission['module'][])
          .forEach(m => (['view','create','edit','export'] as Permission['action'][]).forEach(a => addPerm(m, a)));
        break;
      case 'coordinator':
        (['dashboard','beneficiaries','professionals','calendar','records',
          'messages','notifications','reports'] as Permission['module'][])
          .forEach(m => (['view','create','edit'] as Permission['action'][]).forEach(a => addPerm(m, a)));
        break;
      case 'professional':
      case 'volunteer_professional':
        (['records','calendar','messages','telehealth','professional_portal',
          'beneficiaries'] as Permission['module'][])
          .forEach(m => (['view','create','edit','sign'] as Permission['action'][]).forEach(a => addPerm(m, a)));
        break;
      case 'admin_collaborator':
      case 'admin_volunteer':
        (['dashboard','beneficiaries','calendar','messages','notifications'] as Permission['module'][])
          .forEach(m => (['view','create','edit'] as Permission['action'][]).forEach(a => addPerm(m, a)));
        break;
      case 'beneficiary':
        (['beneficiary_portal','telehealth','calendar','messages'] as Permission['module'][])
          .forEach(m => (['view'] as Permission['action'][]).forEach(a => addPerm(m, a)));
        break;
      case 'legal_guardian':
        (['beneficiary_portal','calendar','messages'] as Permission['module'][])
          .forEach(m => (['view'] as Permission['action'][]).forEach(a => addPerm(m, a)));
        break;
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return perms.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

// ------ USUÁRIOS MOCK ----------------------------------------

export const MOCK_IAM_USERS: IAMUser[] = [
  {
    id: 'usr-001',
    email: 'ism@ism.org',
    name: 'Carlos Alberto Mendes',
    cpf: '000.000.000-00',
    phone: '+55 11 99999-0000',
    initials: 'CA',
    roles: ['super_admin'],
    primaryRole: 'super_admin',
    permissions: buildPermissions(['super_admin']),
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-15T08:30:00Z',
    lastLogin: '2026-06-29T14:00:00Z',
    lastLoginIp: '192.168.1.1',
    lastLoginDevice: 'MacBook Pro',
    mfaEnabled: false,
    mfaRequired: false,
    mfaMethod: undefined,
    sessionTimeout: 120,
    allowMultipleSessions: true,
    theme: 'dark',
    unit: 'Matriz',
    department: 'Tecnologia',
  },
  {
    id: 'usr-002',
    email: 'voluntario@institutosermelhor.org',
    name: 'Dra. Roberta Santos',
    cpf: '111.111.111-11',
    phone: '+55 11 98888-1111',
    initials: 'RS',
    roles: ['professional', 'volunteer_professional'],
    primaryRole: 'volunteer_professional',
    permissions: buildPermissions(['professional', 'volunteer_professional']),
    status: 'active',
    crp: 'CRP 06/12345',
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2026-05-20T10:00:00Z',
    lastLogin: '2026-06-28T09:30:00Z',
    lastLoginIp: '177.75.12.55',
    lastLoginDevice: 'iPhone 15',
    mfaEnabled: false,
    mfaRequired: false,
    mfaMethod: undefined,
    sessionTimeout: 60,
    volunteerData: {
      startDate: '2024-03-10',
      area: 'Psicologia Clínica',
      hoursPerWeek: 8,
      totalHours: 312,
      projects: ['Projeto Renascer', 'Grupo de Apoio Familiar'],
      status: 'active',
      certificates: [
        {
          id: 'cert-001',
          title: 'Certificado de Voluntariado 2024',
          hours: 208,
          period: 'Mar/2024 – Dez/2024',
          issuedAt: '2025-01-10',
          signedBy: 'Carlos Alberto Mendes',
        },
      ],
    },
    unit: 'Unidade Centro',
    specialty: 'Psicologia Clínica',
  },
  {
    id: 'usr-003',
    email: 'auditora@institutosermelhor.org',
    name: 'Ana Beatriz Cardoso',
    cpf: '222.222.222-22',
    phone: '+55 11 97777-2222',
    initials: 'AB',
    roles: ['auditor'],
    primaryRole: 'auditor',
    permissions: buildPermissions(['auditor']),
    status: 'active',
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    lastLogin: '2026-06-27T11:00:00Z',
    lastLoginIp: '200.199.34.12',
    lastLoginDevice: 'Dell XPS',
    mfaEnabled: false,
    mfaRequired: false,
    mfaMethod: undefined,
    sessionTimeout: 30,
    unit: 'Auditoria Interna',
  },
  {
    id: 'usr-004',
    email: 'coordenadora@institutosermelhor.org',
    name: 'Patrícia Lima',
    cpf: '333.333.333-33',
    phone: '+55 11 96666-3333',
    initials: 'PL',
    roles: ['coordinator'],
    primaryRole: 'coordinator',
    permissions: buildPermissions(['coordinator']),
    status: 'active',
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
    lastLogin: '2026-06-29T08:00:00Z',
    lastLoginIp: '192.168.1.45',
    lastLoginDevice: 'Surface Pro',
    mfaEnabled: false,
    mfaRequired: false,
    sessionTimeout: 90,
    unit: 'Unidade Norte',
    department: 'Saúde Mental',
  },
  {
    id: 'usr-005',
    email: 'beneficiario@exemplo.com',
    name: 'João Pedro Oliveira',
    cpf: '444.444.444-44',
    phone: '+55 11 95555-4444',
    initials: 'JP',
    roles: ['beneficiary'],
    primaryRole: 'beneficiary',
    permissions: buildPermissions(['beneficiary']),
    status: 'active',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
    lastLogin: '2026-06-20T16:00:00Z',
    lastLoginIp: '177.45.11.22',
    lastLoginDevice: 'Android',
    mfaEnabled: false,
    sessionTimeout: 60,
    isMinor: false,
  },
  {
    id: 'usr-006',
    email: 'gestor@institutosermelhor.org',
    name: 'Fernando Almeida',
    cpf: '555.555.555-55',
    phone: '+55 11 94444-5555',
    initials: 'FA',
    roles: ['manager'],
    primaryRole: 'manager',
    permissions: buildPermissions(['manager']),
    status: 'active',
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2026-03-15T00:00:00Z',
    lastLogin: '2026-06-29T07:30:00Z',
    lastLoginIp: '192.168.1.100',
    lastLoginDevice: 'Windows 11',
    mfaEnabled: false,
    mfaRequired: false,
    mfaMethod: undefined,
    sessionTimeout: 120,
    unit: 'Matriz',
    department: 'Gestão Social',
  },
  {
    id: 'usr-007',
    email: 'admin.voluntario@institutosermelhor.org',
    name: 'Mariana Costa',
    cpf: '666.666.666-66',
    phone: '+55 11 93333-6666',
    initials: 'MC',
    roles: ['admin_volunteer'],
    primaryRole: 'admin_volunteer',
    permissions: buildPermissions(['admin_volunteer']),
    status: 'active',
    createdAt: '2025-05-01T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
    lastLogin: '2026-06-25T14:30:00Z',
    lastLoginIp: '189.55.43.21',
    lastLoginDevice: 'iPad',
    mfaEnabled: false,
    sessionTimeout: 60,
    volunteerData: {
      startDate: '2025-05-01',
      area: 'Secretaria',
      hoursPerWeek: 4,
      totalHours: 52,
      projects: ['Evento Solidário 2025'],
      status: 'active',
      certificates: [],
    },
  },
  {
    id: 'usr-008',
    email: 'diretora@institutosermelhor.org',
    name: 'Dra. Cláudia Ferreira',
    cpf: '777.777.777-77',
    phone: '+55 11 92222-7777',
    initials: 'CF',
    roles: ['director', 'professional'],
    primaryRole: 'director',
    permissions: buildPermissions(['director', 'professional']),
    status: 'active',
    crm: 'CRM-SP 54321',
    createdAt: '2023-08-01T00:00:00Z',
    updatedAt: '2026-02-20T00:00:00Z',
    lastLogin: '2026-06-29T09:00:00Z',
    lastLoginIp: '192.168.1.200',
    lastLoginDevice: 'MacBook Air',
    mfaEnabled: false,
    mfaRequired: false,
    mfaMethod: undefined,
    sessionTimeout: 180,
    unit: 'Matriz',
    specialty: 'Psiquiatria',
  },
];

// ------ LOGS DE AUDITORIA MOCK --------------------------------

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-06-29T14:00:00Z',
    userId: 'usr-001',
    userName: 'Carlos Alberto Mendes',
    userRole: 'super_admin',
    eventType: 'login_success',
    module: 'iam',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    sessionId: 'sess-001',
    details: { device: 'MacBook Pro', mfaUsed: true },
    severity: 'info',
    hash: 'a1b2c3d4e5f6',
  },
  {
    id: 'log-002',
    timestamp: '2026-06-29T13:55:00Z',
    userId: 'usr-003',
    userName: 'Ana Beatriz Cardoso',
    userRole: 'auditor',
    eventType: 'module_accessed',
    module: 'audit_panel',
    action: 'view',
    ipAddress: '200.199.34.12',
    userAgent: 'Mozilla/5.0 (Windows)',
    sessionId: 'sess-002',
    details: { resource: 'audit_panel', module: 'iam' },
    severity: 'info',
    hash: 'b2c3d4e5f6a1',
  },
  {
    id: 'log-003',
    timestamp: '2026-06-29T13:00:00Z',
    userId: 'unknown',
    userName: 'Desconhecido',
    userRole: 'beneficiary',
    eventType: 'login_failure',
    ipAddress: '177.99.88.77',
    userAgent: 'Mozilla/5.0 (Android)',
    details: { attempts: 3, email: 'hacker@exemplo.com' },
    severity: 'critical',
    hash: 'c3d4e5f6a1b2',
  },
  {
    id: 'log-004',
    timestamp: '2026-06-29T12:30:00Z',
    userId: 'usr-001',
    userName: 'Carlos Alberto Mendes',
    userRole: 'super_admin',
    eventType: 'user_created',
    module: 'iam',
    action: 'create',
    resourceId: 'usr-007',
    resourceType: 'user',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    sessionId: 'sess-001',
    details: { newUser: 'Mariana Costa', role: 'admin_volunteer' },
    severity: 'info',
    hash: 'd4e5f6a1b2c3',
  },
  {
    id: 'log-005',
    timestamp: '2026-06-29T11:00:00Z',
    userId: 'usr-002',
    userName: 'Dra. Roberta Santos',
    userRole: 'volunteer_professional',
    eventType: 'login_success',
    module: 'iam',
    ipAddress: '177.75.12.55',
    userAgent: 'Mozilla/5.0 (iPhone)',
    sessionId: 'sess-003',
    details: { device: 'iPhone 15', mfaUsed: true },
    severity: 'info',
    hash: 'e5f6a1b2c3d4',
  },
  {
    id: 'log-006',
    timestamp: '2026-06-28T22:15:00Z',
    userId: 'usr-004',
    userName: 'Patrícia Lima',
    userRole: 'coordinator',
    eventType: 'profile_change',
    module: 'iam',
    action: 'edit',
    ipAddress: '192.168.1.45',
    userAgent: 'Mozilla/5.0 (Windows)',
    sessionId: 'sess-004',
    details: { field: 'phone', old: '+55 11 96666-0000', new: '+55 11 96666-3333' },
    severity: 'warning',
    hash: 'f6a1b2c3d4e5',
  },
  {
    id: 'log-007',
    timestamp: '2026-06-28T18:00:00Z',
    userId: 'usr-001',
    userName: 'Carlos Alberto Mendes',
    userRole: 'super_admin',
    eventType: 'permission_change',
    module: 'iam',
    action: 'administer',
    resourceId: 'usr-006',
    resourceType: 'user',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    sessionId: 'sess-001',
    details: { user: 'Fernando Almeida', added: ['financial:delete'], removed: [] },
    severity: 'warning',
    hash: 'a1f6b2c3d4e5',
  },
];

// ------ SUGESTÕES DE IA MOCK ---------------------------------

export const MOCK_AI_SUGGESTIONS: AISecuritySuggestion[] = [
  {
    id: 'ai-001',
    type: 'inactive_account',
    userId: 'usr-005',
    userName: 'João Pedro Oliveira',
    description: 'Conta sem acesso há 9 dias. Padrão habitual é acesso semanal.',
    suggestedAction: 'Notificar usuário e, se não houver resposta em 30 dias, suspender acesso temporariamente.',
    severity: 'low',
    detectedAt: '2026-06-29T06:00:00Z',
    status: 'pending',
  },
  {
    id: 'ai-002',
    type: 'excess_privileges',
    userId: 'usr-006',
    userName: 'Fernando Almeida',
    description: 'Permissão "financial:delete" concedida mas nunca utilizada nos últimos 90 dias.',
    suggestedAction: 'Revogar permissão "financial:delete" seguindo princípio de menor privilégio.',
    severity: 'medium',
    detectedAt: '2026-06-28T23:00:00Z',
    status: 'pending',
  },
  {
    id: 'ai-003',
    type: 'anomalous_behavior',
    userId: 'usr-004',
    userName: 'Patrícia Lima',
    description: 'Login realizado às 22:15 de um dispositivo não reconhecido. Horário atípico para este perfil.',
    suggestedAction: 'Verificar com o usuário se o acesso foi legítimo. Considerar exigir MFA para acessos noturnos.',
    severity: 'high',
    detectedAt: '2026-06-28T22:20:00Z',
    status: 'pending',
  },
  {
    id: 'ai-004',
    type: 'permission_review',
    userId: 'usr-007',
    userName: 'Mariana Costa',
    description: '90 dias desde última revisão de permissões. Política recomenda revisão trimestral.',
    suggestedAction: 'Agendar revisão de permissões com o gestor responsável.',
    severity: 'low',
    detectedAt: '2026-06-29T00:00:00Z',
    status: 'pending',
  },
];

// ------ SESSÕES MOCK -----------------------------------------

export const MOCK_SESSIONS: IAMSession[] = [
  {
    id: 'sess-001',
    userId: 'usr-001',
    token: 'tok-abc123',
    createdAt: '2026-06-29T14:00:00Z',
    expiresAt: '2026-06-29T16:00:00Z',
    lastActivity: '2026-06-29T14:45:00Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    deviceName: 'MacBook Pro',
    isTrusted: true,
    mfaVerified: true,
    status: 'active',
  },
  {
    id: 'sess-003',
    userId: 'usr-002',
    token: 'tok-def456',
    createdAt: '2026-06-29T11:00:00Z',
    expiresAt: '2026-06-29T12:00:00Z',
    lastActivity: '2026-06-29T11:30:00Z',
    ipAddress: '177.75.12.55',
    userAgent: 'Mozilla/5.0 (iPhone)',
    deviceName: 'iPhone 15',
    isTrusted: true,
    mfaVerified: true,
    status: 'active',
  },
];

// ------ DISPOSITIVOS CONFIÁVEIS MOCK -------------------------

export const MOCK_TRUSTED_DEVICES: TrustedDevice[] = [
  {
    id: 'dev-001',
    userId: 'usr-001',
    name: 'MacBook Pro',
    fingerprint: 'fp-001-abc',
    addedAt: '2024-01-01T00:00:00Z',
    lastSeen: '2026-06-29T14:00:00Z',
    status: 'trusted',
    browser: 'Chrome 125',
    os: 'macOS 14',
  },
  {
    id: 'dev-002',
    userId: 'usr-001',
    name: 'iPhone 14 Pro',
    fingerprint: 'fp-001-def',
    addedAt: '2024-06-15T00:00:00Z',
    lastSeen: '2026-06-20T09:00:00Z',
    status: 'trusted',
    browser: 'Safari 17',
    os: 'iOS 17',
  },
  {
    id: 'dev-003',
    userId: 'usr-002',
    name: 'iPhone 15',
    fingerprint: 'fp-002-abc',
    addedAt: '2024-03-10T00:00:00Z',
    lastSeen: '2026-06-29T11:00:00Z',
    status: 'trusted',
    browser: 'Safari 17',
    os: 'iOS 17',
  },
];

// ------ CREDENCIAIS DE ACESSO (MAPA PRIVADO) -----------------

export const USER_CREDENTIALS: Record<string, { password: string; userId: string }> = {
  'ism@ism.org': { password: 'teste', userId: 'usr-001' },
  'voluntario@institutosermelhor.org': { password: 'senha123', userId: 'usr-002' },
  'auditora@institutosermelhor.org': { password: 'auditoria123', userId: 'usr-003' },
  'coordenadora@institutosermelhor.org': { password: 'coord123', userId: 'usr-004' },
  'beneficiario@exemplo.com': { password: 'beneficiario123', userId: 'usr-005' },
  'gestor@institutosermelhor.org': { password: 'gestor123', userId: 'usr-006' },
  'admin.voluntario@institutosermelhor.org': { password: 'voluntario123', userId: 'usr-007' },
  'diretora@institutosermelhor.org': { password: 'diretora123', userId: 'usr-008' },
};
