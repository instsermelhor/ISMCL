/**
 * MCSI — Módulo Complementar de Segurança Institucional
 * Instituto Ser Melhor — Projeto Aura
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck, Lock, Eye, EyeOff, AlertTriangle, FileSearch,
  Users, Key, Activity, Download, Shield, ClipboardList,
  Clock, CheckCircle, XCircle, RefreshCw, ChevronDown,
  ChevronUp, Search, Filter, Bell, Fingerprint, BookLock,
  UserCheck, UserX, Gavel, Siren, TrendingUp, Database,
  ShieldAlert, ShieldOff, FileWarning, Sparkles, PlusCircle,
  Info, BarChart3, ArrowUpRight, Layers, ScanLine, Cpu,
  AlertCircle, Check, X, ExternalLink
} from 'lucide-react';
import {
  useSecurity,
  SensitivityLevel,
  ProtectedProfile,
  AccessRequest,
  AuditLogEntry,
  BehaviorAlert,
} from '../contexts/SecurityContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils';

// ---------------------------------------------------------------------------
// Helpers de UI
// ---------------------------------------------------------------------------

const LEVEL_CONFIG: Record<
  SensitivityLevel,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType; badge: string }
> = {
  0: { label: 'Padrão', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: Shield, badge: 'bg-slate-100 text-slate-600' },
  1: { label: 'Parcialmente Restrito', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: ShieldCheck, badge: 'bg-blue-100 text-blue-700' },
  2: { label: 'Protegido', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Lock, badge: 'bg-amber-100 text-amber-700' },
  3: { label: 'Altamente Protegido', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: ShieldAlert, badge: 'bg-orange-100 text-orange-700' },
  4: { label: 'Institucional Sigiloso', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: BookLock, badge: 'bg-red-100 text-red-700' },
};

const ALERT_SEVERITY_CONFIG = {
  LOW: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Baixa' },
  MEDIUM: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Média' },
  HIGH: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Alta' },
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Crítica' },
};

const ALERT_TYPE_LABEL: Record<string, string> = {
  MASS_QUERIES: 'Consultas em Massa',
  UNUSUAL_EXPORT: 'Exportação Incomum',
  OUT_OF_HOURS: 'Acesso Fora de Horário',
  CONCURRENT_SESSIONS: 'Sessões Simultâneas',
  EXCESSIVE_DOWNLOAD: 'Download Excessivo',
  PRIVILEGE_ABUSE: 'Abuso de Privilégio',
  REPEATED_DENIED: 'Tentativas Negadas Repetidas',
};

const ACTION_LABEL: Record<string, string> = {
  VIEW: 'Visualização',
  EDIT: 'Edição',
  EXPORT: 'Exportação',
  PRINT: 'Impressão',
  SEARCH: 'Pesquisa',
  DENIED: 'Acesso Negado',
  BREAK_GLASS: 'Acesso Excepcional',
  LEVEL_CHANGE: 'Alteração de Nível',
  PERMISSION_CHANGE: 'Alteração de Permissão',
  VAULT_ACCESS: 'Acesso ao Cofre',
  EXPORT_ANON: 'Exportação Anonimizada',
};

const SPECIAL_CATEGORY_LABEL: Record<string, string> = {
  POLICIA_FEDERAL: 'Agente — Polícia Federal',
  POLICIA_RODOVIARIA_FEDERAL: 'Agente — PRF',
  POLICIAL_MILITAR: 'Policial Militar',
  POLICIAL_CIVIL: 'Policial Civil',
  GUARDA_CIVIL_MUNICIPAL: 'Guarda Civil Municipal',
  POLICIA_PENAL: 'Polícia Penal',
  BOMBEIRO_MILITAR: 'Bombeiro Militar',
  PERITO_OFICIAL: 'Perito Oficial',
  AGENTE_SOCIOEDUCATIVO: 'Agente Socioeducativo',
  SERVIDOR_JUSTICA: 'Servidor do Sistema de Justiça',
  MAGISTRADO: 'Magistrado',
  PROMOTOR: 'Promotor de Justiça',
  DEFENSOR_PUBLICO: 'Defensor Público',
  SERVIDOR_MP: 'Servidor do MP',
  SERVIDOR_JUDICIARIO: 'Servidor do Judiciário',
  CONSELHEIRO_TUTELAR: 'Conselheiro Tutelar',
  MILITAR_FORCAS_ARMADAS: 'Militar das Forças Armadas',
  SERVIDOR_INTELIGENCIA: 'Servidor de Inteligência',
  AUTORIDADE_PUBLICA: 'Autoridade Pública',
  FAMILIA_PROTEGIDA: 'Família Protegida',
  PROGRAMA_PROTECAO: 'Programa de Proteção',
  VITIMA_VIOLENCIA_DOMESTICA: 'Vítima — Violência Doméstica',
  VITIMA_VIOLENCIA_SEXUAL: 'Vítima — Violência Sexual',
  VITIMA_VIOLENCIA_FISICA: 'Vítima — Violência Física',
  VITIMA_VIOLENCIA_PSICOLOGICA: 'Vítima — Violência Psicológica',
  MEDIDA_PROTETIVA_ATIVA: 'Medida Protetiva Ativa',
  MENOR_ECA: 'Menor — ECA',
  CASO_JUDICIAL_SIGILOSO: 'Caso Judicial Sigiloso',
  CASO_ESTRATEGICO_DIRETORIA: 'Caso Estratégico — Diretoria',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function LevelBadge({ level }: { level: SensitivityLevel }) {
  const cfg = LEVEL_CONFIG[level];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.badge)}>
      <Icon className="w-3 h-3" />
      N{level} — {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:       { label: 'Pendente',    cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
    APPROVED:      { label: 'Aprovado',    cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    DENIED:        { label: 'Negado',      cls: 'bg-red-100 text-red-700 border border-red-200' },
    EXPIRED:       { label: 'Expirado',    cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
    ACTIVE:        { label: 'Ativa',       cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    SUSPENDED:     { label: 'Suspensa',    cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
    NEW:           { label: 'Novo',        cls: 'bg-red-100 text-red-700 border border-red-200' },
    INVESTIGATING: { label: 'Em Análise',  cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
    RESOLVED:      { label: 'Resolvido',   cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    FALSE_POSITIVE:{ label: 'Falso Pos.',  cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500 border border-slate-200' };
  return <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', s.cls)}>{s.label}</span>;
}

function RiskScore({ score }: { score: number }) {
  const color = score >= 8 ? 'text-red-600' : score >= 5 ? 'text-orange-500' : 'text-emerald-600';
  const barColor = score >= 8 ? 'bg-red-500' : score >= 5 ? 'bg-orange-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
        <div className={cn('h-full rounded-full', barColor)} style={{ width: `${score * 10}%` }} />
      </div>
      <span className={cn('text-sm font-bold tabular-nums', color)}>{score.toFixed(1)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type Tab =
  | 'dashboard'
  | 'profiles'
  | 'vault'
  | 'access'
  | 'audit'
  | 'alerts'
  | 'anonymize';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',  label: 'Painel',            icon: BarChart3      },
  { id: 'profiles',   label: 'Perfis Protegidos', icon: ShieldCheck    },
  { id: 'vault',      label: 'Cofre Digital',     icon: BookLock       },
  { id: 'access',     label: 'Acesso Excepcional',icon: Key            },
  { id: 'audit',      label: 'Auditoria',         icon: ClipboardList  },
  { id: 'alerts',     label: 'Alertas',           icon: Siren          },
  { id: 'anonymize',  label: 'Anonimização',      icon: ScanLine       },
];

// ---------------------------------------------------------------------------
// Dashboard Tab
// ---------------------------------------------------------------------------

function DashboardTab() {
  const { profiles, accessRequests, auditLog, behaviorAlerts } = useSecurity();

  const stats = useMemo(() => {
    const byLevel = [0, 1, 2, 3, 4].map((l) => ({
      level: l as SensitivityLevel,
      count: profiles.filter((p) => p.sensitivityLevel === l).length,
    }));
    const pendingRequests = accessRequests.filter((r) => r.status === 'PENDING').length;
    const criticalAlerts  = behaviorAlerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'NEW').length;
    const activeMeasures  = profiles.reduce(
      (acc, p) => acc + p.protectiveMeasures.filter((m) => m.status === 'ACTIVE').length,
      0
    );
    const recentDenied = auditLog.filter((l) => l.action === 'DENIED').length;
    return { byLevel, pendingRequests, criticalAlerts, activeMeasures, recentDenied };
  }, [profiles, accessRequests, auditLog, behaviorAlerts]);

  const expiringMeasures = useMemo(() => {
    const all: { code: string; measure: { measureType: string; expirationDate?: string } }[] = [];
    profiles.forEach((p) => {
      p.protectiveMeasures.forEach((m) => {
        if (m.status === 'ACTIVE' && m.expirationDate && daysUntil(m.expirationDate) <= 30) {
          all.push({ code: p.internalCode, measure: m });
        }
      });
    });
    return all.sort((a, b) =>
      new Date(a.measure.expirationDate!).getTime() - new Date(b.measure.expirationDate!).getTime()
    );
  }, [profiles]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Beneficiários Protegidos', value: profiles.length, icon: ShieldCheck, color: 'from-teal-500 to-teal-600', sub: 'cadastros ativos' },
          { label: 'Solicitações Pendentes',   value: stats.pendingRequests, icon: Key, color: 'from-amber-500 to-orange-500', sub: 'aguardam aprovação' },
          { label: 'Alertas Críticos',          value: stats.criticalAlerts, icon: Siren, color: 'from-red-500 to-red-600', sub: 'requerem atenção' },
          { label: 'Medidas Protetivas Ativas', value: stats.activeMeasures, icon: Gavel, color: 'from-violet-500 to-purple-600', sub: 'em vigência' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm', kpi.color)}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">{kpi.value}</div>
              <div className="text-sm font-medium text-slate-600 mt-0.5">{kpi.label}</div>
              <div className="text-xs text-slate-400">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Nível */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-500" />
            Distribuição por Nível de Proteção
          </h3>
          <div className="space-y-3">
            {stats.byLevel.map(({ level, count }) => {
              const cfg = LEVEL_CONFIG[level];
              const Icon = cfg.icon;
              const pct = profiles.length ? Math.round((count / profiles.length) * 100) : 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                    <Icon className={cn('w-4 h-4', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600">N{level} — {cfg.label}</span>
                      <span className="text-xs font-bold text-slate-800 tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', {
                          'bg-slate-400': level === 0,
                          'bg-blue-400': level === 1,
                          'bg-amber-400': level === 2,
                          'bg-orange-500': level === 3,
                          'bg-red-500': level === 4,
                        })}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right tabular-nums">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Medidas Protetivas próximas ao vencimento */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Medidas Protetivas — Vencimento Próximo
          </h3>
          {expiringMeasures.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
              <p className="text-sm">Nenhuma medida próxima ao vencimento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringMeasures.map(({ code, measure }) => {
                const days = daysUntil(measure.expirationDate!);
                const urgent = days <= 7;
                return (
                  <div
                    key={code + measure.expirationDate}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border',
                      urgent ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                    )}
                  >
                    <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', urgent ? 'text-red-500' : 'text-orange-500')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{code}</p>
                      <p className="text-xs text-slate-500 truncate">{measure.measureType}</p>
                    </div>
                    <span className={cn('text-xs font-bold tabular-nums shrink-0', urgent ? 'text-red-600' : 'text-orange-600')}>
                      {days}d
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Últimas ações de auditoria */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-500" />
          Atividade Recente — Trilha de Auditoria
        </h3>
        <div className="space-y-2">
          {auditLog.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                log.action === 'DENIED' ? 'bg-red-100' :
                log.action === 'BREAK_GLASS' ? 'bg-orange-100' :
                log.action === 'LEVEL_CHANGE' ? 'bg-violet-100' : 'bg-teal-100'
              )}>
                {log.action === 'DENIED'      && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                {log.action === 'BREAK_GLASS' && <Key className="w-3.5 h-3.5 text-orange-500" />}
                {log.action === 'LEVEL_CHANGE'&& <TrendingUp className="w-3.5 h-3.5 text-violet-500" />}
                {!['DENIED','BREAK_GLASS','LEVEL_CHANGE'].includes(log.action) && <Eye className="w-3.5 h-3.5 text-teal-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-800">{log.userName}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500">{ACTION_LABEL[log.action] ?? log.action}</span>
                  {log.targetCode && (
                    <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{log.targetCode}</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(log.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profiles Tab
// ---------------------------------------------------------------------------

function ProfilesTab() {
  const { profiles, canAccess, updateProfileLevel, logAction } = useSecurity();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<SensitivityLevel | -1>(-1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editLevelId, setEditLevelId] = useState<string | null>(null);
  const [editLevelValue, setEditLevelValue] = useState<SensitivityLevel>(0);

  const visible = useMemo(() => {
    return profiles.filter((p) => {
      const access = canAccess(p.sensitivityLevel);
      if (access === 'BLOCKED') return false;
      if (levelFilter !== -1 && p.sensitivityLevel !== levelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = p.beneficiaryName.toLowerCase().includes(q);
        const codeMatch = p.internalCode.toLowerCase().includes(q);
        return nameMatch || codeMatch;
      }
      return true;
    });
  }, [profiles, canAccess, search, levelFilter]);

  const handleView = (p: ProtectedProfile) => {
    setExpandedId(expandedId === p.id ? null : p.id);
    logAction({
      userId: user?.email ?? '—',
      userName: user?.name ?? '—',
      action: 'VIEW',
      targetCode: p.internalCode,
      description: 'Perfil de proteção visualizado.',
      ipAddress: '—',
      device: navigator.userAgent.slice(0, 50),
      sensitivityLevel: p.sensitivityLevel,
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="mcsi-profile-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por código ISM ou nome..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        </div>
        <select
          id="mcsi-level-filter"
          value={levelFilter}
          onChange={(e) => setLevelFilter(Number(e.target.value) as SensitivityLevel | -1)}
          className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
        >
          <option value={-1}>Todos os Níveis</option>
          {([0,1,2,3,4] as SensitivityLevel[]).map((l) => (
            <option key={l} value={l}>N{l} — {LEVEL_CONFIG[l].label}</option>
          ))}
        </select>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Registros com nível de proteção superior à sua permissão <strong>não aparecem nos resultados</strong> —
          conforme a política de Pesquisa Segura do MCSI.
        </span>
      </div>

      {/* Profile Cards */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <ShieldOff className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500 text-sm">Nenhum perfil encontrado para os critérios informados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => {
            const access = canAccess(p.sensitivityLevel);
            const cfg = LEVEL_CONFIG[p.sensitivityLevel];
            const Icon = cfg.icon;
            const isExpanded = expandedId === p.id;

            return (
              <div
                key={p.id}
                className={cn(
                  'bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300',
                  cfg.border
                )}
              >
                {/* Card Header */}
                <div className="flex items-center gap-4 p-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                    <Icon className={cn('w-5 h-5', cfg.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-slate-800">{p.internalCode}</span>
                      <LevelBadge level={p.sensitivityLevel} />
                      {p.specialCategory && (
                        <span className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs font-medium">
                          {SPECIAL_CATEGORY_LABEL[p.specialCategory] ?? p.specialCategory}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {access === 'MASKED'
                        ? p.beneficiaryName.charAt(0) + '. ' + p.beneficiaryName.split(' ').pop()
                        : access === 'FULL'
                        ? p.beneficiaryName
                        : '— Acesso Restrito —'}
                    </p>
                    {p.lastModifiedAt && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Última modificação: {formatDate(p.lastModifiedAt)} por {p.lastModifiedBy ?? '—'}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <RiskScore score={p.riskScore} />
                    <button
                      id={`mcsi-expand-${p.id}`}
                      onClick={() => handleView(p)}
                      className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
                    {/* Risk score bar */}
                    <div className="flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500 font-medium">Score de Risco IA:</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', p.riskScore >= 8 ? 'bg-red-500' : p.riskScore >= 5 ? 'bg-orange-400' : 'bg-emerald-500')}
                          style={{ width: `${p.riskScore * 10}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 tabular-nums">{p.riskScore.toFixed(1)} / 10</span>
                    </div>

                    {/* Notes */}
                    {p.notes && access === 'FULL' && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">{p.notes}</p>
                      </div>
                    )}

                    {/* Medidas Protetivas */}
                    {p.protectiveMeasures.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Gavel className="w-3.5 h-3.5" /> Medidas Protetivas
                        </h4>
                        {p.protectiveMeasures.map((m) => {
                          const days = m.expirationDate ? daysUntil(m.expirationDate) : null;
                          return (
                            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-3 mb-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-slate-800">{m.measureType}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{m.issuingAuthority}</p>
                                  <p className="text-xs text-slate-400 font-mono mt-0.5">Proc. {m.processNumber}</p>
                                  {access === 'FULL' && <p className="text-xs text-slate-600 mt-1">{m.restrictionsText}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <StatusBadge status={m.status} />
                                  {days !== null && (
                                    <span className={cn('text-xs font-semibold tabular-nums', days <= 7 ? 'text-red-600' : days <= 30 ? 'text-orange-500' : 'text-slate-500')}>
                                      {days > 0 ? `${days}d restantes` : 'Vencida'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Guardiões (menores) */}
                    {p.guardians.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Responsáveis / Guardiões
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {p.guardians.map((g) => (
                            <div
                              key={g.id}
                              className={cn(
                                'flex items-start gap-2 p-3 rounded-xl border',
                                g.isProhibited ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
                              )}
                            >
                              {g.isProhibited
                                ? <UserX className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                : <UserCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800">{g.fullName}</p>
                                <p className="text-xs text-slate-500">{g.relationshipType} · Guarda {g.custodyType}</p>
                                {g.isAuthorized && <p className="text-xs text-emerald-600 font-medium">✓ Autorizado</p>}
                                {g.isProhibited && <p className="text-xs text-red-600 font-medium">⊗ Proibido por Ordem Judicial</p>}
                                {g.courtOrderDetails && <p className="text-xs text-red-700 mt-0.5">{g.courtOrderDetails}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alterar Nível (admin only) */}
                    {user?.role === 'admin' && (
                      <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                        <TrendingUp className="w-4 h-4 text-violet-500" />
                        <span className="text-xs font-medium text-slate-600">Alterar Nível de Proteção:</span>
                        {editLevelId === p.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              id={`mcsi-level-edit-${p.id}`}
                              value={editLevelValue}
                              onChange={(e) => setEditLevelValue(Number(e.target.value) as SensitivityLevel)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                            >
                              {([0,1,2,3,4] as SensitivityLevel[]).map((l) => (
                                <option key={l} value={l}>N{l} — {LEVEL_CONFIG[l].label}</option>
                              ))}
                            </select>
                            <button
                              id={`mcsi-level-save-${p.id}`}
                              onClick={() => { updateProfileLevel(p.id, editLevelValue); setEditLevelId(null); }}
                              className="px-3 py-1 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                            >
                              Salvar
                            </button>
                            <button onClick={() => setEditLevelId(null)} className="px-3 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`mcsi-level-btn-${p.id}`}
                            onClick={() => { setEditLevelId(p.id); setEditLevelValue(p.sensitivityLevel); }}
                            className="px-3 py-1 text-xs border border-violet-200 text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                          >
                            Editar Nível
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vault Tab
// ---------------------------------------------------------------------------

function VaultTab() {
  const { profiles, canAccess, logAction } = useSecurity();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [justification, setJustification] = useState('');
  const [vaultOpen, setVaultOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'auth' | 'open'>('select');
  const [timer, setTimer] = useState(180);
  const [timerActive, setTimerActive] = useState(false);

  const vaultProfiles = profiles.filter((p) => {
    const a = canAccess(p.sensitivityLevel);
    return a !== 'BLOCKED' && p.sensitivityLevel >= 2;
  });

  const selected = vaultProfiles.find((p) => p.id === selectedId);

  React.useEffect(() => {
    if (!timerActive) return;
    if (timer <= 0) { setVaultOpen(false); setStep('select'); setTimerActive(false); return; }
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timer]);

  const handleOpenVault = () => {
    if (justification.length < 50) return;
    if (mfaCode.length < 6) return;
    setVaultOpen(true);
    setStep('open');
    setTimer(180);
    setTimerActive(true);
    if (selected) {
      logAction({
        userId: user?.email ?? '—',
        userName: user?.name ?? '—',
        action: 'VAULT_ACCESS',
        targetCode: selected.internalCode,
        description: `Cofre Digital acessado. Justificativa: ${justification.slice(0, 80)}...`,
        ipAddress: '—',
        device: navigator.userAgent.slice(0, 50),
        sensitivityLevel: selected.sensitivityLevel,
      });
    }
  };

  const handleClose = () => {
    setVaultOpen(false);
    setStep('select');
    setTimerActive(false);
    setMfaCode('');
    setJustification('');
    setSelectedId(null);
  };

  if (step === 'open' && selected) {
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    return (
      <div className="space-y-4">
        {/* Timer banner */}
        <div className={cn(
          'flex items-center gap-3 p-4 rounded-2xl border',
          timer <= 30 ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'
        )}>
          <Clock className={cn('w-5 h-5', timer <= 30 ? 'text-red-500' : 'text-emerald-500')} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Sessão do Cofre Ativa</p>
            <p className="text-xs text-slate-500">O acesso será revogado automaticamente ao término do temporizador.</p>
          </div>
          <span className={cn('text-2xl font-bold tabular-nums font-mono', timer <= 30 ? 'text-red-600' : 'text-emerald-600')}>
            {mins}:{String(secs).padStart(2, '0')}
          </span>
          <button id="mcsi-vault-close" onClick={handleClose} className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Fechar Cofre
          </button>
        </div>

        {/* Vault Data */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <BookLock className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-slate-800">Cofre Digital — {selected.internalCode}</h3>
            <span className="ml-auto text-xs font-mono bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200">AES-256-GCM</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'CPF', value: '345.678.901-23', icon: Fingerprint },
              { label: 'Telefone Principal', value: '(11) 98765-4321', icon: Activity },
              { label: 'Endereço', value: 'Rua das Flores, 123 — São Paulo / SP', icon: Database },
              { label: 'Local de Trabalho', value: '[OCULTO — Nível Máximo de Proteção]', icon: Database },
              { label: 'Contato de Emergência', value: 'Antônia Silva — (11) 94321-9876', icon: Users },
            ].map((field) => (
              <div key={field.label} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <field.icon className="w-3 h-3 text-red-400" />
                  <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">{field.label}</span>
                </div>
                <p className="text-sm font-medium text-slate-800">{field.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              Acesso registrado em auditoria permanente. Hash da sessão: <span className="font-mono text-slate-700">{Math.random().toString(16).slice(2, 14)}...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
        <BookLock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800">Cofre Digital — Dados Altamente Sensíveis</p>
          <p className="text-xs text-red-700 mt-1">
            Os dados neste cofre são criptografados com AES-256-GCM. O acesso exige autenticação multifator e justificativa formal.
            Toda sessão é registrada em auditoria imutável com assinatura digital.
          </p>
        </div>
      </div>

      {step === 'select' && (
        <>
          <div className="space-y-2">
            {vaultProfiles.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <BookLock className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                <p className="text-slate-500 text-sm">Nenhum perfil disponível para acesso ao cofre com suas permissões.</p>
              </div>
            ) : (
              vaultProfiles.map((p) => (
                <button
                  id={`mcsi-vault-select-${p.id}`}
                  key={p.id}
                  onClick={() => { setSelectedId(p.id); setStep('auth'); }}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 bg-white rounded-2xl border text-left hover:border-teal-300 hover:shadow-md transition-all duration-200',
                    selectedId === p.id ? 'border-teal-400 shadow-md' : 'border-slate-200 shadow-sm'
                  )}
                >
                  <BookLock className="w-5 h-5 text-red-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{p.internalCode}</p>
                    <p className="text-xs text-slate-500">{p.beneficiaryName}</p>
                  </div>
                  <LevelBadge level={p.sensitivityLevel} />
                </button>
              ))
            )}
          </div>
        </>
      )}

      {step === 'auth' && selected && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-teal-500" />
            <h3 className="font-semibold text-slate-800">Autenticação para Acesso ao Cofre</h3>
          </div>
          <p className="text-sm text-slate-500">
            Acessando cofre de: <span className="font-semibold font-mono text-slate-800">{selected.internalCode}</span> — <LevelBadge level={selected.sensitivityLevel} />
          </p>

          <div>
            <label htmlFor="mcsi-vault-justification" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Justificativa Formal <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal ml-1">(mín. 50 caracteres)</span>
            </label>
            <textarea
              id="mcsi-vault-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              placeholder="Descreva a finalidade clínica ou institucional do acesso a este dado..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{justification.length} / 50 mín.</p>
          </div>

          <div>
            <label htmlFor="mcsi-vault-mfa" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Código MFA (Authenticator) <span className="text-red-500">*</span>
            </label>
            <input
              id="mcsi-vault-mfa"
              type="text"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-36 px-3 py-2 text-sm font-mono text-center border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
            <p className="text-xs text-slate-400 mt-1">Use qualquer código de 6 dígitos nesta demonstração.</p>
          </div>

          <div className="flex gap-3">
            <button
              id="mcsi-vault-cancel"
              onClick={() => setStep('select')}
              className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="mcsi-vault-open"
              onClick={handleOpenVault}
              disabled={justification.length < 50 || mfaCode.length < 6}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Abrir Cofre com MFA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Access Requests Tab
// ---------------------------------------------------------------------------

function AccessTab() {
  const { accessRequests, approveRequest, denyRequest } = useSecurity();
  const { user } = useAuth();
  const [justification, setJustification] = useState('');
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState(60);
  const [targetCode, setTargetCode] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { requestBreakGlass } = useSecurity();
  const { profiles } = useSecurity();

  const handleSubmit = () => {
    const profile = profiles.find((p) => p.internalCode === targetCode);
    if (!profile || justification.length < 100) return;
    requestBreakGlass({
      protectedProfileId: profile.id,
      internalCode: profile.internalCode,
      beneficiaryName: profile.internalCode,
      requesterId: user?.email ?? '—',
      requesterName: user?.name ?? '—',
      justification,
      purpose,
      durationMinutes: duration,
    });
    setShowForm(false);
    setJustification('');
    setPurpose('');
    setTargetCode('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Solicitações de Acesso Excepcional</h3>
        <button
          id="mcsi-access-new"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Nova Solicitação
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Key className="w-5 h-5 text-teal-500" />
            <h4 className="font-semibold text-slate-800">Fluxo de Acesso Excepcional (Break-Glass)</h4>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Este acesso ficará registrado em auditoria permanente e imutável. Um alerta de alta prioridade será enviado ao DPO e ao Coordenador do Projeto.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mcsi-bg-code" className="block text-xs font-semibold text-slate-600 mb-1.5">Código ISM do Beneficiário *</label>
              <input
                id="mcsi-bg-code"
                type="text"
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value.toUpperCase())}
                placeholder="ISM-0000000000"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
            </div>
            <div>
              <label htmlFor="mcsi-bg-purpose" className="block text-xs font-semibold text-slate-600 mb-1.5">Finalidade do Acesso *</label>
              <input
                id="mcsi-bg-purpose"
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ex: Interconsulta de urgência"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="mcsi-bg-justification" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Justificativa Clínica / Institucional *
              <span className="text-slate-400 font-normal ml-1">(mín. 100 caracteres)</span>
            </label>
            <textarea
              id="mcsi-bg-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              placeholder="Descreva detalhadamente o motivo do acesso excepcional, o contexto clínico ou institucional e a urgência da situação..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
            <p className={cn('text-xs mt-1 text-right', justification.length >= 100 ? 'text-emerald-600' : 'text-slate-400')}>
              {justification.length} / 100 mín.
            </p>
          </div>

          <div>
            <label htmlFor="mcsi-bg-duration" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Tempo de Acesso Necessário: <span className="text-teal-600">{duration} minutos</span>
            </label>
            <input
              id="mcsi-bg-duration"
              type="range"
              min={15}
              max={120}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>15 min</span><span>30 min</span><span>45 min</span><span>60 min</span><span>90 min</span><span>120 min</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              id="mcsi-bg-cancel"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="mcsi-bg-submit"
              onClick={handleSubmit}
              disabled={justification.length < 100 || !purpose || !targetCode}
              className="px-4 py-2 text-sm bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Enviar Solicitação
            </button>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-3">
        {accessRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <Key className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="text-slate-500 text-sm">Nenhuma solicitação de acesso registrada.</p>
          </div>
        ) : (
          accessRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{req.requesterName}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{req.internalCode}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDate(req.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500">{req.durationMinutes}min</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Finalidade</p>
                  <p className="text-sm text-slate-700">{req.purpose}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Justificativa</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{req.justification}</p>
                </div>
              </div>

              {req.authorizedBy && (
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Autorizado por: {req.authorizedBy}
                </p>
              )}

              {req.status === 'PENDING' && user?.role === 'admin' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    id={`mcsi-req-approve-${req.id}`}
                    onClick={() => approveRequest(req.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Aprovar
                  </button>
                  <button
                    id={`mcsi-req-deny-${req.id}`}
                    onClick={() => denyRequest(req.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs border border-red-200 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Negar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit Tab
// ---------------------------------------------------------------------------

function AuditTab() {
  const { auditLog } = useSecurity();
  const [filter, setFilter] = useState('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ALL') return auditLog;
    return auditLog.filter((l) => l.action === filter);
  }, [auditLog, filter]);

  const actionColor: Record<string, string> = {
    VIEW: 'bg-blue-100 text-blue-700',
    EDIT: 'bg-violet-100 text-violet-700',
    EXPORT: 'bg-teal-100 text-teal-700',
    PRINT: 'bg-teal-100 text-teal-700',
    DENIED: 'bg-red-100 text-red-700',
    BREAK_GLASS: 'bg-orange-100 text-orange-700',
    LEVEL_CHANGE: 'bg-purple-100 text-purple-700',
    VAULT_ACCESS: 'bg-red-100 text-red-700',
    EXPORT_ANON: 'bg-emerald-100 text-emerald-700',
    SEARCH: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {['ALL', 'DENIED', 'BREAK_GLASS', 'LEVEL_CHANGE', 'VAULT_ACCESS', 'VIEW'].map((a) => (
            <button
              key={a}
              id={`mcsi-audit-filter-${a}`}
              onClick={() => setFilter(a)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
                filter === a ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {a === 'ALL' ? 'Todas' : ACTION_LABEL[a] ?? a}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-semibold text-slate-700">Trilha de Auditoria Imutável</span>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} registros</span>
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">Nenhum registro encontrado.</div>
          ) : (
            filtered.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-slate-50/50 transition-colors">
                <span className={cn('px-2 py-0.5 rounded-lg text-xs font-semibold shrink-0 mt-0.5', actionColor[log.action] ?? 'bg-slate-100 text-slate-600')}>
                  {ACTION_LABEL[log.action] ?? log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800">{log.userName}</span>
                    {log.targetCode && (
                      <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{log.targetCode}</span>
                    )}
                    {log.sensitivityLevel !== undefined && <LevelBadge level={log.sensitivityLevel} />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{log.description}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400">{formatDate(log.timestamp)}</span>
                    <span className="text-xs text-slate-400 font-mono">IP: {log.ipAddress}</span>
                    <span className="text-xs text-slate-400">{log.device}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs font-mono text-slate-300 block">{log.logHash}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alerts Tab
// ---------------------------------------------------------------------------

function AlertsTab() {
  const { behaviorAlerts, resolveAlert, markAlertFalsePositive } = useSecurity();
  const [filter, setFilter] = useState('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ALL') return behaviorAlerts;
    if (filter === 'NEW_HIGH') return behaviorAlerts.filter((a) => a.status === 'NEW' && (a.severity === 'HIGH' || a.severity === 'CRITICAL'));
    return behaviorAlerts.filter((a) => a.status === filter);
  }, [behaviorAlerts, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit overflow-x-auto">
        {['ALL', 'NEW_HIGH', 'NEW', 'INVESTIGATING', 'RESOLVED'].map((f) => (
          <button
            key={f}
            id={`mcsi-alert-filter-${f}`}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
              filter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {f === 'ALL' ? 'Todos' : f === 'NEW_HIGH' ? 'Alta Prioridade' : f === 'NEW' ? 'Novos' : f === 'INVESTIGATING' ? 'Em Análise' : 'Resolvidos'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
            <p className="text-slate-500 text-sm">Nenhum alerta encontrado para este filtro.</p>
          </div>
        ) : (
          filtered.map((alert) => {
            const sev = ALERT_SEVERITY_CONFIG[alert.severity];
            return (
              <div key={alert.id} className={cn('bg-white rounded-2xl border shadow-sm p-5', sev.border)}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', sev.bg)}>
                      <Siren className={cn('w-4 h-4', sev.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {ALERT_TYPE_LABEL[alert.alertType] ?? alert.alertType}
                        </span>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold', sev.bg, sev.color, 'border', sev.border)}>
                          {sev.label}
                        </span>
                        <StatusBadge status={alert.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{alert.userName}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{formatDate(alert.detectedAt)}</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{alert.description}</p>

                {alert.resolvedBy && (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Resolvido por: {alert.resolvedBy} {alert.resolvedAt && `em ${formatDate(alert.resolvedAt)}`}
                  </p>
                )}

                {(alert.status === 'NEW' || alert.status === 'INVESTIGATING') && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      id={`mcsi-alert-resolve-${alert.id}`}
                      onClick={() => resolveAlert(alert.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Marcar Resolvido
                    </button>
                    <button
                      id={`mcsi-alert-fp-${alert.id}`}
                      onClick={() => markAlertFalsePositive(alert.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Falso Positivo
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anonymize Tab
// ---------------------------------------------------------------------------

function AnonymizeTab() {
  const { profiles } = useSecurity();
  const { logAction } = useSecurity();
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<SensitivityLevel>(2);
  const [purpose, setPurpose] = useState('');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const count = profiles.filter((p) => p.sensitivityLevel >= selectedLevel).length;

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    setGenerating(false);
    setDone(true);
    logAction({
      userId: user?.email ?? '—',
      userName: user?.name ?? '—',
      action: 'EXPORT_ANON',
      description: `Relatório anonimizado gerado. Nível ≥${selectedLevel}. Finalidade: ${purpose}. ${count} registros.`,
      ipAddress: '—',
      device: navigator.userAgent.slice(0, 50),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ScanLine className="w-5 h-5 text-teal-500" />
          <h3 className="font-semibold text-slate-800">Gerador de Relatórios Anonimizados</h3>
        </div>

        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-5">
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Conformidade LGPD</p>
            <p className="text-xs text-emerald-700 mt-1">
              Os dados exportados são completamente desidentificados. Nome, CPF, Endereço, Telefone, Documentos e
              quaisquer dados identificáveis são removidos automaticamente. O resultado pode ser usado para
              pesquisas, relatórios de impacto social e convênios sem exposição de dados pessoais.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label htmlFor="mcsi-anon-level" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Incluir beneficiários com nível ≥
            </label>
            <select
              id="mcsi-anon-level"
              value={selectedLevel}
              onChange={(e) => { setSelectedLevel(Number(e.target.value) as SensitivityLevel); setDone(false); }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            >
              {([0,1,2,3,4] as SensitivityLevel[]).map((l) => (
                <option key={l} value={l}>N{l} — {LEVEL_CONFIG[l].label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">{count} registros correspondem ao filtro.</p>
          </div>
          <div>
            <label htmlFor="mcsi-anon-purpose" className="block text-xs font-semibold text-slate-600 mb-1.5">Finalidade do Relatório *</label>
            <input
              id="mcsi-anon-purpose"
              type="text"
              value={purpose}
              onChange={(e) => { setPurpose(e.target.value); setDone(false); }}
              placeholder="Ex: Relatório de Impacto Social 2026"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
        </div>

        {/* Dados que serão removidos */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-600 mb-2">Campos removidos automaticamente:</p>
          <div className="flex flex-wrap gap-2">
            {['Nome Completo','CPF','Endereço','Telefone','E-mail','Fotografia','Documentos','Dados Familiares','Local de Trabalho','Endereços Alternativos'].map((f) => (
              <span key={f} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                <X className="w-3 h-3" /> {f}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            id="mcsi-anon-generate"
            onClick={handleGenerate}
            disabled={!purpose || generating}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Gerando...' : 'Gerar Relatório Anonimizado'}
          </button>
        </div>

        {done && (
          <div className="mt-4 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-300 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Relatório gerado com sucesso!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {count} registros anonimizados. O download seria iniciado automaticamente em produção.
                Esta operação foi registrada em auditoria permanente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <FileSearch className="w-4 h-4 text-teal-500" />
          Prévia do Formato Anonimizado
        </h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['ID Interno','Nível','Categoria','Medidas Ativas','Criado em','Risco (Score)','Nome','CPF','Endereço'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 font-mono text-slate-700">ISM-0000001092</td>
                <td className="px-3 py-2">3</td>
                <td className="px-3 py-2 text-slate-500">VIT_DOM</td>
                <td className="px-3 py-2">1</td>
                <td className="px-3 py-2 text-slate-500">2025-03-12</td>
                <td className="px-3 py-2 font-semibold text-red-600">8.7</td>
                <td className="px-3 py-2 line-through text-slate-300">[REMOVIDO]</td>
                <td className="px-3 py-2 line-through text-slate-300">[REMOVIDO]</td>
                <td className="px-3 py-2 line-through text-slate-300">[REMOVIDO]</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 font-mono text-slate-700">ISM-0000002458</td>
                <td className="px-3 py-2">2</td>
                <td className="px-3 py-2 text-slate-500">MENOR_ECA</td>
                <td className="px-3 py-2">0</td>
                <td className="px-3 py-2 text-slate-500">2025-01-20</td>
                <td className="px-3 py-2 font-semibold text-orange-500">5.2</td>
                <td className="px-3 py-2 line-through text-slate-300">[REMOVIDO]</td>
                <td className="px-3 py-2 line-through text-slate-300">[REMOVIDO]</td>
                <td className="px-3 py-2 line-through text-slate-300">[REMOVIDO]</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main MCSI Page
// ---------------------------------------------------------------------------

export function MCSI() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { behaviorAlerts, accessRequests } = useSecurity();

  const newAlerts = behaviorAlerts.filter((a) => a.status === 'NEW').length;
  const pendingReqs = accessRequests.filter((r) => r.status === 'PENDING').length;

  const badges: Partial<Record<Tab, number>> = {
    alerts: newAlerts,
    access: pendingReqs,
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':  return <DashboardTab />;
      case 'profiles':   return <ProfilesTab />;
      case 'vault':      return <VaultTab />;
      case 'access':     return <AccessTab />;
      case 'audit':      return <AuditTab />;
      case 'alerts':     return <AlertsTab />;
      case 'anonymize':  return <AnonymizeTab />;
      default:           return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">MCSI — Segurança Institucional</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Módulo Complementar de Segurança · Camada Transversal · Zero Trust · LGPD
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">Motor de Segurança Ativo</span>
            </div>
            {newAlerts > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl">
                <Bell className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-700">{newAlerts} alerta{newAlerts > 1 ? 's' : ''} ativo{newAlerts > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const badge = badges[tab.id];
            return (
              <button
                key={tab.id}
                id={`mcsi-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0',
                  activeTab === tab.id
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )}
              >
                <Icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-teal-600' : 'text-slate-400')} />
                {tab.label}
                {badge ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </header>

      {/* Tab Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {renderTab()}
      </main>
    </div>
  );
}
