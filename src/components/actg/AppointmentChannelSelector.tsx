import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Video, MessageCircle, MapPin, Phone, Layers, Shield,
  CheckCircle2, Lock
} from 'lucide-react';
import { cn } from '../../utils';
import type { ChannelType } from '../../types/actg.types';
import { CHANNEL_CONFIGS } from '../../types/actg.types';

const ICON_MAP: Record<string, React.ElementType> = {
  Video, MessageCircle, MapPin, Phone, Layers, Shield,
};

interface AppointmentChannelSelectorProps {
  availableChannels: ChannelType[];
  selectedChannel: ChannelType | null;
  onSelect: (channel: ChannelType) => void;
  disabled?: boolean;
  size?: 'default' | 'compact';
  className?: string;
}

export const AppointmentChannelSelector: React.FC<AppointmentChannelSelectorProps> = ({
  availableChannels,
  selectedChannel,
  onSelect,
  disabled = false,
  size = 'default',
  className,
}) => {
  const channelsToShow = availableChannels.length > 0
    ? availableChannels
    : (['GOOGLE_MEET', 'TEAMS', 'WHATSAPP_BUSINESS', 'IN_PERSON'] as ChannelType[]);

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
        Modalidade do Atendimento
      </p>
      <div className={cn(
        'grid gap-2',
        size === 'compact' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2',
      )}>
        {channelsToShow.map((channelType) => {
          const config = CHANNEL_CONFIGS[channelType];
          if (!config) return null;
          const Icon = ICON_MAP[config.icon] ?? Video;
          const isSelected = selectedChannel === channelType;
          const isAvailable = config.isAvailable && !disabled;

          return (
            <motion.button
              key={channelType}
              id={`channel-selector-${channelType}`}
              whileHover={isAvailable ? { scale: 1.02 } : {}}
              whileTap={isAvailable ? { scale: 0.98 } : {}}
              onClick={() => isAvailable && onSelect(channelType)}
              disabled={!isAvailable}
              aria-pressed={isSelected}
              aria-label={`Selecionar ${config.label} como canal de atendimento`}
              className={cn(
                'relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                size === 'compact' ? 'p-2.5' : 'p-3',
                isSelected
                  ? `border-2 bg-white/5`
                  : 'border border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60',
                !isAvailable && 'opacity-50 cursor-not-allowed',
              )}
              style={isSelected ? { borderColor: config.color, boxShadow: `0 0 0 1px ${config.color}20, 0 4px 24px ${config.color}15` } : {}}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex-shrink-0 flex items-center justify-center rounded-lg',
                  size === 'compact' ? 'w-8 h-8' : 'w-9 h-9',
                  `bg-gradient-to-br ${config.gradient}`,
                )}
              >
                {isAvailable ? (
                  <Icon className="w-4 h-4 text-white" />
                ) : (
                  <Lock className="w-4 h-4 text-white/60" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium leading-tight truncate',
                  size === 'compact' ? 'text-xs' : 'text-sm',
                  isSelected ? 'text-white' : 'text-slate-200',
                )}>
                  {config.label}
                </p>
                {size !== 'compact' && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">{config.description}</p>
                )}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" style={{ color: config.color }} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default AppointmentChannelSelector;
