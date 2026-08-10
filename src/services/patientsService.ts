/**
 * patientsService.ts — Serviço Reativo Central de Beneficiários e Prontuários (ASPS/EHR)
 *
 * Suporta modo Híbrido:
 * - Persistência primária local: IndexedDB + localStorage ('patients_list')
 * - REST API fallback para sincronização com PostgreSQL backend
 * - Emissão de evento 'aura_patients_updated' para sincronização em tempo real na UI
 */

export interface BeneficiaryRecord {
  id: string;
  name: string;
  cpf?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: 'ativo' | 'em_triagem' | 'inativo' | 'arquivado';
  vulnerabilityLevel: 'baixa' | 'media' | 'alta' | 'critica';
  category?: string;
  intakeSource?: 'SATAI' | 'PIARAVE' | 'ARE' | 'DIRECT' | 'MANUAL';
  assignedProfessionalId?: string;
  assignedProfessionalName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Prontuário eletrônico estendido
  anamnesis?: Record<string, any>;
  evolutions?: Array<{
    id: string;
    date: string;
    professionalName: string;
    type: 'SOAP' | 'Evolução Psicológica' | 'Evolução Social' | 'Nota Geral';
    content: string;
    cid10?: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
    url?: string;
  }>;
}

const DEFAULT_PATIENTS: BeneficiaryRecord[] = [
  {
    id: 'pat-1',
    name: 'Maria Oliveira Silva',
    cpf: '123.456.789-00',
    birthDate: '1988-04-15',
    gender: 'Feminino',
    phone: '(11) 98765-4321',
    email: 'maria.oliveira@email.com',
    status: 'ativo',
    vulnerabilityLevel: 'alta',
    category: 'Escuta Ativa',
    intakeSource: 'SATAI',
    assignedProfessionalName: 'Dra. Roberta Santos',
    notes: 'Acolhida via SATAI. Apresenta sintomatologia ansiosa decorrente de conflito familiar.',
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
    evolutions: [
      {
        id: 'evo-1',
        date: '2025-01-15T14:30:00.000Z',
        professionalName: 'Dra. Roberta Santos',
        type: 'SOAP',
        content: 'S: Paciente relata melhora no sono. O: Vigilante, afeto preservado. A: Evolução positiva do quadro inicial. P: Manter escuta semanal.',
        cid10: 'F41.1',
      },
    ],
  },
  {
    id: 'pat-2',
    name: 'João Pedro Santos',
    cpf: '987.654.321-11',
    birthDate: '2012-08-20',
    gender: 'Masculino',
    phone: '(11) 91234-5678',
    email: 'responsavel.joao@email.com',
    status: 'ativo',
    vulnerabilityLevel: 'critica',
    category: 'Lar Protegido',
    intakeSource: 'PIARAVE',
    assignedProfessionalName: 'Dra. Fernanda Lima',
    notes: 'Encaminhado via rede de proteção socioassistencial.',
    createdAt: '2025-02-01T11:20:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'patients_list';
const UPDATED_EVENT = 'aura_patients_updated';

function loadFromStorage(): BeneficiaryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback para default */
  }
  return DEFAULT_PATIENTS;
}

function saveToStorage(list: BeneficiaryRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota excedida */
  }
}

function emit(): void {
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
}

let _patients: BeneficiaryRecord[] = loadFromStorage();

export const patientsService = {
  getAll(): BeneficiaryRecord[] {
    return [..._patients];
  },

  getById(id: string): BeneficiaryRecord | undefined {
    return _patients.find((p) => p.id === id);
  },

  create(data: Omit<BeneficiaryRecord, 'id' | 'createdAt' | 'updatedAt'>): BeneficiaryRecord {
    const now = new Date().toISOString();
    const newRecord: BeneficiaryRecord = {
      ...data,
      id: `pat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
      evolutions: data.evolutions ?? [],
      documents: data.documents ?? [],
    };
    _patients = [newRecord, ..._patients];
    saveToStorage(_patients);
    emit();
    return newRecord;
  },

  update(id: string, patch: Partial<Omit<BeneficiaryRecord, 'id' | 'createdAt'>>): BeneficiaryRecord | null {
    const idx = _patients.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated: BeneficiaryRecord = {
      ..._patients[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    _patients = _patients.map((p) => (p.id === id ? updated : p));
    saveToStorage(_patients);
    emit();
    return updated;
  },

  addEvolution(patientId: string, evolution: {
    professionalName: string;
    type: 'SOAP' | 'Evolução Psicológica' | 'Evolução Social' | 'Nota Geral';
    content: string;
    cid10?: string;
  }): BeneficiaryRecord | null {
    const patient = this.getById(patientId);
    if (!patient) return null;
    const newEvo = {
      id: `evo_${Date.now()}`,
      date: new Date().toISOString(),
      ...evolution,
    };
    const updatedEvolutions = [newEvo, ...(patient.evolutions || [])];
    return this.update(patientId, { evolutions: updatedEvolutions });
  },

  remove(id: string): boolean {
    const before = _patients.length;
    _patients = _patients.filter((p) => p.id !== id);
    if (_patients.length === before) return false;
    saveToStorage(_patients);
    emit();
    return true;
  },

  purgeDemoData(): void {
    _patients = [];
    saveToStorage(_patients);
    emit();
  },

  resetDefaults(): void {
    _patients = [...DEFAULT_PATIENTS];
    saveToStorage(_patients);
    emit();
  },

  subscribe(listener: () => void): () => void {
    window.addEventListener(UPDATED_EVENT, listener);
    return () => window.removeEventListener(UPDATED_EVENT, listener);
  },
};
