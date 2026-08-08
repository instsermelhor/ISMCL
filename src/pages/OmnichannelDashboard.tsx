import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Wifi, WifiOff, AlertTriangle, CheckCircle2, XCircle,
  Video, MessageCircle, RefreshCw, Settings, ArrowRight,
  MessageSquare, Shield, Zap, TrendingUp, Clock, Phone,
  ChevronRight, Globe, Bell, BarChart3, Radio, Link2, Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { getProviderHealth, getMockProviderHealth } from '../services/actgService';
import type { ProviderHealthStatus, ChannelType } from '../types/actg.types';
import { ProviderHealthBadge } from '../components/actg/ProviderHealthBadge';

// ============================================================================
// ACTG — CENTRAL DE COMUNICAÇÃO & TELEATENDIMENTO
// Admin Dashboard for the Aura Communication & Teleattendance Gateway
// ADR-188 / Prompt 188
// ============================================================================

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  GOOGLE_MEET: Video,
  TEAMS: Video,
  WHATSAPP_BUSINESS: MessageCircle,
  WEBRTC_NATIVE: Shield,
  ZOOM: Video,
};

const PROVIDER_COLORS: Record<string, string> = {
  GOOGLE_MEET: '#00897B',
  TEAMS: '#6264A7',
  WHATSAPP_BUSINESS: '#25D366',
  WEBRTC_NATIVE: '#0EA5E9',
};

const PROVIDER_LABELS: Record<string, string> = {
  GOOGLE_MEET: 'Google Meet',
  TEAMS: 'Microsoft Teams',
  WHATSAPP_BUSINESS: 'WhatsApp Business',
  WEBRTC_NATIVE: 'Sala Virtual Aura',
};

const PROVIDER_GRADIENTS: Record<string, string> = {
  GOOGLE_MEET: 'from-teal-500 to-cyan-600',
  TEAMS: 'from-indigo-500 to-purple-600',
  WHATSAPP_BUSINESS: 'from-green-500 to-emerald-600',
  WEBRTC_NATIVE: 'from-sky-500 to-blue-600',
};

const STATUS_STYLES = {
  ONLINE: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Online' },
  DEGRADED: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Degradado' },
  UNAVAILABLE: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400', label: 'Indisponível' },
};

const MOCK_EVENTS = [
  { id: '1', time: '14:02', channel: 'GOOGLE_MEET', eventType: 'SESSION_CREATED', appointmentCode: 'AGD-2026-10243', status: 'SUCCESS' },
  { id: '2', time: '13:58', channel: 'WHATSAPP_BUSINESS', eventType: 'NOTIFICATION_SENT', appointmentCode: 'AGD-2026-10241', status: 'SUCCESS' },
  { id: '3', time: '13:45', channel: 'TEAMS', eventType: 'SESSION_CREATED', appointmentCode: 'AGD-2026-10239', status: 'SUCCESS' },
  { id: '4', time: '13:30', channel: 'GOOGLE_MEET', eventType: 'FALLBACK_TRIGGERED', appointmentCode: 'AGD-2026-10237', status: 'FALLBACK' },
  { id: '5', time: '13:15', channel: 'WHATSAPP_BUSINESS', eventType: 'NOTIFICATION_SENT', appointmentCode: 'AGD-2026-10235', status: 'FAILED' },
];

const MOCK_WEBHOOKS = [
  { id: '1', time: '14:01', provider: 'GOOGLE_MEET', eventType: 'meeting.started', valid: true },
  { id: '2', time: '13:59', provider: 'WHATSAPP_BUSINESS', eventType: 'message.delivered', valid: true },
  { id: '3', time: '13:47', provider: 'TEAMS', eventType: 'meeting.created', valid: true },
  { id: '4', time: '13:32', provider: 'GOOGLE_MEET', eventType: 'meeting.ended', valid: false },
  { id: '5', time: '13:20', provider: 'WHATSAPP_BUSINESS', eventType: 'message.read', valid: true },
];

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  SESSION_CREATED: { label: 'Sessão Criada', color: 'text-teal-400' },
  SESSION_COMPLETED: { label: 'Atendimento Realizado', color: 'text-emerald-400' },
  SESSION_CANCELLED: { label: 'Sessão Cancelada', color: 'text-red-400' },
  NOTIFICATION_SENT: { label: 'Notificação Enviada', color: 'text-sky-400' },
  FALLBACK_TRIGGERED: { label: 'Fallback Ativado', color: 'text-amber-400' },
  PROVIDER_ERROR: { label: 'Erro de Provedor', color: 'text-red-400' },
};

const FALLBACK_CHAIN = [
  { channel: 'GOOGLE_MEET', label: 'Google Meet', priority: 1 },
  { channel: 'TEAMS', label: 'Microsoft Teams', priority: 2 },
  { channel: 'WHATSAPP_BUSINESS', label: 'WhatsApp Business', priority: 3 },
  { channel: 'WEBRTC_NATIVE', label: 'Sala Virtual Aura', priority: 4 },
];

const OmnichannelDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [providerHealth, setProviderHealth] = useState<ProviderHealthStatus[]>(getMockProviderHealth());

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'events' | 'webhooks' | 'config'>('events');

  const refreshHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const health = await getProviderHealth();
      setProviderHealth(health);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 60_000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, [refreshHealth]);

  const statsData = [
    { label: 'Agendados Hoje', value: '18', icon: CalendarIcon, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    { label: 'Realizados', value: '11', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Msgs Entregues', value: '34', icon: Bell, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    { label: 'Falhas', value: '2', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Hero Header ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Comunicação & Teleatendimento</h1>
                <p className="text-sm text-slate-400">ACTG — Aura Communication & Teleattendance Gateway</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <motion.button
              id="actg-refresh-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshHealth}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:border-teal-500/50 transition-all"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
              Atualizar
            </motion.button>
            <motion.button
              id="actg-configure-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/omnichannel-admin')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,rgba(20,184,166,0.25),rgba(14,165,233,0.2))', border: '1px solid rgba(20,184,166,0.35)' }}
            >
              <Settings className="w-3.5 h-3.5 text-teal-400" />
              Configurar
            </motion.button>
          </div>
        </motion.div>

        {/* ── Provider Status Cards ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Status dos Provedores</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(['GOOGLE_MEET', 'TEAMS', 'WHATSAPP_BUSINESS', 'WEBRTC_NATIVE'] as ChannelType[]).map((channelType, i) => {
              const health = providerHealth.find((h) => h.channelType === channelType);
              const status = health?.status ?? 'UNAVAILABLE';
              const styles = STATUS_STYLES[status];
              const Icon = PROVIDER_ICONS[channelType] ?? Video;
              const gradient = PROVIDER_GRADIENTS[channelType];
              const color = PROVIDER_COLORS[channelType];

              return (
                <motion.div
                  key={channelType}
                  id={`provider-card-${channelType}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-4"
                >
                  {/* Top gradient line */}
                  <div className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r', gradient)} />

                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br', gradient)}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium', styles.bg, styles.border, styles.text)}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', status === 'ONLINE' ? 'animate-ping' : '', styles.dot)} />
                        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', styles.dot)} />
                      </span>
                      {styles.label}
                    </div>
                  </div>

                  <p className="font-semibold text-white text-sm">{PROVIDER_LABELS[channelType] ?? channelType}</p>
                  {health?.latencyMs !== undefined && (
                    <p className="text-xs text-slate-500 mt-0.5">{health.latencyMs}ms de latência</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Stats Strip ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {statsData.map(({ label, value, icon: Icon, color, bg, border }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className={cn('rounded-xl border p-4 flex items-center gap-3', bg, border)}
            >
              <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg', bg)}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <div>
                <p className={cn('text-xl font-bold', color)}>{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left: Events / Webhooks */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-700/50">
              {(['events', 'webhooks', 'config'] as const).map((tab) => (
                <button
                  key={tab}
                  id={`actg-tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all',
                    activeTab === tab
                      ? 'text-teal-400 border-b-2 border-teal-400 bg-teal-500/5'
                      : 'text-slate-500 hover:text-slate-300',
                  )}
                >
                  {tab === 'events' ? '📡 Eventos' : tab === 'webhooks' ? '🔗 Webhooks' : '⚙️ Configuração'}
                </button>
              ))}
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'events' && (
                  <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-2">
                      {MOCK_EVENTS.map((event) => {
                        const Icon = PROVIDER_ICONS[event.channel] ?? Video;
                        const eventInfo = EVENT_TYPE_LABELS[event.eventType];
                        return (
                          <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/30">
                            <div className={cn('flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br flex-shrink-0', PROVIDER_GRADIENTS[event.channel] ?? 'from-slate-600 to-slate-700')}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-xs font-medium', eventInfo?.color ?? 'text-slate-300')}>{eventInfo?.label ?? event.eventType}</p>
                              <p className="text-xs text-slate-500 font-mono">{event.appointmentCode}</p>
                            </div>
                            <span className="text-xs text-slate-600 flex-shrink-0">{event.time}</span>
                            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0',
                              event.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400' :
                              event.status === 'FALLBACK' ? 'bg-amber-500/15 text-amber-400' :
                              'bg-red-500/15 text-red-400'
                            )}>
                              {event.status === 'SUCCESS' ? '✓' : event.status === 'FALLBACK' ? '⚡' : '✕'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'webhooks' && (
                  <motion.div key="webhooks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-2">
                      {MOCK_WEBHOOKS.map((wh) => {
                        const Icon = PROVIDER_ICONS[wh.provider] ?? Globe;
                        return (
                          <div key={wh.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/30">
                            <div className={cn('flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br flex-shrink-0', PROVIDER_GRADIENTS[wh.provider] ?? 'from-slate-600 to-slate-700')}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-200 font-mono">{wh.eventType}</p>
                              <p className="text-xs text-slate-500">{PROVIDER_LABELS[wh.provider] ?? wh.provider}</p>
                            </div>
                            <span className="text-xs text-slate-600 flex-shrink-0">{wh.time}</span>
                            <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                              wh.valid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                            )}>
                              {wh.valid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {wh.valid ? 'Válido' : 'Inválido'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'config' && (
                  <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cadeia de Fallback</h3>
                        <p className="text-xs text-slate-500 mb-3">Ordem de prioridade quando o canal principal está indisponível</p>
                        <div className="space-y-2">
                          {FALLBACK_CHAIN.map((item, i) => {
                            const Icon = PROVIDER_ICONS[item.channel] ?? Video;
                            return (
                              <div key={item.channel} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/30">
                                <span className="text-xs font-bold text-slate-600 w-4 text-center">{i + 1}</span>
                                <div className={cn('flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br', PROVIDER_GRADIENTS[item.channel] ?? 'from-slate-600 to-slate-700')}>
                                  <Icon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-slate-200 flex-1">{item.label}</span>
                                {i < FALLBACK_CHAIN.length - 1 && (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-400 font-medium">⚠️ Regra MCSI</p>
                        <p className="text-xs text-amber-300/70 mt-1">Atendimentos com classificação MCSI nível 3 ou 4 nunca têm o canal alterado automaticamente. Requer aprovação institucional.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Quick Actions + Info */}
          <div className="space-y-4">
            {/* Provider summary */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resumo de Saúde</h3>
              <div className="space-y-2">
                {providerHealth.map((health) => (
                  <div key={health.channelType} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{PROVIDER_LABELS[health.channelType] ?? health.channelType}</span>
                    <ProviderHealthBadge health={health} compact />
                  </div>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Princípio ACTG</h3>
              <div className="space-y-2">
                {[
                  { icon: Shield, text: 'Aura é o Sistema de Registro' },
                  { icon: Link2, text: 'Provedores são canais de execução' },
                  { icon: Zap, text: 'Fallback automático por política' },
                  { icon: Bell, text: 'Notificações idempotentes' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span className="text-xs text-slate-400">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OmnichannelDashboard;
