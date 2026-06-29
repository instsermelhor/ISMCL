/**
 * BeneficiaryPortal — Módulo 09
 * Portal do Beneficiário — Instituto Ser Melhor — Projeto Aura
 *
 * Interface completa para beneficiários, responsáveis legais e famílias.
 * Integra com todos os módulos da plataforma respeitando as regras do MCSI.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart, Home, Calendar, FileText, MessageCircle, Bell, Settings2,
  ChevronRight, ChevronDown, Clock, Video, MapPin, CheckCircle2,
  XCircle, RefreshCw, Download, Eye, EyeOff, Send, Plus, Search,
  AlertTriangle, Shield, ShieldCheck, User, Users, Star,
  Folder, FolderOpen, ArrowRight, Info, Sparkles, Bot,
  Sun, Moon, ZoomIn, ZoomOut, Accessibility, LogOut,
  BarChart3, Target, Clipboard, BookOpen, Activity, Check,
  X, Lock, Badge, Phone, Mail, AlertCircle, FileDown,
  UserCheck, Building, GraduationCap, Mic, MicOff,
  Camera, CameraOff, Loader2, ChevronUp, MoreVertical,
  Flag, HelpCircle, TrendingUp, Zap, Filter, Inbox
} from 'lucide-react';
import { cn } from '../utils';
import {
  BeneficiaryPortalProvider,
  useBeneficiaryPortal,
  type PortalAppointment,
  type PortalDocument,
  type PortalMessage,
  type PortalNotification,
  type ServiceRequest,
  type SocialProject,
  type ChatMessage,
  type DocumentType,
  type AppointmentStatus,
  type AppointmentType,
} from '../contexts/BeneficiaryPortalContext';

// ─── Config Maps ─────────────────────────────────────────────────────────────

const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  CONFIRMED:    { label: 'Confirmado',      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',  icon: CheckCircle2 },
  PENDING:      { label: 'Aguardando',      color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: Clock },
  CANCELLED:    { label: 'Cancelado',       color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         icon: XCircle },
  COMPLETED:    { label: 'Realizado',       color: 'text-slate-600',   bg: 'bg-slate-100 border-slate-200',    icon: CheckCircle2 },
  RESCHEDULING: { label: 'Reagendando',     color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200',   icon: RefreshCw },
};

const APPOINTMENT_TYPE_CONFIG: Record<AppointmentType, { label: string; icon: React.ElementType; color: string }> = {
  TELECONSULTA: { label: 'Teleconsulta',   icon: Video,         color: 'text-blue-600' },
  PRESENCIAL:   { label: 'Presencial',     icon: MapPin,        color: 'text-teal-600' },
  DOMICILIAR:   { label: 'Domiciliar',     icon: Home,          color: 'text-violet-600' },
  GRUPO:        { label: 'Grupo',          icon: Users,         color: 'text-amber-600' },
};

const DOCUMENT_TYPE_CONFIG: Record<DocumentType, { label: string; color: string; bg: string }> = {
  RECEITA:      { label: 'Receita',       color: 'text-blue-700',    bg: 'bg-blue-50' },
  ATESTADO:     { label: 'Atestado',      color: 'text-slate-700',   bg: 'bg-slate-100' },
  DECLARACAO:   { label: 'Declaração',    color: 'text-violet-700',  bg: 'bg-violet-50' },
  LAUDO:        { label: 'Laudo',         color: 'text-amber-700',   bg: 'bg-amber-50' },
  RELATORIO:    { label: 'Relatório',     color: 'text-teal-700',    bg: 'bg-teal-50' },
  ORIENTACAO:   { label: 'Orientação',    color: 'text-emerald-700', bg: 'bg-emerald-50' },
  COMPROVANTE:  { label: 'Comprovante',   color: 'text-sky-700',     bg: 'bg-sky-50' },
  TERMO:        { label: 'Termo',         color: 'text-rose-700',    bg: 'bg-rose-50' },
};

const NOTIF_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  AGENDA:    { icon: Calendar,     color: 'text-blue-600',    bg: 'bg-blue-50' },
  DOCUMENTO: { icon: FileText,     color: 'text-violet-600',  bg: 'bg-violet-50' },
  MENSAGEM:  { icon: MessageCircle,color: 'text-teal-600',    bg: 'bg-teal-50' },
  PROJETO:   { icon: Star,         color: 'text-amber-600',   bg: 'bg-amber-50' },
  CAMPANHA:  { icon: Zap,          color: 'text-rose-600',    bg: 'bg-rose-50' },
  CADASTRO:  { icon: User,         color: 'text-slate-600',   bg: 'bg-slate-100' },
  SISTEMA:   { icon: Shield,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

const REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ABERTO:       { label: 'Aberta',          color: 'text-amber-700',   bg: 'bg-amber-50' },
  EM_ANDAMENTO: { label: 'Em andamento',    color: 'text-blue-700',    bg: 'bg-blue-50' },
  CONCLUIDO:    { label: 'Concluída',       color: 'text-emerald-700', bg: 'bg-emerald-50' },
  CANCELADO:    { label: 'Cancelada',       color: 'text-red-700',     bg: 'bg-red-50' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(dt: string): string {
  const d = new Date(dt);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatTimeAgo(dt: string): string {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Badge de status
function StatusBadge({ status, config }: { status: string; config: { label: string; color: string; bg: string } }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border', config.bg, config.color)}>
      {config.label}
    </span>
  );
}

// Card genérico com hover
function PortalCard({ children, className = '', onClick, style }: { children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <motion.div
      whileHover={onClick ? { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={style}
      className={cn(
        'bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ─── Painel Inicial (Home) ────────────────────────────────────────────────────

function HomePanel() {
  const {
    beneficiary, appointments, notifications, documents, messages,
    requests, projects, unreadNotifications, unreadMessages,
    markNotificationRead, markAllNotificationsRead,
  } = useBeneficiaryPortal();

  const nextAppointment = appointments.find((a) => a.status === 'CONFIRMED' || a.status === 'PENDING');
  const recentDocs = documents.filter((d) => d.isAuthorized).slice(0, 3);
  const unreadNotifs = notifications.filter((n) => !n.isRead).slice(0, 4);
  const pendingRequests = requests.filter((r) => r.status !== 'CONCLUIDO' && r.status !== 'CANCELADO');

  return (
    <div className="space-y-6">
      {/* Hero de boas-vindas */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 p-8 text-white shadow-lg"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl shrink-0 backdrop-blur-sm">
            {beneficiary.avatarInitials}
          </div>
          <div className="flex-1">
            <p className="text-teal-100 text-sm font-medium mb-1">{getGreeting()}! 👋</p>
            <h2 className="text-2xl font-bold tracking-tight">{beneficiary.name}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {beneficiary.programs.map((p) => (
                <span key={p} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  {p}
                </span>
              ))}
            </div>
          </div>
          {beneficiary.isProtected && (
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-medium">Perfil Protegido</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Grid de métricas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Calendar,      label: 'Próximo atendimento', value: nextAppointment ? `${nextAppointment.date.split('-').reverse().join('/')} ${nextAppointment.time}` : '—', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Bell,          label: 'Notificações',        value: `${unreadNotifications} novas`,  color: 'text-amber-600',  bg: 'bg-amber-50' },
          { icon: MessageCircle, label: 'Mensagens',           value: `${unreadMessages} não lidas`,  color: 'text-teal-600',   bg: 'bg-teal-50' },
          { icon: Clipboard,     label: 'Solicitações',        value: `${pendingRequests.length} abertas`, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <PortalCard className="p-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', item.bg)}>
                <item.icon className={cn('w-5 h-5', item.color)} />
              </div>
              <p className="text-xs text-slate-500 font-medium">{item.label}</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{item.value}</p>
            </PortalCard>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Próxima consulta em destaque */}
        {nextAppointment && (
          <PortalCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Próxima Consulta
              </h3>
              <StatusBadge
                status={nextAppointment.status}
                config={APPOINTMENT_STATUS_CONFIG[nextAppointment.status]}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-teal-700">{nextAppointment.date.split('-')[2]}</span>
                  <span className="text-xs text-teal-600">{new Date(nextAppointment.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{nextAppointment.professional}</p>
                  <p className="text-sm text-slate-500">{nextAppointment.specialty}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {nextAppointment.time}
                </span>
                <span className={cn('flex items-center gap-1.5', APPOINTMENT_TYPE_CONFIG[nextAppointment.type].color)}>
                  {React.createElement(APPOINTMENT_TYPE_CONFIG[nextAppointment.type].icon, { className: 'w-4 h-4' })}
                  {APPOINTMENT_TYPE_CONFIG[nextAppointment.type].label}
                </span>
              </div>
              {nextAppointment.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                  <Info className="w-3.5 h-3.5 inline mr-1" />
                  {nextAppointment.notes}
                </div>
              )}
              {nextAppointment.type === 'TELECONSULTA' && (
                <button className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
                  <Video className="w-4 h-4" />
                  Entrar na Teleconsulta
                </button>
              )}
            </div>
          </PortalCard>
        )}

        {/* Notificações recentes */}
        <PortalCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Notificações
              {unreadNotifications > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </h3>
            {unreadNotifications > 0 && (
              <button onClick={markAllNotificationsRead} className="text-xs text-teal-600 hover:underline font-medium">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="space-y-2">
            {unreadNotifs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma notificação nova.</p>
            ) : (
              unreadNotifs.map((n) => {
                const cfg = NOTIF_TYPE_CONFIG[n.type] || NOTIF_TYPE_CONFIG.SISTEMA;
                return (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                      {React.createElement(cfg.icon, { className: cn('w-4 h-4', cfg.color) })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.body}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </PortalCard>

        {/* Documentos recentes */}
        <PortalCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" />
              Documentos Disponíveis
            </h3>
            <span className="text-xs bg-violet-50 text-violet-700 font-semibold px-2 py-0.5 rounded-full">
              {documents.filter(d => d.isAuthorized).length} arquivos
            </span>
          </div>
          <div className="space-y-2">
            {recentDocs.map((doc) => {
              const cfg = DOCUMENT_TYPE_CONFIG[doc.type];
              return (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                    <FileText className={cn('w-4 h-4', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                    <p className="text-xs text-slate-500">{cfg.label} · {formatDate(doc.issuedAt)}</p>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-700">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </PortalCard>

        {/* Projetos vinculados */}
        <PortalCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Projetos e Programas
            </h3>
          </div>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{proj.name}</p>
                    <p className="text-xs text-slate-500">Coord.: {proj.coordinator}</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full shrink-0">
                    {proj.progress}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-teal-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${proj.progress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                {proj.nextActivity && (
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-teal-500" />
                    {proj.nextActivity}
                  </p>
                )}
              </div>
            ))}
          </div>
        </PortalCard>
      </div>
    </div>
  );
}

// ─── Agenda ───────────────────────────────────────────────────────────────────

function AgendaPanel() {
  const { appointments, confirmAppointment, cancelAppointment, requestReschedule } = useBeneficiaryPortal();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; action: string; id: string }>({ open: false, action: '', id: '' });

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter((a) => {
      if (filter === 'upcoming') return a.date >= today && a.status !== 'COMPLETED' && a.status !== 'CANCELLED';
      if (filter === 'past') return a.date < today || a.status === 'COMPLETED' || a.status === 'CANCELLED';
      return true;
    });
  }, [appointments, filter]);

  const handleAction = (action: string, id: string) => {
    setConfirmModal({ open: true, action, id });
  };

  const executeAction = () => {
    const { action, id } = confirmModal;
    if (action === 'confirm') confirmAppointment(id);
    else if (action === 'cancel') cancelAppointment(id);
    else if (action === 'reschedule') requestReschedule(id);
    setConfirmModal({ open: false, action: '', id: '' });
  };

  const actionLabels: Record<string, { title: string; body: string; btnLabel: string; btnClass: string }> = {
    confirm:    { title: 'Confirmar presença',   body: 'Deseja confirmar sua presença neste atendimento?',       btnLabel: 'Confirmar', btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    cancel:     { title: 'Cancelar consulta',    body: 'Deseja cancelar este atendimento? A equipe será notificada.', btnLabel: 'Cancelar', btnClass: 'bg-red-600 hover:bg-red-700 text-white' },
    reschedule: { title: 'Solicitar reagendamento', body: 'A equipe entrará em contato para definir novo horário.', btnLabel: 'Solicitar', btnClass: 'bg-violet-600 hover:bg-violet-700 text-white' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-teal-600" />
          Minha Agenda
        </h2>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[['all', 'Todos'], ['upcoming', 'Próximos'], ['past', 'Histórico']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val as 'all' | 'upcoming' | 'past')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                filter === val ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum atendimento encontrado</p>
            </div>
          ) : (
            filtered.map((apt, idx) => {
              const statusCfg = APPOINTMENT_STATUS_CONFIG[apt.status];
              const typeCfg = APPOINTMENT_TYPE_CONFIG[apt.type];
              const isPast = apt.status === 'COMPLETED' || apt.status === 'CANCELLED';

              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <PortalCard className={cn('p-6', isPast && 'opacity-65')}>
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Data */}
                      <div className="flex items-center gap-4 md:flex-col md:items-center md:min-w-[72px] md:text-center">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col items-center justify-center shrink-0">
                          <span className="text-lg font-bold text-teal-700 leading-none">{apt.date.split('-')[2]}</span>
                          <span className="text-xs text-teal-500 font-medium">
                            {new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                          </span>
                        </div>
                        <div className="md:hidden">
                          <p className="font-bold text-slate-900">{apt.professional}</p>
                          <p className="text-sm text-slate-500">{apt.specialty}</p>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="hidden md:block mb-2">
                          <p className="font-bold text-slate-900 text-lg">{apt.professional}</p>
                          <p className="text-sm text-slate-500">{apt.specialty}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {apt.time}
                          </span>
                          <span className={cn('flex items-center gap-1.5 font-medium', typeCfg.color)}>
                            {React.createElement(typeCfg.icon, { className: 'w-4 h-4' })}
                            {typeCfg.label}
                          </span>
                          {apt.location && (
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <MapPin className="w-3.5 h-3.5" />
                              {apt.location}
                            </span>
                          )}
                        </div>
                        {apt.notes && !isPast && (
                          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                            <Info className="w-3.5 h-3.5 inline mr-1" />
                            {apt.notes}
                          </div>
                        )}
                      </div>

                      {/* Status + Ações */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <StatusBadge status={apt.status} config={statusCfg} />
                        {!isPast && (
                          <div className="flex gap-2 flex-wrap justify-end">
                            {apt.type === 'TELECONSULTA' && apt.status === 'CONFIRMED' && (
                              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors">
                                <Video className="w-3.5 h-3.5" />
                                Entrar
                              </button>
                            )}
                            {apt.canConfirm && (
                              <button
                                onClick={() => handleAction('confirm', apt.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Confirmar
                              </button>
                            )}
                            {apt.canReschedule && (
                              <button
                                onClick={() => handleAction('reschedule', apt.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors border border-violet-200"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reagendar
                              </button>
                            )}
                            {apt.canCancel && (
                              <button
                                onClick={() => handleAction('cancel', apt.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors border border-red-200"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancelar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </PortalCard>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Modal de confirmação */}
      <AnimatePresence>
        {confirmModal.open && actionLabels[confirmModal.action] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmModal({ open: false, action: '', id: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="font-bold text-slate-900 text-lg mb-2">{actionLabels[confirmModal.action].title}</h3>
              <p className="text-slate-600 text-sm mb-6">{actionLabels[confirmModal.action].body}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ open: false, action: '', id: '' })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={executeAction}
                  className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors', actionLabels[confirmModal.action].btnClass)}
                >
                  {actionLabels[confirmModal.action].btnLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Documentos ───────────────────────────────────────────────────────────────

function DocumentsPanel() {
  const { documents } = useBeneficiaryPortal();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  const types = Array.from(new Set(documents.map((d) => d.type)));

  const filtered = useMemo(() =>
    documents
      .filter((d) => filter === 'all' || d.type === filter)
      .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()) || d.issuedBy.toLowerCase().includes(search.toLowerCase())),
    [documents, filter, search]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-violet-600" />
          Meus Documentos
        </h2>
        <span className="text-sm text-slate-500">
          {documents.filter(d => d.isAuthorized).length} disponíveis · {documents.filter(d => !d.isAuthorized).length} restrito(s)
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', filter === 'all' ? 'bg-white shadow text-teal-700' : 'text-slate-500')}
          >
            Todos
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', filter === t ? 'bg-white shadow text-teal-700' : 'text-slate-500')}
            >
              {DOCUMENT_TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Info de segurança */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-0.5">Documentos Controlados</p>
          <p>Apenas documentos autorizados pelos profissionais responsáveis estão disponíveis para visualização e download. Todos os acessos são registrados.</p>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum documento encontrado</p>
          </div>
        ) : (
          filtered.map((doc, idx) => {
            const cfg = DOCUMENT_TYPE_CONFIG[doc.type];
            return (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <PortalCard className={cn('p-5', !doc.isAuthorized && 'opacity-60')}>
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                      {doc.isAuthorized ? (
                        <FileText className={cn('w-6 h-6', cfg.color)} />
                      ) : (
                        <Lock className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{doc.title}</p>
                          <p className="text-sm text-slate-500 mt-0.5">
                            Emitido por <span className="text-slate-700 font-medium">{doc.issuedBy}</span> · {formatDate(doc.issuedAt)}
                          </p>
                        </div>
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold shrink-0', cfg.bg, cfg.color)}>
                          {cfg.label}
                        </span>
                      </div>
                      {doc.validationCode && (
                        <p className="text-xs text-slate-400 mt-2 font-mono">Código: {doc.validationCode}</p>
                      )}
                      {!doc.isAuthorized && (
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Documento restrito — não autorizado para visualização
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.size && doc.isAuthorized && (
                        <span className="text-xs text-slate-400">{doc.size}</span>
                      )}
                      {doc.isAuthorized && (
                        <>
                          <button
                            onClick={() => setPreviewDoc(previewDoc === doc.id ? null : doc.id)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-700 transition-colors"
                            title="Baixar"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Preview expandido */}
                  <AnimatePresence>
                    {previewDoc === doc.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-100"
                      >
                        <div className="bg-slate-50 rounded-xl p-6 text-center">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-sm text-slate-500">Visualização do documento disponível no download</p>
                          <p className="text-xs text-slate-400 mt-1">Para visualizar, faça o download do arquivo.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </PortalCard>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

function MessagesPanel() {
  const { messages, markMessageRead, unreadMessages } = useBeneficiaryPortal();
  const [selected, setSelected] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  const selectedMessage = messages.find((m) => m.id === selected);

  const handleSelect = (id: string) => {
    setSelected(id);
    markMessageRead(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-teal-600" />
          Mensagens
          {unreadMessages > 0 && (
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadMessages} novas
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova mensagem
        </button>
      </div>

      <div className="grid md:grid-cols-5 gap-4" style={{ minHeight: '500px' }}>
        {/* Lista de mensagens */}
        <div className="md:col-span-2 space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma mensagem</p>
            </div>
          ) : (
            messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleSelect(msg.id)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all',
                  selected === msg.id
                    ? 'bg-teal-50 border-teal-200'
                    : msg.status === 'UNREAD'
                    ? 'bg-white border-teal-100 shadow-sm'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">
                      {msg.from.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className={cn('text-sm truncate', msg.status === 'UNREAD' ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>
                        {msg.from}
                      </p>
                      <p className="text-xs text-slate-400">{msg.fromRole}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-slate-400">{formatTimeAgo(msg.sentAt)}</span>
                    {msg.status === 'UNREAD' && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                  </div>
                </div>
                <p className={cn('text-xs mt-2 truncate', msg.status === 'UNREAD' ? 'font-semibold text-slate-900' : 'text-slate-600')}>
                  {msg.subject}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{msg.preview}</p>
              </button>
            ))
          )}
        </div>

        {/* Conteúdo da mensagem */}
        <div className="md:col-span-3">
          {selectedMessage ? (
            <PortalCard className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">{selectedMessage.subject}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                    {selectedMessage.from.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedMessage.from}</p>
                    <p className="text-xs text-slate-500">{selectedMessage.fromRole} · {formatDateTime(selectedMessage.sentAt)}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedMessage.body}
                </div>
              </div>
              {selectedMessage.canReply && (
                <div className="p-4 border-t border-slate-100">
                  <div className="flex gap-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escreva sua resposta..."
                      rows={2}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                    />
                    <button
                      disabled={!replyText.trim()}
                      className="self-end px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Todas as mensagens são registradas em auditoria.
                  </p>
                </div>
              )}
            </PortalCard>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Selecione uma mensagem</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de composição */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCompose(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <h3 className="font-bold text-slate-900 text-lg mb-4">Nova Mensagem</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Destinatário</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                    <option>Equipe Administrativa</option>
                    <option>Dra. Roberta Santos — Psicóloga</option>
                    <option>Dr. Carlos Mendes — Serviço Social</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Assunto</label>
                  <input type="text" placeholder="Assunto da mensagem" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Mensagem</label>
                  <textarea rows={4} placeholder="Escreva sua mensagem..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Mensagens são encaminhadas à equipe responsável e respondidas em até 2 dias úteis. Não use este canal para emergências.
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCompose(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Enviar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Solicitações ─────────────────────────────────────────────────────────────

function RequestsPanel() {
  const { requests, submitRequest } = useBeneficiaryPortal();
  const [showNew, setShowNew] = useState(false);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const CATEGORIES = [
    'Atualização Cadastral',
    'Correção de Dados',
    'Envio de Documentos',
    'Solicitação de Declaração',
    'Solicitação de Comprovante',
    'Reagendamento',
    'Cancelamento',
    'Solicitação de Contato',
    'Outros',
  ];

  const handleSubmit = () => {
    if (!category || !title || !description) return;
    submitRequest(category, title, description);
    setSubmitted(true);
    setTimeout(() => {
      setShowNew(false);
      setSubmitted(false);
      setCategory('');
      setTitle('');
      setDescription('');
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clipboard className="w-6 h-6 text-violet-600" />
          Solicitações
        </h2>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova solicitação
        </button>
      </div>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clipboard className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma solicitação registrada</p>
          </div>
        ) : (
          requests.map((req, idx) => {
            const cfg = REQUEST_STATUS_CONFIG[req.status];
            return (
              <motion.div key={req.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <PortalCard className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{req.category}</span>
                      </div>
                      <p className="font-semibold text-slate-900">{req.title}</p>
                      <p className="text-sm text-slate-500 mt-1">{req.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span>Aberta em: {formatDate(req.createdAt)}</span>
                        <span>Atualização: {formatDate(req.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className={cn('inline-flex px-3 py-1 rounded-full text-xs font-semibold border', cfg.bg, cfg.color,
                        req.status === 'ABERTO' ? 'border-amber-200' :
                        req.status === 'EM_ANDAMENTO' ? 'border-blue-200' :
                        req.status === 'CONCLUIDO' ? 'border-emerald-200' : 'border-red-200'
                      )}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </PortalCard>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal nova solicitação */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNew(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Solicitação enviada!</h3>
                  <p className="text-slate-500 text-sm mt-1">Nossa equipe analisará em breve.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-slate-900 text-lg mb-4">Nova Solicitação</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Categoria</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                      >
                        <option value="">Selecione a categoria...</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Título</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Resumo breve da solicitação"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Descrição</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Descreva sua solicitação com detalhes..."
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!category || !title || !description}
                      className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Enviar
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Plano Individual de Cuidado ──────────────────────────────────────────────

function CarePlanPanel() {
  const { carePlan } = useBeneficiaryPortal();

  const goalStatusConfig = {
    PENDING:     { label: 'Pendente',    color: 'text-slate-500',   bg: 'bg-slate-100',    icon: Clock },
    IN_PROGRESS: { label: 'Em progresso', color: 'text-blue-600',   bg: 'bg-blue-50',      icon: Activity },
    ACHIEVED:    { label: 'Alcançada',   color: 'text-emerald-600', bg: 'bg-emerald-50',   icon: CheckCircle2 },
  };

  if (!carePlan.isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Lock className="w-16 h-16 mb-4 opacity-30" />
        <p className="font-semibold text-lg text-slate-600">Acesso Restrito</p>
        <p className="text-sm mt-1">O Plano Individual de Cuidado não foi autorizado para visualização.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500" />
          Plano Individual de Cuidado
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          Autorizado para visualização
        </div>
      </div>

      {/* Cabeçalho do PIC */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-rose-500 font-semibold uppercase tracking-wide">Beneficiária</p>
            <p className="text-sm font-bold text-slate-900 mt-1">{carePlan.beneficiaryName}</p>
          </div>
          <div>
            <p className="text-xs text-rose-500 font-semibold uppercase tracking-wide">Profissional</p>
            <p className="text-sm font-bold text-slate-900 mt-1">{carePlan.professionalName}</p>
          </div>
          <div>
            <p className="text-xs text-rose-500 font-semibold uppercase tracking-wide">Início</p>
            <p className="text-sm font-bold text-slate-900 mt-1">{formatDate(carePlan.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-rose-500 font-semibold uppercase tracking-wide">Revisão</p>
            <p className="text-sm font-bold text-slate-900 mt-1">{formatDate(carePlan.reviewDate)}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Objetivos */}
        <PortalCard className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-500" />
            Objetivos Terapêuticos
          </h3>
          <ul className="space-y-3">
            {carePlan.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                {obj}
              </li>
            ))}
          </ul>
        </PortalCard>

        {/* Orientações */}
        <PortalCard className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-500" />
            Orientações
          </h3>
          <ul className="space-y-3">
            {carePlan.orientations.map((ori, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                {ori}
              </li>
            ))}
          </ul>
        </PortalCard>
      </div>

      {/* Metas */}
      <PortalCard className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Flag className="w-4 h-4 text-amber-500" />
          Metas e Acompanhamento
        </h3>
        <div className="space-y-3">
          {carePlan.goals.map((goal) => {
            const cfg = goalStatusConfig[goal.status];
            return (
              <div key={goal.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                  {React.createElement(cfg.icon, { className: cn('w-4 h-4', cfg.color) })}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{goal.description}</p>
                  {goal.dueDate && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Prazo: {formatDate(goal.dueDate)}
                    </p>
                  )}
                </div>
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full shrink-0', cfg.bg, cfg.color)}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </PortalCard>

      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Informações clínicas protegidas</p>
          <p>Este plano foi compartilhado com você por autorização dos profissionais responsáveis. Não compartilhe estas informações com terceiros não autorizados.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Projetos ─────────────────────────────────────────────────────────────────

function ProjectsPanel() {
  const { projects } = useBeneficiaryPortal();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <Star className="w-6 h-6 text-amber-500" />
        Meus Projetos e Programas
      </h2>
      <div className="space-y-4">
        {projects.map((proj, idx) => (
          <motion.div key={proj.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
            <PortalCard className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{proj.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{proj.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-2xl font-black text-teal-600">{proj.progress}%</span>
                  <p className="text-xs text-slate-400">concluído</p>
                </div>
              </div>

              <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${proj.progress}%` }}
                  transition={{ duration: 1.2, delay: 0.2 + idx * 0.1 }}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">Coordenador</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{proj.coordinator}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">Início</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{formatDate(proj.startDate)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">Presenças</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{proj.attendances} / {proj.totalSessions}</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-3">
                  <p className="text-xs text-teal-500 font-medium">Freq. de Presença</p>
                  <p className="font-bold text-teal-700 mt-0.5">
                    {Math.round((proj.attendances / proj.totalSessions) * 100)}%
                  </p>
                </div>
              </div>

              {proj.nextActivity && (
                <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs text-amber-500 font-semibold uppercase tracking-wide">Próxima atividade</p>
                    <p className="text-sm font-medium text-amber-800">{proj.nextActivity}</p>
                  </div>
                </div>
              )}
            </PortalCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Assistente Virtual ───────────────────────────────────────────────────────

function AssistantPanel() {
  const { chatMessages, sendChatMessage, isChatLoading } = useBeneficiaryPortal();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isChatLoading) return;
    setInput('');
    await sendChatMessage(text);
  };

  const SUGGESTIONS = [
    'Quando é minha próxima consulta?',
    'Como entro na teleconsulta?',
    'Como solicito uma declaração?',
    'Quais projetos estou participando?',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Assistente Virtual</h2>
          <p className="text-sm text-slate-500">Tire dúvidas sobre o portal e procedimentos administrativos</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-700">
          <p className="font-semibold">Informação importante</p>
          <p>Este assistente responde apenas dúvidas administrativas e sobre o uso do portal. Ele <strong>não fornece diagnósticos, interpreta exames ou prescrições</strong>, e nunca substitui a orientação dos profissionais de saúde.</p>
        </div>
      </div>

      <PortalCard className="flex flex-col" style={{ height: '480px' }}>
        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-3', msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              {msg.sender === 'assistant' ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 text-xs font-bold">
                  MC
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-3 text-sm',
                  msg.sender === 'assistant'
                    ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    : 'bg-teal-600 text-white rounded-tr-sm'
                )}
              >
                {msg.content}
                <p className={cn('text-xs mt-1 opacity-60', msg.sender === 'user' ? 'text-right' : '')}>
                  {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-slate-400"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugestões (apenas quando há poucas mensagens) */}
        {chatMessages.length <= 2 && (
          <div className="px-6 pb-3">
            <p className="text-xs text-slate-400 mb-2 font-medium">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendChatMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors border border-slate-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Digite sua dúvida..."
              disabled={isChatLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isChatLoading}
              className="px-4 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </PortalCard>
    </div>
  );
}

// ─── Portal Principal ─────────────────────────────────────────────────────────

type PortalTab = 'home' | 'agenda' | 'documentos' | 'mensagens' | 'solicitacoes' | 'projetos' | 'pic' | 'assistente';

const PORTAL_TABS: Array<{
  id: PortalTab;
  label: string;
  icon: React.ElementType;
  badgeKey?: 'unreadNotifications' | 'unreadMessages';
}> = [
  { id: 'home',        label: 'Início',         icon: Home },
  { id: 'agenda',      label: 'Agenda',         icon: Calendar },
  { id: 'documentos',  label: 'Documentos',     icon: FileText },
  { id: 'mensagens',   label: 'Mensagens',      icon: MessageCircle, badgeKey: 'unreadMessages' },
  { id: 'solicitacoes',label: 'Solicitações',   icon: Clipboard },
  { id: 'projetos',    label: 'Projetos',       icon: Star },
  { id: 'pic',         label: 'Plano de Cuidado', icon: Heart },
  { id: 'assistente',  label: 'Assistente',     icon: Sparkles },
];

function PortalContent() {
  const { beneficiary, unreadNotifications, unreadMessages } = useBeneficiaryPortal();
  const [activeTab, setActiveTab] = useState<PortalTab>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const { notifications, markNotificationRead, markAllNotificationsRead } = useBeneficiaryPortal();

  const fontSizeClass = fontSize === 'large' ? 'text-base' : fontSize === 'xlarge' ? 'text-lg' : 'text-sm';

  const badges: Record<string, number> = {
    unreadNotifications,
    unreadMessages,
  };

  const tabComponents: Record<PortalTab, React.ReactNode> = {
    home: <HomePanel />,
    agenda: <AgendaPanel />,
    documentos: <DocumentsPanel />,
    mensagens: <MessagesPanel />,
    solicitacoes: <RequestsPanel />,
    projetos: <ProjectsPanel />,
    pic: <CarePlanPanel />,
    assistente: <AssistantPanel />,
  };

  return (
    <div
      className={cn(
        'flex h-screen overflow-hidden transition-all duration-300',
        darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900',
        highContrast && 'contrast-150',
        fontSizeClass
      )}
    >
      {/* Sidebar Portal */}
      <aside className={cn(
        'w-64 flex flex-col shrink-0 border-r transition-colors duration-300',
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
      )}>
        {/* Logo */}
        <div className={cn('h-16 flex items-center px-6 border-b gap-2', darkMode ? 'border-slate-700' : 'border-slate-100')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-600 leading-none">Portal do</p>
            <p className="text-xs font-bold text-teal-600 leading-none">Beneficiário</p>
          </div>
        </div>

        {/* User Info */}
        <div className={cn('mx-4 mt-4 p-3 rounded-2xl', darkMode ? 'bg-slate-700' : 'bg-slate-50')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {beneficiary.avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-bold truncate', darkMode ? 'text-white' : 'text-slate-900')}>
                {beneficiary.name.split(' ')[0]}
              </p>
              <p className="text-xs text-slate-400 truncate">Beneficiária</p>
            </div>
            {beneficiary.isProtected && (
              <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
            )}
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {PORTAL_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const badgeCount = tab.badgeKey ? badges[tab.badgeKey] : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left',
                  isActive
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : darkMode
                    ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <tab.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-teal-600' : 'text-slate-400')} />
                <span className="flex-1">{tab.label}</span>
                {badgeCount > 0 && (
                  <span className="bg-teal-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className={cn('p-3 border-t space-y-1', darkMode ? 'border-slate-700' : 'border-slate-100')}>
          <button
            onClick={() => setShowAccessibility(!showAccessibility)}
            className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors', darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-50')}
          >
            <Accessibility className="w-4 h-4" />
            Acessibilidade
          </button>
          <button className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors', darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600')}>
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className={cn(
          'h-16 flex items-center px-8 gap-4 border-b shrink-0 transition-colors',
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
        )}>
          <h1 className={cn('font-bold text-lg flex-1', darkMode ? 'text-white' : 'text-slate-900')}>
            {PORTAL_TABS.find(t => t.id === activeTab)?.label}
          </h1>

          {/* Accessibility Controls */}
          <AnimatePresence>
            {showAccessibility && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border',
                  darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'
                )}
              >
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  title={darkMode ? 'Modo claro' : 'Modo escuro'}
                  className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                </button>
                <div className="w-px h-5 bg-slate-200" />
                <button
                  onClick={() => setFontSize(fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xlarge' : 'normal')}
                  title="Ajustar tamanho da fonte"
                  className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 text-xs font-bold"
                >
                  A{fontSize === 'large' ? 'A' : fontSize === 'xlarge' ? 'AA' : ''}
                </button>
                <div className="w-px h-5 bg-slate-200" />
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  title="Alto contraste"
                  className={cn('p-1.5 rounded-lg transition-colors', highContrast ? 'bg-slate-900 text-white' : 'hover:bg-slate-200 text-slate-500')}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className={cn('relative p-2.5 rounded-xl transition-colors', darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
            >
              <Bell className={cn('w-5 h-5', darkMode ? 'text-slate-300' : 'text-slate-500')} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 text-sm">Notificações</p>
                    <button onClick={markAllNotificationsRead} className="text-xs text-teal-600 hover:underline">
                      Marcar todas como lidas
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.slice(0, 6).map((n) => {
                      const cfg = NOTIF_TYPE_CONFIG[n.type] || NOTIF_TYPE_CONFIG.SISTEMA;
                      return (
                        <button
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={cn('w-full flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50', !n.isRead && 'bg-teal-50/50')}
                        >
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                            {React.createElement(cfg.icon, { className: cn('w-4 h-4', cfg.color) })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm truncate', !n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>{n.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-teal-500 mt-1 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
            {beneficiary.avatarInitials}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {tabComponents[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Click outside para fechar painel de notificações */}
      {showNotifPanel && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
      )}
    </div>
  );
}

// ─── Export com Provider ──────────────────────────────────────────────────────

export function BeneficiaryPortal() {
  return (
    <BeneficiaryPortalProvider>
      <PortalContent />
    </BeneficiaryPortalProvider>
  );
}
