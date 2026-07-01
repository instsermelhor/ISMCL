// ============================================================
// SODO — SISTEMA OFICIAL DE DOCUMENTAÇÃO OPERACIONAL
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// CONTEXT
// ============================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  SodoContextType, SodoTab, DocLibrary, DocArticle, DocPOP,
  Course, LearningTrail, UserCertificate, SandboxScenario,
  GovernanceAction, UserReadingEntry, SearchResult, AiMessage,
  AcademyBiMetrics, LibraryCategory,
} from '../types/sodo';
import {
  MOCK_LIBRARIES, MOCK_ARTICLES, MOCK_POPS, MOCK_COURSES,
  MOCK_TRAILS, MOCK_CERTIFICATES, MOCK_SANDBOX_SCENARIOS,
  MOCK_GOVERNANCE_LOG, MOCK_BI_METRICS,
} from '../data/sodo-mock';

const SodoContext = createContext<SodoContextType | null>(null);

// ─── AI Knowledge Base ───────────────────────────────────────
// Simulates semantic search over institutional docs
const AI_KNOWLEDGE: Record<string, { answer: string; articleIds: string[]; courseIds: string[] }> = {
  'cadastro': {
    answer: 'Para cadastrar um novo beneficiário, acesse o módulo ARE (/registro). O sistema conduz o profissional por etapas adaptativas: dados pessoais, situação socioeconômica, vulnerabilidades e consentimento LGPD. Ao final, o IIP é calculado automaticamente e o SATAI é notificado para o acolhimento.',
    articleIds: ['art-001'], courseIds: ['crs-002'],
  },
  'menor': {
    answer: 'Para cadastrar um menor de idade, é obrigatória a presença do responsável legal com documentação comprobatória do vínculo. Ative o protocolo de menor no ARE e vincule o responsável. Os dados serão armazenados automaticamente no Cofre Digital MCSI. Aplique o protocolo SATAI Infanto-Juvenil.',
    articleIds: ['art-001'], courseIds: ['crs-002'],
  },
  'prontuario': {
    answer: 'O Prontuário Eletrônico (PEL) funciona com controle ABAC: cada especialidade vê apenas os dados autorizados. Registre a evolução no campo específico de sua especialidade e assine digitalmente ao final. Após a assinatura, o texto é bloqueado para edição. Adendos podem ser adicionados.',
    articleIds: ['art-003'], courseIds: ['crs-003'],
  },
  'lgpd': {
    answer: 'O Instituto Ser Melhor segue integralmente a LGPD (Lei 13.709/2018). Os dados dos beneficiários são tratados com base legal de consentimento (Art. 7º) e proteção para dados sensíveis de saúde (Art. 11º). O titular pode solicitar acesso, correção, portabilidade e eliminação de seus dados a qualquer momento via Portal do Beneficiário.',
    articleIds: ['art-004', 'art-005'], courseIds: ['crs-004'],
  },
  'teleconsulta': {
    answer: 'Para realizar uma teleconsulta: verifique a agenda, revise o prontuário antes do horário, inicie a sala virtual no TLC e confirme a identidade do beneficiário. Registre a evolução no prontuário durante ou até 24h após o atendimento e assine digitalmente.',
    articleIds: ['art-003'], courseIds: ['crs-003'],
  },
  'piarave': {
    answer: 'O PIARAVE é o programa de acolhimento especializado para vítimas de violência relacional. Acesse /piarave/acolhimento para o wizard de classificação do tipo de abuso. O beneficiário pode criar um Plano de Segurança pessoal, armazenado criptografado no Cofre Digital MCSI. Um caso é aberto automaticamente no GIC.',
    articleIds: ['art-008'], courseIds: ['crs-005'],
  },
  'mfa': {
    answer: 'O MFA (Autenticação Multifator) é obrigatório para todos os usuários da plataforma. Configure seu autenticador TOTP (Google Authenticator, Authy) na primeira sessão de login. O código deve ser inserido a cada acesso, garantindo segurança mesmo em caso de senha comprometida.',
    articleIds: ['art-005'], courseIds: ['crs-001'],
  },
  'seguranca': {
    answer: 'A segurança da plataforma é gerenciada pelo MCSI (Módulo Complementar de Segurança Institucional). Utiliza criptografia AES-256, mascaramento dinâmico, Cofre Digital e trilha de auditoria imutável. Toda operação sobre dados sensíveis é registrada no Audit Vault. Consulte a Política de Segurança ISM-SEG-001 para detalhes.',
    articleIds: ['art-005', 'art-007'], courseIds: ['crs-004'],
  },
};

function searchKnowledge(query: string): { answer: string; articleIds: string[]; courseIds: string[] } | null {
  const lower = query.toLowerCase();
  for (const [key, value] of Object.entries(AI_KNOWLEDGE)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

// ─── Provider ────────────────────────────────────────────────
export function SodoProvider({ children }: { children: React.ReactNode }) {
  const [libraries] = useState<DocLibrary[]>(MOCK_LIBRARIES);
  const [articles, setArticles] = useState<DocArticle[]>(MOCK_ARTICLES);
  const [pops, setPops] = useState<DocPOP[]>(MOCK_POPS);
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [trails] = useState<LearningTrail[]>(MOCK_TRAILS);
  const [certificates, setCertificates] = useState<UserCertificate[]>(MOCK_CERTIFICATES);
  const [sandboxScenarios, setSandboxScenarios] = useState<SandboxScenario[]>(MOCK_SANDBOX_SCENARIOS);
  const [governanceLog, setGovernanceLog] = useState<GovernanceAction[]>(MOCK_GOVERNANCE_LOG);
  const [readingHistory, setReadingHistory] = useState<UserReadingEntry[]>([]);
  const [biMetrics] = useState<AcademyBiMetrics>(MOCK_BI_METRICS);

  const [currentTab, setCurrentTab] = useState<SodoTab>('portal');
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<LibraryCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);
  const [selectedPop, setSelectedPop] = useState<DocPOP | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<SandboxScenario | null>(null);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      id: 'ai-welcome',
      role: 'assistant',
      content: 'Olá! Sou a Ava, a assistente de documentação oficial do Instituto Ser Melhor. Posso te ajudar a encontrar manuais, procedimentos, políticas e cursos. Como posso ajudar?',
      timestamp: new Date().toISOString(),
      suggestedArticles: [
        { id: 'art-006', title: 'Apresentação da Plataforma', code: 'ISM-INS-001' },
        { id: 'art-004', title: 'Política de Privacidade LGPD', code: 'ISM-JUR-001' },
      ],
    },
  ]);

  // ─── Search ─────────────────────────────────────────────
  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const lower = q.toLowerCase();
    const results: SearchResult[] = [
      ...articles
        .filter(a => a.title.toLowerCase().includes(lower) || a.tags.some(t => t.includes(lower)) || a.summary.toLowerCase().includes(lower))
        .map(a => ({ type: 'article' as const, id: a.id, title: a.title, summary: a.summary, library: a.library, relevanceScore: 1, tags: a.tags })),
      ...pops
        .filter(p => p.title.toLowerCase().includes(lower) || p.objective.toLowerCase().includes(lower))
        .map(p => ({ type: 'pop' as const, id: p.id, title: p.title, summary: p.objective, relevanceScore: 0.9, tags: [] })),
      ...courses
        .filter(c => c.title.toLowerCase().includes(lower) || c.description.toLowerCase().includes(lower) || c.tags.some(t => t.includes(lower)))
        .map(c => ({ type: 'course' as const, id: c.id, title: c.title, summary: c.description, relevanceScore: 0.8, tags: c.tags })),
    ];
    setSearchResults(results.slice(0, 12));
  }, [articles, pops, courses]);

  // ─── Navigation ─────────────────────────────────────────
  const selectLibrary = useCallback((lib: LibraryCategory | null) => {
    setSelectedLibrary(lib);
    setSelectedArticle(null);
  }, []);

  const selectArticle = useCallback((id: string | null) => {
    if (!id) { setSelectedArticle(null); return; }
    const article = articles.find(a => a.id === id) || null;
    setSelectedArticle(article);
    if (article) {
      setArticles(prev => prev.map(a => a.id === id ? { ...a, viewCount: a.viewCount + 1 } : a));
      setReadingHistory(prev => {
        const existing = prev.find(r => r.articleId === id);
        if (existing) return prev.map(r => r.articleId === id ? { ...r, lastReadAt: new Date().toISOString(), progressPercent: 100 } : r);
        return [{ articleId: id, lastReadAt: new Date().toISOString(), progressPercent: 0, isFavorite: false }, ...prev];
      });
    }
  }, [articles]);

  const selectPop = useCallback((id: string | null) => {
    setSelectedPop(id ? pops.find(p => p.id === id) || null : null);
  }, [pops]);

  const selectCourse = useCallback((id: string | null) => {
    setSelectedCourse(id ? courses.find(c => c.id === id) || null : null);
  }, [courses]);

  // ─── Favorites ──────────────────────────────────────────
  const toggleFavorite = useCallback((articleId: string) => {
    setReadingHistory(prev => {
      const existing = prev.find(r => r.articleId === articleId);
      if (existing) return prev.map(r => r.articleId === articleId ? { ...r, isFavorite: !r.isFavorite } : r);
      return [{ articleId, lastReadAt: new Date().toISOString(), progressPercent: 0, isFavorite: true }, ...prev];
    });
  }, []);

  const isFavorite = useCallback((articleId: string) => {
    return readingHistory.find(r => r.articleId === articleId)?.isFavorite || false;
  }, [readingHistory]);

  // ─── POP Checklist ──────────────────────────────────────
  const togglePopChecklist = useCallback((popId: string, itemId: string) => {
    setPops(prev => prev.map(p => p.id !== popId ? p : {
      ...p,
      checklist: p.checklist.map(c => c.id === itemId ? { ...c, completed: !c.completed } : c),
    }));
    if (selectedPop?.id === popId) {
      setSelectedPop(prev => prev ? {
        ...prev,
        checklist: prev.checklist.map(c => c.id === itemId ? { ...c, completed: !c.completed } : c),
      } : null);
    }
  }, [selectedPop]);

  // ─── Sandbox ─────────────────────────────────────────────
  const completeSandboxStep = useCallback((scenarioId: string, stepId: string) => {
    setSandboxScenarios(prev => prev.map(s => {
      if (s.id !== scenarioId) return s;
      const updatedSteps = s.steps.map(st => st.id === stepId ? { ...st, completed: true } : st);
      const allDone = updatedSteps.every(st => st.completed);
      return { ...s, steps: updatedSteps, status: allDone ? 'completed' : 'running' };
    }));
    if (selectedScenario?.id === scenarioId) {
      setSelectedScenario(prev => {
        if (!prev) return null;
        const updatedSteps = prev.steps.map(st => st.id === stepId ? { ...st, completed: true } : st);
        const allDone = updatedSteps.every(st => st.completed);
        return { ...prev, steps: updatedSteps, status: allDone ? 'completed' : 'running' };
      });
    }
  }, [selectedScenario]);

  const resetScenario = useCallback((scenarioId: string) => {
    const reset = (s: SandboxScenario) => s.id !== scenarioId ? s : {
      ...s, status: 'idle' as const, steps: s.steps.map(st => ({ ...st, completed: false })),
    };
    setSandboxScenarios(prev => prev.map(reset));
    if (selectedScenario?.id === scenarioId) setSelectedScenario(prev => prev ? reset(prev) : null);
  }, [selectedScenario]);

  // ─── AI Assistant ────────────────────────────────────────
  const sendAiMessage = useCallback((message: string) => {
    const userMsg: AiMessage = { id: `msg-${Date.now()}`, role: 'user', content: message, timestamp: new Date().toISOString() };
    setAiMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const kb = searchKnowledge(message);
      const aiReply: AiMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        content: kb
          ? kb.answer
          : 'Não encontrei documentação específica sobre esse tema. Sugiro consultar a Biblioteca Operacional ou falar com um administrador para obter orientação personalizada.',
        suggestedArticles: kb
          ? kb.articleIds.map(id => {
              const a = articles.find(a => a.id === id);
              return a ? { id: a.id, title: a.title, code: a.code } : null;
            }).filter(Boolean) as { id: string; title: string; code: string }[]
          : undefined,
        suggestedCourses: kb
          ? kb.courseIds.map(id => {
              const c = courses.find(c => c.id === id);
              return c ? { id: c.id, title: c.title } : null;
            }).filter(Boolean) as { id: string; title: string }[]
          : undefined,
      };
      setAiMessages(prev => [...prev, aiReply]);
    }, 800);
  }, [articles, courses]);

  // ─── Governance ─────────────────────────────────────────
  const publishDocument = useCallback((articleId: string) => {
    setArticles(prev => prev.map(a => a.id !== articleId ? a : { ...a, status: 'publicado' }));
    const article = articles.find(a => a.id === articleId);
    if (article) {
      const action: GovernanceAction = {
        id: `gov-${Date.now()}`, documentCode: article.code, documentTitle: article.title,
        action: 'publicacao', performedBy: 'Administrador', performedAt: new Date().toISOString(),
        toVersion: article.currentVersion,
      };
      setGovernanceLog(prev => [action, ...prev]);
    }
  }, [articles]);

  const archiveDocument = useCallback((articleId: string) => {
    setArticles(prev => prev.map(a => a.id !== articleId ? a : { ...a, status: 'arquivado' }));
    const article = articles.find(a => a.id === articleId);
    if (article) {
      const action: GovernanceAction = {
        id: `gov-${Date.now()}`, documentCode: article.code, documentTitle: article.title,
        action: 'arquivamento', performedBy: 'Administrador', performedAt: new Date().toISOString(),
      };
      setGovernanceLog(prev => [action, ...prev]);
    }
  }, [articles]);

  // ─── Academy ─────────────────────────────────────────────
  const enrollCourse = useCallback((courseId: string) => {
    setCourses(prev => prev.map(c => c.id !== courseId ? c : {
      ...c, status: 'em_andamento' as const,
      modules: c.modules.map((m, mi) => ({
        ...m, lessons: m.lessons.map((l, li) => ({ ...l, completed: mi === 0 && li === 0 })),
      })),
    }));
  }, []);

  const completeCourse = useCallback((courseId: string, score: number) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    setCourses(prev => prev.map(c => c.id !== courseId ? c : { ...c, status: 'concluido' as const }));
    if (score >= course.passingScore) {
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + course.certificateValidityMonths);
      const cert: UserCertificate = {
        id: `cert-${Date.now()}`, courseId, courseTitle: course.title,
        userName: 'Usuário Atual', userProfile: 'admin',
        issuedAt: new Date().toISOString(), validUntil: validUntil.toISOString(),
        score, status: 'aprovado',
        certificateCode: `ISM-${new Date().getFullYear()}-${courseId.toUpperCase()}-${String(Math.floor(Math.random() * 9999)).padStart(5, '0')}`,
      };
      setCertificates(prev => [cert, ...prev]);
    }
  }, [courses]);

  const value: SodoContextType = {
    libraries, articles, pops, courses, trails, certificates,
    sandboxScenarios, governanceLog, readingHistory, biMetrics,
    currentTab, searchQuery, searchResults,
    selectedLibrary, selectedArticle, selectedPop, selectedCourse, selectedScenario,
    aiMessages,
    setCurrentTab, setSearchQuery, selectLibrary, selectArticle, selectPop,
    selectCourse, toggleFavorite, togglePopChecklist,
    completeSandboxStep, resetScenario, sendAiMessage,
    publishDocument, archiveDocument, enrollCourse, completeCourse, isFavorite,
  };

  return <SodoContext.Provider value={value}>{children}</SodoContext.Provider>;
}

export function useSodo() {
  const ctx = useContext(SodoContext);
  if (!ctx) throw new Error('useSodo must be used within SodoProvider');
  return ctx;
}
