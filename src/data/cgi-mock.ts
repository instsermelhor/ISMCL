// ============================================================
// CGI Mock Data — Centro de Gestão Institucional
// Instituto Ser Melhor — Projeto Aura
// ============================================================

// ─── PERFIS ADMINISTRATIVOS ──────────────────────────────────
export type AdminRole =
  | 'super_admin' | 'diretoria' | 'presidencia' | 'coord_geral'
  | 'coord_clinica' | 'coord_social' | 'coord_juridica'
  | 'financeiro' | 'rh' | 'secretaria' | 'recepcao'
  | 'captacao' | 'comunicacao' | 'ti' | 'auditoria';

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Administrador', diretoria: 'Diretoria',
  presidencia: 'Presidência', coord_geral: 'Coordenação Geral',
  coord_clinica: 'Coordenação Clínica', coord_social: 'Coordenação Social',
  coord_juridica: 'Coordenação Jurídica', financeiro: 'Gestão Financeira',
  rh: 'Recursos Humanos', secretaria: 'Secretaria', recepcao: 'Recepção',
  captacao: 'Captação de Recursos', comunicacao: 'Comunicação',
  ti: 'Tecnologia', auditoria: 'Auditoria',
};

// ─── MATRIZ DE PERMISSÕES ────────────────────────────────────
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve' | 'admin';
export type PermissionModule =
  | 'beneficiarios' | 'profissionais' | 'voluntarios' | 'projetos'
  | 'documentos' | 'usuarios' | 'auditoria' | 'financeiro'
  | 'relatorios' | 'configuracoes' | 'prontuario' | 'agenda';

export const MODULE_LABELS: Record<PermissionModule, string> = {
  beneficiarios: 'Beneficiários', profissionais: 'Profissionais',
  voluntarios: 'Voluntários', projetos: 'Projetos Sociais',
  documentos: 'Documentos', usuarios: 'Usuários',
  auditoria: 'Auditoria', financeiro: 'Financeiro',
  relatorios: 'Relatórios', configuracoes: 'Configurações',
  prontuario: 'Prontuário', agenda: 'Agenda',
};

export type RolePermissions = Record<PermissionModule, PermissionAction[]>;

export const rolePermissionsMatrix: Record<AdminRole, Partial<RolePermissions>> = {
  super_admin: {
    beneficiarios: ['view','create','edit','delete','export','approve','admin'],
    profissionais: ['view','create','edit','delete','export','approve','admin'],
    voluntarios: ['view','create','edit','delete','export','approve','admin'],
    projetos: ['view','create','edit','delete','export','approve','admin'],
    documentos: ['view','create','edit','delete','export','approve','admin'],
    usuarios: ['view','create','edit','delete','export','approve','admin'],
    auditoria: ['view','export','admin'],
    financeiro: ['view','create','edit','delete','export','approve','admin'],
    relatorios: ['view','create','export','admin'],
    configuracoes: ['view','edit','admin'],
    prontuario: ['view','create','edit','delete'],
    agenda: ['view','create','edit','delete'],
  },
  coord_clinica: {
    beneficiarios: ['view','create','edit','export'],
    profissionais: ['view','edit'],
    prontuario: ['view','create','edit'],
    agenda: ['view','create','edit'],
    relatorios: ['view','export'],
    documentos: ['view'],
    projetos: ['view'],
  },
  coord_social: {
    beneficiarios: ['view','create','edit','export'],
    voluntarios: ['view','create','edit'],
    projetos: ['view','create','edit','approve'],
    documentos: ['view','create'],
    relatorios: ['view','export'],
  },
  coord_geral: {
    beneficiarios: ['view','create','edit','export','approve'],
    profissionais: ['view','create','edit','approve'],
    voluntarios: ['view','create','edit'],
    projetos: ['view','create','edit','approve'],
    documentos: ['view','create','edit','approve'],
    financeiro: ['view','export'],
    relatorios: ['view','create','export'],
    agenda: ['view','create','edit'],
  },
  financeiro: {
    financeiro: ['view','create','edit','export','approve'],
    relatorios: ['view','create','export'],
    documentos: ['view','export'],
    projetos: ['view'],
  },
  rh: {
    profissionais: ['view','create','edit','export'],
    voluntarios: ['view','create','edit','export'],
    usuarios: ['view','create','edit'],
    documentos: ['view','create','edit'],
    relatorios: ['view','export'],
  },
  auditoria: {
    auditoria: ['view','export','admin'],
    relatorios: ['view','export'],
    usuarios: ['view'],
    financeiro: ['view'],
  },
  diretoria: {
    beneficiarios: ['view','export'],
    profissionais: ['view','export'],
    projetos: ['view','approve','export'],
    financeiro: ['view','approve','export'],
    relatorios: ['view','create','export'],
    auditoria: ['view','export'],
  },
  presidencia: {
    beneficiarios: ['view','export'],
    projetos: ['view','approve','export'],
    financeiro: ['view','approve','export'],
    relatorios: ['view','create','export'],
    auditoria: ['view','export'],
    configuracoes: ['view','edit'],
  },
  secretaria: { beneficiarios: ['view'], agenda: ['view','create','edit'], documentos: ['view','create'] },
  recepcao: { beneficiarios: ['view','create'], agenda: ['view','create'] },
  captacao: { projetos: ['view'], financeiro: ['view'], relatorios: ['view','export'] },
  comunicacao: { projetos: ['view'], relatorios: ['view','export'] },
  ti: { usuarios: ['view','create','edit','delete'], configuracoes: ['view','edit','admin'], auditoria: ['view','export'] },
  coord_juridica: { documentos: ['view','create','edit','approve','export'], beneficiarios: ['view'] },
};

// ─── KPIs EXECUTIVOS ──────────────────────────────────────────
export interface KPI {
  id: string; label: string; value: string | number; unit?: string;
  trend?: number; trendLabel?: string; color: 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';
  icon: string;
}

export const executiveKPIs: KPI[] = [
  { id: 'beneficiarios_ativos', label: 'Beneficiários Ativos', value: 247, trend: 8.2, trendLabel: 'vs. mês ant.', color: 'teal', icon: 'Users' },
  { id: 'casos_ativos', label: 'Casos Ativos', value: 183, trend: 3.1, trendLabel: 'vs. mês ant.', color: 'blue', icon: 'Activity' },
  { id: 'atendimentos_mes', label: 'Atendimentos no Mês', value: 368, trend: 12.4, trendLabel: 'vs. mês ant.', color: 'emerald', icon: 'Activity' },
  { id: 'profissionais_ativos', label: 'Profissionais Ativos', value: 38, trend: 0, trendLabel: 'estável', color: 'violet', icon: 'BriefcaseMedical' },
  { id: 'voluntarios_ativos', label: 'Voluntários Ativos', value: 92, trend: 5.5, trendLabel: 'vs. mês ant.', color: 'blue', icon: 'Heart' },
  { id: 'horas_voluntarias', label: 'Horas Voluntárias', value: '2.840h', trend: 18.3, trendLabel: 'no mês', color: 'emerald', icon: 'Clock' },
  { id: 'projetos_andamento', label: 'Projetos em Andamento', value: 7, trend: 0, trendLabel: '2 iniciando', color: 'amber', icon: 'FolderKanban' },
  { id: 'taxa_comparecimento', label: 'Taxa de Comparecimento', value: '87%', trend: 2.1, trendLabel: 'vs. mês ant.', color: 'teal', icon: 'UserCheck' },
];

// ─── SCORE DE SAÚDE INSTITUCIONAL ─────────────────────────────
export interface HealthScore {
  overall: number; // 0–100
  dimensions: {
    label: string;
    score: number;
    weight: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    detail: string;
  }[];
}

export const institutionalHealth: HealthScore = {
  overall: 78,
  dimensions: [
    { label: 'Assistência Social', score: 87, weight: 30, status: 'good', detail: '87% taxa de comparecimento, 183 casos ativos' },
    { label: 'Gestão de Pessoas', score: 72, weight: 25, status: 'warning', detail: 'CRM vencido de 1 profissional, 3 sem MFA' },
    { label: 'Captação de Recursos', score: 84, weight: 20, status: 'good', detail: 'R$ 267k captados em 2026, meta anual em 71%' },
    { label: 'Projetos Sociais', score: 68, weight: 15, status: 'warning', detail: '1 projeto com meta atrasada, orçamento de "Envelhecer Bem" 44%' },
    { label: 'Governança e Segurança', score: 74, weight: 10, status: 'good', detail: 'Logs ativos, 1 tentativa de acesso suspeita detectada' },
  ],
};

// ─── AI INSIGHTS ──────────────────────────────────────────────
export type InsightType = 'predictive' | 'operational' | 'inconsistency' | 'workload' | 'opportunity';

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  body: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  module: string;
  confidence: number; // 0–100
  actionLabel?: string;
  generatedAt: string;
  dismissed?: boolean;
}

export const aiInsights: AIInsight[] = [
  {
    id: 'ai1',
    type: 'predictive',
    title: 'Risco de evasão — 3 beneficiários',
    body: 'Com base no padrão de faltas e falta de contato nos últimos 45 dias, Ana Silva Santos, Maria Aparecida Souza e 1 outro beneficiário têm 78% de probabilidade de abandono nos próximos 30 dias. Intervenção proativa recomendada.',
    priority: 'critical',
    module: 'Beneficiários',
    confidence: 78,
    actionLabel: 'Ver lista de risco',
    generatedAt: '2026-06-29T05:00:00Z',
  },
  {
    id: 'ai2',
    type: 'workload',
    title: 'Desbalanceamento de carga — Dra. Roberta Santos',
    body: 'A Dra. Roberta Santos concentra 34% de todos os atendimentos do mês (85 de 248), enquanto a média da equipe é 22 atendimentos. Redistribuição para Dr. João Paulo Silva (28 atendimentos) pode ser benéfica.',
    priority: 'high',
    module: 'Profissionais',
    confidence: 91,
    actionLabel: 'Redistribuir agenda',
    generatedAt: '2026-06-29T05:00:00Z',
  },
  {
    id: 'ai3',
    type: 'inconsistency',
    title: 'Inconsistência cadastral detectada',
    body: '2 beneficiários com cadastro ativo não possuem documentos obrigatórios (RG/CPF) no sistema. Regularização necessária para conformidade com LGPD e prestação de contas ao Governo.',
    priority: 'high',
    module: 'Cadastro',
    confidence: 99,
    actionLabel: 'Corrigir cadastros',
    generatedAt: '2026-06-29T05:00:00Z',
  },
  {
    id: 'ai4',
    type: 'operational',
    title: 'Projeto "Envelhecer Bem" em risco orçamentário',
    body: 'O projeto captou apenas R$ 20.000 de R$ 45.000 orçados (44%). Com o ritmo atual de captação, o orçamento não será atingido até setembro. Considere buscar novos editais ou parceiros.',
    priority: 'high',
    module: 'Projetos',
    confidence: 83,
    actionLabel: 'Ver projeto',
    generatedAt: '2026-06-29T05:00:00Z',
  },
  {
    id: 'ai5',
    type: 'opportunity',
    title: 'Pico de demanda previsto — Julho/2026',
    body: 'Análise histórica indica aumento médio de 23% em novas admissões em julho. Com a capacidade atual (38 profissionais, 7 projetos), recomenda-se recrutar 2 a 3 voluntários adicionais antes da alta.',
    priority: 'medium',
    module: 'Operações',
    confidence: 74,
    actionLabel: 'Planejar equipe',
    generatedAt: '2026-06-29T05:00:00Z',
  },
  {
    id: 'ai6',
    type: 'operational',
    title: 'Resumo diário — 29 de junho de 2026',
    body: 'Hoje: 14 atendimentos agendados, 2 faltas antecipadas notificadas, 1 novo beneficiário cadastrado, 3 documentos aguardam assinatura digital. Sem eventos críticos nas últimas 8 horas.',
    priority: 'low',
    module: 'Sistema',
    confidence: 100,
    generatedAt: '2026-06-29T06:00:00Z',
  },
];

// ─── INDICADORES ESTRATÉGICOS (OKRs) ──────────────────────────
export interface OKRObjective {
  id: string;
  objective: string;
  period: string;
  owner: string;
  keyResults: {
    id: string;
    label: string;
    current: number;
    target: number;
    unit: string;
    status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  }[];
}

export const okrObjectives: OKRObjective[] = [
  {
    id: 'okr1',
    objective: 'Ampliar o alcance assistencial do Instituto',
    period: '2026 — Semestre 1',
    owner: 'Coordenação Geral',
    keyResults: [
      { id: 'kr1', label: 'Beneficiários ativos', current: 247, target: 300, unit: 'pessoas', status: 'on_track' },
      { id: 'kr2', label: 'Atendimentos realizados', current: 1248, target: 1800, unit: 'atendimentos', status: 'on_track' },
      { id: 'kr3', label: 'Novos projetos iniciados', current: 2, target: 3, unit: 'projetos', status: 'at_risk' },
    ],
  },
  {
    id: 'okr2',
    objective: 'Garantir sustentabilidade financeira',
    period: '2026 — Semestre 1',
    owner: 'Captação & Financeiro',
    keyResults: [
      { id: 'kr4', label: 'Total captado', current: 267000, target: 375000, unit: 'R$', status: 'on_track' },
      { id: 'kr5', label: 'Novos parceiros institucionais', current: 3, target: 5, unit: 'parceiros', status: 'behind' },
      { id: 'kr6', label: 'Projetos com prestação aprovada', current: 2, target: 4, unit: 'projetos', status: 'at_risk' },
    ],
  },
  {
    id: 'okr3',
    objective: 'Fortalecer governança e segurança institucional',
    period: '2026 — Anual',
    owner: 'TI & Auditoria',
    keyResults: [
      { id: 'kr7', label: 'Usuários com MFA ativo', current: 2, target: 5, unit: 'usuários', status: 'behind' },
      { id: 'kr8', label: 'Documentos com conformidade LGPD', current: 4, target: 6, unit: 'documentos', status: 'at_risk' },
      { id: 'kr9', label: 'Uptime da plataforma', current: 99.7, target: 99.9, unit: '%', status: 'on_track' },
    ],
  },
];

// ─── ALERTAS CRÍTICOS ─────────────────────────────────────────
export type AlertSeverity = 'critical' | 'warning' | 'info';
export interface SystemAlert {
  id: string; severity: AlertSeverity; title: string;
  description: string; createdAt: string; module: string; resolved: boolean;
}

export const systemAlerts: SystemAlert[] = [
  { id: 'a1', severity: 'critical', title: '3 Beneficiários sem acompanhamento', description: 'Beneficiários com mais de 30 dias sem atendimento registrado.', createdAt: '2026-06-29T08:00:00Z', module: 'Beneficiários', resolved: false },
  { id: 'a2', severity: 'critical', title: 'CRP vencido — Dr. Carlos Mendes', description: 'Registro profissional venceu há 15 dias. Suspender acesso clínico.', createdAt: '2026-06-28T14:30:00Z', module: 'Profissionais', resolved: false },
  { id: 'a3', severity: 'warning', title: '5 Documentos próximos do vencimento', description: 'Contratos e termos com vencimento em menos de 30 dias.', createdAt: '2026-06-27T10:00:00Z', module: 'Documentos', resolved: false },
  { id: 'a4', severity: 'warning', title: 'Projeto "Escuta Ativa" com meta atrasada', description: 'Meta de beneficiários atendidos está 22% abaixo do planejado.', createdAt: '2026-06-26T09:00:00Z', module: 'Projetos', resolved: false },
  { id: 'a5', severity: 'info', title: 'Backup automático realizado', description: 'Backup diário concluído às 03:00. Todos os dados preservados.', createdAt: '2026-06-29T03:00:00Z', module: 'Sistema', resolved: true },
];

// ─── BENEFICIÁRIOS ─────────────────────────────────────────────
export interface Beneficiario {
  id: string; name: string; cpf: string; age: number; gender: string;
  status: 'ativo' | 'inativo' | 'em_avaliacao' | 'encerrado';
  risk: 'high' | 'medium' | 'low'; project: string;
  professional: string; registeredAt: string; lastContact: string;
  city: string; documents: number; cases: number;
}

export const beneficiarios: Beneficiario[] = [
  { id: 'b1', name: 'Ana Silva Santos', cpf: '***.***.***-12', age: 32, gender: 'F', status: 'ativo', risk: 'high', project: 'Escuta Ativa', professional: 'Dra. Roberta Santos', registeredAt: '2025-03-15', lastContact: '2026-06-20', city: 'São Paulo', documents: 4, cases: 2 },
  { id: 'b2', name: 'Marcos Santos Oliveira', cpf: '***.***.***-34', age: 14, gender: 'M', status: 'em_avaliacao', risk: 'medium', project: 'Lar Protegido', professional: 'Dr. Carlos Mendes', registeredAt: '2025-06-01', lastContact: '2026-06-10', city: 'Guarulhos', documents: 2, cases: 1 },
  { id: 'b3', name: 'Júlia Costa Ferreira', cpf: '***.***.***-56', age: 45, gender: 'F', status: 'ativo', risk: 'low', project: 'Escuta Ativa', professional: 'Dra. Roberta Santos', registeredAt: '2024-11-20', lastContact: '2026-06-05', city: 'São Paulo', documents: 6, cases: 3 },
  { id: 'b4', name: 'Roberto Almeida Lima', cpf: '***.***.***-78', age: 58, gender: 'M', status: 'ativo', risk: 'medium', project: 'Cuidar+', professional: 'Dra. Fernanda Lima', registeredAt: '2025-01-10', lastContact: '2026-06-18', city: 'Santo André', documents: 3, cases: 1 },
  { id: 'b5', name: 'Maria Aparecida Souza', cpf: '***.***.***-90', age: 67, gender: 'F', status: 'inativo', risk: 'low', project: 'Envelhecer Bem', professional: 'Dr. João Paulo', registeredAt: '2024-08-05', lastContact: '2026-03-01', city: 'Osasco', documents: 5, cases: 2 },
  { id: 'b6', name: 'Lucas Ferreira Dias', cpf: '***.***.***-11', age: 16, gender: 'M', status: 'ativo', risk: 'high', project: 'Lar Protegido', professional: 'Dra. Roberta Santos', registeredAt: '2026-01-20', lastContact: '2026-06-22', city: 'São Paulo', documents: 1, cases: 1 },
];

// ─── PROFISSIONAIS ─────────────────────────────────────────────
export interface Profissional {
  id: string; name: string; especialidade: string; registro: string;
  registroValidade: string; status: 'ativo' | 'suspenso' | 'ferias';
  tipo: 'voluntario' | 'colaborador'; horasMes: number;
  atendimentosMes: number; projetos: string[]; email: string; phone: string;
  admissao: string;
}

export const profissionais: Profissional[] = [
  { id: 'p1', name: 'Dra. Roberta Santos', especialidade: 'Psicologia Clínica', registro: 'CRP 06/123456', registroValidade: '2027-12-31', status: 'ativo', tipo: 'voluntario', horasMes: 40, atendimentosMes: 85, projetos: ['Escuta Ativa', 'Lar Protegido'], email: 'voluntario@institutosermelhor.org', phone: '(11) 98765-4321', admissao: '2024-03-01' },
  { id: 'p2', name: 'Dr. Carlos Mendes', especialidade: 'Psiquiatria', registro: 'CRM 12345', registroValidade: '2026-06-14', status: 'suspenso', tipo: 'colaborador', horasMes: 20, atendimentosMes: 32, projetos: ['Lar Protegido'], email: 'carlos@institutosermelhor.org', phone: '(11) 97654-3210', admissao: '2025-01-15' },
  { id: 'p3', name: 'Dra. Fernanda Lima', especialidade: 'Assistência Social', registro: 'CRESS 9876', registroValidade: '2028-06-30', status: 'ativo', tipo: 'voluntario', horasMes: 30, atendimentosMes: 60, projetos: ['Cuidar+', 'Envelhecer Bem'], email: 'fernanda@institutosermelhor.org', phone: '(11) 96543-2109', admissao: '2024-07-01' },
  { id: 'p4', name: 'Dr. João Paulo Silva', especialidade: 'Gerontologia', registro: 'CRM 54321', registroValidade: '2027-09-15', status: 'ativo', tipo: 'colaborador', horasMes: 16, atendimentosMes: 28, projetos: ['Envelhecer Bem'], email: 'joao@institutosermelhor.org', phone: '(11) 95432-1098', admissao: '2025-04-01' },
];

// ─── VOLUNTÁRIOS ──────────────────────────────────────────────
export interface Voluntario {
  id: string; name: string; area: string; status: 'ativo' | 'inativo' | 'ferias';
  horasTotais: number; horasMes: number; projetos: string[];
  capacitacoes: string[]; admissao: string; avaliacao: number;
  reconhecimento?: string;
}

export const voluntarios: Voluntario[] = [
  { id: 'v1', name: 'Ana Beatriz Rodrigues', area: 'Jurídico', status: 'ativo', horasTotais: 340, horasMes: 28, projetos: ['Lar Protegido'], capacitacoes: ['Direitos Humanos', 'Proteção à Mulher'], admissao: '2024-02-01', avaliacao: 4.8, reconhecimento: 'Voluntária do Mês — Março/2026' },
  { id: 'v2', name: 'Pedro Henrique Costa', area: 'TI / Sistemas', status: 'ativo', horasTotais: 210, horasMes: 20, projetos: ['Plataforma Aura'], capacitacoes: ['Segurança de Dados', 'LGPD'], admissao: '2024-06-01', avaliacao: 4.9 },
  { id: 'v3', name: 'Carla Mendonça Freitas', area: 'Comunicação', status: 'ativo', horasTotais: 180, horasMes: 15, projetos: ['Captação', 'Comunicação'], capacitacoes: ['Mídias Sociais', 'Marketing Social'], admissao: '2025-01-01', avaliacao: 4.5 },
  { id: 'v4', name: 'Sérgio Luiz Martins', area: 'Contabilidade', status: 'ferias', horasTotais: 420, horasMes: 0, projetos: ['Financeiro'], capacitacoes: ['Prestação de Contas ONGs', 'SPED'], admissao: '2023-09-01', avaliacao: 4.7, reconhecimento: 'Destaque Anual 2025' },
];

// ─── PROJETOS SOCIAIS ─────────────────────────────────────────
export interface ProjetoSocial {
  id: string; nome: string; descricao: string; status: 'ativo' | 'planejamento' | 'concluido' | 'suspenso';
  coordenador: string; inicio: string; fim: string; orcamento: number; captado: number;
  beneficiariosAlvo: number; beneficiariosAtivos: number; equipe: string[];
  tags: string[]; progresso: number;
  publicoAlvo?: string;
  objetivos?: string[];
  fontes?: string[];
  resultados?: string;
}

export const projetos: ProjetoSocial[] = [
  {
    id: 'pr1', nome: 'Escuta Ativa', descricao: 'Atendimento psicológico gratuito para mulheres em vulnerabilidade social.', status: 'ativo',
    coordenador: 'Dra. Roberta Santos', inicio: '2025-01-01', fim: '2026-12-31', orcamento: 80000, captado: 62000,
    beneficiariosAlvo: 120, beneficiariosAtivos: 94, equipe: ['Dra. Roberta Santos', 'Ana Beatriz Rodrigues'],
    tags: ['Saúde Mental', 'Mulheres', 'Psicologia'], progresso: 78,
    publicoAlvo: 'Mulheres em situação de vulnerabilidade social, vítimas de violência doméstica',
    objetivos: ['Oferecer escuta qualificada e suporte emocional', 'Reduzir índices de sofrimento psíquico', 'Empoderar mulheres para tomada de decisões'],
    fontes: ['Doações individuais', 'Patrocínio Empresa ABC', 'Edital Secretaria Municipal'],
    resultados: '94 mulheres atendidas, 78% concluíram ciclo completo, NPS 9.2',
  },
  {
    id: 'pr2', nome: 'Lar Protegido', descricao: 'Apoio interdisciplinar para crianças e adolescentes em situação de risco.', status: 'ativo',
    coordenador: 'Dra. Fernanda Lima', inicio: '2024-07-01', fim: '2026-06-30', orcamento: 120000, captado: 105000,
    beneficiariosAlvo: 60, beneficiariosAtivos: 47, equipe: ['Dr. Carlos Mendes', 'Dra. Fernanda Lima', 'Ana Beatriz Rodrigues'],
    tags: ['Criança', 'Adolescente', 'Risco Social'], progresso: 88,
    publicoAlvo: 'Crianças e adolescentes de 6 a 17 anos em situação de vulnerabilidade',
    objetivos: ['Garantir proteção integral', 'Fortalecer vínculos familiares', 'Promover acesso à educação e saúde'],
    fontes: ['Fundo Municipal da Criança', 'Doações empresariais'],
    resultados: '47 jovens acompanhados, 12 casos encaminhados ao CRAS com sucesso',
  },
  {
    id: 'pr3', nome: 'Envelhecer Bem', descricao: 'Programa de gerontologia e cuidados integrados para idosos.', status: 'ativo',
    coordenador: 'Dr. João Paulo Silva', inicio: '2025-04-01', fim: '2027-03-31', orcamento: 45000, captado: 20000,
    beneficiariosAlvo: 80, beneficiariosAtivos: 38, equipe: ['Dr. João Paulo Silva', 'Dra. Fernanda Lima'],
    tags: ['Idoso', 'Gerontologia', 'Cuidado Integral'], progresso: 42,
    publicoAlvo: 'Idosos com 60 anos ou mais, em isolamento social ou com cuidadores sobrecarregados',
    objetivos: ['Promover envelhecimento ativo', 'Apoiar cuidadores familiares', 'Prevenir isolamento social'],
    fontes: ['Captação em andamento'],
    resultados: 'Em fase inicial. 38 idosos cadastrados, 15 avaliações gerontológicas concluídas',
  },
  {
    id: 'pr4', nome: 'Cuidar+', descricao: 'Suporte a cuidadores familiares de pessoas com doenças crônicas.', status: 'ativo',
    coordenador: 'Dra. Fernanda Lima', inicio: '2025-08-01', fim: '2026-07-31', orcamento: 30000, captado: 30000,
    beneficiariosAlvo: 40, beneficiariosAtivos: 35, equipe: ['Dra. Fernanda Lima'],
    tags: ['Cuidadores', 'Doenças Crônicas', 'Suporte'], progresso: 65,
    publicoAlvo: 'Cuidadores familiares de pacientes com doenças crônicas e degenerativas',
    objetivos: ['Reduzir burnout em cuidadores', 'Oferecer suporte emocional e técnico', 'Criar rede de apoio entre cuidadores'],
    fontes: ['100% captado via doações corporativas'],
    resultados: '35 cuidadores atendidos, 8 grupos de apoio formados',
  },
  {
    id: 'pr5', nome: 'Plataforma Aura', descricao: 'Desenvolvimento do sistema de gestão integrada do Instituto.', status: 'ativo',
    coordenador: 'Adm. Geral', inicio: '2025-06-01', fim: '2026-12-31', orcamento: 50000, captado: 50000,
    beneficiariosAlvo: 0, beneficiariosAtivos: 0, equipe: ['Pedro Henrique Costa', 'Adm. Geral'],
    tags: ['TI', 'Infraestrutura', 'Transformação Digital'], progresso: 72,
    publicoAlvo: 'Equipe técnica e administrativa do Instituto',
    objetivos: ['Digitalizar gestão institucional', 'Integrar todos os módulos em plataforma única', 'Garantir LGPD e segurança de dados'],
    fontes: ['Fundo de inovação institucional'],
    resultados: '7 módulos entregues, 72% do roadmap concluído',
  },
  {
    id: 'pr6', nome: 'Vozes do Amanhã', descricao: 'Programa socioeducativo para jovens em situação de vulnerabilidade.', status: 'planejamento',
    coordenador: 'Coord. Social', inicio: '2026-09-01', fim: '2027-08-31', orcamento: 60000, captado: 5000,
    beneficiariosAlvo: 50, beneficiariosAtivos: 0, equipe: [],
    tags: ['Jovens', 'Educação', 'Socioeducativo'], progresso: 8,
    publicoAlvo: 'Jovens de 14 a 24 anos em vulnerabilidade social',
    objetivos: ['Ampliar acesso à educação', 'Desenvolver habilidades socioemocionais', 'Reduzir evasão escolar'],
    fontes: ['Edital previsto — Sec. de Educação SP 2026'],
    resultados: 'Projeto em fase de elaboração e captação de recursos',
  },
];

// ─── DOCUMENTOS ───────────────────────────────────────────────
export type DocStatus = 'vigente' | 'vencido' | 'a_vencer' | 'em_revisao';
export interface Documento {
  id: string; titulo: string; categoria: string; versao: string;
  status: DocStatus; responsavel: string; emissao: string; vencimento: string;
  tamanho: string; assinaturas: number; assinaturasNecessarias: number;
}

export const documentos: Documento[] = [
  { id: 'd1', titulo: 'Estatuto Social — Instituto Ser Melhor', categoria: 'Institucional', versao: '3.2', status: 'vigente', responsavel: 'Presidência', emissao: '2023-01-15', vencimento: '2028-01-15', tamanho: '2.4 MB', assinaturas: 5, assinaturasNecessarias: 5 },
  { id: 'd2', titulo: 'Contrato Parceria — Empresa ABC', categoria: 'Parcerias', versao: '1.0', status: 'a_vencer', responsavel: 'Coord. Geral', emissao: '2025-07-01', vencimento: '2026-07-01', tamanho: '890 KB', assinaturas: 2, assinaturasNecessarias: 2 },
  { id: 'd3', titulo: 'TCLE — Projeto Escuta Ativa', categoria: 'Clínico', versao: '2.1', status: 'vigente', responsavel: 'Coord. Clínica', emissao: '2025-01-10', vencimento: '2027-01-10', tamanho: '450 KB', assinaturas: 3, assinaturasNecessarias: 3 },
  { id: 'd4', titulo: 'Política de Privacidade — LGPD', categoria: 'Jurídico', versao: '1.3', status: 'em_revisao', responsavel: 'Coord. Jurídica', emissao: '2024-08-20', vencimento: '2026-08-20', tamanho: '1.1 MB', assinaturas: 1, assinaturasNecessarias: 3 },
  { id: 'd5', titulo: 'CRM Dr. Carlos Mendes', categoria: 'RH / Profissionais', versao: '—', status: 'vencido', responsavel: 'RH', emissao: '2023-06-14', vencimento: '2026-06-14', tamanho: '120 KB', assinaturas: 0, assinaturasNecessarias: 0 },
  { id: 'd6', titulo: 'Relatório Anual de Transparência 2025', categoria: 'Financeiro', versao: '1.0', status: 'vigente', responsavel: 'Financeiro', emissao: '2026-03-01', vencimento: '2027-03-01', tamanho: '5.8 MB', assinaturas: 4, assinaturasNecessarias: 4 },
];

// ─── USUÁRIOS DO SISTEMA ───────────────────────────────────────
export interface SystemUser {
  id: string; name: string; email: string; role: AdminRole;
  status: 'ativo' | 'suspenso' | 'pendente'; mfa: boolean;
  lastLogin: string; createdAt: string; permissions: string[];
  team?: string;
  sessionsThisMonth?: number;
  riskScore?: number; // 0-100, higher = more risk
}

export const systemUsers: SystemUser[] = [
  { id: 'u1', name: 'Administrador Geral', email: 'ism@ism.org', role: 'super_admin', status: 'ativo', mfa: true, lastLogin: '2026-06-29T05:00:00Z', createdAt: '2023-01-01', permissions: ['*'], team: 'Gestão', sessionsThisMonth: 28, riskScore: 5 },
  { id: 'u2', name: 'Dra. Roberta Santos', email: 'voluntario@institutosermelhor.org', role: 'coord_clinica', status: 'ativo', mfa: false, lastLogin: '2026-06-28T18:30:00Z', createdAt: '2024-03-01', permissions: ['patients.read', 'records.write', 'calendar.write'], team: 'Clínica', sessionsThisMonth: 22, riskScore: 25 },
  { id: 'u3', name: 'Dr. Carlos Mendes', email: 'carlos@institutosermelhor.org', role: 'coord_clinica', status: 'suspenso', mfa: false, lastLogin: '2026-06-14T12:00:00Z', createdAt: '2025-01-15', permissions: ['patients.read', 'records.write'], team: 'Clínica', sessionsThisMonth: 0, riskScore: 90 },
  { id: 'u4', name: 'Dra. Fernanda Lima', email: 'fernanda@institutosermelhor.org', role: 'coord_social', status: 'ativo', mfa: true, lastLogin: '2026-06-29T07:45:00Z', createdAt: '2024-07-01', permissions: ['patients.read', 'projects.write', 'records.read'], team: 'Social', sessionsThisMonth: 18, riskScore: 10 },
  { id: 'u5', name: 'Ana Beatriz Rodrigues', email: 'ana@institutosermelhor.org', role: 'coord_juridica', status: 'ativo', mfa: false, lastLogin: '2026-06-27T14:00:00Z', createdAt: '2024-02-01', permissions: ['documents.read', 'documents.write'], team: 'Jurídico', sessionsThisMonth: 12, riskScore: 20 },
];

// ─── EQUIPES ──────────────────────────────────────────────────
export interface Team {
  id: string;
  name: string;
  description: string;
  lead: string;
  memberCount: number;
  modules: string[];
  color: string;
}

export const teams: Team[] = [
  { id: 't1', name: 'Clínica', description: 'Equipe de atendimento clínico e psicológico', lead: 'Dra. Roberta Santos', memberCount: 2, modules: ['Prontuário', 'Agenda', 'Beneficiários'], color: '#0d9488' },
  { id: 't2', name: 'Social', description: 'Coordenação social e projetos comunitários', lead: 'Dra. Fernanda Lima', memberCount: 1, modules: ['Projetos', 'Beneficiários', 'Voluntários'], color: '#8b5cf6' },
  { id: 't3', name: 'Gestão', description: 'Administração e gestão institucional', lead: 'Administrador Geral', memberCount: 1, modules: ['CGI', 'Financeiro', 'Configurações'], color: '#f59e0b' },
  { id: 't4', name: 'Jurídico', description: 'Área jurídica e compliance', lead: 'Ana Beatriz Rodrigues', memberCount: 1, modules: ['Documentos', 'Auditoria'], color: '#3b82f6' },
];

// ─── SESSÕES DE USUÁRIO ────────────────────────────────────────
export interface UserSession {
  id: string;
  userId: string;
  userName: string;
  loginAt: string;
  logoutAt?: string;
  duration?: string;
  ip: string;
  device: string;
  status: 'active' | 'ended' | 'expired';
}

export const userSessions: UserSession[] = [
  { id: 's1', userId: 'u1', userName: 'Administrador Geral', loginAt: '2026-06-29T05:00:00Z', ip: '192.168.15.18', device: 'Chrome / macOS', status: 'active' },
  { id: 's2', userId: 'u4', userName: 'Dra. Fernanda Lima', loginAt: '2026-06-29T07:45:00Z', ip: '192.168.15.42', device: 'Chrome / Windows', status: 'active' },
  { id: 's3', userId: 'u2', userName: 'Dra. Roberta Santos', loginAt: '2026-06-28T18:30:00Z', logoutAt: '2026-06-28T21:00:00Z', duration: '2h 30min', ip: '189.45.23.100', device: 'Safari / iPhone', status: 'ended' },
  { id: 's4', userId: 'u5', userName: 'Ana Beatriz Rodrigues', loginAt: '2026-06-27T14:00:00Z', logoutAt: '2026-06-27T17:30:00Z', duration: '3h 30min', ip: '10.0.0.55', device: 'Firefox / Windows', status: 'ended' },
];

// ─── LOGS DE AUDITORIA ────────────────────────────────────────
export type AuditAction = 'login' | 'logout' | 'create' | 'edit' | 'delete' | 'export' | 'view' | 'permission_change' | 'password_reset';
export interface AuditLog {
  id: string; timestamp: string; user: string; action: AuditAction;
  module: string; description: string; ip: string; status: 'success' | 'failed';
  riskScore?: number;
}

export const auditLogs: AuditLog[] = [
  { id: 'al1', timestamp: '2026-06-29T05:02:11Z', user: 'ism@ism.org', action: 'login', module: 'Autenticação', description: 'Login realizado com sucesso.', ip: '192.168.15.18', status: 'success', riskScore: 5 },
  { id: 'al2', timestamp: '2026-06-29T04:55:30Z', user: 'fernanda@institutosermelhor.org', action: 'edit', module: 'Beneficiários', description: 'Editou dados de Ana Silva Santos (ID: b1).', ip: '192.168.15.42', status: 'success', riskScore: 10 },
  { id: 'al3', timestamp: '2026-06-28T18:30:00Z', user: 'voluntario@institutosermelhor.org', action: 'login', module: 'Autenticação', description: 'Login realizado com sucesso.', ip: '189.45.23.100', status: 'success', riskScore: 8 },
  { id: 'al4', timestamp: '2026-06-28T16:12:45Z', user: 'voluntario@institutosermelhor.org', action: 'export', module: 'Relatórios', description: 'Exportou relatório de atendimentos — Junho/2026 (PDF).', ip: '189.45.23.100', status: 'success', riskScore: 20 },
  { id: 'al5', timestamp: '2026-06-28T14:00:00Z', user: 'ism@ism.org', action: 'permission_change', module: 'Usuários', description: 'Suspendeu acesso de carlos@institutosermelhor.org (CRM vencido).', ip: '192.168.15.18', status: 'success', riskScore: 35 },
  { id: 'al6', timestamp: '2026-06-27T23:45:10Z', user: 'anon@193.45.12.8', action: 'login', module: 'Autenticação', description: 'Tentativa de login falhou. Email não encontrado.', ip: '193.45.12.8', status: 'failed', riskScore: 95 },
  { id: 'al7', timestamp: '2026-06-27T14:10:00Z', user: 'ana@institutosermelhor.org', action: 'create', module: 'Documentos', description: 'Adicionou documento "Contrato Parceria ONG Sul" ao repositório.', ip: '10.0.0.55', status: 'success', riskScore: 5 },
  { id: 'al8', timestamp: '2026-06-27T09:00:00Z', user: 'ism@ism.org', action: 'view', module: 'Auditoria', description: 'Consultou trilha de auditoria — últimos 7 dias.', ip: '192.168.15.18', status: 'success', riskScore: 5 },
  { id: 'al9', timestamp: '2026-06-26T11:30:00Z', user: 'fernanda@institutosermelhor.org', action: 'create', module: 'Projetos', description: 'Criou novo projeto "Vozes do Amanhã" com orçamento previsto de R$ 60.000.', ip: '192.168.15.42', status: 'success', riskScore: 12 },
  { id: 'al10', timestamp: '2026-06-26T08:00:00Z', user: 'ism@ism.org', action: 'password_reset', module: 'Usuários', description: 'Solicitou reset de senha para ana@institutosermelhor.org.', ip: '192.168.15.18', status: 'success', riskScore: 15 },
];

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────
export type NotifPriority = 'critical' | 'high' | 'normal' | 'low';
export interface Notification {
  id: string; title: string; body: string; priority: NotifPriority;
  module: string; read: boolean; createdAt: string; actionLabel?: string;
}

export const notifications: Notification[] = [
  { id: 'n1', title: 'CRM Vencido — Ação Requerida', body: 'O registro CRM do Dr. Carlos Mendes venceu. Acesso clínico suspenso automaticamente. Regularize para reativar.', priority: 'critical', module: 'Profissionais', read: false, createdAt: '2026-06-29T06:00:00Z', actionLabel: 'Ver Profissional' },
  { id: 'n2', title: 'Alerta de Acesso Suspeito', body: 'Tentativa de login frustrada de IP desconhecido (193.45.12.8) às 23:45. Verifique a trilha de auditoria.', priority: 'critical', module: 'Segurança', read: false, createdAt: '2026-06-28T00:00:00Z', actionLabel: 'Ver Auditoria' },
  { id: 'n3', title: 'Relatório Mensal Disponível', body: 'O relatório de atendimentos de Junho/2026 foi gerado automaticamente e está disponível para download.', priority: 'normal', module: 'Relatórios', read: false, createdAt: '2026-06-29T03:30:00Z', actionLabel: 'Baixar PDF' },
  { id: 'n4', title: '5 Beneficiários Sem Contato', body: 'Identificados beneficiários com mais de 30 dias sem contato registrado. Intervenção recomendada.', priority: 'high', module: 'Beneficiários', read: false, createdAt: '2026-06-28T08:00:00Z', actionLabel: 'Ver Lista' },
  { id: 'n5', title: 'Meta do Projeto Escuta Ativa', body: 'Meta de beneficiários atendidos está 22% abaixo do planejado para o período.', priority: 'high', module: 'Projetos', read: true, createdAt: '2026-06-27T10:00:00Z', actionLabel: 'Ver Projeto' },
  { id: 'n6', title: 'Backup Concluído', body: 'Backup automático diário realizado com sucesso às 03:00. Todos os dados preservados.', priority: 'low', module: 'Sistema', read: true, createdAt: '2026-06-29T03:00:00Z' },
  { id: 'n7', title: 'Nova Doação Recebida', body: 'Doação de R$ 5.000,00 recebida da Empresa ABC via transferência bancária.', priority: 'normal', module: 'Financeiro', read: true, createdAt: '2026-06-27T15:00:00Z', actionLabel: 'Ver Financeiro' },
];

// ─── BI — SÉRIES TEMPORAIS ────────────────────────────────────
export const atendimentosMensais = [
  { mes: 'Jan', online: 180, presencial: 95, total: 275 },
  { mes: 'Fev', online: 195, presencial: 88, total: 283 },
  { mes: 'Mar', online: 210, presencial: 102, total: 312 },
  { mes: 'Abr', online: 198, presencial: 110, total: 308 },
  { mes: 'Mai', online: 225, presencial: 98, total: 323 },
  { mes: 'Jun', online: 248, presencial: 120, total: 368 },
];

// Ano anterior para comparativo
export const atendimentosMensaisAnoAnterior = [
  { mes: 'Jan', total: 198 },
  { mes: 'Fev', total: 210 },
  { mes: 'Mar', total: 245 },
  { mes: 'Abr', total: 230 },
  { mes: 'Mai', total: 258 },
  { mes: 'Jun', total: 280 },
];

export const captacaoMensal = [
  { mes: 'Jan', doacoes: 8200, patrocinios: 15000, editais: 0 },
  { mes: 'Fev', doacoes: 9100, patrocinios: 15000, editais: 0 },
  { mes: 'Mar', doacoes: 11400, patrocinios: 20000, editais: 0 },
  { mes: 'Abr', doacoes: 8700, patrocinios: 15000, editais: 30000 },
  { mes: 'Mai', doacoes: 13200, patrocinios: 20000, editais: 0 },
  { mes: 'Jun', doacoes: 15150, patrocinios: 25000, editais: 15000 },
];

// Despesas mensais
export const despesasMensais = [
  { mes: 'Jan', pessoal: 18000, projetos: 12000, administrativo: 4500, total: 34500 },
  { mes: 'Fev', pessoal: 18000, projetos: 14000, administrativo: 3800, total: 35800 },
  { mes: 'Mar', pessoal: 20000, projetos: 18000, administrativo: 5200, total: 43200 },
  { mes: 'Abr', pessoal: 20000, projetos: 16000, administrativo: 4100, total: 40100 },
  { mes: 'Mai', pessoal: 22000, projetos: 19000, administrativo: 4800, total: 45800 },
  { mes: 'Jun', pessoal: 22000, projetos: 21000, administrativo: 5500, total: 48500 },
];

export const distribuicaoProjetos = [
  { projeto: 'Escuta Ativa', beneficiarios: 94, cor: '#0d9488' },
  { projeto: 'Lar Protegido', beneficiarios: 47, cor: '#3b82f6' },
  { projeto: 'Envelhecer Bem', beneficiarios: 38, cor: '#8b5cf6' },
  { projeto: 'Cuidar+', beneficiarios: 35, cor: '#f59e0b' },
  { projeto: 'Outros', beneficiarios: 33, cor: '#94a3b8' },
];

// Indicadores de Impacto Social
export const impactoSocial = {
  familiasAtendidas: 189,
  cidadesCobertas: 8,
  reducaoVulnerabilidade: 72, // %
  satisfacaoBeneficiarios: 9.2, // NPS
  horasVoluntarias: 2840,
  valorSocialGerado: 485000, // R$
};
