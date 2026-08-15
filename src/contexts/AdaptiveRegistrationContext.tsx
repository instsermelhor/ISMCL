import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  RegistrationSession,
  RegistrationAnswers,
  BeneficiaryProfile,
  SecurityLevel,
  PriorityLevel,
  RegistrationActionType,
} from '../types/adaptive-registration';
import type { SpecialCategory } from '../contexts/SecurityContext';
import { adaptiveQuestions } from '../data/adaptive-registration-mock';

// ============================================================
// Context Interface
// ============================================================

interface AdaptiveRegistrationContextType {
  session: RegistrationSession;
  visibleQuestions: typeof adaptiveQuestions;
  currentStepQuestions: typeof adaptiveQuestions;
  totalSteps: number;
  canGoBack: boolean;
  canGoForward: boolean;
  saveAnswer: (questionId: string, value: string | string[] | number | null) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  submitRegistration: () => Promise<void>;
  isSubmitting: boolean;
  iipLabel: string;
  priorityColor: string;
  // Callbacks injetados da camada de segurança
  vaultCallbacks?: VaultCallbacks;
  setVaultCallbacks: (cb: VaultCallbacks) => void;
}

// Callbacks do SecurityContext injetados pelo componente raiz
export interface VaultCallbacks {
  addProfile: (data: {
    beneficiaryName: string;
    beneficiaryId: string;
    sensitivityLevel: 0 | 1 | 2 | 3 | 4;
    specialCategory: SpecialCategory;
    riskScore: number;
    guardians: [];
    protectiveMeasures: [];
    notes?: string;
  }) => void;
  logAction: (entry: {
    userId: string;
    userName: string;
    action: 'VAULT_ACCESS' | 'EDIT';
    targetCode?: string;
    description: string;
    ipAddress: string;
    device: string;
    sensitivityLevel?: 0 | 1 | 2 | 3 | 4;
  }) => void;
}

// ============================================================
// Helpers
// ============================================================

function evaluateCondition(
  rule: { questionId: string; operator: string; value: string | string[] },
  answers: RegistrationAnswers
): boolean {
  const answer = answers[rule.questionId];
  if (answer === undefined || answer === null) return false;

  switch (rule.operator) {
    case 'equals':
      return String(answer) === String(rule.value);
    case 'not_equals':
      return String(answer) !== String(rule.value);
    case 'includes':
      if (Array.isArray(answer)) return answer.includes(rule.value as string);
      return false;
    case 'is_any':
      if (Array.isArray(rule.value)) return rule.value.includes(String(answer));
      return false;
    default:
      return false;
  }
}

function isMinor(birthDate: string | undefined): boolean {
  if (!birthDate) return false;
  const dob = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  return age < 18 || (age === 18 && m < 0);
}

function calculateIIP(answers: RegistrationAnswers): number {
  let score = 0;
  const motives = (answers['attendance_motives'] as string[]) ?? [];
  const vulnerabilities = (answers['vulnerability_indicators'] as string[]) ?? [];

  // Pesos dos motivos
  for (const q of adaptiveQuestions) {
    if (q.id === 'attendance_motives' && q.options) {
      for (const opt of q.options) {
        if (motives.includes(opt.value)) score += opt.iipWeight ?? 0;
      }
    }
    if (q.id === 'vulnerability_indicators' && q.options) {
      for (const opt of q.options) {
        if (vulnerabilities.includes(opt.value)) score += opt.iipWeight ?? 0;
      }
    }
  }

  // Agravantes
  if (answers['violence_detail'] === 'yes') score += 20;
  if (answers['suicide_ideation_detail'] === 'yes') score += 35;
  if (answers['triage_hospitalized_before'] === 'yes') score += 10;

  // Escala de urgência percebida
  const urgency = Number(answers['perceived_urgency'] ?? 0);
  score += urgency * 2;

  return Math.min(score, 100);
}

function derivePriority(score: number): PriorityLevel {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'high';
  return 'regular';
}

function deriveSecurityLevel(answers: RegistrationAnswers): SecurityLevel {
  if (answers['is_security_forces'] === 'yes') return 'special';
  if (answers['violence_detail'] === 'yes') return 'elevated';
  if (answers['enable_vault'] === 'yes') return 'elevated';
  return 'standard';
}

function deriveProfile(answers: RegistrationAnswers): BeneficiaryProfile {
  if (answers['is_security_forces'] === 'yes') return 'security_forces';
  const dob = answers['birth_date'] as string | undefined;
  if (dob && isMinor(dob)) return 'minor';
  return 'adult_civilian';
}

function getVisibleQuestions(answers: RegistrationAnswers) {
  const minorFlag = answers['birth_date']
    ? isMinor(answers['birth_date'] as string)
    : false;

  const augmentedAnswers = { ...answers, is_minor: minorFlag ? 'true' : 'false' };

  return adaptiveQuestions.filter((q) => {
    if (q.skipIf && evaluateCondition(q.skipIf, augmentedAnswers)) return false;
    if (q.showIf && !evaluateCondition(q.showIf, augmentedAnswers)) return false;
    return true;
  });
}

function getStepsFromQuestions(questions: typeof adaptiveQuestions): number {
  if (!questions || questions.length === 0) return 8;
  const steps = new Set(questions.map((q) => q.step));
  const max = Math.max(...steps);
  return Number.isFinite(max) && max > 0 ? max : 8;
}

function getIIPLabel(score: number): string {
  if (score >= 70) return 'Crítica';
  if (score >= 40) return 'Alta';
  return 'Regular';
}

function getPriorityColor(level: PriorityLevel): string {
  if (level === 'critical') return '#ef4444';
  if (level === 'high') return '#f59e0b';
  return '#22c55e';
}

// ============================================================
// Initial Session
// ============================================================

const initialSession: RegistrationSession = {
  id: `reg-${Date.now()}`,
  startedAt: new Date().toISOString(),
  lastUpdatedAt: new Date().toISOString(),
  currentStep: 1,
  totalSteps: 8,
  answers: {},
  profile: null,
  securityLevel: 'standard',
  iipScore: 0,
  priorityLevel: 'regular',
  requiredDocuments: [],
  triggeredWorkflowIds: [],
  status: 'in_progress',
};

// ============================================================
// Mapeamento: valor da instituição → SpecialCategory (SecurityContext)
// ============================================================

const INSTITUTION_TO_CATEGORY: Record<string, SpecialCategory> = {
  pm: 'POLICIAL_MILITAR',
  pc: 'POLICIAL_CIVIL',
  pf: 'POLICIA_FEDERAL',
  prf: 'POLICIA_RODOVIARIA_FEDERAL',
  cb: 'BOMBEIRO_MILITAR',
  gcm: 'GUARDA_CIVIL_MUNICIPAL',
  pp: 'POLICIA_PENAL',
  fa: 'MILITAR_FORCAS_ARMADAS',
  other: 'AUTORIDADE_PUBLICA',
};

// ============================================================
// Sanitização de dados sensíveis antes de persistir
// ============================================================

function sanitizeProtocolAnswers(answers: RegistrationAnswers): RegistrationAnswers {
  const sanitized = { ...answers };
  // Mascarar número funcional
  if (sanitized['functional_id']) {
    sanitized['functional_id'] = '[FUNCIONAL PROTEGIDO]';
  }
  // Mascarar CPF
  if (typeof sanitized['cpf'] === 'string' && sanitized['cpf'].length > 4) {
    sanitized['cpf'] = '***.***.***-**';
  }
  // Mascarar CPF do responsável
  if (typeof sanitized['guardian_cpf'] === 'string' && sanitized['guardian_cpf'].length > 4) {
    sanitized['guardian_cpf'] = '***.***.***-**';
  }
  // Substituir nomes de arquivos de upload por booleano
  for (const field of ['rg_upload', 'cpf_card_upload', 'address_proof_upload', 'credential_upload', 'medication_prescription_upload']) {
    if (sanitized[field] !== undefined && sanitized[field] !== null) {
      sanitized[field] = sanitized[field] ? 'DOCUMENTO_ENVIADO' : null;
    }
  }
  return sanitized;
}

// ============================================================
// Context
// ============================================================

const AdaptiveRegistrationContext = createContext<AdaptiveRegistrationContextType | null>(null);

export const AdaptiveRegistrationProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<RegistrationSession>(initialSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vaultCallbacks, setVaultCallbacks] = useState<VaultCallbacks | undefined>(undefined);

  const visibleQuestions = getVisibleQuestions(session.answers);
  const totalSteps = getStepsFromQuestions(visibleQuestions);
  const currentStepQuestions = visibleQuestions.filter((q) => q.step === session.currentStep);

  const saveAnswer = useCallback(
    (questionId: string, value: string | string[] | number | null) => {
      setSession((prev) => {
        const newAnswers = { ...prev.answers, [questionId]: value };
        const iipScore = calculateIIP(newAnswers);
        const priorityLevel = derivePriority(iipScore);
        const securityLevel = deriveSecurityLevel(newAnswers);
        const profile = deriveProfile(newAnswers);

        // Required documents based on answers
        const requiredDocs: string[] = ['rg', 'address_proof'];
        if (newAnswers['is_security_forces'] === 'yes') requiredDocs.push('credential');
        if (newAnswers['triage_current_medication'] === 'yes') requiredDocs.push('receita_medica');
        const motives = (newAnswers['attendance_motives'] as string[]) ?? [];
        if (motives.includes('violencia')) requiredDocs.push('bo_violencia');
        const dob = newAnswers['birth_date'] as string | undefined;
        if (dob && isMinor(dob)) requiredDocs.push('guardianship_document');

        return {
          ...prev,
          answers: newAnswers,
          iipScore,
          priorityLevel,
          securityLevel,
          profile,
          requiredDocuments: requiredDocs,
          lastUpdatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const goToNextStep = useCallback(() => {
    setSession((prev) => {
      const nextStep = prev.currentStep + 1;
      return { ...prev, currentStep: Math.min(nextStep, totalSteps) };
    });
  }, [totalSteps]);

  const goToPrevStep = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1),
    }));
  }, []);

  const submitRegistration = useCallback(async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => resolve(null));
    
    const isSecurityForces = session.answers['is_security_forces'] === 'yes';
    const functionalId = session.answers['functional_id'] as string | undefined;
    const hasVaultTrigger = isSecurityForces && !!functionalId?.trim();

    // ── 1. Registrar paciente operacional (sem dados sensíveis em claro) ──
    try {
      const savedPatients = localStorage.getItem('patients_list');
      const list = savedPatients ? JSON.parse(savedPatients) : [];
      const fullName = String(session.answers['full_name'] || 'Beneficiário ARE');
      const socialName = String(session.answers['social_name'] || '');
      const cpf = String(session.answers['cpf'] || '***.***.***-**');
      const dob = String(session.answers['birth_date'] || '');
      const phone = String(session.answers['phone'] || '');
      const email = String(session.answers['email'] || '');
      
      const newPatient = {
        id: `are-${Date.now()}`,
        name: fullName,
        socialName: socialName,
        age: dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 30,
        gender: String(session.answers['gender'] || 'Feminino'),
        birthDate: dob,
        // CPF mascarado no registro operacional
        cpf: cpf.replace(/\d{3}\.\d{3}\.\d{3}/, '***.***.***'),
        rg: '**.***.***-*',
        status: 'Em avaliação',
        risk: session.priorityLevel === 'critical' || session.priorityLevel === 'high' ? 'high' : 'low',
        lastSeen: new Date().toLocaleDateString('pt-BR'),
        professional: 'Aguardando Atribuição',
        phone: phone,
        email: email,
        address: String(session.answers['address'] || 'Endereço não informado'),
        emergencyContact: 'Não informado',
        socialProject: 'Acolher Saúde Mental',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        income: String(session.answers['income'] || 'none'),
        housing: String(session.answers['housing'] || 'owned'),
        education: 'Não informada',
        occupation: 'Não informada',
        familyRenda: 'Até 1 SM',
        // Flag de proteção reforçada (não expõe o funcional)
        hasDigitalVault: hasVaultTrigger,
        isSecurityForces: isSecurityForces,
      };
      
      localStorage.setItem('patients_list', JSON.stringify([...list, newPatient]));
    } catch (err) {
      console.error('[ARE] Erro ao salvar paciente:', err);
    }

    // ── 2. Dossier SATAI — sanitizado (sem dados sensíveis em claro) ──
    try {
      const savedDossiers = localStorage.getItem('satai_dossiers');
      const dossiersList = savedDossiers ? JSON.parse(savedDossiers) : [];
      
      // Aplicar sanitização antes de persistir
      const sanitizedAnswers = sanitizeProtocolAnswers({ ...session.answers });

      const newDossier = {
        id: `DOS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
        registrationId: session.id,
        sessionId: `ses-${Date.now()}`,
        protocolId: 'prot-geral',
        protocolName: 'Protocolo Geral de Acolhimento',
        programIds: ['prog-acolher'],
        beneficiaryName: String(session.answers['full_name'] || 'Beneficiário ARE'),
        beneficiaryProfile: session.profile || 'adult_civilian',
        beneficiaryDob: String(session.answers['birth_date'] || ''),
        iipScore: session.iipScore,
        priorityLevel: session.priorityLevel,
        securityLevel: session.securityLevel,
        attendanceMotives: (session.answers['attendance_motives'] as string[]) || [],
        factorsOfAttention: (session.answers['vulnerability_indicators'] as string[]) || [],
        alertsTriggered: session.iipScore > 50 ? ['sofrimento_agudo'] : [],
        // TRIAGEM: apenas dados sanitizados — sem número funcional, CPF ou documentos em claro
        protocolAnswers: sanitizedAnswers,
        aiSummary: `Beneficiário cadastrado via Portal ARE com prioridade ${session.priorityLevel.toUpperCase()}.`,
        aiInconsistencies: [],
        aiRecommendedProtocols: ['Acolhimento Psicológico'],
        aiRiskFlags: session.priorityLevel === 'critical' ? ['🚨 RISCO CRÍTICO'] : [],
        hasDigitalVault: hasVaultTrigger,
        status: 'pending_review',
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('satai_dossiers', JSON.stringify([newDossier, ...dossiersList]));
    } catch (err) {
      console.error('[ARE] Erro ao salvar dossier SATAI:', err);
    }

    // ── 3. Cofre Digital: criar ProtectedProfile no SecurityContext ──
    if (hasVaultTrigger && vaultCallbacks) {
      try {
        const institutionValue = String(session.answers['security_institution'] || 'other');
        const specialCategory: SpecialCategory = INSTITUTION_TO_CATEGORY[institutionValue] ?? 'AUTORIDADE_PUBLICA';
        const fullName = String(session.answers['full_name'] || 'Beneficiário ARE');
        const beneficiaryId = `are-${Date.now()}`;

        // Criar perfil de proteção nível 3 (Altamente Protegido)
        vaultCallbacks.addProfile({
          beneficiaryName: fullName,
          beneficiaryId,
          sensitivityLevel: 3,
          specialCategory,
          riskScore: Math.min(session.iipScore / 10, 10),
          guardians: [],
          protectiveMeasures: [],
          notes: `Cadastro automático via ARE. Agente de segurança pública. Instituição: ${institutionValue.toUpperCase()}. Proteção reforçada ativada por Número Funcional.`,
        });

        // Gerar evento de auditoria
        vaultCallbacks.logAction({
          userId: 'system-are',
          userName: 'Portal ARE (Sistema)',
          action: 'VAULT_ACCESS',
          description: `Cofre Digital criado automaticamente para agente de segurança pública. Categoria: ${specialCategory}. Nível de sensibilidade: 3.`,
          ipAddress: '—',
          device: navigator.userAgent.slice(0, 50),
          sensitivityLevel: 3,
        });
      } catch (err) {
        console.error('[ARE] Erro ao criar ProtectedProfile no SecurityContext:', err);
      }
    } else if (session.answers['enable_vault'] === 'yes' && vaultCallbacks) {
      // Cofre ativado manualmente sem funcional → nível 2 (Protegido)
      try {
        const fullName = String(session.answers['full_name'] || 'Beneficiário ARE');
        const beneficiaryId = `are-${Date.now()}`;
        vaultCallbacks.addProfile({
          beneficiaryName: fullName,
          beneficiaryId,
          sensitivityLevel: 2,
          specialCategory: null,
          riskScore: Math.min(session.iipScore / 10, 10),
          guardians: [],
          protectiveMeasures: [],
          notes: 'Cofre Digital ativado pelo beneficiário via Portal ARE.',
        });
        vaultCallbacks.logAction({
          userId: 'system-are',
          userName: 'Portal ARE (Sistema)',
          action: 'VAULT_ACCESS',
          description: 'Cofre Digital ativado manualmente pelo beneficiário. Nível de sensibilidade: 2.',
          ipAddress: '—',
          device: navigator.userAgent.slice(0, 50),
          sensitivityLevel: 2,
        });
      } catch (err) {
        console.error('[ARE] Erro ao criar ProtectedProfile (vault manual):', err);
      }
    }

    setSession((prev) => ({ ...prev, status: 'pending_review' }));
    setIsSubmitting(false);
  }, [session, vaultCallbacks]);

  const value: AdaptiveRegistrationContextType = {
    session,
    visibleQuestions,
    currentStepQuestions,
    totalSteps,
    canGoBack: session.currentStep > 1,
    canGoForward: session.currentStep < totalSteps,
    saveAnswer,
    goToNextStep,
    goToPrevStep,
    submitRegistration,
    isSubmitting,
    iipLabel: getIIPLabel(session.iipScore),
    priorityColor: getPriorityColor(session.priorityLevel),
    vaultCallbacks,
    setVaultCallbacks,
  };

  return (
    <AdaptiveRegistrationContext.Provider value={value}>
      {children}
    </AdaptiveRegistrationContext.Provider>
  );
};

export const useAdaptiveRegistration = () => {
  const ctx = useContext(AdaptiveRegistrationContext);
  if (!ctx) throw new Error('useAdaptiveRegistration must be used inside AdaptiveRegistrationProvider');
  return ctx;
};
