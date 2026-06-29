// ============================================================
// Tipos de Dados — Cadastro Inteligente Adaptativo (ARE)
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

// ---- Perfil Principal do Beneficiário ----

export type BeneficiaryProfile =
  | 'security_forces'    // Forças de Segurança Pública
  | 'adult_civilian'     // Adulto Civil
  | 'minor'              // Menor de idade
  | 'legal_dependent';   // Dependente legal de outro beneficiário

export type SecurityLevel =
  | 'standard'           // Padrão
  | 'elevated'           // Elevado (ex: Violência Doméstica)
  | 'special'            // Especial (ex: Segurança Pública Sigilosa)
  | 'maximum';           // Máximo (ex: Testemunha protegida)

export type PriorityLevel = 'critical' | 'high' | 'regular';

// ---- Perguntas Adaptativas (Metadata-driven) ----

export type QuestionType =
  | 'radio'
  | 'checkbox'
  | 'text'
  | 'date'
  | 'cpf'
  | 'phone'
  | 'email'
  | 'select'
  | 'file_upload'
  | 'address_block'
  | 'scale'
  | 'yes_no';

export interface ConditionalRule {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'includes' | 'is_any';
  value: string | string[];
}

export interface AdaptiveQuestion {
  id: string;
  step: number;
  label: string;
  description?: string;       // Texto explicativo acolhedor abaixo do campo
  privacyNote?: string;       // Nota sobre proteção de dados
  type: QuestionType;
  options?: { label: string; value: string; iipWeight?: number }[];
  required: boolean;
  showIf?: ConditionalRule;   // Mostrar somente se regra for verdadeira
  skipIf?: ConditionalRule;   // Pular esta pergunta se regra for verdadeira
  triggersAction?: RegistrationAction[];  // Ação automática disparada pela resposta
  fieldGroup?: string;        // Nome do grupo para layout agrupado
}

// ---- Ações Automáticas ----

export type RegistrationActionType =
  | 'set_security_level'
  | 'enable_digital_vault'
  | 'require_legal_guardian'
  | 'trigger_workflow'
  | 'add_required_document'
  | 'add_iip_score'
  | 'redirect_to_login'
  | 'apply_masking'
  | 'notify_admin';

export interface RegistrationAction {
  type: RegistrationActionType;
  payload?: Record<string, any>;
}

// ---- Respostas do Usuário ----

export type RegistrationAnswers = Record<string, string | string[] | number | null>;

// ---- Estado da Sessão de Cadastro ----

export type RegistrationStatus =
  | 'in_progress'
  | 'pending_documents'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export interface RegistrationSession {
  id: string;
  startedAt: string;
  lastUpdatedAt: string;
  currentStep: number;
  totalSteps: number;
  answers: RegistrationAnswers;
  profile: BeneficiaryProfile | null;
  securityLevel: SecurityLevel;
  iipScore: number;
  priorityLevel: PriorityLevel;
  requiredDocuments: string[];
  triggeredWorkflowIds: string[];
  status: RegistrationStatus;
}

// ---- Classificação Social e Vulnerabilidade ----

export interface AttendanceMotiveOption {
  id: string;
  label: string;
  category: 'mental_health' | 'violence' | 'social_vulnerability' | 'rights_violation';
  iipWeight: number;      // Contribuição ao Índice de Prioridade Institucional
  active: boolean;        // Configurável pelo Super Admin
  triggersDocuments?: string[];
}

export interface VulnerabilityIndicator {
  id: string;
  label: string;
  iipWeight: number;
  active: boolean;
}

export interface TriageQuestion {
  id: string;
  label: string;
  iipWeight: number;      // Peso quando resposta for SIM
  active: boolean;
  triggersCritical?: boolean;  // Se SIM, define automaticamente prioridade Crítica
}

// ---- Beneficiário Registrado ----

export interface RegisteredBeneficiary {
  id: string;                    // ISM-YYYY-XXXXX
  name: string;
  socialName?: string;
  cpf: string;
  birthDate: string;
  profile: BeneficiaryProfile;
  securityLevel: SecurityLevel;
  iipScore: number;
  priorityLevel: PriorityLevel;
  attendanceMotives: string[];
  legalGuardianId?: string;     // ID do responsável legal se menor
  isSecurityForces: boolean;
  institution?: string;
  functionalId?: string;
  hasDigitalVault: boolean;
  registrationStatus: RegistrationStatus;
  createdAt: string;
  workflowInstanceId?: string;
  assignedProfessionalId?: string;
}

// ---- Documentos Requeridos ----

export interface RequiredDocument {
  id: string;
  label: string;
  description: string;
  mandatory: boolean;
  triggeredBy: string[];   // IDs das perguntas ou perfis que ativam este documento
}
