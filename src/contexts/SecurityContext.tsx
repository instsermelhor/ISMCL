/**
 * SecurityContext — Motor RBAC/ABAC do MCSI
 * Módulo Complementar de Segurança Institucional
 * Instituto Ser Melhor — Projeto Aura
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { useAuth, UserRole } from './AuthContext';

// ---------------------------------------------------------------------------
// Tipos Fundamentais
// ---------------------------------------------------------------------------

export type SensitivityLevel = 0 | 1 | 2 | 3 | 4;

export type SpecialCategory =
  | 'POLICIA_FEDERAL'
  | 'POLICIA_RODOVIARIA_FEDERAL'
  | 'POLICIAL_MILITAR'
  | 'POLICIAL_CIVIL'
  | 'GUARDA_CIVIL_MUNICIPAL'
  | 'POLICIA_PENAL'
  | 'BOMBEIRO_MILITAR'
  | 'PERITO_OFICIAL'
  | 'AGENTE_SOCIOEDUCATIVO'
  | 'SERVIDOR_JUSTICA'
  | 'MAGISTRADO'
  | 'PROMOTOR'
  | 'DEFENSOR_PUBLICO'
  | 'SERVIDOR_MP'
  | 'SERVIDOR_JUDICIARIO'
  | 'CONSELHEIRO_TUTELAR'
  | 'MILITAR_FORCAS_ARMADAS'
  | 'SERVIDOR_INTELIGENCIA'
  | 'AUTORIDADE_PUBLICA'
  | 'FAMILIA_PROTEGIDA'
  | 'PROGRAMA_PROTECAO'
  | 'VITIMA_VIOLENCIA_DOMESTICA'
  | 'VITIMA_VIOLENCIA_SEXUAL'
  | 'VITIMA_VIOLENCIA_FISICA'
  | 'VITIMA_VIOLENCIA_PSICOLOGICA'
  | 'MEDIDA_PROTETIVA_ATIVA'
  | 'MENOR_ECA'
  | 'CASO_JUDICIAL_SIGILOSO'
  | 'CASO_ESTRATEGICO_DIRETORIA'
  | null;

export interface Guardian {
  id: string;
  fullName: string;
  relationshipType:
    | 'PAI'
    | 'MAE'
    | 'TUTOR'
    | 'ACOLHEDOR'
    | 'ABRIGO'
    | 'CONSELHO_TUTELAR'
    | 'REPRESENTANTE_LEGAL'
    | 'OUTRO';
  custodyType: 'COMPARTILHADA' | 'UNILATERAL' | 'NENHUMA';
  phone?: string;
  isAuthorized: boolean;
  isProhibited: boolean;
  courtOrderDetails?: string;
}

export interface ProtectiveMeasure {
  id: string;
  processNumber: string;
  measureType: string;
  issuingAuthority: string;
  startDate: string;
  expirationDate?: string;
  restrictionsText: string;
  involvedPersons: string[];
  documentUrl?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  alertDaysBefore: number;
}

export interface SecureVaultData {
  encryptedCpf?: string;
  encryptedAddress?: string;
  encryptedPhone?: string;
  encryptedFamilyDetails?: string;
  encryptedWorkplace?: string;
  encryptedAlternateAddrs?: string;
  encryptedCourtDocs?: string;
}

export interface ProtectedProfile {
  id: string;
  beneficiaryId: string;
  internalCode: string; // ISM-0000000000
  beneficiaryName: string;
  sensitivityLevel: SensitivityLevel;
  specialCategory: SpecialCategory;
  riskScore: number;
  guardians: Guardian[];
  protectiveMeasures: ProtectiveMeasure[];
  vaultData?: SecureVaultData;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  createdAt: string;
  notes?: string;
}

export interface AccessRequest {
  id: string;
  protectedProfileId: string;
  internalCode: string;
  beneficiaryName: string;
  requesterId: string;
  requesterName: string;
  justification: string;
  purpose: string;
  durationMinutes: number;
  processNumber?: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
  authorizedBy?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action:
    | 'VIEW'
    | 'EDIT'
    | 'EXPORT'
    | 'PRINT'
    | 'SEARCH'
    | 'DENIED'
    | 'BREAK_GLASS'
    | 'LEVEL_CHANGE'
    | 'PERMISSION_CHANGE'
    | 'VAULT_ACCESS'
    | 'EXPORT_ANON';
  targetId?: string;
  targetCode?: string;
  description: string;
  ipAddress: string;
  device: string;
  sensitivityLevel?: SensitivityLevel;
  logHash?: string;
}

export interface BehaviorAlert {
  id: string;
  userId: string;
  userName: string;
  alertType:
    | 'MASS_QUERIES'
    | 'UNUSUAL_EXPORT'
    | 'OUT_OF_HOURS'
    | 'CONCURRENT_SESSIONS'
    | 'EXCESSIVE_DOWNLOAD'
    | 'PRIVILEGE_ABUSE'
    | 'REPEATED_DENIED';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// ---------------------------------------------------------------------------
// Permissões por Role e Nível
// ---------------------------------------------------------------------------

type AccessDecision = 'FULL' | 'MASKED' | 'BLOCKED' | 'BREAK_GLASS_REQUIRED';

export function evaluateAccess(
  role: UserRole,
  level: SensitivityLevel
): AccessDecision {
  if (role === 'admin') {
    if (level <= 3) return 'FULL';
    return 'BREAK_GLASS_REQUIRED'; // Nível 4 exige break-glass mesmo para admin
  }
  if (role === 'ref') {
    // Profissional/Coordenador
    if (level === 0) return 'FULL';
    if (level === 1) return 'FULL';
    if (level === 2) return 'FULL';
    if (level === 3) return 'BREAK_GLASS_REQUIRED';
    return 'BLOCKED';
  }
  if (role === 'volunteer') {
    if (level === 0) return 'FULL';
    if (level === 1) return 'MASKED';
    return 'BLOCKED';
  }
  return 'BLOCKED';
}

// ---------------------------------------------------------------------------
// Mascaramento Dinâmico
// ---------------------------------------------------------------------------

export function maskCpf(cpf: string): string {
  return cpf.replace(/^(\d{3})\.(\d{3})\.(\d{3})-(\d{2})$/, '***.***.$3-**');
}

export function maskPhone(phone: string): string {
  return phone.replace(/^(\(\d{2}\))\s?(\d{4,5})-?(\d{4})$/, '$1 *****-$3');
}

export function maskName(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '***';
  if (parts.length === 1) return parts[0][0] + '.';
  return parts[0][0] + '. ' + parts[parts.length - 1];
}

// ---------------------------------------------------------------------------
// Dados Mock — Perfis Protegidos
// ---------------------------------------------------------------------------

const INITIAL_PROFILES: ProtectedProfile[] = [
  {
    id: 'pp-001',
    beneficiaryId: 'ben-001',
    internalCode: 'ISM-0000001092',
    beneficiaryName: 'Maria Conceição Silva',
    sensitivityLevel: 3,
    specialCategory: 'VITIMA_VIOLENCIA_DOMESTICA',
    riskScore: 8.7,
    createdAt: '2025-03-12T09:00:00Z',
    lastModifiedBy: 'Coordenadora Ana Lima',
    lastModifiedAt: '2025-06-01T14:30:00Z',
    notes: 'Medida protetiva de afastamento ativa. Endereço sigiloso.',
    guardians: [],
    protectiveMeasures: [
      {
        id: 'pm-001',
        processNumber: '0001234-56.2025.8.26.0000',
        measureType: 'Lei Maria da Penha — Afastamento do Lar',
        issuingAuthority: '1ª Vara Criminal de SP',
        startDate: '2025-03-10',
        expirationDate: '2025-12-31',
        restrictionsText:
          'Proibição de aproximação a menos de 500m da vítima, filhos e local de trabalho.',
        involvedPersons: ['Carlos Eduardo Silva (agressor)'],
        status: 'ACTIVE',
        alertDaysBefore: 30,
      },
    ],
  },
  {
    id: 'pp-002',
    beneficiaryId: 'ben-002',
    internalCode: 'ISM-0000002458',
    beneficiaryName: 'João Antônio Ramos',
    sensitivityLevel: 2,
    specialCategory: 'MENOR_ECA',
    riskScore: 5.2,
    createdAt: '2025-01-20T10:00:00Z',
    lastModifiedBy: 'Assistente Social Beatriz Costa',
    lastModifiedAt: '2025-05-15T11:00:00Z',
    guardians: [
      {
        id: 'g-001',
        fullName: 'Antônia Ramos',
        relationshipType: 'MAE',
        custodyType: 'UNILATERAL',
        phone: '(11) 98765-4321',
        isAuthorized: true,
        isProhibited: false,
      },
      {
        id: 'g-002',
        fullName: 'Roberto Ramos',
        relationshipType: 'PAI',
        custodyType: 'NENHUMA',
        isAuthorized: false,
        isProhibited: true,
        courtOrderDetails: 'Suspensão do poder familiar por decisão judicial.',
      },
    ],
    protectiveMeasures: [],
  },
  {
    id: 'pp-003',
    beneficiaryId: 'ben-003',
    internalCode: 'ISM-0000003701',
    beneficiaryName: 'Fernanda Oliveira',
    sensitivityLevel: 4,
    specialCategory: 'SERVIDOR_INTELIGENCIA',
    riskScore: 9.9,
    createdAt: '2024-11-05T08:00:00Z',
    lastModifiedBy: 'DPO Institucional',
    lastModifiedAt: '2026-01-10T09:00:00Z',
    notes: 'CASO ESTRATÉGICO — Acesso exclusivo Diretoria + DPO.',
    guardians: [],
    protectiveMeasures: [],
  },
  {
    id: 'pp-004',
    beneficiaryId: 'ben-004',
    internalCode: 'ISM-0000004521',
    beneficiaryName: 'Pedro Henrique Alves',
    sensitivityLevel: 1,
    specialCategory: null,
    riskScore: 2.1,
    createdAt: '2026-02-14T11:00:00Z',
    lastModifiedBy: 'Recepção',
    lastModifiedAt: '2026-02-14T11:00:00Z',
    guardians: [],
    protectiveMeasures: [],
  },
  {
    id: 'pp-005',
    beneficiaryId: 'ben-005',
    internalCode: 'ISM-0000005199',
    beneficiaryName: 'Ana Paula Souza',
    sensitivityLevel: 3,
    specialCategory: 'MEDIDA_PROTETIVA_ATIVA',
    riskScore: 7.8,
    createdAt: '2026-04-01T14:00:00Z',
    lastModifiedBy: 'Coordenadora Ana Lima',
    lastModifiedAt: '2026-06-20T08:30:00Z',
    guardians: [],
    protectiveMeasures: [
      {
        id: 'pm-002',
        processNumber: '0009876-12.2026.8.26.0001',
        measureType: 'Proibição de Aproximação',
        issuingAuthority: '3ª Vara de Família de SP',
        startDate: '2026-04-01',
        expirationDate: '2026-09-30',
        restrictionsText: 'Proibição de aproximação e contato em qualquer meio.',
        involvedPersons: ['Marco Aurélio Souza (ex-companheiro)'],
        status: 'ACTIVE',
        alertDaysBefore: 15,
      },
    ],
  },
];

const INITIAL_REQUESTS: AccessRequest[] = [
  {
    id: 'req-001',
    protectedProfileId: 'pp-001',
    internalCode: 'ISM-0000001092',
    beneficiaryName: 'ISM-0000001092',
    requesterId: 'prof-ext-001',
    requesterName: 'Dr. Rodrigo Menezes',
    justification:
      'Necessidade de interconsulta psiquiátrica de urgência. Paciente apresentou crise dissociativa durante atendimento de grupo. Preciso acessar histórico de medicações e contatos de emergência para coordenação do cuidado imediato.',
    purpose: 'Interconsulta de urgência psiquiátrica',
    durationMinutes: 60,
    status: 'PENDING',
    createdAt: '2026-06-29T10:30:00Z',
  },
  {
    id: 'req-002',
    protectedProfileId: 'pp-005',
    internalCode: 'ISM-0000005199',
    beneficiaryName: 'ISM-0000005199',
    requesterId: 'prof-ext-002',
    requesterName: 'Assistente Social Carla Dias',
    justification:
      'Visita domiciliar programada pelo projeto de apoio a vítimas. Necessito do endereço atualizado para planejamento de rota segura com acompanhamento da equipe.',
    purpose: 'Visita domiciliar assistencial',
    durationMinutes: 30,
    processNumber: 'PROC-ISM-2026-0441',
    status: 'APPROVED',
    authorizedBy: 'Coordenadora Ana Lima',
    createdAt: '2026-06-28T15:00:00Z',
    expiresAt: '2026-06-29T15:30:00Z',
  },
];

const INITIAL_AUDIT: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-06-29T14:02:15Z',
    userId: 'admin',
    userName: 'Administrador Geral',
    action: 'VIEW',
    targetCode: 'ISM-0000001092',
    description: 'Visualização do perfil de proteção.',
    ipAddress: '192.168.1.45',
    device: 'Chrome 126 / macOS',
    sensitivityLevel: 3,
    logHash: 'a7b2e9f1c3d5...',
  },
  {
    id: 'log-002',
    timestamp: '2026-06-29T13:55:00Z',
    userId: 'prof-ext-001',
    userName: 'Dr. Rodrigo Menezes',
    action: 'BREAK_GLASS',
    targetCode: 'ISM-0000001092',
    description: 'Solicitação de Acesso Excepcional registrada.',
    ipAddress: '10.10.50.12',
    device: 'Firefox 127 / Windows 11',
    sensitivityLevel: 3,
    logHash: 'b8c3d0e2f4a6...',
  },
  {
    id: 'log-003',
    timestamp: '2026-06-29T11:20:00Z',
    userId: 'prof-ext-003',
    userName: 'Voluntária Júlia Faria',
    action: 'DENIED',
    targetCode: 'ISM-0000003701',
    description: 'Tentativa de acesso bloqueada. Nível de proteção 4 incompatível com permissão.',
    ipAddress: '172.16.0.88',
    device: 'Safari / iOS 17',
    sensitivityLevel: 4,
    logHash: 'c9d4e1f5b7a2...',
  },
  {
    id: 'log-004',
    timestamp: '2026-06-29T09:30:00Z',
    userId: 'admin',
    userName: 'Administrador Geral',
    action: 'LEVEL_CHANGE',
    targetCode: 'ISM-0000004521',
    description: 'Nível de proteção alterado de 0 para 1.',
    ipAddress: '192.168.1.45',
    device: 'Chrome 126 / macOS',
    sensitivityLevel: 1,
    logHash: 'd0e5f2a6c8b3...',
  },
  {
    id: 'log-005',
    timestamp: '2026-06-28T22:15:00Z',
    userId: 'prof-ext-004',
    userName: 'Recepcionista Marcos',
    action: 'VIEW',
    targetCode: 'ISM-0000002458',
    description: 'Visualização fora do horário padrão. Alerta de comportamento gerado.',
    ipAddress: '200.150.10.5',
    device: 'Chrome 126 / Windows 10',
    sensitivityLevel: 2,
    logHash: 'e1f6a3b7d9c4...',
  },
];

const INITIAL_ALERTS: BehaviorAlert[] = [
  {
    id: 'alert-001',
    userId: 'prof-ext-004',
    userName: 'Recepcionista Marcos',
    alertType: 'OUT_OF_HOURS',
    description:
      'Acesso a perfil de proteção Nível 2 realizado às 22:15 (fora do horário institucional de 07:00–21:00).',
    severity: 'HIGH',
    status: 'NEW',
    detectedAt: '2026-06-28T22:15:30Z',
  },
  {
    id: 'alert-002',
    userId: 'prof-ext-005',
    userName: 'Estagiária Camila',
    alertType: 'MASS_QUERIES',
    description:
      'Usuário realizou 14 consultas a cadastros com nível de proteção ≥2 em intervalo de 3 minutos.',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    detectedAt: '2026-06-27T14:32:00Z',
    resolvedBy: 'DPO Institucional',
  },
  {
    id: 'alert-003',
    userId: 'prof-ext-001',
    userName: 'Dr. Rodrigo Menezes',
    alertType: 'REPEATED_DENIED',
    description:
      '3 tentativas de acesso negado a ISM-0000003701 (Nível 4) em 10 minutos.',
    severity: 'HIGH',
    status: 'RESOLVED',
    detectedAt: '2026-06-25T10:00:00Z',
    resolvedAt: '2026-06-25T10:45:00Z',
    resolvedBy: 'Administrador Geral',
  },
];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SecurityContextType {
  profiles: ProtectedProfile[];
  accessRequests: AccessRequest[];
  auditLog: AuditLogEntry[];
  behaviorAlerts: BehaviorAlert[];

  // Avaliação de acesso
  canAccess: (level: SensitivityLevel) => AccessDecision;
  maskField: (value: string, field: 'cpf' | 'phone' | 'name' | 'address') => string;

  // CRUD de perfis
  addProfile: (profile: Omit<ProtectedProfile, 'id' | 'createdAt' | 'internalCode'>) => void;
  updateProfileLevel: (id: string, newLevel: SensitivityLevel) => void;

  // Acesso Excepcional
  requestBreakGlass: (data: Omit<AccessRequest, 'id' | 'createdAt' | 'status'>) => void;
  approveRequest: (requestId: string) => void;
  denyRequest: (requestId: string) => void;

  // Auditoria
  logAction: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'logHash'>) => void;

  // Alertas
  resolveAlert: (alertId: string) => void;
  markAlertFalsePositive: (alertId: string) => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

let profileCounter = 5199;

function generateInternalCode(): string {
  profileCounter++;
  return `ISM-${String(profileCounter).padStart(10, '0')}`;
}

function generateLogHash(entry: Partial<AuditLogEntry>): string {
  const raw = `${entry.timestamp}|${entry.userId}|${entry.action}|${entry.targetCode}`;
  // Simulação de hash (em produção usaria crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(12, '0') + '...';
}

export function SecurityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProtectedProfile[]>(INITIAL_PROFILES);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(INITIAL_REQUESTS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(INITIAL_AUDIT);
  const [behaviorAlerts, setBehaviorAlerts] = useState<BehaviorAlert[]>(INITIAL_ALERTS);

  const canAccess = useCallback(
    (level: SensitivityLevel): AccessDecision => evaluateAccess(user?.role ?? null, level),
    [user]
  );

  const maskField = useCallback(
    (value: string, field: 'cpf' | 'phone' | 'name' | 'address'): string => {
      const decision = canAccess(1);
      if (decision === 'FULL') return value;
      switch (field) {
        case 'cpf': return maskCpf(value);
        case 'phone': return maskPhone(value);
        case 'name': return maskName(value);
        case 'address': return '[ENDEREÇO OCULTO — DADO PROTEGIDO]';
        default: return '***';
      }
    },
    [canAccess]
  );

  const logAction = useCallback(
    (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'logHash'>) => {
      const timestamp = new Date().toISOString();
      const newEntry: AuditLogEntry = {
        ...entry,
        id: `log-${Date.now()}`,
        timestamp,
        logHash: generateLogHash({ ...entry, timestamp }),
      };
      setAuditLog((prev) => [newEntry, ...prev]);
    },
    []
  );

  const addProfile = useCallback(
    (data: Omit<ProtectedProfile, 'id' | 'createdAt' | 'internalCode'>) => {
      const newProfile: ProtectedProfile = {
        ...data,
        id: `pp-${Date.now()}`,
        internalCode: generateInternalCode(),
        createdAt: new Date().toISOString(),
      };
      setProfiles((prev) => [...prev, newProfile]);
      logAction({
        userId: user?.email ?? 'system',
        userName: user?.name ?? 'Sistema',
        action: 'EDIT',
        targetCode: newProfile.internalCode,
        description: `Novo perfil de proteção criado. Nível: ${data.sensitivityLevel}.`,
        ipAddress: '—',
        device: navigator.userAgent.slice(0, 50),
        sensitivityLevel: data.sensitivityLevel,
      });
    },
    [user, logAction]
  );

  const updateProfileLevel = useCallback(
    (id: string, newLevel: SensitivityLevel) => {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                sensitivityLevel: newLevel,
                lastModifiedBy: user?.name,
                lastModifiedAt: new Date().toISOString(),
              }
            : p
        )
      );
      const profile = profiles.find((p) => p.id === id);
      logAction({
        userId: user?.email ?? 'system',
        userName: user?.name ?? 'Sistema',
        action: 'LEVEL_CHANGE',
        targetCode: profile?.internalCode,
        description: `Nível de proteção alterado para ${newLevel}.`,
        ipAddress: '—',
        device: navigator.userAgent.slice(0, 50),
        sensitivityLevel: newLevel,
      });
    },
    [user, logAction, profiles]
  );

  const requestBreakGlass = useCallback(
    (data: Omit<AccessRequest, 'id' | 'createdAt' | 'status'>) => {
      const newRequest: AccessRequest = {
        ...data,
        id: `req-${Date.now()}`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      setAccessRequests((prev) => [newRequest, ...prev]);
      logAction({
        userId: data.requesterId,
        userName: data.requesterName,
        action: 'BREAK_GLASS',
        targetCode: data.internalCode,
        description: `Solicitação de acesso excepcional registrada. Finalidade: ${data.purpose}.`,
        ipAddress: '—',
        device: navigator.userAgent.slice(0, 50),
      });
    },
    [logAction]
  );

  const approveRequest = useCallback(
    (requestId: string) => {
      setAccessRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'APPROVED' as const,
                authorizedBy: user?.name,
                expiresAt: new Date(
                  Date.now() + (r.durationMinutes * 60 * 1000)
                ).toISOString(),
              }
            : r
        )
      );
    },
    [user]
  );

  const denyRequest = useCallback(
    (requestId: string) => {
      setAccessRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: 'DENIED' as const } : r
        )
      );
    },
    []
  );

  const resolveAlert = useCallback(
    (alertId: string) => {
      setBehaviorAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status: 'RESOLVED' as const,
                resolvedAt: new Date().toISOString(),
                resolvedBy: user?.name,
              }
            : a
        )
      );
    },
    [user]
  );

  const markAlertFalsePositive = useCallback(
    (alertId: string) => {
      setBehaviorAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, status: 'FALSE_POSITIVE' as const } : a
        )
      );
    },
    []
  );

  return (
    <SecurityContext.Provider
      value={{
        profiles,
        accessRequests,
        auditLog,
        behaviorAlerts,
        canAccess,
        maskField,
        addProfile,
        updateProfileLevel,
        requestBreakGlass,
        approveRequest,
        denyRequest,
        logAction,
        resolveAlert,
        markAlertFalsePositive,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity(): SecurityContextType {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity deve ser usado dentro de <SecurityProvider>');
  return ctx;
}
