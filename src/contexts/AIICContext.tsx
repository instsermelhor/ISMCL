import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  AIICContextValue, AIModel, PredictionResult, Recommendation, KnowledgeGraph,
  KGNode, InstitutionalInsight, OptimizationOpportunity, ExecutiveKPI, AIICAuditEntry
} from '../types/aiic';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INITIAL_MODELS: AIModel[] = [
  {
    id: 'model-001', name: 'Modelo de Evasão de Beneficiários', type: 'predictive',
    version: 'v2.1.0', status: 'active', domain: 'Assistencial',
    description: 'Prevê probabilidade de evasão de beneficiários nas próximas 4 semanas baseado em padrões de frequência, engajamento e indicadores socioeconômicos.',
    accuracyPercent: 92, biasScore: 0.04, explainabilityScore: 0.88,
    lastTrainedAt: '2026-07-01T00:00:00Z', approvedBy: 'Chief AI Officer', approvedAt: '2026-07-02T00:00:00Z',
    tags: ['assistencial', 'beneficiários', 'evasão'], auditLog: []
  },
  {
    id: 'model-002', name: 'Modelo de Sobrecarga de Profissionais', type: 'predictive',
    version: 'v1.4.0', status: 'active', domain: 'RH',
    description: 'Detecta e prevê sobrecarga de profissionais e voluntários com base em carga de atendimento, horas, turnos e indicadores de burnout.',
    accuracyPercent: 89, biasScore: 0.06, explainabilityScore: 0.85,
    lastTrainedAt: '2026-06-15T00:00:00Z', approvedBy: 'Chief AI Officer', approvedAt: '2026-06-16T00:00:00Z',
    tags: ['rh', 'profissionais', 'burnout'], auditLog: []
  },
  {
    id: 'model-003', name: 'Motor de Recomendação Clínica', type: 'recommendation',
    version: 'v3.0.0', status: 'active', domain: 'Clínico',
    description: 'Recomenda encaminhamentos, protocolos e intervenções com base no perfil, histórico e risco do beneficiário. Todas as sugestões são explicáveis.',
    accuracyPercent: 94, biasScore: 0.03, explainabilityScore: 0.95,
    lastTrainedAt: '2026-07-10T00:00:00Z', approvedBy: 'Chief AI Officer', approvedAt: '2026-07-11T00:00:00Z',
    tags: ['clínico', 'encaminhamento', 'protocolo'], auditLog: []
  },
  {
    id: 'model-004', name: 'Modelo de Risco Financeiro', type: 'anomaly_detection',
    version: 'v1.2.0', status: 'active', domain: 'Financeiro',
    description: 'Identifica padrões anômalos em transações financeiras, prevê riscos de fluxo de caixa e gera alertas antes que se tornem críticos.',
    accuracyPercent: 91, biasScore: 0.02, explainabilityScore: 0.90,
    lastTrainedAt: '2026-06-20T00:00:00Z', approvedBy: 'Chief AI Officer', approvedAt: '2026-06-21T00:00:00Z',
    tags: ['financeiro', 'anomalia', 'risco'], auditLog: []
  },
  {
    id: 'model-005', name: 'Modelo de Demanda Futura', type: 'predictive',
    version: 'v2.0.0', status: 'retraining', domain: 'Operacional',
    description: 'Prevê a demanda de atendimentos para os próximos 30/60/90 dias para apoiar o planejamento de capacidade, escala e recursos.',
    accuracyPercent: 87, biasScore: 0.05, explainabilityScore: 0.82,
    lastTrainedAt: '2026-05-01T00:00:00Z', approvedBy: null, approvedAt: null,
    tags: ['operacional', 'demanda', 'planejamento'], auditLog: []
  },
  {
    id: 'model-006', name: 'Classificador de Risco Assistencial (SATAI+)', type: 'classification',
    version: 'v4.1.0', status: 'active', domain: 'Triagem',
    description: 'Classifica o risco assistencial de novos beneficiários na triagem com base em indicadores de vulnerabilidade e histórico de atendimentos similares.',
    accuracyPercent: 96, biasScore: 0.02, explainabilityScore: 0.97,
    lastTrainedAt: '2026-07-20T00:00:00Z', approvedBy: 'Chief AI Officer', approvedAt: '2026-07-21T00:00:00Z',
    tags: ['triagem', 'satai', 'risco'], auditLog: []
  },
];

const INITIAL_PREDICTIONS: PredictionResult[] = [
  {
    id: 'pred-001', target: 'beneficiary_dropout', targetLabel: 'Evasão de Beneficiários',
    probability: 0.23, confidenceLevel: 'high', horizon: 'próximas 4 semanas',
    explanation: '23% dos beneficiários ativos apresentam padrão de frequência e engajamento compatível com histórico de evasão. Grupos de risco identificados nas unidades Norte e Centro.',
    modelId: 'model-001', generatedAt: new Date().toISOString(), reviewedByHuman: true,
    actionRequired: true, suggestedAction: 'Acionar equipe de visita domiciliar nas próximas 72 horas para beneficiários identificados.'
  },
  {
    id: 'pred-002', target: 'professional_overload', targetLabel: 'Sobrecarga de Profissionais',
    probability: 0.41, confidenceLevel: 'high', horizon: 'próximas 2 semanas',
    explanation: '41% de probabilidade de sobrecarga na equipe de psicólogos considerando agenda atual, ausências previstas e demanda projetada.',
    modelId: 'model-002', generatedAt: new Date().toISOString(), reviewedByHuman: false,
    actionRequired: true, suggestedAction: 'Redistribuir agenda e acionar banco de voluntários com formação em psicologia.'
  },
  {
    id: 'pred-003', target: 'financial_risk', targetLabel: 'Risco Financeiro',
    probability: 0.12, confidenceLevel: 'medium', horizon: 'próximos 60 dias',
    explanation: 'Risco financeiro baixo/moderado detectado para os próximos 60 dias com base na projeção de receitas, despesas programadas e sazonalidade.',
    modelId: 'model-004', generatedAt: new Date().toISOString(), reviewedByHuman: true,
    actionRequired: false, suggestedAction: 'Monitorar receitas de captação no próximo ciclo.'
  },
  {
    id: 'pred-004', target: 'future_demand', targetLabel: 'Demanda Futura',
    probability: 0.78, confidenceLevel: 'high', horizon: 'próximos 30 dias',
    explanation: 'Previsão de aumento de 28% na demanda de atendimentos para os próximos 30 dias considerando histórico sazonal e campanhas previstas.',
    modelId: 'model-005', generatedAt: new Date().toISOString(), reviewedByHuman: false,
    actionRequired: true, suggestedAction: 'Ampliar capacidade de atendimento e acionar voluntários adicionais na semana 3.'
  }
];

const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-001', type: 'referral', typeLabel: 'Encaminhamento', priority: 'high',
    title: 'Encaminhamento para grupo de apoio — 12 beneficiários', confidenceScore: 0.94,
    description: 'Com base no perfil de 12 beneficiários, o modelo recomenda encaminhamento ao grupo de apoio psicossocial como complemento ao atendimento individual.',
    targetAudience: 'Equipe de Psicologia', justification: 'Padrão identificado: isolamento social + baixo engajamento + indicadores de vulnerabilidade elevados.',
    modelId: 'model-003', accepted: null, feedback: null,
    createdAt: new Date().toISOString(), expiresAt: null
  },
  {
    id: 'rec-002', type: 'training', typeLabel: 'Capacitação', priority: 'medium',
    title: 'Trilha de Escuta Qualificada — Voluntários Ativos', confidenceScore: 0.87,
    description: 'O motor de recomendação identificou 18 voluntários que se beneficiariam da trilha de Escuta Qualificada para melhorar a efetividade dos atendimentos.',
    targetAudience: 'Universidade Corporativa / RH', justification: 'Avaliação de competências indica lacuna em técnicas de escuta qualificada neste grupo.',
    modelId: 'model-003', accepted: null, feedback: null,
    createdAt: new Date().toISOString(), expiresAt: null
  },
  {
    id: 'rec-003', type: 'process_optimization', typeLabel: 'Otimização de Processo', priority: 'high',
    title: 'Automação do processo de reagendamento', confidenceScore: 0.91,
    description: 'O processo manual de reagendamento representa 22% do tempo administrativo. A automação via workflow BPMS geraria economia estimada de 60 horas/mês.',
    targetAudience: 'Gestão Operacional', justification: 'Análise de logs BPMS + tempo médio de execução + taxa de retrabalho identificaram o gargalo.',
    modelId: 'model-003', accepted: true, feedback: 'Aprovado. Iniciando mapeamento com equipe BPMS.',
    createdAt: new Date().toISOString(), expiresAt: null
  }
];

const INITIAL_KG: KnowledgeGraph = {
  nodes: [
    { id: 'n1', type: 'person', label: 'Beneficiário A', properties: { risco: 'alto', programa: 'PIARAVE' }, connections: 8 },
    { id: 'n2', type: 'person', label: 'Profissional B (Psicóloga)', properties: { carga: '92%', especialidade: 'Psicologia Clínica' }, connections: 24 },
    { id: 'n3', type: 'organization', label: 'Instituto Ser Melhor', properties: { beneficiarios: 'ativo' }, connections: 150 },
    { id: 'n4', type: 'project', label: 'Programa PIARAVE', properties: { status: 'ativo' }, connections: 38 },
    { id: 'n5', type: 'risk', label: 'Risco de Evasão — Unidade Norte', properties: { probabilidade: '0.23', impacto: 'alto' }, connections: 12 },
    { id: 'n6', type: 'competency', label: 'Escuta Qualificada', properties: { nivel: 'recomendado' }, connections: 18 },
    { id: 'n7', type: 'document', label: 'POP-ATEND-001', properties: { versao: 'v3.0' }, connections: 7 },
    { id: 'n8', type: 'process', label: 'Workflow de Triagem SATAI', properties: { etapas: '6' }, connections: 42 },
    { id: 'n9', type: 'indicator', label: 'NPS Institucional', properties: { valor: '78', tendencia: 'estável' }, connections: 9 },
  ],
  edges: [
    { source: 'n1', target: 'n4', relationship: 'participates_in', weight: 0.9 },
    { source: 'n2', target: 'n1', relationship: 'attends', weight: 0.85 },
    { source: 'n5', target: 'n1', relationship: 'risk_associated_with', weight: 0.7 },
    { source: 'n6', target: 'n2', relationship: 'competency_gap', weight: 0.4 },
    { source: 'n8', target: 'n1', relationship: 'triaged_via', weight: 1.0 },
  ],
  lastUpdatedAt: new Date().toISOString(),
  totalRelationships: 5,
};

const INITIAL_INSIGHTS: InstitutionalInsight[] = [
  {
    id: 'ins-001', title: 'Aumento de 18% nos casos de vulnerabilidade extrema — Julho/2026',
    description: 'A análise cruzada de dados assistenciais, sociais e de triagem detectou crescimento significativo de casos com indicadores de vulnerabilidade extrema no mês de julho.',
    category: 'Impacto Social', severity: 'high',
    relatedModule: 'SATAI + PIARAVE', dataSource: ['Prontuário', 'Triagem', 'Gestão Social'],
    generatedAt: new Date().toISOString(),
    actionItems: ['Ampliar equipe de triagem prioritária', 'Acionar parcerias externas de suporte social'],
    linkedRecommendationIds: ['rec-001']
  },
  {
    id: 'ins-002', title: 'Eficiência operacional dos workflows caiu 8% em 30 dias',
    description: 'Logs do BPMS e observabilidade APM indicam queda de eficiência em 3 workflows críticos: Reagendamento, Encaminhamento Externo e Emissão de Relatórios.',
    category: 'Eficiência Operacional', severity: 'medium',
    relatedModule: 'BPMS + Observabilidade', dataSource: ['BPMS', 'APM', 'Logs'],
    generatedAt: new Date().toISOString(),
    actionItems: ['Mapear causa-raiz dos gargalos', 'Implementar automação de reagendamento (Rec-003)'],
    linkedRecommendationIds: ['rec-003']
  }
];

const INITIAL_OPTIMIZATIONS: OptimizationOpportunity[] = [
  {
    id: 'opt-001', title: 'Automação do reagendamento manual', area: 'Operacional',
    type: 'bottleneck', impact: 'high', effort: 'medium', status: 'action_planned',
    description: 'Processo de reagendamento manual identificado como gargalo crítico com tempo médio de 18 minutos por caso.',
    proposedAction: 'Implementar automação via BPMS com notificação automática por WhatsApp.',
    estimatedGain: 'Redução de 60 horas/mês de trabalho administrativo.', identifiedAt: new Date().toISOString()
  },
  {
    id: 'opt-002', title: 'Consolidação de relatórios duplicados no ECM', area: 'Documental',
    type: 'redundancy', impact: 'medium', effort: 'low', status: 'identified',
    description: 'Análise do AECM identificou 47 documentos com conteúdo redundante entre módulos.',
    proposedAction: 'Aplicar deduplicação automática e atualizar tabela de temporalidade.',
    estimatedGain: 'Redução de 15% no volume de documentos e melhora de 22% na busca semântica.', identifiedAt: new Date().toISOString()
  }
];

const INITIAL_EXECUTIVE_KPIS: ExecutiveKPI[] = [
  { id: 'kpi-001', label: 'Beneficiários Ativos', value: '2.847', unit: 'pessoas', trend: 'up', trendPercent: 5.2, domain: 'Assistencial', alert: false, alertMessage: null },
  { id: 'kpi-002', label: 'NPS Institucional', value: '78', unit: 'pts', trend: 'stable', trendPercent: 0.3, domain: 'Qualidade', alert: false, alertMessage: null },
  { id: 'kpi-003', label: 'Taxa de Evasão', value: '4.1', unit: '%', trend: 'up', trendPercent: 1.2, domain: 'Assistencial', alert: true, alertMessage: 'Acima da meta de 3.0%' },
  { id: 'kpi-004', label: 'Custo por Atendimento', value: 'R$ 42,80', unit: '/atend.', trend: 'down', trendPercent: 3.5, domain: 'Financeiro', alert: false, alertMessage: null },
  { id: 'kpi-005', label: 'Uptime da Plataforma', value: '99.97', unit: '%', trend: 'stable', trendPercent: 0.0, domain: 'Tecnologia', alert: false, alertMessage: null },
  { id: 'kpi-006', label: 'Índice de Capacitação', value: '87', unit: '%', trend: 'up', trendPercent: 4.0, domain: 'Universidade', alert: false, alertMessage: null },
  { id: 'kpi-007', label: 'Atendimentos no Mês', value: '1.204', unit: 'atend.', trend: 'up', trendPercent: 8.1, domain: 'Operacional', alert: false, alertMessage: null },
  { id: 'kpi-008', label: 'Risco Financeiro', value: '12', unit: '%', trend: 'stable', trendPercent: 0.5, domain: 'Financeiro', alert: false, alertMessage: null },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const AIICContext = createContext<AIICContextValue | null>(null);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch { return fallback; }
}

export function AIICProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<AIModel[]>(() => loadStorage('aiic_models', INITIAL_MODELS));
  const [predictions, setPredictions] = useState<PredictionResult[]>(() => loadStorage('aiic_predictions', INITIAL_PREDICTIONS));
  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => loadStorage('aiic_recommendations', INITIAL_RECOMMENDATIONS));
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph>(() => loadStorage('aiic_kg', INITIAL_KG));
  const [insights] = useState<InstitutionalInsight[]>(INITIAL_INSIGHTS);
  const [optimizations, setOptimizations] = useState<OptimizationOpportunity[]>(() => loadStorage('aiic_optimizations', INITIAL_OPTIMIZATIONS));
  const [executiveKPIs] = useState<ExecutiveKPI[]>(INITIAL_EXECUTIVE_KPIS);
  const [auditLog, setAuditLog] = useState<AIICAuditEntry[]>(() => loadStorage('aiic_audit_log', []));

  useEffect(() => { localStorage.setItem('aiic_models', JSON.stringify(models)); }, [models]);
  useEffect(() => { localStorage.setItem('aiic_predictions', JSON.stringify(predictions)); }, [predictions]);
  useEffect(() => { localStorage.setItem('aiic_recommendations', JSON.stringify(recommendations)); }, [recommendations]);
  useEffect(() => { localStorage.setItem('aiic_kg', JSON.stringify(knowledgeGraph)); }, [knowledgeGraph]);
  useEffect(() => { localStorage.setItem('aiic_optimizations', JSON.stringify(optimizations)); }, [optimizations]);
  useEffect(() => { localStorage.setItem('aiic_audit_log', JSON.stringify(auditLog)); }, [auditLog]);

  const addAudit = useCallback((action: AIICAuditEntry['action'], description: string, actor: string, entityId: string) => {
    const entry: AIICAuditEntry = {
      id: `aiic-audit-${Date.now()}`, timestamp: new Date().toISOString(),
      actor, action, description, entityId, hash: Math.random().toString(36).substring(2, 10)
    };
    setAuditLog(prev => [entry, ...prev]);
    window.dispatchEvent(new CustomEvent('aiic:event', { detail: entry }));
  }, []);

  const approveModel = useCallback((modelId: string, approver: string) => {
    setModels(prev => prev.map(m =>
      m.id === modelId ? { ...m, status: 'active', approvedBy: approver, approvedAt: new Date().toISOString() } : m
    ));
    addAudit('AIModelApproved', `Modelo ${modelId} aprovado para produção por ${approver}`, approver, modelId);
  }, [addAudit]);

  const retrainModel = useCallback((modelId: string) => {
    setModels(prev => prev.map(m =>
      m.id === modelId ? { ...m, status: 'retraining', lastTrainedAt: new Date().toISOString() } : m
    ));
    addAudit('AIModelRetrained', `Re-treinamento iniciado para o modelo ${modelId}`, 'AI Training Pipeline', modelId);
  }, [addAudit]);

  const acceptRecommendation = useCallback((recId: string, feedback: string) => {
    setRecommendations(prev => prev.map(r =>
      r.id === recId ? { ...r, accepted: true, feedback } : r
    ));
    addAudit('RecommendationCreated', `Recomendação ${recId} ACEITA — Feedback: ${feedback}`, 'Gestor', recId);
  }, [addAudit]);

  const rejectRecommendation = useCallback((recId: string, feedback: string) => {
    setRecommendations(prev => prev.map(r =>
      r.id === recId ? { ...r, accepted: false, feedback } : r
    ));
    addAudit('RecommendationCreated', `Recomendação ${recId} REJEITADA — Feedback: ${feedback}`, 'Gestor', recId);
  }, [addAudit]);

  const runPredictions = useCallback(() => {
    addAudit('PredictionCalculated', 'Bateria de análises preditivas executada com sucesso em todos os domínios', 'AI Prediction Engine', 'all');
    addAudit('RiskPredictionGenerated', 'Previsões de risco atualizadas com dados do ciclo corrente', 'AI Risk Engine', 'all');
  }, [addAudit]);

  const runOptimizationScan = useCallback(() => {
    setOptimizations(prev => prev.map(o => ({ ...o, status: o.status === 'identified' ? 'in_analysis' : o.status })));
    addAudit('OptimizationSuggested', 'Varredura de otimização contínua executada — 2 oportunidades em análise', 'Continuous Optimization Engine', 'all');
    addAudit('ContinuousImprovementStarted', 'Planos de ação priorizados gerados para oportunidades identificadas', 'Optimization Engine', 'all');
  }, [addAudit]);

  const queryKnowledgeGraph = useCallback((query: string): KGNode[] => {
    const q = query.toLowerCase();
    const results = knowledgeGraph.nodes.filter(n =>
      n.label.toLowerCase().includes(q) || n.type.includes(q)
    );
    setKnowledgeGraph(prev => ({ ...prev, lastUpdatedAt: new Date().toISOString() }));
    addAudit('KnowledgeGraphUpdated', `Consulta semântica ao Grafo Institucional: "${query}" — ${results.length} resultado(s)`, 'Grafo Engine', 'kg-global');
    return results;
  }, [knowledgeGraph.nodes, addAudit]);

  const value = useMemo<AIICContextValue>(() => ({
    models, predictions, recommendations, knowledgeGraph, insights, optimizations, executiveKPIs, auditLog,
    approveModel, retrainModel, acceptRecommendation, rejectRecommendation, runPredictions, runOptimizationScan, queryKnowledgeGraph
  }), [models, predictions, recommendations, knowledgeGraph, insights, optimizations, executiveKPIs, auditLog,
    approveModel, retrainModel, acceptRecommendation, rejectRecommendation, runPredictions, runOptimizationScan, queryKnowledgeGraph]);

  return <AIICContext.Provider value={value}>{children}</AIICContext.Provider>;
}

export function useAIIC() {
  const ctx = useContext(AIICContext);
  if (!ctx) throw new Error('useAIIC must be used within AIICProvider');
  return ctx;
}
