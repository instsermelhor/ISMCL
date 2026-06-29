// ============================================================
// Tipos de Dados — SATAI (Sistema Inteligente de Acolhimento)
// Plataforma Configurável de Protocolos Institucionais
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import type { BeneficiaryProfile, SecurityLevel, PriorityLevel } from './adaptive-registration';

// ─────────────────────────────────────────
// TIPOS BASE DE PERGUNTAS
// ─────────────────────────────────────────

export type SataiQuestionType =
  | 'text'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'scale'
  | 'yes_no'
  | 'date'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'file_upload'
  | 'rating';

export interface SataiQuestionOption {
  label: string;
  value: string;
  weight?: number;        // Contribuição ao score do protocolo
  triggerAlert?: boolean; // Dispara alerta de prioridade
  color?: string;         // Cor visual da opção (verde/amarelo/vermelho)
}

export interface SataiConditionalRule {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'includes' | 'greater_than' | 'less_than' | 'contains';
  value: string;
}

export interface SataiConditionalBlock {
  logic: 'AND' | 'OR';
  rules: SataiConditionalRule[];
}

export interface SataiProtocolQuestion {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  type: SataiQuestionType;
  options?: SataiQuestionOption[];
  required: boolean;
  showIf?: SataiConditionalBlock;   // Lógica condicional avançada
  scoreWeight?: number;             // Peso no escore geral
  alertThreshold?: number;          // Valor que dispara alerta (para scale/number)
  helpText?: string;                // Texto de ajuda contextual
  section?: string;                 // Seção/agrupamento da pergunta
  order: number;                    // Ordem de exibição
}

// ─────────────────────────────────────────
// PROGRAMAS SOCIAIS E CONVÊNIOS
// ─────────────────────────────────────────

export type ProgramType =
  | 'programa_social'
  | 'projeto'
  | 'convenio'
  | 'campanha'
  | 'iniciativa'
  | 'parceria';

export interface SataiProgram {
  id: string;
  name: string;
  code: string;             // ex: 'PAIF', 'SCFV', 'BPC'
  type: ProgramType;
  description: string;
  targetAudience: string;
  responsibleSector: string;
  partnerOrg?: string;      // Órgão conveniado (Prefeitura, Governo, ONGs)
  legalBasis?: string;      // Base legal (Lei, Portaria, Decreto)
  startDate: string;
  endDate?: string;         // null = sem prazo
  active: boolean;
  beneficiaryCount: number;
  linkedProtocolIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────
// VERSIONAMENTO DE PROTOCOLOS
// ─────────────────────────────────────────

export interface SataiProtocolVersion {
  version: string;          // ex: '1.0', '1.1', '2.0'
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  archivedAt?: string;
  publishedBy?: string;
  archivedBy?: string;
  changelog: string;        // Descrição das mudanças
  questionSnapshot: SataiProtocolQuestion[]; // Snapshot das perguntas nessa versão
}

// ─────────────────────────────────────────
// PROTOCOLO INSTITUCIONAL
// ─────────────────────────────────────────

export interface SataiProtocol {
  id: string;
  name: string;
  code: string;             // ex: 'PROT-VD-001'
  description: string;
  objective: string;        // Objetivo específico do protocolo
  targetProfile: BeneficiaryProfile | 'all' | 'elderly' | 'woman' | 'adult' | 'man' | 'teenager';
  targetAudience: string;   // ex: 'Vítimas de violência doméstica'
  active: boolean;
  version: string;          // Versão atual
  status: 'draft' | 'published' | 'archived';

  // Associação Institucional
  programIds: string[];          // Programas sociais associados
  programAssociation?: string;   // Nome descritivo (legado)
  sector: string;                // Setor responsável
  responsibleTeam: string;       // Equipe responsável

  // Configuração Clínica
  estimatedDurationMin: number;  // Duração estimada em minutos
  requiresProfessionalReview: boolean;
  alertKeywords: string[];       // Palavras-chave que disparam alerta
  priorityEscalation: boolean;   // Pode escalar prioridade automaticamente
  lgpdSensitiveData: boolean;    // Contém dados sensíveis (LGPD Art. 11)

  // Metadados de Governança
  legalBasis?: string;
  technicalNote?: string;        // Nota técnica de referência
  references?: string[];         // Referências bibliográficas/normativas

  // Ciclo de Vida
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;

  // Versionamento
  versionHistory: SataiProtocolVersion[];

  // Perguntas
  questions: SataiProtocolQuestion[];

  // Estatísticas
  stats?: SataiProtocolStats;
}

// ─────────────────────────────────────────
// ESTATÍSTICAS DE PROTOCOLO
// ─────────────────────────────────────────

export interface SataiProtocolStats {
  totalSessions: number;
  completedSessions: number;
  averageDurationMin: number;
  averageScore: number;
  criticalCasesIdentified: number;
  lastUsedAt?: string;
}

// ─────────────────────────────────────────
// SESSÃO DE TRIAGEM
// ─────────────────────────────────────────

export interface SataiSession {
  id: string;
  registrationId: string;      // Referência ao cadastro mestre (ARE)
  protocolId: string;          // Protocolo utilizado
  protocolVersion: string;     // Versão do protocolo no momento da triagem
  currentStep: number;
  totalSteps: number;
  answers: Record<string, string | string[] | number | null>;
  startedAt: string;
  lastUpdatedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  alertsTriggered: string[];   // IDs das perguntas que dispararam alertas
  intermediateScore: number;   // Score calculado em tempo real
}

// ─────────────────────────────────────────
// DOSSIÊ DE ACOLHIMENTO
// ─────────────────────────────────────────

export interface SataiDossier {
  id: string;             // DOS-YYYY-XXXXX
  registrationId: string;
  sessionId: string;
  protocolId: string;
  protocolName: string;
  programIds: string[];

  // Dados do Beneficiário
  beneficiaryName: string;
  beneficiaryProfile: BeneficiaryProfile;
  beneficiaryDob?: string;

  // Avaliação
  iipScore: number;
  priorityLevel: PriorityLevel;
  securityLevel: SecurityLevel;
  attendanceMotives: string[];
  factorsOfAttention: string[];
  alertsTriggered: string[];

  // Respostas completas
  protocolAnswers: Record<string, string | string[] | number | null>;

  // Inteligência Artificial
  aiSummary: string;
  aiInconsistencies: string[];
  aiRecommendedProtocols: string[];
  aiRiskFlags: string[];

  // Encaminhamento
  status: 'pending_review' | 'accepted' | 'rejected' | 'referred';
  assignedProfessionalId?: string;
  assignedProfessionalName?: string;
  recommendedWorkflowId?: string;
  referralNotes?: string;

  // Rastreabilidade
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// ─────────────────────────────────────────
// AUDITORIA
// ─────────────────────────────────────────

export type SataiAuditAction =
  | 'protocol_created'
  | 'protocol_updated'
  | 'protocol_published'
  | 'protocol_archived'
  | 'protocol_cloned'
  | 'program_created'
  | 'program_updated'
  | 'program_linked'
  | 'dossier_accepted'
  | 'dossier_rejected'
  | 'dossier_referred'
  | 'session_started'
  | 'session_completed'
  | 'alert_triggered';

export interface SataiAuditLog {
  id: string;
  action: SataiAuditAction;
  entityType: 'protocol' | 'program' | 'dossier' | 'session';
  entityId: string;
  entityName: string;
  performedBy: string;
  performedAt: string;
  details: string;
  metadata?: Record<string, string>;
}
