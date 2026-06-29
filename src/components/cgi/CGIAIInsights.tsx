import React, { useState } from 'react';
import {
  Brain, Zap, TrendingUp, AlertTriangle, Users, Activity,
  ChevronRight, Lightbulb, BarChart2, Clock, CheckCircle2,
  Sparkles, RefreshCw, X, Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { aiInsights, type AIInsight, type InsightType } from '../../data/cgi-mock';

// ─── Configurações por tipo ───────────────────────────────────
const typeConfig: Record<InsightType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  predictive: { label: 'Preditivo', icon: TrendingUp, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  operational: { label: 'Operacional', icon: Activity, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  inconsistency: { label: 'Inconsistência', icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  workload: { label: 'Carga de Trabalho', icon: Users, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  opportunity: { label: 'Oportunidade', icon: Lightbulb, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const priorityDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-500',
  low: 'bg-slate-400',
};

// ─── Confidence Bar ───────────────────────────────────────────
function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
      <span className="text-xs font-semibold text-slate-500 w-8 text-right">{value}%</span>
    </div>
  );
}

// ─── Insight Card ─────────────────────────────────────────────
function InsightCard({ insight, onDismiss }: { insight: AIInsight; onDismiss: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = typeConfig[insight.type];
  const Icon = cfg.icon;
  const confColor = insight.confidence >= 80 ? 'bg-emerald-500' : insight.confidence >= 60 ? 'bg-amber-500' : 'bg-red-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn('rounded-2xl border p-4 transition-all cursor-pointer', cfg.bg, cfg.border, expanded && 'ring-1 ring-inset ring-white/60')}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.bg, 'border', cfg.border)}>
          <Icon className={cn('w-4 h-4', cfg.color)} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', cfg.bg, cfg.border, cfg.color)}>
              {cfg.label}
            </span>
            <span className="text-xs text-slate-400">{insight.module}</span>
            <div className={cn('w-2 h-2 rounded-full shrink-0 ml-auto', priorityDot[insight.priority])} title={`Prioridade: ${insight.priority}`} />
          </div>

          <p className={cn('text-sm font-bold mb-1', cfg.color)}>{insight.title}</p>

          <AnimatePresence>
            {expanded ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{insight.body}</p>
                <div className="mb-3">
                  <p className="text-xs text-slate-400 mb-1">Nível de confiança da IA</p>
                  <ConfidenceBar value={insight.confidence} color={confColor} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {insight.actionLabel && (
                    <button
                      onClick={e => e.stopPropagation()}
                      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors', cfg.color, 'bg-white border', cfg.border, 'hover:brightness-95')}
                    >
                      {insight.actionLabel} <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); onDismiss(insight.id); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 bg-white border border-slate-200 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    <X className="w-3 h-3" /> Dispensar
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs text-slate-500 line-clamp-2">
                {insight.body}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function CGIAIInsights() {
  const [items, setItems] = useState<AIInsight[]>(aiInsights);
  const [typeFilter, setTypeFilter] = useState<InsightType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = items.filter(i => typeFilter === 'all' || i.type === typeFilter);
  const dismissed = aiInsights.length - items.length;

  function dismiss(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleRefresh() {
    setIsRefreshing(true);
    setTimeout(() => {
      setItems(aiInsights);
      setIsRefreshing(false);
    }, 900);
  }

  const typeFilters: { id: InsightType | 'all'; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'predictive', label: 'Preditivos' },
    { id: 'operational', label: 'Operacionais' },
    { id: 'workload', label: 'Carga' },
    { id: 'inconsistency', label: 'Inconsistências' },
    { id: 'opportunity', label: 'Oportunidades' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Inteligência Artificial — Insights
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                <Sparkles className="w-3 h-3" /> IA Ativa
              </span>
            </h2>
            <p className="text-xs text-slate-400">Análises preditivas e alertas inteligentes gerados às 06:00 de hoje</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-violet-700 transition-colors px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar análise'}
        </button>
      </div>

      {/* Aviso de responsabilidade */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-indigo-100 bg-indigo-50">
        <Eye className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-800">
          <strong>Importante:</strong> Os insights gerados pela IA são sugestões baseadas em dados do sistema. A IA nunca altera registros institucionais sem confirmação explícita do administrador. Todas as ações recomendadas requerem validação humana.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Insights gerados', value: aiInsights.length, icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Prioridade alta/crítica', value: aiInsights.filter(i => i.priority === 'critical' || i.priority === 'high').length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Dispensados', value: dismissed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
                <Icon className={cn('w-4 h-4', s.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {typeFilters.map(f => (
          <button
            key={f.id}
            onClick={() => setTypeFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
              typeFilter === f.id
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Insight Cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
            <Brain className="w-12 h-12 opacity-30" />
            <p className="text-sm">Nenhum insight disponível nesta categoria.</p>
            <button onClick={handleRefresh} className="text-xs text-violet-600 hover:underline font-medium">
              Recarregar análises
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-xs text-slate-400">
          Próxima análise automática: <strong className="text-slate-600">29/06/2026 às 18:00</strong> · Frequência: 2x ao dia
        </p>
      </div>
    </div>
  );
}
