import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils';
import type { ProviderHealthStatus, ChannelType } from '../../types/actg.types';

const PROVIDER_LABELS: Record<string, string> = {
  GOOGLE_MEET: 'Google Meet',
  TEAMS: 'Teams',
  WHATSAPP_BUSINESS: 'WhatsApp',
  WEBRTC_NATIVE: 'Sala Aura',
  ZOOM: 'Zoom',
};

interface ProviderHealthBadgeProps {
  health: ProviderHealthStatus;
  compact?: boolean;
  className?: string;
}

export const ProviderHealthBadge: React.FC<ProviderHealthBadgeProps> = ({ health, compact = false, className }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const statusConfig = {
    ONLINE: { color: 'bg-emerald-400', text: 'text-emerald-400', label: 'Online', icon: Wifi, pulse: true },
    DEGRADED: { color: 'bg-amber-400', text: 'text-amber-400', label: 'Degradado', icon: AlertTriangle, pulse: false },
    UNAVAILABLE: { color: 'bg-red-400', text: 'text-red-400', label: 'Indisponível', icon: WifiOff, pulse: false },
  }[health.status];

  const Icon = statusConfig.icon;

  return (
    <div
      className={cn('relative inline-flex items-center gap-1.5 cursor-default', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="relative flex items-center justify-center">
        <span className={cn('inline-block w-2 h-2 rounded-full', statusConfig.color)} />
        {statusConfig.pulse && (
          <span className={cn('absolute inline-block w-2 h-2 rounded-full animate-ping opacity-75', statusConfig.color)} />
        )}
      </div>
      {!compact && (
        <span className={cn('text-xs font-medium', statusConfig.text)}>
          {PROVIDER_LABELS[health.channelType] ?? health.channelType}
        </span>
      )}

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 p-2 rounded-lg bg-slate-800 border border-slate-700 shadow-xl text-xs"
          >
            <div className="font-semibold text-white mb-1">{PROVIDER_LABELS[health.channelType] ?? health.channelType}</div>
            <div className={cn('font-medium', statusConfig.text)}>{statusConfig.label}</div>
            {health.latencyMs !== undefined && (
              <div className="text-slate-400 mt-1">Latência: {health.latencyMs}ms</div>
            )}
            <div className="text-slate-500 mt-0.5">
              Verificado: {new Date(health.checkedAt).toLocaleTimeString('pt-BR')}
            </div>
            {health.message && (
              <div className="text-red-400 mt-1 truncate">{health.message}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProviderHealthBadge;
