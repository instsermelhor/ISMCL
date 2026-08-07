import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video, MessageCircle, MapPin, Phone, Shield, Layers,
  ExternalLink, Clock, CheckCircle, AlertCircle, Loader2,
  Calendar, User
} from 'lucide-react';
import { cn } from '../../utils';
import type { ChannelType, ActgSession } from '../../types/actg.types';
import { CHANNEL_CONFIGS } from '../../types/actg.types';
import { getJoinUrl } from '../../services/actgService';

const ICON_MAP: Record<string, React.ElementType> = {
  Video, MessageCircle, MapPin, Phone, Shield, Layers,
};

export interface OneClickJoinProps {
  appointmentId: string;
  participantId: string;
  appointmentDate: string; // e.g. "Hoje"
  appointmentTime: string; // e.g. "15:00"
  professionalName: string;
  specialtyName?: string;
  channelType: ChannelType;
  sessionStatus?: ActgSession['status'];
  onJoin?: () => void;
  className?: string;
  variant?: 'card' | 'inline';
}

function getTimeUntil(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const apt = new Date();
    apt.setHours(h, m, 0, 0);
    const diff = apt.getTime() - now.getTime();
    if (diff <= 0) return 'Em andamento';
    if (diff < 60_000) return 'Agora';
    if (diff < 3_600_000) return `em ${Math.floor(diff / 60_000)} min`;
    const hours = Math.floor(diff / 3_600_000);
    return `em ${hours}h${Math.floor((diff % 3_600_000) / 60_000).toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export const OneClickJoin: React.FC<OneClickJoinProps> = ({
  appointmentId,
  participantId,
  appointmentDate,
  appointmentTime,
  professionalName,
  specialtyName,
  channelType,
  sessionStatus,
  onJoin,
  className,
  variant = 'card',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeUntil, setTimeUntil] = useState(() => getTimeUntil(appointmentTime));

  const config = CHANNEL_CONFIGS[channelType];
  const Icon = ICON_MAP[config?.icon ?? 'Video'] ?? Video;

  useEffect(() => {
    const interval = setInterval(() => setTimeUntil(getTimeUntil(appointmentTime)), 30_000);
    return () => clearInterval(interval);
  }, [appointmentTime]);

  const handleJoin = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Para canais sem sessão externa (presencial, telefone)
      if (channelType === 'IN_PERSON' || channelType === 'PHONE') {
        onJoin?.();
        return;
      }

      // Busca URL segura do backend — verificação de autorização ocorre no servidor
      const { joinUrl } = await getJoinUrl(appointmentId, participantId);

      if (joinUrl) {
        // Registrar tentativa de acesso (auditoria)
        onJoin?.();
        // Abrir em nova aba
        window.open(joinUrl, '_blank', 'noopener,noreferrer');
      } else {
        setError('Link de atendimento não disponível ainda. Tente novamente em alguns instantes.');
      }
    } catch (err) {
      setError('Não foi possível acessar o atendimento. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, participantId, channelType, onJoin]);

  const isUnavailable = sessionStatus === 'CANCELLED' || sessionStatus === 'COMPLETED';
  const isActive = sessionStatus === 'ACTIVE';

  const channelLabel = {
    WHATSAPP_BUSINESS: 'via WhatsApp',
    GOOGLE_MEET: 'pelo Google Meet',
    TEAMS: 'pelo Microsoft Teams',
    IN_PERSON: 'Presencial',
    PHONE: 'por Telefone',
    HYBRID: 'Híbrido',
    WEBRTC_NATIVE: 'pela Sala Aura',
  }[channelType] ?? channelType;

  if (variant === 'inline') {
    return (
      <motion.button
        id={`one-click-join-${appointmentId}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleJoin}
        disabled={isLoading || isUnavailable}
        aria-label={`Entrar no atendimento ${channelLabel}`}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200',
          'text-white shadow-lg',
          isUnavailable ? 'opacity-50 cursor-not-allowed bg-slate-600' : `bg-gradient-to-r ${config?.gradient ?? 'from-teal-500 to-cyan-600'} hover:opacity-90`,
          className,
        )}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        <span>Entrar no Atendimento</span>
        {!isLoading && !isUnavailable && <ExternalLink className="w-3.5 h-3.5 opacity-70" />}
      </motion.button>
    );
  }

  return (
    <motion.div
      id={`one-click-join-card-${appointmentId}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-700/50',
        'bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm',
        'p-4 shadow-xl',
        className,
      )}
    >
      {/* Gradient accent line */}
      <div
        className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r', config?.gradient ?? 'from-teal-500 to-cyan-600')}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br flex-shrink-0',
              config?.gradient ?? 'from-teal-500 to-cyan-600',
            )}
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Atendimento {channelLabel}</p>
            {specialtyName && <p className="text-xs text-slate-500">{specialtyName}</p>}
          </div>
        </div>

        {/* Time badge */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700/50 border border-slate-600/50">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-300 font-medium">{timeUntil}</span>
        </div>
      </div>

      {/* Appointment info */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-white truncate">{professionalName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="text-sm text-slate-300">{appointmentDate} às {appointmentTime}</span>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-3"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Button */}
      <motion.button
        id={`one-click-join-btn-${appointmentId}`}
        whileHover={!isLoading && !isUnavailable ? { scale: 1.02 } : {}}
        whileTap={!isLoading && !isUnavailable ? { scale: 0.97 } : {}}
        onClick={handleJoin}
        disabled={isLoading || isUnavailable}
        aria-label="Entrar no atendimento"
        className={cn(
          'w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl',
          'font-semibold text-sm text-white transition-all duration-200 shadow-lg',
          isUnavailable
            ? 'bg-slate-700/50 cursor-not-allowed text-slate-500'
            : `bg-gradient-to-r ${config?.gradient ?? 'from-teal-500 to-cyan-600'} hover:opacity-90 hover:shadow-xl`,
        )}
        style={!isUnavailable ? {
          boxShadow: `0 4px 20px ${config?.color ?? '#0EA5E9'}40`,
        } : {}}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isUnavailable ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
        <span>
          {isLoading
            ? 'Conectando...'
            : isUnavailable
            ? 'Atendimento Encerrado'
            : 'Entrar no Atendimento'}
        </span>
        {!isLoading && !isUnavailable && <ExternalLink className="w-4 h-4 opacity-70" />}
      </motion.button>

      {/* Security note */}
      {!isUnavailable && (
        <p className="text-center text-xs text-slate-600 mt-2">
          🔒 Acesso seguro verificado pelo Aura
        </p>
      )}
    </motion.div>
  );
};

export default OneClickJoin;
