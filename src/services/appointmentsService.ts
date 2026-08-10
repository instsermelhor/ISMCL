/**
 * appointmentsService.ts — Serviço Reativo Central de Agendamentos e Teleatendimento
 */

export interface AppointmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  type: 'Presencial' | 'Teleconsulta' | 'Visita Domiciliar' | 'Grupo de Apoio';
  status: 'agendado' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'falta';
  channelType?: 'WHATSAPP_BUSINESS' | 'GOOGLE_MEET' | 'TEAMS' | 'WEBRTC_NATIVE' | 'IN_PERSON';
  meetingUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: 'apt-1',
    patientId: 'pat-1',
    patientName: 'Maria Oliveira Silva',
    professionalId: 'prof-1',
    professionalName: 'Dra. Roberta Santos',
    date: new Date().toISOString().split('T')[0],
    time: '14:30',
    durationMinutes: 50,
    type: 'Teleconsulta',
    status: 'confirmado',
    channelType: 'GOOGLE_MEET',
    meetingUrl: 'https://meet.google.com/aura-escuta-ativa',
    notes: 'Sessão de acompanhamento semanal — Escuta Ativa.',
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt-2',
    patientId: 'pat-2',
    patientName: 'João Pedro Santos',
    professionalId: 'prof-2',
    professionalName: 'Dra. Fernanda Lima',
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    durationMinutes: 60,
    type: 'Presencial',
    status: 'agendado',
    channelType: 'IN_PERSON',
    notes: 'Acolhimento familiar inicial — Lar Protegido.',
    createdAt: '2025-02-01T11:20:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'appointments_list';
const UPDATED_EVENT = 'aura_appointments_updated';

function loadFromStorage(): AppointmentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_APPOINTMENTS;
}

function saveToStorage(list: AppointmentRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* error */
  }
}

function emit(): void {
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
}

let _appointments: AppointmentRecord[] = loadFromStorage();

export const appointmentsService = {
  getAll(): AppointmentRecord[] {
    return [..._appointments];
  },

  getById(id: string): AppointmentRecord | undefined {
    return _appointments.find((a) => a.id === id);
  },

  create(data: Omit<AppointmentRecord, 'id' | 'createdAt' | 'updatedAt'>): AppointmentRecord {
    const now = new Date().toISOString();
    const newRecord: AppointmentRecord = {
      ...data,
      id: `apt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    _appointments = [newRecord, ..._appointments];
    saveToStorage(_appointments);
    emit();
    return newRecord;
  },

  update(id: string, patch: Partial<Omit<AppointmentRecord, 'id' | 'createdAt'>>): AppointmentRecord | null {
    const idx = _appointments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const updated: AppointmentRecord = {
      ..._appointments[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    _appointments = _appointments.map((a) => (a.id === id ? updated : a));
    saveToStorage(_appointments);
    emit();
    return updated;
  },

  remove(id: string): boolean {
    const before = _appointments.length;
    _appointments = _appointments.filter((a) => a.id !== id);
    if (_appointments.length === before) return false;
    saveToStorage(_appointments);
    emit();
    return true;
  },

  purgeDemoData(): void {
    _appointments = [];
    saveToStorage(_appointments);
    localStorage.removeItem(STORAGE_KEY);
    emit();
  },

  resetDefaults(): void {
    _appointments = [...DEFAULT_APPOINTMENTS];
    saveToStorage(_appointments);
    emit();
  },

  subscribe(listener: () => void): () => void {
    window.addEventListener(UPDATED_EVENT, listener);
    return () => window.removeEventListener(UPDATED_EVENT, listener);
  },
};
