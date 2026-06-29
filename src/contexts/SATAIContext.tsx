import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { SataiProtocol, SataiSession, SataiDossier } from '../types/satai';
import { mockProtocols, mockDossiers } from '../data/satai-mock';
import { useAdaptiveRegistration } from './AdaptiveRegistrationContext';
import { useBPMS } from './BPMSContext';

// ============================================================
// Context Interface
// ============================================================

interface SATAIContextType {
  protocols: SataiProtocol[];
  dossiers: SataiDossier[];
  activeSession: SataiSession | null;
  selectedProtocol: SataiProtocol | null;
  isSubmitting: boolean;
  
  // Ações de Triagem
  startTriageSession: (registrationId: string) => void;
  saveAnswer: (questionId: string, value: string | string[] | number | null) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  submitTriage: () => Promise<void>;
  
  // Ações Administrativas (No-Code Protocols & Review)
  saveProtocol: (protocol: SataiProtocol) => void;
  acceptDossier: (dossierId: string, professionalId: string) => Promise<void>;
  rejectDossier: (dossierId: string) => Promise<void>;
  
  // Helper de Acessibilidade
  fontSizeClass: 'text-normal' | 'text-large' | 'text-xlarge';
  setFontSizeClass: (size: 'text-normal' | 'text-large' | 'text-xlarge') => void;
  highContrast: boolean;
  setHighContrast: (active: boolean) => void;
}

// ============================================================
// Context
// ============================================================

const SATAIContext = createContext<SATAIContextType | null>(null);

export const SATAIProvider = ({ children }: { children: ReactNode }) => {
  const { session: areSession } = useAdaptiveRegistration();
  const { startProcessInstance } = useBPMS();
  
  const [protocols, setProtocols] = useState<SataiProtocol[]>(mockProtocols);
  const [dossiers, setDossiers] = useState<SataiDossier[]>(mockDossiers);
  const [activeSession, setActiveSession] = useState<SataiSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Acessibilidade
  const [fontSizeClass, setFontSizeClass] = useState<'text-normal' | 'text-large' | 'text-xlarge'>('text-normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Determinar qual protocolo institucional carregar
  const getProtocolForProfile = useCallback((profile: string | null): SataiProtocol => {
    if (profile === 'security_forces') {
      return protocols.find((p) => p.id === 'seguranca-publica') || protocols[0];
    }
    if (profile === 'minor') {
      return protocols.find((p) => p.id === 'menores-adaptado') || protocols[0];
    }
    return protocols.find((p) => p.id === 'acolhimento-psicologico') || protocols[0];
  }, [protocols]);

  const selectedProtocol = activeSession 
    ? getProtocolForProfile(areSession.profile)
    : null;

  const startTriageSession = useCallback((registrationId: string) => {
    setActiveSession({
      id: `sat-${Date.now()}`,
      registrationId,
      currentStep: 1,
      answers: {},
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      status: 'in_progress',
    });
  }, []);

  const saveAnswer = useCallback((questionId: string, value: string | string[] | number | null) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: { ...prev.answers, [questionId]: value },
        lastUpdatedAt: new Date().toISOString(),
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

  // Heurística de Copiloto IA (simulada) para estruturação do dossiê inicial
  const runAiCopilotSynthesis = (
    answers: Record<string, any>,
    profile: string,
    name: string
  ) => {
    let aiSummary = `${name} concluiu o acolhimento inicial. `;
    const factors: string[] = [];
    const inconsistencies: string[] = [];

    // Fatores de atenção automáticos baseados nas respostas
    if (answers['psy_mood_frequency'] === 'almost_everyday' || answers['psy_mood_frequency'] === 'half_days') {
      aiSummary += 'Apresenta alta frequência de sintomas correlatos a desânimo ou tristeza severa nas últimas semanas. ';
      factors.push('Acompanhamento emocional prioritário');
    }
    if (answers['mil_traumatic_exposure'] === 'yes') {
      aiSummary += 'Relatou exposição recente a eventos ocupacionais altamente traumáticos. ';
      factors.push('Atenção especial para estresse pós-traumático');
    }
    if (answers['cli_sleep_issue'] === 'severe_insomnia') {
      factors.push('Privação grave de sono / Insônia acentuada');
    }
    if (answers['min_family_conflits'] === 'yes') {
      factors.push('Vivência de conflitos em ambiente intrafamiliar');
    }

    // Inconsistências cadastrais simuladas
    if (profile === 'security_forces' && !areSession.answers['functional_id']) {
      inconsistencies.push('ID funcional não preenchido ou pendente de validação');
    }

    const recommended = ['clinico-inicial'];
    if (profile === 'adult_civilian') recommended.push('acolhimento-psicologico');

    return {
      summary: aiSummary || 'Acolhimento padrão inicial sem novos alertas levantados.',
      factors,
      inconsistencies,
      recommended,
    };
  };

  const submitTriage = useCallback(async () => {
    if (!activeSession) return;
    setIsSubmitting(true);

    // Simula processamento
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const name = (areSession.answers['full_name'] as string) || 'Beneficiário Anônimo';
    const profile = areSession.profile || 'adult_civilian';
    const iip = areSession.iipScore;
    const priority = areSession.priorityLevel;
    const security = areSession.securityLevel;
    const motives = (areSession.answers['attendance_motives'] as string[]) || [];

    const aiResult = runAiCopilotSynthesis(activeSession.answers, profile, name);

    // Gerar dossiê finalizado
    const newDossier: SataiDossier = {
      id: `DOS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      registrationId: activeSession.registrationId,
      beneficiaryName: name,
      beneficiaryProfile: profile,
      iipScore: iip,
      priorityLevel: priority,
      securityLevel: security,
      attendanceMotives: motives,
      protocolAnswers: activeSession.answers,
      factorsOfAttention: aiResult.factors,
      aiSummary: aiResult.summary,
      aiInconsistencies: aiResult.inconsistencies,
      aiRecommendedProtocols: aiResult.recommended,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    };

    setDossiers((prev) => [newDossier, ...prev]);
    setActiveSession((prev) => (prev ? { ...prev, status: 'completed' } : null));
    setIsSubmitting(false);

    // Disparar Workflow correspondente no BPMS
    try {
      const targetWorkflow = priority === 'critical' ? 'acolhimento-critico' : 'acolhimento-inicial';
      await startProcessInstance(targetWorkflow, {
        dossierId: newDossier.id,
        beneficiaryName: name,
        iipScore: iip,
        priorityLevel: priority,
        securityLevel: security,
        profile,
      });
    } catch (e) {
      console.warn('Erro ao acionar workflow automático no BPMS:', e);
    }
  }, [activeSession, areSession, startProcessInstance]);

  // Ações administrativas: Salvar / Editar Protocolo (No-Code Metadata Builder)
  const saveProtocol = useCallback((protocol: SataiProtocol) => {
    setProtocols((prev) => {
      const exists = prev.some((p) => p.id === protocol.id);
      if (exists) {
        return prev.map((p) => (p.id === protocol.id ? protocol : p));
      }
      return [...prev, protocol];
    });
  }, []);

  const acceptDossier = useCallback(async (dossierId: string, professionalId: string) => {
    setDossiers((prev) =>
      prev.map((d) =>
        d.id === dossierId
          ? { ...d, status: 'accepted', assignedProfessionalId: professionalId }
          : d
      )
    );
  }, []);

  const rejectDossier = useCallback(async (dossierId: string) => {
    setDossiers((prev) =>
      prev.map((d) => (d.id === dossierId ? { ...d, status: 'rejected' } : d))
    );
  }, []);

  return (
    <SATAIContext.Provider
      value={{
        protocols,
        dossiers,
        activeSession,
        selectedProtocol,
        isSubmitting,
        startTriageSession,
        saveAnswer,
        goToNextStep,
        goToPrevStep,
        submitTriage,
        saveProtocol,
        acceptDossier,
        rejectDossier,
        fontSizeClass,
        setFontSizeClass,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </SATAIContext.Provider>
  );
};

export const useSATAI = () => {
  const ctx = useContext(SATAIContext);
  if (!ctx) throw new Error('useSATAI must be used inside SATAIProvider');
  return ctx;
};
