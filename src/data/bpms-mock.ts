import {
  WorkflowDefinition,
  ProcessInstance,
  DynamicForm,
  BusinessRule,
  AutomationRule,
  ProcessIASuggestion,
  BPMSAuditEvent,
} from '../types/bpms';

// ------------------------------------------------------------
// 1. Catálogo Institucional de Processos (BPMN 2.0 Definitions)
// ------------------------------------------------------------

export const initialWorkflows: WorkflowDefinition[] = [
  {
    id: 'wf-001',
    name: 'Acolhimento de Menores de Idade',
    description: 'Processo assistencial para cadastro, validação de responsáveis legais e encaminhamento para triagem psicológica de menores.',
    category: 'social',
    version: 3,
    status: 'published',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-06-15T14:30:00Z',
    publishedAt: '2026-06-15T15:00:00Z',
    author: 'Dra. Roberta Santos',
    nodes: [
      { id: 'node-start', type: 'start', label: 'Cadastro Inicial', x: 80, y: 180, config: {} },
      { id: 'node-rule', type: 'condition', label: 'Avaliar Menor de Idade', x: 260, y: 180, config: { ruleId: 'rule-001' } },
      { id: 'node-guardian', type: 'task', label: 'Validar Responsável Legal', x: 440, y: 80, config: { assigneeRole: 'coordinator', formId: 'form-002', slaMinutes: 60 } },
      { id: 'node-triagem', type: 'task', label: 'Triagem Social/Clínica', x: 620, y: 180, config: { assigneeRole: 'professional', formId: 'form-001', slaMinutes: 120 } },
      { id: 'node-notification', type: 'notification', label: 'Notificar Responsável', x: 800, y: 180, config: { emailTemplate: 'welcome_social' } },
      { id: 'node-end', type: 'end', label: 'Finalizado', x: 960, y: 180, config: {} },
    ],
    edges: [
      { id: 'edge-1', source: 'node-start', target: 'node-rule' },
      { id: 'edge-2', source: 'node-rule', target: 'node-guardian', conditionValue: 'true' },
      { id: 'edge-3', source: 'node-rule', target: 'node-triagem', conditionValue: 'false' },
      { id: 'edge-4', source: 'node-guardian', target: 'node-triagem' },
      { id: 'edge-5', source: 'node-triagem', target: 'node-notification' },
      { id: 'edge-6', source: 'node-notification', target: 'node-end' },
    ],
  },
  {
    id: 'wf-002',
    name: 'Credenciamento de Voluntários Técnicos',
    description: 'Fluxo para captação, avaliação de conselho de classe (CRP/CRM) e ativação no IAM de novos voluntários.',
    category: 'administrative',
    version: 1,
    status: 'published',
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    publishedAt: '2026-03-01T10:30:00Z',
    author: 'Super Administrador',
    nodes: [
      { id: 'n-start', type: 'start', label: 'Cadastro Voluntário', x: 80, y: 150, config: {} },
      { id: 'n-doc-check', type: 'approval', label: 'Avaliar Documentação CRP/CRM', x: 250, y: 150, config: { assigneeRole: 'coordinator', slaMinutes: 1440 } },
      { id: 'n-interview', type: 'task', label: 'Entrevista de Alinhamento', x: 440, y: 150, config: { assigneeRole: 'manager', slaMinutes: 2880 } },
      { id: 'n-iam-creation', type: 'api_call', label: 'Gerar Perfil no IAM', x: 620, y: 150, config: { apiEndpoint: '/api/iam/provision' } },
      { id: 'n-end', type: 'end', label: 'Concluído', x: 800, y: 150, config: {} },
    ],
    edges: [
      { id: 'e-1', source: 'n-start', target: 'n-doc-check' },
      { id: 'e-2', source: 'n-doc-check', target: 'n-interview', conditionValue: 'aprovado' },
      { id: 'e-3', source: 'n-interview', target: 'n-iam-creation' },
      { id: 'e-4', source: 'n-iam-creation', target: 'n-end' },
    ],
  },
  {
    id: 'wf-003',
    name: 'Aprovação de Reembolso Financeiro',
    description: 'Processamento de prestação de contas e reembolsos assistenciais com alçada de aprovação multinível.',
    category: 'financial',
    version: 2,
    status: 'published',
    createdAt: '2026-02-15T11:00:00Z',
    updatedAt: '2026-05-10T16:00:00Z',
    publishedAt: '2026-05-10T16:15:00Z',
    author: 'Gestor Financeiro',
    nodes: [
      { id: 'r-start', type: 'start', label: 'Nova Solicitação', x: 80, y: 180, config: {} },
      { id: 'r-check-value', type: 'condition', label: 'Valor Superior a R$ 1.000?', x: 250, y: 180, config: { ruleId: 'rule-002' } },
      { id: 'r-coord-app', type: 'approval', label: 'Aprovação Coordenação', x: 440, y: 80, config: { assigneeRole: 'coordinator', slaMinutes: 720 } },
      { id: 'r-dir-app', type: 'approval', label: 'Aprovação Diretoria', x: 440, y: 280, config: { assigneeRole: 'director', slaMinutes: 1440 } },
      { id: 'r-payout', type: 'api_call', label: 'Conciliação Bancária API', x: 650, y: 180, config: { apiEndpoint: '/api/financial/payout' } },
      { id: 'r-end', type: 'end', label: 'Reembolsado', x: 820, y: 180, config: {} },
    ],
    edges: [
      { id: 're-1', source: 'r-start', target: 'r-check-value' },
      { id: 're-2', source: 'r-check-value', target: 'r-coord-app', conditionValue: 'false' },
      { id: 're-3', source: 'r-check-value', target: 'r-dir-app', conditionValue: 'true' },
      { id: 're-4', source: 'r-coord-app', target: 'r-payout', conditionValue: 'aprovado' },
      { id: 're-5', source: 'r-dir-app', target: 'r-payout', conditionValue: 'aprovado' },
      { id: 're-6', source: 'r-payout', target: 'r-end' },
    ],
  },
];

// ------------------------------------------------------------
// 2. Regulamentos do Motor de Regras (Rules Engine)
// ------------------------------------------------------------

export const initialRules: BusinessRule[] = [
  {
    id: 'rule-001',
    name: 'Verificar Menor de Idade',
    description: 'Valida se o beneficiário cadastrado tem idade inferior a 18 anos.',
    logicalOperator: 'AND',
    conditions: [
      { field: 'beneficiary.age', operator: 'less_than', value: 18 },
    ],
    thenNodeId: 'node-guardian',
    elseNodeId: 'node-triagem',
  },
  {
    id: 'rule-002',
    name: 'Alçada Financeira Diretor',
    description: 'Verifica se o valor a pagar exige aprovação executiva direta.',
    logicalOperator: 'AND',
    conditions: [
      { field: 'request.value', operator: 'greater_than', value: 1000 },
    ],
    thenNodeId: 'r-dir-app',
    elseNodeId: 'r-coord-app',
  },
];

// ------------------------------------------------------------
// 3. Construtor de Formulários Dinâmicos (Forms Catalogue)
// ------------------------------------------------------------

export const initialForms: DynamicForm[] = [
  {
    id: 'form-001',
    name: 'Triagem Social Inicial',
    description: 'Coleta de dados de vulnerabilidade social e queixa principal de saúde mental.',
    createdAt: '2026-01-10T12:00:00Z',
    fields: [
      { id: 'field-1', label: 'Queixa Principal', type: 'text', placeholder: 'Descreva a queixa do paciente...', required: true },
      { id: 'field-2', label: 'Renda Familiar Mensal (R$)', type: 'number', required: true },
      { id: 'field-3', label: 'Possui Medida Protetiva?', type: 'select', required: true, options: ['Sim', 'Não'] },
      { id: 'field-4', label: 'Descrição da Medida Protetiva', type: 'text', required: false, conditionalShowFieldId: 'field-3', conditionalShowValue: 'Sim' },
    ],
  },
  {
    id: 'form-002',
    name: 'Cadastro de Responsável Legal',
    description: 'Dados necessários para menor de idade sob guarda ou tutela.',
    createdAt: '2026-01-12T09:00:00Z',
    fields: [
      { id: 'f-guard-name', label: 'Nome do Responsável', type: 'text', required: true },
      { id: 'f-guard-cpf', label: 'CPF do Responsável', type: 'cpf', required: true },
      { id: 'f-guard-phone', label: 'Telefone de Contato', type: 'phone', required: true },
      { id: 'f-guard-doc', label: 'Termo de Guarda/Tutela (Upload)', type: 'file', required: true },
    ],
  },
];

// ------------------------------------------------------------
// 4. Instâncias de Processos em Execução (Run-Time State)
// ------------------------------------------------------------

export const initialInstances: ProcessInstance[] = [
  {
    id: 'inst-901',
    workflowId: 'wf-001',
    workflowName: 'Acolhimento de Menores de Idade',
    workflowVersion: 3,
    status: 'running',
    startedAt: '2026-06-29T10:00:00Z',
    currentNodeId: 'node-guardian',
    currentNodeLabel: 'Validar Responsável Legal',
    variables: {
      'beneficiary.name': 'Pedro Alencar (Menor)',
      'beneficiary.age': 14,
    },
    slaDeadline: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // expira em 45 minutos
    history: [
      {
        id: 'h-1',
        nodeId: 'node-start',
        nodeLabel: 'Cadastro Inicial',
        nodeType: 'start',
        completedAt: '2026-06-29T10:00:00Z',
        executorName: 'Atendente Social',
        slaStatus: 'met',
      },
      {
        id: 'h-2',
        nodeId: 'node-rule',
        nodeLabel: 'Avaliar Menor de Idade',
        nodeType: 'condition',
        completedAt: '2026-06-29T10:01:00Z',
        actionTaken: 'true',
        slaStatus: 'met',
      },
    ],
  },
  {
    id: 'inst-902',
    workflowId: 'wf-002',
    workflowName: 'Credenciamento de Voluntários Técnicos',
    workflowVersion: 1,
    status: 'running',
    startedAt: '2026-06-28T09:00:00Z',
    currentNodeId: 'n-doc-check',
    currentNodeLabel: 'Avaliar Documentação CRP/CRM',
    variables: {
      'professional.name': 'Dr. Marcos Rezende',
      'professional.email': 'marcos@exemplo.com',
      'professional.specialty': 'Psiquiatria',
    },
    slaDeadline: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // Estourado há 2 horas
    history: [
      {
        id: 'h-3',
        nodeId: 'n-start',
        nodeLabel: 'Cadastro Voluntário',
        nodeType: 'start',
        completedAt: '2026-06-28T09:00:00Z',
        executorName: 'Sistema',
        slaStatus: 'met',
      },
    ],
  },
];

// ------------------------------------------------------------
// 5. Central de Automação (Regras e Gatilhos Ativos)
// ------------------------------------------------------------

export const initialAutomations: AutomationRule[] = [
  {
    id: 'auto-001',
    name: 'Disparar Boas-Vindas Assistencial',
    trigger: 'new_registration',
    actionType: 'send_email',
    active: true,
    actionConfig: {
      template: 'welcome_social',
    },
  },
  {
    id: 'auto-002',
    name: 'Integração de Faturamento Webhook',
    trigger: 'payment_received',
    actionType: 'call_webhook',
    active: true,
    actionConfig: {
      payloadUrl: 'https://api.institutosermelhor.org/v1/integracoes/financeiro',
    },
  },
];

// ------------------------------------------------------------
// 6. Inteligência IA de Processos (Sugestões de Otimização)
// ------------------------------------------------------------

export const initialIASuggestions: ProcessIASuggestion[] = [
  {
    id: 'ia-sug-001',
    workflowId: 'wf-002',
    workflowName: 'Credenciamento de Voluntários Técnicos',
    type: 'bottleneck',
    description: 'Etapa "Avaliar Documentação CRP/CRM" acumula o maior tempo de espera, com média de 26.5 horas até a aprovação.',
    impactScore: 84,
    proposedChange: 'Automatizar consulta de registros profissionais consumindo diretamente a API do Conselho Federal de Psicologia (CFP).',
    status: 'pending',
    createdAt: '2026-06-29T12:00:00Z',
  },
  {
    id: 'ia-sug-002',
    workflowId: 'wf-001',
    workflowName: 'Acolhimento de Menores de Idade',
    type: 'redundancy',
    description: 'A etapa "Notificar Responsável" dispara email de boas-vindas logo após o salvamento, duplicando o gatilho sistêmico de envio da central de automações.',
    impactScore: 42,
    proposedChange: 'Unificar o envio de emails no barramento de eventos central, removendo o nó redundante de notificação do diagrama visual.',
    status: 'pending',
    createdAt: '2026-06-29T15:30:00Z',
  },
];

// ------------------------------------------------------------
// 7. Registro de Auditoria Permanente do BPMS
// ------------------------------------------------------------

export const initialAuditLogs: BPMSAuditEvent[] = [
  {
    id: 'aud-bpm-001',
    timestamp: '2026-06-15T15:00:00Z',
    userId: 'usr-001',
    userName: 'Roberta Santos',
    action: 'publish_workflow',
    workflowId: 'wf-001',
    details: 'Fluxo "Acolhimento de Menores de Idade" publicado na versão 3.',
    ipAddress: '192.168.1.1',
  },
  {
    id: 'aud-bpm-002',
    timestamp: '2026-06-29T10:00:00Z',
    userId: 'system',
    userName: 'Motor de Workflows',
    action: 'execute_workflow',
    instanceId: 'inst-901',
    details: 'Instância iniciada automaticamente pelo evento "new_registration".',
    ipAddress: '127.0.0.1',
  },
  {
    id: 'aud-bpm-003',
    timestamp: '2026-06-29T10:01:00Z',
    userId: 'system',
    userName: 'Rules Engine',
    action: 'node_completed',
    instanceId: 'inst-901',
    details: 'Regra condicional "rule-001" avaliada como VERDADEIRA. Direcionando fluxo para o nó "node-guardian".',
    ipAddress: '127.0.0.1',
  },
];
