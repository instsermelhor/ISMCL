// ACTG — Aura Communication & Teleattendance Gateway
// TypeScript Types — Frontend

export type ChannelType =
  | 'WHATSAPP_BUSINESS'
  | 'GOOGLE_MEET'
  | 'TEAMS'
  | 'IN_PERSON'
  | 'PHONE'
  | 'HYBRID'
  | 'WEBRTC_NATIVE';

export type ProviderType =
  | 'WHATSAPP_BUSINESS'
  | 'GOOGLE_MEET'
  | 'TEAMS'
  | 'ZOOM'
  | 'WEBEX'
  | 'JITSI'
  | 'WEBRTC_NATIVE';

export type ProviderStatus = 'ONLINE' | 'DEGRADED' | 'UNAVAILABLE';

export type NotificationChannel = 'WHATSAPP' | 'EMAIL' | 'SMS' | 'PUSH' | 'PORTAL';

export type NotificationEventType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_CONFIRMED'
  | 'REMINDER_7D'
  | 'REMINDER_24H'
  | 'REMINDER_2H'
  | 'REMINDER_30MIN'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'SESSION_STARTED'
  | 'SESSION_COMPLETED';

export interface CommunicationProvider {
  id: string;
  name: string;
  type: ProviderType;
  isEnabled: boolean;
  supportsVideo: boolean;
  supportsAudio: boolean;
  supportsChat: boolean;
  supportsNotify: boolean;
}

export interface ProviderHealthStatus {
  channelType: ChannelType;
  status: ProviderStatus;
  latencyMs?: number;
  checkedAt: string;
  message?: string;
}

export interface AppointmentChannel {
  id: string;
  appointmentId: string;
  channelType: ChannelType;
  isFallback: boolean;
  originalChannelType?: ChannelType;
  preferenceSource: 'BENEFICIARY' | 'PROFESSIONAL' | 'INSTITUTIONAL' | 'FALLBACK';
  createdAt: string;
}

export interface ExternalMeeting {
  id: string;
  appointmentChannelId: string;
  externalMeetingId: string;
  joinUrl: string;
  providerType: ProviderType;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
  scheduledStart: string;
  scheduledEnd: string;
}

export interface ActgSession {
  sessionId: string;
  appointmentId: string;
  channelType: ChannelType;
  externalMeetingId?: string;
  joinUrl?: string;
  isFallback: boolean;
  originalChannelType?: ChannelType;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'PENDING';
  createdAt: string;
}

export interface CommunicationPreference {
  id: string;
  entityId: string;
  entityType: 'BENEFICIARY' | 'PROFESSIONAL';
  preferredChannel: NotificationChannel;
  fallbackChannels: NotificationChannel[];
  allowWhatsApp: boolean;
  allowEmail: boolean;
  allowSms: boolean;
  allowPush: boolean;
  reminderIntervals: string[];
}

export interface ChannelConfig {
  type: ChannelType;
  label: string;
  shortLabel: string;
  icon: string; // lucide icon name
  description: string;
  color: string;
  gradient: string;
  supportsExternalSession: boolean;
  isAvailable: boolean;
}

export const CHANNEL_CONFIGS: Record<ChannelType, ChannelConfig> = {
  WHATSAPP_BUSINESS: {
    type: 'WHATSAPP_BUSINESS',
    label: 'WhatsApp',
    shortLabel: 'WhatsApp',
    icon: 'MessageCircle',
    description: 'Atendimento via WhatsApp com link de acesso',
    color: '#25D366',
    gradient: 'from-green-500 to-emerald-600',
    supportsExternalSession: false,
    isAvailable: true,
  },
  GOOGLE_MEET: {
    type: 'GOOGLE_MEET',
    label: 'Google Meet',
    shortLabel: 'Meet',
    icon: 'Video',
    description: 'Videochamada pelo Google Meet',
    color: '#00897B',
    gradient: 'from-teal-500 to-cyan-600',
    supportsExternalSession: true,
    isAvailable: true,
  },
  TEAMS: {
    type: 'TEAMS',
    label: 'Microsoft Teams',
    shortLabel: 'Teams',
    icon: 'Video',
    description: 'Videochamada pelo Microsoft Teams',
    color: '#6264A7',
    gradient: 'from-indigo-500 to-purple-600',
    supportsExternalSession: true,
    isAvailable: true,
  },
  IN_PERSON: {
    type: 'IN_PERSON',
    label: 'Presencial',
    shortLabel: 'Presencial',
    icon: 'MapPin',
    description: 'Atendimento presencial na unidade',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-600',
    supportsExternalSession: false,
    isAvailable: true,
  },
  PHONE: {
    type: 'PHONE',
    label: 'Telefone',
    shortLabel: 'Telefone',
    icon: 'Phone',
    description: 'Atendimento por ligação telefônica',
    color: '#6B7280',
    gradient: 'from-gray-500 to-slate-600',
    supportsExternalSession: false,
    isAvailable: true,
  },
  HYBRID: {
    type: 'HYBRID',
    label: 'Híbrido',
    shortLabel: 'Híbrido',
    icon: 'Layers',
    description: 'Combinação de presencial e remoto',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-600',
    supportsExternalSession: false,
    isAvailable: true,
  },
  WEBRTC_NATIVE: {
    type: 'WEBRTC_NATIVE',
    label: 'Sala Virtual Aura',
    shortLabel: 'Sala Aura',
    icon: 'Shield',
    description: 'Videochamada segura pela plataforma Aura',
    color: '#0EA5E9',
    gradient: 'from-sky-500 to-blue-600',
    supportsExternalSession: true,
    isAvailable: true,
  },
};
