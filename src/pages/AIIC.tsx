import React, { useState } from 'react';
import {
  Brain, Sparkles, TrendingUp, GitBranch, ShieldCheck, Zap, LayoutDashboard,
  Activity, CheckCircle2, XCircle, Clock, AlertTriangle, Check, RefreshCw,
  Search, ChevronUp, ChevronDown, Minus, Star
} from 'lucide-react';
import { cn } from '../utils';
import { useAIIC } from '../contexts/AIICContext';
import type { AIModel, PredictionResult, Recommendation, OptimizationOpportunity } from '../types/aiic';

// ─── Utilities ────────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-red-400 bg-red-900/30 border-red-500/30',
  high: 'text-orange-400 bg-orange-900/30 border-orange-500/30',
  medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30',
  low: 'text-teal-400 bg-teal-900/30 border-teal-500/30',
  informational: 'text-sky-400 bg-sky-900/30 border-sky-500/30',
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-400 bg-red-900/30 border-red-500/30',
  high: 'text-orange-400 bg-orange-900/30 border-orange-500/30',
  medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30',
  low: 'text-teal-400 bg-teal-900/30 border-teal-500/30',
};

const MODEL_STATUS_COLOR: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30',
  retraining: 'text-amber-400 bg-amber-900/30 border-amber-500/30',
  proposed: 'text-sky-400 bg-sky-900/30 border-sky-500/30',
  in_review: 'text-violet-400 bg-violet-900/30 border-violet-500/30',
  deprecated: 'text-slate-400 bg-slate-900/30 border-slate-500/30',
  approved: 'text-teal-400 bg-teal-900/30 border-teal-500/30',
  decommissioned: 'text-red-400 bg-red-900/30 border-red-500/30',
};

const MODEL_STATUS_LABEL: Record<string, string> = {
  active: 'Ativo em Produção',
  retraining: 'Retreinando',
  proposed: 'Proposto',
  in_review: 'Em Revisão',
  deprecated: 'Depreciado',
  approved: 'Aprovado',
  decommissioned: 'Desativado',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModelCard({ model, onApprove, onRetrain }: {
  model: AIModel;
  onApprove: (id: string) => void;
  onRetrain: (id: string) => void;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-white">{model.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{model.domain} · {model.version} · {model.type}</div>
        </div>
        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0', MODEL_STATUS_COLOR[model.status])}>
          {MODEL_STATUS_LABEL[model.status]}
        </span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">{model.description}</p>

      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="p-2 rounded-xl bg-black/30 text-center">
          <div className="text-sm font-bold text-emerald-400">{model.accuracyPercent}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Acurácia</div>
        </div>
        <div className="p-2 rounded-xl bg-black/30 text-center">
          <div className="text-sm font-bold text-amber-400">{(model.biasScore * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Viés</div>
        </div>
        <div className="p-2 rounded-xl bg-black/30 text-center">
          <div className="text-sm font-bold text-violet-400">{(model.explainabilityScore * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Explicabilidade</div>
        </div>
      </div>

      <div className="flex gap-2">
        {model.status === 'retraining' || model.status === 'proposed' || model.status === 'in_review' ? (
          <button onClick={() => onApprove(model.id)} className="flex-1 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors">
            Aprovar Modelo
          </button>
        ) : null}
        <button onClick={() => onRetrain(model.id)} className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors">
          <RefreshCw className="w-3 h-3 inline mr-1" /> Retreinar
        </button>
      </div>
    </div>
  );
}

function PredictionCard({ pred }: { pred: PredictionResult }) {
  const pct = Math.round(pred.probability * 100);
  const color = pct > 60 ? 'text-red-400' : pct > 30 ? 'text-yellow-400' : 'text-emerald-400';
  const barColor = pct > 60 ? 'bg-red-500' : pct > 30 ? 'bg-yellow-500' : 'bg-emerald-500';
  return (
    <div className={cn('p-5 rounded-2xl bg-white/5 border space-y-3', pred.actionRequired ? 'border-orange-500/30' : 'border-white/10')}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-white">{pred.targetLabel}</div>
        {pred.actionRequired && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-900/40 text-orange-400 border border-orange-500/30">AÇÃO REQUERIDA</span>
        )}
      </div>

      <div className="flex items-end gap-3">
        <div className={cn('text-3xl font-extrabold', color)}>{pct}%</div>
        <div className="text-xs text-slate-400 pb-1">de probabilidade · {pred.confidenceLevel === 'high' ? '🟢 Alta Confiança' : pred.confidenceLevel === 'medium' ? '🟡 Média Confiança' : '🔴 Baixa Confiança'}</div>
      </div>

      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>

      <div>
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Explicação (IA)</div>
        <p className="text-xs text-slate-300 leading-relaxed">{pred.explanation}</p>
      </div>

      <div className="p-3 rounded-xl bg-black/30 border border-white/5">
        <div className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider mb-1">Ação Sugerida</div>
        <p className="text-xs text-slate-200">{pred.suggestedAction}</p>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
        <Clock className="w-3 h-3" /> Horizonte: <span className="text-slate-300">{pred.horizon}</span>
        {pred.reviewedByHuman && <span className="ml-auto text-emerald-400">✓ Revisão Humana</span>}
      </div>
    </div>
  );
}

function RecommendationCard({ rec, onAccept, onReject }: {
  rec: Recommendation;
  onAccept: (id: string, feedback: string) => void;
  onReject: (id: string, feedback: string) => void;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (rec.accepted === true) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <div className="text-sm font-semibold text-white">{rec.title}</div>
          <div className="text-xs text-emerald-300 mt-0.5">{rec.feedback}</div>
        </div>
      </div>
    );
  }
  if (rec.accepted === false) {
    return (
      <div className="p-4 rounded-2xl bg-red-900/20 border border-red-500/30 flex items-center gap-3">
        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <div className="text-sm font-semibold text-white">{rec.title}</div>
          <div className="text-xs text-red-300 mt-0.5">{rec.feedback}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-5 rounded-2xl bg-white/5 border space-y-3', PRIORITY_COLOR[rec.priority].includes('red') ? 'border-red-500/20' : 'border-white/10')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-white">{rec.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">{rec.typeLabel} · Para: {rec.targetAudience}</div>
        </div>
        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0', PRIORITY_COLOR[rec.priority])}>
          {rec.priority.toUpperCase()}
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{rec.description}</p>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Star className="w-3 h-3 text-yellow-400" />
        <span>Confiança: <span className="text-yellow-300 font-bold">{Math.round(rec.confidenceScore * 100)}%</span></span>
        <span className="ml-2 text-slate-500">Justificativa: {rec.justification}</span>
      </div>

      {showFeedback ? (
        <div className="space-y-2">
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Adicione um comentário..."
            className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 resize-none h-16 focus:outline-none focus:border-violet-500/50"
          />
          <div className="flex gap-2">
            <button onClick={() => { onAccept(rec.id, feedback || 'Aceito sem comentários.'); setShowFeedback(false); }}
              className="flex-1 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors">
              ✓ Aceitar Recomendação
            </button>
            <button onClick={() => { onReject(rec.id, feedback || 'Rejeitado sem comentários.'); setShowFeedback(false); }}
              className="flex-1 py-1.5 bg-red-800/50 hover:bg-red-700/50 text-red-300 text-xs font-bold rounded-lg transition-colors">
              ✗ Rejeitar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowFeedback(true)}
          className="w-full py-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-semibold rounded-lg transition-colors border border-violet-500/30">
          Responder Recomendação
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AIIC() {
  const {
    models, predictions, recommendations, knowledgeGraph, insights, optimizations, executiveKPIs, auditLog,
    approveModel, retrainModel, acceptRecommendation, rejectRecommendation,
    runPredictions, runOptimizationScan, queryKnowledgeGraph
  } = useAIIC();

  const [activeTab, setActiveTab] = useState<
    'executive' | 'intelligence' | 'predictions' | 'recommendations' | 'knowledge_graph' | 'ai_governance' | 'optimization' | 'audit'
  >('executive');

  const [kgQuery, setKgQuery] = useState('');
  const [kgResults, setKgResults] = useState(knowledgeGraph.nodes);

  const handleKGQuery = () => {
    const results = kgQuery.trim() ? queryKnowledgeGraph(kgQuery) : knowledgeGraph.nodes;
    setKgResults(results);
  };

  const activeModels = models.filter(m => m.status === 'active').length;
  const pendingRec = recommendations.filter(r => r.accepted === null).length;
  const alertKpis = executiveKPIs.filter(k => k.alert).length;

  const tabs = [
    { id: 'executive', label: 'Dashboard Executivo', icon: LayoutDashboard },
    { id: 'intelligence', label: 'Insights Institucionais', icon: Brain },
    { id: 'predictions', label: 'Análises Preditivas', icon: TrendingUp },
    { id: 'recommendations', label: 'Recomendações IA', icon: Sparkles },
    { id: 'knowledge_graph', label: 'Grafo Institucional', icon: GitBranch },
    { id: 'ai_governance', label: 'Governança de IA', icon: ShieldCheck },
    { id: 'optimization', label: 'Otimização Contínua', icon: Zap },
    { id: 'audit', label: 'Auditoria LGPD & IA', icon: Activity },
  ] as const;

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#050811] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/10 bg-[#0c1222]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">AIIC — Prompt 151</h1>
              <span className="px-2 py-0.5 rounded text-xs bg-violet-900/40 text-violet-300 border border-violet-500/30 font-bold">Fase II — Inteligência Institucional</span>
              {alertKpis > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/50 text-red-400 border border-red-500/30">
                  {alertKpis} ALERTA{alertKpis > 1 ? 'S' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Institutional Intelligence Center, Decision Support & Continuous Optimization</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={runPredictions} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors">
            <TrendingUp className="w-3.5 h-3.5" /> Atualizar Previsões
          </button>
          <button onClick={runOptimizationScan} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/20">
            <Zap className="w-4 h-4" /> Varredura de Otimização
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="shrink-0 border-b border-white/10 bg-[#0c1222]/60 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all shrink-0',
                  isActive ? 'border-violet-500 text-violet-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                )}>
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'recommendations' && pendingRec > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-600 text-white">{pendingRec}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── TAB 1: DASHBOARD EXECUTIVO ── */}
        {activeTab === 'executive' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {executiveKPIs.map(kpi => (
                <div key={kpi.id} className={cn('p-4 rounded-2xl bg-white/5 border', kpi.alert ? 'border-red-500/40' : 'border-white/10')}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{kpi.domain}</span>
                    {kpi.trend === 'up' && <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />}
                    {kpi.trend === 'down' && <ChevronDown className="w-3.5 h-3.5 text-red-400" />}
                    {kpi.trend === 'stable' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <div className="text-xl font-extrabold text-white">{kpi.value}<span className="text-xs text-slate-400 ml-1">{kpi.unit}</span></div>
                  <div className="text-xs text-slate-400 mt-1">{kpi.label}</div>
                  {kpi.alert && <div className="text-[10px] text-red-400 mt-1.5 font-semibold">⚠ {kpi.alertMessage}</div>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Brain className="w-4 h-4 text-violet-400" /> Centro de Inteligência — Estado</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-black/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300">{activeModels} Modelos IA Ativos</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-slate-300">{pendingRec} Recomendações Pendentes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-slate-300">{predictions.filter(p => p.actionRequired).length} Previsões com Ação</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span className="text-slate-300">{knowledgeGraph.nodes.length} Nós no Grafo</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-400" /> Alertas Executivos Ativos</h3>
                {insights.map(ins => (
                  <div key={ins.id} className={cn('p-3 rounded-xl border text-xs', SEVERITY_COLOR[ins.severity])}>
                    <div className="font-semibold">{ins.title}</div>
                    <div className="text-slate-300 mt-0.5">{ins.category} · {ins.relatedModule}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: INSIGHTS INSTITUCIONAIS ── */}
        {activeTab === 'intelligence' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-violet-900/20 border border-violet-500/30 text-xs text-violet-300">
              O Centro de Inteligência Institucional consolida dados de Atendimentos, Prontuários, Financeiro, RH, Voluntariado, BI, Auditoria, Riscos e Universidade Corporativa para gerar visão unificada e insights acionáveis.
            </div>
            {insights.map(ins => (
              <div key={ins.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-white">{ins.title}</div>
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0', SEVERITY_COLOR[ins.severity])}>
                    {ins.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ins.description}</p>
                <div className="text-xs text-slate-400">Fontes: {ins.dataSource.join(' · ')}</div>
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Ações Recomendadas</div>
                  {ins.actionItems.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                      <Check className="w-3 h-3 text-violet-400 shrink-0" /> {a}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 3: ANÁLISES PREDITIVAS ── */}
        {activeTab === 'predictions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">Modelos preditivos ativos com explicabilidade obrigatória e revisão humana para decisões críticas (LGPD + IA Responsável).</div>
              <button onClick={runPredictions} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/40 hover:bg-violet-600/60 text-violet-300 text-xs font-semibold rounded-xl transition-colors">
                <RefreshCw className="w-3 h-3" /> Recalcular
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions.map(p => <PredictionCard key={p.id} pred={p} />)}
            </div>
          </div>
        )}

        {/* ── TAB 4: RECOMENDAÇÕES IA ── */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-400">
              Toda recomendação apresenta justificativa, nível de confiança e rastreabilidade ao modelo gerador. Aceitações e rejeições retroalimentam os modelos para melhoria contínua.
            </div>
            <div className="space-y-3">
              {recommendations.map(r => (
                <RecommendationCard
                  key={r.id} rec={r}
                  onAccept={acceptRecommendation}
                  onReject={rejectRecommendation}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 5: GRAFO INSTITUCIONAL ── */}
        {activeTab === 'knowledge_graph' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={kgQuery}
                onChange={e => setKgQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleKGQuery()}
                placeholder="Busca semântica no Grafo (ex: beneficiário, risco, processo...)"
                className="flex-1 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
              <button onClick={handleKGQuery} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {kgResults.map(node => (
                <div key={node.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-bold text-white">{node.label}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-violet-900/30 text-violet-400 border border-violet-500/20 ml-auto">{node.type}</span>
                  </div>
                  <div className="text-xs text-slate-400">Conexões: <span className="text-slate-200 font-semibold">{node.connections}</span></div>
                  <div className="space-y-0.5">
                    {Object.entries(node.properties).map(([k, v]) => (
                      <div key={k} className="text-[10px] text-slate-500">{k}: <span className="text-slate-300">{String(v)}</span></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center gap-4 text-xs text-slate-400">
              <span>Total de nós: <span className="text-white font-semibold">{knowledgeGraph.nodes.length}</span></span>
              <span>Total de relações: <span className="text-white font-semibold">{knowledgeGraph.totalRelationships}</span></span>
              <span className="ml-auto">Atualizado em: {new Date(knowledgeGraph.lastUpdatedAt).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        )}

        {/* ── TAB 6: GOVERNANÇA DE IA ── */}
        {activeTab === 'ai_governance' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-500/30 text-xs text-amber-300 space-y-1">
              <div className="font-bold">⚡ Política de Governança de IA (LGPD + IA Responsável)</div>
              <div>Nenhum modelo entra em produção sem aprovação formal. Toda decisão crítica exige supervisão humana. Explicabilidade obrigatória em 100% das recomendações.</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map(m => (
                <ModelCard key={m.id} model={m} onApprove={id => approveModel(id, 'Chief AI Officer')} onRetrain={retrainModel} />
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 7: OTIMIZAÇÃO CONTÍNUA ── */}
        {activeTab === 'optimization' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">Motor de otimização identifica gargalos, redundâncias, desperdícios e oportunidades de melhoria em toda a plataforma.</div>
              <button onClick={runOptimizationScan} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/40 hover:bg-violet-600/60 text-violet-300 text-xs font-semibold rounded-xl transition-colors">
                <Zap className="w-3 h-3" /> Executar Varredura
              </button>
            </div>

            <div className="space-y-3">
              {optimizations.map(opt => (
                <div key={opt.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-white">{opt.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{opt.area} · Tipo: {opt.type}</div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', PRIORITY_COLOR[opt.impact])}>
                        Impacto {opt.impact.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">Esforço: {opt.effort}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{opt.description}</p>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs">
                    <div className="font-semibold text-sky-400 mb-1">Ação Proposta</div>
                    <div className="text-slate-200">{opt.proposedAction}</div>
                    <div className="mt-1 text-emerald-400 font-semibold">{opt.estimatedGain}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 8: AUDITORIA LGPD & IA ── */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-400">
              Log imutável de todos os eventos do Centro de Inteligência Institucional — 100% rastreável e aderente à LGPD.
            </div>
            {auditLog.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">Nenhum evento registrado ainda.</div>
            ) : (
              auditLog.map(entry => (
                <div key={entry.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3 text-xs">
                  <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-900/40 text-violet-400 border border-violet-500/20 shrink-0">{entry.action}</div>
                  <div className="flex-1">
                    <div className="text-slate-200">{entry.description}</div>
                    <div className="text-slate-500 mt-0.5">{entry.actor} · {new Date(entry.timestamp).toLocaleString('pt-BR')} · hash:{entry.hash}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
