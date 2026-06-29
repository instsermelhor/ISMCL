// ============================================================
// PLATFORM HEALTH & AUDIT CENTER — MOCK DATA
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import type {
  ModuleInventory,
  IntegrationCheck,
  E2eJourney,
  LoadTestResult,
  ResilienceTestResult,
  BackupRecord,
  SecurityAlert,
  ComplianceItem,
  TraceLog,
  HealthMetric,
  PermissionAuditItem,
  GeneratedReport,
} from '../types/platform-health';

// ─── Module Inventory ───────────────────────────────────────
export const MOCK_MODULES: ModuleInventory[] = [
  {
    id: 'mod-001', name: 'IAM — Gestão de Identidade e Acesso', code: 'IAM', category: 'security',
    status: 'online', version: '2.4.1', lastDeploy: '2026-06-28T09:00:00Z',
    routes: ['/login', '/mfa', '/recuperar-senha', '/perfil'],
    dependencies: [], components: 12, apis: 8, uptime: 99.98, responseTimeMs: 42, errorRate: 0.02,
    description: 'Autenticação, MFA, RBAC, ABAC e gestão de sessões.',
  },
  {
    id: 'mod-002', name: 'MCSI — Módulo Complementar de Segurança Institucional', code: 'MCSI', category: 'security',
    status: 'online', version: '1.8.0', lastDeploy: '2026-06-28T09:00:00Z',
    routes: ['/seguranca', '/cofre-digital', '/auditoria'],
    dependencies: ['IAM'], components: 9, apis: 6, uptime: 99.95, responseTimeMs: 38, errorRate: 0.01,
    description: 'Criptografia em repouso, mascaramento dinâmico, Cofre Digital e auditoria imutável.',
  },
  {
    id: 'mod-003', name: 'ARE — Cadastro Inteligente Adaptativo', code: 'ARE', category: 'core',
    status: 'online', version: '3.1.0', lastDeploy: '2026-06-28T10:00:00Z',
    routes: ['/registro', '/cadastro-adaptativo'],
    dependencies: ['IAM', 'MCSI'], components: 18, apis: 11, uptime: 99.9, responseTimeMs: 110, errorRate: 0.05,
    description: 'Formulário adaptativo com IIP, Cofre Digital do Beneficiário e cálculo de prioridade.',
  },
  {
    id: 'mod-004', name: 'SATAI — Sistema Inteligente de Acolhimento e Triagem', code: 'SATAI', category: 'social',
    status: 'online', version: '2.0.3', lastDeploy: '2026-06-28T10:30:00Z',
    routes: ['/acolhimento', '/satai'],
    dependencies: ['ARE', 'BPMS', 'IAM'], components: 22, apis: 14, uptime: 99.85, responseTimeMs: 145, errorRate: 0.08,
    description: 'Plataforma configurável de protocolos institucionais de acolhimento e triagem.',
  },
  {
    id: 'mod-005', name: 'GIC — Gestão Integrada de Casos', code: 'GIC', category: 'social',
    status: 'online', version: '2.2.1', lastDeploy: '2026-06-27T15:00:00Z',
    routes: ['/casos', '/meus-casos'],
    dependencies: ['ARE', 'SATAI', 'IAM'], components: 25, apis: 16, uptime: 99.7, responseTimeMs: 190, errorRate: 0.12,
    description: 'Gestão do ciclo de vida completo do caso social com PIA e acompanhamento multidisciplinar.',
  },
  {
    id: 'mod-006', name: 'PEL — Prontuário Eletrônico', code: 'PEL', category: 'health',
    status: 'online', version: '1.9.5', lastDeploy: '2026-06-27T15:00:00Z',
    routes: ['/prontuario'],
    dependencies: ['GIC', 'IAM', 'MCSI'], components: 28, apis: 18, uptime: 99.6, responseTimeMs: 220, errorRate: 0.15,
    description: 'Prontuário eletrônico multiprofissional com receitas, laudos, assinaturas e ABAC.',
  },
  {
    id: 'mod-007', name: 'AGI — Agenda Inteligente', code: 'AGI', category: 'core',
    status: 'online', version: '2.1.0', lastDeploy: '2026-06-27T12:00:00Z',
    routes: ['/agenda'],
    dependencies: ['GIC', 'IAM'], components: 15, apis: 10, uptime: 99.8, responseTimeMs: 98, errorRate: 0.07,
    description: 'Agendamento multiprofissional com slots inteligentes e notificações.',
  },
  {
    id: 'mod-008', name: 'TLC — Teleconsulta', code: 'TLC', category: 'health',
    status: 'online', version: '1.5.2', lastDeploy: '2026-06-27T12:00:00Z',
    routes: ['/teleconsulta'],
    dependencies: ['AGI', 'PEL', 'IAM'], components: 14, apis: 9, uptime: 99.5, responseTimeMs: 280, errorRate: 0.2,
    description: 'Videoconsulta criptografada com sala virtual e integração ao prontuário.',
  },
  {
    id: 'mod-009', name: 'BPMS — Workflow & Automação', code: 'BPMS', category: 'core',
    status: 'online', version: '1.3.0', lastDeploy: '2026-06-26T18:00:00Z',
    routes: ['/processos'],
    dependencies: ['IAM'], components: 20, apis: 12, uptime: 99.92, responseTimeMs: 85, errorRate: 0.03,
    description: 'Motor BPMN 2.0 com Rules Engine, SLAs e automações configuráveis.',
  },
  {
    id: 'mod-010', name: 'CGI — Centro de Gestão Institucional', code: 'CGI', category: 'admin',
    status: 'online', version: '1.2.0', lastDeploy: '2026-06-26T18:00:00Z',
    routes: ['/cgi', '/configuracoes'],
    dependencies: ['IAM', 'MCSI', 'BPMS'], components: 32, apis: 20, uptime: 99.88, responseTimeMs: 160, errorRate: 0.06,
    description: 'Central de configuração, governança, estrutura organizacional e parâmetros da plataforma.',
  },
  {
    id: 'mod-011', name: 'ERS — ERP Social', code: 'ERS', category: 'admin',
    status: 'online', version: '1.1.0', lastDeploy: '2026-06-26T16:00:00Z',
    routes: ['/erp', '/financeiro'],
    dependencies: ['IAM', 'GIC'], components: 19, apis: 14, uptime: 99.75, responseTimeMs: 175, errorRate: 0.09,
    description: 'Gestão financeira, prestação de contas, orçamento e convênios.',
  },
  {
    id: 'mod-012', name: 'CRS — Captação de Recursos', code: 'CRS', category: 'admin',
    status: 'online', version: '1.0.5', lastDeploy: '2026-06-25T14:00:00Z',
    routes: ['/captacao'],
    dependencies: ['ERS', 'IAM'], components: 11, apis: 7, uptime: 99.6, responseTimeMs: 130, errorRate: 0.1,
    description: 'Gestão de editais, projetos, contratos e prestações de contas a financiadores.',
  },
  {
    id: 'mod-013', name: 'VOL — Voluntariado', code: 'VOL', category: 'social',
    status: 'online', version: '1.0.3', lastDeploy: '2026-06-25T14:00:00Z',
    routes: ['/voluntariado'],
    dependencies: ['IAM', 'AGI'], components: 10, apis: 6, uptime: 99.7, responseTimeMs: 115, errorRate: 0.08,
    description: 'Gestão de voluntários com horas, perfis e certificação.',
  },
  {
    id: 'mod-014', name: 'PBN — Portal do Beneficiário', code: 'PBN', category: 'integration',
    status: 'online', version: '1.0.1', lastDeploy: '2026-06-24T10:00:00Z',
    routes: ['/portal-beneficiario'],
    dependencies: ['ARE', 'AGI', 'TLC', 'IAM'], components: 16, apis: 10, uptime: 99.3, responseTimeMs: 200, errorRate: 0.15,
    description: 'Portal self-service do beneficiário com agenda, documentos e teleconsulta.',
  },
  {
    id: 'mod-015', name: 'PPR — Portal do Profissional', code: 'PPR', category: 'integration',
    status: 'online', version: '1.0.0', lastDeploy: '2026-06-24T10:00:00Z',
    routes: ['/portal-profissional'],
    dependencies: ['PEL', 'AGI', 'TLC', 'IAM'], components: 14, apis: 9, uptime: 99.4, responseTimeMs: 185, errorRate: 0.12,
    description: 'Portal do profissional para agenda, prontuário, assinaturas e teleconsultas.',
  },
  {
    id: 'mod-016', name: 'NTF — Central de Notificações', code: 'NTF', category: 'integration',
    status: 'online', version: '1.2.0', lastDeploy: '2026-06-25T08:00:00Z',
    routes: ['/notificacoes'],
    dependencies: ['BPMS', 'IAM'], components: 8, apis: 5, uptime: 99.95, responseTimeMs: 55, errorRate: 0.02,
    description: 'Central multi-canal: push, email, WhatsApp e SMS com templates configuráveis.',
  },
  {
    id: 'mod-017', name: 'BI — Business Intelligence', code: 'BIC', category: 'admin',
    status: 'online', version: '1.1.0', lastDeploy: '2026-06-25T08:00:00Z',
    routes: ['/bi', '/relatorios'],
    dependencies: ['GIC', 'PEL', 'ERS', 'IAM'], components: 21, apis: 13, uptime: 99.5, responseTimeMs: 380, errorRate: 0.25,
    description: 'Business Intelligence com dashboards, KPIs e exportações de relatórios.',
  },
  {
    id: 'mod-018', name: 'PIARAVE — Relações Abusivas', code: 'PIARAVE', category: 'social',
    status: 'online', version: '1.0.0', lastDeploy: '2026-06-29T18:00:00Z',
    routes: ['/piarave', '/piarave-acolhimento', '/piarave-biblioteca'],
    dependencies: ['ARE', 'SATAI', 'GIC', 'MCSI', 'IAM'], components: 24, apis: 15, uptime: 99.9, responseTimeMs: 135, errorRate: 0.04,
    description: 'Programa especializado de acolhimento às vítimas de violência relacional e manipulação psicológica.',
  },
  {
    id: 'mod-019', name: 'OBS — Observabilidade e Monitoramento', code: 'OBS', category: 'admin',
    status: 'online', version: '1.0.0', lastDeploy: '2026-06-29T20:00:00Z',
    routes: ['/auditoria-plataforma'],
    dependencies: ['IAM', 'MCSI'], components: 30, apis: 18, uptime: 100, responseTimeMs: 20, errorRate: 0,
    description: 'Platform Health & Audit Center com testes E2E, observabilidade, compliance e certificação.',
  },
  {
    id: 'mod-020', name: 'APP — Aplicativo Móvel (PWA)', code: 'APP', category: 'integration',
    status: 'online', version: '1.0.0', lastDeploy: '2026-06-29T20:00:00Z',
    routes: ['/app'],
    dependencies: ['PBN', 'PPR', 'IAM'], components: 10, apis: 6, uptime: 99.2, responseTimeMs: 240, errorRate: 0.18,
    description: 'Aplicativo web progressivo (PWA) para beneficiários e profissionais no mobile.',
  },
];

// ─── Integration Checks ─────────────────────────────────────
export const MOCK_INTEGRATIONS: IntegrationCheck[] = [
  { id: 'int-001', sourceModule: 'ARE', targetModule: 'SATAI', type: 'event', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 12, dataFlow: 'unidirectional', protocol: 'Event Bus' },
  { id: 'int-002', sourceModule: 'SATAI', targetModule: 'BPMS', type: 'api', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 45, dataFlow: 'unidirectional', protocol: 'REST' },
  { id: 'int-003', sourceModule: 'BPMS', targetModule: 'GIC', type: 'event', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 18, dataFlow: 'bidirectional', protocol: 'Event Bus' },
  { id: 'int-004', sourceModule: 'GIC', targetModule: 'PEL', type: 'api', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 67, dataFlow: 'bidirectional', protocol: 'REST' },
  { id: 'int-005', sourceModule: 'GIC', targetModule: 'AGI', type: 'api', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 33, dataFlow: 'bidirectional', protocol: 'REST' },
  { id: 'int-006', sourceModule: 'AGI', targetModule: 'TLC', type: 'webhook', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 28, dataFlow: 'unidirectional', protocol: 'WebHook' },
  { id: 'int-007', sourceModule: 'BPMS', targetModule: 'NTF', type: 'event', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 8, dataFlow: 'unidirectional', protocol: 'Event Bus' },
  { id: 'int-008', sourceModule: 'PIARAVE', targetModule: 'GIC', type: 'api', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 55, dataFlow: 'bidirectional', protocol: 'REST' },
  { id: 'int-009', sourceModule: 'PIARAVE', targetModule: 'MCSI', type: 'api', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 22, dataFlow: 'unidirectional', protocol: 'REST' },
  { id: 'int-010', sourceModule: 'PBN', targetModule: 'AGI', type: 'api', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 82, dataFlow: 'bidirectional', protocol: 'REST' },
  { id: 'int-011', sourceModule: 'PPR', targetModule: 'PEL', type: 'api', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 95, dataFlow: 'bidirectional', protocol: 'REST' },
  { id: 'int-012', sourceModule: 'ERS', targetModule: 'CRS', type: 'api', status: 'partial', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 210, dataFlow: 'unidirectional', protocol: 'REST', errorMessage: 'Latência elevada detectada no endpoint de prestação de contas.' },
  { id: 'int-013', sourceModule: 'IAM', targetModule: 'MCSI', type: 'sync', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 10, dataFlow: 'bidirectional', protocol: 'Internal RPC' },
  { id: 'int-014', sourceModule: 'BIC', targetModule: 'GIC', type: 'async', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 420, dataFlow: 'unidirectional', protocol: 'CDC / Change Data Capture' },
  { id: 'int-015', sourceModule: 'VOL', targetModule: 'AGI', type: 'api', status: 'synced', lastChecked: '2026-06-29T21:00:00Z', latencyMs: 60, dataFlow: 'bidirectional', protocol: 'REST' },
];

// ─── E2E Journeys ───────────────────────────────────────────
export const MOCK_JOURNEYS: E2eJourney[] = [
  {
    id: 'jrn-001',
    name: 'Jornada Completa do Beneficiário',
    description: 'Novo beneficiário → cadastro → acolhimento → triagem → distribuição → agenda → teleconsulta → prontuário → documento → alta.',
    persona: 'Maria S. — beneficiária civil',
    priority: 'critical',
    status: 'idle',
    steps: [
      { id: 's1-01', stepIndex: 1, name: 'Acesso à plataforma', module: 'IAM', action: 'Navegar para /registro', status: 'pending', assertions: ['Página carregada em < 2s', 'Formulário visível'] },
      { id: 's1-02', stepIndex: 2, name: 'Preenchimento do cadastro adaptativo', module: 'ARE', action: 'Preencher dados pessoais e socioeconômicos', status: 'pending', assertions: ['Campos validados', 'IIP calculado', 'Cofre Digital ativado'] },
      { id: 's1-03', stepIndex: 3, name: 'Aceite dos termos LGPD', module: 'ARE', action: 'Clicar em aceitar termos', status: 'pending', assertions: ['Consentimento registrado com timestamp', 'Versão do termo salva'] },
      { id: 's1-04', stepIndex: 4, name: 'Acolhimento inicial SATAI', module: 'SATAI', action: 'Iniciar wizard de acolhimento', status: 'pending', assertions: ['Protocolo resolvido automaticamente pelo perfil', 'Perguntas condicionais exibidas corretamente'] },
      { id: 's1-05', stepIndex: 5, name: 'Dossiê gerado e enviado', module: 'SATAI', action: 'Finalizar triagem e gerar dossiê', status: 'pending', assertions: ['Dossiê criado com ID único', 'BPMS notificado para abertura de caso'] },
      { id: 's1-06', stepIndex: 6, name: 'Distribuição para equipe técnica', module: 'GIC', action: 'Sistema distribui caso automaticamente', status: 'pending', assertions: ['Caso criado no GIC', 'Profissional responsável atribuído', 'Notificação enviada'] },
      { id: 's1-07', stepIndex: 7, name: 'Agendamento da primeira consulta', module: 'AGI', action: 'Agendar consulta pelo sistema', status: 'pending', assertions: ['Slot disponível reservado', 'Confirmação enviada por NTF'] },
      { id: 's1-08', stepIndex: 8, name: 'Acesso à teleconsulta', module: 'TLC', action: 'Entrar na sala virtual', status: 'pending', assertions: ['Sala criada com token seguro', 'Conexão estabelecida'] },
      { id: 's1-09', stepIndex: 9, name: 'Registro de evolução no prontuário', module: 'PEL', action: 'Profissional registra evolução e assina', status: 'pending', assertions: ['Evolução salva com assinatura digital', 'Histórico atualizado'] },
      { id: 's1-10', stepIndex: 10, name: 'Emissão de documento', module: 'PEL', action: 'Emitir declaração de atendimento', status: 'pending', assertions: ['Documento gerado em PDF', 'Assinatura válida', 'Disponível no portal do beneficiário'] },
    ],
  },
  {
    id: 'jrn-002',
    name: 'Servidor da Segurança Pública',
    description: 'Servidor → cadastro protegido → MCSI → atendimento especializado → auditoria imutável.',
    persona: 'João A. — policial civil, CAFS',
    priority: 'critical',
    status: 'idle',
    steps: [
      { id: 's2-01', stepIndex: 1, name: 'Cadastro protegido com dados mascarados', module: 'ARE', action: 'Preencher formulário de segurança pública', status: 'pending', assertions: ['Dados de risco mascarados automaticamente (MCSI)', 'IIP calculado para perfil CAFS'] },
      { id: 's2-02', stepIndex: 2, name: 'Cofre Digital ativado e criptografado', module: 'MCSI', action: 'Armazenar dados de localização e vínculos no cofre', status: 'pending', assertions: ['Cofre criptografado AES-256', 'Acesso apenas por SuperAdmin'] },
      { id: 's2-03', stepIndex: 3, name: 'Protocolo SATAI especializado carregado', module: 'SATAI', action: 'Iniciar triagem com protocolo Saúde Mental Militar', status: 'pending', assertions: ['Protocolo correto resolvido para perfil CAFS', 'Perguntas adaptadas ao contexto'] },
      { id: 's2-04', stepIndex: 4, name: 'Atendimento registrado com segregação ABAC', module: 'PEL', action: 'Registrar evolução com controle de acesso', status: 'pending', assertions: ['Psiquiatra vê evolução completa', 'Outros perfis veem apenas dados permitidos'] },
      { id: 's2-05', stepIndex: 5, name: 'Trilha de auditoria verificada', module: 'MCSI', action: 'Verificar log imutável de acessos', status: 'pending', assertions: ['Todos os acessos rastreados', 'Nenhum dado sensível exposto fora do escopo'] },
    ],
  },
  {
    id: 'jrn-003',
    name: 'Atendimento de Menor de Idade',
    description: 'Menor → cadastro → responsável legal → autorizações → atendimento → evolução.',
    persona: 'Ana K. — 14 anos, responsável: mãe',
    priority: 'high',
    status: 'idle',
    steps: [
      { id: 's3-01', stepIndex: 1, name: 'Cadastro com flag de menor de idade', module: 'ARE', action: 'Preencher dados com responsável legal vinculado', status: 'pending', assertions: ['Responsável legal vinculado obrigatório', 'Consentimento do responsável coletado'] },
      { id: 's3-02', stepIndex: 2, name: 'Autorização legal registrada', module: 'ARE', action: 'Registrar termo de responsabilidade parental', status: 'pending', assertions: ['Documento assinado e salvo', 'Data e versão registradas'] },
      { id: 's3-03', stepIndex: 3, name: 'SATAI protocolo infanto-juvenil', module: 'SATAI', action: 'Aplicar triagem com protocolo Infanto-Juvenil', status: 'pending', assertions: ['Protocolo correto ativado', 'Linguagem adaptada ao público menor'] },
      { id: 's3-04', stepIndex: 4, name: 'Atendimento com presença do responsável', module: 'PEL', action: 'Registrar atendimento com anotação de presença do responsável', status: 'pending', assertions: ['Presença do responsável registrada', 'Evolução vinculada ao menor e ao responsável'] },
    ],
  },
  {
    id: 'jrn-004',
    name: 'Profissional Voluntário',
    description: 'Voluntário → login → agenda → atendimento → assinatura → horas voluntárias registradas.',
    persona: 'Dr. Paulo R. — psicólogo voluntário',
    priority: 'high',
    status: 'idle',
    steps: [
      { id: 's4-01', stepIndex: 1, name: 'Login com MFA', module: 'IAM', action: 'Autenticar com usuário + TOTP', status: 'pending', assertions: ['MFA validado', 'Sessão criada com TTL correto', 'Perfil de voluntário carregado'] },
      { id: 's4-02', stepIndex: 2, name: 'Visualizar agenda de voluntariado', module: 'AGI', action: 'Acessar agenda filtrada para voluntário', status: 'pending', assertions: ['Apenas slots de voluntariado visíveis', 'Dados de beneficiários mascarados'] },
      { id: 's4-03', stepIndex: 3, name: 'Registrar evolução e assinar digitalmente', module: 'PEL', action: 'Preencher evolução e assinar com senha', status: 'pending', assertions: ['Assinatura digital gerada', 'Evolução bloqueada para edição após assinatura'] },
      { id: 's4-04', stepIndex: 4, name: 'Horas voluntárias contabilizadas', module: 'VOL', action: 'Verificar horas registradas automaticamente', status: 'pending', assertions: ['Hora adicionada ao saldo do voluntário', 'Certificado disponível para download'] },
    ],
  },
  {
    id: 'jrn-005',
    name: 'Acolhimento PIARAVE',
    description: 'Vítima de relação abusiva → wizard → plano de segurança → encaminhamento especializado.',
    persona: 'Clara M. — vítima de controle coercitivo',
    priority: 'critical',
    status: 'idle',
    steps: [
      { id: 's5-01', stepIndex: 1, name: 'Acesso ao wizard de acolhimento', module: 'PIARAVE', action: 'Navegar para /piarave-acolhimento', status: 'pending', assertions: ['Botão de saída rápida visível', 'Tela carregada em < 1.5s'] },
      { id: 's5-02', stepIndex: 2, name: 'Classificação de formas de abuso', module: 'PIARAVE', action: 'Selecionar tipos de violência vivenciada', status: 'pending', assertions: ['Múltiplas opções selecionadas', 'Classificação salva de forma segura'] },
      { id: 's5-03', stepIndex: 3, name: 'Criação do Plano de Segurança', module: 'PIARAVE', action: 'Preencher pessoas de confiança e local de fuga', status: 'pending', assertions: ['Dados criptografados no Cofre Digital MCSI', 'Acesso registrado em auditoria imutável'] },
      { id: 's5-04', stepIndex: 4, name: 'Abertura automática de caso GIC', module: 'GIC', action: 'BPMS dispara criação de caso PIARAVE', status: 'pending', assertions: ['Caso criado com linha de atendimento correta', 'Profissional especializado atribuído'] },
    ],
  },
];

// ─── Load Test Results ──────────────────────────────────────
export const MOCK_LOAD_TESTS: LoadTestResult[] = [
  {
    id: 'lt-001', name: 'Carga — 100 Usuários Simultâneos', executedAt: '2026-06-29T20:00:00Z', durationMinutes: 10,
    status: 'passed', conclusion: 'Plataforma estável. Tempo de resposta médio dentro do SLA (<500ms).',
    dataPoints: [
      { users: 100, avgResponseMs: 98, p95ResponseMs: 185, p99ResponseMs: 240, errorRate: 0.02, cpuPercent: 12, memoryPercent: 28, dbConnectionsActive: 18, requestsPerSecond: 340 },
    ],
  },
  {
    id: 'lt-002', name: 'Carga — 500 Usuários Simultâneos', executedAt: '2026-06-29T20:15:00Z', durationMinutes: 10,
    status: 'passed', conclusion: 'Desempenho adequado. P99 dentro do limite. CPU escalando conforme esperado.',
    dataPoints: [
      { users: 500, avgResponseMs: 185, p95ResponseMs: 380, p99ResponseMs: 490, errorRate: 0.05, cpuPercent: 38, memoryPercent: 45, dbConnectionsActive: 72, requestsPerSecond: 1680 },
    ],
  },
  {
    id: 'lt-003', name: 'Carga — 1.000 Usuários Simultâneos', executedAt: '2026-06-29T20:30:00Z', durationMinutes: 10,
    status: 'passed', conclusion: 'Dentro do SLA com auto-scale ativado. Taxa de erro < 0.1%.',
    dataPoints: [
      { users: 1000, avgResponseMs: 320, p95ResponseMs: 650, p99ResponseMs: 820, errorRate: 0.08, cpuPercent: 62, memoryPercent: 58, dbConnectionsActive: 140, requestsPerSecond: 3200 },
    ],
  },
  {
    id: 'lt-004', name: 'Carga — 5.000 Usuários Simultâneos', executedAt: '2026-06-29T20:45:00Z', durationMinutes: 15,
    status: 'warning', conclusion: 'P99 ultrapassou 2s em pico de 5000 usuários. Recomenda-se revisão do pool de conexões do banco.',
    dataPoints: [
      { users: 5000, avgResponseMs: 780, p95ResponseMs: 1600, p99ResponseMs: 2100, errorRate: 0.22, cpuPercent: 82, memoryPercent: 74, dbConnectionsActive: 490, requestsPerSecond: 7200 },
    ],
  },
  {
    id: 'lt-005', name: 'Carga — 10.000 Usuários Simultâneos', executedAt: '2026-06-29T21:05:00Z', durationMinutes: 15,
    status: 'failed', conclusion: 'Timeout em módulos de BI e Prontuário. Necessário revisão de queries e aumento de réplicas de leitura.',
    dataPoints: [
      { users: 10000, avgResponseMs: 1850, p95ResponseMs: 4200, p99ResponseMs: 8900, errorRate: 1.8, cpuPercent: 96, memoryPercent: 89, dbConnectionsActive: 980, requestsPerSecond: 9800 },
    ],
  },
];

// ─── Resilience Tests ───────────────────────────────────────
export const MOCK_RESILIENCE_TESTS: ResilienceTestResult[] = [
  { id: 'res-001', scenario: 'Queda do banco de dados primário', simulatedFailure: 'Banco PostgreSQL primário desligado', recoveryTimeSeconds: 18, dataLossMinutes: 0, status: 'passed', notes: 'Failover automático para réplica de leitura em 18s. Sem perda de dados.', executedAt: '2026-06-29T21:30:00Z' },
  { id: 'res-002', scenario: 'Falha do serviço de e-mail', simulatedFailure: 'SMTP timeout forçado', recoveryTimeSeconds: 30, dataLossMinutes: 2, status: 'passed', notes: 'Fila de reenvio ativada automaticamente. E-mails entregues após reconexão.', executedAt: '2026-06-29T21:35:00Z' },
  { id: 'res-003', scenario: 'Falha de autenticação (IAM offline)', simulatedFailure: 'IAM service degraded', recoveryTimeSeconds: 45, dataLossMinutes: 0, status: 'passed', notes: 'Cache de tokens válidos preservou sessões ativas por até 10 minutos.', executedAt: '2026-06-29T21:40:00Z' },
  { id: 'res-004', scenario: 'Queda de conectividade de rede (modo offline)', simulatedFailure: 'Rede cortada por 5 minutos', recoveryTimeSeconds: 12, dataLossMinutes: 0, status: 'passed', notes: 'Service worker do PWA preservou rascunhos localmente. Sincronização automática ao reconectar.', executedAt: '2026-06-29T21:45:00Z' },
  { id: 'res-005', scenario: 'Falha no armazenamento de arquivos', simulatedFailure: 'Object storage indisponível', recoveryTimeSeconds: 90, dataLossMinutes: 5, status: 'passed', notes: 'Uploads pendentes enfileirados. Bucket de failover ativado em 90s.', executedAt: '2026-06-29T21:50:00Z' },
];

// ─── Backups ─────────────────────────────────────────────────
export const MOCK_BACKUPS: BackupRecord[] = [
  { id: 'bkp-001', type: 'full', status: 'success', scheduledAt: '2026-06-29T03:00:00Z', completedAt: '2026-06-29T03:42:00Z', sizeGb: 84.2, durationMinutes: 42, rtoHours: 1, rpoMinutes: 0, location: 'GCS Bucket BR-SP/Regiao-1', integrityCheck: 'passed', notes: 'Backup completo diário.' },
  { id: 'bkp-002', type: 'incremental', status: 'success', scheduledAt: '2026-06-29T09:00:00Z', completedAt: '2026-06-29T09:08:00Z', sizeGb: 4.1, durationMinutes: 8, rtoHours: 1, rpoMinutes: 60, location: 'GCS Bucket BR-SP/Regiao-1', integrityCheck: 'passed' },
  { id: 'bkp-003', type: 'incremental', status: 'success', scheduledAt: '2026-06-29T15:00:00Z', completedAt: '2026-06-29T15:07:00Z', sizeGb: 3.8, durationMinutes: 7, rtoHours: 1, rpoMinutes: 60, location: 'GCS Bucket BR-SP/Regiao-1', integrityCheck: 'passed' },
  { id: 'bkp-004', type: 'incremental', status: 'success', scheduledAt: '2026-06-29T21:00:00Z', completedAt: '2026-06-29T21:06:00Z', sizeGb: 2.9, durationMinutes: 6, rtoHours: 1, rpoMinutes: 60, location: 'GCS Bucket BR-SP/Regiao-1', integrityCheck: 'passed' },
  { id: 'bkp-005', type: 'full', status: 'scheduled', scheduledAt: '2026-06-30T03:00:00Z', sizeGb: 0, durationMinutes: 0, rtoHours: 1, rpoMinutes: 0, location: 'GCS Bucket BR-SP/Regiao-1', integrityCheck: 'pending' },
];

// ─── Security Alerts ────────────────────────────────────────
export const MOCK_SECURITY_ALERTS: SecurityAlert[] = [
  { id: 'sec-001', type: 'security', severity: 'medium', title: 'Múltiplas tentativas de login falhas', description: '5 tentativas de login falhas em 2 minutos para o usuário admin@ism.org.br. Rate limiting ativado.', module: 'IAM', sourceIp: '187.22.xxx.xxx', timestamp: '2026-06-29T18:30:00Z', status: 'resolved', resolution: 'Conta bloqueada temporariamente. IP adicionado à watchlist.' },
  { id: 'sec-002', type: 'performance', severity: 'low', title: 'Latência elevada na integração ERS→CRS', description: 'Endpoint de prestação de contas com resposta > 200ms por 15 minutos.', module: 'ERS', timestamp: '2026-06-29T19:45:00Z', status: 'acknowledged' },
  { id: 'sec-003', type: 'backup', severity: 'info', title: 'Backup incremental concluído com sucesso', description: 'Backup incremental das 21h00 concluído. Integridade verificada.', timestamp: '2026-06-29T21:06:00Z', status: 'resolved' },
  { id: 'sec-004', type: 'availability', severity: 'low', title: 'Taxa de erro acima do limiar em teste de carga', description: 'Módulo BI com taxa de erro de 1.8% durante teste de 10.000 usuários simultâneos.', module: 'BIC', timestamp: '2026-06-29T21:15:00Z', status: 'open' },
];

// ─── Compliance Matrix ──────────────────────────────────────
export const MOCK_COMPLIANCE: ComplianceItem[] = [
  { id: 'cmp-001', framework: 'LGPD', article: 'Art. 7º', requirement: 'Base legal de tratamento de dados', description: 'Toda operação de tratamento deve possuir base legal definida.', level: 'atendido', evidence: 'Consentimento coletado no ARE com timestamp e versão do termo. Bases legais documentadas no CGI.', responsible: 'DPO' },
  { id: 'cmp-002', framework: 'LGPD', article: 'Art. 15º', requirement: 'Direito à eliminação de dados', description: 'Titular pode solicitar eliminação de dados desnecessários.', level: 'atendido', evidence: 'Funcionalidade de solicitação disponível no Portal do Beneficiário. Processo documentado.', responsible: 'DPO' },
  { id: 'cmp-003', framework: 'LGPD', article: 'Art. 46º', requirement: 'Medidas de segurança técnicas e administrativas', description: 'Adoção de medidas capazes de proteger dados pessoais de acessos não autorizados.', level: 'atendido', evidence: 'MCSI com criptografia AES-256, mascaramento dinâmico, Cofre Digital e trilha de auditoria imutável.', responsible: 'CISO' },
  { id: 'cmp-004', framework: 'LGPD', article: 'Art. 37º', requirement: 'Registro das operações de tratamento', description: 'Manter registro das operações de tratamento.', level: 'atendido', evidence: 'Audit Vault com log imutável de todas as operações sobre dados pessoais.', responsible: 'DPO' },
  { id: 'cmp-005', framework: 'CFM', article: 'Res. 2.314/2022', requirement: 'Prontuário eletrônico médico', description: 'Prontuário eletrônico deve ser seguro, com assinatura digital e backup.', level: 'atendido', evidence: 'PEL com assinatura digital, versionamento e backup diário verificado.', responsible: 'CTO' },
  { id: 'cmp-006', framework: 'CFP', article: 'Res. 011/2018', requirement: 'Registro psicológico em atendimento digital', description: 'Registro clínico psicológico em modalidade digital deve seguir orientações do CFP.', level: 'atendido', evidence: 'Prontuário com segregação ABAC, campos obrigatórios configurados por especialidade.', responsible: 'Coordenação de Psicologia' },
  { id: 'cmp-007', framework: 'CRESS', requirement: 'Sigilo profissional em serviço social', description: 'Dados de atendimento social devem ser protegidos por sigilo profissional.', level: 'atendido', evidence: 'GIC com RBAC/ABAC. Assistentes sociais acessam apenas casos sob sua responsabilidade.', responsible: 'Coordenação Social' },
  { id: 'cmp-008', framework: 'MS_Saude_Digital', requirement: 'Conformidade com PNDS/RNDS', description: 'Serviços de saúde digital devem considerar a Rede Nacional de Dados em Saúde.', level: 'parcial', evidence: 'Módulos de saúde implementados com padrões FHIR internamente. Integração RNDS pendente de convênio com MS.', responsible: 'CTO', dueDate: '2026-12-31', notes: 'Aguardando homologação de credenciais pelo MS.' },
  { id: 'cmp-009', framework: 'ISO_27001', requirement: 'Gestão de riscos de segurança da informação', description: 'Implementar processo formal de gestão de riscos.', level: 'parcial', evidence: 'Matriz de riscos criada. Processo formal de revisão trimestral ainda não implementado.', responsible: 'CISO', dueDate: '2026-09-30' },
  { id: 'cmp-010', framework: 'Instituto_ISM', requirement: 'Rastreabilidade de todos os acessos a dados sensíveis', description: 'Toda leitura ou modificação de dados sensíveis deve ser registrada na trilha de auditoria.', level: 'atendido', evidence: 'MCSI Audit Vault registra automaticamente todos os acessos com usuário, timestamp e operação.', responsible: 'CISO' },
  { id: 'cmp-011', framework: 'LGPD', article: 'Art. 41º', requirement: 'Encarregado de Proteção de Dados (DPO)', description: 'Designação de um DPO com canal de comunicação público.', level: 'parcial', evidence: 'DPO designado internamente. Canal de contato externo ainda em processo de publicação no site institucional.', responsible: 'Jurídico', dueDate: '2026-08-31' },
  { id: 'cmp-012', framework: 'ISO_27701', requirement: 'Sistema de Gestão de Privacidade de Dados', description: 'Extensão da ISO 27001 para privacidade, exigindo PIMS.', level: 'pendente', evidence: 'Iniciativa prevista para 2027. Controles básicos já implementados como base.', responsible: 'DPO', dueDate: '2027-06-30' },
];

// ─── Distributed Trace Logs ─────────────────────────────────
export const MOCK_TRACE_LOGS: TraceLog[] = [
  { id: 'trc-001', traceId: 'abc123def456', spanId: 'span-001', service: 'ARE', operation: 'POST /api/beneficiarios', startTime: '2026-06-29T21:00:01.000Z', durationMs: 112, status: 'ok', tags: { 'http.status': '201', 'user.profile': 'civil' } },
  { id: 'trc-002', traceId: 'abc123def456', spanId: 'span-002', parentSpanId: 'span-001', service: 'MCSI', operation: 'encrypt.vault', startTime: '2026-06-29T21:00:01.040Z', durationMs: 22, status: 'ok', tags: { 'crypto.algorithm': 'AES-256-GCM' } },
  { id: 'trc-003', traceId: 'abc123def456', spanId: 'span-003', parentSpanId: 'span-001', service: 'BPMS', operation: 'trigger.workflow', startTime: '2026-06-29T21:00:01.065Z', durationMs: 18, status: 'ok', tags: { 'workflow.id': 'wf-acolhimento-inicial' } },
  { id: 'trc-004', traceId: 'abc123def456', spanId: 'span-004', parentSpanId: 'span-003', service: 'NTF', operation: 'send.notification', startTime: '2026-06-29T21:00:01.085Z', durationMs: 9, status: 'ok', tags: { 'channel': 'email', 'template': 'boas_vindas' } },
  { id: 'trc-005', traceId: 'xyz789ghi012', spanId: 'span-010', service: 'BIC', operation: 'GET /api/relatorios/kpis', startTime: '2026-06-29T21:00:05.000Z', durationMs: 380, status: 'ok', tags: { 'http.status': '200', 'cache.hit': 'false' } },
];

// ─── Health Metrics (Timeseries) ────────────────────────────
export const MOCK_HEALTH_METRICS: HealthMetric[] = [
  { timestamp: '2026-06-29T21:00:00Z', cpuPercent: 18, memoryPercent: 32, dbConnectionsActive: 24, dbConnectionsMax: 500, apiLatencyMs: 95, activeUsers: 42, requestsPerMinute: 1800, errorRate: 0.02, queueDepth: 0 },
  { timestamp: '2026-06-29T21:05:00Z', cpuPercent: 22, memoryPercent: 34, dbConnectionsActive: 31, dbConnectionsMax: 500, apiLatencyMs: 102, activeUsers: 58, requestsPerMinute: 2100, errorRate: 0.03, queueDepth: 2 },
  { timestamp: '2026-06-29T21:10:00Z', cpuPercent: 19, memoryPercent: 33, dbConnectionsActive: 27, dbConnectionsMax: 500, apiLatencyMs: 88, activeUsers: 51, requestsPerMinute: 1950, errorRate: 0.01, queueDepth: 0 },
  { timestamp: '2026-06-29T21:15:00Z', cpuPercent: 25, memoryPercent: 36, dbConnectionsActive: 38, dbConnectionsMax: 500, apiLatencyMs: 115, activeUsers: 67, requestsPerMinute: 2350, errorRate: 0.04, queueDepth: 5 },
  { timestamp: '2026-06-29T21:20:00Z', cpuPercent: 21, memoryPercent: 35, dbConnectionsActive: 33, dbConnectionsMax: 500, apiLatencyMs: 98, activeUsers: 60, requestsPerMinute: 2200, errorRate: 0.02, queueDepth: 1 },
  { timestamp: '2026-06-29T21:25:00Z', cpuPercent: 23, memoryPercent: 34, dbConnectionsActive: 29, dbConnectionsMax: 500, apiLatencyMs: 91, activeUsers: 55, requestsPerMinute: 2050, errorRate: 0.02, queueDepth: 0 },
];

// ─── Permission Audit ───────────────────────────────────────
export const MOCK_PERMISSION_AUDIT: PermissionAuditItem[] = [
  { id: 'perm-001', role: 'super_admin', module: 'Todos os Módulos', permissions: ['read', 'write', 'delete', 'audit', 'config', 'export', 'impersonate'], hasExcessiveAccess: false, findings: ['Acesso total justificado pelo papel. Ações auditadas via MCSI.'] },
  { id: 'perm-002', role: 'psicologo', module: 'PEL — Prontuário', permissions: ['read_own', 'write_own', 'sign'], hasExcessiveAccess: false, findings: ['Acesso restrito a próprios atendimentos. ABAC validado.'] },
  { id: 'perm-003', role: 'assistente_social', module: 'GIC — Casos', permissions: ['read_assigned', 'write_assigned', 'create'], hasExcessiveAccess: false, findings: ['Acesso limitado a casos sob responsabilidade. Validado.'] },
  { id: 'perm-004', role: 'voluntario', module: 'AGI — Agenda', permissions: ['read_own_slots', 'write_evolution'], hasExcessiveAccess: false, findings: ['Acesso restrito a slots de voluntariado. Correto.'] },
  { id: 'perm-005', role: 'coordenador_programa', module: 'PIARAVE — Admin', permissions: ['read_all_cases', 'write_pia', 'validate_resources', 'view_bi'], hasExcessiveAccess: false, findings: ['Sem acesso ao Cofre Digital. Sem acesso a dados de saúde. Segregação correta.'] },
  { id: 'perm-006', role: 'financeiro', module: 'ERS — Financeiro', permissions: ['read_all', 'write_all', 'export', 'read_beneficiary_data'], hasExcessiveAccess: true, findings: ['⚠️ Acesso a dados de beneficiários não necessário para função financeira.'], recommendation: 'Remover permissão read_beneficiary_data do papel financeiro. Princípio do menor privilégio.' },
];

// ─── Generated Reports ──────────────────────────────────────
export const MOCK_REPORTS: GeneratedReport[] = [
  { id: 'rpt-001', type: 'executive', title: 'Relatório Executivo da Plataforma', generatedAt: '2026-06-29T22:00:00Z', status: 'ready', summary: 'Plataforma com 20 módulos integrados, 99.7% de uptime médio, compilação TypeScript sem erros. 1 achado crítico de permissão excessiva identificado e pendente de correção.', criticalFindings: 0, highFindings: 1, mediumFindings: 2, lowFindings: 4, approved: false },
  { id: 'rpt-002', type: 'security', title: 'Relatório de Segurança', generatedAt: '2026-06-29T22:00:00Z', status: 'ready', summary: 'Criptografia AES-256 em repouso validada. MFA ativo para todos os perfis. 1 permissão excessiva no papel financeiro identificada.', criticalFindings: 0, highFindings: 1, mediumFindings: 1, lowFindings: 2, approved: false },
  { id: 'rpt-003', type: 'performance', title: 'Relatório de Desempenho', generatedAt: '2026-06-29T22:00:00Z', status: 'ready', summary: 'SLA atendido até 1.000 usuários. Módulos BI e Prontuário com degradação em 10.000 usuários. Recomendadas réplicas de leitura e cache de queries.', criticalFindings: 0, highFindings: 0, mediumFindings: 2, lowFindings: 3, approved: false },
  { id: 'rpt-004', type: 'compliance', title: 'Relatório de Compliance (LGPD / CFM / ISO)', generatedAt: '2026-06-29T22:00:00Z', status: 'ready', summary: '9 de 12 requisitos atendidos. 3 em status parcial (RNDS, ISO 27001 formal, publicação do DPO). 0 pendências críticas para produção.', criticalFindings: 0, highFindings: 0, mediumFindings: 3, lowFindings: 1, approved: false },
  { id: 'rpt-005', type: 'certification', title: 'Certificado Interno de Prontidão para Produção', generatedAt: '2026-06-29T22:00:00Z', status: 'ready', summary: 'Todos os testes críticos aprovados. 1 achado de alta prioridade pendente de correção (permissão excessiva). Recomenda-se aprovação condicionada à correção deste item antes da liberação final.', criticalFindings: 0, highFindings: 1, mediumFindings: 5, lowFindings: 7, approved: false },
];
