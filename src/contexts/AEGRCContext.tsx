import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  AEGRCContextValue,
  AEGRCState,
  Risk,
  RiskLevel,
  ComplianceItem,
  InternalControl,
  Policy,
  StrategicFoundation,
  StrategicObjective,
  OKR,
  KeyResult,
  Committee,
  CommitteeMeeting,
  CommitteeDecision,
  AuditEntry,
  GovernanceEventType,
} from '../types/aegrc';

// =============================================================================
// DADOS INICIAIS (Seed Data)
// =============================================================================

const INITIAL_FOUNDATION: StrategicFoundation = {
  mission: 'Promover o desenvolvimento humano integral de famílias e indivíduos em situação de vulnerabilidade social, por meio de atendimento psicossocial, jurídico e educacional, com ética, respeito e comprometimento.',
  vision: 'Ser referência nacional em atenção psicossocial e assistência social, reconhecido pela excelência no atendimento, inovação em práticas terapêuticas e impacto transformador na vida das pessoas atendidas.',
  values: ['Ética e Transparência', 'Respeito à Dignidade Humana', 'Comprometimento Social', 'Inovação com Propósito', 'Excelência no Atendimento', 'Colaboração e Parceria'],
  lastUpdatedAt: new Date().toISOString(),
  lastUpdatedBy: 'Conselho Deliberativo',
};

const INITIAL_RISKS: Risk[] = [
  {
    id: 'risk-001',
    code: 'RSK-001',
    title: 'Violação de dados de beneficiários',
    description: 'Risco de acesso não autorizado a dados sensíveis de beneficiários, incluindo informações de saúde e situação de vulnerabilidade.',
    category: 'technological',
    status: 'mitigating',
    probability: 3,
    impact: 5,
    inherentScore: 15,
    residualScore: 8,
    level: 'high',
    response: 'mitigate',
    owner: 'CISO / TI',
    reviewDate: '2025-12-31',
    responseplan: 'Implementar criptografia end-to-end, autenticação MFA, monitoramento contínuo e resposta a incidentes conforme LGPD.',
    mitigationActions: ['Implementar MFA para todos os usuários', 'Criptografar banco de dados', 'Treinamento LGPD para equipe'],
    relatedControlIds: ['ctr-001', 'ctr-002'],
    indicators: [{ id: 'kri-001', name: 'Tentativas de acesso não autorizado', currentValue: '2', threshold: '5', unit: '/semana', status: 'ok' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'Direção Executiva',
    auditTrail: [],
  },
  {
    id: 'risk-002',
    code: 'RSK-002',
    title: 'Descontinuidade de financiamento institucional',
    description: 'Risco de perda de convênios ou financiamentos governamentais que sustentam os programas assistenciais.',
    category: 'financial',
    status: 'identified',
    probability: 2,
    impact: 5,
    inherentScore: 10,
    residualScore: 6,
    level: 'high',
    response: 'mitigate',
    owner: 'Diretoria Executiva',
    reviewDate: '2025-12-31',
    responseplan: 'Diversificar fontes de financiamento, desenvolver captação de recursos junto a fundações privadas e campanhas de doação.',
    mitigationActions: ['Mapear 5 novas fontes de financiamento', 'Criar fundo de reserva equivalente a 6 meses de operação'],
    relatedControlIds: [],
    indicators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'Conselho Fiscal',
    auditTrail: [],
  },
  {
    id: 'risk-003',
    code: 'RSK-003',
    title: 'Não conformidade com LGPD',
    description: 'Risco de descumprimento da Lei Geral de Proteção de Dados, expondo o Instituto a sanções e multas.',
    category: 'legal',
    status: 'mitigating',
    probability: 3,
    impact: 4,
    inherentScore: 12,
    residualScore: 6,
    level: 'high',
    response: 'mitigate',
    owner: 'DPO / Jurídico',
    reviewDate: '2025-06-30',
    responseplan: 'Mapear fluxo de dados, nomear DPO, elaborar política de privacidade, implementar RIPD e canal de titulares.',
    mitigationActions: ['Nomear DPO formalmente', 'Elaborar RIPD para todos os processos', 'Publicar Política de Privacidade'],
    relatedControlIds: ['ctr-003'],
    indicators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'Compliance',
    auditTrail: [],
  },
  {
    id: 'risk-004',
    code: 'RSK-004',
    title: 'Burnout e rotatividade da equipe técnica',
    description: 'Elevada carga de trabalho emocional pode causar burnout em profissionais de saúde mental, gerando alta rotatividade.',
    category: 'operational',
    status: 'assessed',
    probability: 4,
    impact: 3,
    inherentScore: 12,
    residualScore: 9,
    level: 'medium',
    response: 'mitigate',
    owner: 'RH / Gestão de Pessoas',
    reviewDate: '2025-09-30',
    responseplan: 'Implementar supervisão clínica regular, limitar número de casos por profissional e oferecer suporte psicológico à equipe.',
    mitigationActions: ['Supervisão clínica mensal', 'Limite de 15 casos por profissional', 'Psicoterapia como benefício'],
    relatedControlIds: [],
    indicators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'RH',
    auditTrail: [],
  },
];

const INITIAL_COMPLIANCE: ComplianceItem[] = [
  { id: 'cpl-001', code: 'LGPD-01', title: 'Nomeação formal do DPO', description: 'Nomear Encarregado de Dados (DPO) conforme Art. 41 da LGPD', category: 'lgpd', status: 'compliant', owner: 'Jurídico', deadline: '2024-12-31', lastReviewDate: '2025-01-15', nextReviewDate: '2025-07-15', evidence: [{ id: 'ev-001', description: 'Ato de Nomeação assinado', documentRef: 'DOC-DPO-2024-001', validatedAt: '2025-01-15', validatedBy: 'Conselho' }], relatedPolicyIds: [], relatedRiskIds: ['risk-003'], alerts: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
  { id: 'cpl-002', code: 'LGPD-02', title: 'Política de Privacidade publicada', description: 'Publicar Política de Privacidade acessível a todos os titulares de dados', category: 'lgpd', status: 'compliant', owner: 'DPO', deadline: '2024-12-31', lastReviewDate: '2025-01-15', nextReviewDate: '2025-07-15', evidence: [], relatedPolicyIds: ['pol-001'], relatedRiskIds: ['risk-003'], alerts: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
  { id: 'cpl-003', code: 'LGPD-03', title: 'RIPD — Relatório de Impacto à Proteção de Dados', description: 'Elaborar RIPD para os processos de maior risco de tratamento de dados pessoais sensíveis', category: 'lgpd', status: 'in_analysis', owner: 'DPO', deadline: '2025-06-30', lastReviewDate: '2025-03-01', nextReviewDate: '2025-06-30', evidence: [], relatedPolicyIds: [], relatedRiskIds: ['risk-001', 'risk-003'], alerts: ['Prazo se aproximando — 30 dias restantes'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
  { id: 'cpl-004', code: 'LGPD-04', title: 'Canal de atendimento a titulares de dados', description: 'Disponibilizar canal para exercício de direitos dos titulares (acesso, correção, eliminação)', category: 'lgpd', status: 'non_compliant', owner: 'TI / DPO', deadline: '2025-03-31', lastReviewDate: '2025-02-01', nextReviewDate: '2025-03-31', evidence: [], relatedPolicyIds: [], relatedRiskIds: ['risk-003'], alerts: ['NÃO CONFORME — Canal ainda não implementado'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
  { id: 'cpl-005', code: 'ETH-01', title: 'Código de Ética publicado e assinado pela equipe', description: 'Todos os colaboradores e voluntários devem ter lido e assinado o Código de Ética institucional', category: 'code_of_ethics', status: 'compliant', owner: 'RH', deadline: '2024-12-31', lastReviewDate: '2025-01-10', nextReviewDate: '2026-01-10', evidence: [], relatedPolicyIds: ['pol-002'], relatedRiskIds: [], alerts: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
  { id: 'cpl-006', code: 'CTRL-01', title: 'Segregação de funções financeiras', description: 'Garantir que aprovação e pagamento de despesas sejam realizados por pessoas distintas', category: 'corporate_control', status: 'compliant', owner: 'Financeiro', deadline: '2024-12-31', lastReviewDate: '2025-02-01', nextReviewDate: '2025-08-01', evidence: [], relatedPolicyIds: [], relatedRiskIds: [], alerts: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
];

const INITIAL_CONTROLS: InternalControl[] = [
  { id: 'ctr-001', code: 'CTR-001', name: 'Autenticação Multifator (MFA)', description: 'Controle preventivo que exige segundo fator de autenticação para acesso ao sistema', type: 'preventive', owner: 'TI / CISO', frequency: 'continuous', effectiveness: 'effective', lastExecutionDate: '2025-07-01', nextExecutionDate: '2025-08-01', relatedRiskIds: ['risk-001'], relatedComplianceIds: ['cpl-001'], evidenceDescription: 'Logs de autenticação com MFA ativo para 100% dos usuários', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
  { id: 'ctr-002', code: 'CTR-002', name: 'Monitoramento de Acesso a Dados', description: 'Controle detectivo que monitora acessos anômalos a dados sensíveis de beneficiários', type: 'detective', owner: 'CISO', frequency: 'continuous', effectiveness: 'partial', lastExecutionDate: '2025-07-10', nextExecutionDate: '2025-08-10', relatedRiskIds: ['risk-001'], relatedComplianceIds: [], evidenceDescription: 'Relatório semanal de alertas de acesso', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
  { id: 'ctr-003', code: 'CTR-003', name: 'Revisão periódica de acessos', description: 'Controle preventivo de revisão trimestral das permissões de acesso por gestor de área', type: 'preventive', owner: 'IAM / TI', frequency: 'quarterly', effectiveness: 'effective', lastExecutionDate: '2025-04-01', nextExecutionDate: '2025-07-01', relatedRiskIds: ['risk-003'], relatedComplianceIds: ['cpl-001'], evidenceDescription: 'Relatório de revisão de acessos assinado pelo gestor', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
  { id: 'ctr-004', code: 'CTR-004', name: 'Conciliação bancária mensal', description: 'Controle detectivo de conciliação de todas as contas bancárias com extratos oficiais', type: 'detective', owner: 'Financeiro', frequency: 'monthly', effectiveness: 'effective', lastExecutionDate: '2025-06-30', nextExecutionDate: '2025-07-31', relatedRiskIds: ['risk-002'], relatedComplianceIds: ['cpl-006'], evidenceDescription: 'Relatório de conciliação assinado pelo contador e pelo diretor financeiro', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
];

const INITIAL_POLICIES: Policy[] = [
  { id: 'pol-001', code: 'POL-001', title: 'Política de Privacidade e Proteção de Dados', description: 'Estabelece as diretrizes para tratamento de dados pessoais de beneficiários, colaboradores e parceiros, em conformidade com a LGPD.', type: 'policy', status: 'published', currentVersion: '1.2', versions: [{ version: '1.0', content: 'Versão inicial da política de privacidade.', changesDescription: 'Criação inicial', publishedAt: '2024-03-01', publishedBy: 'DPO', approvedBy: 'Conselho Deliberativo' }, { version: '1.2', content: 'Versão atualizada com inclusão de canal do titular e RIPD.', changesDescription: 'Atualização para incluir Canal do Titular e referências ao RIPD', publishedAt: '2024-12-01', publishedBy: 'DPO', approvedBy: 'Conselho Deliberativo' }], owner: 'DPO', approver: 'Conselho Deliberativo', publishedAt: '2024-12-01', expiresAt: '2025-12-01', reviewIntervalDays: 365, nextReviewDate: '2025-12-01', relatedRiskIds: ['risk-001', 'risk-003'], relatedComplianceIds: ['cpl-002'], tags: ['LGPD', 'Privacidade', 'Dados Pessoais'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
  { id: 'pol-002', code: 'POL-002', title: 'Código de Ética e Conduta Profissional', description: 'Define os padrões éticos e de conduta esperados de todos os colaboradores, voluntários e prestadores de serviço do Instituto.', type: 'policy', status: 'published', currentVersion: '2.0', versions: [{ version: '2.0', content: 'Código de ética revisado e aprovado pelo Conselho.', changesDescription: 'Revisão completa com inclusão de cláusulas sobre sigilo profissional e prevenção ao assédio', publishedAt: '2024-06-01', publishedBy: 'RH', approvedBy: 'Conselho Deliberativo' }], owner: 'RH', approver: 'Conselho Deliberativo', publishedAt: '2024-06-01', expiresAt: '2026-06-01', reviewIntervalDays: 730, nextReviewDate: '2026-06-01', relatedRiskIds: [], relatedComplianceIds: ['cpl-005'], tags: ['Ética', 'Conduta', 'Compliance'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
  { id: 'pol-003', code: 'POL-003', title: 'Política de Segurança da Informação', description: 'Define as diretrizes de segurança para proteção dos ativos de informação do Instituto.', type: 'policy', status: 'in_review', currentVersion: '1.1', versions: [{ version: '1.1', content: 'Política de segurança atualizada.', changesDescription: 'Inclusão de requisitos Zero Trust e gestão de identidade', publishedAt: '', publishedBy: 'CISO', approvedBy: '' }], owner: 'CISO', approver: 'Diretoria Executiva', publishedAt: null, expiresAt: null, reviewIntervalDays: 365, nextReviewDate: '2025-12-31', relatedRiskIds: ['risk-001'], relatedComplianceIds: [], tags: ['Segurança', 'TI', 'MCSI'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] },
];

const INITIAL_OKRS: OKR[] = [
  {
    id: 'okr-001', code: 'OKR-2025-01',
    objective: 'Expandir o alcance dos programas assistenciais com qualidade e sustentabilidade',
    description: 'Aumentar o número de famílias atendidas mantendo a excelência no serviço e a saúde financeira da organização.',
    cycle: 'Annual', year: 2025, owner: 'Diretoria Executiva', team: 'Toda a Organização',
    status: 'on_track', overallProgress: 62,
    keyResults: [
      { id: 'kr-001', title: 'Atender 500 famílias ao longo do ano', metricType: 'number', startValue: 0, currentValue: 312, targetValue: 500, unit: 'famílias', progress: 62, owner: 'Coord. Assistencial', dueDate: '2025-12-31', confidence: 'high', lastUpdatedAt: new Date().toISOString(), checkIns: [{ date: '2025-04-01', value: 180, note: 'Q1 concluído' }, { date: '2025-07-01', value: 312, note: 'Ritmo acima do esperado' }] },
      { id: 'kr-002', title: 'Atingir 90% de satisfação nos atendimentos', metricType: 'percentage', startValue: 78, currentValue: 87, targetValue: 90, unit: '%', progress: 75, owner: 'Qualidade', dueDate: '2025-12-31', confidence: 'medium', lastUpdatedAt: new Date().toISOString(), checkIns: [] },
      { id: 'kr-003', title: 'Garantir reserva financeira equivalente a 6 meses', metricType: 'percentage', startValue: 10, currentValue: 40, targetValue: 100, unit: '% da meta', progress: 40, owner: 'Financeiro', dueDate: '2025-12-31', confidence: 'low', lastUpdatedAt: new Date().toISOString(), checkIns: [] },
    ],
    relatedObjectiveId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [],
  },
  {
    id: 'okr-002', code: 'OKR-2025-02',
    objective: 'Consolidar a conformidade com a LGPD e a maturidade em segurança da informação',
    description: 'Garantir que todos os processos de tratamento de dados estejam em conformidade legal e que a infraestrutura de segurança seja robusta.',
    cycle: 'Annual', year: 2025, owner: 'DPO / CISO', team: 'TI, Jurídico, Compliance',
    status: 'at_risk', overallProgress: 45,
    keyResults: [
      { id: 'kr-004', title: 'Implementar RIPD para 100% dos processos críticos', metricType: 'percentage', startValue: 0, currentValue: 30, targetValue: 100, unit: '%', progress: 30, owner: 'DPO', dueDate: '2025-06-30', confidence: 'low', lastUpdatedAt: new Date().toISOString(), checkIns: [] },
      { id: 'kr-005', title: 'Atingir score 80% na auditoria de segurança', metricType: 'percentage', startValue: 55, currentValue: 68, targetValue: 80, unit: '%', progress: 52, owner: 'CISO', dueDate: '2025-12-31', confidence: 'medium', lastUpdatedAt: new Date().toISOString(), checkIns: [] },
      { id: 'kr-006', title: 'Implementar canal de titulares 100% funcional', metricType: 'percentage', startValue: 0, currentValue: 0, targetValue: 100, unit: '% implantado', progress: 0, owner: 'TI / DPO', dueDate: '2025-03-31', confidence: 'low', lastUpdatedAt: new Date().toISOString(), checkIns: [] },
    ],
    relatedObjectiveId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [],
  },
];

const INITIAL_COMMITTEES: Committee[] = [
  {
    id: 'cmt-001', code: 'CMT-001', name: 'Conselho Deliberativo', description: 'Órgão máximo de deliberação do Instituto, responsável por aprovar diretrizes estratégicas e orçamentárias.', type: 'deliberative', isActive: true,
    members: [
      { userId: 'usr-001', name: 'Dra. Maria Augusta Pereira', role: 'president', joinedAt: '2020-01-01', isActive: true },
      { userId: 'usr-002', name: 'Prof. Carlos Eduardo Lima', role: 'secretary', joinedAt: '2020-01-01', isActive: true },
      { userId: 'usr-003', name: 'Adv. Fernanda Costa', role: 'member', joinedAt: '2022-03-01', isActive: true },
    ],
    meetings: [
      {
        id: 'mtg-001', committeeId: 'cmt-001', title: 'Reunião Ordinária — Julho/2025', scheduledAt: '2025-07-25T14:00:00', location: 'Sede do Instituto / Zoom', isVirtual: false, status: 'scheduled', quorumRequired: 3, quorumAchieved: 0,
        agenda: [
          { id: 'ag-001', order: 1, title: 'Aprovação da ata anterior', description: 'Leitura e aprovação da ata da reunião de junho/2025', duration: 10, presenter: 'Secretário', type: 'approval' },
          { id: 'ag-002', order: 2, title: 'Relatório financeiro Q2/2025', description: 'Apresentação dos resultados financeiros do segundo trimestre', duration: 30, presenter: 'Diretora Financeira', type: 'information' },
          { id: 'ag-003', order: 3, title: 'Aprovação da Política de Segurança da Informação v1.1', description: 'Deliberação sobre a nova versão da PSI', duration: 20, presenter: 'CISO', type: 'decision' },
        ],
        minutesText: '', decisions: [],
        createdBy: 'Secretário', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ],
    meetingFrequency: 'monthly', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [],
  },
  {
    id: 'cmt-002', code: 'CMT-002', name: 'Comitê de Riscos e Compliance', description: 'Responsável por supervisionar a gestão de riscos, garantir conformidade regulatória e acompanhar os controles internos.', type: 'risk', isActive: true,
    members: [
      { userId: 'usr-004', name: 'Dra. Ana Lúcia Souza', role: 'president', joinedAt: '2023-01-01', isActive: true },
      { userId: 'usr-005', name: 'Dr. Roberto Mendes', role: 'member', joinedAt: '2023-01-01', isActive: true },
    ],
    meetings: [],
    meetingFrequency: 'quarterly', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [],
  },
];

const INITIAL_OBJECTIVES: StrategicObjective[] = [
  { id: 'obj-001', code: 'OBJ-01', title: 'Ampliar cobertura assistencial', description: 'Expandir o alcance dos programas para novos territórios e populações vulneráveis.', perspective: 'social_impact', owner: 'Diretoria Executiva', startDate: '2025-01-01', endDate: '2025-12-31', progress: 62, status: 'in_progress', initiatives: [{ id: 'ini-001', title: 'Expansão para zona leste', description: 'Abrir ponto de atendimento na zona leste de SP', objectiveId: 'obj-001', owner: 'Coord. Assistencial', startDate: '2025-03-01', endDate: '2025-09-30', progress: 45, status: 'in_progress', budget: 25000, tags: ['expansão', 'zona-leste'] }], relatedOKRIds: ['okr-001'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'obj-002', code: 'OBJ-02', title: 'Fortalecer a governança e compliance', description: 'Atingir maturidade nível 4 em governança institucional e conformidade plena com a LGPD.', perspective: 'internal_process', owner: 'DPO / CISO', startDate: '2025-01-01', endDate: '2025-12-31', progress: 45, status: 'at_risk', initiatives: [], relatedOKRIds: ['okr-002'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// =============================================================================
// HELPERS
// =============================================================================

function generateHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function createAuditEntry(
  actor: string,
  action: GovernanceEventType | string,
  module: string,
  entityId: string,
  entityType: string,
  description: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
): AuditEntry {
  const entry: AuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    module,
    entityId,
    entityType,
    description,
    before,
    after,
    hash: generateHash(`${actor}${action}${entityId}${Date.now()}`),
  };

  // Dispatch event for AsyncAPI compatibility
  window.dispatchEvent(new CustomEvent('aegrc:event', { detail: entry }));

  return entry;
}

function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 15) return 'critical';
  if (score >= 9) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function calculateOKRProgress(keyResults: KeyResult[]): number {
  if (!keyResults.length) return 0;
  return Math.round(keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length);
}

function persistToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('[AEGRC] Failed to persist to localStorage:', key, e);
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const AEGRCContext = createContext<AEGRCContextValue | null>(null);

export function AEGRCProvider({ children }: { children: React.ReactNode }) {
  const [strategicFoundation, setStrategicFoundation] = useState<StrategicFoundation>(
    () => loadFromStorage('aegrc_foundation', INITIAL_FOUNDATION)
  );
  const [risks, setRisks] = useState<Risk[]>(
    () => loadFromStorage('aegrc_risks', INITIAL_RISKS)
  );
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>(
    () => loadFromStorage('aegrc_compliance', INITIAL_COMPLIANCE)
  );
  const [internalControls, setInternalControls] = useState<InternalControl[]>(
    () => loadFromStorage('aegrc_controls', INITIAL_CONTROLS)
  );
  const [policies, setPolicies] = useState<Policy[]>(
    () => loadFromStorage('aegrc_policies', INITIAL_POLICIES)
  );
  const [strategicObjectives, setStrategicObjectives] = useState<StrategicObjective[]>(
    () => loadFromStorage('aegrc_objectives', INITIAL_OBJECTIVES)
  );
  const [okrs, setOKRs] = useState<OKR[]>(
    () => loadFromStorage('aegrc_okrs', INITIAL_OKRS)
  );
  const [committees, setCommittees] = useState<Committee[]>(
    () => loadFromStorage('aegrc_committees', INITIAL_COMMITTEES)
  );
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(
    () => loadFromStorage('aegrc_audit_log', [])
  );
  const [governanceBodies] = useState([]);

  // Persist on change
  useEffect(() => { persistToStorage('aegrc_risks', risks); }, [risks]);
  useEffect(() => { persistToStorage('aegrc_compliance', complianceItems); }, [complianceItems]);
  useEffect(() => { persistToStorage('aegrc_controls', internalControls); }, [internalControls]);
  useEffect(() => { persistToStorage('aegrc_policies', policies); }, [policies]);
  useEffect(() => { persistToStorage('aegrc_objectives', strategicObjectives); }, [strategicObjectives]);
  useEffect(() => { persistToStorage('aegrc_okrs', okrs); }, [okrs]);
  useEffect(() => { persistToStorage('aegrc_committees', committees); }, [committees]);
  useEffect(() => { persistToStorage('aegrc_audit_log', auditLog); }, [auditLog]);
  useEffect(() => { persistToStorage('aegrc_foundation', strategicFoundation); }, [strategicFoundation]);

  function addAuditEntry(entry: AuditEntry) {
    setAuditLog(prev => [entry, ...prev].slice(0, 500)); // max 500 entries
  }

  // ---------------------------------------------------------------------------
  // ERM
  // ---------------------------------------------------------------------------
  const addRisk = useCallback((risk: Omit<Risk, 'id' | 'code' | 'inherentScore' | 'level' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => {
    const inherentScore = risk.probability * risk.impact;
    const level = calculateRiskLevel(inherentScore);
    const newRisk: Risk = {
      ...risk,
      id: `risk-${Date.now()}`,
      code: `RSK-${String(risks.length + 1).padStart(3, '0')}`,
      inherentScore,
      residualScore: inherentScore,
      level,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [],
    };
    const entry = createAuditEntry('Sistema', 'RiskRegistered', 'ERM', newRisk.id, 'Risk', `Risco '${newRisk.title}' registrado — Score: ${inherentScore} (${level.toUpperCase()})`);
    newRisk.auditTrail = [entry];
    setRisks(prev => [...prev, newRisk]);
    addAuditEntry(entry);
  }, [risks.length]);

  const updateRisk = useCallback((id: string, updates: Partial<Risk>) => {
    setRisks(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates, updatedAt: new Date().toISOString() };
      if (updates.probability || updates.impact) {
        updated.inherentScore = updated.probability * updated.impact;
        updated.level = calculateRiskLevel(updated.inherentScore);
      }
      const entry = createAuditEntry('Sistema', 'RiskMitigated', 'ERM', id, 'Risk', `Risco '${updated.title}' atualizado`);
      addAuditEntry(entry);
      return updated;
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Compliance
  // ---------------------------------------------------------------------------
  const updateComplianceItem = useCallback((id: string, updates: Partial<ComplianceItem>) => {
    setComplianceItems(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates, updatedAt: new Date().toISOString() };
      if (updates.status === 'non_compliant') {
        const entry = createAuditEntry('Sistema', 'ComplianceViolationDetected', 'Compliance', id, 'ComplianceItem', `Desvio detectado: '${updated.title}'`);
        addAuditEntry(entry);
      }
      return updated;
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------
  const addControl = useCallback((control: Omit<InternalControl, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => {
    const newControl: InternalControl = {
      ...control,
      id: `ctr-${Date.now()}`,
      code: `CTR-${String(internalControls.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [],
    };
    const entry = createAuditEntry('Sistema', 'InternalControlExecuted', 'Controls', newControl.id, 'InternalControl', `Controle '${newControl.name}' cadastrado`);
    newControl.auditTrail = [entry];
    setInternalControls(prev => [...prev, newControl]);
    addAuditEntry(entry);
  }, [internalControls.length]);

  const updateControl = useCallback((id: string, updates: Partial<InternalControl>) => {
    setInternalControls(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
  }, []);

  // ---------------------------------------------------------------------------
  // Policies
  // ---------------------------------------------------------------------------
  const addPolicy = useCallback((policy: Omit<Policy, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => {
    const newPolicy: Policy = {
      ...policy,
      id: `pol-${Date.now()}`,
      code: `POL-${String(policies.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [],
    };
    const entry = createAuditEntry('Sistema', 'PolicyPublished', 'Policies', newPolicy.id, 'Policy', `Política '${newPolicy.title}' cadastrada`);
    newPolicy.auditTrail = [entry];
    setPolicies(prev => [...prev, newPolicy]);
    addAuditEntry(entry);
  }, [policies.length]);

  const updatePolicy = useCallback((id: string, updates: Partial<Policy>) => {
    setPolicies(prev => prev.map(p => {
      if (p.id !== id) return p;
      const entry = createAuditEntry('Sistema', 'PolicyVersioned', 'Policies', id, 'Policy', `Política atualizada`);
      addAuditEntry(entry);
      return { ...p, ...updates, updatedAt: new Date().toISOString(), auditTrail: [...p.auditTrail, entry] };
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Strategic
  // ---------------------------------------------------------------------------
  const updateStrategicFoundation = useCallback((updates: Partial<StrategicFoundation>) => {
    const entry = createAuditEntry('Sistema', 'GovernanceReviewCompleted', 'Strategy', 'foundation', 'StrategicFoundation', 'Fundação estratégica atualizada');
    addAuditEntry(entry);
    setStrategicFoundation(prev => ({ ...prev, ...updates, lastUpdatedAt: new Date().toISOString() }));
  }, []);

  const addStrategicObjective = useCallback((obj: Omit<StrategicObjective, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => {
    const newObj: StrategicObjective = {
      ...obj,
      id: `obj-${Date.now()}`,
      code: `OBJ-${String(strategicObjectives.length + 1).padStart(2, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const entry = createAuditEntry('Sistema', 'StrategicGoalUpdated', 'Strategy', newObj.id, 'StrategicObjective', `Objetivo '${newObj.title}' cadastrado`);
    addAuditEntry(entry);
    setStrategicObjectives(prev => [...prev, newObj]);
  }, [strategicObjectives.length]);

  const updateStrategicObjective = useCallback((id: string, updates: Partial<StrategicObjective>) => {
    setStrategicObjectives(prev => prev.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o));
  }, []);

  // ---------------------------------------------------------------------------
  // OKRs
  // ---------------------------------------------------------------------------
  const addOKR = useCallback((okr: Omit<OKR, 'id' | 'code' | 'overallProgress' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => {
    const newOKR: OKR = {
      ...okr,
      id: `okr-${Date.now()}`,
      code: `OKR-${okr.year}-${String(okrs.length + 1).padStart(2, '0')}`,
      overallProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [],
    };
    const entry = createAuditEntry('Sistema', 'OKRCreated', 'OKRs', newOKR.id, 'OKR', `OKR '${newOKR.objective}' criado`);
    newOKR.auditTrail = [entry];
    setOKRs(prev => [...prev, newOKR]);
    addAuditEntry(entry);
  }, [okrs.length]);

  const updateKeyResult = useCallback((okrId: string, krId: string, newValue: number, note: string) => {
    setOKRs(prev => prev.map(okr => {
      if (okr.id !== okrId) return okr;
      const updatedKRs = okr.keyResults.map(kr => {
        if (kr.id !== krId) return kr;
        const range = kr.targetValue - kr.startValue;
        const progress = range === 0 ? 100 : Math.min(100, Math.round(((newValue - kr.startValue) / range) * 100));
        return { ...kr, currentValue: newValue, progress, lastUpdatedAt: new Date().toISOString(), checkIns: [...kr.checkIns, { date: new Date().toISOString(), value: newValue, note }] };
      });
      const overallProgress = calculateOKRProgress(updatedKRs);
      const status: OKR['status'] = overallProgress >= 100 ? 'completed' : overallProgress >= 70 ? 'on_track' : overallProgress >= 40 ? 'at_risk' : 'behind';
      const entry = createAuditEntry('Sistema', overallProgress >= 100 ? 'OKRCompleted' : 'KeyResultUpdated', 'OKRs', okrId, 'OKR', `Key Result atualizado — Progresso: ${overallProgress}%`);
      addAuditEntry(entry);
      return { ...okr, keyResults: updatedKRs, overallProgress, status, updatedAt: new Date().toISOString() };
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Committees
  // ---------------------------------------------------------------------------
  const addCommittee = useCallback((committee: Omit<Committee, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => {
    const newCommittee: Committee = {
      ...committee,
      id: `cmt-${Date.now()}`,
      code: `CMT-${String(committees.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [],
    };
    const entry = createAuditEntry('Sistema', 'GovernanceBodyUpdated', 'Committees', newCommittee.id, 'Committee', `Comitê '${newCommittee.name}' criado`);
    newCommittee.auditTrail = [entry];
    setCommittees(prev => [...prev, newCommittee]);
    addAuditEntry(entry);
  }, [committees.length]);

  const addCommitteeMeeting = useCallback((committeeId: string, meeting: Omit<CommitteeMeeting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMeeting: CommitteeMeeting = { ...meeting, id: `mtg-${Date.now()}`, committeeId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const entry = createAuditEntry('Sistema', 'CommitteeMeetingScheduled', 'Committees', committeeId, 'CommitteeMeeting', `Reunião '${newMeeting.title}' agendada`);
    addAuditEntry(entry);
    setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, meetings: [...c.meetings, newMeeting], updatedAt: new Date().toISOString() } : c));
  }, []);

  const addCommitteeDecision = useCallback((committeeId: string, meetingId: string, decision: Omit<CommitteeDecision, 'id' | 'decidedAt' | 'auditTrail'>) => {
    const entry = createAuditEntry('Sistema', 'CommitteeDecisionRecorded', 'Committees', meetingId, 'CommitteeDecision', `Deliberação '${decision.title}' registrada`);
    addAuditEntry(entry);
    const newDecision: CommitteeDecision = { ...decision, id: `dec-${Date.now()}`, decidedAt: new Date().toISOString(), auditTrail: [entry] };
    setCommittees(prev => prev.map(c => {
      if (c.id !== committeeId) return c;
      return { ...c, meetings: c.meetings.map(m => m.id === meetingId ? { ...m, decisions: [...m.decisions, newDecision] } : m), updatedAt: new Date().toISOString() };
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------
  const risksByLevel = useMemo<Record<RiskLevel, Risk[]>>(() => ({
    critical: risks.filter(r => r.level === 'critical'),
    high: risks.filter(r => r.level === 'high'),
    medium: risks.filter(r => r.level === 'medium'),
    low: risks.filter(r => r.level === 'low'),
  }), [risks]);

  const complianceScore = useMemo(() => {
    if (!complianceItems.length) return 0;
    const compliant = complianceItems.filter(c => c.status === 'compliant').length;
    return Math.round((compliant / complianceItems.length) * 100);
  }, [complianceItems]);

  const governanceMaturityScore = useMemo(() => {
    const factors = [
      risks.length > 0 ? 20 : 0,
      complianceScore >= 70 ? 20 : Math.round(complianceScore / 70 * 20),
      internalControls.length > 0 ? 20 : 0,
      policies.filter(p => p.status === 'published').length > 0 ? 20 : 0,
      okrs.length > 0 ? 20 : 0,
    ];
    return factors.reduce((a, b) => a + b, 0);
  }, [risks.length, complianceScore, internalControls.length, policies, okrs.length]);

  const criticalAlerts = useMemo(() => {
    const alerts: Array<{ type: string; message: string; entityId: string }> = [];
    complianceItems.filter(c => c.status === 'non_compliant').forEach(c => {
      alerts.push({ type: 'compliance', message: `Desvio de conformidade: ${c.title}`, entityId: c.id });
    });
    risks.filter(r => r.level === 'critical').forEach(r => {
      alerts.push({ type: 'risk', message: `Risco crítico: ${r.title}`, entityId: r.id });
    });
    policies.filter(p => {
      if (!p.nextReviewDate) return false;
      const days = (new Date(p.nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return days <= 30 && days >= 0;
    }).forEach(p => {
      alerts.push({ type: 'policy', message: `Política vence em breve: ${p.title}`, entityId: p.id });
    });
    return alerts;
  }, [complianceItems, risks, policies]);

  const value: AEGRCContextValue = {
    strategicFoundation,
    governanceBodies,
    risks,
    complianceItems,
    internalControls,
    policies,
    strategicObjectives,
    okrs,
    committees,
    auditLog,
    addRisk,
    updateRisk,
    updateComplianceItem,
    addControl,
    updateControl,
    addPolicy,
    updatePolicy,
    updateStrategicFoundation,
    addStrategicObjective,
    updateStrategicObjective,
    addOKR,
    updateKeyResult,
    addCommittee,
    addCommitteeMeeting,
    addCommitteeDecision,
    risksByLevel,
    complianceScore,
    governanceMaturityScore,
    criticalAlerts,
  };

  return <AEGRCContext.Provider value={value}>{children}</AEGRCContext.Provider>;
}

export function useAEGRC(): AEGRCContextValue {
  const ctx = useContext(AEGRCContext);
  if (!ctx) throw new Error('useAEGRC must be used within AEGRCProvider');
  return ctx;
}
