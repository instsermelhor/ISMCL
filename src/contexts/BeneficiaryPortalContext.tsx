/**
 * BeneficiaryPortalContext — Módulo 09
 * Portal do Beneficiário — Instituto Ser Melhor — Projeto Aura
 *
 * Gerencia estado, dados mock e regras de negócio do Portal do Beneficiário.
 * Integra com AuthContext e SecurityContext sem duplicação de dados.
 */

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type BeneficiaryProfileType =
  | 'BENEFICIARY'      // Beneficiário maior de idade
  | 'LEGAL_GUARDIAN'   // Responsável legal / Tutor
  | 'PARENT_FATHER'    // Pai
  | 'PARENT_MOTHER'    // Mãe
  | 'JUDICIAL_GUARDIAN'// Guardião judicial
  | 'FOSTER_FAMILY'    // Família acolhedora
  | 'LEGAL_REP';       // Representante legal

export type AppointmentStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULING';
export type AppointmentType   = 'PRESENCIAL' | 'TELECONSULTA' | 'DOMICILIAR' | 'GRUPO';
export type DocumentType      = 'RECEITA' | 'ATESTADO' | 'DECLARACAO' | 'LAUDO' | 'RELATORIO' | 'ORIENTACAO' | 'COMPROVANTE' | 'TERMO';
export type MessageStatus     = 'READ' | 'UNREAD';
export type RequestStatus     = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
export type NotificationType  = 'AGENDA' | 'DOCUMENTO' | 'MENSAGEM' | 'PROJETO' | 'CAMPANHA' | 'CADASTRO' | 'SISTEMA';

export interface PortalBeneficiary {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  profileType: BeneficiaryProfileType;
  avatarInitials: string;
  isProtected: boolean;
  sensitivityLevel: 0 | 1 | 2 | 3 | 4;
  linkedBeneficiaries?: LinkedBeneficiary[]; // Para responsáveis
  programs: string[];
  nextAppointment?: string;
}

export interface LinkedBeneficiary {
  id: string;
  name: string;
  relationship: string;
  age: number;
  isMinor: boolean;
}

export interface PortalAppointment {
  id: string;
  date: string;
  time: string;
  professional: string;
  specialty: string;
  type: AppointmentType;
  status: AppointmentStatus;
  location?: string;
  teleconsultUrl?: string;
  canConfirm: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  notes?: string;
}

export interface PortalDocument {
  id: string;
  title: string;
  type: DocumentType;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  isAuthorized: boolean;
  downloadUrl?: string;
  size?: string;
  validationCode?: string;
}

export interface PortalMessage {
  id: string;
  from: string;
  fromRole: string;
  subject: string;
  preview: string;
  body: string;
  sentAt: string;
  status: MessageStatus;
  canReply: boolean;
  thread?: PortalMessage[];
}

export interface PortalNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

export interface ServiceRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
}

export interface SocialProject {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  coordinator: string;
  progress: number; // 0-100
  nextActivity?: string;
  attendances: number;
  totalSessions: number;
}

export interface CareGoal {
  id: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED';
  dueDate?: string;
}

export interface IndividualCarePlan {
  id: string;
  beneficiaryName: string;
  startDate: string;
  reviewDate: string;
  objectives: string[];
  orientations: string[];
  goals: CareGoal[];
  isAuthorized: boolean;
  professionalName: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_BENEFICIARY: PortalBeneficiary = {
  id: 'ben-001',
  name: 'Maria Clara Oliveira',
  cpf: '***.***.***-12',
  birthDate: '1990-03-15',
  profileType: 'BENEFICIARY',
  avatarInitials: 'MC',
  isProtected: false,
  sensitivityLevel: 1,
  programs: ['Saúde Mental Comunitária', 'Grupo de Apoio Familiar'],
  nextAppointment: '2026-07-02T14:00:00',
};

const MOCK_APPOINTMENTS: PortalAppointment[] = [
  {
    id: 'apt-001',
    date: '2026-07-02',
    time: '14:00',
    professional: 'Dra. Roberta Santos',
    specialty: 'Psicologia',
    type: 'TELECONSULTA',
    status: 'CONFIRMED',
    teleconsultUrl: '/telehealth/apt-001',
    canConfirm: false,
    canCancel: true,
    canReschedule: true,
    notes: 'Lembre-se de acessar em local tranquilo com câmera e microfone disponíveis.',
  },
  {
    id: 'apt-002',
    date: '2026-07-10',
    time: '09:30',
    professional: 'Dr. Carlos Mendes',
    specialty: 'Serviço Social',
    type: 'PRESENCIAL',
    status: 'PENDING',
    location: 'Sala 3 — Unidade Central',
    canConfirm: true,
    canCancel: true,
    canReschedule: true,
  },
  {
    id: 'apt-003',
    date: '2026-06-20',
    time: '10:00',
    professional: 'Dra. Roberta Santos',
    specialty: 'Psicologia',
    type: 'TELECONSULTA',
    status: 'COMPLETED',
    canConfirm: false,
    canCancel: false,
    canReschedule: false,
  },
  {
    id: 'apt-004',
    date: '2026-07-18',
    time: '16:00',
    professional: 'Equipe Multidisciplinar',
    specialty: 'Grupo Terapêutico',
    type: 'GRUPO',
    status: 'CONFIRMED',
    location: 'Auditório — Sede',
    canConfirm: true,
    canCancel: true,
    canReschedule: false,
  },
];

const MOCK_DOCUMENTS: PortalDocument[] = [
  {
    id: 'doc-001',
    title: 'Declaração de Acompanhamento Psicológico',
    type: 'DECLARACAO',
    issuedBy: 'Dra. Roberta Santos',
    issuedAt: '2026-06-20',
    isAuthorized: true,
    size: '142 KB',
    validationCode: 'ISM-2026-DCL-0847',
  },
  {
    id: 'doc-002',
    title: 'Orientações Terapêuticas — Junho/2026',
    type: 'ORIENTACAO',
    issuedBy: 'Dra. Roberta Santos',
    issuedAt: '2026-06-20',
    isAuthorized: true,
    size: '98 KB',
    validationCode: 'ISM-2026-ORI-0391',
  },
  {
    id: 'doc-003',
    title: 'Relatório de Evolução — 1º Semestre 2026',
    type: 'RELATORIO',
    issuedBy: 'Equipe Técnica',
    issuedAt: '2026-06-15',
    isAuthorized: true,
    size: '285 KB',
    validationCode: 'ISM-2026-REL-0112',
  },
  {
    id: 'doc-004',
    title: 'Laudo Psicossocial',
    type: 'LAUDO',
    issuedBy: 'Equipe Multidisciplinar',
    issuedAt: '2026-05-30',
    isAuthorized: false, // Não autorizado — não disponível para download
    size: '—',
  },
  {
    id: 'doc-005',
    title: 'Termo de Consentimento Livre e Esclarecido',
    type: 'TERMO',
    issuedBy: 'Instituto Ser Melhor',
    issuedAt: '2026-03-01',
    isAuthorized: true,
    size: '67 KB',
    validationCode: 'ISM-2026-TCL-0021',
  },
];

const MOCK_MESSAGES: PortalMessage[] = [
  {
    id: 'msg-001',
    from: 'Dra. Roberta Santos',
    fromRole: 'Psicóloga',
    subject: 'Orientações após consulta de 20/06',
    preview: 'Olá Maria Clara, conforme conversamos na sessão de hoje...',
    body: `Olá Maria Clara,

Conforme conversamos na sessão de hoje, seguem as orientações para a próxima semana:

• Continue praticando as técnicas de respiração diafragmática pela manhã (5 minutos);
• Mantenha o diário de pensamentos — ao menos 3 registros por semana;
• Caso perceba sintomas de ansiedade intensa, utilize a técnica 5-4-3-2-1 de ancoragem sensorial;
• Em caso de dúvidas, utilize este canal de mensagens.

Até nossa próxima sessão!

Dra. Roberta Santos — CRP XX/XXXXX`,
    sentAt: '2026-06-20T17:30:00',
    status: 'READ',
    canReply: true,
  },
  {
    id: 'msg-002',
    from: 'Equipe Administrativa',
    fromRole: 'Secretaria',
    subject: 'Confirmação de agendamento — 02/07',
    preview: 'Seu atendimento por teleconsulta está confirmado para 02/07...',
    body: `Prezada Maria Clara,

Informamos que seu atendimento por TELECONSULTA está confirmado para:

📅 Data: 02 de julho de 2026
⏰ Horário: 14h00
👩‍⚕️ Profissional: Dra. Roberta Santos

Acesse o portal 5 minutos antes do horário previsto.

Atenciosamente,
Equipe Administrativa — Instituto Ser Melhor`,
    sentAt: '2026-06-28T09:00:00',
    status: 'UNREAD',
    canReply: false,
  },
  {
    id: 'msg-003',
    from: 'Coordenação de Projetos',
    fromRole: 'Gestão',
    subject: 'Nova atividade no Grupo de Apoio Familiar',
    preview: 'Informamos que haverá um encontro especial em 18/07...',
    body: `Olá Maria Clara,

Temos o prazer de comunicar que haverá um encontro especial do Grupo de Apoio Familiar em 18 de julho de 2026, às 16h, no Auditório da Sede.

Tema: "Comunicação Não-Violenta nas Relações Familiares"
Facilitadora: Dra. Ana Beatriz Ferreira

Confirme sua presença respondendo esta mensagem.

Contamos com você!
Coordenação de Projetos Sociais`,
    sentAt: '2026-06-27T14:15:00',
    status: 'UNREAD',
    canReply: true,
  },
];

const MOCK_NOTIFICATIONS: PortalNotification[] = [
  {
    id: 'not-001',
    type: 'AGENDA',
    title: 'Consulta amanhã às 14h',
    body: 'Lembrete: Teleconsulta com Dra. Roberta Santos amanhã, 02/07 às 14h00.',
    createdAt: '2026-07-01T08:00:00',
    isRead: false,
    actionLabel: 'Ver agenda',
    actionRoute: 'agenda',
  },
  {
    id: 'not-002',
    type: 'DOCUMENTO',
    title: 'Novo documento disponível',
    body: 'A Declaração de Acompanhamento Psicológico foi disponibilizada para download.',
    createdAt: '2026-06-20T18:00:00',
    isRead: false,
    actionLabel: 'Ver documento',
    actionRoute: 'documentos',
  },
  {
    id: 'not-003',
    type: 'MENSAGEM',
    title: 'Nova mensagem recebida',
    body: 'Você recebeu uma mensagem da Equipe Administrativa sobre seu agendamento.',
    createdAt: '2026-06-28T09:05:00',
    isRead: true,
    actionLabel: 'Ver mensagem',
    actionRoute: 'mensagens',
  },
  {
    id: 'not-004',
    type: 'PROJETO',
    title: 'Atividade de grupo em 18/07',
    body: 'Nova atividade confirmada no Grupo de Apoio Familiar. Confira os detalhes.',
    createdAt: '2026-06-27T14:20:00',
    isRead: true,
    actionLabel: 'Ver projeto',
    actionRoute: 'projetos',
  },
  {
    id: 'not-005',
    type: 'CAMPANHA',
    title: 'Campanha de Saúde Mental — Julho',
    body: 'Participe das atividades do Instituto durante o mês de julho. Veja a programação.',
    createdAt: '2026-06-26T10:00:00',
    isRead: true,
  },
];

const MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: 'req-001',
    category: 'Atualização Cadastral',
    title: 'Atualização de endereço',
    description: 'Solicito atualização do endereço residencial para Rua das Flores, 142, apto 31.',
    status: 'CONCLUIDO',
    createdAt: '2026-06-10T10:00:00',
    updatedAt: '2026-06-12T14:30:00',
  },
  {
    id: 'req-002',
    category: 'Declaração',
    title: 'Solicitação de declaração de frequência',
    description: 'Necessito de declaração para comprovação de acompanhamento psicológico junto ao INSS.',
    status: 'EM_ANDAMENTO',
    createdAt: '2026-06-25T09:00:00',
    updatedAt: '2026-06-25T09:30:00',
  },
];

const MOCK_PROJECTS: SocialProject[] = [
  {
    id: 'prj-001',
    name: 'Saúde Mental Comunitária',
    description: 'Programa de acompanhamento psicossocial com foco em saúde mental e bem-estar comunitário.',
    startDate: '2026-03-01',
    coordinator: 'Dra. Roberta Santos',
    progress: 65,
    nextActivity: '2026-07-02 — Sessão individual de psicoterapia',
    attendances: 13,
    totalSessions: 20,
  },
  {
    id: 'prj-002',
    name: 'Grupo de Apoio Familiar',
    description: 'Grupo mensal de apoio mútuo voltado para familiares e pessoas em acompanhamento.',
    startDate: '2026-04-01',
    coordinator: 'Dr. Carlos Mendes',
    progress: 40,
    nextActivity: '2026-07-18 — Encontro especial: Comunicação Não-Violenta',
    attendances: 4,
    totalSessions: 10,
  },
];

const MOCK_CARE_PLAN: IndividualCarePlan = {
  id: 'pic-001',
  beneficiaryName: 'Maria Clara Oliveira',
  startDate: '2026-03-15',
  reviewDate: '2026-09-15',
  professionalName: 'Dra. Roberta Santos',
  isAuthorized: true,
  objectives: [
    'Redução de sintomas ansiosos e desenvolvimento de estratégias de regulação emocional',
    'Fortalecimento da rede de apoio social e familiar',
    'Promoção da autonomia e autoestima',
  ],
  orientations: [
    'Praticar técnicas de respiração diafragmática diariamente',
    'Manter diário de pensamentos e emoções',
    'Participar regularmente do grupo de apoio',
    'Evitar uso de substâncias psicoativas',
  ],
  goals: [
    { id: 'g1', description: 'Reduzir episódios de crise ansiosa para menos de 2 por semana', status: 'IN_PROGRESS', dueDate: '2026-09-01' },
    { id: 'g2', description: 'Retomar atividade laboral ou educacional', status: 'PENDING', dueDate: '2026-12-01' },
    { id: 'g3', description: 'Fortalecer vínculos familiares positivos', status: 'IN_PROGRESS', dueDate: '2026-09-15' },
    { id: 'g4', description: 'Manter assiduidade nas sessões acima de 80%', status: 'ACHIEVED' },
  ],
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface BeneficiaryPortalContextType {
  beneficiary: PortalBeneficiary;
  appointments: PortalAppointment[];
  documents: PortalDocument[];
  messages: PortalMessage[];
  notifications: PortalNotification[];
  requests: ServiceRequest[];
  projects: SocialProject[];
  carePlan: IndividualCarePlan;
  unreadNotifications: number;
  unreadMessages: number;
  // Actions
  confirmAppointment: (id: string) => void;
  cancelAppointment: (id: string) => void;
  requestReschedule: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  markMessageRead: (id: string) => void;
  sendMessage: (to: string, subject: string, body: string) => void;
  submitRequest: (category: string, title: string, description: string) => void;
  // AI Chat
  chatMessages: ChatMessage[];
  sendChatMessage: (content: string) => Promise<void>;
  isChatLoading: boolean;
}

const BeneficiaryPortalContext = createContext<BeneficiaryPortalContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

const ASSISTANT_RESPONSES: Record<string, string> = {
  default: 'Olá! Sou o assistente virtual do Instituto Ser Melhor. Posso ajudar com dúvidas sobre agendamentos, documentos, funcionamento do portal e procedimentos administrativos. Como posso ajudar?',
  agenda: 'Sua próxima consulta está agendada para 02/07 às 14h, por teleconsulta com a Dra. Roberta Santos. Você pode confirmar presença, solicitar reagendamento ou cancelar diretamente pela aba "Agenda".',
  documento: 'Seus documentos disponíveis ficam na aba "Documentos". Apenas documentos autorizados pelos profissionais podem ser visualizados e baixados. Se precisar de uma declaração, pode abrir uma solicitação.',
  teleconsulta: 'Para entrar na teleconsulta, acesse a aba "Agenda" e clique em "Entrar na Consulta" no horário agendado. Recomendo testar câmera e microfone com antecedência.',
  mensagem: 'Você pode enviar e receber mensagens pela aba "Mensagens". Todas as comunicações ficam registradas e são visualizadas pela equipe responsável.',
  solicitacao: 'Para abrir uma solicitação (declaração, comprovante, reagendamento, etc.), acesse a aba "Solicitações" e escolha a categoria adequada.',
  projeto: 'Você participa do programa "Saúde Mental Comunitária" e do "Grupo de Apoio Familiar". Detalhes e próximas atividades estão na aba "Projetos".',
};

function getAssistantResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('agenda') || lower.includes('consulta') || lower.includes('atendimento')) return ASSISTANT_RESPONSES.agenda;
  if (lower.includes('documento') || lower.includes('declaração') || lower.includes('laudo') || lower.includes('receita')) return ASSISTANT_RESPONSES.documento;
  if (lower.includes('tele') || lower.includes('vídeo') || lower.includes('online') || lower.includes('câmera')) return ASSISTANT_RESPONSES.teleconsulta;
  if (lower.includes('mensagem') || lower.includes('falar') || lower.includes('contato')) return ASSISTANT_RESPONSES.mensagem;
  if (lower.includes('solicita') || lower.includes('pedido') || lower.includes('comprovante')) return ASSISTANT_RESPONSES.solicitacao;
  if (lower.includes('projeto') || lower.includes('grupo') || lower.includes('programa')) return ASSISTANT_RESPONSES.projeto;
  return ASSISTANT_RESPONSES.default;
}

export function BeneficiaryPortalProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<PortalAppointment[]>(MOCK_APPOINTMENTS);
  const [notifications, setNotifications] = useState<PortalNotification[]>(MOCK_NOTIFICATIONS);
  const [messages, setMessages] = useState<PortalMessage[]>(MOCK_MESSAGES);
  const [requests, setRequests] = useState<ServiceRequest[]>(MOCK_REQUESTS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      content: ASSISTANT_RESPONSES.default,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;
  const unreadMessages = messages.filter((m) => m.status === 'UNREAD').length;

  const confirmAppointment = useCallback((id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'CONFIRMED' as AppointmentStatus, canConfirm: false } : a))
    );
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' as AppointmentStatus, canConfirm: false, canCancel: false, canReschedule: false } : a))
    );
  }, []);

  const requestReschedule = useCallback((id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'RESCHEDULING' as AppointmentStatus } : a))
    );
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const markMessageRead = useCallback((id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'READ' as MessageStatus } : m)));
  }, []);

  const sendMessage = useCallback((to: string, subject: string, body: string) => {
    // Simulate sending — would integrate with backend
    console.log('Mensagem enviada:', { to, subject, body });
  }, []);

  const submitRequest = useCallback((category: string, title: string, description: string) => {
    const newReq: ServiceRequest = {
      id: `req-${Date.now()}`,
      category,
      title,
      description,
      status: 'ABERTO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRequests((prev) => [newReq, ...prev]);
  }, []);

  const sendChatMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: `chat-user-${Date.now()}`,
      sender: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));

    const response = getAssistantResponse(content);
    const assistantMsg: ChatMessage = {
      id: `chat-ast-${Date.now()}`,
      sender: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, assistantMsg]);
    setIsChatLoading(false);
  }, []);

  return (
    <BeneficiaryPortalContext.Provider
      value={{
        beneficiary: MOCK_BENEFICIARY,
        appointments,
        documents: MOCK_DOCUMENTS,
        messages,
        notifications,
        requests,
        projects: MOCK_PROJECTS,
        carePlan: MOCK_CARE_PLAN,
        unreadNotifications,
        unreadMessages,
        confirmAppointment,
        cancelAppointment,
        requestReschedule,
        markNotificationRead,
        markAllNotificationsRead,
        markMessageRead,
        sendMessage,
        submitRequest,
        chatMessages,
        sendChatMessage,
        isChatLoading,
      }}
    >
      {children}
    </BeneficiaryPortalContext.Provider>
  );
}

export function useBeneficiaryPortal(): BeneficiaryPortalContextType {
  const ctx = useContext(BeneficiaryPortalContext);
  if (!ctx) throw new Error('useBeneficiaryPortal deve ser usado dentro de <BeneficiaryPortalProvider>');
  return ctx;
}
