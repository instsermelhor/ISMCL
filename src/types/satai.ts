// ============================================================
// Tipos de Dados — SATAI (Sistema Inteligente de Acolhimento)
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import type { BeneficiaryProfile, SecurityLevel, PriorityLevel } from './adaptive-registration';

export type SataiQuestionType =
  | 'text'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'scale'
  | 'yes_no';

export interface SataiQuestionOption {
  label: string;
  value: string;
  weight?: number; // Contribuição ao score específico do protocolo
}

export interface SataiConditionalRule {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'includes';
  value: string;
}

export interface SataiProtocolQuestion {
  id: string;
  label: string;
  description?: string;
  type: SataiQuestionType;
  options?: SataiQuestionOption[];
  required: boolean;
  showIf?: SataiConditionalRule;
}

export interface SataiProtocol {
  id: string;
  name: string;
  description: string;
  targetProfile: BeneficiaryProfile | 'all';
  active: boolean;
  version: string;
  questions: SataiProtocolQuestion[];
}

export interface SataiSession {
  id: string;
  registrationId: string; // Referência ao cadastro mestre (ARE)
  currentStep: number;
  answers: Record<string, string | string[] | number | null>;
  startedAt: string;
  lastUpdatedAt: string;
  status: 'in_progress' | 'completed';
}

export interface SataiDossier {
  id: string; // DOS-YYYY-XXXXX
  registrationId: string;
  beneficiaryName: string;
  beneficiaryProfile: BeneficiaryProfile;
  iipScore: number;
  priorityLevel: PriorityLevel;
  securityLevel: SecurityLevel;
  attendanceMotives: string[];
  protocolAnswers: Record<string, any>;
  factorsOfAttention: string[]; // Necessidade de proteção, encaminhamento multidisciplinar, etc.
  
  // Apoio de Inteligência Artificial
  aiSummary: string;
  aiInconsistencies: string[];
  aiRecommendedProtocols: string[];
  
  status: 'pending_review' | 'accepted' | 'rejected';
  assignedProfessionalId?: string;
  recommendedWorkflowId?: string;
  createdAt: string;
}
