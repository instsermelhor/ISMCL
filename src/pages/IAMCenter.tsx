import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Users,
  Activity,
  Bot,
  Smartphone,
  Key,
  Search,
  Plus,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Edit3,
  MoreVertical,
  Filter,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  LogOut,
  TrendingUp,
  AlertOctagon,
  ShieldCheck,
  Layers,
  ChevronRight,
  Info,
  Trash2,
  UserPlus,
  Award,
} from 'lucide-react';
import { useIAM } from '../contexts/IAMContext';
import type { IAMUser, InstitutionalRole, AuditEventType } from '../types/iam';
import { ROLE_LABELS, ROLE_COLORS } from '../types/iam';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function RoleBadge({ role }: { role: InstitutionalRole }) {
  const colors = ROLE_COLORS[role];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: IAMUser['status'] }) {
  const map = {
    active:    { label: 'Ativo',     bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    inactive:  { label: 'Inativo',   bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400' },
    suspended: { label: 'Suspenso',  bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
    blocked:   { label: 'Bloqueado', bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
    pending:   { label: 'Pendente',  bg: 'bg-sky-100',     text: 'text-sky-700',     dot: 'bg-sky-500' },
  };
  const s = map[status] ?? map.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: 'info' | 'warning' | 'critical' | 'low' | 'medium' | 'high' }) {
  const map = {
    info:     { label: 'Info',     bg: 'bg-sky-100',    text: 'text-sky-700' },
    low:      { label: 'Baixo',    bg: 'bg-slate-100',  text: 'text-slate-600' },
    warning:  { label: 'Alerta',   bg: 'bg-amber-100',  text: 'text-amber-700' },
    medium:   { label: 'Médio',    bg: 'bg-amber-100',  text: 'text-amber-700' },
    high:     { label: 'Alto',     bg: 'bg-orange-100', text: 'text-orange-700' },
    critical: { label: 'Crítico',  bg: 'bg-red-100',    text: 'text-red-700' },
  };
  const s = map[severity] ?? map.info;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  login_success: 'Login realizado',
  login_failure: 'Tentativa de login falhou',
  logout: 'Logout',
  mfa_success: 'MFA verificado',
  mfa_failure: 'MFA falhou',
  password_change: 'Senha alterada',
  password_reset: 'Reset de senha',
  profile_change: 'Perfil alterado',
  permission_change: 'Permissões alteradas',
  role_added: 'Papel adicionado',
  role_removed: 'Papel removido',
  user_created: 'Usuário criado',
  user_blocked: 'Usuário bloqueado',
  user_suspended: 'Usuário suspenso',
  user_reactivated: 'Usuário reativado',
  device_trusted: 'Dispositivo confiável adicionado',
  device_revoked: 'Dispositivo revogado',
  session_revoked: 'Sessão revogada',
  exceptional_access: 'Acesso excepcional',
  delegation_created: 'Delegação criada',
  delegation_revoked: 'Delegação revogada',
  module_accessed: 'Módulo acessado',
  data_exported: 'Dados exportados',
  data_imported: 'Dados importados',
  config_changed: 'Configuração alterada',
  ai_suggestion_approved: 'Sugestão IA aprovada',
  ai_suggestion_rejected: 'Sugestão IA rejeitada',
};

// ----------------------------------------------------------------
// Modais
// ----------------------------------------------------------------

function UserDetailModal({
  user,
  onClose,
  onBlock,
  onSuspend,
  onReactivate,
  onResetPassword,
}: {
  user: IAMUser;
  onClose: () => void;
  onBlock: (id: string, reason: string) => void;
  onSuspend: (id: string, reason: string) => void;
  onReactivate: (id: string) => void;
  onResetPassword: (id: string) => void;
}) {
  const [actionReason, setActionReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState<'block' | 'suspend' | null>(null);

  const handleAction = (type: 'block' | 'suspend') => {
    if (!actionReason.trim()) return;
    if (type === 'block') onBlock(user.id, actionReason);
    if (type === 'suspend') onSuspend(user.id, actionReason);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl">
              {user.initials}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {user.roles.map(r => <RoleBadge key={r} role={r} />)}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Info */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Status', value: <StatusBadge status={user.status} /> },
              { label: 'MFA', value: user.mfaEnabled ? <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium"><CheckCircle2 className="w-4 h-4" />{user.mfaMethod?.toUpperCase()}</span> : <span className="text-slate-400 text-sm">Não configurado</span> },
              { label: 'Último Acesso', value: <span className="text-sm text-slate-700">{user.lastLogin ? formatDate(user.lastLogin) : '—'}</span> },
              { label: 'Último IP', value: <span className="text-sm font-mono text-slate-700">{user.lastLoginIp ?? '—'}</span> },
              { label: 'Dispositivo', value: <span className="text-sm text-slate-700">{user.lastLoginDevice ?? '—'}</span> },
              { label: 'Timeout Sessão', value: <span className="text-sm text-slate-700">{user.sessionTimeout ? `${user.sessionTimeout} min` : '—'}</span> },
              { label: 'Criado em', value: <span className="text-sm text-slate-700">{formatDateShort(user.createdAt)}</span> },
              { label: 'Unidade', value: <span className="text-sm text-slate-700">{user.unit ?? '—'}</span> },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                <div>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Dados Profissionais */}
          {(user.specialty || user.crp || user.crm || user.cress) && (
            <div className="bg-teal-50 rounded-2xl p-4">
              <p className="text-sm font-semibold text-teal-800 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" /> Registro Profissional
              </p>
              <div className="grid grid-cols-2 gap-3">
                {user.specialty && <div><p className="text-xs text-teal-600">Especialidade</p><p className="text-sm text-teal-900 font-medium">{user.specialty}</p></div>}
                {user.crp && <div><p className="text-xs text-teal-600">CRP</p><p className="text-sm text-teal-900 font-medium">{user.crp}</p></div>}
                {user.crm && <div><p className="text-xs text-teal-600">CRM</p><p className="text-sm text-teal-900 font-medium">{user.crm}</p></div>}
                {user.cress && <div><p className="text-xs text-teal-600">CRESS</p><p className="text-sm text-teal-900 font-medium">{user.cress}</p></div>}
              </div>
            </div>
          )}

          {/* Dados Voluntariado */}
          {user.volunteerData && (
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Dados de Voluntariado
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{user.volunteerData.totalHours ?? 0}</p>
                  <p className="text-xs text-slate-500">Horas Totais</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{user.volunteerData.hoursPerWeek ?? 0}</p>
                  <p className="text-xs text-slate-500">Horas/Semana</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{user.volunteerData.certificates?.length ?? 0}</p>
                  <p className="text-xs text-slate-500">Certificados</p>
                </div>
              </div>
            </div>
          )}

          {/* Permissões (resumo) */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Permissões ({user.permissions.length})
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 max-h-40 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.slice(0, 30).map(p => (
                  <span key={p.id} className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs text-slate-600 font-mono">
                    {p.module}:{p.action}
                  </span>
                ))}
                {user.permissions.length > 30 && (
                  <span className="text-xs text-slate-400">+{user.permissions.length - 30} mais</span>
                )}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Ações de Gestão</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onResetPassword(user.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <Key className="w-4 h-4" /> Resetar Senha
              </button>
              {user.status === 'active' ? (
                <>
                  <button
                    onClick={() => setShowReasonInput('suspend')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                    <Lock className="w-4 h-4" /> Suspender
                  </button>
                  <button
                    onClick={() => setShowReasonInput('block')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    <UserX className="w-4 h-4" /> Bloquear
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { onReactivate(user.id); onClose(); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  <Unlock className="w-4 h-4" /> Reativar
                </button>
              )}
            </div>

            <AnimatePresence>
              {showReasonInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className={`rounded-xl border p-3 ${showReasonInput === 'block' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <p className={`text-xs font-medium mb-2 ${showReasonInput === 'block' ? 'text-red-700' : 'text-amber-700'}`}>
                      Motivo obrigatório:
                    </p>
                    <textarea
                      value={actionReason}
                      onChange={e => setActionReason(e.target.value)}
                      placeholder="Descreva o motivo..."
                      className="w-full rounded-lg border border-slate-200 p-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAction(showReasonInput)}
                        disabled={!actionReason.trim()}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${showReasonInput === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => { setShowReasonInput(null); setActionReason(''); }}
                        className="flex-1 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ----------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------

type Tab = 'users' | 'audit' | 'ai' | 'sessions' | 'devices' | 'permissions';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
  { id: 'users',       label: 'Usuários',        icon: Users },
  { id: 'audit',       label: 'Auditoria',        icon: Activity },
  { id: 'ai',          label: 'Inteligência IA',  icon: Bot },
  { id: 'sessions',    label: 'Sessões Ativas',   icon: LogOut },
  { id: 'devices',     label: 'Dispositivos',     icon: Smartphone },
  { id: 'permissions', label: 'Matriz de Permissões', icon: Layers },
];

// ----------------------------------------------------------------
// Tela Principal IAM
// ----------------------------------------------------------------

export function IAMCenter() {
  const {
    users,
    auditLogs,
    aiSuggestions,
    activeSessions,
    trustedDevices,
    currentUser,
    blockUser,
    suspendUser,
    reactivateUser,
    resetPassword,
    revokeSession,
    revokeDevice,
    approveAISuggestion,
    rejectAISuggestion,
  } = useIAM();

  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<IAMUser | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [aiReviewId, setAiReviewId] = useState<string | null>(null);
  const [aiReviewNotes, setAiReviewNotes] = useState('');

  const isSuperAdmin = currentUser?.roles.includes('super_admin');
  const isAuditor = currentUser?.roles.includes('auditor');
  const canManage = isSuperAdmin;

  // Métricas
  const metrics = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    blocked: users.filter(u => u.status === 'blocked' || u.status === 'suspended').length,
    mfaEnabled: users.filter(u => u.mfaEnabled).length,
    pendingAI: aiSuggestions.filter(s => s.status === 'pending').length,
    criticalLogs: auditLogs.filter(l => l.severity === 'critical').length,
  }), [users, aiSuggestions, auditLogs]);

  // Filtro de usuários
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        !searchQuery ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
      const matchesRole = filterRole === 'all' || u.roles.includes(filterRole as InstitutionalRole);
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchQuery, filterStatus, filterRole]);

  const pendingAI = aiSuggestions.filter(s => s.status === 'pending');

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Central de Identidade Institucional</h1>
                <p className="text-sm text-slate-500">IAM — Identity & Access Management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {metrics.pendingAI > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200">
                <Bot className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">{metrics.pendingAI} alertas IA</span>
              </div>
            )}
            {metrics.criticalLogs > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 border border-red-200">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">{metrics.criticalLogs} eventos críticos</span>
              </div>
            )}
            {canManage && (
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors">
                <UserPlus className="w-4 h-4" />
                Novo Usuário
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="px-8 py-4 bg-white border-b border-slate-100 shrink-0">
        <div className="grid grid-cols-6 gap-4">
          {[
            { label: 'Total de Usuários', value: metrics.total, icon: Users, color: 'text-slate-700', bg: 'bg-slate-100' },
            { label: 'Usuários Ativos', value: metrics.active, icon: UserCheck, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Bloqueados/Suspensos', value: metrics.blocked, icon: UserX, color: 'text-red-700', bg: 'bg-red-50' },
            { label: 'Com MFA Ativo', value: metrics.mfaEnabled, icon: Key, color: 'text-teal-700', bg: 'bg-teal-50' },
            { label: 'Alertas IA Pendentes', value: metrics.pendingAI, icon: Bot, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Eventos Críticos (24h)', value: metrics.criticalLogs, icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50' },
          ].map(m => (
            <div key={m.label} className={`rounded-2xl p-4 ${m.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-8 shrink-0">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap
                border-b-2 transition-all duration-200
                ${activeTab === tab.id
                  ? 'border-teal-500 text-teal-700 bg-teal-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'ai' && metrics.pendingAI > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                  {metrics.pendingAI}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {/* ===== TAB USUÁRIOS ===== */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Filtros */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white text-slate-700"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="blocked">Bloqueado</option>
                  <option value="inactive">Inativo</option>
                </select>
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white text-slate-700"
                >
                  <option value="all">Todos os perfis</option>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              </div>

              {/* Tabela de Usuários */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuário</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Perfis</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">MFA</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Último Acesso</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(u => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser(u)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm shrink-0">
                              {u.initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.slice(0, 2).map(r => <RoleBadge key={r} role={r} />)}
                            {u.roles.length > 2 && (
                              <span className="text-xs text-slate-400">+{u.roles.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-6 py-4">
                          {u.mfaEnabled ? (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-medium">{u.mfaMethod?.toUpperCase()}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs">Não configurado</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-600">{u.lastLogin ? formatDate(u.lastLogin) : '—'}</p>
                          {u.lastLoginIp && <p className="text-xs text-slate-400 font-mono">{u.lastLoginIp}</p>}
                        </td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                              title="Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canManage && (
                              <button
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                title="Mais ações"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">Nenhum usuário encontrado</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ===== TAB AUDITORIA ===== */}
          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Log de Auditoria</h2>
                  <p className="text-sm text-slate-500">Registros imutáveis de todas as atividades</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white">
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>

              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div
                    key={log.id}
                    className={`bg-white rounded-2xl border p-4 transition-all
                      ${log.severity === 'critical' ? 'border-red-200 bg-red-50/30' :
                        log.severity === 'warning' ? 'border-amber-100' : 'border-slate-100'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                          ${log.severity === 'critical' ? 'bg-red-100' :
                            log.severity === 'warning' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                          <Activity className={`w-4 h-4
                            ${log.severity === 'critical' ? 'text-red-600' :
                              log.severity === 'warning' ? 'text-amber-600' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-900">
                              {AUDIT_EVENT_LABELS[log.eventType] ?? log.eventType}
                            </p>
                            <SeverityBadge severity={log.severity} />
                            {log.module && (
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                                {log.module}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            <span className="font-medium">{log.userName}</span>
                            {' · '}<RoleBadge role={log.userRole} />
                            {' · IP: '}<span className="font-mono">{log.ipAddress}</span>
                          </p>
                          {Object.keys(log.details).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(log.details).slice(0, 3).map(([k, v]) => (
                                <span key={k} className="text-xs text-slate-400">
                                  <span className="font-medium">{k}:</span> {String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-400">{formatDate(log.timestamp)}</p>
                        {log.hash && (
                          <p className="text-xs font-mono text-slate-300 mt-0.5" title="Hash de integridade">
                            #{log.hash.slice(0, 8)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== TAB IA ===== */}
          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Inteligência Artificial de Segurança</h2>
                <p className="text-sm text-slate-500">
                  Sugestões automáticas de revisão de acessos. Toda ação requer aprovação humana.
                </p>
              </div>

              {/* Banner informativo */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">IA de Governança de Identidades</p>
                  <p className="text-xs text-slate-400">
                    A IA analisa padrões de acesso e sugere ações preventivas. Ela <strong className="text-white">nunca</strong> altera permissões automaticamente.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {aiSuggestions.map(sug => (
                  <div
                    key={sug.id}
                    className={`bg-white rounded-2xl border p-5 transition-all
                      ${sug.severity === 'critical' || sug.severity === 'high' ? 'border-red-200' :
                        sug.severity === 'medium' ? 'border-amber-200' : 'border-slate-100'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <SeverityBadge severity={sug.severity} />
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {sug.type.replace(/_/g, ' ')}
                          </span>
                          {sug.status !== 'pending' && (
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium
                              ${sug.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                sug.status === 'rejected' ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                              {sug.status === 'approved' ? 'Aprovado' :
                               sug.status === 'rejected' ? 'Rejeitado' : 'Descartado'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 mb-1">
                          Usuário: <span className="text-teal-700">{sug.userName}</span>
                        </p>
                        <p className="text-sm text-slate-600 mb-2">{sug.description}</p>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Ação sugerida:</p>
                          <p className="text-sm text-slate-700">{sug.suggestedAction}</p>
                        </div>
                        {sug.reviewNotes && (
                          <div className="mt-2 text-xs text-slate-400">
                            <span className="font-medium">Observações:</span> {sug.reviewNotes}
                            {sug.reviewedBy && ` — ${sug.reviewedBy}`}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-slate-400">{formatDate(sug.detectedAt)}</p>
                      </div>
                    </div>

                    {sug.status === 'pending' && canManage && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        {aiReviewId === sug.id ? (
                          <div>
                            <textarea
                              value={aiReviewNotes}
                              onChange={e => setAiReviewNotes(e.target.value)}
                              placeholder="Observações (opcional)..."
                              className="w-full rounded-xl border border-slate-200 p-3 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-teal-500/30 mb-3"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => { approveAISuggestion(sug.id, aiReviewNotes); setAiReviewId(null); setAiReviewNotes(''); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Aprovar Ação
                              </button>
                              <button
                                onClick={() => { rejectAISuggestion(sug.id, aiReviewNotes); setAiReviewId(null); setAiReviewNotes(''); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                              >
                                <XCircle className="w-4 h-4" /> Rejeitar
                              </button>
                              <button
                                onClick={() => { setAiReviewId(null); setAiReviewNotes(''); }}
                                className="px-4 py-2 rounded-xl text-slate-400 text-sm hover:bg-slate-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAiReviewId(sug.id)}
                            className="flex items-center gap-2 text-sm text-teal-600 font-medium hover:text-teal-700"
                          >
                            <ChevronRight className="w-4 h-4" /> Revisar sugestão
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {aiSuggestions.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhuma sugestão pendente</p>
                    <p className="text-sm">A IA está monitorando continuamente</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== TAB SESSÕES ===== */}
          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Sessões Ativas</h2>
                <p className="text-sm text-slate-500">Controle de sessões em tempo real</p>
              </div>

              <div className="space-y-3">
                {activeSessions.filter(s => s.status === 'active').map(sess => {
                  const sessionUser = users.find(u => u.id === sess.userId);
                  return (
                    <div key={sess.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                            {sessionUser?.initials ?? '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{sessionUser?.name ?? sess.userId}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-slate-400 font-mono">{sess.ipAddress}</span>
                              <span className="text-xs text-slate-400">{sess.deviceName}</span>
                              {sess.mfaVerified && (
                                <span className="flex items-center gap-1 text-xs text-emerald-600">
                                  <ShieldCheck className="w-3 h-3" /> MFA verificado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="text-xs text-slate-400">Início: {formatDate(sess.createdAt)}</p>
                            <p className="text-xs text-slate-400">Última atividade: {formatDate(sess.lastActivity)}</p>
                          </div>
                          {canManage && sess.userId !== currentUser?.id && (
                            <button
                              onClick={() => revokeSession(sess.id)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                            >
                              <LogOut className="w-3.5 h-3.5" /> Revogar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activeSessions.filter(s => s.status === 'active').length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <LogOut className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhuma sessão ativa</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== TAB DISPOSITIVOS ===== */}
          {activeTab === 'devices' && (
            <motion.div
              key="devices"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Dispositivos Confiáveis</h2>
                <p className="text-sm text-slate-500">Gerenciamento de dispositivos autorizados</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {trustedDevices.map(dev => {
                  const devUser = users.find(u => u.id === dev.userId);
                  return (
                    <div
                      key={dev.id}
                      className={`bg-white rounded-2xl border p-5 ${dev.status === 'revoked' ? 'opacity-50 border-slate-100' : 'border-slate-200'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{dev.name}</p>
                            <p className="text-xs text-slate-400">{devUser?.name ?? dev.userId}</p>
                          </div>
                        </div>
                        {dev.status === 'trusted' ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confiável
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> Revogado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>{dev.browser} · {dev.os}</p>
                        <p>Adicionado: {formatDateShort(dev.addedAt)}</p>
                        <p>Último uso: {formatDateShort(dev.lastSeen)}</p>
                      </div>
                      {dev.status === 'trusted' && canManage && (
                        <button
                          onClick={() => revokeDevice(dev.id)}
                          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Revogar dispositivo
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ===== TAB PERMISSÕES ===== */}
          {activeTab === 'permissions' && (
            <motion.div
              key="permissions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Matriz de Permissões RBAC + ABAC</h2>
                <p className="text-sm text-slate-500">Visão consolidada do modelo de controle de acesso</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-white">
                        Perfil / Módulo
                      </th>
                      {(['view','create','edit','delete','export','import','sign','share','delegate','administer','audit'] as const).map(a => (
                        <th key={a} className="px-3 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(Object.entries(ROLE_LABELS) as [InstitutionalRole, string][]).map(([role, label]) => {
                      const roleUser = users.find(u => u.primaryRole === role);
                      const perms = roleUser?.permissions ?? [];
                      const modules = [...new Set(perms.map(p => p.module))].slice(0, 3);

                      return (
                        <tr key={role} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 sticky left-0 bg-white">
                            <RoleBadge role={role} />
                            <p className="text-xs text-slate-400 mt-1">{modules.join(', ')}{perms.length > 0 ? ` +${perms.length} perms` : ''}</p>
                          </td>
                          {(['view','create','edit','delete','export','import','sign','share','delegate','administer','audit'] as const).map(action => {
                            const hasIt = perms.some(p => p.action === action);
                            return (
                              <td key={action} className="px-3 py-4 text-center">
                                {hasIt ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-slate-200 mx-auto" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500">
                    A matriz exibe permissões por perfil principal. Usuários com múltiplos papéis acumulam permissões.
                    Atributos ABAC (horário, IP, escopo de dados) são configurados individualmente.
                    Apenas o Super Administrador pode modificar esta matriz.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de detalhes do usuário */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onBlock={(id, reason) => { blockUser(id, reason); setSelectedUser(null); }}
            onSuspend={(id, reason) => { suspendUser(id, reason); setSelectedUser(null); }}
            onReactivate={(id) => { reactivateUser(id); setSelectedUser(null); }}
            onResetPassword={(id) => { resetPassword(id); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
