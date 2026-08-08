import type { ActgSession, ProviderHealthStatus, CommunicationPreference, ChannelType, NotificationEventType, NotificationChannel } from '../types/actg.types';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3001';
const ACTG_BASE = `${API_BASE}/api/v1/actg`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('aura_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export async function getProviderHealth(): Promise<ProviderHealthStatus[]> {
  try {
    const res = await fetch(`${ACTG_BASE}/provider-health`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    // Retorna dados mock em modo offline/dev
    return getMockProviderHealth();
  }
}

export async function createAppointmentChannel(
  appointmentId: string,
  channelType: ChannelType,
  options?: { organizerEmail?: string; attendeeEmails?: string[] },
): Promise<ActgSession> {
  const res = await fetch(`${ACTG_BASE}/appointments/${appointmentId}/channels`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ channelType, ...options }),
  });
  if (!res.ok) throw new Error(`Falha ao criar canal: HTTP ${res.status}`);
  return res.json();
}

export async function getAppointmentChannel(appointmentId: string): Promise<ActgSession | null> {
  try {
    const res = await fetch(`${ACTG_BASE}/appointments/${appointmentId}/channels`, { headers: getAuthHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function getJoinUrl(
  appointmentId: string,
  participantId: string,
): Promise<{ joinUrl: string | null }> {
  try {
    const res = await fetch(
      `${ACTG_BASE}/appointments/${appointmentId}/join-url?participantId=${encodeURIComponent(participantId)}`,
      { headers: getAuthHeaders() },
    );
    if (!res.ok) return { joinUrl: null };
    return res.json();
  } catch {
    return { joinUrl: null };
  }
}

export async function cancelAppointmentChannel(appointmentId: string, reason?: string): Promise<void> {
  await fetch(`${ACTG_BASE}/appointments/${appointmentId}/channels`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
}

export async function getCommunicationPreferences(entityId: string): Promise<CommunicationPreference | null> {
  try {
    const res = await fetch(`${ACTG_BASE}/communication/preferences/${entityId}`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateCommunicationPreferences(
  entityId: string,
  prefs: Partial<CommunicationPreference>,
): Promise<CommunicationPreference> {
  const res = await fetch(`${ACTG_BASE}/communication/preferences/${entityId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Mock data for offline/dev mode ────────────────────────────────────────

export function getMockProviderHealth(): ProviderHealthStatus[] {
  return [
    { channelType: 'GOOGLE_MEET', status: 'ONLINE', latencyMs: 142, checkedAt: new Date().toISOString() },
    { channelType: 'TEAMS', status: 'ONLINE', latencyMs: 198, checkedAt: new Date().toISOString() },
    { channelType: 'WHATSAPP_BUSINESS', status: 'ONLINE', latencyMs: 87, checkedAt: new Date().toISOString() },
    { channelType: 'WEBRTC_NATIVE', status: 'ONLINE', latencyMs: 45, checkedAt: new Date().toISOString() },
  ];
}

// ── Admin API (Painel Administrativo) ─────────────────────────────────────

export interface AdminProvider {
  id: string;
  name: string;
  type: string;
  status: string;
  isEnabled: boolean;
  supportsVideo: boolean;
  supportsAudio: boolean;
  supportsChat: boolean;
  supportsNotify: boolean;
  configSchema?: Record<string, unknown>;
  accountsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAccount {
  id: string;
  providerId: string;
  providerName: string;
  name: string;
  environment: string;
  vaultPath: string;
  webhookUrl?: string;
  isActive: boolean;
  lastHealthCheck?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTemplate {
  id: string;
  providerId?: string;
  name: string;
  eventType: string;
  channel: string;
  language: string;
  subject?: string;
  body: string;
  isActive: boolean;
  mcsiMaxLevel: number;
  createdAt: string;
  updatedAt: string;
}

export async function adminGetProviders(): Promise<AdminProvider[]> {
  try {
    const res = await fetch(`${ACTG_BASE}/admin/providers`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return getMockAdminProviders();
  }
}

export async function adminUpdateProvider(id: string, patch: Partial<AdminProvider>): Promise<AdminProvider> {
  try {
    const res = await fetch(`${ACTG_BASE}/admin/providers/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    const providers = getMockAdminProviders();
    const found = providers.find((p) => p.id === id);
    return { ...found!, ...patch, updatedAt: new Date().toISOString() };
  }
}

export async function adminGetAccounts(): Promise<AdminAccount[]> {
  try {
    const res = await fetch(`${ACTG_BASE}/admin/accounts`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return getMockAdminAccounts();
  }
}

export async function adminCreateAccount(data: Omit<AdminAccount, 'id' | 'providerName' | 'createdAt' | 'updatedAt' | 'lastHealthCheck'>): Promise<AdminAccount> {
  try {
    const res = await fetch(`${ACTG_BASE}/admin/accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return { ...data, id: `acc-${Date.now()}`, providerName: data.providerId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

export async function adminUpdateAccount(id: string, patch: Partial<AdminAccount>): Promise<AdminAccount> {
  try {
    const res = await fetch(`${ACTG_BASE}/admin/accounts/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    const accounts = getMockAdminAccounts();
    const found = accounts.find((a) => a.id === id);
    return { ...found!, ...patch, updatedAt: new Date().toISOString() };
  }
}

export async function adminGetTemplates(): Promise<AdminTemplate[]> {
  try {
    const res = await fetch(`${ACTG_BASE}/admin/templates`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return getMockAdminTemplates();
  }
}

export async function adminCreateTemplate(data: Omit<AdminTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminTemplate> {
  try {
    const res = await fetch(`${ACTG_BASE}/admin/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return { ...data, id: `tmpl-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

export async function adminUpdateTemplate(id: string, patch: Partial<AdminTemplate>): Promise<AdminTemplate> {
  try {
    const res = await fetch(`${ACTG_BASE}/admin/templates/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    const templates = getMockAdminTemplates();
    const found = templates.find((t) => t.id === id);
    return { ...found!, ...patch, updatedAt: new Date().toISOString() };
  }
}

// ── Admin Mock Data ────────────────────────────────────────────────────────

export function getMockAdminProviders(): AdminProvider[] {
  return [
    { id: 'prov-google-meet', name: 'Google Meet (Workspace)', type: 'GOOGLE_MEET', status: 'ACTIVE', isEnabled: true, supportsVideo: true, supportsAudio: true, supportsChat: true, supportsNotify: false, configSchema: { calendarId: 'primary' }, accountsCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'prov-teams', name: 'Microsoft Teams (Graph API)', type: 'TEAMS', status: 'ACTIVE', isEnabled: true, supportsVideo: true, supportsAudio: true, supportsChat: true, supportsNotify: false, configSchema: { tenantId: 'string' }, accountsCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'prov-whatsapp', name: 'WhatsApp Business Platform (Meta)', type: 'WHATSAPP_BUSINESS', status: 'ACTIVE', isEnabled: true, supportsVideo: false, supportsAudio: false, supportsChat: true, supportsNotify: true, configSchema: { phoneNumberId: 'string' }, accountsCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'prov-webrtc', name: 'Sala Virtual Aura (Native WebRTC)', type: 'WEBRTC_NATIVE', status: 'ACTIVE', isEnabled: true, supportsVideo: true, supportsAudio: true, supportsChat: true, supportsNotify: false, accountsCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
}

export function getMockAdminAccounts(): AdminAccount[] {
  return [
    { id: 'acc-google-1', providerId: 'prov-google-meet', providerName: 'Google Meet (Workspace)', name: 'Conta Principal Google Workspace', environment: 'PRODUCTION', vaultPath: 'secret/data/aura/prod/google-meet-sa', webhookUrl: 'https://api.aura.org/api/v1/actg/webhooks/GOOGLE_MEET', isActive: true, lastHealthCheck: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'acc-teams-1', providerId: 'prov-teams', providerName: 'Microsoft Teams (Graph API)', name: 'Tenant Principal Office 365', environment: 'PRODUCTION', vaultPath: 'secret/data/aura/prod/teams-app-credentials', webhookUrl: 'https://api.aura.org/api/v1/actg/webhooks/TEAMS', isActive: true, lastHealthCheck: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'acc-whatsapp-1', providerId: 'prov-whatsapp', providerName: 'WhatsApp Business Platform (Meta)', name: 'Conta Institucional Meta Cloud API', environment: 'PRODUCTION', vaultPath: 'secret/data/aura/prod/whatsapp-meta-token', webhookUrl: 'https://api.aura.org/api/v1/actg/webhooks/WHATSAPP_BUSINESS', isActive: true, lastHealthCheck: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
}

export function getMockAdminTemplates(): AdminTemplate[] {
  return [
    { id: 'tmpl-1', name: 'Confirmação de Agendamento (WhatsApp)', eventType: 'APPOINTMENT_CONFIRMED', channel: 'WHATSAPP', language: 'pt_BR', body: 'Olá {name}, seu atendimento foi agendado para {date} às {time} com {professional}. Link: {link}', isActive: true, mcsiMaxLevel: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tmpl-2', name: 'Lembrete 24h (WhatsApp)', eventType: 'REMINDER_24H', channel: 'WHATSAPP', language: 'pt_BR', body: 'Lembrete Aura: Seu atendimento é amanhã, {date} às {time}. Link: {link}', isActive: true, mcsiMaxLevel: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tmpl-3', name: 'Confirmação por E-mail (Neutro)', eventType: 'APPOINTMENT_CONFIRMED', channel: 'EMAIL', language: 'pt_BR', subject: 'Projeto Aura — Agendamento de Atendimento', body: 'Prezado(a) {name},\n\nSeu atendimento foi confirmado para {date} às {time}.\n\nLink: {link}\n\nAtenciosamente,\nEquipe Projeto Aura', isActive: true, mcsiMaxLevel: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tmpl-4', name: 'Cancelamento (E-mail)', eventType: 'APPOINTMENT_CANCELLED', channel: 'EMAIL', language: 'pt_BR', subject: 'Projeto Aura — Atendimento Cancelado', body: 'Prezado(a) {name},\n\nSeu atendimento agendado para {date} foi cancelado.\n\nPara reagendar, acesse o portal Aura.\n\nAtenciosamente,\nEquipe Projeto Aura', isActive: true, mcsiMaxLevel: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
}

