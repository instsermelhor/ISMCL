/**
 * professionalsService.ts — Serviço Reativo Central de Profissionais da Equipe Técnica e Voluntários
 */

export interface ProfessionalRecord {
  id: string;
  name: string;
  profession: string;
  councilNumber?: string; // CRP, CRM, CRESS, etc.
  councilState?: string;
  specialty?: string;
  email: string;
  phone?: string;
  status: 'ativo' | 'pendente' | 'inativo' | 'suspenso';
  bondType: 'VOLUNTEER' | 'EMPLOYEE' | 'PARTNER';
  availabilityHours?: number; // Horas semanais
  projects?: string[];
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PROFESSIONALS: ProfessionalRecord[] = [
  {
    id: 'prof-1',
    name: 'Dra. Roberta Santos',
    profession: 'Psicóloga Clínica',
    councilNumber: 'CRP 06/123456',
    councilState: 'SP',
    specialty: 'Psicologia Humanista & Trauma',
    email: 'roberta.santos@institutosermelhor.org',
    phone: '(11) 98888-1111',
    status: 'ativo',
    bondType: 'VOLUNTEER',
    availabilityHours: 12,
    projects: ['Escuta Ativa', 'Lar Protegido'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prof-2',
    name: 'Dra. Fernanda Lima',
    profession: 'Assistente Social',
    councilNumber: 'CRESS 11/654321',
    councilState: 'SP',
    specialty: 'Proteção Social Básica & Especial',
    email: 'fernanda.lima@institutosermelhor.org',
    phone: '(11) 97777-2222',
    status: 'ativo',
    bondType: 'EMPLOYEE',
    availabilityHours: 40,
    projects: ['Lar Protegido', 'Envelhecer Bem', 'Cuidar+'],
    createdAt: '2024-02-15T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prof-3',
    name: 'Dr. João Paulo Silva',
    profession: 'Médico Geriatra',
    councilNumber: 'CRM 145890-SP',
    councilState: 'SP',
    specialty: 'Gerontologia & Cuidados Paliativos',
    email: 'joao.silva@institutosermelhor.org',
    phone: '(11) 96666-3333',
    status: 'ativo',
    bondType: 'VOLUNTEER',
    availabilityHours: 8,
    projects: ['Envelhecer Bem'],
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'professionals_list';
const UPDATED_EVENT = 'aura_professionals_updated';

function loadFromStorage(): ProfessionalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_PROFESSIONALS;
}

function saveToStorage(list: ProfessionalRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* error */
  }
}

function emit(): void {
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
}

let _professionals: ProfessionalRecord[] = loadFromStorage();

export const professionalsService = {
  getAll(): ProfessionalRecord[] {
    return [..._professionals];
  },

  getById(id: string): ProfessionalRecord | undefined {
    return _professionals.find((p) => p.id === id);
  },

  create(data: Omit<ProfessionalRecord, 'id' | 'createdAt' | 'updatedAt'>): ProfessionalRecord {
    const now = new Date().toISOString();
    const newRecord: ProfessionalRecord = {
      ...data,
      id: `prof_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
      projects: data.projects ?? [],
    };
    _professionals = [newRecord, ..._professionals];
    saveToStorage(_professionals);
    emit();
    return newRecord;
  },

  update(id: string, patch: Partial<Omit<ProfessionalRecord, 'id' | 'createdAt'>>): ProfessionalRecord | null {
    const idx = _professionals.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated: ProfessionalRecord = {
      ..._professionals[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    _professionals = _professionals.map((p) => (p.id === id ? updated : p));
    saveToStorage(_professionals);
    emit();
    return updated;
  },

  remove(id: string): boolean {
    const before = _professionals.length;
    _professionals = _professionals.filter((p) => p.id !== id);
    if (_professionals.length === before) return false;
    saveToStorage(_professionals);
    emit();
    return true;
  },

  purgeDemoData(): void {
    _professionals = [];
    saveToStorage(_professionals);
    emit();
  },

  resetDefaults(): void {
    _professionals = [...DEFAULT_PROFESSIONALS];
    saveToStorage(_professionals);
    emit();
  },

  subscribe(listener: () => void): () => void {
    window.addEventListener(UPDATED_EVENT, listener);
    return () => window.removeEventListener(UPDATED_EVENT, listener);
  },
};
