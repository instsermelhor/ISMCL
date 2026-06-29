// ============================================================
// Tipos de Dados — PIARAVE
// Programa Institucional de Acolhimento às Vítimas de Relações
// Abusivas, Manipulação Psicológica e Violência Emocional
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import type { BeneficiaryProfile, SecurityLevel, PriorityLevel } from './adaptive-registration';

export type PiaraveDemandType =
  | 'violencia_emocional'
  | 'abuso_psicologico'
  | 'manipulacao_psicologica'
  | 'controle_excessivo'
  | 'isolamento_social'
  | 'gaslighting'
  | 'chantagem_emocional'
  | 'ameacas'
  | 'perseguicao'
  | 'dependencia_emocional'
  | 'abuso_financeiro'
  | 'alienacao_familiar'
  | 'conflitos_conjugais'
  | 'conflitos_parentais'
  | 'separacao_litigiosa'
  | 'violencia_pos_separacao'
  | 'assedio_moral'
  | 'outras_relacionais';

export interface PiaraveQuestionOption {
  label: string;
  value: string;
  weight?: number;
  triggerAlert?: boolean;
}

export interface PiaraveQuestion {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'scale' | 'yes_no';
  options?: PiaraveQuestionOption[];
  required: boolean;
  order: number;
}

export interface PiaraveLine {
  id: string;
  name: string;             // ex: 'Mulheres', 'Homens', 'Crianças', 'Adolescentes', 'Idosos', 'Famílias'
  targetAudience: string;
  description: string;
  active: boolean;
  questions: PiaraveQuestion[];
}

export interface PiaraveSafetyPlan {
  id: string;
  registrationId: string;   // Vínculo com cadastro do beneficiário
  trustedPersonName: string;
  trustedPersonContact: string;
  emergencyContact: string;
  safePlaceDescription: string;
  safetyInstructions: string;
  institutionalProtectionNotes: string;
  lastUpdatedAt: string;
  updatedBy: string;
  isEncrypted: boolean;     // Indicador de criptografia de Cofre Digital (MCSI)
}

export interface PiaraveLibraryItem {
  id: string;
  title: string;
  type: 'cartilha' | 'video' | 'material_psicoeducativo' | 'direitos' | 'cnv';
  description: string;
  contentUrl: string;
  tags: string[];
  status: 'pending_validation' | 'approved' | 'rejected';
  validatedBy?: string;
  validatedAt?: string;
  validationNotes?: string;
  createdBy: string;
  createdAt: string;
}

export interface PiaraveGoal {
  id: string;
  description: string;
  intervention: string;
  indicator: string;
  targetDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED';
  responsible: string;
}

export interface PiaraveEvolution {
  id: string;
  date: string;
  professionalName: string;
  role: 'psicologo' | 'psiquiatra' | 'assistente_social' | 'advogado' | 'pedagogo' | 'mediador';
  content: string;          // Relato sob sigilo / visibilidade controlada (ABAC)
  signed: boolean;
  signatureHash?: string;
}

export interface PiaraveMeeting {
  id: string;
  date: string;
  participants: string[];
  agenda: string;
  minutes: string;
  decisions: string;
}

export interface PiaraveCase {
  id: string;               // CAS-PIARAVE-XXXXX
  registrationId: string;
  beneficiaryName: string;
  beneficiaryProfile: BeneficiaryProfile;
  priorityLevel: PriorityLevel;
  securityLevel: SecurityLevel;
  demandsReported: PiaraveDemandType[];
  safetyPlan?: PiaraveSafetyPlan;
  
  // Plano Individual de Acompanhamento (PIA)
  piaGeneralObjectives: string;
  piaSpecificObjectives: string;
  piaFamilyCommitments: string;
  piaVersion: number;
  piaGoals: PiaraveGoal[];
  
  // Histórico
  evolutions: PiaraveEvolution[];
  meetings: PiaraveMeeting[];
  
  status: 'active' | 'pending_evaluation' | 'completed' | 'archived' | 'reopened';
  assignedProfessionalId?: string;
  assignedProfessionalName?: string;
  referralType?: 'psicologia' | 'psiquiatria' | 'assistencia_social' | 'juridico' | 'grupo_terapeutico' | 'outro';
  createdAt: string;
  updatedAt: string;
}

export interface PiaraveAuditLog {
  id: string;
  action: string;           // ex: 'safety_plan_accessed', 'evolution_signed', 'pia_updated'
  dossierId: string;
  performedBy: string;
  role: string;
  performedAt: string;
  details: string;
  securityLevel: SecurityLevel;
}
