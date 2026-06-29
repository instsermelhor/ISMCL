import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  PiaraveLine,
  PiaraveLibraryItem,
  PiaraveCase,
  PiaraveGoal,
  PiaraveEvolution,
  PiaraveMeeting,
  PiaraveAuditLog,
  PiaraveSafetyPlan,
  PiaraveDemandType,
} from '../types/piarave';
import {
  mockPiaraveLines,
  mockPiaraveLibraryItems,
  mockPiaraveCases,
  mockPiaraveAuditLogs,
} from '../data/piarave-mock';
import { useAdaptiveRegistration } from './AdaptiveRegistrationContext';
import { useBPMS } from './BPMSContext';

// ============================================================
// Context Interface
// ============================================================

interface PiaraveSession {
  registrationId: string;
  lineId: string;
  currentStep: number;
  answers: Record<string, string | string[] | number | null>;
  selectedDemands: PiaraveDemandType[];
  safetyPlanDraft?: Partial<PiaraveSafetyPlan>;
  startedAt: string;
  status: 'in_progress' | 'completed';
}

interface PiaraveContextType {
  lines: PiaraveLine[];
  cases: PiaraveCase[];
  libraryItems: PiaraveLibraryItem[];
  auditLogs: PiaraveAuditLog[];
  activeSession: PiaraveSession | null;

  // Beneficiary Wizard Actions
  startPiaraveSession: (registrationId: string, lineId: string) => void;
  saveAnswer: (questionId: string, value: string | string[] | number | null) => void;
  toggleDemand: (demand: PiaraveDemandType) => void;
  updateSafetyPlanDraft: (draft: Partial<PiaraveSafetyPlan>) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  submitPiaraveTriage: () => Promise<void>;

  // Case & PIA Actions (Multidisciplinary Team)
  saveSafetyPlan: (caseId: string, plan: PiaraveSafetyPlan) => void;
  updatePiaDetails: (caseId: string, general: string, specific: string, commitments: string) => void;
  addGoalToPia: (caseId: string, goal: Omit<PiaraveGoal, 'id' | 'status'>) => void;
  updateGoalStatus: (caseId: string, goalId: string, status: PiaraveGoal['status']) => void;
  addEvolutionToCase: (caseId: string, content: string, role: PiaraveEvolution['role']) => void;
  addMeetingToCase: (caseId: string, meeting: Omit<PiaraveMeeting, 'id'>) => void;
  closeCase: (caseId: string) => void;
  reopenCase: (caseId: string) => void;

  // Library curation
  addLibraryItem: (item: Omit<PiaraveLibraryItem, 'id' | 'status' | 'createdAt'>) => void;
  validateLibraryItem: (itemId: string, status: 'approved' | 'rejected', notes: string) => void;

  // Security & Audit (MCSI)
  logAccess: (action: string, dossierId: string, details: string, level: 'standard' | 'elevated' | 'special' | 'maximum') => void;
}

// ============================================================
// Context
// ============================================================

const PiaraveContext = createContext<PiaraveContextType | null>(null);

export const PiaraveProvider = ({ children }: { children: ReactNode }) => {
  const { session: areSession } = useAdaptiveRegistration();
  const { startProcessInstance } = useBPMS();

  const [lines] = useState<PiaraveLine[]>(mockPiaraveLines);
  const [cases, setCases] = useState<PiaraveCase[]>(mockPiaraveCases);
  const [libraryItems, setLibraryItems] = useState<PiaraveLibraryItem[]>(mockPiaraveLibraryItems);
  const [auditLogs, setAuditLogs] = useState<PiaraveAuditLog[]>(mockPiaraveAuditLogs);
  const [activeSession, setActiveSession] = useState<PiaraveSession | null>(null);

  // Security logger
  const logAccess = useCallback((
    action: string,
    dossierId: string,
    details: string,
    level: 'standard' | 'elevated' | 'special' | 'maximum'
  ) => {
    const entry: PiaraveAuditLog = {
      id: `aud-pi-${Date.now()}`,
      action,
      dossierId,
      performedBy: 'Profissional Atual',
      role: 'Equipe Multidisciplinar',
      performedAt: new Date().toISOString(),
      details,
      securityLevel: level,
    };
    setAuditLogs((prev) => [entry, ...prev]);
  }, []);

  // ─────────────────────────────────────────────────────────
  // BENEFICIARY WIZARD
  // ─────────────────────────────────────────────────────────

  const startPiaraveSession = useCallback((registrationId: string, lineId: string) => {
    setActiveSession({
      registrationId,
      lineId,
      currentStep: 1,
      answers: {},
      selectedDemands: [],
      safetyPlanDraft: {
        trustedPersonName: '',
        trustedPersonContact: '',
        emergencyContact: '190',
        safePlaceDescription: '',
        safetyInstructions: '',
        institutionalProtectionNotes: '',
      },
      startedAt: new Date().toISOString(),
      status: 'in_progress',
    });
  }, []);

  const saveAnswer = useCallback((questionId: string, value: string | string[] | number | null) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: { ...prev.answers, [questionId]: value },
      };
    });
  }, []);

  const toggleDemand = useCallback((demand: PiaraveDemandType) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const index = prev.selectedDemands.indexOf(demand);
      const next = [...prev.selectedDemands];
      if (index > -1) {
        next.splice(index, 1);
      } else {
        next.push(demand);
      }
      return {
        ...prev,
        selectedDemands: next,
      };
    });
  }, []);

  const updateSafetyPlanDraft = useCallback((draft: Partial<PiaraveSafetyPlan>) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        safetyPlanDraft: { ...prev.safetyPlanDraft, ...draft },
      };
    });
  }, []);

  const goToNextStep = useCallback(() => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return { ...prev, currentStep: prev.currentStep + 1 };
    });
  }, []);

  const goToPrevStep = useCallback(() => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return { ...prev, currentStep: Math.max(1, prev.currentStep - 1) };
    });
  }, []);

  const submitPiaraveTriage = useCallback(async () => {
    if (!activeSession) return;

    // Simulate API save
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const name = (areSession.answers['full_name'] as string) || 'Beneficiário Anônimo';
    const profile = areSession.profile || 'adult_civilian';
    const iip = areSession.iipScore;
    const priority = areSession.priorityLevel;
    const security = areSession.securityLevel;

    // Map draft safety plan to standard
    const safetyPlan: PiaraveSafetyPlan = {
      id: `saf-${Date.now()}`,
      registrationId: activeSession.registrationId,
      trustedPersonName: activeSession.safetyPlanDraft?.trustedPersonName || '',
      trustedPersonContact: activeSession.safetyPlanDraft?.trustedPersonContact || '',
      emergencyContact: activeSession.safetyPlanDraft?.emergencyContact || '190',
      safePlaceDescription: activeSession.safetyPlanDraft?.safePlaceDescription || '',
      safetyInstructions: activeSession.safetyPlanDraft?.safetyInstructions || '',
      institutionalProtectionNotes: 'Registrado em triagem inicial PIARAVE.',
      lastUpdatedAt: new Date().toISOString(),
      updatedBy: 'Autocadastro Beneficiário',
      isEncrypted: true,
    };

    const newCase: PiaraveCase = {
      id: `CAS-PIARAVE-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      registrationId: activeSession.registrationId,
      beneficiaryName: name,
      beneficiaryProfile: profile,
      priorityLevel: priority,
      securityLevel: security,
      demandsReported: activeSession.selectedDemands,
      safetyPlan,
      piaGeneralObjectives: 'Estabilização de humor, rompimento de ciclo de violência e segurança física.',
      piaSpecificObjectives: 'Mapear rede de apoio e acompanhar sessões semanais multidisciplinares.',
      piaFamilyCommitments: 'Comparecer às chamadas e manter plano de segurança atualizado.',
      piaVersion: 1,
      piaGoals: [],
      evolutions: [
        {
          id: `ev-${Date.now()}`,
          date: new Date().toISOString(),
          professionalName: 'Triagem Inteligente (Sistema)',
          role: 'assistente_social',
          content: `Acolhimento PIARAVE finalizado pelo beneficiário. Demandas reportadas: ${activeSession.selectedDemands.join(
            ', '
          )}. Plano de Segurança provisório criado.`,
          signed: true,
          signatureHash: `sha256-system-${Date.now()}`,
        },
      ],
      meetings: [],
      status: 'pending_evaluation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCases((prev) => [newCase, ...prev]);
    setActiveSession(null);

    // Disparar Workflow automático de violência relacional
    try {
      await startProcessInstance('acolhimento-piarave', {
        caseId: newCase.id,
        beneficiaryName: name,
        priorityLevel: priority,
        securityLevel: security,
        demandsCount: activeSession.selectedDemands.length,
      });
    } catch (e) {
      console.warn('Erro ao acionar workflow automático no BPMS:', e);
    }
  }, [activeSession, areSession, startProcessInstance]);

  // ─────────────────────────────────────────────────────────
  // CASE & PIA ACTIONS
  // ─────────────────────────────────────────────────────────

  const saveSafetyPlan = useCallback((caseId: string, plan: PiaraveSafetyPlan) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              safetyPlan: { ...plan, lastUpdatedAt: new Date().toISOString(), updatedBy: 'Equipe Multidisciplinar' },
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    logAccess('safety_plan_updated', caseId, 'Atualizou o Plano de Segurança.', 'special');
  }, [logAccess]);

  const updatePiaDetails = useCallback((
    caseId: string,
    general: string,
    specific: string,
    commitments: string
  ) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              piaGeneralObjectives: general,
              piaSpecificObjectives: specific,
              piaFamilyCommitments: commitments,
              piaVersion: c.piaVersion + 1,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    logAccess('pia_updated', caseId, 'Atualizou os objetivos e compromissos do PIA.', 'standard');
  }, [logAccess]);

  const addGoalToPia = useCallback((caseId: string, goal: Omit<PiaraveGoal, 'id' | 'status'>) => {
    const newGoal: PiaraveGoal = {
      ...goal,
      id: `g-${Date.now()}`,
      status: 'PENDING',
    };
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              piaGoals: [...c.piaGoals, newGoal],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    logAccess('pia_goal_added', caseId, `Adicionou nova meta: ${goal.description}`, 'standard');
  }, [logAccess]);

  const updateGoalStatus = useCallback((caseId: string, goalId: string, status: PiaraveGoal['status']) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              piaGoals: c.piaGoals.map((g) => (g.id === goalId ? { ...g, status } : g)),
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    logAccess('pia_goal_updated', caseId, `Atualizou status da meta ${goalId} para ${status}`, 'standard');
  }, [logAccess]);

  const addEvolutionToCase = useCallback((
    caseId: string,
    content: string,
    role: PiaraveEvolution['role']
  ) => {
    const evolution: PiaraveEvolution = {
      id: `ev-${Date.now()}`,
      date: new Date().toISOString(),
      professionalName: 'Profissional da Equipe',
      role,
      content,
      signed: true,
      signatureHash: `sha256-signed-${Math.floor(Math.random() * 999999)}`,
    };
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              evolutions: [...c.evolutions, evolution],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    logAccess('evolution_added', caseId, `Adicionou evolução clínica (${role}).`, 'elevated');
  }, [logAccess]);

  const addMeetingToCase = useCallback((caseId: string, meeting: Omit<PiaraveMeeting, 'id'>) => {
    const newMeeting: PiaraveMeeting = {
      ...meeting,
      id: `meet-${Date.now()}`,
    };
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              meetings: [...c.meetings, newMeeting],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    logAccess('meeting_added', caseId, 'Registrou reunião de alinhamento multidisciplinar.', 'standard');
  }, [logAccess]);

  const closeCase = useCallback((caseId: string) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: 'completed', updatedAt: new Date().toISOString() } : c))
    );
    logAccess('case_closed', caseId, 'Caso encerrado / Alta concedida.', 'standard');
  }, [logAccess]);

  const reopenCase = useCallback((caseId: string) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: 'reopened', updatedAt: new Date().toISOString() } : c))
    );
    logAccess('case_reopened', caseId, 'Caso reaberto para acompanhamento continuado.', 'standard');
  }, [logAccess]);

  // ─────────────────────────────────────────
  // LIBRARY CURATION
  // ─────────────────────────────────────────

  const addLibraryItem = useCallback((item: Omit<PiaraveLibraryItem, 'id' | 'status' | 'createdAt'>) => {
    const newItem: PiaraveLibraryItem = {
      ...item,
      id: `lib-${Date.now()}`,
      status: 'pending_validation',
      createdAt: new Date().toISOString(),
    };
    setLibraryItems((prev) => [newItem, ...prev]);
  }, []);

  const validateLibraryItem = useCallback((itemId: string, status: 'approved' | 'rejected', notes: string) => {
    setLibraryItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status,
              validatedBy: 'Validador Técnico',
              validatedAt: new Date().toISOString(),
              validationNotes: notes,
            }
          : item
      )
    );
  }, []);

  return (
    <PiaraveContext.Provider
      value={{
        lines,
        cases,
        libraryItems,
        auditLogs,
        activeSession,
        startPiaraveSession,
        saveAnswer,
        toggleDemand,
        updateSafetyPlanDraft,
        goToNextStep,
        goToPrevStep,
        submitPiaraveTriage,
        saveSafetyPlan,
        updatePiaDetails,
        addGoalToPia,
        updateGoalStatus,
        addEvolutionToCase,
        addMeetingToCase,
        closeCase,
        reopenCase,
        addLibraryItem,
        validateLibraryItem,
        logAccess,
      }}
    >
      {children}
    </PiaraveContext.Provider>
  );
};

export const usePiarave = () => {
  const ctx = useContext(PiaraveContext);
  if (!ctx) throw new Error('usePiarave must be used inside PiaraveProvider');
  return ctx;
};
