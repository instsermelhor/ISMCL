import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  ACOPContextValue, SpecializedAgent, CognitiveTask, InstitutionalReasoning,
  CognitiveMemoryEntry, ManagedModel, AgentPerformanceMetric, ACOPAuditEntry
} from '../types/acop';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INITIAL_AGENTS: SpecializedAgent[] = [
  { id: 'agt-psy', name: 'Agente Psicologia', domain: 'psychology', domainLabel: 'Psicologia', status: 'processing', currentTaskId: 'task-001', tasksCompleted: 847, tasksInQueue: 3, avgResponseMs: 420, accuracyPercent: 94, lastActiveAt: new Date().toISOString(), capabilities: ['triagem clínica', 'avaliação de risco', 'protocolo terapêutico', 'encaminhamentos'], restrictedTo: ['psicologo', 'coordenador', 'diretor'] },
  { id: 'agt-psi', name: 'Agente Psiquiatria', domain: 'psychiatry', domainLabel: 'Psiquiatria', status: 'idle', currentTaskId: null, tasksCompleted: 312, tasksInQueue: 0, avgResponseMs: 580, accuracyPercent: 96, lastActiveAt: new Date().toISOString(), capabilities: ['avaliação psiquiátrica', 'gestão de medicação', 'protocolos de crise'], restrictedTo: ['psiquiatra', 'coordenador', 'diretor'] },
  { id: 'agt-soc', name: 'Agente Assistência Social', domain: 'social_work', domainLabel: 'Assistência Social', status: 'processing', currentTaskId: 'task-002', tasksCompleted: 1243, tasksInQueue: 5, avgResponseMs: 350, accuracyPercent: 92, lastActiveAt: new Date().toISOString(), capabilities: ['mapeamento social', 'elegibilidade CadÚnico', 'encaminhamento rede socioassistencial'], restrictedTo: ['assistente_social', 'coordenador', 'diretor'] },
  { id: 'agt-jur', name: 'Agente Jurídico', domain: 'legal', domainLabel: 'Jurídico', status: 'idle', currentTaskId: null, tasksCompleted: 156, tasksInQueue: 1, avgResponseMs: 720, accuracyPercent: 98, lastActiveAt: new Date().toISOString(), capabilities: ['análise contratual', 'compliance legal', 'LGPD', 'pareceres'], restrictedTo: ['juridico', 'diretor'] },
  { id: 'agt-fin', name: 'Agente Financeiro', domain: 'financial', domainLabel: 'Financeiro', status: 'idle', currentTaskId: null, tasksCompleted: 624, tasksInQueue: 0, avgResponseMs: 290, accuracyPercent: 97, lastActiveAt: new Date().toISOString(), capabilities: ['análise financeira', 'detecção de anomalias', 'previsão de fluxo'], restrictedTo: ['financeiro', 'diretor', 'cfo'] },
  { id: 'agt-hr', name: 'Agente RH', domain: 'hr', domainLabel: 'Recursos Humanos', status: 'awaiting_human', currentTaskId: 'task-003', tasksCompleted: 489, tasksInQueue: 2, avgResponseMs: 380, accuracyPercent: 91, lastActiveAt: new Date().toISOString(), capabilities: ['gestão de competências', 'análise de burnout', 'planejamento de escala'], restrictedTo: ['rh', 'diretor'] },
  { id: 'agt-cmp', name: 'Agente Compliance', domain: 'compliance', domainLabel: 'Compliance', status: 'idle', currentTaskId: null, tasksCompleted: 278, tasksInQueue: 0, avgResponseMs: 450, accuracyPercent: 99, lastActiveAt: new Date().toISOString(), capabilities: ['verificação LGPD', 'monitoramento regulatório', 'matriz de conformidade'], restrictedTo: ['compliance', 'diretor', 'cco'] },
  { id: 'agt-aud', name: 'Agente Auditoria', domain: 'audit', domainLabel: 'Auditoria', status: 'idle', currentTaskId: null, tasksCompleted: 412, tasksInQueue: 0, avgResponseMs: 510, accuracyPercent: 99, lastActiveAt: new Date().toISOString(), capabilities: ['auditoria de logs', 'análise de trilha', 'relatórios de auditoria'], restrictedTo: ['auditor', 'diretor'] },
  { id: 'agt-sec', name: 'Agente Segurança (MCSI)', domain: 'security', domainLabel: 'Segurança da Informação', status: 'processing', currentTaskId: 'task-004', tasksCompleted: 1847, tasksInQueue: 8, avgResponseMs: 180, accuracyPercent: 99, lastActiveAt: new Date().toISOString(), capabilities: ['análise de ameaças', 'detecção de anomalias', 'Zero Trust', 'SIEM'], restrictedTo: ['ciso', 'diretor', 'seguranca'] },
  { id: 'agt-cas', name: 'Agente Gestão de Casos', domain: 'case_management', domainLabel: 'Gestão de Casos', status: 'processing', currentTaskId: 'task-005', tasksCompleted: 2143, tasksInQueue: 12, avgResponseMs: 310, accuracyPercent: 93, lastActiveAt: new Date().toISOString(), capabilities: ['gestão de PIA', 'monitoramento de metas', 'progresso de casos', 'encerramento'], restrictedTo: ['coordenador', 'profissional', 'diretor'] },
  { id: 'agt-bi', name: 'Agente Business Intelligence', domain: 'bi', domainLabel: 'Business Intelligence', status: 'idle', currentTaskId: null, tasksCompleted: 934, tasksInQueue: 0, avgResponseMs: 620, accuracyPercent: 95, lastActiveAt: new Date().toISOString(), capabilities: ['geração de relatórios', 'análise de KPIs', 'previsão de tendências'], restrictedTo: ['gestor', 'diretor', 'analista'] },
  { id: 'agt-ecm', name: 'Agente ECM', domain: 'ecm', domainLabel: 'Gestão Documental', status: 'idle', currentTaskId: null, tasksCompleted: 567, tasksInQueue: 0, avgResponseMs: 260, accuracyPercent: 97, lastActiveAt: new Date().toISOString(), capabilities: ['classificação de documentos', 'OCR', 'busca semântica', 'temporalidade'], restrictedTo: ['gestor', 'administrativo', 'diretor'] },
  { id: 'agt-uni', name: 'Agente Universidade Corporativa', domain: 'corporate_university', domainLabel: 'Universidade Corporativa', status: 'idle', currentTaskId: null, tasksCompleted: 389, tasksInQueue: 0, avgResponseMs: 400, accuracyPercent: 90, lastActiveAt: new Date().toISOString(), capabilities: ['recomendação de trilhas', 'avaliação de competências', 'certificação'], restrictedTo: ['rh', 'gestor', 'diretor'] },
  { id: 'agt-gov', name: 'Agente Governança', domain: 'governance', domainLabel: 'Governança Corporativa', status: 'idle', currentTaskId: null, tasksCompleted: 201, tasksInQueue: 0, avgResponseMs: 680, accuracyPercent: 98, lastActiveAt: new Date().toISOString(), capabilities: ['análise de riscos', 'OKRs', 'compliance AEGRC', 'comitês'], restrictedTo: ['diretor', 'cgo', 'cro'] },
];

const INITIAL_TASKS: CognitiveTask[] = [
  { id: 'task-001', title: 'Avaliar risco psicossocial — Lote Junho/2026', description: 'Analisar 42 prontuários da triagem de junho e classificar por nível de risco com base em indicadores clínicos e socioeconômicos.', requestedBy: 'Coordenação Assistencial', assignedAgentId: 'agt-psy', assignedAgentName: 'Agente Psicologia', domain: 'psychology', priority: 'high', status: 'processing', createdAt: new Date().toISOString(), completedAt: null, result: null, requiresHumanValidation: true, validatedBy: null, evidences: ['Prontuários Triagem Junho', 'Escala PHQ-9', 'Histórico PIARAVE'] },
  { id: 'task-002', title: 'Elegibilidade CadÚnico — 18 beneficiários', description: 'Verificar elegibilidade e atualização de cadastro social para 18 beneficiários com alertas de prazo vencido.', requestedBy: 'Assistência Social', assignedAgentId: 'agt-soc', assignedAgentName: 'Agente Assistência Social', domain: 'social_work', priority: 'medium', status: 'processing', createdAt: new Date().toISOString(), completedAt: null, result: null, requiresHumanValidation: false, validatedBy: null, evidences: ['Base CadÚnico', 'Cadastro ISM', 'Alertas ARE'] },
  { id: 'task-003', title: 'Análise de sobrecarga — Equipe Psicologia', description: 'Avaliar carga de trabalho e indicadores de burnout da equipe de psicologia para recomendação de redistribuição de escala.', requestedBy: 'RH', assignedAgentId: 'agt-hr', assignedAgentName: 'Agente RH', domain: 'hr', priority: 'high', status: 'awaiting_human_validation', createdAt: new Date().toISOString(), completedAt: null, result: 'Detectados 3 profissionais com carga acima de 120% da capacidade nominal. Recomendada redistribuição imediata de 8 atendimentos.', requiresHumanValidation: true, validatedBy: null, evidences: ['Logs BPMS', 'Agenda', 'Escala Maslach'] },
  { id: 'task-004', title: 'Varredura de anomalias de segurança — Semanal', description: 'Análise semanal de logs de segurança para detecção de padrões anômalos, tentativas de acesso indevido e violações Zero Trust.', requestedBy: 'CISO', assignedAgentId: 'agt-sec', assignedAgentName: 'Agente Segurança (MCSI)', domain: 'security', priority: 'critical', status: 'processing', createdAt: new Date().toISOString(), completedAt: null, result: null, requiresHumanValidation: false, validatedBy: null, evidences: ['Logs MCSI', 'SIEM', 'IAM Audit Trail'] },
  { id: 'task-005', title: 'Revisão de metas dos PIAs — Q3/2026', description: 'Revisar progresso das metas dos Planos de Intervenção e Acompanhamento para o terceiro trimestre e identificar casos em risco de encerramento sem conclusão.', requestedBy: 'Coordenação PIARAVE', assignedAgentId: 'agt-cas', assignedAgentName: 'Agente Gestão de Casos', domain: 'case_management', priority: 'high', status: 'processing', createdAt: new Date().toISOString(), completedAt: null, result: null, requiresHumanValidation: true, validatedBy: null, evidences: ['PIARAVE', 'Prontuários', 'Metas Q3'] },
  { id: 'task-006', title: 'Análise de conformidade LGPD — Módulo ECM', description: 'Verificação de conformidade das práticas de gestão documental com os requisitos da LGPD, identificando documentos com dados pessoais sem anonimização adequada.', requestedBy: 'Compliance', assignedAgentId: null, assignedAgentName: null, domain: 'compliance', priority: 'high', status: 'queued', createdAt: new Date().toISOString(), completedAt: null, result: null, requiresHumanValidation: true, validatedBy: null, evidences: ['ECM', 'AECM', 'Política LGPD'] },
];

const INITIAL_REASONINGS: InstitutionalReasoning[] = [
  {
    id: 'reason-001',
    question: 'Quais são as causas da elevação da taxa de evasão no segundo semestre de 2026?',
    conclusion: 'A análise multi-fonte indica que o aumento da evasão (4.1%) está correlacionado com: (1) redução de 18% na disponibilidade de voluntários com perfil de acompanhamento domiciliar; (2) aumento de 22% no tempo médio entre triagem e primeiro atendimento; (3) concentração de casos de alta complexidade na unidade Norte sem suporte especializado suficiente.',
    confidenceScore: 0.91,
    traces: [
      { source: 'knowledge_graph', sourceLabel: 'Grafo Institucional', contribution: 'Correlação entre perfil de beneficiários evadidos e ausência de vínculos de acompanhamento', weight: 0.35 },
      { source: 'bi', sourceLabel: 'Business Intelligence', contribution: 'Série histórica de evasão e disponibilidade de voluntários 2024–2026', weight: 0.30 },
      { source: 'workflow', sourceLabel: 'Workflow Engine (BPMS)', contribution: 'Tempo médio entre triagem e atendimento por unidade', weight: 0.25 },
      { source: 'institutional_history', sourceLabel: 'Histórico Institucional', contribution: 'Padrões sazonais de evasão dos últimos 3 anos', weight: 0.10 },
    ],
    agentsInvolved: ['agt-psy', 'agt-soc', 'agt-cas', 'agt-bi'],
    createdAt: new Date().toISOString(),
    approved: true,
  }
];

const INITIAL_MEMORY: CognitiveMemoryEntry[] = [
  { id: 'mem-001', type: 'pattern', typeLabel: 'Padrão Recorrente', summary: 'Evasão sazonal historicamente aumenta 15–25% em fevereiro e julho, associada a férias escolares e redução de voluntários.', domain: 'case_management', relevanceScore: 0.95, timesReferenced: 12, createdAt: '2024-01-01T00:00:00Z', lastReferencedAt: new Date().toISOString(), tags: ['evasão', 'sazonalidade', 'voluntários'] },
  { id: 'mem-002', type: 'accepted_recommendation', typeLabel: 'Recomendação Aceita', summary: 'Automação do processo de reagendamento (Rec-003): aceita pela Gestão Operacional em julho/2026. Ganho estimado de 60h/mês.', domain: 'case_management', relevanceScore: 0.88, timesReferenced: 3, createdAt: new Date().toISOString(), lastReferencedAt: new Date().toISOString(), tags: ['automação', 'reagendamento', 'eficiência'] },
  { id: 'mem-003', type: 'decision', typeLabel: 'Decisão Institucional', summary: 'Diretoria decidiu priorizar expansão de banco de voluntários com formação em psicologia para Q4/2026, como resposta ao risco de sobrecarga detectado pelo AIIC.', domain: 'hr', relevanceScore: 0.92, timesReferenced: 5, createdAt: new Date().toISOString(), lastReferencedAt: new Date().toISOString(), tags: ['voluntários', 'psicologia', 'expansão', 'Q4'] },
  { id: 'mem-004', type: 'learning', typeLabel: 'Aprendizado Institucional', summary: 'Protocolos de acompanhamento com frequência quinzenal reduzem em 40% o risco de evasão em casos de alta vulnerabilidade.', domain: 'psychology', relevanceScore: 0.97, timesReferenced: 28, createdAt: '2025-03-01T00:00:00Z', lastReferencedAt: new Date().toISOString(), tags: ['protocolo', 'frequência', 'evasão', 'alta vulnerabilidade'] },
  { id: 'mem-005', type: 'feedback', typeLabel: 'Feedback Humano', summary: 'Recomendação de IA sobre redistribuição de escala foi parcialmente rejeitada: equipe preferiu rotação voluntária em vez de realocação compulsória.', domain: 'hr', relevanceScore: 0.80, timesReferenced: 2, createdAt: new Date().toISOString(), lastReferencedAt: new Date().toISOString(), tags: ['escala', 'redistribuição', 'rejeição', 'preferência humana'] },
];

const INITIAL_MODELS: ManagedModel[] = [
  { id: 'mlm-001', name: 'Classificador de Risco Triagem (SATAI+)', domain: 'Triagem', version: 'v4.1.0', phase: 'production', accuracyPercent: 96, driftScore: 0.04, latencyMs: 180, computeCostPerCall: 0.002, callsThisMonth: 18420, qualityScore: 0.97, lastEvaluatedAt: new Date().toISOString(), ownedBy: 'Agente Psicologia', alert: false, alertMessage: null },
  { id: 'mlm-002', name: 'Modelo de Evasão de Beneficiários', domain: 'Assistencial', version: 'v2.1.0', phase: 'production', accuracyPercent: 92, driftScore: 0.08, latencyMs: 420, computeCostPerCall: 0.005, callsThisMonth: 4280, qualityScore: 0.91, lastEvaluatedAt: new Date().toISOString(), ownedBy: 'Agente Gestão de Casos', alert: false, alertMessage: null },
  { id: 'mlm-003', name: 'Motor de Recomendação Clínica', domain: 'Clínico', version: 'v3.0.0', phase: 'production', accuracyPercent: 94, driftScore: 0.03, latencyMs: 310, computeCostPerCall: 0.008, callsThisMonth: 7641, qualityScore: 0.95, lastEvaluatedAt: new Date().toISOString(), ownedBy: 'Agente Psicologia', alert: false, alertMessage: null },
  { id: 'mlm-004', name: 'Modelo de Demanda Futura', domain: 'Operacional', version: 'v2.0.0', phase: 'monitoring', accuracyPercent: 87, driftScore: 0.19, latencyMs: 580, computeCostPerCall: 0.006, callsThisMonth: 1230, qualityScore: 0.78, lastEvaluatedAt: new Date().toISOString(), ownedBy: 'Agente BI', alert: true, alertMessage: 'Drift acima do limiar (0.19 > 0.15). Retreinamento recomendado.' },
  { id: 'mlm-005', name: 'Modelo de Risco Financeiro', domain: 'Financeiro', version: 'v1.2.0', phase: 'production', accuracyPercent: 91, driftScore: 0.05, latencyMs: 290, computeCostPerCall: 0.003, callsThisMonth: 3400, qualityScore: 0.92, lastEvaluatedAt: new Date().toISOString(), ownedBy: 'Agente Financeiro', alert: false, alertMessage: null },
  { id: 'mlm-006', name: 'Modelo de Sobrecarga de Profissionais', domain: 'RH', version: 'v1.4.0', phase: 'staging', accuracyPercent: 89, driftScore: 0.07, latencyMs: 380, computeCostPerCall: 0.004, callsThisMonth: 820, qualityScore: 0.88, lastEvaluatedAt: new Date().toISOString(), ownedBy: 'Agente RH', alert: false, alertMessage: null },
];

const INITIAL_METRICS: AgentPerformanceMetric[] = INITIAL_AGENTS.slice(0, 6).map(a => ({
  agentId: a.id,
  agentName: a.name,
  period: 'Julho/2026',
  tasksCompleted: a.tasksCompleted,
  avgLatencyMs: a.avgResponseMs,
  accuracyPercent: a.accuracyPercent,
  humanOverrideRate: Math.round(Math.random() * 15),
  satisfactionScore: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
  drift: a.id === 'agt-hr',
}));

// ─── Context ──────────────────────────────────────────────────────────────────

const ACOPContext = createContext<ACOPContextValue | null>(null);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
}

export function ACOPProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<SpecializedAgent[]>(() => loadStorage('acop_agents', INITIAL_AGENTS));
  const [tasks, setTasks] = useState<CognitiveTask[]>(() => loadStorage('acop_tasks', INITIAL_TASKS));
  const [reasonings, setReasonings] = useState<InstitutionalReasoning[]>(() => loadStorage('acop_reasonings', INITIAL_REASONINGS));
  const [cognitiveMemory, setCognitiveMemory] = useState<CognitiveMemoryEntry[]>(() => loadStorage('acop_memory', INITIAL_MEMORY));
  const [managedModels, setManagedModels] = useState<ManagedModel[]>(() => loadStorage('acop_models', INITIAL_MODELS));
  const [performanceMetrics] = useState<AgentPerformanceMetric[]>(INITIAL_METRICS);
  const [auditLog, setAuditLog] = useState<ACOPAuditEntry[]>(() => loadStorage('acop_audit_log', []));

  useEffect(() => { localStorage.setItem('acop_agents', JSON.stringify(agents)); }, [agents]);
  useEffect(() => { localStorage.setItem('acop_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('acop_reasonings', JSON.stringify(reasonings)); }, [reasonings]);
  useEffect(() => { localStorage.setItem('acop_memory', JSON.stringify(cognitiveMemory)); }, [cognitiveMemory]);
  useEffect(() => { localStorage.setItem('acop_models', JSON.stringify(managedModels)); }, [managedModels]);
  useEffect(() => { localStorage.setItem('acop_audit_log', JSON.stringify(auditLog)); }, [auditLog]);

  const addAudit = useCallback((action: ACOPAuditEntry['action'], description: string, actor: string, entityId: string) => {
    const entry: ACOPAuditEntry = {
      id: `acop-${Date.now()}`, timestamp: new Date().toISOString(),
      actor, action, description, entityId, hash: Math.random().toString(36).substring(2, 10)
    };
    setAuditLog(prev => [entry, ...prev]);
    window.dispatchEvent(new CustomEvent('acop:event', { detail: entry }));
  }, []);

  const assignTask = useCallback((taskInput: Omit<CognitiveTask, 'id' | 'assignedAgentId' | 'assignedAgentName' | 'status' | 'createdAt' | 'completedAt' | 'result' | 'validatedBy'>) => {
    // Find best available agent for domain
    const agent = agents.find(a => a.domain === taskInput.domain && (a.status === 'idle' || a.status === 'processing'));
    const newTask: CognitiveTask = {
      ...taskInput,
      id: `task-${Date.now()}`,
      assignedAgentId: agent?.id ?? null,
      assignedAgentName: agent?.name ?? null,
      status: agent ? 'processing' : 'queued',
      createdAt: new Date().toISOString(),
      completedAt: null,
      result: null,
      validatedBy: null,
    };
    setTasks(prev => [newTask, ...prev]);
    if (agent) {
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'processing', currentTaskId: newTask.id, tasksInQueue: a.tasksInQueue + 1 } : a));
    }
    addAudit('CognitiveTaskAssigned', `Tarefa "${newTask.title}" atribuída ao agente ${agent?.name ?? 'fila (sem agente disponível)'}`, 'Cognitive Orchestrator', newTask.id);
    if (agent) addAudit('AIAgentSelected', `Agente ${agent.name} selecionado via roteamento inteligente (domínio: ${taskInput.domain})`, 'AI Task Router', agent.id);
  }, [agents, addAudit]);

  const validateTask = useCallback((taskId: string, validator: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'completed', completedAt: new Date().toISOString(), validatedBy: validator } : t
    ));
    // Update memory with this decision
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const memEntry: CognitiveMemoryEntry = {
        id: `mem-${Date.now()}`, type: 'decision', typeLabel: 'Decisão Validada',
        summary: `Tarefa "${task.title}" validada por ${validator} — resultado incorporado à memória cognitiva institucional.`,
        domain: task.domain, relevanceScore: 0.75, timesReferenced: 0,
        createdAt: new Date().toISOString(), lastReferencedAt: new Date().toISOString(), tags: [task.domain, 'validação']
      };
      setCognitiveMemory(prev => [memEntry, ...prev]);
      addAudit('CognitiveMemoryUpdated', `Resultado da tarefa "${task.title}" incorporado à Memória Cognitiva Institucional`, validator, taskId);
    }
    addAudit('RecommendationApproved', `Tarefa ${taskId} validada e concluída por ${validator}`, validator, taskId);
  }, [tasks, addAudit]);

  const runReasoning = useCallback((question: string): InstitutionalReasoning => {
    const reasoning: InstitutionalReasoning = {
      id: `reason-${Date.now()}`,
      question,
      conclusion: `Raciocínio institucional gerado: Após análise multi-fonte (Grafo de Conhecimento, BI, Histórico e Políticas), a conclusão para a questão "${question}" foi construída com base em evidências de 4 fontes distintas, com confiança consolidada de 88%. Recomenda-se revisão humana antes de qualquer ação crítica.`,
      confidenceScore: 0.88,
      traces: [
        { source: 'knowledge_graph', sourceLabel: 'Grafo Institucional', contribution: 'Relações entre entidades relevantes mapeadas', weight: 0.30 },
        { source: 'bi', sourceLabel: 'Business Intelligence', contribution: 'Dados quantitativos de suporte', weight: 0.30 },
        { source: 'policy_catalog', sourceLabel: 'Catálogo de Políticas', contribution: 'Diretrizes institucionais aplicáveis', weight: 0.25 },
        { source: 'institutional_history', sourceLabel: 'Histórico Institucional', contribution: 'Precedentes e padrões históricos', weight: 0.15 },
      ],
      agentsInvolved: agents.filter(a => a.status !== 'offline').slice(0, 4).map(a => a.id),
      createdAt: new Date().toISOString(),
      approved: false,
    };
    setReasonings(prev => [reasoning, ...prev]);
    addAudit('InstitutionalReasoningCompleted', `Motor de Raciocínio Institucional concluiu análise: "${question}" — confiança: ${Math.round(reasoning.confidenceScore * 100)}%`, 'Institutional Reasoning Engine', reasoning.id);
    return reasoning;
  }, [agents, addAudit]);

  const retireModel = useCallback((modelId: string) => {
    setManagedModels(prev => prev.map(m => m.id === modelId ? { ...m, phase: 'retired', alert: false, alertMessage: null } : m));
    addAudit('ModelPerformanceChanged', `Modelo ${modelId} aposentado e removido de produção`, 'Model Lifecycle Manager', modelId);
  }, [addAudit]);

  const promoteModel = useCallback((modelId: string) => {
    setManagedModels(prev => prev.map(m => m.id === modelId ? { ...m, phase: 'production', alert: false, alertMessage: null } : m));
    addAudit('ModelPerformanceChanged', `Modelo ${modelId} promovido para produção via aprovação formal`, 'Model Lifecycle Manager', modelId);
  }, [addAudit]);

  const forceRetrain = useCallback((modelId: string) => {
    setManagedModels(prev => prev.map(m => m.id === modelId ? { ...m, phase: 'training', driftScore: 0.0, alert: false, alertMessage: null } : m));
    addAudit('ModelPerformanceChanged', `Retreinamento forçado iniciado para modelo ${modelId} — drift corrigido`, 'Model Lifecycle Manager', modelId);
  }, [addAudit]);

  const value = useMemo<ACOPContextValue>(() => ({
    agents, tasks, reasonings, cognitiveMemory, managedModels, performanceMetrics, auditLog,
    assignTask, validateTask, runReasoning, retireModel, promoteModel, forceRetrain,
  }), [agents, tasks, reasonings, cognitiveMemory, managedModels, performanceMetrics, auditLog,
    assignTask, validateTask, runReasoning, retireModel, promoteModel, forceRetrain]);

  return <ACOPContext.Provider value={value}>{children}</ACOPContext.Provider>;
}

export function useACOP() {
  const ctx = useContext(ACOPContext);
  if (!ctx) throw new Error('useACOP must be used within ACOPProvider');
  return ctx;
}
