import React, { useState } from 'react';
import {
  Bell, BellOff, AlertCircle, AlertTriangle, Info, CheckCircle2,
  ChevronRight, Trash2, Filter, Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { notifications, type Notification, type NotifPriority } from '../../data/cgi-mock';

const priorityConfig: Record<NotifPriority, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  critical: { label: 'Crítico', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertCircle },
  high: { label: 'Alta', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle },
  normal: { label: 'Normal', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100', icon: Info },
  low: { label: 'Baixa', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: Info },
};

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diffH = Math.round((now.getTime() - d.getTime()) / 1000 / 60 / 60);
  if (diffH < 1) return 'Agora há pouco';
  if (diffH < 24) return `${diffH}h atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function CGINotificacoes() {
  const [items, setItems] = useState<Notification[]>(notifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  const filtered = items.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'critical') return n.priority === 'critical' || n.priority === 'high';
    return true;
  });

  const unreadCount = items.filter(n => !n.read).length;

  function markRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setItems(prev => prev.filter(n => n.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">Central de Notificações</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={markAllRead}
          className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors">
          <CheckCircle2 className="w-4 h-4" /> Marcar todas como lidas
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['all', 'unread', 'critical'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              filter === f
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}>
            {f === 'all' ? 'Todas' : f === 'unread' ? `Não lidas (${unreadCount})` : 'Prioridade Alta'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((n, i) => {
            const cfg = priorityConfig[n.priority];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer',
                  cfg.bg,
                  !n.read && 'shadow-sm ring-1 ring-inset ring-white/50'
                )}
                onClick={() => markRead(n.id)}>
                <div className="shrink-0 mt-0.5">
                  <Icon className={cn('w-5 h-5', cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-semibold', cfg.color, !n.read && 'font-bold')}>{n.title}</p>
                    <span className="text-xs text-slate-400 shrink-0">{formatTimestamp(n.createdAt)}</span>
                  </div>
                  <p className={cn('text-xs mt-1 opacity-80', cfg.color)}>{n.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-medium text-slate-500">{n.module}</span>
                    {!n.read && (
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                    )}
                    {n.actionLabel && (
                      <button className={cn('flex items-center gap-1 text-xs font-semibold', cfg.color, 'hover:underline')}>
                        {n.actionLabel} <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {!n.read && (
                    <button onClick={e => { e.stopPropagation(); markRead(n.id); }}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-700 transition-colors" title="Marcar como lida">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                    className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-red-600 transition-colors" title="Descartar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
            <BellOff className="w-10 h-10 opacity-40" />
            <p className="text-sm">Nenhuma notificação encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
