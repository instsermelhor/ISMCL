import React, { useState } from 'react';
import {
  Search, Download, Shield, LogIn, LogOut, Edit3, Trash2,
  FilePlus2, FileDown, Eye, Key, AlertCircle, CheckCircle2, XCircle,
  Filter, RefreshCw, Calendar, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../utils';
import { auditLogs, type AuditLog, type AuditAction } from '../../data/cgi-mock';

const actionConfig: Record<AuditAction, { label: string; icon: React.ElementType; color: string }> = {
  login: { label: 'Login', icon: LogIn, color: 'text-teal-600 bg-teal-50' },
  logout: { label: 'Logout', icon: LogOut, color: 'text-slate-600 bg-slate-100' },
  create: { label: 'Criação', icon: FilePlus2, color: 'text-emerald-600 bg-emerald-50' },
  edit: { label: 'Edição', icon: Edit3, color: 'text-blue-600 bg-blue-50' },
  delete: { label: 'Exclusão', icon: Trash2, color: 'text-red-600 bg-red-50' },
  export: { label: 'Exportação', icon: FileDown, color: 'text-violet-600 bg-violet-50' },
  view: { label: 'Visualização', icon: Eye, color: 'text-slate-600 bg-slate-100' },
  permission_change: { label: 'Perm. Alterada', icon: Shield, color: 'text-orange-600 bg-orange-50' },
  password_reset: { label: 'Reset Senha', icon: Key, color: 'text-amber-600 bg-amber-50' },
};

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
}

function getRiskLabel(score: number) {
  if (score >= 70) return { label: 'Alto', color: 'text-red-600 bg-red-50' };
  if (score >= 30) return { label: 'Médio', color: 'text-amber-600 bg-amber-50' };
  return { label: 'Baixo', color: 'text-emerald-600 bg-emerald-50' };
}

// ─── Risk Heatmap per user ────────────────────────────────────
interface UserRisk {
  user: string;
  failedLogins: number;
  sensitiveActions: number;
  riskScore: number;
}

function buildUserRisk(logs: AuditLog[]): UserRisk[] {
  const map: Record<string, UserRisk> = {};
  logs.forEach(log => {
    if (!map[log.user]) map[log.user] = { user: log.user, failedLogins: 0, sensitiveActions: 0, riskScore: 0 };
    if (log.status === 'failed') map[log.user].failedLogins++;
    if (['delete', 'export', 'permission_change'].includes(log.action)) map[log.user].sensitiveActions++;
    map[log.user].riskScore = Math.max(map[log.user].riskScore, log.riskScore ?? 0);
  });
  return Object.values(map).sort((a, b) => b.riskScore - a.riskScore);
}

// ─── Main Component ───────────────────────────────────────────
const PAGE_SIZE = 8;

export function CGIAuditoria() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [view, setView] = useState<'log' | 'risk'>('log');

  const filtered = auditLogs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch =
      log.user.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q) ||
      log.ip.includes(q);
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    const matchStatus = statusFilter === 'all' || log.status === statusFilter;
    const logDate = new Date(log.timestamp);
    const matchFrom = !dateFrom || logDate >= new Date(dateFrom);
    const matchTo = !dateTo || logDate <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchAction && matchStatus && matchFrom && matchTo;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const failed = auditLogs.filter(l => l.status === 'failed').length;
  const kpis = [
    { label: 'Total de Registros', value: auditLogs.length, color: 'text-slate-900' },
    { label: 'Bem-sucedidos', value: auditLogs.filter(l => l.status === 'success').length, color: 'text-emerald-600' },
    { label: 'Falhas', value: failed, color: failed > 0 ? 'text-red-600' : 'text-slate-600' },
    { label: 'Módulos Afetados', value: new Set(auditLogs.map(l => l.module)).size, color: 'text-blue-600' },
  ];

  const userRisks = buildUserRisk(auditLogs);

  // Critical events timeline
  const criticalEvents = auditLogs
    .filter(l => (l.riskScore ?? 0) >= 35)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">Trilha de Auditoria</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <RefreshCw className="w-3 h-3" /> Logs imutáveis · protegidos por criptografia
          </div>
        </div>
      </div>

      {/* Failed login warning */}
      {failed > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">
            <strong>{failed}</strong> tentativa(s) de acesso malsucedida(s) registradas. Verifique a trilha de auditoria.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={cn('text-2xl font-bold', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {[
          { id: 'log', label: 'Log Completo' },
          { id: 'risk', label: 'Score de Risco' },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id as any)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all',
              view === t.id ? 'bg-teal-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Risk View */}
      {view === 'risk' && (
        <div className="space-y-4">
          {/* Events Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Eventos de Alto Risco</span>
            </div>
            <div className="divide-y divide-slate-50">
              {criticalEvents.map(log => {
                const cfg = actionConfig[log.action];
                const Icon = cfg.icon;
                const riskCfg = getRiskLabel(log.riskScore ?? 0);
                return (
                  <div key={log.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{log.description}</p>
                      <p className="text-xs text-slate-400">{log.user} · {log.module} · {formatTimestamp(log.timestamp)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', riskCfg.color)}>
                        {riskCfg.label} ({log.riskScore})
                      </span>
                      {log.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Risk Scores */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Score de Risco por Usuário</span>
            </div>
            <div className="divide-y divide-slate-50">
              {userRisks.map(ur => {
                const riskCfg = getRiskLabel(ur.riskScore);
                return (
                  <div key={ur.user} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                      {ur.user.split('@')[0].slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{ur.user}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400">Falhas: {ur.failedLogins}</span>
                        <span className="text-xs text-slate-400">Ações sensíveis: {ur.sensitiveActions}</span>
                      </div>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${ur.riskScore}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', ur.riskScore >= 70 ? 'bg-red-500' : ur.riskScore >= 30 ? 'bg-amber-500' : 'bg-emerald-500')}
                        />
                      </div>
                    </div>
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full shrink-0', riskCfg.color)}>
                      {riskCfg.label} ({ur.riskScore})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Log View */}
      {view === 'log' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                  placeholder="Buscar por usuário, módulo, IP ou ação..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 shadow-sm outline-none" />
              </div>
              <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm">
                <option value="all">Todas as ações</option>
                {(Object.keys(actionConfig) as AuditAction[]).map(a => (
                  <option key={a} value={a}>{actionConfig[a].label}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm">
                <option value="all">Todos os status</option>
                <option value="success">Sucesso</option>
                <option value="failed">Falha</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> Exportar CSV
              </button>
            </div>
            {/* Date filters */}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm" />
              <span className="text-slate-400 text-sm">até</span>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm" />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {filtered.length} registro(s) · página {page + 1} de {totalPages || 1}
              </span>
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <div className="divide-y divide-slate-50">
              {paginated.map((log, i) => {
                const cfg = actionConfig[log.action];
                const Icon = cfg.icon;
                const riskCfg = getRiskLabel(log.riskScore ?? 0);
                return (
                  <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', cfg.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 truncate">{log.description}</span>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', cfg.color)}>{cfg.label}</span>
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        )}
                        <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-full ml-auto', riskCfg.color)}>
                          R:{log.riskScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500">{log.user}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{log.module}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-mono text-slate-400">{log.ip}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-400">{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-5 py-12 text-center text-slate-400 text-sm">Nenhum registro encontrado.</div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="text-xs font-medium text-teal-600 disabled:text-slate-300 hover:text-teal-700 transition-colors disabled:cursor-not-allowed">
                  ← Anterior
                </button>
                <span className="text-xs text-slate-400">
                  Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="text-xs font-medium text-teal-600 disabled:text-slate-300 hover:text-teal-700 transition-colors disabled:cursor-not-allowed">
                  Próxima →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
