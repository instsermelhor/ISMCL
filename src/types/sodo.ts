// ============================================================
// SODO — SISTEMA OFICIAL DE DOCUMENTAÇÃO OPERACIONAL
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// TYPE DEFINITIONS
// ============================================================

// ─── Enumerations ───────────────────────────────────────────
export type DocClassification =
  | 'publico'
  | 'uso_interno'
  | 'restrito'
  | 'confidencial'
  | 'altamente_confidencial'
  | 'sigilo_especial';

export type DocStatus =
  | 'rascunho'
  | 'em_revisao'
  | 'aprovado'
  | 'publicado'
  | 'arquivado'
  | 'obsoleto';

export type LibraryCategory =
  | 'institucional'
  | 'tecnica'
  | 'operacional'
  | 'juridica'
  | 'clinica'
  | 'seguranca';

export type ContentType =
  | 'artigo'
  | 'manual'
  | 'tutorial'
  | 'faq'
  | 'nota_tecnica'
  | 'aviso'
  | 'fluxograma'
  | 'pop'
  | 'politica'
  | 'procedimento';

export type InstitutionalProfile =
  | 'super_admin'
  | 'admin'
  | 'diretor'
  | 'coordenador'
  | 'psicologo'
  | 'psiquiatra'
  | 'assistente_social'
  | 'advogado'
  | 'pedagogo'
  | 'voluntario'
  | 'administrativo'
  | 'financeiro'
  | 'tecnologia'
  | 'beneficiario'
  | 'responsavel_legal'
  | 'auditor'
  | 'consultor'
  | 'parceiro';

export type CertificationStatus = 'nao_iniciado' | 'em_andamento' | 'aprovado' | 'reprovado' | 'expirado';
export type CourseStatus = 'nao_iniciado' | 'em_andamento' | 'concluido';
export type SandboxScenarioCategory = 'beneficiario' | 'profissional' | 'administrativo' | 'seguranca' | 'financeiro';

// ─── Document Version History ────────────────────────────────
export interface DocVersionEntry {
  version: string;
  date: string;
  author: string;
  summary: string;
  changeType: 'criacao' | 'revisao' | 'correcao' | 'atualizacao' | 'cancelamento';
}

// ─── Document Article ────────────────────────────────────────
export interface DocSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface DocArticle {
  id: string;
  code: string; // e.g. ISM-MAN-001
  library: LibraryCategory;
  contentType: ContentType;
  classification: DocClassification;
  status: DocStatus;
  title: string;
  subtitle?: string;
  summary: string;
  targetProfiles: InstitutionalProfile[];
  relatedModules: string[];
  relatedLaws: string[];
  tags: string[];
  author: string;
  reviewer?: string;
  approver?: string;
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
  currentVersion: string;
  versionHistory: DocVersionEntry[];
  sections: DocSection[];
  estimatedReadMinutes: number;
  viewCount: number;
  isFeatured: boolean;
  attachments?: string[];
  relatedArticles?: string[];
}

// ─── Document Library ────────────────────────────────────────
export interface DocLibrary {
  id: string;
  category: LibraryCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  articleCount: number;
  lastUpdated: string;
}

// ─── POP — Standard Operating Procedure ─────────────────────
export interface PopChecklistItem {
  id: string;
  text: string;
  required: boolean;
  completed?: boolean;
}

export interface PopFlowStep {
  id: string;
  stepNumber: number;
  actor: string;
  action: string;
  condition?: string;
  nextStep?: string;
  isDecision: boolean;
}

export interface DocPOP {
  id: string;
  code: string; // e.g. ISM-POP-001
  title: string;
  objective: string;
  application: string;
  responsible: string[];
  prerequisites: string[];
  procedure: string[];
  flowSteps: PopFlowStep[];
  checklist: PopChecklistItem[];
  relatedDocuments: string[];
  deadlines: string;
  indicators: string[];
  risks: string[];
  bestPractices: string[];
  relatedModules: string[];
  targetProfiles: InstitutionalProfile[];
  status: DocStatus;
  currentVersion: string;
  updatedAt: string;
  estimatedMinutes: number;
  category: 'clinica' | 'social' | 'administrativa' | 'seguranca' | 'financeira' | 'tecnologia';
}

// ─── Course & Academy ────────────────────────────────────────
export interface CourseLesson {
  id: string;
  order: number;
  title: string;
  contentType: 'video' | 'texto' | 'fluxograma' | 'exercicio' | 'estudo_caso' | 'avaliacao' | 'tutorial';
  durationMinutes: number;
  content: string;
  completed?: boolean;
}

export interface CourseModule {
  id: string;
  order: number;
  title: string;
  description: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  code: string; // e.g. ISM-CRS-001
  title: string;
  description: string;
  targetProfiles: InstitutionalProfile[];
  relatedModules: string[];
  isMandatory: boolean;
  workloadHours: number;
  passingScore: number; // 0-100
  certificateValidityMonths: number;
  modules: CourseModule[];
  instructor: string;
  category: LibraryCategory;
  status: CourseStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  enrolledCount: number;
  completionRate: number;
}

export interface LearningTrail {
  id: string;
  profile: InstitutionalProfile;
  title: string;
  description: string;
  objective: string;
  totalWorkloadHours: number;
  courseIds: string[];
  mandatoryCourseIds: string[];
  progressPercent?: number;
  color: string;
  icon: string;
}

// ─── Certification ───────────────────────────────────────────
export interface UserCertificate {
  id: string;
  courseId: string;
  courseTitle: string;
  userName: string;
  userProfile: InstitutionalProfile;
  issuedAt: string;
  validUntil: string;
  score: number;
  status: CertificationStatus;
  certificateCode: string;
}

// ─── Sandbox Scenario ────────────────────────────────────────
export interface SandboxStep {
  id: string;
  order: number;
  title: string;
  module: string;
  instruction: string;
  hint?: string;
  completed?: boolean;
}

export interface SandboxScenario {
  id: string;
  title: string;
  description: string;
  persona: string;
  category: SandboxScenarioCategory;
  difficulty: 'basico' | 'intermediario' | 'avancado';
  estimatedMinutes: number;
  steps: SandboxStep[];
  relatedCourses: string[];
  relatedPops: string[];
  status: 'idle' | 'running' | 'completed' | 'reset';
}

// ─── AI Documentation Assistant ─────────────────────────────
export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedArticles?: { id: string; title: string; code: string }[];
  suggestedCourses?: { id: string; title: string }[];
}

// ─── Governance Action ───────────────────────────────────────
export interface GovernanceAction {
  id: string;
  documentCode: string;
  documentTitle: string;
  action: 'criacao' | 'revisao' | 'aprovacao' | 'publicacao' | 'arquivamento' | 'obsolescencia';
  performedBy: string;
  performedAt: string;
  notes?: string;
  fromVersion?: string;
  toVersion?: string;
}

// ─── User Reading State ──────────────────────────────────────
export interface UserReadingEntry {
  articleId: string;
  lastReadAt: string;
  progressPercent: number;
  isFavorite: boolean;
  notes?: string;
}

// ─── Search ─────────────────────────────────────────────────
export interface SearchResult {
  type: 'article' | 'pop' | 'course' | 'trail';
  id: string;
  title: string;
  summary: string;
  library?: LibraryCategory;
  relevanceScore: number;
  tags: string[];
}

// ─── BI Metrics ──────────────────────────────────────────────
export interface AcademyBiMetrics {
  totalCertificatesIssued: number;
  totalCoursesStarted: number;
  totalCoursesCompleted: number;
  averagePassRate: number;
  mostAccessedArticles: { id: string; title: string; viewCount: number }[];
  mostEnrolledCourses: { id: string; title: string; enrolledCount: number }[];
  certificatesThisMonth: number;
  activeLearnersThisMonth: number;
  averageCompletionDays: number;
}

// ─── SODO Context State ──────────────────────────────────────
export type SodoTab = 'portal' | 'academy' | 'pops' | 'sandbox' | 'governance' | 'assistant';

export interface SodoContextType {
  // Data
  libraries: DocLibrary[];
  articles: DocArticle[];
  pops: DocPOP[];
  courses: Course[];
  trails: LearningTrail[];
  certificates: UserCertificate[];
  sandboxScenarios: SandboxScenario[];
  governanceLog: GovernanceAction[];
  readingHistory: UserReadingEntry[];
  biMetrics: AcademyBiMetrics;

  // UI State
  currentTab: SodoTab;
  searchQuery: string;
  searchResults: SearchResult[];
  selectedLibrary: LibraryCategory | null;
  selectedArticle: DocArticle | null;
  selectedPop: DocPOP | null;
  selectedCourse: Course | null;
  selectedScenario: SandboxScenario | null;
  aiMessages: AiMessage[];

  // Actions
  setCurrentTab: (tab: SodoTab) => void;
  setSearchQuery: (q: string) => void;
  selectLibrary: (lib: LibraryCategory | null) => void;
  selectArticle: (id: string | null) => void;
  selectPop: (id: string | null) => void;
  selectCourse: (id: string | null) => void;
  toggleFavorite: (articleId: string) => void;
  togglePopChecklist: (popId: string, itemId: string) => void;
  completeSandboxStep: (scenarioId: string, stepId: string) => void;
  resetScenario: (scenarioId: string) => void;
  sendAiMessage: (message: string) => void;
  publishDocument: (articleId: string) => void;
  archiveDocument: (articleId: string) => void;
  enrollCourse: (courseId: string) => void;
  completeCourse: (courseId: string, score: number) => void;
  isFavorite: (articleId: string) => boolean;
}
