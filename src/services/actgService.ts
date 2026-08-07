import type { ActgSession, ProviderHealthStatus, CommunicationPreference, ChannelType, NotificationEventType, NotificationChannel } from '../types/actg.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
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
