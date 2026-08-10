/**
 * programsService.ts — Serviço Reativo de Programas Sociais (ASPS)
 *
 * Centraliza o estado dos programas/projetos sociais do Instituto Ser Melhor.
 * Estratégia de persistência:
 *   1. Fonte primária: REST API backend (quando disponível)
 *   2. Fallback e cache local: localStorage
 *
 * Reatividade: Emite o CustomEvent `aura_programs_updated` sempre que o
 * estado é modificado. Qualquer componente pode escutar este evento para
 * re-renderizar automaticamente.
 *
 * Referência: Integração CGI-Gestão de Projetos ↔ Página Pública de Programas
 */

export type ProgramStatus = 'ativo' | 'planejamento' | 'concluido' | 'suspenso';
export type ProgramCategory =
  | 'Saúde Mental'
  | 'Proteção Social'
  | 'Idoso'
  | 'Criança e Adolescente'
  | 'Cuidadores'
  | 'Educação'
  | 'Transformação Digital'
  | 'Outro';

export interface SocialProgram {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  category: ProgramCategory | string;
  status: ProgramStatus;
  isPublic: boolean;
  targetAudience?: string;
  objectives?: string[];
  fundingSources?: string[];
  results?: string;
  coordinator: string;
  team: string[];
  tags: string[];
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  budget: number;
  raised: number;
  targetBeneficiaries: number;
  activeBeneficiaries: number;
  progress: number;
  centroCusto?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Dados iniciais (mock oficial dos programas do Instituto) ──────────────
const DEFAULT_PROGRAMS: SocialProgram[] = [
  {
    id: 'pr1',
    title: 'Escuta Ativa',
    description: 'Atendimento psicológico gratuito para mulheres em vulnerabilidade social.',
    fullDescription:
      'O programa Escuta Ativa oferece atendimento psicológico individual e em grupo para mulheres que vivem em situação de vulnerabilidade social, incluindo vítimas de violência doméstica. Contamos com equipe multidisciplinar qualificada para acolher, escutar e orientar cada mulher rumo à sua autonomia e bem-estar.',
    category: 'Saúde Mental',
    status: 'ativo',
    isPublic: true,
    targetAudience: 'Mulheres em situação de vulnerabilidade social, vítimas de violência doméstica',
    objectives: [
      'Oferecer escuta qualificada e suporte emocional',
      'Reduzir índices de sofrimento psíquico',
      'Empoderar mulheres para tomada de decisões',
    ],
    fundingSources: ['Doações individuais', 'Patrocínio Empresa ABC', 'Edital Secretaria Municipal'],
    results: '94 mulheres atendidas, 78% concluíram ciclo completo, NPS 9.2',
    coordinator: 'Dra. Roberta Santos',
    team: ['Dra. Roberta Santos', 'Ana Beatriz Rodrigues'],
    tags: ['Saúde Mental', 'Mulheres', 'Psicologia'],
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    budget: 80000,
    raised: 62000,
    targetBeneficiaries: 120,
    activeBeneficiaries: 94,
    progress: 78,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr2',
    title: 'Lar Protegido',
    description: 'Apoio interdisciplinar para crianças e adolescentes em situação de risco.',
    fullDescription:
      'O Lar Protegido é um programa interdisciplinar que oferece acompanhamento psicológico, assistência social e suporte jurídico para crianças e adolescentes em situação de risco, vulnerabilidade e abandono. Trabalhamos em rede com o CRAS, Conselho Tutelar e CREAS para garantir proteção integral a cada criança.',
    category: 'Criança e Adolescente',
    status: 'ativo',
    isPublic: true,
    targetAudience: 'Crianças e adolescentes de 6 a 17 anos em situação de vulnerabilidade',
    objectives: [
      'Garantir proteção integral',
      'Fortalecer vínculos familiares',
      'Promover acesso à educação e saúde',
    ],
    fundingSources: ['Fundo Municipal da Criança', 'Doações empresariais'],
    results: '47 jovens acompanhados, 12 casos encaminhados ao CRAS com sucesso',
    coordinator: 'Dra. Fernanda Lima',
    team: ['Dr. Carlos Mendes', 'Dra. Fernanda Lima', 'Ana Beatriz Rodrigues'],
    tags: ['Criança', 'Adolescente', 'Risco Social'],
    startDate: '2024-07-01',
    endDate: '2026-06-30',
    budget: 120000,
    raised: 105000,
    targetBeneficiaries: 60,
    activeBeneficiaries: 47,
    progress: 88,
    createdAt: '2024-07-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr3',
    title: 'Envelhecer Bem',
    description: 'Programa de gerontologia e cuidados integrados para idosos.',
    fullDescription:
      'O programa Envelhecer Bem proporciona avaliação gerontológica, suporte emocional e atividades socioeducativas para idosos com 60 anos ou mais, com foco especial em idosos em isolamento social ou cujos cuidadores estão sobrecarregados. Acreditamos no envelhecimento ativo e na dignidade em todas as fases da vida.',
    category: 'Idoso',
    status: 'ativo',
    isPublic: true,
    targetAudience: 'Idosos com 60 anos ou mais, em isolamento social ou com cuidadores sobrecarregados',
    objectives: [
      'Promover envelhecimento ativo',
      'Apoiar cuidadores familiares',
      'Prevenir isolamento social',
    ],
    fundingSources: ['Captação em andamento'],
    results: 'Em fase inicial. 38 idosos cadastrados, 15 avaliações gerontológicas concluídas',
    coordinator: 'Dr. João Paulo Silva',
    team: ['Dr. João Paulo Silva', 'Dra. Fernanda Lima'],
    tags: ['Idoso', 'Gerontologia', 'Cuidado Integral'],
    startDate: '2025-04-01',
    endDate: '2027-03-31',
    budget: 45000,
    raised: 20000,
    targetBeneficiaries: 80,
    activeBeneficiaries: 38,
    progress: 42,
    createdAt: '2025-04-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr4',
    title: 'Cuidar+',
    description: 'Suporte a cuidadores familiares de pessoas com doenças crônicas.',
    fullDescription:
      'O Cuidar+ apoia cuidadores familiares que dedicam suas vidas ao cuidado de pessoas com doenças crônicas e degenerativas. O programa oferece escuta especializada, grupos de apoio, orientação técnica sobre cuidados e estratégias para prevenir o burnout do cuidador.',
    category: 'Cuidadores',
    status: 'ativo',
    isPublic: true,
    targetAudience: 'Cuidadores familiares de pacientes com doenças crônicas e degenerativas',
    objectives: [
      'Reduzir burnout em cuidadores',
      'Oferecer suporte emocional e técnico',
      'Criar rede de apoio entre cuidadores',
    ],
    fundingSources: ['100% captado via doações corporativas'],
    results: '35 cuidadores atendidos, 8 grupos de apoio formados',
    coordinator: 'Dra. Fernanda Lima',
    team: ['Dra. Fernanda Lima'],
    tags: ['Cuidadores', 'Doenças Crônicas', 'Suporte'],
    startDate: '2025-08-01',
    endDate: '2026-07-31',
    budget: 30000,
    raised: 30000,
    targetBeneficiaries: 40,
    activeBeneficiaries: 35,
    progress: 65,
    createdAt: '2025-08-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr5',
    title: 'Plataforma Aura',
    description: 'Desenvolvimento do sistema de gestão integrada do Instituto.',
    fullDescription:
      'A Plataforma Aura é o coração tecnológico do Instituto Ser Melhor. Um sistema enterprise de gestão integrada que digitaliza e conecta todos os módulos institucionais: beneficiários, profissionais, agendamentos, prontuários, financeiro, documentos, governança e muito mais.',
    category: 'Transformação Digital',
    status: 'ativo',
    isPublic: false,
    targetAudience: 'Equipe técnica e administrativa do Instituto',
    objectives: [
      'Digitalizar gestão institucional',
      'Integrar todos os módulos em plataforma única',
      'Garantir LGPD e segurança de dados',
    ],
    fundingSources: ['Fundo de inovação institucional'],
    results: '7 módulos entregues, 72% do roadmap concluído',
    coordinator: 'Adm. Geral',
    team: ['Pedro Henrique Costa', 'Adm. Geral'],
    tags: ['TI', 'Infraestrutura', 'Transformação Digital'],
    startDate: '2025-06-01',
    endDate: '2026-12-31',
    budget: 50000,
    raised: 50000,
    targetBeneficiaries: 0,
    activeBeneficiaries: 0,
    progress: 72,
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr6',
    title: 'Vozes do Amanhã',
    description: 'Programa socioeducativo para jovens em situação de vulnerabilidade.',
    fullDescription:
      'O Vozes do Amanhã é um programa socioeducativo inovador que utiliza arte, cultura, esporte e tecnologia para desenvolver habilidades socioemocionais em jovens de 14 a 24 anos em situação de vulnerabilidade social. O objetivo é ampliar o acesso à educação e reduzir a evasão escolar.',
    category: 'Educação',
    status: 'planejamento',
    isPublic: true,
    targetAudience: 'Jovens de 14 a 24 anos em vulnerabilidade social',
    objectives: [
      'Ampliar acesso à educação',
      'Desenvolver habilidades socioemocionais',
      'Reduzir evasão escolar',
    ],
    fundingSources: ['Edital previsto — Sec. de Educação SP 2026'],
    results: 'Projeto em fase de elaboração e captação de recursos',
    coordinator: 'Coord. Social',
    team: [],
    tags: ['Jovens', 'Educação', 'Socioeducativo'],
    startDate: '2026-09-01',
    endDate: '2027-08-31',
    budget: 60000,
    raised: 5000,
    targetBeneficiaries: 50,
    activeBeneficiaries: 0,
    progress: 8,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

// ─── Chave de persistência ────────────────────────────────────────────────────
const STORAGE_KEY = 'aura_social_programs_v1';
const UPDATED_EVENT = 'aura_programs_updated';
const API_BASE = '/api/v1/programs';

// ─── Helpers internos ─────────────────────────────────────────────────────────
function loadFromStorage(): SocialProgram[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SocialProgram[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* falha silenciosa — usa defaults */
  }
  return DEFAULT_PROGRAMS;
}

function saveToStorage(programs: SocialProgram[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
  } catch {
    /* storage quota excedida — ignora */
  }
}

function emit(): void {
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
}

function genId(): string {
  return `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Estado interno do serviço ────────────────────────────────────────────────
let _programs: SocialProgram[] = loadFromStorage();

// ─── API REST (opcional — falha silenciosa para modo offline) ─────────────────
async function fetchFromAPI(): Promise<void> {
  try {
    const res = await fetch(API_BASE, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) return;
    const data = (await res.json()) as SocialProgram[];
    if (Array.isArray(data) && data.length > 0) {
      _programs = data;
      saveToStorage(_programs);
      emit();
    }
  } catch {
    /* API indisponível — continua com localStorage */
  }
}

async function persistToAPI(method: 'POST' | 'PATCH' | 'DELETE', id?: string, body?: Partial<SocialProgram>): Promise<void> {
  try {
    const url = id ? `${API_BASE}/${id}` : API_BASE;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    /* API indisponível — dados persistidos no localStorage */
  }
}

// ─── Interface Pública do Serviço ─────────────────────────────────────────────
export const programsService = {
  /**
   * Retorna todos os programas (estado atual).
   */
  getAll(): SocialProgram[] {
    return [..._programs];
  },

  /**
   * Retorna apenas programas marcados como públicos.
   */
  getPublic(): SocialProgram[] {
    return _programs.filter((p) => p.isPublic);
  },

  /**
   * Retorna um programa pelo ID.
   */
  getById(id: string): SocialProgram | undefined {
    return _programs.find((p) => p.id === id);
  },

  /**
   * Cria um novo programa social.
   */
  async create(data: Omit<SocialProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialProgram> {
    const now = new Date().toISOString();
    const newProgram: SocialProgram = { ...data, id: genId(), createdAt: now, updatedAt: now };
    _programs = [newProgram, ..._programs];
    saveToStorage(_programs);
    emit();
    await persistToAPI('POST', undefined, newProgram);
    return newProgram;
  },

  /**
   * Atualiza um programa existente (merge parcial).
   */
  async update(id: string, patch: Partial<Omit<SocialProgram, 'id' | 'createdAt'>>): Promise<SocialProgram | null> {
    const idx = _programs.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated: SocialProgram = { ..._programs[idx], ...patch, updatedAt: new Date().toISOString() };
    _programs = _programs.map((p) => (p.id === id ? updated : p));
    saveToStorage(_programs);
    emit();
    await persistToAPI('PATCH', id, patch);
    return updated;
  },

  /**
   * Remove um programa pelo ID.
   */
  async remove(id: string): Promise<boolean> {
    const before = _programs.length;
    _programs = _programs.filter((p) => p.id !== id);
    if (_programs.length === before) return false;
    saveToStorage(_programs);
    emit();
    await persistToAPI('DELETE', id);
    return true;
  },

  /**
   * Alterna a visibilidade pública de um programa.
   */
  async togglePublic(id: string): Promise<SocialProgram | null> {
    const program = _programs.find((p) => p.id === id);
    if (!program) return null;
    return this.update(id, { isPublic: !program.isPublic });
  },

  /**
   * Altera o status de um programa (workflow Kanban).
   */
  async updateStatus(id: string, status: ProgramStatus): Promise<SocialProgram | null> {
    return this.update(id, { status });
  },

  /**
   * Sincroniza com a API REST (opcional — usa em background).
   */
  syncWithAPI(): void {
    fetchFromAPI().catch(() => {});
  },

  /**
   * Registra um listener para mudanças no estado de programas.
   * Retorna a função de cleanup para removeEventListener.
   */
  subscribe(listener: () => void): () => void {
    window.addEventListener(UPDATED_EVENT, listener);
    return () => window.removeEventListener(UPDATED_EVENT, listener);
  },

  /**
   * Reseta os dados para o mock padrão (uso em desenvolvimento/debug).
   */
  reset(): void {
    _programs = [...DEFAULT_PROGRAMS];
    saveToStorage(_programs);
    emit();
  },
};

export type { SocialProgram as Program };
export { DEFAULT_PROGRAMS };
