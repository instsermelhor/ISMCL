// ============================================================
// Mock Data — Cadastro Inteligente Adaptativo (ARE)
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import type {
  AdaptiveQuestion,
  AttendanceMotiveOption,
  VulnerabilityIndicator,
  TriageQuestion,
  RequiredDocument,
  RegisteredBeneficiary,
} from '../types/adaptive-registration';

// ============================================================
// FLUXO DE PERGUNTAS ADAPTATIVAS (Metadata-driven)
// ============================================================

export const adaptiveQuestions: AdaptiveQuestion[] = [
  // ---- ETAPA 1: Boas-Vindas e Identificação de Perfil ----
  {
    id: 'is_security_forces',
    step: 1,
    label: 'Você é servidor de uma instituição de Segurança Pública?',
    description: 'Policiais, bombeiros, agentes penitenciários e forças armadas possuem protocolo de atendimento sigiloso.',
    type: 'yes_no',
    required: true,
    triggersAction: [
      { type: 'set_security_level', payload: { level: 'special' } },
    ],
  },
  {
    id: 'security_institution',
    step: 1,
    label: 'Qual instituição você pertence?',
    type: 'select',
    required: true,
    options: [
      { label: 'Polícia Militar', value: 'pm' },
      { label: 'Polícia Civil', value: 'pc' },
      { label: 'Polícia Federal', value: 'pf' },
      { label: 'Corpo de Bombeiros', value: 'cb' },
      { label: 'Guarda Municipal', value: 'gm' },
      { label: 'Forças Armadas (Exército, Marinha, Aeronáutica)', value: 'fa' },
      { label: 'Sistema Penitenciário', value: 'sp' },
      { label: 'Outra instituição', value: 'other' },
    ],
    showIf: { questionId: 'is_security_forces', operator: 'equals', value: 'yes' },
  },
  {
    id: 'functional_id',
    step: 1,
    label: 'Número Funcional (matricula/RE)',
    type: 'text',
    required: true,
    showIf: { questionId: 'is_security_forces', operator: 'equals', value: 'yes' },
    triggersAction: [
      { type: 'apply_masking', payload: { field: 'functional_id' } },
    ],
  },

  // ---- ETAPA 2: Identificação Pessoal ----
  {
    id: 'full_name',
    step: 2,
    label: 'Nome completo',
    type: 'text',
    required: true,
  },
  {
    id: 'social_name',
    step: 2,
    label: 'Nome social (se diferente do nome civil)',
    description: 'O nome social é como você prefere ser chamado. Será utilizado em todos os atendimentos.',
    type: 'text',
    required: false,
    privacyNote: 'Essa informação é confidencial e protegida por lei.',
  },
  {
    id: 'cpf',
    step: 2,
    label: 'CPF',
    type: 'cpf',
    required: true,
    triggersAction: [
      { type: 'apply_masking', payload: { field: 'cpf' } },
    ],
  },
  {
    id: 'birth_date',
    step: 2,
    label: 'Data de nascimento',
    type: 'date',
    required: true,
    triggersAction: [
      { type: 'require_legal_guardian' }, // acionado pelo contexto se < 18 anos
    ],
  },

  // ---- ETAPA 2.1: Responsável Legal (apenas menores) ----
  {
    id: 'guardian_name',
    step: 2,
    label: 'Nome completo do responsável legal',
    type: 'text',
    required: true,
    showIf: { questionId: 'is_minor', operator: 'equals', value: 'true' },
    fieldGroup: 'Responsável Legal',
  },
  {
    id: 'guardian_cpf',
    step: 2,
    label: 'CPF do responsável legal',
    type: 'cpf',
    required: true,
    showIf: { questionId: 'is_minor', operator: 'equals', value: 'true' },
    fieldGroup: 'Responsável Legal',
    triggersAction: [
      { type: 'apply_masking', payload: { field: 'guardian_cpf' } },
    ],
  },
  {
    id: 'guardian_kinship',
    step: 2,
    label: 'Grau de parentesco ou vínculo',
    type: 'select',
    required: true,
    showIf: { questionId: 'is_minor', operator: 'equals', value: 'true' },
    fieldGroup: 'Responsável Legal',
    options: [
      { label: 'Mãe', value: 'mae' },
      { label: 'Pai', value: 'pai' },
      { label: 'Avó/Avô', value: 'avo' },
      { label: 'Tio/Tia', value: 'tio' },
      { label: 'Tutor legal', value: 'tutor' },
      { label: 'Cônjuge', value: 'conjuge' },
      { label: 'Outro', value: 'outro' },
    ],
  },

  // ---- ETAPA 3: Contato ----
  {
    id: 'phone',
    step: 3,
    label: 'Telefone de contato',
    type: 'phone',
    required: true,
  },
  {
    id: 'email',
    step: 3,
    label: 'E-mail (opcional)',
    type: 'email',
    required: false,
  },
  {
    id: 'address',
    step: 3,
    label: 'Endereço completo',
    type: 'address_block',
    required: true,
  },

  // ---- ETAPA 4: Motivo do Atendimento ----
  {
    id: 'attendance_motives',
    step: 4,
    label: 'O que traz você ao Instituto Ser Melhor hoje?',
    description: 'Você pode selecionar mais de um motivo. Não há resposta certa ou errada — estamos aqui para ajudar.',
    type: 'checkbox',
    required: true,
    options: [
      { label: 'Ansiedade ou crises de pânico', value: 'ansiedade', iipWeight: 10 },
      { label: 'Tristeza profunda ou depressão', value: 'depressao', iipWeight: 15 },
      { label: 'Pensamentos de se machucar ou suicídio', value: 'suicidio', iipWeight: 35 },
      { label: 'Problemas de sono', value: 'sono', iipWeight: 5 },
      { label: 'Uso de álcool ou outras substâncias', value: 'substancias', iipWeight: 15 },
      { label: 'Situação de violência doméstica', value: 'violencia', iipWeight: 30 },
      { label: 'Dificuldades no trabalho ou burnout', value: 'burnout', iipWeight: 10 },
      { label: 'Dificuldades familiares', value: 'familia', iipWeight: 8 },
      { label: 'Situação de vulnerabilidade social', value: 'vulnerabilidade', iipWeight: 12 },
      { label: 'Encaminhamento de outro serviço', value: 'encaminhamento', iipWeight: 5 },
      { label: 'Outros', value: 'outros', iipWeight: 3 },
    ],
    triggersAction: [
      { type: 'add_iip_score' },
      { type: 'trigger_workflow', payload: { workflowId: 'acolhimento-inicial' } },
    ],
  },
  {
    id: 'violence_detail',
    step: 4,
    label: 'A situação de violência ainda está ocorrendo?',
    type: 'yes_no',
    required: true,
    showIf: { questionId: 'attendance_motives', operator: 'includes', value: 'violencia' },
    privacyNote: 'Suas respostas são confidenciais. Acione o Cofre Digital ao final do cadastro para proteção máxima.',
    triggersAction: [
      { type: 'set_security_level', payload: { level: 'elevated' } },
      { type: 'enable_digital_vault' },
      { type: 'notify_admin', payload: { urgency: 'high', reason: 'violencia_ativa' } },
    ],
  },
  {
    id: 'suicide_ideation_detail',
    step: 4,
    label: 'Você está tendo esses pensamentos agora, neste momento?',
    type: 'yes_no',
    required: true,
    showIf: { questionId: 'attendance_motives', operator: 'includes', value: 'suicidio' },
    triggersAction: [
      { type: 'add_iip_score', payload: { extra: 30 } },
      { type: 'notify_admin', payload: { urgency: 'critical', reason: 'ideacao_suicida_ativa' } },
    ],
  },

  // ---- ETAPA 5: Indicadores de Vulnerabilidade ----
  {
    id: 'vulnerability_indicators',
    step: 5,
    label: 'Você se enquadra em alguma dessas situações? (selecione todas que se aplicam)',
    description: 'Essas informações nos ajudam a identificar a melhor forma de apoio.',
    type: 'checkbox',
    required: false,
    options: [
      { label: 'Pessoa com deficiência (PcD)', value: 'pcd', iipWeight: 10 },
      { label: 'Gestante ou puérpera', value: 'gestante', iipWeight: 12 },
      { label: 'Idoso(a) acima de 60 anos', value: 'idoso', iipWeight: 10 },
      { label: 'Criança ou adolescente', value: 'crianca', iipWeight: 15 },
      { label: 'Morador de rua ou em situação de vulnerabilidade habitacional', value: 'sem_moradia', iipWeight: 20 },
      { label: 'Sem renda ou em situação de extrema pobreza', value: 'extrema_pobreza', iipWeight: 18 },
      { label: 'Imigrante ou refugiado', value: 'imigrante', iipWeight: 8 },
      { label: 'Pertence a povo tradicional ou comunidade quilombola', value: 'povo_tradicional', iipWeight: 8 },
    ],
    triggersAction: [{ type: 'add_iip_score' }],
  },

  // ---- ETAPA 6: Triagem de Saúde Mental ----
  {
    id: 'triage_hospitalized_before',
    step: 6,
    label: 'Você já foi internado por questão emocional, mental ou psiquiátrica?',
    type: 'yes_no',
    required: false,
    triggersAction: [{ type: 'add_iip_score', payload: { extra: 10 } }],
  },
  {
    id: 'triage_previous_treatment',
    step: 6,
    label: 'Você já fez acompanhamento psicológico ou psiquiátrico antes?',
    type: 'yes_no',
    required: false,
  },
  {
    id: 'triage_current_medication',
    step: 6,
    label: 'Você usa atualmente medicação para saúde mental?',
    type: 'yes_no',
    required: false,
    triggersAction: [
      { type: 'add_required_document', payload: { documentId: 'receita_medica' } },
    ],
  },
  {
    id: 'perceived_urgency',
    step: 6,
    label: 'Em uma escala de 1 a 10, como você avalia a urgência de um atendimento para você hoje?',
    type: 'scale',
    required: true,
    triggersAction: [{ type: 'add_iip_score' }],
  },

  // ---- ETAPA 7: Documentação ----
  {
    id: 'rg_upload',
    step: 7,
    label: 'Documento de identidade (RG ou CNH)',
    description: 'Envie frente e verso.',
    type: 'file_upload',
    required: true,
    triggersAction: [
      { type: 'apply_masking', payload: { field: 'rg_upload', masking: 'restricted' } },
    ],
  },
  {
    id: 'cpf_card_upload',
    step: 7,
    label: 'Comprovante de CPF (caso não possua RG com CPF)',
    type: 'file_upload',
    required: false,
  },
  {
    id: 'address_proof_upload',
    step: 7,
    label: 'Comprovante de residência (menos de 90 dias)',
    type: 'file_upload',
    required: true,
  },
  {
    id: 'credential_upload',
    step: 7,
    label: 'Credencial ou documento funcional institucional',
    type: 'file_upload',
    required: true,
    showIf: { questionId: 'is_security_forces', operator: 'equals', value: 'yes' },
    triggersAction: [
      { type: 'apply_masking', payload: { field: 'credential_upload', masking: 'maximum' } },
    ],
  },
  {
    id: 'medication_prescription_upload',
    step: 7,
    label: 'Receita médica atual (para uso de medicamentos de saúde mental)',
    type: 'file_upload',
    required: false,
    showIf: { questionId: 'triage_current_medication', operator: 'equals', value: 'yes' },
  },

  // ---- ETAPA 8: Cofre Digital e LGPD ----
  {
    id: 'enable_vault',
    step: 8,
    label: 'Deseja ativar o Cofre Digital para este cadastro?',
    description:
      'O Cofre Digital aplica proteção máxima aos seus dados: acesso restrito, mascaramento, auditoria completa e bloqueio contra consultas não autorizadas. Recomendado para situações sensíveis.',
    type: 'yes_no',
    required: false,
    triggersAction: [
      { type: 'enable_digital_vault' },
    ],
  },
  {
    id: 'lgpd_consent',
    step: 8,
    label: 'Li e concordo com a Política de Privacidade e autorizo o tratamento dos meus dados pessoais e sensíveis, conforme a LGPD (Lei 13.709/2018), para as finalidades de atendimento do Instituto Ser Melhor.',
    type: 'yes_no',
    required: true,
    privacyNote: 'Você poderá revogar esse consentimento a qualquer momento pelo Portal do Beneficiário.',
  },
];

// ============================================================
// DOCUMENTOS REQUERIDOS
// ============================================================

export const requiredDocuments: RequiredDocument[] = [
  {
    id: 'rg',
    label: 'Documento de Identidade (RG ou CNH)',
    description: 'Frente e verso legíveis.',
    mandatory: true,
    triggeredBy: ['all'],
  },
  {
    id: 'address_proof',
    label: 'Comprovante de Residência',
    description: 'Conta de água, luz, gás ou banco. Máximo 90 dias.',
    mandatory: true,
    triggeredBy: ['all'],
  },
  {
    id: 'credential',
    label: 'Credencial Funcional',
    description: 'Documento emitido pela instituição de segurança pública.',
    mandatory: true,
    triggeredBy: ['is_security_forces'],
  },
  {
    id: 'receita_medica',
    label: 'Receita Médica Vigente',
    description: 'Receita de medicamento para saúde mental com prazo de validade vigente.',
    mandatory: false,
    triggeredBy: ['triage_current_medication'],
  },
  {
    id: 'bo_violencia',
    label: 'Boletim de Ocorrência (Violência)',
    description: 'Se disponível — nunca obrigatório para não revitimizar.',
    mandatory: false,
    triggeredBy: ['attendance_motives:violencia'],
  },
  {
    id: 'guardianship_document',
    label: 'Documento de Guarda/Tutela',
    description: 'Certidão de nascimento com vínculo ou termo de guarda judicial.',
    mandatory: true,
    triggeredBy: ['is_minor'],
  },
];

// ============================================================
// INDICADORES DE VULNERABILIDADE (editáveis pelo Admin)
// ============================================================

export const vulnerabilityIndicators: VulnerabilityIndicator[] = [
  { id: 'pcd', label: 'Pessoa com Deficiência (PcD)', iipWeight: 10, active: true },
  { id: 'gestante', label: 'Gestante ou Puérpera', iipWeight: 12, active: true },
  { id: 'idoso', label: 'Idoso(a) acima de 60 anos', iipWeight: 10, active: true },
  { id: 'crianca', label: 'Criança ou Adolescente', iipWeight: 15, active: true },
  { id: 'sem_moradia', label: 'Situação de Vulnerabilidade Habitacional', iipWeight: 20, active: true },
  { id: 'extrema_pobreza', label: 'Extrema Pobreza (sem renda)', iipWeight: 18, active: true },
  { id: 'imigrante', label: 'Imigrante ou Refugiado', iipWeight: 8, active: true },
  { id: 'povo_tradicional', label: 'Povo Tradicional / Comunidade Quilombola', iipWeight: 8, active: true },
];

// ============================================================
// PERGUNTAS DE TRIAGEM (editáveis pelo Admin)
// ============================================================

export const triageQuestions: TriageQuestion[] = [
  { id: 'internacao', label: 'Internação psiquiátrica prévia', iipWeight: 10, active: true },
  { id: 'tentativa_suicidio', label: 'Tentativa de suicídio prévia', iipWeight: 25, active: true, triggersCritical: true },
  { id: 'medicacao_psiq', label: 'Em uso de medicação psiquiátrica', iipWeight: 8, active: true },
  { id: 'acompanhamento_atual', label: 'Em acompanhamento psicológico/psiquiátrico atual', iipWeight: 5, active: true },
  { id: 'hospitalizacao_recente', label: 'Hospitalização nos últimos 30 dias', iipWeight: 12, active: true },
];

// ============================================================
// BENEFICIÁRIOS CADASTRADOS (mock)
// ============================================================

export const mockBeneficiaries: RegisteredBeneficiary[] = [
  {
    id: 'ISM-2025-00001',
    name: 'Carlos Eduardo Mendes',
    cpf: '***.***.***-**',
    birthDate: '1985-03-12',
    profile: 'security_forces',
    securityLevel: 'special',
    iipScore: 72,
    priorityLevel: 'critical',
    attendanceMotives: ['depressao', 'burnout'],
    isSecurityForces: true,
    institution: 'Polícia Militar',
    functionalId: '***-PM',
    hasDigitalVault: true,
    registrationStatus: 'approved',
    createdAt: '2025-11-10T09:30:00Z',
    workflowInstanceId: 'wf-inst-001',
    assignedProfessionalId: 'prof-psi-01',
  },
  {
    id: 'ISM-2025-00002',
    name: 'Ana Paula Ferreira',
    socialName: 'Ana Paula',
    cpf: '***.***.***-**',
    birthDate: '1992-07-28',
    profile: 'adult_civilian',
    securityLevel: 'elevated',
    iipScore: 88,
    priorityLevel: 'critical',
    attendanceMotives: ['suicidio', 'violencia', 'depressao'],
    isSecurityForces: false,
    hasDigitalVault: true,
    registrationStatus: 'approved',
    createdAt: '2025-12-01T14:15:00Z',
    workflowInstanceId: 'wf-inst-002',
    assignedProfessionalId: 'prof-psi-02',
  },
  {
    id: 'ISM-2025-00003',
    name: 'Joana Souza',
    cpf: '***.***.***-**',
    birthDate: '2012-05-14',
    profile: 'minor',
    securityLevel: 'elevated',
    iipScore: 65,
    priorityLevel: 'high',
    attendanceMotives: ['ansiedade', 'familia'],
    isSecurityForces: false,
    legalGuardianId: 'ISM-2025-00004',
    hasDigitalVault: false,
    registrationStatus: 'pending_documents',
    createdAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'ISM-2025-00004',
    name: 'Roberto Lima',
    cpf: '***.***.***-**',
    birthDate: '1978-11-22',
    profile: 'adult_civilian',
    securityLevel: 'standard',
    iipScore: 28,
    priorityLevel: 'regular',
    attendanceMotives: ['encaminhamento'],
    isSecurityForces: false,
    hasDigitalVault: false,
    registrationStatus: 'pending_review',
    createdAt: '2026-01-10T16:20:00Z',
  },
];
