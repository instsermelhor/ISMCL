// ============================================================
// Mock Data — PIARAVE
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import type {
  PiaraveLine,
  PiaraveLibraryItem,
  PiaraveCase,
  PiaraveAuditLog,
} from '../types/piarave';

// ─────────────────────────────────────────
// LINHAS E QUESTÕES DO PROGRAMA
// ─────────────────────────────────────────

export const mockPiaraveLines: PiaraveLine[] = [
  {
    id: 'line-mulher',
    name: 'Acolhimento Especializado da Mulher',
    targetAudience: 'Mulheres em relacionamentos abusivos',
    description: 'Focado em violência doméstica, psicológica, patrimonial, restauração de autonomia e rede de proteção.',
    active: true,
    questions: [
      {
        id: 'pm-q1', order: 1, type: 'yes_no', required: true,
        label: 'Você sente que o seu parceiro tenta afastar você de amigos ou familiares?',
        description: 'Reflete comportamentos de isolamento social impostos na relação.'
      },
      {
        id: 'pm-q2', order: 2, type: 'yes_no', required: true,
        label: 'Ele monitora ou controla o que você veste, gasta, ou com quem conversa?',
        description: 'Reflete o controle coercitivo e restrições de liberdade.'
      },
      {
        id: 'pm-q3', order: 3, type: 'textarea', required: false,
        label: 'Há alguma situação envolvendo violência física ou ameaças diretas à sua integridade?',
        placeholder: 'Caso se sinta confortável, descreva brevemente para avaliarmos a segurança...'
      },
      {
        id: 'pm-q4', order: 4, type: 'radio', required: true,
        label: 'Como você avalia sua dependência econômica do seu parceiro no momento?',
        options: [
          { label: 'Totalmente dependente (ele paga todas as contas)', value: 'total' },
          { label: 'Parcialmente dependente (tenho renda própria mas insuficiente)', value: 'parcial' },
          { label: 'Financeiramente independente', value: 'independente' }
        ]
      }
    ]
  },
  {
    id: 'line-homem',
    name: 'Acolhimento da Saúde Mental do Homem',
    targetAudience: 'Homens em situações de conflito grave ou alienação',
    description: 'Suporte focado em violência psicológica/emocional, conflitos familiares, separações traumáticas e paternidade.',
    active: true,
    questions: [
      {
        id: 'ph-q1', order: 1, type: 'yes_no', required: true,
        label: 'Você tem passado por episódios de intimidação, ridicularização ou chantagem emocional constante na relação?',
        description: 'Violência psicológica masculina e desvalorização pessoal.'
      },
      {
        id: 'ph-q2', order: 2, type: 'yes_no', required: true,
        label: 'Há ameaças ou impedimentos relacionados ao seu convívio direto com seus filhos?',
        description: 'Indicações de risco de alienação parental.'
      },
      {
        id: 'ph-q3', order: 3, type: 'textarea', required: false,
        label: 'Qual o principal impacto que essa relação tem causado na sua saúde mental ou no trabalho?',
        placeholder: 'Descreva como se sente emocionalmente no cotidiano...'
      }
    ]
  },
  {
    id: 'line-crianca',
    name: 'Proteção e Acolhimento Infantil',
    targetAudience: 'Crianças expostas a ambiente familiar abusivo',
    description: 'Atendimento mediado por responsáveis legais e profissionais de pedagogia/psicologia infantil (ECA).',
    active: true,
    questions: [
      {
        id: 'pc-q1', order: 1, type: 'radio', required: true,
        label: 'Qual o nível de exposição direta da criança aos conflitos ou agressões entre os adultos?',
        options: [
          { label: 'Presencia ou ouve frequentemente', value: 'frequente' },
          { label: 'Presencia ocasionalmente', value: 'ocasional' },
          { label: 'Raramente exposta diretamente', value: 'raro' }
        ]
      },
      {
        id: 'pc-q2', order: 2, type: 'checkbox', required: true,
        label: 'Quais sinais comportamentais ou alterações de rotina a criança vem demonstrando?',
        options: [
          { label: 'Regressão de marcos de desenvolvimento (ex: xixi na cama)', value: 'regressao' },
          { label: 'Agressividade ou irritabilidade acentuada', value: 'agressividade' },
          { label: 'Isolamento e choro fácil', value: 'isolamento' },
          { label: 'Problemas de rendimento escolar', value: 'escolar' },
          { label: 'Sem alterações perceptíveis', value: 'nenhuma' }
        ]
      }
    ]
  },
  {
    id: 'line-adolescente',
    name: 'Apoio ao Adolescente',
    targetAudience: 'Adolescentes expostos a bullying ou abusos relacionais',
    description: 'Linguagem adaptada para relacionamentos abusivos na juventude, bullying/cyberbullying e conflito intrafamiliar.',
    active: true,
    questions: [
      {
        id: 'pa-q1', order: 1, type: 'yes_no', required: true,
        label: 'Você sente que está sofrendo intimidação, perseguição ou controle excessivo em seus relacionamentos virtuais (cyberbullying)?'
      },
      {
        id: 'pa-q2', order: 2, type: 'radio', required: true,
        label: 'Com quem você costuma conversar quando está com medo ou triste em casa?',
        options: [
          { label: 'Amigos ou colegas de escola', value: 'amigos' },
          { label: 'Algum familiar de confiança', value: 'familiar' },
          { label: 'Professores / Orientadores da escola', value: 'escola' },
          { label: 'Não tenho com quem conversar', value: 'ninguem' }
        ]
      }
    ]
  },
  {
    id: 'line-idoso',
    name: 'Proteção ao Idoso Vulnerável',
    targetAudience: 'Idosos em situação de violência psicológica ou exploração',
    description: 'Protocolos voltados a abuso patrimonial, abandono, negligência, e redes de amparo legal.',
    active: true,
    questions: [
      {
        id: 'pi-q1', order: 1, type: 'yes_no', required: true,
        label: 'Você sofre controle financeiro de terceiros contra a sua vontade (retenção de aposentadoria/cartões)?'
      },
      {
        id: 'pi-q2', order: 2, type: 'yes_no', required: true,
        label: 'Você já foi vítima de insultos, isolamento forçado ou negligência em seus cuidados básicos diários?'
      }
    ]
  }
];

// ─────────────────────────────────────────
// RECURSOS DA BIBLIOTECA PSICOEDUCATIVA
// ─────────────────────────────────────────

export const mockPiaraveLibraryItems: PiaraveLibraryItem[] = [
  {
    id: 'lib-01',
    title: 'Ciclo do Abuso: Como Identificar?',
    type: 'cartilha',
    description: 'Guia visual passo a passo sobre a tensão, explosão e lua de mel em relacionamentos tóxicos.',
    contentUrl: '#',
    tags: ['Identificação', 'Ciclo de Abuso', 'Autonomia'],
    status: 'approved',
    validatedBy: 'Dra. Roberta de Souza',
    validatedAt: '2026-03-10T14:00:00Z',
    createdBy: 'Psicóloga Amanda Costa',
    createdAt: '2026-03-08T09:30:00Z'
  },
  {
    id: 'lib-02',
    title: 'Comunicação Não-Violenta no Cotidiano Familiar',
    type: 'cnv',
    description: 'Manual prático de expressão de necessidades sem indução de culpa ou julgamentos.',
    contentUrl: '#',
    tags: ['CNV', 'Comunicação', 'Família'],
    status: 'approved',
    validatedBy: 'Coord. Técnico Geral',
    validatedAt: '2026-04-15T16:20:00Z',
    createdBy: 'Mediador Dr. Thiago Lima',
    createdAt: '2026-04-12T10:00:00Z'
  },
  {
    id: 'lib-03',
    title: 'Guia de Direitos Legais e Medidas Protetivas',
    type: 'direitos',
    description: 'Direitos da vítima conforme a Lei Maria da Penha e canais de acionamento rápido de proteção policial.',
    contentUrl: '#',
    tags: ['Jurídico', 'Proteção', 'Lei Maria da Penha'],
    status: 'approved',
    validatedBy: 'Dra. Camila Assis (Jurídico)',
    validatedAt: '2026-05-01T11:00:00Z',
    createdBy: 'Advogada Priscila Lima',
    createdAt: '2026-04-28T15:00:00Z'
  },
  {
    id: 'lib-04',
    title: 'Parentalidade Saudável após o Divórcio Litigioso',
    type: 'material_psicoeducativo',
    description: 'Dicas práticas para manter o bem-estar psicológico infantil e afastar as crianças de conflitos de custódia.',
    contentUrl: '#',
    tags: ['Parentalidade', 'Divórcio', 'Infância'],
    status: 'approved',
    validatedBy: 'Dra. Roberta de Souza',
    validatedAt: '2026-05-20T10:00:00Z',
    createdBy: 'Pedagogo Fernando Silva',
    createdAt: '2026-05-18T09:00:00Z'
  },
  {
    id: 'lib-05',
    title: 'Gaslighting: O que é e como se blindar',
    type: 'video',
    description: 'Vídeo explicativo contendo encenações e sinais corporais para detectar desestabilização mental provocada.',
    contentUrl: '#',
    tags: ['Gaslighting', 'Saúde Mental', 'Vídeo'],
    status: 'pending_validation',
    createdBy: 'Psicólogo Marcos Alencar',
    createdAt: '2026-06-25T11:30:00Z'
  },
  {
    id: 'lib-06',
    title: 'Abuso Patrimonial Contra o Idoso',
    type: 'cartilha',
    description: 'Cartilha de prevenção ao controle coercitivo financeiro por parte de cuidadores ou herdeiros.',
    contentUrl: '#',
    tags: ['Idoso', 'Financeiro', 'Patrimonial'],
    status: 'pending_validation',
    createdBy: 'Assistente Social Clarissa',
    createdAt: '2026-06-28T14:00:00Z'
  }
];

// ─────────────────────────────────────────
// CASOS DE ACOMPANHAMENTO PIARAVE
// ─────────────────────────────────────────

export const mockPiaraveCases: PiaraveCase[] = [
  {
    id: 'CAS-PIARAVE-001',
    registrationId: 'REG-2025-00247',
    beneficiaryName: 'Maria Oliveira Santos',
    beneficiaryProfile: 'adult_civilian',
    priorityLevel: 'critical',
    securityLevel: 'elevated',
    demandsReported: ['violencia_emocional', 'abuso_psicologico', 'gaslighting', 'abuso_financeiro'],
    status: 'active',
    assignedProfessionalId: 'prof-001',
    assignedProfessionalName: 'Dra. Roberta de Souza',
    referralType: 'psicologia',
    createdAt: '2026-06-10T09:00:00Z',
    updatedAt: '2026-06-29T11:45:00Z',
    safetyPlan: {
      id: 'saf-01',
      registrationId: 'REG-2025-00247',
      trustedPersonName: 'Juliana Oliveira (Irmã)',
      trustedPersonContact: '(11) 98888-7777',
      emergencyContact: '190 - Polícia Militar',
      safePlaceDescription: 'Casa dos pais no interior de São Paulo',
      safetyInstructions: 'Manter documentos pessoais e celular sempre carregados em uma mochila oculta. Ao menor sinal de elevação de tom de voz ou agressividade verbal intensa, retirar-se simulando ir à padaria e acionar a irmã.',
      institutionalProtectionNotes: 'Direcionada com marcação especial de sigilo no PEI. Apenas equipe de saúde mental e social credenciados visualizam anamnese.',
      lastUpdatedAt: '2026-06-20T10:00:00Z',
      updatedBy: 'Assistente Social Clarissa',
      isEncrypted: true
    },
    piaGeneralObjectives: 'Promover rompimento saudável do ciclo de violência, estabilização emocional e autonomia financeira.',
    piaSpecificObjectives: '1. Superação de crises severas de ansiedade induzidas por gaslighting.\n2. Inserção em programas de capacitação e recolocação profissional.\n3. Apoio jurídico para medida protetiva.',
    piaFamilyCommitments: 'A beneficiária compromete-se a residir em abrigo provisório/casa de apoio e comparecer aos atendimentos semanais.',
    piaVersion: 1,
    piaGoals: [
      {
        id: 'g-01',
        description: 'Obter medida protetiva de afastamento do agressor',
        intervention: 'Peticionamento jurídico prioritário e acompanhamento na delegacia',
        indicator: 'Medida deferida e intimada ao réu',
        targetDate: '2026-07-15',
        status: 'IN_PROGRESS',
        responsible: 'Dra. Camila Assis (Jurídico)'
      },
      {
        id: 'g-02',
        description: 'Restabelecer regulação emocional nas reuniões com familiares',
        intervention: 'Psicoterapia semanal de abordagem cognitivo-comportamental focada em trauma',
        indicator: 'Escore de pânico reduzido em aplicação quinzenal',
        targetDate: '2026-08-30',
        status: 'IN_PROGRESS',
        responsible: 'Dra. Roberta de Souza (Psicologia)'
      }
    ],
    evolutions: [
      {
        id: 'ev-01',
        date: '2026-06-12T14:30:00Z',
        professionalName: 'Dra. Roberta de Souza',
        role: 'psicologo',
        content: 'Beneficiária demonstra tremores, choro reflexivo ao mencionar o cônjuge. Apresenta forte distorção cognitiva da realidade provocada por frequentes episódios de desestabilização mental e chantagem emocional. Iniciado mapeamento de gatilhos emocionais.',
        signed: true,
        signatureHash: 'sha256-4c3e8a6f'
      },
      {
        id: 'ev-02',
        date: '2026-06-15T11:00:00Z',
        professionalName: 'Assistente Social Clarissa',
        role: 'assistente_social',
        content: 'Realizada visita institucional no local temporário. Maria encontra-se abrigada na residência de sua irmã. Encaminhada ao CRAS para inclusão prioritária no cadastro único de programas sociais face à vulnerabilidade patrimonial decorrente de retenção de cartões pelo cônjuge.',
        signed: true,
        signatureHash: 'sha256-8a7e4b2d'
      },
      {
        id: 'ev-03',
        date: '2026-06-20T16:00:00Z',
        professionalName: 'Dra. Camila Assis',
        role: 'advogado',
        content: 'Petição de medida protetiva de urgência redigida sob a tese de controle coercitivo grave e ameaça velada. Protocolo efetuado junto à vara especializada de violência doméstica de São Paulo. Acompanhamos a manifestação judicial.',
        signed: true,
        signatureHash: 'sha256-f4e9b2c3'
      }
    ],
    meetings: [
      {
        id: 'meet-01',
        date: '2026-06-18T10:00:00Z',
        participants: ['Dra. Roberta (Psicologia)', 'Clarissa (Serviço Social)', 'Dra. Camila (Jurídico)'],
        agenda: 'Alinhamento estratégico do plano de proteção integral e medidas protetivas.',
        minutes: 'Discutido o perigo de Maria retornar ao domicílio conjugal por dependência emocional. Avaliada a necessidade imediata de suporte psiquiátrico de suporte devido a quadro grave de insônia.',
        decisions: 'Manter Maria em sigilo de morada; peticionar medida protetiva com urgência; encaminhar para psiquiatria no dia 22/06.'
      }
    ]
  },
  {
    id: 'CAS-PIARAVE-002',
    registrationId: 'REG-2025-00246',
    beneficiaryName: 'João Pedro Almeida',
    beneficiaryProfile: 'adult_civilian',
    priorityLevel: 'high',
    securityLevel: 'elevated',
    demandsReported: ['violencia_emocional', 'chantagem_emocional', 'alienacao_familiar'],
    status: 'pending_evaluation',
    assignedProfessionalId: 'prof-002',
    assignedProfessionalName: 'Psicólogo Marcos Alencar',
    createdAt: '2026-06-25T10:00:00Z',
    updatedAt: '2026-06-28T15:30:00Z',
    piaGeneralObjectives: 'Restabelecimento do convívio parental de forma segura e mitigação de sintomas depressivos reativos.',
    piaSpecificObjectives: '1. Apoio psicoterápico focado em regulação de humor e assertividade.\n2. Mediação familiar direcionada a mitigar alienação contra os filhos.',
    piaFamilyCommitments: 'O beneficiário compromete-se a colaborar com as reuniões de escuta e mediação de conflitos.',
    piaVersion: 1,
    piaGoals: [
      {
        id: 'g-03',
        description: 'Obter canal pacífico de comunicação parental',
        intervention: 'Sessões de mediação e orientação sobre comunicação não-violenta',
        indicator: 'Comunicação focada exclusivamente no bem-estar dos filhos',
        targetDate: '2026-08-15',
        status: 'PENDING',
        responsible: 'Mediador Dr. Thiago Lima'
      }
    ],
    evolutions: [
      {
        id: 'ev-04',
        date: '2026-06-26T09:00:00Z',
        professionalName: 'Psicólogo Marcos Alencar',
        role: 'psicologo',
        content: 'Apresenta fala pausada, angústia acentuada por estar afastado dos filhos menores. Descreve dinâmicas de chantagem emocional intensa e difamação de sua conduta aos filhos por parte da ex-companheira.',
        signed: true,
        signatureHash: 'sha256-abc892ef'
      }
    ],
    meetings: []
  }
];

// ─────────────────────────────────────────
// LOGS DE AUDITORIA SIMULADOS
// ─────────────────────────────────────────

export const mockPiaraveAuditLogs: PiaraveAuditLog[] = [
  {
    id: 'aud-pi-01',
    action: 'safety_plan_accessed',
    dossierId: 'CAS-PIARAVE-001',
    performedBy: 'Dra. Roberta de Souza',
    role: 'Psicóloga de Referência',
    performedAt: '2026-06-29T10:30:00Z',
    details: 'Visualizou o Plano de Segurança de Maria Oliveira Santos. Justificativa: Consulta de rota de fuga ativa.',
    securityLevel: 'elevated'
  },
  {
    id: 'aud-pi-02',
    action: 'evolution_signed',
    dossierId: 'CAS-PIARAVE-001',
    performedBy: 'Assistente Social Clarissa',
    role: 'Assistente Social',
    performedAt: '2026-06-15T11:05:00Z',
    details: 'Assinatura digital da evolução nº 2 com hash SHA256.',
    securityLevel: 'standard'
  },
  {
    id: 'aud-pi-03',
    action: 'pia_updated',
    dossierId: 'CAS-PIARAVE-001',
    performedBy: 'Dra. Roberta de Souza',
    role: 'Psicóloga de Referência',
    performedAt: '2026-06-20T16:15:00Z',
    details: 'Atualizou as metas do Plano Individual de Acompanhamento (PIA) v1.',
    securityLevel: 'standard'
  }
];
