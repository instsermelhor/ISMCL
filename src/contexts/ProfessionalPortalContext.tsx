/**
 * ProfessionalPortalContext — Módulo 10
 * Portal do Profissional, Central do Voluntário e Workspace Clínico
 * Instituto Ser Melhor — Projeto Aura
 *
 * Gerencia estado, dados mock e regras de negócio do Workspace Clínico e Central do Voluntário.
 * Integra-se ao MCSI e regras de segurança institucional.
 */

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSecurity } from './SecurityContext';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type ProfessionalRole =
  | 'PSICOLOGO'
  | 'PSIQUIATRA'
  | 'ASSISTENTE_SOCIAL'
  | 'ADVOGADO'
  | 'PEDAGOGO'
  | 'MEDICO'
  | 'ENFERMEIRO'
  | 'COORDENADOR'
  | 'VOLUNTARIO';

export interface ProfessionalProfileData {
  id: string;
  name: string;
  profession: string;
  role: ProfessionalRole;
  councilCode?: string; // ex: CRP 06/12345, CRM-SP 98765
  bondType: 'VOLUNTEER' | 'EMPLOYEE' | 'PARTNER';
  email: string;
  phone: string;
  avatar: string;
  stats: {
    hoursDonatedTotal: number;
    hoursDonatedMonth: number;
    activeCases: number;
    attendanceRate: number; // ex: 98
    documentsSigned: number;
    capacitacionesConcluidas: number;
  };
}

export interface ClinicalAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  time: string;
  date: string;
  type: 'ONLINE' | 'PRESENCIAL';
  status: 'CONFIRMED' | 'COMPLETED' | 'PENDING' | 'CANCELLED';
  telehealthUrl?: string;
  sensitivityLevel: 0 | 1 | 2 | 3 | 4;
}

export interface PatientEvolution {
  id: string;
  date: string;
  authorName: string;
  authorRole: string;
  content: string;
  diagnosticsCode?: string; // CID-10
  isSigned: boolean;
  signedAt?: string;
  auditHash?: string;
}

export interface CareGoal {
  id: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED';
  dueDate?: string;
}

export interface PatientCarePlan {
  objectives: string[];
  orientations: string[];
  goals: CareGoal[];
  lastUpdated: string;
  updatedBy: string;
}

export interface ClinicalRecord {
  id: string;
  name: string;
  code: string; // ISM-XXXXXX
  birthDate: string;
  cpf: string;
  gender: string;
  sensitivityLevel: 0 | 1 | 2 | 3 | 4;
  isProtected: boolean;
  specialCategory?: string;
  evolutions: PatientEvolution[];
  carePlan: PatientCarePlan;
  activePrograms: string[];
}

export interface ProfessionalDocument {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  type: 'RECEITA' | 'ATESTADO' | 'DECLARACAO' | 'ENCAMINHAMENTO' | 'LAUDO' | 'RELATORIO';
  content: string;
  issuedAt: string;
  status: 'AWAITING_SIGNATURE' | 'SIGNED';
  signedAt?: string;
  hash?: string;
}

export interface SecureThreadMessage {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  sentAt: string;
}

export interface SecureMessageThread {
  id: string;
  subject: string;
  category: 'MULTIDISCIPLINAR' | 'COORDENACAO' | 'ADMINISTRATIVO';
  lastActivity: string;
  unread: boolean;
  participants: string[];
  messages: SecureThreadMessage[];
}

export interface VolunteerHoursEntry {
  id: string;
  date: string;
  hours: number;
  activity: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface VolunteerAvailability {
  dayOfWeek: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO';
  period: 'MANHA' | 'TARDE' | 'NOITE';
}

export interface VolunteerCertificate {
  id: string;
  title: string;
  issuedAt: string;
  hours: number;
  downloadUrl: string;
}

export interface LMSCourse {
  id: string;
  title: string;
  category: 'TECNICO' | 'PROTOCOLO' | 'INTEGRACAO';
  progress: number; // 0-100
  durationHours: number;
  nextLesson?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  category: 'MANUAL' | 'LEGISLACAO' | 'CONSELHO' | 'CIENTIFICO';
  author: string;
  downloadUrl: string;
  size: string;
}

export interface AdminRequest {
  id: string;
  category: 'FERIAS' | 'LICENCA' | 'SUPORTE' | 'CADASTRO' | 'MATERIAIS' | 'SUGESTAO';
  title: string;
  description: string;
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'RECUSADO';
  createdAt: string;
  updatedAt: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'copilot';
  content: string;
  sentAt: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PROFESSIONAL: ProfessionalProfileData = {
  id: 'prof-001',
  name: 'Dra. Elena Silva',
  profession: 'Psicóloga Clínica',
  role: 'PSICOLOGO',
  councilCode: 'CRP 06/12345',
  bondType: 'VOLUNTEER',
  email: 'elena.silva@institutosermelhor.org',
  phone: '(11) 98765-4321',
  avatar: 'https://i.pravatar.cc/150?u=1',
  stats: {
    hoursDonatedTotal: 120,
    hoursDonatedMonth: 12,
    activeCases: 3,
    attendanceRate: 98,
    documentsSigned: 45,
    capacitacionesConcluidas: 4,
  },
};

const MOCK_APPOINTMENTS: ClinicalAppointment[] = [
  { id: 'apt-101', patientId: 'pat-001', patientName: 'Maria Conceição Silva', patientCode: 'ISM-0000001092', time: '14:00', date: '2026-06-29', type: 'ONLINE', status: 'CONFIRMED', telehealthUrl: '/telehealth/apt-101', sensitivityLevel: 3 },
  { id: 'apt-102', patientId: 'pat-002', patientName: 'João Antônio Ramos', patientCode: 'ISM-0000002458', time: '15:30', date: '2026-06-29', type: 'ONLINE', status: 'PENDING', telehealthUrl: '/telehealth/apt-102', sensitivityLevel: 2 },
  { id: 'apt-103', patientId: 'pat-003', patientName: 'Fernanda Oliveira', patientCode: 'ISM-0000003701', time: '17:00', date: '2026-06-29', type: 'PRESENCIAL', status: 'CONFIRMED', sensitivityLevel: 4 },
];

const MOCK_PATIENT_RECORDS: ClinicalRecord[] = [
  {
    id: 'pat-001',
    name: 'Maria Conceição Silva',
    code: 'ISM-0000001092',
    birthDate: '1988-05-12',
    cpf: '123.456.789-01',
    gender: 'Feminino',
    sensitivityLevel: 3,
    isProtected: true,
    specialCategory: 'VITIMA_VIOLENCIA_DOMESTICA',
    activePrograms: ['Saúde Mental Comunitária', 'Cuidado Psicológico Intensivo'],
    evolutions: [
      {
        id: 'ev-001',
        date: '2026-06-15T14:30:00Z',
        authorName: 'Dra. Elena Silva',
        authorRole: 'Psicóloga',
        content: 'Paciente compareceu relatando melhora nos episódios de ansiedade aguda. Refere uso sistemático das técnicas de ancoragem ensinadas. Conflito familiar persiste, porém com maior distanciamento cognitivo e atitude protetiva.',
        diagnosticsCode: 'F41.1',
        isSigned: true,
        signedAt: '2026-06-15T15:15:00Z',
        auditHash: 'sha256-a1b2c3d4e5f6',
      },
    ],
    carePlan: {
      objectives: [
        'Mitigação de sintomas ansiosos severos e crises de pânico.',
        'Desenvolvimento de estratégias robustas de autodefesa emocional e empoderamento.',
      ],
      orientations: [
        'Praticar ancoragem sensorial 5-4-3-2-1 ao primeiro sinal de ansiedade física.',
        'Manter distanciamento do agressor conforme ordem judicial.',
      ],
      goals: [
        { id: 'goal-1', description: 'Reduzir ataques de pânico para zero.', status: 'IN_PROGRESS', dueDate: '2026-08-30' },
        { id: 'goal-2', description: 'Estabelecer rotina diária estável.', status: 'ACHIEVED' },
      ],
      lastUpdated: '2026-06-15T15:15:00Z',
      updatedBy: 'Dra. Elena Silva',
    },
  },
  {
    id: 'pat-002',
    name: 'João Antônio Ramos',
    code: 'ISM-0000002458',
    birthDate: '2014-10-22',
    cpf: '987.654.321-00',
    gender: 'Masculino',
    sensitivityLevel: 2,
    isProtected: true,
    specialCategory: 'MENOR_ECA',
    activePrograms: ['Apoio Pedagógico e Psicológico Infantil'],
    evolutions: [
      {
        id: 'ev-002',
        date: '2026-06-18T10:00:00Z',
        authorName: 'Dra. Elena Silva',
        authorRole: 'Psicóloga',
        content: 'Sessão lúdica. João demonstrou melhor integração social nas atividades propostas. Apresenta melhora na concentração escolar, porém reage com agressividade quando contrariado por figuras masculinas.',
        diagnosticsCode: 'F91.3',
        isSigned: true,
        signedAt: '2026-06-18T11:00:00Z',
        auditHash: 'sha256-x9y8z7w6v5u4',
      },
    ],
    carePlan: {
      objectives: [
        'Expressão emocional adequada de frustração.',
        'Melhora nas relações com figuras de autoridade escolar.',
      ],
      orientations: [
        'Trabalhar com a mãe reforços positivos de comportamento em casa.',
        'Evitar exposição a mídias violentas.',
      ],
      goals: [
        { id: 'goal-3', description: 'Reduzir reações agressivas na escola.', status: 'IN_PROGRESS', dueDate: '2026-07-31' },
      ],
      lastUpdated: '2026-06-18T11:00:00Z',
      updatedBy: 'Dra. Elena Silva',
    },
  },
  {
    id: 'pat-003',
    name: 'Fernanda Oliveira',
    code: 'ISM-0000003701',
    birthDate: '1975-02-28',
    cpf: '456.789.123-04',
    gender: 'Feminino',
    sensitivityLevel: 4,
    isProtected: true,
    specialCategory: 'SERVIDOR_INTELIGENCIA',
    activePrograms: ['Apoio Psicossocial Sigiloso'],
    evolutions: [],
    carePlan: {
      objectives: ['Desenvolvimento de coping para estresse ocupacional extremo.'],
      orientations: ['Técnicas de relaxamento progressivo de Jacobson.'],
      goals: [],
      lastUpdated: '2026-06-10T17:00:00Z',
      updatedBy: 'Coordenação Clínica',
    },
  },
];

const MOCK_DOCUMENTS: ProfessionalDocument[] = [
  {
    id: 'doc-101',
    patientId: 'pat-001',
    patientName: 'Maria Conceição Silva',
    title: 'Atestado de Acompanhamento Psicológico',
    type: 'ATESTADO',
    content: 'Atesto, para os devidos fins de comprovação de acompanhamento psicoterapêutico, que Maria Conceição Silva comparece regularmente às sessões semanais de psicoterapia neste Instituto.',
    issuedAt: '2026-06-29T14:30:00Z',
    status: 'AWAITING_SIGNATURE',
  },
  {
    id: 'doc-102',
    patientId: 'pat-002',
    patientName: 'João Antônio Ramos',
    title: 'Declaração para Escola Municipal',
    type: 'DECLARACAO',
    content: 'Declaramos que o menor João Antônio Ramos realiza acompanhamento clínico infantil multiprofissional às quintas-feiras no período matutino.',
    issuedAt: '2026-06-29T14:45:00Z',
    status: 'AWAITING_SIGNATURE',
  },
];

const MOCK_THREADS: SecureMessageThread[] = [
  {
    id: 'th-1',
    subject: 'Caso Maria Conceição — Alinhamento Jurídico/Psicologia',
    category: 'MULTIDISCIPLINAR',
    lastActivity: '2026-06-28T16:00:00Z',
    unread: true,
    participants: ['Dra. Elena Silva (Psicóloga)', 'Dr. Marcos Lima (Advogado)'],
    messages: [
      { id: 'tm-1', senderName: 'Dr. Marcos Lima', senderRole: 'Advogado', content: 'Prezada Elena, a medida protetiva de afastamento da Maria foi renovada judicialmente por mais 6 meses. Caso ela demonstre qualquer receio nas sessões clínicas, por favor me acione imediatamente.', sentAt: '2026-06-28T15:45:00Z' },
      { id: 'tm-2', senderName: 'Dra. Elena Silva', senderRole: 'Psicóloga', content: 'Excelente notícia, Marcos. Ela demonstrou bastante alívio na última sessão, mas continuaremos focadas nas diretrizes de autodefesa física e emocional.', sentAt: '2026-06-28T16:00:00Z' },
    ],
  },
  {
    id: 'th-2',
    subject: 'Supervisão Geral de Psicologia',
    category: 'COORDENACAO',
    lastActivity: '2026-06-27T10:00:00Z',
    unread: false,
    participants: ['Dra. Elena Silva (Psicóloga)', 'Dra. Ana Paula (Coordenadora)'],
    messages: [
      { id: 'tm-3', senderName: 'Dra. Ana Paula', senderRole: 'Coordenadora', content: 'Lembrete: nossa reunião técnica de supervisão clínica mensal será nesta quarta às 09h.', sentAt: '2026-06-27T10:00:00Z' },
    ],
  },
];

const MOCK_VOLUNTEER_HOURS: VolunteerHoursEntry[] = [
  { id: 'vh-1', date: '2026-06-22', hours: 4, activity: 'Sessões clínicas de psicoterapia individual', status: 'APPROVED' },
  { id: 'vh-2', date: '2026-06-15', hours: 4, activity: 'Sessões clínicas e reunião de equipe', status: 'APPROVED' },
  { id: 'vh-3', date: '2026-06-08', hours: 4, activity: 'Sessões clínicas individuais', status: 'APPROVED' },
  { id: 'vh-4', date: '2026-06-29', hours: 4, activity: 'Sessões clínicas agendadas para hoje', status: 'PENDING' },
];

const MOCK_CERTIFICATES: VolunteerCertificate[] = [
  { id: 'cert-1', title: 'Declaração Anual de Voluntariado 2025', issuedAt: '2025-12-31', hours: 144, downloadUrl: '#' },
  { id: 'cert-2', title: 'Certificado de Integração e Acolhimento Social', issuedAt: '2025-02-20', hours: 8, downloadUrl: '#' },
];

const MOCK_COURSES: LMSCourse[] = [
  { id: 'crs-1', title: 'Protocolo de Acolhimento em Crise de Saúde Mental', category: 'PROTOCOLO', progress: 100, durationHours: 12 },
  { id: 'crs-2', title: 'Princípios Éticos e Sigilo no Atendimento de Proteção', category: 'TECNICO', progress: 75, durationHours: 8, nextLesson: 'Módulo 4: Casos Judiciais e o ECA' },
  { id: 'crs-3', title: 'Ferramentas do Workspace Digital Aura', category: 'INTEGRACAO', progress: 20, durationHours: 4, nextLesson: 'Módulo 2: Emissão e Assinatura Eletrônica' },
];

const MOCK_LIBRARY: LibraryItem[] = [
  { id: 'lib-1', title: 'Código de Ética Profissional dos Psicólogos', category: 'CONSELHO', author: 'Conselho Federal de Psicologia', downloadUrl: '#', size: '1.2 MB' },
  { id: 'lib-2', title: 'Diretrizes Clínicas de Manejo de Transtornos de Ansiedade', category: 'CIENTIFICO', author: 'Organização Mundial da Saúde', downloadUrl: '#', size: '2.4 MB' },
  { id: 'lib-3', title: 'Manual Prático de Segurança MCSI e Prontuário Digital', category: 'MANUAL', author: 'Comitê de TI Instituto Ser Melhor', downloadUrl: '#', size: '840 KB' },
];

const MOCK_REQUESTS: AdminRequest[] = [
  { id: 'req-201', category: 'SUPORTE', title: 'Problema na câmera do Consultório 3', description: 'Webcam externa está intermitente durante as chamadas de teleconsulta.', status: 'CONCLUIDO', createdAt: '2026-06-10T09:00:00Z', updatedAt: '2026-06-11T16:00:00Z' },
  { id: 'req-202', category: 'MATERIAIS', title: 'Solicitação de Testes Psicológicos HTP', description: 'Aquisição de folhas de aplicação adicionais para o consultório infantil.', status: 'ABERTO', createdAt: '2026-06-28T11:00:00Z', updatedAt: '2026-06-28T11:00:00Z' },
];

// ─── Context ─────────────────────────────────────────────────────────────────

interface ProfessionalPortalContextType {
  professional: ProfessionalProfileData;
  appointments: ClinicalAppointment[];
  records: ClinicalRecord[];
  documents: ProfessionalDocument[];
  threads: SecureMessageThread[];
  hoursList: VolunteerHoursEntry[];
  certificates: VolunteerCertificate[];
  courses: LMSCourse[];
  library: LibraryItem[];
  requests: AdminRequest[];
  copilotMessages: CopilotMessage[];
  // Clínico
  addEvolution: (patientId: string, content: string, diagnosticsCode?: string) => void;
  updateCarePlan: (patientId: string, plan: PatientCarePlan) => void;
  issueDocument: (patientId: string, type: ProfessionalDocument['type'], title: string, content: string) => void;
  signDocument: (docId: string) => void;
  signBatch: (docIds: string[]) => void;
  // Voluntariado
  logHours: (date: string, hours: number, activity: string) => void;
  // Adm
  submitRequest: (category: AdminRequest['category'], title: string, description: string) => void;
  // Comunicação
  replyThread: (threadId: string, content: string) => void;
  createThread: (subject: string, category: SecureMessageThread['category'], firstMessage: string) => void;
  // Copiloto IA
  askCopilot: (query: string) => Promise<void>;
  isCopilotTyping: boolean;
}

const ProfessionalPortalContext = createContext<ProfessionalPortalContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ProfessionalPortalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { logAction } = useSecurity();

  const [appointments, setAppointments] = useState<ClinicalAppointment[]>(MOCK_APPOINTMENTS);
  const [records, setRecords] = useState<ClinicalRecord[]>(MOCK_PATIENT_RECORDS);
  const [documents, setDocuments] = useState<ProfessionalDocument[]>(MOCK_DOCUMENTS);
  const [threads, setThreads] = useState<SecureMessageThread[]>(MOCK_THREADS);
  const [hoursList, setHoursList] = useState<VolunteerHoursEntry[]>(MOCK_VOLUNTEER_HOURS);
  const [requests, setRequests] = useState<AdminRequest[]>(MOCK_REQUESTS);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'cp-init',
      sender: 'copilot',
      content: 'Olá, Dra. Elena. Sou seu Copiloto Clínico Inteligente. Posso te ajudar a resumir prontuários, sugerir estruturas de evolução clínica, checar seus compromissos do dia ou localizar protocolos institucionais.',
      sentAt: new Date().toISOString(),
    },
  ]);
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  // Ações Clínicas
  const addEvolution = useCallback((patientId: string, content: string, diagnosticsCode?: string) => {
    const auditHash = `sha256-${Math.random().toString(36).substring(2, 15)}`;
    const newEvolution: PatientEvolution = {
      id: `ev-${Date.now()}`,
      date: new Date().toISOString(),
      authorName: MOCK_PROFESSIONAL.name,
      authorRole: MOCK_PROFESSIONAL.profession,
      content,
      diagnosticsCode,
      isSigned: true,
      signedAt: new Date().toISOString(),
      auditHash,
    };

    setRecords((prev) =>
      prev.map((rec) =>
        rec.id === patientId ? { ...rec, evolutions: [newEvolution, ...rec.evolutions] } : rec
      )
    );

    // Registro no audit vault do MCSI
    logAction({
      userId: user?.email ?? '—',
      userName: user?.name ?? '—',
      action: 'EDIT',
      targetId: patientId,
      description: `Registrou evolução clínica. Hash de auditoria: ${auditHash}`,
      ipAddress: '192.168.1.100',
      device: navigator.userAgent,
      sensitivityLevel: 3, // Nível médio/alto
    });
  }, [user, logAction]);

  const updateCarePlan = useCallback((patientId: string, plan: PatientCarePlan) => {
    setRecords((prev) =>
      prev.map((rec) =>
        rec.id === patientId ? { ...rec, carePlan: plan } : rec
      )
    );

    logAction({
      userId: user?.email ?? '—',
      userName: user?.name ?? '—',
      action: 'EDIT',
      targetId: patientId,
      description: 'Atualizou o Plano Individual de Cuidado (PIC)',
      ipAddress: '192.168.1.100',
      device: navigator.userAgent,
      sensitivityLevel: 2,
    });
  }, [user, logAction]);

  const issueDocument = useCallback((patientId: string, type: ProfessionalDocument['type'], title: string, content: string) => {
    const newDoc: ProfessionalDocument = {
      id: `doc-${Date.now()}`,
      patientId,
      patientName: records.find((r) => r.id === patientId)?.name ?? 'Paciente Desconhecido',
      title,
      type,
      content,
      issuedAt: new Date().toISOString(),
      status: 'AWAITING_SIGNATURE',
    };
    setDocuments((prev) => [newDoc, ...prev]);
  }, [records]);

  const signDocument = useCallback((docId: string) => {
    const signHash = `sign-sha256-${Math.random().toString(36).substring(2, 15)}`;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'SIGNED',
              signedAt: new Date().toISOString(),
              hash: signHash,
            }
          : d
      )
    );

    logAction({
      userId: user?.email ?? '—',
      userName: user?.name ?? '—',
      action: 'BREAK_GLASS', // Assinatura eletrônica exige autoridade
      targetId: docId,
      description: `Assinou digitalmente o documento ${docId}. Assinatura: ${signHash}`,
      ipAddress: '192.168.1.100',
      device: navigator.userAgent,
    });
  }, [user, logAction]);

  const signBatch = useCallback((docIds: string[]) => {
    docIds.forEach((id) => signDocument(id));
  }, [signDocument]);

  // Ações de Voluntário
  const logHours = useCallback((date: string, hours: number, activity: string) => {
    const newEntry: VolunteerHoursEntry = {
      id: `vh-${Date.now()}`,
      date,
      hours,
      activity,
      status: 'PENDING',
    };
    setHoursList((prev) => [newEntry, ...prev]);
  }, []);

  // Solicitações administrativas
  const submitRequest = useCallback((category: AdminRequest['category'], title: string, description: string) => {
    const newRequest: AdminRequest = {
      id: `req-${Date.now()}`,
      category,
      title,
      description,
      status: 'ABERTO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRequests((prev) => [newRequest, ...prev]);
  }, []);

  // Comunicação interna
  const replyThread = useCallback((threadId: string, content: string) => {
    const newMsg: SecureThreadMessage = {
      id: `tm-${Date.now()}`,
      senderName: MOCK_PROFESSIONAL.name,
      senderRole: MOCK_PROFESSIONAL.profession,
      content,
      sentAt: new Date().toISOString(),
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              lastActivity: new Date().toISOString(),
              unread: false,
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );
  }, []);

  const createThread = useCallback((subject: string, category: SecureMessageThread['category'], firstMessage: string) => {
    const newThread: SecureMessageThread = {
      id: `th-${Date.now()}`,
      subject,
      category,
      lastActivity: new Date().toISOString(),
      unread: false,
      participants: [MOCK_PROFESSIONAL.name, 'Equipe Técnica Geral'],
      messages: [
        {
          id: `tm-${Date.now()}`,
          senderName: MOCK_PROFESSIONAL.name,
          senderRole: MOCK_PROFESSIONAL.profession,
          content: firstMessage,
          sentAt: new Date().toISOString(),
        },
      ],
    };
    setThreads((prev) => [newThread, ...prev]);
  }, []);

  // Inteligência Artificial - Copiloto Clínico
  const askCopilot = useCallback(async (query: string) => {
    const userMsg: CopilotMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      content: query,
      sentAt: new Date().toISOString(),
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setIsCopilotTyping(true);

    // Simulação de IA especializada
    await new Promise((r) => setTimeout(r, 1200));

    let copilotContent = 'Entendido. Como seu copiloto clínico, posso te apoiar na organização das informações e na conformidade documental, mas lembre-se de que a validação final e o juízo clínico são de sua inteira responsabilidade.';
    const qLower = query.toLowerCase();

    if (qLower.includes('agenda') || qLower.includes('compromissos')) {
      copilotContent = `Sua agenda de hoje possui ${appointments.length} consultas:
1. Maria Conceição Silva (14h00, Online) - Nível de proteção 3.
2. João Antônio Ramos (15h30, Online) - Nível de proteção 2.
3. Fernanda Oliveira (17h00, Presencial) - Nível de proteção 4.

Você tem 2 documentos pendentes de assinatura eletrônica.`;
    } else if (qLower.includes('maria conceição') || qLower.includes('caso maria')) {
      const maria = records.find((r) => r.id === 'pat-001');
      copilotContent = `Aqui está o resumo do caso de **Maria Conceição Silva** (${maria?.code}):
- **Idade / Vínculo**: 38 anos, acompanhada no programa "Saúde Mental Comunitária".
- **Nível de Risco / Especial**: Nível 3, classificada em ${maria?.specialCategory} (Violência Doméstica). Conta com Medida Protetiva ativa até 31/12/2026.
- **Última Evolução**: Em 15/06/2026, com relato de melhora nos pânicos usando ancoragem física. Conflitos familiares continuam sob monitoração.
- **Objetivos do PIC**: Reduzir sintomas ansiosos e reforçar estratégias protetivas.`;
    } else if (qLower.includes('protocolo') || qLower.includes('crise')) {
      copilotContent = `Conforme o Protocolo de Acolhimento em Crise do Instituto Ser Melhor (revisão 2026):
1. **Estabilização imediata**: Afastar estímulos ansiosos e aplicar respiração orientada (diafragmática).
2. **Avaliação de Risco**: Identificar ideias de autoextermínio ou risco à integridade física de terceiros.
3. **Encaminhamento Seguro**: Caso o risco seja iminente, contatar imediatamente o CAPS da região ou rede de suporte cadastrada.`;
    } else if (qLower.includes('sugira evolução') || qLower.includes('evolução clínica')) {
      copilotContent = `Sugestão de estrutura de evolução clínica (padrão SOAP):
- **Subjetivo**: Relatar queixas trazidas pelo paciente (ex: sono, ansiedade, humor).
- **Objetivo**: Aparência do paciente, linguagem corporal, adesão aos combinados clínicos anteriores.
- **Avaliação**: Análise do terapeuta sobre o estado atual do quadro (ex: evolução positiva, estabilização).
- **Plano**: Combinados para a próxima sessão (ex: diário de emoções, respiração).`;
    }

    const copilotMsg: CopilotMessage = {
      id: `copilot-msg-${Date.now()}`,
      sender: 'copilot',
      content: copilotContent,
      sentAt: new Date().toISOString(),
    };

    setCopilotMessages((prev) => [...prev, copilotMsg]);
    setIsCopilotTyping(false);
  }, [appointments, records]);

  return (
    <ProfessionalPortalContext.Provider
      value={{
        professional: MOCK_PROFESSIONAL,
        appointments,
        records,
        documents,
        threads,
        hoursList,
        certificates: MOCK_CERTIFICATES,
        courses: MOCK_COURSES,
        library: MOCK_LIBRARY,
        requests,
        copilotMessages,
        addEvolution,
        updateCarePlan,
        issueDocument,
        signDocument,
        signBatch,
        logHours,
        submitRequest,
        replyThread,
        createThread,
        askCopilot,
        isCopilotTyping,
      }}
    >
      {children}
    </ProfessionalPortalContext.Provider>
  );
}

export function useProfessionalPortal(): ProfessionalPortalContextType {
  const ctx = useContext(ProfessionalPortalContext);
  if (!ctx) throw new Error('useProfessionalPortal deve ser usado dentro de <ProfessionalPortalProvider>');
  return ctx;
}
