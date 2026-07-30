import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scale, ShieldAlert, CheckCircle2, FileText, Target, BarChart3,
  Users, GitBranch, ScrollText, Plus, ChevronRight, AlertTriangle,
  TrendingUp, TrendingDown, Minus, ArrowUpRight, Clock,
  Shield, BookOpen, Gavel, BarChart2, XCircle, Info,
  Check, X, RefreshCw, Lock, Eye, Activity, Layers,
  CalendarDays, Building2, Flag, Zap
} from 'lucide-react';
import { cn } from '../utils';
import { useAEGRC } from '../contexts/AEGRCContext';
import type {
  Risk, RiskCategory, RiskResponse, RiskLevel,
  ComplianceStatus, ControlType, PolicyType, ApprovalStatus,
  OKRCycle, CommitteeMemberRole, InternalControl, StrategicObjective,
  Committee, CommitteeDecision, CommitteeMeeting
} from '../types/aegrc';

// =============================================================================
// DESIGN TOKENS
// =============================================================================

const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Crítico', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/40' },
  high: { label: 'Alto', color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-500/40' },
  medium: { label: 'Médio', color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-500/40' },
  low: { label: 'Baixo', color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-500/40' },
};

const COMPLIANCE_STATUS_CONFIG: Record<ComplianceStatus, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  compliant: { label: 'Conforme', color: 'text-emerald-400', bg: 'bg-emerald-900/30', icon: CheckCircle2 },
  in_analysis: { label: 'Em Análise', color: 'text-amber-400', bg: 'bg-amber-900/30', icon: Clock },
  non_compliant: { label: 'Não Conforme', color: 'text-red-400', bg: 'bg-red-900/30', icon: XCircle },
  not_applicable: { label: 'N/A', color: 'text-slate-400', bg: 'bg-slate-800/40', icon: Minus },
};

const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  strategic: 'Estratégico',
  operational: 'Operacional',
  assistential: 'Assistencial',
  technological: 'Tecnológico',
  financial: 'Financeiro',
  legal: 'Jurídico',
  reputational: 'Reputacional',
  continuity: 'Continuidade',
  third_party: 'Terceiros',
};

const POLICY_STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-slate-400', bg: 'bg-slate-800/40' },
  in_review: { label: 'Em Revisão', color: 'text-amber-400', bg: 'bg-amber-900/30' },
  approved: { label: 'Aprovada', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  published: { label: 'Publicada', color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
  archived: { label: 'Arquivada', color: 'text-slate-500', bg: 'bg-slate-800/20' },
};

// =============================================================================
// REUSABLE COMPONENTS
// =============================================================================

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl', className)}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, color = 'text-white', icon: Icon, trend }: {
  label: string; value: string | number; sub?: string;
  color?: string; icon: React.ComponentType<{ className?: string }>; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <GlassCard className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={cn('p-2 rounded-xl bg-white/10', color.replace('text-', 'bg-').replace('-400', '-900/30'))}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        {trend && (
          <span className={cn('text-xs font-medium flex items-center gap-1',
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
          )}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </span>
        )}
      </div>
      <div>
        <div className={cn('text-2xl font-bold', color)}>{value}</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      </div>
    </GlassCard>
  );
}

function ProgressRing({ value, size = 80, stroke = 8, color = '#7c3aed' }: {
  value: number; size?: number; stroke?: number; color?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', color, bg)}>{label}</span>;
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {sub && <p className="text-sm text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function ModalWrapper({ isOpen, onClose, title, children, wide = false }: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn('bg-[#1a1f2e] border border-white/10 rounded-3xl shadow-2xl w-full overflow-hidden', wide ? 'max-w-2xl' : 'max-w-lg')}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-500";
const selectClass = "w-full rounded-xl border border-white/10 bg-[#1a1f2e] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all";
const textareaClass = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-500 resize-none";

// =============================================================================
// TAB: DASHBOARD EXECUTIVO
// =============================================================================

function DashboardTab() {
  const { risks, complianceItems, okrs, committees, auditLog, complianceScore, governanceMaturityScore, criticalAlerts, risksByLevel } = useAEGRC();
  const pendingDecisions = committees.reduce((sum, c) => sum + c.meetings.filter(m => m.status === 'scheduled').length, 0);
  const activeOKRs = okrs.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const avgOKRProgress = activeOKRs.length ? Math.round(activeOKRs.reduce((s, o) => s + o.overallProgress, 0) / activeOKRs.length) : 0;

  const recentEvents = auditLog.slice(0, 8);

  const heatmapData = useMemo(() => {
    const matrix: Risk[][][] = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => []));
    risks.forEach(r => { matrix[r.impact - 1][r.probability - 1].push(r); });
    return matrix;
  }, [risks]);

  function getHeatColor(prob: number, impact: number): string {
    const score = prob * impact;
    if (score >= 15) return 'bg-red-600/80 hover:bg-red-600';
    if (score >= 9) return 'bg-orange-500/80 hover:bg-orange-500';
    if (score >= 4) return 'bg-amber-500/80 hover:bg-amber-500';
    return 'bg-emerald-600/60 hover:bg-emerald-600';
  }

  return (
    <div className="space-y-6">
      {/* Alertas críticos */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-red-300 mb-1">{criticalAlerts.length} Alerta(s) Crítico(s) de Governança</div>
            <div className="space-y-0.5">
              {criticalAlerts.slice(0, 3).map((a, i) => (
                <div key={i} className="text-xs text-red-400">{a.message}</div>
              ))}
              {criticalAlerts.length > 3 && <div className="text-xs text-red-500">+{criticalAlerts.length - 3} mais alertas</div>}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Riscos Críticos / Altos" value={`${risksByLevel.critical.length + risksByLevel.high.length}`} sub={`${risks.length} riscos no total`} color="text-orange-400" icon={ShieldAlert} trend="neutral" />
        <KpiCard label="Compliance Score" value={`${complianceScore}%`} sub={`${complianceItems.filter(c => c.status === 'non_compliant').length} desvios ativos`} color="text-violet-400" icon={CheckCircle2} trend={complianceScore >= 80 ? 'up' : 'down'} />
        <KpiCard label="Progresso OKRs" value={`${avgOKRProgress}%`} sub={`${activeOKRs.length} OKRs ativos`} color="text-teal-400" icon={Target} trend="up" />
        <KpiCard label="Maturidade de Governança" value={`${governanceMaturityScore}%`} sub="Score consolidado" color="text-blue-400" icon={Scale} trend={governanceMaturityScore >= 70 ? 'up' : 'neutral'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heat Map */}
        <GlassCard className="p-5 col-span-1 lg:col-span-2">
          <div className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-400" /> Mapa de Riscos 5×5 — Probabilidade × Impacto
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col justify-between pr-2 text-xs text-slate-500 text-right" style={{ height: 200 }}>
              {['5 Crítico', '4 Alto', '3 Médio', '2 Baixo', '1 Mín.'].map(l => (
                <span key={l} className="leading-none">{l}</span>
              ))}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1.5" style={{ height: 200 }}>
                {[5, 4, 3, 2, 1].map(impact =>
                  [1, 2, 3, 4, 5].map(prob => {
                    const cellRisks = heatmapData[impact - 1]?.[prob - 1] ?? [];
                    return (
                      <div
                        key={`${impact}-${prob}`}
                        className={cn('rounded-lg flex items-center justify-center transition-colors cursor-default relative group', getHeatColor(prob, impact))}
                      >
                        {cellRisks.length > 0 && (
                          <span className="text-xs font-bold text-white">{cellRisks.length}</span>
                        )}
                        {cellRisks.length > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 bg-slate-900 border border-white/10 rounded-xl p-3 min-w-[180px] shadow-xl">
                            {cellRisks.map(r => <div key={r.id} className="text-xs text-slate-300 mb-0.5">{r.title}</div>)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                {['1 Mín.', '2 Baixo', '3 Médio', '4 Alto', '5 Crítico'].map(l => <span key={l}>{l}</span>)}
              </div>
              <div className="text-center text-xs text-slate-500 mt-1">Probabilidade →</div>
            </div>
          </div>
        </GlassCard>

        {/* Maturidade Rings */}
        <GlassCard className="p-5 flex flex-col gap-4">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" /> Indicadores de Maturidade
          </div>
          {[
            { label: 'Compliance', value: complianceScore, color: '#7c3aed' },
            { label: 'Gestão de Riscos', value: Math.min(100, risks.length * 20), color: '#ea580c' },
            { label: 'Cobertura de Controles', value: Math.min(100, 25 * risks.filter(r => r.relatedControlIds.length > 0).length), color: '#0d9488' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <ProgressRing value={item.value} size={56} stroke={6} color={item.color} />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{item.value}%</div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="text-xs text-slate-400">Score de maturidade</div>
              </div>
            </div>
          ))}
        </GlassCard>
      </div>

      {/* Event Feed + Committees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <div className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-slate-400" /> Feed de Eventos de Governança
          </div>
          <div className="space-y-2">
            {recentEvents.length === 0 && (
              <div className="text-center text-slate-500 py-6 text-sm">Nenhum evento registrado ainda.</div>
            )}
            {recentEvents.map(e => (
              <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{e.action}</div>
                  <div className="text-xs text-slate-400 truncate">{e.description}</div>
                </div>
                <div className="text-xs text-slate-500 shrink-0">{new Date(e.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" /> Próximas Reuniões de Comitê
          </div>
          <div className="space-y-3">
            {committees.flatMap(c => c.meetings.filter(m => m.status === 'scheduled').map(m => ({ committee: c.name, meeting: m }))).slice(0, 4).map(({ committee, meeting }) => (
              <div key={meeting.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-xs font-semibold text-violet-400">{committee}</div>
                <div className="text-sm text-white mt-0.5">{meeting.title}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400">{new Date(meeting.scheduledAt).toLocaleDateString('pt-BR')}</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">{meeting.agenda.length} itens na pauta</span>
                </div>
              </div>
            ))}
            {pendingDecisions === 0 && (
              <div className="text-center text-slate-500 py-4 text-sm">Nenhuma reunião agendada.</div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// =============================================================================
// TAB: GESTÃO DE RISCOS (ERM)
// =============================================================================

function ERMTab() {
  const { risks, addRisk, risksByLevel } = useAEGRC();
  const [showModal, setShowModal] = useState(false);
  const [filterLevel, setFilterLevel] = useState<RiskLevel | 'all'>('all');
  const [filterCat, setFilterCat] = useState<RiskCategory | 'all'>('all');
  const [form, setForm] = useState({
    title: '', description: '', category: 'technological' as RiskCategory,
    probability: 3 as 1|2|3|4|5, impact: 3 as 1|2|3|4|5,
    response: 'mitigate' as RiskResponse, owner: '', reviewDate: '', responseplan: '',
  });

  const filtered = risks.filter(r =>
    (filterLevel === 'all' || r.level === filterLevel) &&
    (filterCat === 'all' || r.category === filterCat)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRisk({ ...form, status: 'identified', residualScore: form.probability * form.impact, mitigationActions: [], relatedControlIds: [], indicators: [], createdBy: 'Sistema' });
    setShowModal(false);
    setForm({ title: '', description: '', category: 'technological', probability: 3, impact: 3, response: 'mitigate', owner: '', reviewDate: '', responseplan: '' });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Enterprise Risk Management"
        sub="Identificação, avaliação, tratamento e monitoramento de riscos corporativos"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Novo Risco
          </button>
        }
      />

      {/* Resumo por nível */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map(level => {
          const cfg = RISK_LEVEL_CONFIG[level];
          return (
            <button key={level} onClick={() => setFilterLevel(filterLevel === level ? 'all' : level)}
              className={cn('p-4 rounded-2xl border text-left transition-all', cfg.bg, cfg.border, filterLevel === level ? 'ring-2 ring-violet-500' : 'hover:opacity-90')}>
              <div className={cn('text-2xl font-bold', cfg.color)}>{risksByLevel[level].length}</div>
              <div className="text-xs text-slate-400 mt-0.5">{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filtro por categoria */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterCat('all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filterCat === 'all' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10')}>
          Todos
        </button>
        {(Object.entries(RISK_CATEGORY_LABELS) as [RiskCategory, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setFilterCat(filterCat === key ? 'all' : key)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filterCat === key ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10')}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista de riscos */}
      <div className="space-y-3">
        {filtered.map(risk => {
          const cfg = RISK_LEVEL_CONFIG[risk.level];
          return (
            <GlassCard key={risk.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className={cn('px-2.5 py-1 rounded-lg text-xs font-bold', cfg.bg, cfg.color)}>{risk.code}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{risk.title}</span>
                    <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} />
                    <Badge label={RISK_CATEGORY_LABELS[risk.category]} color="text-slate-300" bg="bg-white/5" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{risk.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{risk.owner}</span>
                    <span>P:{risk.probability} × I:{risk.impact} = {risk.inherentScore}</span>
                    <span className="capitalize">{risk.response === 'mitigate' ? 'Mitigar' : risk.response === 'accept' ? 'Aceitar' : risk.response === 'transfer' ? 'Transferir' : 'Evitar'}</span>
                  </div>
                </div>
              </div>
              {risk.responseplan && (
                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-400 line-clamp-1">{risk.responseplan}</div>
              )}
            </GlassCard>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-sm">Nenhum risco encontrado com os filtros selecionados.</div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <ModalWrapper isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Novo Risco" wide>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Título do Risco"><input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className={inputClass} placeholder="Descreva o risco..." required /></FormField>
              <FormField label="Descrição"><textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className={textareaClass} rows={3} placeholder="Detalhe o contexto e as causas do risco..." /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Categoria">
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value as RiskCategory}))} className={selectClass}>
                    {Object.entries(RISK_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </FormField>
                <FormField label="Resposta ao Risco">
                  <select value={form.response} onChange={e => setForm(p => ({...p, response: e.target.value as RiskResponse}))} className={selectClass}>
                    <option value="mitigate">Mitigar</option>
                    <option value="accept">Aceitar</option>
                    <option value="transfer">Transferir</option>
                    <option value="avoid">Evitar</option>
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={`Probabilidade: ${form.probability}`}>
                  <input type="range" min={1} max={5} value={form.probability} onChange={e => setForm(p => ({...p, probability: Number(e.target.value) as 1|2|3|4|5}))} className="w-full accent-violet-500" />
                </FormField>
                <FormField label={`Impacto: ${form.impact}`}>
                  <input type="range" min={1} max={5} value={form.impact} onChange={e => setForm(p => ({...p, impact: Number(e.target.value) as 1|2|3|4|5}))} className="w-full accent-violet-500" />
                </FormField>
              </div>
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <div className="text-xs text-slate-400">Score Inerente</div>
                <div className={cn('text-2xl font-bold mt-1', RISK_LEVEL_CONFIG[form.probability * form.impact >= 15 ? 'critical' : form.probability * form.impact >= 9 ? 'high' : form.probability * form.impact >= 4 ? 'medium' : 'low'].color)}>
                  {form.probability * form.impact} — {RISK_LEVEL_CONFIG[form.probability * form.impact >= 15 ? 'critical' : form.probability * form.impact >= 9 ? 'high' : form.probability * form.impact >= 4 ? 'medium' : 'low'].label}
                </div>
              </div>
              <FormField label="Responsável"><input value={form.owner} onChange={e => setForm(p => ({...p, owner: e.target.value}))} className={inputClass} placeholder="Nome do responsável" required /></FormField>
              <FormField label="Data de Revisão"><input type="date" value={form.reviewDate} onChange={e => setForm(p => ({...p, reviewDate: e.target.value}))} className={inputClass} /></FormField>
              <FormField label="Plano de Resposta"><textarea value={form.responseplan} onChange={e => setForm(p => ({...p, responseplan: e.target.value}))} className={textareaClass} rows={3} placeholder="Descreva as ações de mitigação..." /></FormField>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">Registrar Risco</button>
              </div>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TAB: COMPLIANCE
// =============================================================================

function ComplianceTab() {
  const { complianceItems, updateComplianceItem, complianceScore } = useAEGRC();
  const nonCompliant = complianceItems.filter(c => c.status === 'non_compliant');
  const inAnalysis = complianceItems.filter(c => c.status === 'in_analysis');

  return (
    <div className="space-y-6">
      <SectionHeader title="Gestão de Conformidade" sub="Monitoramento de aderência a LGPD, políticas e requisitos regulatórios" />

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Score de Compliance" value={`${complianceScore}%`} icon={CheckCircle2} color={complianceScore >= 80 ? 'text-emerald-400' : 'text-amber-400'} />
        <KpiCard label="Desvios Ativos" value={nonCompliant.length} icon={XCircle} color="text-red-400" />
        <KpiCard label="Em Análise" value={inAnalysis.length} icon={Clock} color="text-amber-400" />
      </div>

      <div className="space-y-3">
        {complianceItems.map(item => {
          const cfg = COMPLIANCE_STATUS_CONFIG[item.status];
          const StatusIcon = cfg.icon;
          return (
            <GlassCard key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <StatusIcon className={cn('w-5 h-5 shrink-0 mt-0.5', cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500">{item.code}</span>
                      <span className="text-sm font-semibold text-white">{item.title}</span>
                      <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    {item.alerts.map((a, i) => (
                      <div key={i} className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{a}
                      </div>
                    ))}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span><Users className="w-3 h-3 inline mr-1" />{item.owner}</span>
                      <span>Próxima revisão: {new Date(item.nextReviewDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {item.status !== 'compliant' && (
                    <button onClick={() => updateComplianceItem(item.id, { status: 'compliant', updatedAt: new Date().toISOString() })}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Regularizar
                    </button>
                  )}
                  {item.status === 'compliant' && (
                    <button onClick={() => updateComplianceItem(item.id, { status: 'in_analysis', updatedAt: new Date().toISOString() })}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-slate-400 hover:bg-white/10 transition-colors flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" /> Revisar
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// TAB: CONTROLES INTERNOS
// =============================================================================

function ControlsTab() {
  const { internalControls, addControl } = useAEGRC();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'preventive' as ControlType, owner: '', frequency: 'monthly' as InternalControl['frequency'], nextExecutionDate: '', evidenceDescription: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addControl({ ...form, effectiveness: 'not_tested', lastExecutionDate: '', relatedRiskIds: [], relatedComplianceIds: [] });
    setShowModal(false);
    setForm({ name: '', description: '', type: 'preventive', owner: '', frequency: 'monthly', nextExecutionDate: '', evidenceDescription: '' });
  };

  const typeConfig: Record<ControlType, { label: string; color: string; bg: string }> = {
    preventive: { label: 'Preventivo', color: 'text-blue-400', bg: 'bg-blue-900/30' },
    detective: { label: 'Detectivo', color: 'text-violet-400', bg: 'bg-violet-900/30' },
    corrective: { label: 'Corretivo', color: 'text-amber-400', bg: 'bg-amber-900/30' },
    compensatory: { label: 'Compensatório', color: 'text-teal-400', bg: 'bg-teal-900/30' },
  };

  const effectConfig: Record<string, { label: string; color: string }> = {
    effective: { label: 'Efetivo', color: 'text-emerald-400' },
    partial: { label: 'Parcial', color: 'text-amber-400' },
    ineffective: { label: 'Inefetivo', color: 'text-red-400' },
    not_tested: { label: 'Não Testado', color: 'text-slate-400' },
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Controles Internos" sub="Controles preventivos, detectivos, corretivos e compensatórios"
        action={<button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"><Plus className="w-4 h-4" /> Novo Controle</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['preventive', 'detective', 'corrective', 'compensatory'] as ControlType[]).map(type => {
          const cfg = typeConfig[type];
          const count = internalControls.filter(c => c.type === type).length;
          return <GlassCard key={type} className="p-4"><div className={cn('text-2xl font-bold', cfg.color)}>{count}</div><div className="text-xs text-slate-400 mt-0.5">{cfg.label}</div></GlassCard>;
        })}
      </div>

      <div className="space-y-3">
        {internalControls.map(ctrl => {
          const tCfg = typeConfig[ctrl.type];
          const eCfg = effectConfig[ctrl.effectiveness];
          return (
            <GlassCard key={ctrl.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className={cn('px-2.5 py-1 rounded-lg text-xs font-bold', tCfg.bg, tCfg.color)}>{ctrl.code}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{ctrl.name}</span>
                    <Badge label={tCfg.label} color={tCfg.color} bg={tCfg.bg} />
                    <span className={cn('text-xs font-medium', eCfg.color)}>{eCfg.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ctrl.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span><Users className="w-3 h-3 inline mr-1" />{ctrl.owner}</span>
                    <span>Frequência: {ctrl.frequency}</span>
                    {ctrl.nextExecutionDate && <span>Próxima: {new Date(ctrl.nextExecutionDate).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <AnimatePresence>
        {showModal && (
          <ModalWrapper isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Controle Interno">
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Nome do Controle"><input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className={inputClass} required /></FormField>
              <FormField label="Descrição"><textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className={textareaClass} rows={2} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tipo">
                  <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value as ControlType}))} className={selectClass}>
                    <option value="preventive">Preventivo</option><option value="detective">Detectivo</option>
                    <option value="corrective">Corretivo</option><option value="compensatory">Compensatório</option>
                  </select>
                </FormField>
                <FormField label="Frequência">
                  <select value={form.frequency} onChange={e => setForm(p => ({...p, frequency: e.target.value as typeof form.frequency}))} className={selectClass}>
                    <option value="continuous">Contínua</option><option value="daily">Diária</option>
                    <option value="weekly">Semanal</option><option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option><option value="annual">Anual</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Responsável"><input value={form.owner} onChange={e => setForm(p => ({...p, owner: e.target.value}))} className={inputClass} required /></FormField>
              <FormField label="Próxima Execução"><input type="date" value={form.nextExecutionDate} onChange={e => setForm(p => ({...p, nextExecutionDate: e.target.value}))} className={inputClass} /></FormField>
              <FormField label="Evidência Esperada"><textarea value={form.evidenceDescription} onChange={e => setForm(p => ({...p, evidenceDescription: e.target.value}))} className={textareaClass} rows={2} /></FormField>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">Cadastrar</button>
              </div>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TAB: POLÍTICAS E NORMAS
// =============================================================================

function PoliciesTab() {
  const { policies, addPolicy } = useAEGRC();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'policy' as PolicyType, owner: '', approver: '', nextReviewDate: '', reviewIntervalDays: 365, tags: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPolicy({
      ...form,
      status: 'draft',
      currentVersion: '1.0',
      versions: [{ version: '1.0', content: form.description, changesDescription: 'Versão inicial', publishedAt: '', publishedBy: form.owner, approvedBy: '' }],
      publishedAt: null,
      expiresAt: null,
      relatedRiskIds: [],
      relatedComplianceIds: [],
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setShowModal(false);
    setForm({ title: '', description: '', type: 'policy', owner: '', approver: '', nextReviewDate: '', reviewIntervalDays: 365, tags: '' });
  };

  const policyTypeLabels: Record<PolicyType, string> = {
    policy: 'Política', norm: 'Norma', regulation: 'Regulamento',
    pop: 'POP', guideline: 'Diretriz', manual: 'Manual',
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Gestão de Políticas e Normas" sub="Versionamento, aprovação, publicação e revisão periódica"
        action={<button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"><Plus className="w-4 h-4" /> Nova Política</button>} />

      <div className="space-y-3">
        {policies.map(pol => {
          const sCfg = POLICY_STATUS_CONFIG[pol.status];
          return (
            <GlassCard key={pol.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="bg-white/5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400">{pol.code}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{pol.title}</span>
                    <Badge label={sCfg.label} color={sCfg.color} bg={sCfg.bg} />
                    <Badge label={policyTypeLabels[pol.type]} color="text-slate-300" bg="bg-white/5" />
                    <Badge label={`v${pol.currentVersion}`} color="text-violet-400" bg="bg-violet-900/30" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pol.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                    <span><Users className="w-3 h-3 inline mr-1" />{pol.owner}</span>
                    <span><Lock className="w-3 h-3 inline mr-1" />Aprovador: {pol.approver}</span>
                    {pol.nextReviewDate && <span><Clock className="w-3 h-3 inline mr-1" />Revisão: {new Date(pol.nextReviewDate).toLocaleDateString('pt-BR')}</span>}
                  </div>
                  {pol.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {pol.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded text-xs bg-white/5 text-slate-400">{tag}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-col items-end">
                  <span className="text-xs text-slate-500">{pol.versions.length} versão(ões)</span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <AnimatePresence>
        {showModal && (
          <ModalWrapper isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Política / Norma" wide>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Título"><input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className={inputClass} required /></FormField>
              <FormField label="Descrição / Conteúdo"><textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className={textareaClass} rows={4} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tipo">
                  <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value as PolicyType}))} className={selectClass}>
                    {Object.entries(policyTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </FormField>
                <FormField label="Intervalo de Revisão (dias)"><input type="number" value={form.reviewIntervalDays} onChange={e => setForm(p => ({...p, reviewIntervalDays: Number(e.target.value)}))} className={inputClass} /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Proprietário / Autor"><input value={form.owner} onChange={e => setForm(p => ({...p, owner: e.target.value}))} className={inputClass} required /></FormField>
                <FormField label="Aprovador"><input value={form.approver} onChange={e => setForm(p => ({...p, approver: e.target.value}))} className={inputClass} /></FormField>
              </div>
              <FormField label="Próxima Revisão"><input type="date" value={form.nextReviewDate} onChange={e => setForm(p => ({...p, nextReviewDate: e.target.value}))} className={inputClass} /></FormField>
              <FormField label="Tags (separadas por vírgula)"><input value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} className={inputClass} placeholder="LGPD, Ética, Compliance" /></FormField>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">Criar Política</button>
              </div>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TAB: PLANEJAMENTO ESTRATÉGICO
// =============================================================================

function StrategyTab() {
  const { strategicFoundation, strategicObjectives, updateStrategicFoundation, addStrategicObjective } = useAEGRC();
  const [editingFoundation, setEditingFoundation] = useState(false);
  const [showObjModal, setShowObjModal] = useState(false);
  const [foundation, setFoundation] = useState(strategicFoundation);
  const [objForm, setObjForm] = useState({ title: '', description: '', perspective: 'social_impact' as StrategicObjective['perspective'], owner: '', startDate: '', endDate: '' });

  const perspectiveLabels: Record<string, string> = {
    financial: 'Financeira', customer: 'Clientes/Beneficiários',
    internal_process: 'Processos Internos', learning_growth: 'Aprendizado e Crescimento', social_impact: 'Impacto Social',
  };

  const handleSaveFoundation = () => {
    updateStrategicFoundation(foundation);
    setEditingFoundation(false);
  };

  const handleAddObj = (e: React.FormEvent) => {
    e.preventDefault();
    addStrategicObjective({ ...objForm, progress: 0, status: 'not_started', initiatives: [], relatedOKRIds: [] });
    setShowObjModal(false);
    setObjForm({ title: '', description: '', perspective: 'social_impact', owner: '', startDate: '', endDate: '' });
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Planejamento Estratégico" sub="Missão, visão, valores, objetivos, iniciativas e metas institucionais" />

      {/* Foundation */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white flex items-center gap-2"><Flag className="w-4 h-4 text-violet-400" />Fundação Estratégica</div>
          <button onClick={() => setEditingFoundation(!editingFoundation)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
            {editingFoundation ? 'Cancelar' : 'Editar'}
          </button>
        </div>
        {editingFoundation ? (
          <div className="space-y-4">
            <FormField label="Missão"><textarea value={foundation.mission} onChange={e => setFoundation(p => ({...p, mission: e.target.value}))} className={textareaClass} rows={3} /></FormField>
            <FormField label="Visão"><textarea value={foundation.vision} onChange={e => setFoundation(p => ({...p, vision: e.target.value}))} className={textareaClass} rows={2} /></FormField>
            <FormField label="Valores (um por linha)"><textarea value={foundation.values.join('\n')} onChange={e => setFoundation(p => ({...p, values: e.target.value.split('\n').filter(Boolean)}))} className={textareaClass} rows={4} /></FormField>
            <button onClick={handleSaveFoundation} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">Salvar</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div><div className="text-xs font-semibold text-violet-400 mb-1">MISSÃO</div><p className="text-sm text-slate-300 leading-relaxed">{strategicFoundation.mission}</p></div>
            <div><div className="text-xs font-semibold text-violet-400 mb-1">VISÃO</div><p className="text-sm text-slate-300 leading-relaxed">{strategicFoundation.vision}</p></div>
            <div><div className="text-xs font-semibold text-violet-400 mb-1">VALORES</div><div className="flex flex-wrap gap-2">{strategicFoundation.values.map(v => <span key={v} className="px-3 py-1 rounded-full text-xs bg-white/5 text-slate-300 border border-white/10">{v}</span>)}</div></div>
          </div>
        )}
      </GlassCard>

      {/* Objetivos */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-white">Objetivos Estratégicos ({strategicObjectives.length})</div>
        <button onClick={() => setShowObjModal(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"><Plus className="w-4 h-4" />Novo Objetivo</button>
      </div>

      <div className="space-y-3">
        {strategicObjectives.map(obj => (
          <GlassCard key={obj.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-violet-900/40 px-2.5 py-1 rounded-lg text-xs font-bold text-violet-400">{obj.code}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{obj.title}</span>
                  <Badge label={perspectiveLabels[obj.perspective] ?? obj.perspective} color="text-teal-400" bg="bg-teal-900/30" />
                </div>
                <p className="text-xs text-slate-400 mt-1">{obj.description}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Progresso</span><span>{obj.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{ width: `${obj.progress}%` }} />
                  </div>
                </div>
                {obj.initiatives.length > 0 && (
                  <div className="mt-3 text-xs text-slate-500">{obj.initiatives.length} iniciativa(s) vinculada(s)</div>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <AnimatePresence>
        {showObjModal && (
          <ModalWrapper isOpen={showObjModal} onClose={() => setShowObjModal(false)} title="Novo Objetivo Estratégico" wide>
            <form onSubmit={handleAddObj} className="space-y-4">
              <FormField label="Título"><input value={objForm.title} onChange={e => setObjForm(p => ({...p, title: e.target.value}))} className={inputClass} required /></FormField>
              <FormField label="Descrição"><textarea value={objForm.description} onChange={e => setObjForm(p => ({...p, description: e.target.value}))} className={textareaClass} rows={3} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Perspectiva BSC">
                  <select value={objForm.perspective} onChange={e => setObjForm(p => ({...p, perspective: e.target.value as typeof objForm.perspective}))} className={selectClass}>
                    {Object.entries(perspectiveLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </FormField>
                <FormField label="Responsável"><input value={objForm.owner} onChange={e => setObjForm(p => ({...p, owner: e.target.value}))} className={inputClass} required /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Início"><input type="date" value={objForm.startDate} onChange={e => setObjForm(p => ({...p, startDate: e.target.value}))} className={inputClass} /></FormField>
                <FormField label="Fim"><input type="date" value={objForm.endDate} onChange={e => setObjForm(p => ({...p, endDate: e.target.value}))} className={inputClass} /></FormField>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowObjModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">Criar Objetivo</button>
              </div>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TAB: OKRs & KPIs
// =============================================================================

function OKRsTab() {
  const { okrs, addOKR, updateKeyResult } = useAEGRC();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ objective: '', description: '', cycle: 'Annual' as OKRCycle, year: new Date().getFullYear(), owner: '', team: '' });
  const [updatingKR, setUpdatingKR] = useState<{ okrId: string; krId: string } | null>(null);
  const [newKRValue, setNewKRValue] = useState('');
  const [krNote, setKRNote] = useState('');

  const handleAddOKR = (e: React.FormEvent) => {
    e.preventDefault();
    addOKR({ ...form, status: 'on_track', keyResults: [], relatedObjectiveId: null });
    setShowModal(false);
    setForm({ objective: '', description: '', cycle: 'Annual', year: new Date().getFullYear(), owner: '', team: '' });
  };

  const statusColors: Record<string, string> = {
    on_track: 'text-emerald-400', at_risk: 'text-amber-400', behind: 'text-red-400', completed: 'text-blue-400', cancelled: 'text-slate-500',
  };
  const statusLabels: Record<string, string> = {
    on_track: 'No Prazo', at_risk: 'Em Risco', behind: 'Atrasado', completed: 'Concluído', cancelled: 'Cancelado',
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="OKRs & KPIs de Governança" sub="Objetivos, Key Results e indicadores estratégicos em tempo real"
        action={<button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"><Plus className="w-4 h-4" />Novo OKR</button>} />

      <div className="space-y-4">
        {okrs.map(okr => (
          <GlassCard key={okr.id} className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold text-violet-400">{okr.code}</span>
                  <Badge label={okr.cycle + (okr.cycle !== 'Annual' ? ` ${okr.year}` : ` ${okr.year}`)} color="text-slate-300" bg="bg-white/5" />
                  <span className={cn('text-xs font-semibold', statusColors[okr.status])}>{statusLabels[okr.status]}</span>
                </div>
                <div className="text-sm font-bold text-white">{okr.objective}</div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2"><Users className="w-3.5 h-3.5" />{okr.owner} — {okr.team}</div>
              </div>
              <div className="relative shrink-0">
                <ProgressRing value={okr.overallProgress} size={64} stroke={6} color={okr.overallProgress >= 70 ? '#10b981' : okr.overallProgress >= 40 ? '#f59e0b' : '#ef4444'} />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{okr.overallProgress}%</div>
              </div>
            </div>
            <div className="space-y-3">
              {okr.keyResults.map(kr => (
                <div key={kr.id} className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-300 flex-1">{kr.title}</span>
                    <button onClick={() => { setUpdatingKR({ okrId: okr.id, krId: kr.id }); setNewKRValue(String(kr.currentValue)); setKRNote(''); }}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 shrink-0"><Zap className="w-3 h-3" />Check-in</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${kr.progress}%`, backgroundColor: kr.progress >= 70 ? '#10b981' : kr.progress >= 40 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{kr.currentValue}/{kr.targetValue} {kr.unit}</span>
                    <span className="text-xs font-semibold text-white shrink-0">{kr.progress}%</span>
                  </div>
                </div>
              ))}
              {okr.keyResults.length === 0 && <div className="text-xs text-slate-500 text-center py-2">Nenhum Key Result cadastrado. Edite o OKR para adicionar.</div>}
            </div>
          </GlassCard>
        ))}
        {okrs.length === 0 && <div className="text-center text-slate-500 py-12 text-sm">Nenhum OKR cadastrado.</div>}
      </div>

      {/* Check-in Modal */}
      <AnimatePresence>
        {updatingKR && (
          <ModalWrapper isOpen={!!updatingKR} onClose={() => setUpdatingKR(null)} title="Atualizar Key Result">
            <div className="space-y-4">
              <FormField label="Novo Valor"><input type="number" value={newKRValue} onChange={e => setNewKRValue(e.target.value)} className={inputClass} /></FormField>
              <FormField label="Nota do Check-in"><textarea value={krNote} onChange={e => setKRNote(e.target.value)} className={textareaClass} rows={2} placeholder="Contexto desta atualização..." /></FormField>
              <div className="flex gap-3">
                <button onClick={() => setUpdatingKR(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">Cancelar</button>
                <button onClick={() => { if (updatingKR) { updateKeyResult(updatingKR.okrId, updatingKR.krId, Number(newKRValue), krNote); setUpdatingKR(null); } }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">Registrar</button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <ModalWrapper isOpen={showModal} onClose={() => setShowModal(false)} title="Novo OKR">
            <form onSubmit={handleAddOKR} className="space-y-4">
              <FormField label="Objetivo"><textarea value={form.objective} onChange={e => setForm(p => ({...p, objective: e.target.value}))} className={textareaClass} rows={3} required /></FormField>
              <FormField label="Descrição"><textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className={textareaClass} rows={2} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Ciclo">
                  <select value={form.cycle} onChange={e => setForm(p => ({...p, cycle: e.target.value as OKRCycle}))} className={selectClass}>
                    {(['Q1', 'Q2', 'Q3', 'Q4', 'Annual'] as OKRCycle[]).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Ano"><input type="number" value={form.year} onChange={e => setForm(p => ({...p, year: Number(e.target.value)}))} className={inputClass} /></FormField>
              </div>
              <FormField label="Responsável"><input value={form.owner} onChange={e => setForm(p => ({...p, owner: e.target.value}))} className={inputClass} required /></FormField>
              <FormField label="Equipe"><input value={form.team} onChange={e => setForm(p => ({...p, team: e.target.value}))} className={inputClass} /></FormField>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">Criar OKR</button>
              </div>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TAB: COMITÊS CORPORATIVOS
// =============================================================================

function CommitteesTab() {
  const { committees, addCommittee, addCommitteeMeeting, addCommitteeDecision } = useAEGRC();
  const [showCommitteeModal, setShowCommitteeModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState<string | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState<{ committeeId: string; meetingId: string } | null>(null);
  const [committeeForm, setCommitteeForm] = useState({ name: '', description: '', type: 'deliberative' as Committee['type'], meetingFrequency: 'monthly' as Committee['meetingFrequency'] });
  const [meetingForm, setMeetingForm] = useState({ title: '', scheduledAt: '', location: '', isVirtual: false, quorumRequired: 3 });
  const [decisionForm, setDecisionForm] = useState({ title: '', description: '', outcome: 'approved' as CommitteeDecision['outcome'], responsibles: '', deadline: '' });

  const typeLabels: Record<Committee['type'], string> = {
    advisory: 'Consultivo', deliberative: 'Deliberativo', executive: 'Executivo',
    audit: 'Auditoria', ethics: 'Ética', risk: 'Riscos',
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Comitês Corporativos" sub="Composição, pautas, atas, deliberações e integração com Workflow Engine"
        action={<button onClick={() => setShowCommitteeModal(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"><Plus className="w-4 h-4" />Novo Comitê</button>} />

      <div className="space-y-4">
        {committees.map(c => (
          <GlassCard key={c.id} className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">{c.code}</span>
                  <span className="text-sm font-bold text-white">{c.name}</span>
                  <Badge label={typeLabels[c.type]} color="text-violet-400" bg="bg-violet-900/30" />
                  {c.isActive ? <Badge label="Ativo" color="text-emerald-400" bg="bg-emerald-900/30" /> : <Badge label="Inativo" color="text-slate-400" bg="bg-white/5" />}
                </div>
                <p className="text-xs text-slate-400 mt-1">{c.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span><Users className="w-3.5 h-3.5 inline mr-1" />{c.members.filter(m => m.isActive).length} membros</span>
                  <span><CalendarDays className="w-3.5 h-3.5 inline mr-1" />{c.meetingFrequency}</span>
                  <span><Gavel className="w-3.5 h-3.5 inline mr-1" />{c.meetings.reduce((s, m) => s + m.decisions.length, 0)} deliberações</span>
                </div>
              </div>
              <button onClick={() => setShowMeetingModal(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5" /> Reunião
              </button>
            </div>

            {/* Membros */}
            <div className="flex gap-2 flex-wrap mb-4">
              {c.members.filter(m => m.isActive).map(m => (
                <div key={m.userId} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-xs text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-violet-900/60 flex items-center justify-center text-violet-300 text-xs font-bold">{m.name.charAt(0)}</div>
                  <span>{m.name}</span>
                  <span className="text-slate-500">· {m.role === 'president' ? 'Pres.' : m.role === 'secretary' ? 'Sec.' : 'Membro'}</span>
                </div>
              ))}
            </div>

            {/* Reuniões */}
            {c.meetings.length > 0 && (
              <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="text-xs font-semibold text-slate-400 mb-2">Reuniões</div>
                {c.meetings.slice(-3).reverse().map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <div className="text-xs font-medium text-white">{m.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{new Date(m.scheduledAt).toLocaleDateString('pt-BR')} · {m.agenda.length} itens · {m.decisions.length} deliberações</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={m.status === 'scheduled' ? 'Agendada' : m.status === 'concluded' ? 'Concluída' : 'Em Andamento'} color={m.status === 'scheduled' ? 'text-amber-400' : 'text-emerald-400'} bg={m.status === 'scheduled' ? 'bg-amber-900/30' : 'bg-emerald-900/30'} />
                      {m.status === 'scheduled' && (
                        <button onClick={() => setShowDecisionModal({ committeeId: c.id, meetingId: m.id })}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-900/40 text-violet-400 hover:bg-violet-900/60 transition-colors flex items-center gap-1">
                          <Gavel className="w-3 h-3" /> Deliberar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Modais */}
      <AnimatePresence>
        {showCommitteeModal && (
          <ModalWrapper isOpen={showCommitteeModal} onClose={() => setShowCommitteeModal(false)} title="Novo Comitê">
            <form onSubmit={e => { e.preventDefault(); addCommittee({ ...committeeForm, isActive: true, members: [], meetings: [] }); setShowCommitteeModal(false); }} className="space-y-4">
              <FormField label="Nome"><input value={committeeForm.name} onChange={e => setCommitteeForm(p => ({...p, name: e.target.value}))} className={inputClass} required /></FormField>
              <FormField label="Descrição"><textarea value={committeeForm.description} onChange={e => setCommitteeForm(p => ({...p, description: e.target.value}))} className={textareaClass} rows={3} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tipo">
                  <select value={committeeForm.type} onChange={e => setCommitteeForm(p => ({...p, type: e.target.value as Committee['type']}))} className={selectClass}>
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </FormField>
                <FormField label="Periodicidade">
                  <select value={committeeForm.meetingFrequency} onChange={e => setCommitteeForm(p => ({...p, meetingFrequency: e.target.value as Committee['meetingFrequency']}))} className={selectClass}>
                    <option value="weekly">Semanal</option><option value="biweekly">Quinzenal</option>
                    <option value="monthly">Mensal</option><option value="quarterly">Trimestral</option>
                    <option value="annual">Anual</option><option value="on_demand">Sob Demanda</option>
                  </select>
                </FormField>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCommitteeModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">Criar Comitê</button>
              </div>
            </form>
          </ModalWrapper>
        )}

        {showMeetingModal && (
          <ModalWrapper isOpen={!!showMeetingModal} onClose={() => setShowMeetingModal(null)} title="Agendar Reunião">
            <form onSubmit={e => { e.preventDefault(); if (showMeetingModal) addCommitteeMeeting(showMeetingModal, { committeeId: showMeetingModal, ...meetingForm, status: 'scheduled', agenda: [], minutesText: '', decisions: [], createdBy: 'Sistema', quorumAchieved: 0 }); setShowMeetingModal(null); }} className="space-y-4">
              <FormField label="Título da Reunião"><input value={meetingForm.title} onChange={e => setMeetingForm(p => ({...p, title: e.target.value}))} className={inputClass} required /></FormField>
              <FormField label="Data e Hora"><input type="datetime-local" value={meetingForm.scheduledAt} onChange={e => setMeetingForm(p => ({...p, scheduledAt: e.target.value}))} className={inputClass} required /></FormField>
              <FormField label="Local"><input value={meetingForm.location} onChange={e => setMeetingForm(p => ({...p, location: e.target.value}))} className={inputClass} /></FormField>
              <FormField label="Quórum Mínimo"><input type="number" value={meetingForm.quorumRequired} onChange={e => setMeetingForm(p => ({...p, quorumRequired: Number(e.target.value)}))} className={inputClass} /></FormField>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMeetingModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">Agendar</button>
              </div>
            </form>
          </ModalWrapper>
        )}

        {showDecisionModal && (
          <ModalWrapper isOpen={!!showDecisionModal} onClose={() => setShowDecisionModal(null)} title="Registrar Deliberação">
            <form onSubmit={e => { e.preventDefault(); if (showDecisionModal) addCommitteeDecision(showDecisionModal.committeeId, showDecisionModal.meetingId, { title: decisionForm.title, description: decisionForm.description, decidedBy: ['Conselho'], votes: { for: 3, against: 0, abstention: 0 }, outcome: decisionForm.outcome, workflowTaskId: null, deadline: decisionForm.deadline || null, responsibles: decisionForm.responsibles.split(',').map(s => s.trim()).filter(Boolean) }); setShowDecisionModal(null); }} className="space-y-4">
              <FormField label="Título da Deliberação"><input value={decisionForm.title} onChange={e => setDecisionForm(p => ({...p, title: e.target.value}))} className={inputClass} required /></FormField>
              <FormField label="Descrição"><textarea value={decisionForm.description} onChange={e => setDecisionForm(p => ({...p, description: e.target.value}))} className={textareaClass} rows={3} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Resultado">
                  <select value={decisionForm.outcome} onChange={e => setDecisionForm(p => ({...p, outcome: e.target.value as CommitteeDecision['outcome']}))} className={selectClass}>
                    <option value="approved">Aprovado</option><option value="rejected">Rejeitado</option>
                    <option value="deferred">Adiado</option><option value="tabled">Arquivado</option>
                  </select>
                </FormField>
                <FormField label="Prazo"><input type="date" value={decisionForm.deadline} onChange={e => setDecisionForm(p => ({...p, deadline: e.target.value}))} className={inputClass} /></FormField>
              </div>
              <FormField label="Responsáveis (separados por vírgula)"><input value={decisionForm.responsibles} onChange={e => setDecisionForm(p => ({...p, responsibles: e.target.value}))} className={inputClass} /></FormField>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDecisionModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">Registrar</button>
              </div>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TAB: AUDITORIA INTEGRADA
// =============================================================================

function AuditTab() {
  const { auditLog } = useAEGRC();
  const [filter, setFilter] = useState('');

  const filtered = auditLog.filter(e =>
    !filter || e.action.toLowerCase().includes(filter.toLowerCase()) ||
    e.description.toLowerCase().includes(filter.toLowerCase()) ||
    e.module.toLowerCase().includes(filter.toLowerCase())
  );

  const moduleColors: Record<string, string> = {
    ERM: 'text-orange-400 bg-orange-900/30',
    Compliance: 'text-violet-400 bg-violet-900/30',
    Controls: 'text-blue-400 bg-blue-900/30',
    Policies: 'text-teal-400 bg-teal-900/30',
    Strategy: 'text-emerald-400 bg-emerald-900/30',
    OKRs: 'text-pink-400 bg-pink-900/30',
    Committees: 'text-amber-400 bg-amber-900/30',
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Auditoria Integrada" sub="Trilhas imutáveis de todos os eventos de governança com hash de integridade" />

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Eye className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar por ação, módulo ou descrição..."
            className={cn(inputClass, 'pl-9')} />
        </div>
        <div className="text-xs text-slate-500 shrink-0">{filtered.length} eventos</div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-slate-500 py-16 text-sm">
          <ScrollText className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          {auditLog.length === 0 ? 'Nenhum evento de governança registrado ainda. As ações realizadas nas outras abas serão registradas aqui.' : 'Nenhum evento corresponde ao filtro.'}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(entry => {
          const modColor = moduleColors[entry.module] ?? 'text-slate-400 bg-white/5';
          return (
            <GlassCard key={entry.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn('px-2 py-0.5 rounded text-xs font-bold shrink-0', modColor)}>{entry.module}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white">{entry.action}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{entry.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" />hash:{entry.hash}</span>
                    <span>{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN AEGRC PAGE
// =============================================================================

type Tab = 'dashboard' | 'erm' | 'compliance' | 'controls' | 'policies' | 'strategy' | 'okrs' | 'committees' | 'audit';

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; short: string }> = [
  { id: 'dashboard', label: 'Dashboard Executivo', icon: BarChart2, short: 'Dashboard' },
  { id: 'erm', label: 'Gestão de Riscos', icon: ShieldAlert, short: 'Riscos' },
  { id: 'compliance', label: 'Compliance', icon: CheckCircle2, short: 'Compliance' },
  { id: 'controls', label: 'Controles Internos', icon: Shield, short: 'Controles' },
  { id: 'policies', label: 'Políticas e Normas', icon: BookOpen, short: 'Políticas' },
  { id: 'strategy', label: 'Planejamento Estratégico', icon: Flag, short: 'Estratégia' },
  { id: 'okrs', label: 'OKRs & KPIs', icon: Target, short: 'OKRs' },
  { id: 'committees', label: 'Comitês', icon: Gavel, short: 'Comitês' },
  { id: 'audit', label: 'Auditoria', icon: ScrollText, short: 'Auditoria' },
];

export function AEGRC() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { criticalAlerts } = useAEGRC();

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0f1117] text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/10 bg-[#13161f]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
              <Scale className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">AEGRC</h1>
                <span className="px-2 py-0.5 rounded text-xs bg-violet-900/40 text-violet-400 border border-violet-500/30 font-semibold">Prompt 144</span>
              </div>
              <p className="text-xs text-slate-400">Aura Enterprise Governance, Risk, Compliance & Strategic Management</p>
            </div>
          </div>
          {criticalAlerts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-900/20 border border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-300">{criticalAlerts.length} alerta(s) crítico(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="shrink-0 border-b border-white/10 bg-[#13161f]/60 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3.5 text-xs font-medium transition-all border-b-2 shrink-0 whitespace-nowrap',
                  isActive
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-violet-400' : 'text-slate-500')} />
                <span className="hidden sm:inline">{tab.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'erm' && <ERMTab />}
            {activeTab === 'compliance' && <ComplianceTab />}
            {activeTab === 'controls' && <ControlsTab />}
            {activeTab === 'policies' && <PoliciesTab />}
            {activeTab === 'strategy' && <StrategyTab />}
            {activeTab === 'okrs' && <OKRsTab />}
            {activeTab === 'committees' && <CommitteesTab />}
            {activeTab === 'audit' && <AuditTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
