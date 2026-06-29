import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  SataiProtocol,
  SataiProgram,
  SataiSession,
  SataiDossier,
  SataiAuditLog,
  SataiAuditAction,
} from '../types/satai';
import {
  mockProtocols,
  mockDossiers,
  mockPrograms,
  mockAuditLogs,
  questoesAcolhimentoGeral,
} from '../data/satai-mock';
import { useAdaptiveRegistration } from './AdaptiveRegistrationContext';
import { useBPMS } from './BPMSContext';

// ============================================================
// Context Interface
// ============================================================

interface SATAIContextType {
  // Estado
  protocols: SataiProtocol[];
  dossiers: SataiDossier[];
  programs: SataiProgram[];
  auditLogs: SataiAuditLog[];
  activeSession: SataiSession | null;
  selectedProtocol: SataiProtocol | null;
  isSubmitting: boolean;

  // ── Triagem (Wizard) ──────────────────────────────────────
  startTriageSession: (registrationId: string) => void;
  saveAnswer: (questionId: string, value: string | string[] | number | null) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  submitTriage: () => Promise<void>;

  // ── Gestão de Protocolos (No-Code Builder) ────────────────
  saveProtocol: (protocol: SataiProtocol) => void;
  createProtocol: (name: string, targetProfile: string, programIds: string[]) => SataiProtocol;
  cloneProtocol: (protocolId: string) => SataiProtocol | null;
  publishProtocol: (protocolId: string, changelog: string) => void;
  archiveProtocol: (protocolId: string) => void;
  deleteProtocolDraft: (protocolId: string) => void;

  // ── Gestão de Programas ───────────────────────────────────
  saveProgram: (program: SataiProgram) => void;
  createProgram: (name: string, code: string, type: SataiProgram['type']) => SataiProgram;
  linkProtocolToProgram: (protocolId: string, programId: string) => void;
  unlinkProtocolFromProgram: (protocolId: string, programId: string) => void;

  // ── Revisão de Dossiês ────────────────────────────────────
  acceptDossier: (dossierId: string, professionalId: string, notes?: string) => Promise<void>;
  rejectDossier: (dossierId: string, notes?: string) => Promise<void>;
  referDossier: (dossierId: string, professionalId: string, workflowId: string, notes: string) => Promise<void>;

  // ── Acessibilidade ────────────────────────────────────────
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
  const [programs, setPrograms] = useState<SataiProgram[]>(mockPrograms);
  const [auditLogs, setAuditLogs] = useState<SataiAuditLog[]>(mockAuditLogs);
  const [activeSession, setActiveSession] = useState<SataiSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Acessibilidade
  const [fontSizeClass, setFontSizeClass] = useState<'text-normal' | 'text-large' | 'text-xlarge'>('text-normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // ─────────────────────────────────────────────────────────
  // AUDITORIA
  // ─────────────────────────────────────────────────────────

  const addAuditLog = useCallback((
    action: SataiAuditAction,
    entityType: SataiAuditLog['entityType'],
    entityId: string,
    entityName: string,
    details: string
  ) => {
    const log: SataiAuditLog = {
      id: `audit-${Date.now()}`,
      action,
      entityType,
      entityId,
      entityName,
      performedBy: 'Usuário Atual',
      performedAt: new Date().toISOString(),
      details,
    };
    setAuditLogs(prev => [log, ...prev]);
  }, []);

  // ─────────────────────────────────────────────────────────
  // SELEÇÃO DE PROTOCOLO POR PERFIL
  // ─────────────────────────────────────────────────────────

  const getProtocolForProfile = useCallback((profile: string | null): SataiProtocol => {
    const published = protocols.filter(p => p.status === 'published' && p.active);

    if (profile === 'elderly') {
      const match = published.find(p => p.id === 'prot-005' || p.targetProfile === 'elderly');
      if (match) return match;
    }
    if (profile === 'minor') {
      const match = published.find(p => p.targetProfile === 'minor');
      if (match) return match;
    }

    return published.find(p => p.id === 'prot-001') || published[0] || protocols[0];
  }, [protocols]);

  const selectedProtocol = activeSession
    ? getProtocolForProfile(areSession.profile)
    : null;

  // ─────────────────────────────────────────────────────────
  // TRIAGEM — WIZARD
  // ─────────────────────────────────────────────────────────

  const startTriageSession = useCallback((registrationId: string) => {
    const protocol = getProtocolForProfile(areSession.profile);
    setActiveSession({
      id: `sat-${Date.now()}`,
      registrationId,
      protocolId: protocol?.id || 'prot-001',
      protocolVersion: protocol?.version || '1.0',
      currentStep: 1,
      totalSteps: protocol?.questions?.length || 8,
      answers: {},
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      status: 'in_progress',
      alertsTriggered: [],
      intermediateScore: 0,
    });
  }, [areSession.profile, getProtocolForProfile]);

  const saveAnswer = useCallback((questionId: string, value: string | string[] | number | null) => {
    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        answers: { ...prev.answers, [questionId]: value },
        lastUpdatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const goToNextStep = useCallback(() => {
    setActiveSession(prev => {
      if (!prev) return null;
      return { ...prev, currentStep: prev.currentStep + 1 };
    });
  }, []);

  const goToPrevStep = useCallback(() => {
    setActiveSession(prev => {
      if (!prev) return null;
      return { ...prev, currentStep: Math.max(1, prev.currentStep - 1) };
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // IA COPILOTO (SIMULADO)
  // ─────────────────────────────────────────────────────────

  const runAiCopilotSynthesis = (
    answers: Record<string, string | string[] | number | null>,
    profile: string,
    name: string,
    protocol: SataiProtocol | null
  ) => {
    let aiSummary = `${name} concluiu o acolhimento inicial via protocolo "${protocol?.name || 'Geral'}". `;
    const factors: string[] = [];
    const inconsistencies: string[] = [];
    const riskFlags: string[] = [];
    const alertsTriggered: string[] = [];

    // Varrer respostas em busca de alertas
    if (protocol) {
      for (const question of protocol.questions) {
        const answer = answers[question.id];
        if (!answer || !question.options) continue;

        const values = Array.isArray(answer) ? answer : [String(answer)];
        for (const v of values) {
          const option = question.options.find(o => o.value === v);
          if (option?.triggerAlert) {
            alertsTriggered.push(question.id);
            riskFlags.push(option.label.toUpperCase());
          }
        }
      }
    }

    // Fatores de atenção baseados no conteúdo
    if (Object.values(answers).some(v => {
      const s = String(v ?? '').toLowerCase();
      return protocol?.alertKeywords?.some(kw => s.includes(kw.toLowerCase()));
    })) {
      factors.push('Palavras-chave de alerta detectadas nas respostas');
    }

    if (riskFlags.length > 2) {
      aiSummary += `Múltiplos indicadores de risco identificados: ${riskFlags.slice(0, 3).join(', ')}. `;
    }

    if (profile === 'elderly') {
      factors.push('Beneficiário idoso — verificar suporte familiar e autonomia');
    }
    if (profile === 'minor') {
      factors.push('Menor de idade — acionar responsável legal e verificar sistema de garantia de direitos');
    }

    const recommended: string[] = [];
    if (alertsTriggered.length > 0) {
      recommended.push('prot-002', 'prot-003');
      aiSummary += 'Recomenda-se encaminhamento para avaliação especializada. ';
    }

    return {
      summary: aiSummary || 'Acolhimento concluído sem alertas críticos identificados.',
      factors,
      inconsistencies,
      recommended,
      alertsTriggered,
      riskFlags,
    };
  };

  // ─────────────────────────────────────────────────────────
  // SUBMISSÃO DE TRIAGEM
  // ─────────────────────────────────────────────────────────

  const submitTriage = useCallback(async () => {
    if (!activeSession) return;
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const name = (areSession.answers['full_name'] as string) || 'Beneficiário Anônimo';
    const profile = areSession.profile || 'adult_civilian';
    const iip = areSession.iipScore;
    const priority = areSession.priorityLevel;
    const security = areSession.securityLevel;
    const motives = (areSession.answers['attendance_motives'] as string[]) || [];
    const protocol = getProtocolForProfile(profile);

    const aiResult = runAiCopilotSynthesis(activeSession.answers, profile, name, protocol);

    const newDossier: SataiDossier = {
      id: `DOS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      registrationId: activeSession.registrationId,
      sessionId: activeSession.id,
      protocolId: protocol?.id || 'prot-001',
      protocolName: protocol?.name || 'Acolhimento Geral',
      programIds: protocol?.programIds || [],
      beneficiaryName: name,
      beneficiaryProfile: profile,
      iipScore: iip,
      priorityLevel: priority,
      securityLevel: security,
      attendanceMotives: motives,
      protocolAnswers: activeSession.answers,
      factorsOfAttention: aiResult.factors,
      alertsTriggered: aiResult.alertsTriggered,
      aiSummary: aiResult.summary,
      aiInconsistencies: aiResult.inconsistencies,
      aiRecommendedProtocols: aiResult.recommended,
      aiRiskFlags: aiResult.riskFlags,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    };

    setDossiers(prev => [newDossier, ...prev]);
    setActiveSession(prev => (prev ? { ...prev, status: 'completed' } : null));
    setIsSubmitting(false);

    addAuditLog('session_completed', 'session', activeSession.id, name, `Dossiê ${newDossier.id} gerado com prioridade ${priority}.`);

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
  }, [activeSession, areSession, getProtocolForProfile, addAuditLog, startProcessInstance]);

  // ─────────────────────────────────────────────────────────
  // GESTÃO DE PROTOCOLOS (NO-CODE BUILDER)
  // ─────────────────────────────────────────────────────────

  const saveProtocol = useCallback((protocol: SataiProtocol) => {
    setProtocols(prev => {
      const exists = prev.some(p => p.id === protocol.id);
      if (exists) {
        return prev.map(p => p.id === protocol.id ? { ...protocol, updatedAt: new Date().toISOString() } : p);
      }
      return [...prev, protocol];
    });
    addAuditLog('protocol_updated', 'protocol', protocol.id, protocol.name, `Protocolo "${protocol.name}" atualizado.`);
  }, [addAuditLog]);

  const createProtocol = useCallback((
    name: string,
    targetProfile: string,
    programIds: string[]
  ): SataiProtocol => {
    const id = `prot-${Date.now()}`;
    const now = new Date().toISOString();
    const newProtocol: SataiProtocol = {
      id,
      name,
      code: `PROT-${Date.now().toString().slice(-6)}`,
      description: '',
      objective: '',
      targetProfile: targetProfile as SataiProtocol['targetProfile'],
      targetAudience: '',
      active: false,
      version: '0.1',
      status: 'draft',
      programIds,
      sector: '',
      responsibleTeam: '',
      estimatedDurationMin: 20,
      requiresProfessionalReview: false,
      alertKeywords: [],
      priorityEscalation: false,
      lgpdSensitiveData: false,
      createdBy: 'Usuário Atual',
      createdAt: now,
      updatedAt: now,
      versionHistory: [],
      questions: questoesAcolhimentoGeral.map(q => ({ ...q })),
    };
    setProtocols(prev => [...prev, newProtocol]);
    addAuditLog('protocol_created', 'protocol', id, name, `Novo protocolo "${name}" criado em rascunho.`);
    return newProtocol;
  }, [addAuditLog]);

  const cloneProtocol = useCallback((protocolId: string): SataiProtocol | null => {
    const source = protocols.find(p => p.id === protocolId);
    if (!source) return null;
    const now = new Date().toISOString();
    const id = `prot-${Date.now()}`;
    const cloned: SataiProtocol = {
      ...source,
      id,
      name: `${source.name} (Cópia)`,
      code: `${source.code}-COPIA`,
      status: 'draft',
      version: '0.1',
      active: false,
      versionHistory: [],
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined,
      archivedAt: undefined,
      questions: source.questions.map(q => ({ ...q, id: `${q.id}-clone` })),
    };
    setProtocols(prev => [...prev, cloned]);
    addAuditLog('protocol_cloned', 'protocol', id, cloned.name, `Clonado a partir de "${source.name}" (${source.code}).`);
    return cloned;
  }, [protocols, addAuditLog]);

  const publishProtocol = useCallback((protocolId: string, changelog: string) => {
    setProtocols(prev => prev.map(p => {
      if (p.id !== protocolId) return p;
      const now = new Date().toISOString();
      const versionParts = p.version.split('.').map(Number);
      const newMinor = versionParts[1] + 1;
      const newVersion = `${versionParts[0]}.${newMinor}`;
      return {
        ...p,
        status: 'published',
        active: true,
        version: newVersion,
        publishedAt: now,
        updatedAt: now,
        versionHistory: [
          ...p.versionHistory,
          {
            version: newVersion,
            status: 'published',
            publishedAt: now,
            publishedBy: 'Usuário Atual',
            changelog,
            questionSnapshot: [...p.questions],
          },
        ],
      };
    }));
    const proto = protocols.find(p => p.id === protocolId);
    if (proto) {
      addAuditLog('protocol_published', 'protocol', protocolId, proto.name, `Protocolo publicado. Changelog: ${changelog}`);
    }
  }, [protocols, addAuditLog]);

  const archiveProtocol = useCallback((protocolId: string) => {
    setProtocols(prev => prev.map(p => {
      if (p.id !== protocolId) return p;
      const now = new Date().toISOString();
      return {
        ...p,
        status: 'archived',
        active: false,
        archivedAt: now,
        updatedAt: now,
      };
    }));
    const proto = protocols.find(p => p.id === protocolId);
    if (proto) {
      addAuditLog('protocol_archived', 'protocol', protocolId, proto.name, `Protocolo arquivado.`);
    }
  }, [protocols, addAuditLog]);

  const deleteProtocolDraft = useCallback((protocolId: string) => {
    setProtocols(prev => prev.filter(p => !(p.id === protocolId && p.status === 'draft')));
  }, []);

  // ─────────────────────────────────────────────────────────
  // GESTÃO DE PROGRAMAS
  // ─────────────────────────────────────────────────────────

  const saveProgram = useCallback((program: SataiProgram) => {
    setPrograms(prev => {
      const exists = prev.some(p => p.id === program.id);
      if (exists) {
        return prev.map(p => p.id === program.id ? { ...program, updatedAt: new Date().toISOString() } : p);
      }
      return [...prev, program];
    });
    addAuditLog('program_updated', 'program', program.id, program.name, `Programa "${program.name}" atualizado.`);
  }, [addAuditLog]);

  const createProgram = useCallback((
    name: string,
    code: string,
    type: SataiProgram['type']
  ): SataiProgram => {
    const now = new Date().toISOString();
    const newProgram: SataiProgram = {
      id: `prog-${Date.now()}`,
      name,
      code,
      type,
      description: '',
      targetAudience: '',
      responsibleSector: '',
      startDate: now.split('T')[0],
      active: true,
      beneficiaryCount: 0,
      linkedProtocolIds: [],
      createdBy: 'Usuário Atual',
      createdAt: now,
      updatedAt: now,
    };
    setPrograms(prev => [...prev, newProgram]);
    addAuditLog('program_created', 'program', newProgram.id, name, `Programa "${name}" (${code}) criado.`);
    return newProgram;
  }, [addAuditLog]);

  const linkProtocolToProgram = useCallback((protocolId: string, programId: string) => {
    setPrograms(prev => prev.map(p =>
      p.id === programId && !p.linkedProtocolIds.includes(protocolId)
        ? { ...p, linkedProtocolIds: [...p.linkedProtocolIds, protocolId], updatedAt: new Date().toISOString() }
        : p
    ));
    setProtocols(prev => prev.map(p =>
      p.id === protocolId && !p.programIds.includes(programId)
        ? { ...p, programIds: [...p.programIds, programId], updatedAt: new Date().toISOString() }
        : p
    ));
    const proto = protocols.find(p => p.id === protocolId);
    const prog = programs.find(p => p.id === programId);
    if (proto && prog) {
      addAuditLog('program_linked', 'protocol', protocolId, proto.name, `Vinculado ao programa "${prog.name}".`);
    }
  }, [protocols, programs, addAuditLog]);

  const unlinkProtocolFromProgram = useCallback((protocolId: string, programId: string) => {
    setPrograms(prev => prev.map(p =>
      p.id === programId
        ? { ...p, linkedProtocolIds: p.linkedProtocolIds.filter(id => id !== protocolId) }
        : p
    ));
    setProtocols(prev => prev.map(p =>
      p.id === protocolId
        ? { ...p, programIds: p.programIds.filter(id => id !== programId) }
        : p
    ));
  }, []);

  // ─────────────────────────────────────────────────────────
  // REVISÃO DE DOSSIÊS
  // ─────────────────────────────────────────────────────────

  const acceptDossier = useCallback(async (dossierId: string, professionalId: string, notes?: string) => {
    setDossiers(prev => prev.map(d =>
      d.id === dossierId
        ? {
          ...d, status: 'accepted',
          assignedProfessionalId: professionalId,
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Usuário Atual',
          referralNotes: notes,
        }
        : d
    ));
    const d = dossiers.find(d => d.id === dossierId);
    if (d) addAuditLog('dossier_accepted', 'dossier', dossierId, d.beneficiaryName, `Dossiê aceito. Profissional: ${professionalId}.`);
  }, [dossiers, addAuditLog]);

  const rejectDossier = useCallback(async (dossierId: string, notes?: string) => {
    setDossiers(prev => prev.map(d =>
      d.id === dossierId
        ? { ...d, status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: 'Usuário Atual', referralNotes: notes }
        : d
    ));
    const d = dossiers.find(d => d.id === dossierId);
    if (d) addAuditLog('dossier_rejected', 'dossier', dossierId, d.beneficiaryName, `Dossiê rejeitado. Motivo: ${notes || 'não informado'}.`);
  }, [dossiers, addAuditLog]);

  const referDossier = useCallback(async (
    dossierId: string,
    professionalId: string,
    workflowId: string,
    notes: string
  ) => {
    setDossiers(prev => prev.map(d =>
      d.id === dossierId
        ? {
          ...d, status: 'referred',
          assignedProfessionalId: professionalId,
          recommendedWorkflowId: workflowId,
          referralNotes: notes,
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Usuário Atual',
        }
        : d
    ));
    const d = dossiers.find(d => d.id === dossierId);
    if (d) addAuditLog('dossier_referred', 'dossier', dossierId, d.beneficiaryName, `Encaminhado para workflow "${workflowId}". Notas: ${notes}`);
  }, [dossiers, addAuditLog]);

  // ─────────────────────────────────────────────────────────
  // PROVIDER
  // ─────────────────────────────────────────────────────────

  return (
    <SATAIContext.Provider
      value={{
        protocols,
        dossiers,
        programs,
        auditLogs,
        activeSession,
        selectedProtocol,
        isSubmitting,
        startTriageSession,
        saveAnswer,
        goToNextStep,
        goToPrevStep,
        submitTriage,
        saveProtocol,
        createProtocol,
        cloneProtocol,
        publishProtocol,
        archiveProtocol,
        deleteProtocolDraft,
        saveProgram,
        createProgram,
        linkProtocolToProgram,
        unlinkProtocolFromProgram,
        acceptDossier,
        rejectDossier,
        referDossier,
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
