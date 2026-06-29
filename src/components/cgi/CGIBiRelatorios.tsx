import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart2, TrendingUp, TrendingDown, Users, Heart, DollarSign, Activity,
  Download, Filter, Target, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';
import { cn } from '../../utils';
import {
  atendimentosMensais, atendimentosMensaisAnoAnterior,
  captacaoMensal, despesasMensais,
  distribuicaoProjetos, beneficiarios, profissionais,
  voluntarios, projetos, okrObjectives, impactoSocial,
} from '../../data/cgi-mock';

// ─── Helpers ───────────────────────────────────────────────────
function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

// ─── Horizontal Bar ────────────────────────────────────────────
function HBar({
  items, max, colorFn, showSub = false,
}: {
  items: { label: string; value: number; sub?: number }[];
  max: number;
  colorFn?: (i: number) => string;
  showSub?: boolean;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 w-7 shrink-0">{item.label}</span>
          <div className="flex-1 h-5 relative flex gap-0.5">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 }}
              className="rounded-l-full"
              style={{ backgroundColor: colorFn ? colorFn(0) : '#0d9488' }}
            />
            {showSub && item.sub !== undefined && (
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${(item.sub / max) * 100}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 + 0.1 }}
                className="rounded-r-full bg-blue-300"
              />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-700 w-12 text-right">
            {item.value + (showSub ? (item.sub ?? 0) : 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Comparativo (2025 vs 2026) ────────────────────────────────
function ComparativoChart() {
  const max = Math.max(
    ...atendimentosMensais.map(m => m.total),
    ...atendimentosMensaisAnoAnterior.map(m => m.total),
  ) * 1.1;

  const totalAtual = atendimentosMensais.reduce((s, m) => s + m.total, 0);
  const totalAnterior = atendimentosMensaisAnoAnterior.reduce((s, m) => s + m.total, 0);
  const diff = totalAtual - totalAnterior;
  const pct = Math.round((diff / totalAnterior) * 100);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold',
          diff > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
          {diff > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          {diff > 0 ? '+' : ''}{pct}% vs. 2025
        </div>
        <span className="text-xs text-slate-400">Total 2026: {totalAtual} · 2025: {totalAnterior}</span>
      </div>
      <div className="space-y-3">
        {atendimentosMensais.map((m, i) => {
          const prev = atendimentosMensaisAnoAnterior[i].total;
          const isUp = m.total >= prev;
          return (
            <div key={m.mes} className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500 w-7">{m.mes}</span>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-1 h-2.5">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${(m.total / max) * 100}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 }}
                    className="h-full rounded-full bg-teal-500"
                  />
                </div>
                <div className="flex items-center gap-1 h-2.5">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${(prev / max) * 100}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 + 0.1 }}
                    className="h-full rounded-full bg-slate-300"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 w-20 justify-end">
                {isUp ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-red-500" />}
                <span className={cn('text-xs font-semibold', isUp ? 'text-emerald-600' : 'text-red-600')}>
                  {m.total}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 pt-3 border-t border-slate-100 mt-3">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-teal-500" /><span className="text-xs text-slate-500">2026</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-300" /><span className="text-xs text-slate-500">2025</span></div>
      </div>
    </div>
  );
}

// ─── Financeiro Chart ──────────────────────────────────────────
const CAP_COLORS = ['#0d9488', '#8b5cf6', '#f59e0b'];
const CAP_LABELS = ['Doações', 'Patrocínios', 'Editais'];
const DESP_COLORS = ['#ef4444', '#f97316', '#94a3b8'];
const DESP_LABELS = ['Pessoal', 'Projetos', 'Administrativo'];

function FinanceiroChart() {
  const [view, setView] = useState<'captacao' | 'despesas' | 'saldo'>('captacao');

  const totalCaptado = captacaoMensal.reduce((s, m) => s + m.doacoes + m.patrocinios + m.editais, 0);
  const totalDespesas = despesasMensais.reduce((s, m) => s + m.total, 0);
  const saldo = totalCaptado - totalDespesas;

  const maxCap = Math.max(...captacaoMensal.map(m => m.doacoes + m.patrocinios + m.editais));
  const maxDesp = Math.max(...despesasMensais.map(m => m.total));

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Captado', value: formatBRL(totalCaptado), icon: ArrowUp, color: 'text-emerald-600', bg: 'bg-emerald-50', active: view === 'captacao', onClick: () => setView('captacao') },
          { label: 'Total Despesas', value: formatBRL(totalDespesas), icon: ArrowDown, color: 'text-red-600', bg: 'bg-red-50', active: view === 'despesas', onClick: () => setView('despesas') },
          { label: 'Saldo', value: formatBRL(saldo), icon: Minus, color: saldo >= 0 ? 'text-teal-600' : 'text-red-600', bg: saldo >= 0 ? 'bg-teal-50' : 'bg-red-50', active: view === 'saldo', onClick: () => setView('saldo') },
        ].map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={card.onClick}
              className={cn(
                'rounded-xl p-3 text-left transition-all border',
                card.active ? `${card.bg} border-current ${card.color} ring-1 ring-current/20` : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
              )}
            >
              <div className="flex items-center gap-1 mb-1">
                <Icon className={cn('w-3.5 h-3.5', card.color)} />
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
              <p className={cn('text-sm font-bold', card.color)}>{card.value}</p>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      {view === 'captacao' && (
        <div className="space-y-3">
          {captacaoMensal.map((m, i) => {
            const total = m.doacoes + m.patrocinios + m.editais;
            const segs = [m.doacoes, m.patrocinios, m.editais];
            return (
              <div key={m.mes} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 w-7 shrink-0">{m.mes}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden flex">
                  {segs.map((seg, j) => (
                    <motion.div key={j}
                      initial={{ width: 0 }} animate={{ width: `${(seg / maxCap) * 100}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 + j * 0.08 }}
                      style={{ backgroundColor: CAP_COLORS[j] }} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-700 w-24 text-right">{formatBRL(total)}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
            {CAP_LABELS.map((l, j) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CAP_COLORS[j] }} />
                <span className="text-xs text-slate-500">{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'despesas' && (
        <div className="space-y-3">
          {despesasMensais.map((m, i) => {
            const segs = [m.pessoal, m.projetos, m.administrativo];
            return (
              <div key={m.mes} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 w-7 shrink-0">{m.mes}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden flex">
                  {segs.map((seg, j) => (
                    <motion.div key={j}
                      initial={{ width: 0 }} animate={{ width: `${(seg / maxDesp) * 100}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 + j * 0.08 }}
                      style={{ backgroundColor: DESP_COLORS[j] }} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-red-600 w-24 text-right">{formatBRL(m.total)}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
            {DESP_LABELS.map((l, j) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DESP_COLORS[j] }} />
                <span className="text-xs text-slate-500">{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'saldo' && (
        <div className="space-y-3">
          {captacaoMensal.map((m, i) => {
            const cap = m.doacoes + m.patrocinios + m.editais;
            const desp = despesasMensais[i].total;
            const sal = cap - desp;
            const maxAbs = Math.max(...captacaoMensal.map((mm, ii) => Math.abs((mm.doacoes + mm.patrocinios + mm.editais) - despesasMensais[ii].total)));
            return (
              <div key={m.mes} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 w-7 shrink-0">{m.mes}</span>
                <div className="flex-1 flex items-center">
                  <div className="flex-1 h-5 flex justify-end">
                    {sal < 0 && (
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${(Math.abs(sal) / maxAbs) * 50}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 }}
                        className="h-full bg-red-400 rounded-l-full"
                      />
                    )}
                  </div>
                  <div className="w-px h-5 bg-slate-300 mx-1" />
                  <div className="flex-1 h-5">
                    {sal >= 0 && (
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${(sal / maxAbs) * 50}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 }}
                        className="h-full bg-emerald-500 rounded-r-full"
                      />
                    )}
                  </div>
                </div>
                <span className={cn('text-xs font-semibold w-24 text-right', sal >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {sal >= 0 ? '+' : ''}{formatBRL(sal)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── OKR / Indicadores Estratégicos ───────────────────────────
const okrStatusConfig = {
  on_track: { label: 'No Prazo', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: ArrowUp },
  at_risk: { label: 'Em Risco', color: 'text-amber-600', bg: 'bg-amber-100', icon: Minus },
  behind: { label: 'Atrasado', color: 'text-red-600', bg: 'bg-red-100', icon: ArrowDown },
  achieved: { label: 'Atingido', color: 'text-teal-600', bg: 'bg-teal-100', icon: ArrowUp },
};

function OKRView() {
  return (
    <div className="space-y-6">
      {okrObjectives.map(obj => (
        <div key={obj.id} className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{obj.objective}</p>
              <p className="text-xs text-slate-400">{obj.period} · {obj.owner}</p>
            </div>
          </div>
          <div className="space-y-2 pl-4 border-l-2 border-slate-200">
            {obj.keyResults.map(kr => {
              const cfg = okrStatusConfig[kr.status];
              const StatusIcon = cfg.icon;
              const pct = Math.round((kr.current / kr.target) * 100);
              const displayValue = kr.unit === 'R$'
                ? `${formatBRL(kr.current)} / ${formatBRL(kr.target)}`
                : `${kr.current.toLocaleString('pt-BR')} / ${kr.target.toLocaleString('pt-BR')} ${kr.unit}`;
              return (
                <div key={kr.id} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-700">{kr.label}</p>
                    <span className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                      <StatusIcon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', kr.status === 'achieved' || kr.status === 'on_track' ? 'bg-emerald-500' : kr.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-400')}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-10 text-right">{pct}%</span>
                  </div>
                  <p className="text-xs text-slate-400">{displayValue}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Distribution Chart ────────────────────────────────────────
function DistributionChart() {
  const total = distribuicaoProjetos.reduce((s, p) => s + p.beneficiarios, 0);
  return (
    <div className="space-y-3">
      {distribuicaoProjetos.map(p => (
        <div key={p.projeto}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-700">{p.projeto}</span>
            <span className="text-xs text-slate-500">{p.beneficiarios} ({Math.round((p.beneficiarios / total) * 100)}%)</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${(p.beneficiarios / total) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: p.cor }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export function CGIBiRelatorios() {
  const [tab, setTab] = useState<'assistencial' | 'comparativo' | 'financeiro' | 'distribuicao' | 'estrategico' | 'indicadores'>('assistencial');
  const [period, setPeriod] = useState('2026-s1');
  const [reportTypes, setReportTypes] = useState<string[]>(['Beneficiários', 'Projetos', 'Atendimentos']);

  const maxAtend = Math.max(...atendimentosMensais.map(m => m.total)) * 1.1;

  const strategicKPIs = [
    { icon: Activity, label: 'Atendimentos (Jun)', value: '368', sub: '+12,4% vs mês ant.', color: 'text-teal-600', bg: 'bg-teal-50', trend: 'up' },
    { icon: Users, label: 'Beneficiários Ativos', value: '247', sub: '+8,2% vs mês ant.', color: 'text-blue-600', bg: 'bg-blue-50', trend: 'up' },
    { icon: Heart, label: 'Horas Voluntárias', value: '2.840h', sub: '+18,3% no mês', color: 'text-violet-600', bg: 'bg-violet-50', trend: 'up' },
    {
      icon: DollarSign, label: 'Captado (Jun)',
      value: formatBRL(captacaoMensal[5].doacoes + captacaoMensal[5].patrocinios + captacaoMensal[5].editais),
      sub: 'Doações + Patrocínios + Editais', color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'up'
    },
  ];

  const tabs = [
    { id: 'assistencial', label: 'Atendimentos' },
    { id: 'comparativo', label: 'Comparativo' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'distribuicao', label: 'Beneficiários' },
    { id: 'estrategico', label: 'Estratégico (OKRs)' },
    { id: 'indicadores', label: 'Indicadores Gerais' },
  ] as const;

  const allReportTypes = ['Beneficiários', 'Profissionais', 'Projetos', 'Atendimentos', 'Voluntários', 'Financeiro', 'Documentos', 'Auditoria'];

  function toggleReport(r: string) {
    setReportTypes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">Business Intelligence & Relatórios</h2>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-sm">
            <option value="2026-s1">1º Sem. 2026</option>
            <option value="2026-q1">Q1 2026</option>
            <option value="2026-q2">Q2 2026</option>
            <option value="2026">Ano 2026</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Strategic KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {strategicKPIs.map(k => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-slate-500">{k.label}</p>
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', k.bg)}>
                  <Icon className={cn('w-4 h-4', k.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">{k.sub}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors',
                  tab === t.id
                    ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {tab === 'assistencial' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Atendimentos Mensais</h3>
              <p className="text-xs text-slate-400 mb-5">Online + Presencial — 2026</p>
              <HBar
                items={atendimentosMensais.map(m => ({ label: m.mes, value: m.online, sub: m.presencial }))}
                max={maxAtend}
                showSub
              />
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-teal-500" /><span className="text-xs text-slate-500">Online</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-300" /><span className="text-xs text-slate-500">Presencial</span></div>
              </div>
            </div>
          )}

          {tab === 'comparativo' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Comparativo Anual</h3>
              <p className="text-xs text-slate-400 mb-5">Atendimentos 2026 vs 2025</p>
              <ComparativoChart />
            </div>
          )}

          {tab === 'financeiro' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Captação vs. Despesas</h3>
              <p className="text-xs text-slate-400 mb-5">Visão financeira mensal — 2026</p>
              <FinanceiroChart />
            </div>
          )}

          {tab === 'distribuicao' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Distribuição de Beneficiários por Projeto</h3>
              <p className="text-xs text-slate-400 mb-5">Total: {distribuicaoProjetos.reduce((s, p) => s + p.beneficiarios, 0)} beneficiários</p>
              <DistributionChart />
            </div>
          )}

          {tab === 'estrategico' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Target className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-slate-800">OKRs Institucionais — 2026</h3>
              </div>
              <OKRView />
            </div>
          )}

          {tab === 'indicadores' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {[
                { label: 'Beneficiários Ativos', value: beneficiarios.filter(b => b.status === 'ativo').length, total: beneficiarios.length },
                { label: 'Profissionais Ativos', value: profissionais.filter(p => p.status === 'ativo').length, total: profissionais.length },
                { label: 'Voluntários Ativos', value: voluntarios.filter(v => v.status === 'ativo').length, total: voluntarios.length },
                { label: 'Projetos Ativos', value: projetos.filter(p => p.status === 'ativo').length, total: projetos.length },
                { label: 'Alto Risco', value: beneficiarios.filter(b => b.risk === 'high').length, total: beneficiarios.length },
                { label: 'Taxa Comparecimento', value: 87, total: 100, suffix: '%' },
              ].map(ind => {
                const pct = Math.round((ind.value / ind.total) * 100);
                return (
                  <div key={ind.label} className="space-y-2">
                    <p className="text-xs font-medium text-slate-700">{ind.label}</p>
                    <p className="text-xl font-bold text-slate-900">{ind.value}{ind.suffix ?? ''}</p>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-teal-500 rounded-full" />
                    </div>
                    <p className="text-xs text-slate-400">{pct}% de {ind.total}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Export section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Gerar Relatório Parametrizável</h3>
          <span className="text-xs text-slate-400 ml-auto">{reportTypes.length} módulo(s) selecionado(s)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {allReportTypes.map(r => (
            <label key={r} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={reportTypes.includes(r)}
                onChange={() => toggleReport(r)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700 group-hover:text-teal-700 transition-colors">{r}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm">
            <option>Junho 2026</option>
            <option>Maio 2026</option>
            <option>Abril 2026</option>
            <option>2026 (anual)</option>
          </select>
          <div className="flex gap-2">
            {['PDF', 'Excel', 'CSV'].map(fmt => (
              <button key={fmt} className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors">
                <Download className="w-3.5 h-3.5" /> {fmt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
