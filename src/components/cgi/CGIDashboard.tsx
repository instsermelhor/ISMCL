import React, { useState } from 'react';
import {
  Users, Activity, Clock, BriefcaseMedical, Heart, UserCheck,
  FolderKanban, AlertTriangle, AlertCircle, Info, CheckCircle2,
  ChevronRight, TrendingUp, TrendingDown, Bell, RefreshCw,
  Brain, Zap, Target, Star, ArrowUpRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../utils';
import {
  executiveKPIs, systemAlerts, atendimentosMensais, distribuicaoProjetos,
  institutionalHealth, aiInsights, impactoSocial,
} from '../../data/cgi-mock';

const iconMap: Record<string, React.ElementType> = {
  Users, Activity, Clock, BriefcaseMedical, Heart, UserCheck, FolderKanban,
};

const colorMap = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', grad: 'from-teal-500 to-teal-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', grad: 'from-emerald-500 to-emerald-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', grad: 'from-blue-500 to-blue-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', grad: 'from-amber-500 to-amber-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', grad: 'from-rose-500 to-rose-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', grad: 'from-violet-500 to-violet-600' },
};

const severityConfig = {
  critical: { color: 'bg-red-50 border-red-200 text-red-700', icon: AlertCircle, dot: 'bg-red-500', label: 'Crítico' },
  warning: { color: 'bg-amber-50 border-amber-200 text-amber-700', icon: AlertTriangle, dot: 'bg-amber-500', label: 'Atenção' },
  info: { color: 'bg-blue-50 border-blue-200 text-blue-700', icon: Info, dot: 'bg-blue-500', label: 'Info' },
};

const healthStatusConfig = {
  excellent: { color: 'text-emerald-600', bg: 'bg-emerald-500' },
  good: { color: 'text-teal-600', bg: 'bg-teal-500' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-500' },
  critical: { color: 'text-red-600', bg: 'bg-red-500' },
};

const maxAtendimento = Math.max(...atendimentosMensais.map(m => m.total));
const totalBenef = distribuicaoProjetos.reduce((s, p) => s + p.beneficiarios, 0);

// ─── Score Gauge ──────────────────────────────────────────────
function HealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 65 ? '#0d9488' : score >= 45 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excelente' : score >= 65 ? 'Bom' : score >= 45 ? 'Atenção' : 'Crítico';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <motion.circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - score / 100) }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{score}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

export function CGIDashboard() {
  const [showAll, setShowAll] = useState(false);
  const [lastRefreshed] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const activeAlerts = systemAlerts.filter(a => !a.resolved);
  const visibleAlerts = showAll ? activeAlerts : activeAlerts.slice(0, 3);
  const criticalInsights = aiInsights.filter(i => i.priority === 'critical' || i.priority === 'high').slice(0, 2);

  return (
    <div className="space-y-8">

      {/* ── Resumo Diário ───────────────────────────────── */}
      <section>
        <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 p-5 text-white shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-teal-200" />
                <p className="text-sm font-semibold text-teal-100">Resumo do Dia — 29 de junho de 2026</p>
              </div>
              <h2 className="text-lg font-bold">Bom dia, Administrador!</h2>
            </div>
            <span className="text-xs text-teal-200 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Atualizado às {lastRefreshed}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Atendimentos hoje', value: '14', sub: '2 faltas confirmadas', icon: Activity },
              { label: 'Novos beneficiários', value: '1', sub: 'Em avaliação inicial', icon: Users },
              { label: 'Docs. pendentes', value: '3', sub: 'Aguardam assinatura', icon: Bell },
              { label: 'Alertas críticos', value: activeAlerts.filter(a => a.severity === 'critical').length.toString(), sub: 'Requerem ação', icon: AlertCircle },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-teal-200" />
                    <p className="text-xs text-teal-200">{item.label}</p>
                  </div>
                  <p className="text-xl font-bold">{item.value}</p>
                  <p className="text-xs text-teal-200 mt-0.5">{item.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── KPI Grid ───────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Indicadores em Tempo Real</h2>
          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {executiveKPIs.map((kpi, i) => {
            const Icon = iconMap[kpi.icon] ?? Activity;
            const colors = colorMap[kpi.color];
            return (
              <motion.div
                key={kpi.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-medium text-slate-500 leading-tight">{kpi.label}</p>
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform', colors.bg)}>
                    <Icon className={cn('w-4 h-4', colors.text)} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</p>
                {kpi.trend !== undefined && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {kpi.trend > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    ) : kpi.trend < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    ) : null}
                    <span className={cn('text-xs font-medium', kpi.trend > 0 ? 'text-emerald-600' : kpi.trend < 0 ? 'text-red-600' : 'text-slate-400')}>
                      {kpi.trend > 0 ? `+${kpi.trend}%` : kpi.trend < 0 ? `${kpi.trend}%` : '—'} {kpi.trendLabel}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Score de Saúde + Impacto Social ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Health Score */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">Score de Saúde Institucional</h3>
          </div>
          <div className="flex items-start gap-6">
            <HealthGauge score={institutionalHealth.overall} />
            <div className="flex-1 space-y-3">
              {institutionalHealth.dimensions.map(dim => {
                const cfg = healthStatusConfig[dim.status];
                return (
                  <div key={dim.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700">{dim.label}</span>
                      <span className={cn('text-xs font-bold', cfg.color)}>{dim.score}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dim.score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', cfg.bg)}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{dim.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Impacto Social */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Heart className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-800">Impacto Social — 2026</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Famílias Atendidas', value: impactoSocial.familiasAtendidas, color: 'text-teal-600', bg: 'bg-teal-50' },
              { label: 'Cidades Cobertas', value: impactoSocial.cidadesCobertas, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Satisfação (NPS)', value: `${impactoSocial.satisfacaoBeneficiarios}/10`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Horas Voluntárias', value: `${impactoSocial.horasVoluntarias.toLocaleString('pt-BR')}h`, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Redução Vulnerab.', value: `${impactoSocial.reducaoVulnerabilidade}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Valor Social Gerado', value: `R$ ${(impactoSocial.valorSocialGerado / 1000).toFixed(0)}k`, color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map(item => (
              <div key={item.label} className={cn('rounded-xl p-3', item.bg)}>
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p className={cn('text-lg font-bold', item.color)}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atendimentos Mensais */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Atendimentos Mensais</h3>
          <p className="text-xs text-slate-400 mb-5">Online vs. Presencial — 2026</p>
          <div className="space-y-3">
            {atendimentosMensais.map(m => (
              <div key={m.mes} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 w-7">{m.mes}</span>
                <div className="flex-1 flex gap-1 h-5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.online / maxAtendimento) * 100 * 0.6}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="bg-teal-500 rounded-l-full"
                    title={`Online: ${m.online}`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.presencial / maxAtendimento) * 100 * 0.6}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                    className="bg-blue-300 rounded-r-full"
                    title={`Presencial: ${m.presencial}`}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-10 text-right">{m.total}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-teal-500" /><span className="text-xs text-slate-500">Online</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-300" /><span className="text-xs text-slate-500">Presencial</span></div>
          </div>
        </div>

        {/* Distribuição por Projeto */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Beneficiários por Projeto</h3>
          <p className="text-xs text-slate-400 mb-5">Distribuição atual — {totalBenef} beneficiários</p>
          <div className="space-y-3">
            {distribuicaoProjetos.map(p => (
              <div key={p.projeto}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700">{p.projeto}</span>
                  <span className="text-xs text-slate-500">{p.beneficiarios} ({Math.round((p.beneficiarios / totalBenef) * 100)}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.beneficiarios / totalBenef) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: p.cor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Insights Preview ──────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">IA — Destaques do Dia</h2>
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              <Zap className="w-3 h-3" />{criticalInsights.length} prioridade alta
            </span>
          </div>
          <button className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1">
            Ver todos os insights <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {criticalInsights.map(insight => (
            <div key={insight.id} className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-violet-200 flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-violet-900 mb-1">{insight.title}</p>
                  <p className="text-xs text-violet-700 line-clamp-2">{insight.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium text-violet-500">{insight.module}</span>
                    <span className="text-xs text-violet-400">·</span>
                    <span className="text-xs text-violet-500">Confiança: {insight.confidence}%</span>
                    {insight.actionLabel && (
                      <button className="flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline ml-auto">
                        {insight.actionLabel} <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Alertas Críticos ────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-800">Alertas Operacionais</h2>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
              {activeAlerts.length}
            </span>
          </div>
          <button onClick={() => setShowAll(s => !s)} className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
            {showAll ? 'Ver menos' : 'Ver todos'}<ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {visibleAlerts.map(alert => {
            const cfg = severityConfig[alert.severity];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn('flex items-start gap-3 p-4 rounded-xl border', cfg.color)}
              >
                <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="text-xs mt-0.5 opacity-80">{alert.description}</p>
                  <p className="text-xs mt-1 opacity-60">Módulo: {alert.module}</p>
                </div>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', cfg.color)}>
                  {cfg.label}
                </span>
              </motion.div>
            );
          })}
          {systemAlerts.filter(a => a.resolved).length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-100 bg-green-50 text-green-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium">{systemAlerts.filter(a => a.resolved).length} alerta(s) resolvido(s) recentemente.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
