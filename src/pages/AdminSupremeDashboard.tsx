import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BriefcaseMedical, Calendar, FileText,
  MessageCircle, DollarSign, Building2, ShieldAlert, Shield,
  GitBranch, Activity, Heart, Monitor, BookOpen, GraduationCap,
  FileCheck, Scale, FolderOpen, Network, Building, Rocket,
  Brain, Cpu, Award, ChevronRight, LogOut, Bell, Settings,
  Activity as ActivityIcon, TrendingUp, TrendingDown, Wifi,
  WifiOff, AlertTriangle, CheckCircle2, Clock, ShieldCheck,
  Users2, Zap, BarChart2, Database, Globe, Lock, Eye,
  Layers, RefreshCw, ArrowUpRight, Search, Download, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIAM } from '../contexts/IAMContext';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { getAdminSessionTimeoutMs } from '../services/SecureCredentialsService';
import { dataGovernanceService } from '../services/dataGovernanceService';
import type { OperationMode } from '../services/dataGovernanceService';
import type { InstitutionalRole } from '../types/iam';

// ---- Helpers ----

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDate(): string {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ---- Componentes auxiliares ----

function KpiCard({
  label, value, sub, icon: Icon, gradient, pulse = false, trend, to,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  gradient: string;
  pulse?: boolean;
  trend?: { value: string; up: boolean };
  to?: string;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={() => to && navigate(to)}
      className={`relative rounded-2xl p-5 overflow-hidden ${to ? 'cursor-pointer' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Gradient orb */}
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-20 pointer-events-none rounded-full blur-2xl"
        style={{ background: gradient }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${gradient}20`, border: `1px solid ${gradient}30` }}
          >
            <Icon className="w-5 h-5" style={{ color: gradient.includes('#10b981') ? '#34d399' : gradient.includes('#f59e0b') ? '#fbbf24' : gradient.includes('#ef4444') ? '#f87171' : gradient.includes('#8b5cf6') ? '#a78bfa' : gradient.includes('#3b82f6') ? '#60a5fa' : '#e2e8f0' }} />
          </div>
          {pulse && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          )}
          {to && !pulse && (
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
          )}
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
        <div className="text-3xl font-extrabold text-white">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend.up ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ServiceStatusBadge({ status }: { status: 'online' | 'degraded' | 'offline' }) {
  const map = {
    online: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30', label: 'Online', icon: CheckCircle2 },
    degraded: { color: 'text-amber-400 bg-amber-400/10 border-amber-500/30', label: 'Degradado', icon: AlertTriangle },
    offline: { color: 'text-red-400 bg-red-400/10 border-red-500/30', label: 'Offline', icon: WifiOff },
  };
  const { color, label, icon: Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

// ---- Dados de Módulos ----

const MODULE_GRID = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'core', color: '#10b981' },
  { name: 'Beneficiários', href: '/patients', icon: Users, category: 'core', color: '#3b82f6' },
  { name: 'Equipe Técnica', href: '/professionals', icon: BriefcaseMedical, category: 'core', color: '#8b5cf6' },
  { name: 'Agenda', href: '/calendar', icon: Calendar, category: 'core', color: '#f59e0b' },
  { name: 'Prontuários', href: '/records', icon: FileText, category: 'core', color: '#06b6d4' },
  { name: 'Mensagens', href: '/messages', icon: MessageCircle, category: 'core', color: '#10b981' },
  { name: 'Financeiro', href: '/financial', icon: DollarSign, category: 'erp', color: '#f59e0b' },
  { name: 'CGI — Gestão', href: '/cgi', icon: Building2, category: 'gov', color: '#6366f1' },
  { name: 'MCSI — Segurança', href: '/seguranca', icon: ShieldAlert, category: 'security', color: '#ef4444' },
  { name: 'IAM — Identidades', href: '/iam', icon: Shield, category: 'security', color: '#f59e0b' },
  { name: 'BPM — Processos', href: '/processos', icon: GitBranch, category: 'workflow', color: '#8b5cf6' },
  { name: 'ARE — Cadastro', href: '/cadastro-adaptativo', icon: Activity, category: 'workflow', color: '#10b981' },
  { name: 'SATAI — Triagem', href: '/satai', icon: Heart, category: 'care', color: '#ef4444' },
  { name: 'PIARAVE', href: '/piarave', icon: Heart, category: 'care', color: '#f43f5e' },
  { name: 'Platform Health', href: '/auditoria-plataforma', icon: Monitor, category: 'ops', color: '#06b6d4' },
  { name: 'SODO — Docs', href: '/sodo', icon: BookOpen, category: 'knowledge', color: '#84cc16' },
  { name: 'SODO — Academia', href: '/academia', icon: GraduationCap, category: 'knowledge', color: '#a78bfa' },
  { name: 'SODO — POPs', href: '/pops', icon: FileCheck, category: 'knowledge', color: '#34d399' },
  { name: 'SODO — Gov.', href: '/governanca-conhecimento', icon: ShieldCheck, category: 'gov', color: '#60a5fa' },
  { name: 'AEGRC — Gov. Riscos', href: '/aegrc', icon: Scale, category: 'gov', color: '#f59e0b' },
  { name: 'AECM — Documentos', href: '/aecm', icon: FolderOpen, category: 'knowledge', color: '#fb923c' },
  { name: 'ACU — Universidade', href: '/acu', icon: GraduationCap, category: 'knowledge', color: '#c084fc' },
  { name: 'AEIP — Integrações', href: '/aeip', icon: Network, category: 'tech', color: '#38bdf8' },
  { name: 'AEAGO — Arquitetura', href: '/aeago', icon: Building, category: 'tech', color: '#a3e635' },
  { name: 'APRCG — Go-Live', href: '/aprcg', icon: Rocket, category: 'tech', color: '#f472b6' },
  { name: 'AMAC — Certificação', href: '/amac', icon: Award, category: 'gov', color: '#fbbf24' },
  { name: 'AIIC — Inteligência', href: '/aiic', icon: Brain, category: 'ai', color: '#818cf8' },
  { name: 'ACOP — Orquestração', href: '/acop', icon: Cpu, category: 'ai', color: '#a78bfa' },
  { name: 'Portal Beneficiário', href: '/portal-beneficiario', icon: Users2, category: 'portals', color: '#34d399' },
  { name: 'Portal Profissional', href: '/portal-profissional', icon: BriefcaseMedical, category: 'portals', color: '#60a5fa' },
  { name: 'Configurações', href: '/settings', icon: Settings, category: 'admin', color: '#94a3b8' },
  { name: 'ACTG — Canais', href: '/omnichannel-admin', icon: Wifi, category: 'admin', color: '#2dd4bf' },
];

const SERVICES = [
  { name: 'API Core', status: 'online' as const },
  { name: 'Banco de Dados', status: 'online' as const },
  { name: 'Cache (Redis)', status: 'online' as const },
  { name: 'IA / LLM', status: 'online' as const },
  { name: 'E-mail / SMTP', status: 'online' as const },
  { name: 'PIX / Financeiro', status: 'degraded' as const },
  { name: 'CDN / Storage', status: 'online' as const },
  { name: 'WebSocket', status: 'online' as const },
];

const CATEGORY_LABELS: Record<string, string> = {
  core: '🏥 Núcleo Clínico',
  erp: '💰 ERP Social',
  gov: '📊 Governança',
  security: '🔒 Segurança & IAM',
  workflow: '⚙️ Workflows & BPM',
  care: '💜 Programas de Cuidado',
  ops: '🖥️ Operações & Health',
  knowledge: '📚 Conhecimento & Docs',
  tech: '🔌 Tecnologia & Integrações',
  ai: '🤖 Inteligência Artificial',
  portals: '🌐 Portais Externos',
  admin: '⚙️ Administração',
};

// ---- Componente Principal ----

export function AdminSupremeDashboard() {
  const { user, logout } = useAuth();
  const { auditLogs, currentUser, isAuthenticated } = useIAM();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [sessionWarning, setSessionWarning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Redireciona se não autenticado
  useEffect(() => {
    if (!isAuthenticated) navigate('/admin-login', { replace: true });
  }, [isAuthenticated, navigate]);

  // Relógio em tempo real
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Logout por inatividade (Prompt 177 ETAPA 6)
  useInactivityLogout({
    enabled: !!currentUser,
    onTimeout: () => {
      logout();
      navigate('/admin-login', { replace: true });
    },
    onWarning: () => setSessionWarning(true),
    warningBeforeMs: 120_000, // 2 min antes
  });

  const handleLogout = () => {
    logout();
    navigate('/admin-login', { replace: true });
  };

  // Filtra módulos
  const filteredModules = MODULE_GRID.filter(m => {
    const matchesSearch = !searchTerm || m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !activeCategory || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // KPIs simulados (em produção: carregados de API)
  const recentAuditLogs = auditLogs.slice(0, 8);
  const failedLogins = auditLogs.filter(l => l.eventType === 'login_failure').length;
  const servicesOnline = SERVICES.filter(s => s.status === 'online').length;
  const hasCriticalAlerts = failedLogins >= 3 || servicesOnline < SERVICES.length;

  const categories = Array.from(new Set(MODULE_GRID.map(m => m.category)));

  // Modal States para Governança Global (Prompt 189)
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [showImpersonationModal, setShowImpersonationModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [impersonationReason, setImpersonationReason] = useState('');
  const [delegateUserId, setDelegateUserId] = useState('');
  const [delegateRoleName, setDelegateRoleName] = useState<InstitutionalRole>('manager');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // ── Painel de Governança de Dados Reais ──
  const [govStatus, setGovStatus] = useState(() => dataGovernanceService.getStatus());
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [govLoading, setGovLoading] = useState(false);

  useEffect(() => {
    const unsub = dataGovernanceService.subscribe(() => {
      setGovStatus(dataGovernanceService.getStatus());
    });
    return unsub;
  }, []);

  const handlePurgeDemo = async () => {
    if (purgeConfirmText !== 'CONFIRMAR') return;
    setGovLoading(true);
    await dataGovernanceService.purgeDemo();
    setGovLoading(false);
    setShowPurgeConfirm(false);
    setPurgeConfirmText('');
    setNotificationMsg('✅ Dados fictícios removidos. Plataforma em modo Produção Real.');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGovLoading(true);
    dataGovernanceService.importBackup(file).then(() => {
      setGovLoading(false);
      setNotificationMsg('✅ Backup importado com sucesso.');
      setTimeout(() => setNotificationMsg(null), 4000);
    }).catch(() => {
      setGovLoading(false);
      setNotificationMsg('❌ Erro ao importar backup. Verifique o arquivo.');
      setTimeout(() => setNotificationMsg(null), 4000);
    });
    e.target.value = '';
  };

  const { users, addRole, startImpersonation } = useIAM();
  const isSuperUser = currentUser?.roles?.includes('super_user_universal') || currentUser?.roles?.includes('super_admin') || currentUser?.primaryRole === 'super_user_universal' || currentUser?.primaryRole === 'super_admin' || user?.email === 'aurainstitutosermelhor@gmail.com';

  const handleStartImpersonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !impersonationReason) return;
    const ok = await startImpersonation(targetUserId, impersonationReason);
    if (ok) {
      setShowImpersonationModal(false);
      setNotificationMsg('Sessão de impersonação assistida iniciada com sucesso.');
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  const handleDelegateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateUserId || !delegateRoleName) return;
    await addRole(delegateUserId, delegateRoleName);
    setShowDelegationModal(false);
    setNotificationMsg(`Função ${delegateRoleName} delegada com sucesso.`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 60%, #1a0a2e 100%)' }}
    >
      {/* ── Notificação Toast ── */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {notificationMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Impersonação Assistida ── */}
      <AnimatePresence>
        {showImpersonationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowImpersonationModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
                  <Eye className="w-4 h-4" /> Impersonação Assistida
                </div>
                <button onClick={() => setShowImpersonationModal(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Permite visualizar a experiência do sistema como outro usuário para prestar suporte direto. Esta sessão é <strong>100% auditada</strong>.
              </p>
              <form onSubmit={handleStartImpersonationSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Selecione o Usuário Alvo</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="">-- Escolha um usuário --</option>
                    {users.filter(u => u.primaryRole !== 'super_user_universal').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.primaryRole}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Motivo da Impersonação (Obrigatório)</label>
                  <textarea
                    value={impersonationReason}
                    onChange={(e) => setImpersonationReason(e.target.value)}
                    required
                    rows={3}
                    placeholder="Ex: Suporte técnico assistido à edição de prontuário #104"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-amber-400 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowImpersonationModal(false)} className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-500">Iniciar Impersonação</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Delegação de Funções ── */}
      <AnimatePresence>
        {showDelegationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDelegationModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Delegação de Funções (RBAC)
                </div>
                <button onClick={() => setShowDelegationModal(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Delegue papéis administrativos ou institucionais com controle direto sob o princípio do Menor Privilégio.
              </p>
              <form onSubmit={handleDelegateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Usuário Destinatário</label>
                  <select
                    value={delegateUserId}
                    onChange={(e) => setDelegateUserId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-teal-400"
                  >
                    <option value="">-- Selecione o usuário --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Função a Delegar</label>
                  <select
                    value={delegateRoleName}
                    onChange={(e) => setDelegateRoleName(e.target.value as InstitutionalRole)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-teal-400"
                  >
                    <option value="manager">Gestor</option>
                    <option value="coordinator">Coordenador</option>
                    <option value="professional">Profissional Clínico</option>
                    <option value="admin_collaborator">Colaborador Administrativo</option>
                    <option value="auditor">Auditor de Compliance</option>
                    <option value="director">Diretor</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowDelegationModal(false)} className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-xs font-bold text-white hover:from-teal-400 hover:to-emerald-500">Conceder Delegação</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Aviso de sessão prestes a expirar ── */}
      <AnimatePresence>
        {sessionWarning && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-6 py-3 text-sm font-semibold"
            style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)', color: '#0a0f1e' }}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Sua sessão expirará em breve por inatividade.
            </div>
            <button
              onClick={() => setSessionWarning(false)}
              className="px-3 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-xs font-bold transition-colors"
            >
              Continuar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header / Top Bar ── */}
      <header
        className="sticky top-0 z-40 flex items-center gap-4 px-6 py-4 border-b"
        style={{
          background: 'rgba(10,15,30,0.9)',
          borderColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo + Título */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(124,58,237,0.2) 100%)',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            <Heart className="w-5 h-5 text-amber-400 fill-current" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider leading-none">
              {isSuperUser ? 'Governança Global Aura' : 'Painel Supremo'}
            </div>
            <div className="text-[10px] text-slate-500 leading-none mt-0.5">Instituto Ser Melhor</div>
          </div>
        </div>

        {/* Relógio */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 ml-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-mono text-slate-300">{fmtTime(time)}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Alertas */}
        {hasCriticalAlerts && (
          <motion.button
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            onClick={() => navigate('/seguranca')}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            <Bell className="w-3.5 h-3.5" />
            {failedLogins >= 3 ? `${failedLogins} logins falhos` : 'Serviço degradado'}
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
          </motion.button>
        )}

        {/* Perfil */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-none">{user?.name ?? 'Super Usuário'}</p>
            <p className="text-[10px] text-amber-400 font-semibold leading-none mt-0.5">
              {isSuperUser ? 'Super Usuário Universal' : 'Super Administrador'}
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0a0f1e' }}
          >
            {user?.initials ?? 'SU'}
          </div>
        </div>

        <button
          onClick={handleLogout}
          id="btn-admin-logout"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </header>

      {/* ── Conteúdo principal ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Saudação + Ações do Super Usuário Universal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white">
                {getGreeting()}, {user?.name?.split(' ')[0] ?? 'Super Usuário'}! 👋
              </h1>
              <p className="text-slate-400 text-sm mt-1">{fmtDate()}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isSuperUser && (
                <>
                  <button
                    onClick={() => setShowDelegationModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-300 bg-teal-500/20 border border-teal-500/40 hover:bg-teal-500/30 transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Delegação de Funções
                  </button>
                  <button
                    onClick={() => setShowImpersonationModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Impersonação Assistida
                  </button>
                </>
              )}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#fbbf24',
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {isSuperUser ? 'ROOT / PLATFORM_OWNER (GLOBAL)' : 'Super Administrador · Acesso Total'}
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#34d399',
                }}
              >
                <Wifi className="w-3.5 h-3.5" />
                {servicesOnline}/{SERVICES.length} Serviços Online
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <KpiCard
            label="Módulos Ativos"
            value={MODULE_GRID.length}
            sub="Plataforma Aura"
            icon={Layers}
            gradient="#10b981"
            trend={{ value: '+3 neste ciclo', up: true }}
          />
          <KpiCard
            label="Usuários IAM"
            value="12"
            sub="Perfis configurados"
            icon={Users}
            gradient="#3b82f6"
            pulse
            to="/iam"
          />
          <KpiCard
            label="Logins Falhos"
            value={failedLogins}
            sub="Tentativas registradas"
            icon={AlertTriangle}
            gradient={failedLogins >= 3 ? '#ef4444' : '#f59e0b'}
            to="/seguranca"
          />
          <KpiCard
            label="Serviços Saudáveis"
            value={`${servicesOnline}/${SERVICES.length}`}
            sub="Infraestrutura"
            icon={ActivityIcon}
            gradient="#8b5cf6"
            to="/auditoria-plataforma"
          />
        </motion.div>

        {/* Segunda linha de KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <KpiCard
            label="Registros de Auditoria"
            value={auditLogs.length}
            sub="Trilha imutável"
            icon={Eye}
            gradient="#06b6d4"
            to="/auditoria-plataforma"
          />
          <KpiCard
            label="Permissões RBAC"
            value="198+"
            sub="Regras ativas"
            icon={Lock}
            gradient="#f59e0b"
            to="/iam"
          />
          <KpiCard
            label="Processos BPM"
            value="24"
            sub="Workflows ativos"
            icon={GitBranch}
            gradient="#84cc16"
            to="/processos"
          />
          <KpiCard
            label="IA Ativa"
            value="ACOP"
            sub="Orquestração cognitiva"
            icon={Brain}
            gradient="#a78bfa"
            to="/acop"
          />
        </motion.div>

        {/* Grid principal: Módulos + Saúde dos Serviços */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Módulos da Plataforma */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="xl:col-span-2 rounded-2xl p-6"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Acesso Rápido — Todos os Módulos
              </h2>
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar módulo..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder:text-slate-500 bg-white/5 border border-white/8 outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
            </div>

            {/* Filtros de categoria */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${!activeCategory ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/10'}`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${activeCategory === cat ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/10'}`}
                >
                  {CATEGORY_LABELS[cat]?.split(' ')[0] ?? cat}
                </button>
              ))}
            </div>

            {/* Grid de módulos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredModules.map(mod => (
                <motion.button
                  key={mod.href}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(mod.href)}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl text-left transition-all group"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = `${mod.color}12`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${mod.color}30`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${mod.color}18`, border: `1px solid ${mod.color}25` }}
                  >
                    <mod.icon className="w-4 h-4" style={{ color: mod.color }} />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 group-hover:text-white transition-colors leading-tight">
                    {mod.name}
                  </span>
                </motion.button>
              ))}
            </div>
            {filteredModules.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-6">Nenhum módulo encontrado</p>
            )}
          </motion.div>

          {/* Coluna lateral */}
          <div className="flex flex-col gap-6">

            {/* Saúde dos Serviços */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Monitor className="w-4 h-4 text-emerald-400" />
                Saúde dos Serviços
              </h2>
              <div className="space-y-2.5">
                {SERVICES.map(svc => (
                  <div key={svc.name} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{svc.name}</span>
                    <ServiceStatusBadge status={svc.status} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/auditoria-plataforma')}
                className="mt-4 w-full text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1"
              >
                Ver detalhes completos <ArrowUpRight className="w-3 h-3" />
              </button>
            </motion.div>

            {/* Sessão ativa */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(245,158,11,0.04)',
                border: '1px solid rgba(245,158,11,0.12)',
              }}
            >
              <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4" />
                Sessão Atual
              </h2>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Usuário</span>
                  <span className="text-white font-semibold truncate ml-2">{user?.email ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Perfil</span>
                  <span className="text-amber-400 font-bold">Super Admin</span>
                </div>
                <div className="flex justify-between">
                  <span>Timeout</span>
                  <span className="text-slate-300">{getAdminSessionTimeoutMs() / 60000} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Hora</span>
                  <span className="font-mono text-slate-300">{fmtTime(time)}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Encerrar sessão
              </button>
            </motion.div>

          </div>
        </div>

        {/* Trilha de Auditoria Recente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              Trilha de Auditoria Recente
            </h2>
            <button
              onClick={() => navigate('/auditoria-plataforma')}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-purple-400 transition-colors"
            >
              Ver tudo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentAuditLogs.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Nenhum registro ainda</p>
            ) : (
              recentAuditLogs.map(log => {
                const severityMap: Record<string, string> = {
                  info: 'text-emerald-400 bg-emerald-400/10',
                  warning: 'text-amber-400 bg-amber-400/10',
                  critical: 'text-red-400 bg-red-400/10',
                  error: 'text-red-400 bg-red-400/10',
                };
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                  >
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${severityMap[log.severity] ?? 'text-slate-400 bg-slate-400/10'}`}>
                      {log.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{log.eventType.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-slate-500 truncate">{log.userName} · {log.ipAddress}</p>
                    </div>
                    <span className="text-[10px] text-slate-600 shrink-0 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* ── Painel de Governança de Dados Reais ─────────────────────── */}
        {isSuperUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-2xl p-6 mt-6"
            style={{
              background: govStatus.mode === 'PRODUCTION'
                ? 'rgba(16,185,129,0.05)'
                : 'rgba(245,158,11,0.05)',
              border: govStatus.mode === 'PRODUCTION'
                ? '1px solid rgba(16,185,129,0.2)'
                : '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                Governança de Dados — Transição para Produção Real
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                govStatus.mode === 'PRODUCTION'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  govStatus.mode === 'PRODUCTION' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`} />
                {govStatus.mode === 'PRODUCTION' ? 'Produção Real' : 'Modo Demonstração'}
              </span>
            </div>

            {/* Métricas Atuais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Beneficiários', value: govStatus.patients },
                { label: 'Profissionais', value: govStatus.professionals },
                { label: 'Agendamentos', value: govStatus.appointments },
                { label: 'Programas', value: govStatus.programs },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-2xl font-black text-white">{item.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Ações de Governança */}
            <div className="flex flex-wrap gap-3">
              {/* Export Backup */}
              <button
                onClick={() => dataGovernanceService.exportBackup()}
                disabled={govLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-all"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Backup JSON
              </button>

              {/* Import Backup */}
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
                style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)' }}
              >
                <Zap className="w-3.5 h-3.5" />
                Importar Backup
                <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
              </label>

              {/* Purga de Dados Demo */}
              {govStatus.mode !== 'PRODUCTION' && (
                <button
                  onClick={() => setShowPurgeConfirm(true)}
                  disabled={govLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:text-red-200 transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Purgar Dados Fictícios & Ativar Produção Real
                </button>
              )}

              {/* Voltar para Demo */}
              {govStatus.mode === 'PRODUCTION' && (
                <button
                  onClick={() => { dataGovernanceService.setMode('DEMO'); setNotificationMsg('Modo Demonstração reativado.'); setTimeout(() => setNotificationMsg(null), 3000); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 transition-all"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Reativar Modo Demo
                </button>
              )}
            </div>

            {/* Modal de Confirmação de Purga */}
            {showPurgeConfirm && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
                <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.4)' }}>
                  <h3 className="text-lg font-black text-red-400 mb-2">⚠️ Ação Irreversível</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Esta ação irá <strong className="text-red-300">remover permanentemente</strong> todos os dados fictícios
                    (beneficiários, profissionais e agendamentos de demonstração).
                    Programas sociais serão preservados.
                  </p>
                  <p className="text-xs text-slate-500 mb-2">Digite <span className="font-mono text-red-300">CONFIRMAR</span> para prosseguir:</p>
                  <input
                    type="text"
                    value={purgeConfirmText}
                    onChange={e => setPurgeConfirmText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm mb-4 font-mono"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                    placeholder="CONFIRMAR"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowPurgeConfirm(false); setPurgeConfirmText(''); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >Cancelar</button>
                    <button
                      onClick={handlePurgeDemo}
                      disabled={purgeConfirmText !== 'CONFIRMAR' || govLoading}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40"
                      style={{ background: purgeConfirmText === 'CONFIRMAR' ? '#dc2626' : '#7f1d1d' }}
                    >
                      {govLoading ? 'Processando...' : 'Confirmar Purga'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div className="pb-6 flex items-center justify-between text-[10px] text-slate-600 flex-wrap gap-2">
          <span>© 2026 Instituto Ser Melhor · Plataforma Aura · Prompt 177</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-amber-600" />Zero Trust</span>
            <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5 text-amber-600" />RBAC/ABAC</span>
            <span className="flex items-center gap-1"><Database className="w-2.5 h-2.5 text-amber-600" />Auditoria Total</span>
          </div>
        </div>

      </main>
    </div>
  );
}
