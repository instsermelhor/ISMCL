// ============================================================
// Mock Data — SATAI (Sistema Inteligente de Acolhimento)
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import type { SataiProtocol, SataiDossier } from '../types/satai';

// ============================================================
// CATALOGO DE PROTOCOLOS INSTITUCIONAIS
// ============================================================

export const mockProtocols: SataiProtocol[] = [
  {
    id: 'acolhimento-psicologico',
    name: 'Acolhimento Psicológico Inicial',
    description: 'Protocolo padrão para avaliação de demandas emocionais, histórico de sintomas de ansiedade e depressão.',
    targetProfile: 'adult_civilian',
    active: true,
    version: '1.2',
    questions: [
      {
        id: 'psy_mood_frequency',
        label: 'Com que frequência você tem se sentido desanimado, triste ou sem esperança?',
        type: 'radio',
        required: true,
        options: [
          { label: 'Nenhuma vez', value: 'never', weight: 0 },
          { label: 'Alguns dias', value: 'few_days', weight: 2 },
          { label: 'Mais da metade dos dias', value: 'half_days', weight: 5 },
          { label: 'Quase todos os dias', value: 'almost_everyday', weight: 8 },
        ],
      },
      {
        id: 'psy_pleasure_loss',
        label: 'Tem sentido pouco interesse ou prazer em fazer coisas que antes gostava?',
        type: 'radio',
        required: true,
        options: [
          { label: 'Não', value: 'no', weight: 0 },
          { label: 'Sim, às vezes', value: 'sometimes', weight: 3 },
          { label: 'Sim, na maior parte do tempo', value: 'mostly', weight: 7 },
        ],
      },
      {
        id: 'psy_support_network',
        label: 'Você sente que possui pessoas com quem pode contar em momentos difíceis?',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'psy_context_textarea',
        label: 'Gostaria de detalhar os principais desafios emocionais ou tensões que está vivenciando?',
        description: 'Compartilhe apenas o que se sentir confortável.',
        type: 'textarea',
        required: false,
      },
    ],
  },
  {
    id: 'clinico-inicial',
    name: 'Informações Clínicas Iniciais (Psiquiatria)',
    description: 'Triagem rápida sobre tratamentos anteriores, uso de substâncias e medicações controladas.',
    targetProfile: 'all',
    active: true,
    version: '2.0',
    questions: [
      {
        id: 'cli_medication_list',
        label: 'Quais remédios controlados você utiliza atualmente? (Nome e dosagem se souber)',
        type: 'text',
        required: false,
        showIf: { questionId: 'triage_current_medication', operator: 'equals', value: 'yes' },
      },
      {
        id: 'cli_allergy_mental',
        label: 'Possui alguma alergia medicamentosa conhecida?',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'cli_allergy_details',
        label: 'Descreva as medicações a que tem alergia:',
        type: 'text',
        required: true,
        showIf: { questionId: 'cli_allergy_mental', operator: 'equals', value: 'yes' },
      },
      {
        id: 'cli_sleep_issue',
        label: 'Como avalia a qualidade do seu sono nas últimas semanas?',
        type: 'radio',
        required: true,
        options: [
          { label: 'Boa qualidade, durmo o suficiente', value: 'good', weight: 0 },
          { label: 'Dificuldade para pegar no sono ou insônia leve', value: 'mild_insomnia', weight: 3 },
          { label: 'Acordo muitas vezes ou insônia grave', value: 'severe_insomnia', weight: 6 },
        ],
      },
    ],
  },
  {
    id: 'seguranca-publica',
    name: 'Protocolo de Saúde Ocupacional e Estresse para Forças de Segurança',
    description: 'Protocolo específico focado em burnout, exposição a eventos traumáticos e estresse ocupacional militar.',
    targetProfile: 'security_forces',
    active: true,
    version: '1.0',
    questions: [
      {
        id: 'mil_traumatic_exposure',
        label: 'Você esteve exposto a ocorrências críticas ou eventos de alto estresse operacional recentemente?',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'mil_burnout_scale',
        label: 'Em que nível você sente que o cansaço do trabalho afeta sua vida familiar ou pessoal?',
        type: 'scale',
        required: true,
      },
      {
        id: 'mil_institutional_backing',
        label: 'Sua corporação possui programa interno de suporte ou você prefere atendimento estritamente externo?',
        type: 'radio',
        required: true,
        options: [
          { label: 'Prefiro atendimento 100% externo sigiloso do ISM', value: 'external_only' },
          { label: 'Aceito encaminhamento compartilhado com a corporação', value: 'shared_w_corp' },
        ],
      },
    ],
  },
  {
    id: 'menores-adaptado',
    name: 'Acolhimento Infanto-Juvenil (Adaptado)',
    description: 'Protocolo humanizado direcionado a menores de idade, focado na percepção familiar e escolar.',
    targetProfile: 'minor',
    active: true,
    version: '1.1',
    questions: [
      {
        id: 'min_school_feelings',
        label: 'Como o beneficiário se sente na escola ou no convívio escolar?',
        type: 'radio',
        required: true,
        options: [
          { label: 'Muito bem, gosta de estudar e tem amigos', value: 'good' },
          { label: 'Apresenta algumas dificuldades de socialização', value: 'social_difficulty' },
          { label: 'Recusa-se a ir à escola ou queixa-se constantemente', value: 'refusal' },
        ],
      },
      {
        id: 'min_family_conflits',
        label: 'Existem conflitos familiares frequentes presenciados pela criança/adolescente?',
        type: 'yes_no',
        required: true,
      },
    ],
  },
];

// ============================================================
// DOSSIÊS INICIAIS MOCK
// ============================================================

export const mockDossiers: SataiDossier[] = [
  {
    id: 'DOS-2026-00001',
    registrationId: 'reg-carlos-eduardo',
    beneficiaryName: 'Carlos Eduardo Mendes',
    beneficiaryProfile: 'security_forces',
    iipScore: 72,
    priorityLevel: 'critical',
    securityLevel: 'special',
    attendanceMotives: ['depressao', 'burnout'],
    protocolAnswers: {
      mil_traumatic_exposure: 'yes',
      mil_burnout_scale: 8,
      mil_institutional_backing: 'external_only',
    },
    factorsOfAttention: [
      'Necessidade de acompanhamento contínuo',
      'Proteção de identidade institucional corporativa',
      'Exposição operacional a traumas severos',
    ],
    aiSummary: 'Carlos Mendes é Policial Militar e relata cansaço severo associado a burnout e sintomas depressivos persistentes após exposição continuada a ocorrências de alto impacto. Solicita sigilo estrito e atendimento externo não vinculado à corporação militar.',
    aiInconsistencies: [],
    aiRecommendedProtocols: ['acolhimento-psicologico'],
    status: 'pending_review',
    assignedProfessionalId: 'prof-psi-01',
    recommendedWorkflowId: 'acolhimento-seguranca',
    createdAt: '2026-06-29T10:30:00Z',
  },
  {
    id: 'DOS-2026-00002',
    registrationId: 'reg-ana-paula',
    beneficiaryName: 'Ana Paula Ferreira',
    beneficiaryProfile: 'adult_civilian',
    iipScore: 88,
    priorityLevel: 'critical',
    securityLevel: 'elevated',
    attendanceMotives: ['suicidio', 'violencia', 'depressao'],
    protocolAnswers: {
      psy_mood_frequency: 'almost_everyday',
      psy_pleasure_loss: 'mostly',
      psy_support_network: 'no',
      psy_context_textarea: 'Estou vivenciando agressões verbais e psicológicas diárias em casa, sem rede de apoio próxima.',
    },
    factorsOfAttention: [
      'Necessidade de proteção física imediata',
      'Risco severo de autolesão (ideação suicida ativa)',
      'Ausência total de rede de apoio familiar',
    ],
    aiSummary: 'Ana Paula Ferreira apresenta quadro de tristeza profunda persistente com ideação suicida ativa e relato de violência doméstica psicológica recorrente em ambiente doméstico. O Cofre Digital foi ativado automaticamente.',
    aiInconsistencies: [
      'CPF informado divergente da base nacional (verificar dígito verificador)',
    ],
    aiRecommendedProtocols: ['clinico-inicial'],
    status: 'accepted',
    assignedProfessionalId: 'prof-psi-02',
    recommendedWorkflowId: 'acolhimento-critico',
    createdAt: '2026-06-29T14:15:00Z',
  },
];
