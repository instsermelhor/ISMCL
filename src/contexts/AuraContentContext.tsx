/**
 * AuraContentContext
 * ------------------------------------------------------------------
 * Gerencia o conteúdo institucional editável exibido na tela inicial
 * do Projeto Aura (IAMLogin). Dados persistidos via localStorage.
 * Somente Super Administradores podem editar via IAMCenter.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

// ----------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------

export interface AuraContentSection {
  id: string;
  /** Título curto da seção */
  title: string;
  /** Corpo em texto puro (suporta \n para parágrafos) */
  body: string;
  /** Cor da barra lateral: 'teal' | 'sky' | 'rose' | 'amber' */
  accentColor: 'teal' | 'sky' | 'rose' | 'amber';
}

export interface AuraLandingContent {
  /** Badge de destaque topo */
  badgeText: string;
  /** Título principal (H2) */
  headline: string;
  /** Subtítulo abaixo do título */
  subheadline: string;
  /** Introdução: parágrafo principal */
  introText: string;
  /** Público atendido (itens de lista) */
  audienceItems: string[];
  /** Seções com bordas coloridas */
  sections: AuraContentSection[];
  /** Aviso de disponibilidade no rodapé do bloco */
  availabilityNote: string;
  /** Botões de ação rápida */
  quickActions: Array<{
    id: string;
    label: string;
    emoji: string;
    route: string;
    colorClass: string;
  }>;
  /** Metadados */
  lastEditedBy?: string;
  lastEditedAt?: string;
  version: number;
}

// ----------------------------------------------------------------
// Padrão institucional
// ----------------------------------------------------------------

export const DEFAULT_AURA_CONTENT: AuraLandingContent = {
  badgeText: '✨ Ecossistema de Cuidado e Acolhimento',
  headline:
    'Projeto Aura: Um ecossistema de cuidado, acolhimento e desenvolvimento humano',
  subheadline:
    'Tecnologia a serviço da saúde mental, da assistência social e da proteção de direitos.',
  introText:
    'O Projeto Aura é um ecossistema digital criado pelo Instituto Ser Melhor para conectar você a uma rede de acolhimento, orientação e acompanhamento integral. Não se trata de uma plataforma comercial, de um aplicativo de mercado ou de um serviço privado, mas de uma iniciativa social desenhada para apoiar pessoas por meio de acolhimento, cuidado, orientação e acesso a uma rede de profissionais dedicados.\n\nDesenvolvido sob princípios de respeito à dignidade humana, ética e atuação interdisciplinar, o ecossistema apoia:',
  audienceItems: [
    'Pessoas em situação de vulnerabilidade social em busca de suporte emocional.',
    'Mulheres, homens, idosos, crianças e adolescentes (acompanhados por seus responsáveis legais) que vivenciam relações abusivas e violência doméstica.',
    'Integrantes das forças de segurança pública por meio de protocolos especializados de confidencialidade e cuidado (CAFS).',
  ],
  sections: [
    {
      id: 'how-it-works',
      title: 'Como funciona o acolhimento?',
      body: 'O primeiro contato ocorre por meio de um processo estruturado de cadastro inteligente e acolhimento digital humanizado. A finalidade desta triagem estruturada é compreender a sua situação apresentada para planejar o encaminhamento correto e adequado dentro de nossos programas.\n\n⚠️ Importante: O preenchimento destas informações iniciais é de caráter organizacional e não substitui avaliação clínica profissional, diagnósticos de saúde ou orientações jurídicas individualizadas.',
      accentColor: 'teal',
    },
    {
      id: 'privacy',
      title: 'Privacidade e Proteção de Dados',
      body: 'Suas informações pessoais são tratadas de forma estritamente confidencial. O acesso aos registros ocorre de forma controlada apenas por colaboradores autorizados conforme suas atribuições técnicas e regulamentos do Instituto. A plataforma adota múltiplos níveis de proteção, observando integralmente a Lei Geral de Proteção de Dados (LGPD).',
      accentColor: 'sky',
    },
  ],
  availabilityNote:
    'Esclarecemos que a disponibilidade de cada recurso, teleatendimento ou modalidade de acompanhamento dependerá de avaliação técnica prévia das equipes de acolhimento e das regras vigentes do Instituto Ser Melhor.',
  quickActions: [
    {
      id: 'register',
      label: 'Iniciar Cadastro',
      emoji: '📋',
      route: '/registro',
      colorClass:
        'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
    },
    {
      id: 'welcoming',
      label: 'Fazer Acolhimento',
      emoji: '🤝',
      route: '/acolhimento',
      colorClass:
        'bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400',
    },
    {
      id: 'library',
      label: 'Biblioteca Relacional',
      emoji: '📚',
      route: '/piarave/biblioteca',
      colorClass:
        'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400',
    },
  ],
  version: 1,
};

// ----------------------------------------------------------------
// Context
// ----------------------------------------------------------------

interface AuraContentContextValue {
  content: AuraLandingContent;
  isDirty: boolean;
  isSaving: boolean;
  updateContent: (patch: Partial<AuraLandingContent>) => void;
  updateSection: (id: string, patch: Partial<AuraContentSection>) => void;
  addSection: (section: Omit<AuraContentSection, 'id'>) => void;
  removeSection: (id: string) => void;
  reorderSections: (ids: string[]) => void;
  saveContent: (editorName: string) => Promise<void>;
  resetToDefault: () => void;
  discardChanges: () => void;
}

const AuraContentContext = createContext<AuraContentContextValue | null>(null);

const STORAGE_KEY = 'aura_landing_content_v1';

function loadFromStorage(): AuraLandingContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuraLandingContent;
  } catch {
    // fallback
  }
  return DEFAULT_AURA_CONTENT;
}

function saveToStorage(content: AuraLandingContent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  } catch {
    // ignore
  }
}

// ----------------------------------------------------------------
// Provider
// ----------------------------------------------------------------

export function AuraContentProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<AuraLandingContent>(loadFromStorage);
  const [draft, setDraft] = useState<AuraLandingContent>(saved);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sincroniza dirty state
  useEffect(() => {
    setIsDirty(JSON.stringify(draft) !== JSON.stringify(saved));
  }, [draft, saved]);

  const updateContent = useCallback((patch: Partial<AuraLandingContent>) => {
    setDraft(prev => ({ ...prev, ...patch }));
  }, []);

  const updateSection = useCallback(
    (id: string, patch: Partial<AuraContentSection>) => {
      setDraft(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === id ? { ...s, ...patch } : s
        ),
      }));
    },
    []
  );

  const addSection = useCallback((section: Omit<AuraContentSection, 'id'>) => {
    const newSection: AuraContentSection = {
      ...section,
      id: `section-${Date.now()}`,
    };
    setDraft(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  }, []);

  const removeSection = useCallback((id: string) => {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id),
    }));
  }, []);

  const reorderSections = useCallback((ids: string[]) => {
    setDraft(prev => {
      const map = new Map(prev.sections.map(s => [s.id, s]));
      const reordered = ids.map(id => map.get(id)).filter(Boolean) as AuraContentSection[];
      return { ...prev, sections: reordered };
    });
  }, []);

  const saveContent = useCallback(async (editorName: string) => {
    setIsSaving(true);
    // Simula latência de rede
    await new Promise(resolve => setTimeout(resolve, 600));
    const toSave: AuraLandingContent = {
      ...draft,
      lastEditedBy: editorName,
      lastEditedAt: new Date().toISOString(),
      version: draft.version + 1,
    };
    saveToStorage(toSave);
    setSaved(toSave);
    setDraft(toSave);
    setIsDirty(false);
    setIsSaving(false);
  }, [draft]);

  const resetToDefault = useCallback(() => {
    setDraft(DEFAULT_AURA_CONTENT);
  }, []);

  const discardChanges = useCallback(() => {
    setDraft(saved);
  }, [saved]);

  return (
    <AuraContentContext.Provider
      value={{
        content: draft,
        isDirty,
        isSaving,
        updateContent,
        updateSection,
        addSection,
        removeSection,
        reorderSections,
        saveContent,
        resetToDefault,
        discardChanges,
      }}
    >
      {children}
    </AuraContentContext.Provider>
  );
}

// ----------------------------------------------------------------
// Hook
// ----------------------------------------------------------------

export function useAuraContent() {
  const ctx = useContext(AuraContentContext);
  if (!ctx) throw new Error('useAuraContent must be used inside AuraContentProvider');
  return ctx;
}
