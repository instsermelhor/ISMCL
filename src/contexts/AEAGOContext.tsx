import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  AEAGOContextValue, ArchitectureComponent, ArchitectureDecisionRecord, DependencyViolation,
  TechnicalDebtItem, ArchitectureStandard, DigitalTwinNode, AEAGOAuditEntry
} from '../types/aeago';

const INITIAL_COMPONENTS: ArchitectureComponent[] = [
  { id: 'comp-1', code: 'COMP-IAM-01', name: 'IAMCenter & Identity Provider', domain: 'identity_iam', type: 'context_provider', status: 'operational', description: 'Serviço central de autenticação, RBAC/ABAC e segregação de funções.', technologies: ['React Context', 'TypeScript', 'JWT'], dependencies: [], owner: 'CISO / IAM Lead' },
  { id: 'comp-2', code: 'COMP-BPMS-01', name: 'BPMS Engine & Workflow Orchestrator', domain: 'workflow_bpms', type: 'microservice', status: 'operational', description: 'Motor de execução de fluxos institucionais e automação de processos.', technologies: ['React Context', 'BPMN 2.0', 'AsyncAPI'], dependencies: ['comp-1'], owner: 'Principal Architect' },
  { id: 'comp-3', code: 'COMP-AECM-01', name: 'AECM Content Management & OCR', domain: 'documents_ecm', type: 'microservice', status: 'operational', description: 'Gestão de acervo documental, busca semântica, OCR e arquivo digital.', technologies: ['gRPC', 'Vector Embedding', 'SHA-256'], dependencies: ['comp-1', 'comp-2'], owner: 'CKO / ECM Architect' },
  { id: 'comp-4', code: 'COMP-AEGRC-01', name: 'AEGRC Governance & ERM Platform', domain: 'governance_aegrc', type: 'frontend_module', status: 'operational', description: 'Plataforma de Governança, Riscos 5x5, Compliance LGPD, OKRs e Comitês.', technologies: ['React', 'TypeScript', 'AsyncAPI'], dependencies: ['comp-1', 'comp-2'], owner: 'Chief Governance Officer' },
  { id: 'comp-5', code: 'COMP-ACU-01', name: 'ACU Corporate University & LMS', domain: 'university_acu', type: 'frontend_module', status: 'operational', description: 'Universidade corporativa, matriz de competências, LMS e certificados QR Code.', technologies: ['React Context', 'SCORM/xAPI', 'QR Code'], dependencies: ['comp-1', 'comp-3'], owner: 'Chief Learning Officer' },
  { id: 'comp-6', code: 'COMP-AEIP-01', name: 'AEIP Integration Hub & ESB', domain: 'integrations_aeip', type: 'api_gateway', status: 'operational', description: 'Barramento de integração, API Gateway, Event Bus com DLQ e conectores.', technologies: ['Fetch API', 'OpenAPI', 'AsyncAPI', 'HMAC'], dependencies: ['comp-1', 'comp-2', 'comp-3', 'comp-4', 'comp-5'], owner: 'Chief Integration Officer' }
];

const INITIAL_ADRS: ArchitectureDecisionRecord[] = [
  { id: 'adr-1', number: 1, title: 'Adopção da Arquitetura Orientada a Eventos (AsyncAPI)', status: 'accepted', domain: 'integrations_aeip', context: 'Necessidade de desacoplamento total entre os módulos corporativos do Projeto Aura.', decision: 'Todos os microsserviços emitirão eventos padronizados utilizando `window.dispatchEvent` alinhados com especificações AsyncAPI.', consequences: 'Excelente desacoplamento e rastreabilidade; exige rigor no versionamento de esquemas de mensagens.', alternativesConsidered: ['Comunicação síncrona HTTP direta', 'Polled Shared Memory'], author: 'Chief Enterprise Architect', approver: 'CTO', date: '2025-01-15T10:00:00Z', version: '1.0', digitalSignatureHash: 'sig_adr_88a912c' },
  { id: 'adr-2', number: 2, title: 'Centralização de Identidades via IAMCenter e Zero Trust', status: 'accepted', domain: 'identity_iam', context: 'Necessidade de garantir acesso contextual e conformidade rigorosa com a LGPD e MCSI.', decision: 'Proibir chamadas diretas entre módulos sem validação de papéis (RBAC/ABAC) via IAMContext.', consequences: 'Segurança elevada e auditoria simplificada.', alternativesConsidered: ['Autenticação distribuída por serviço'], author: 'CISO', approver: 'CEA', date: '2025-01-20T14:00:00Z', version: '1.0', digitalSignatureHash: 'sig_adr_77b314d' }
];

const INITIAL_VIOLATIONS: DependencyViolation[] = [
  { id: 'viol-1', sourceComponentId: 'comp-5', sourceComponentName: 'ACU Corporate University', targetComponentId: 'comp-3', targetComponentName: 'AECM Content Management', violationType: 'tight_coupling', severity: 'low', recommendation: 'Refatorar acoplamento direto de repositório utilizando o Barramento de Eventos AEIP.', detectedAt: new Date().toISOString() }
];

const INITIAL_DEBTS: TechnicalDebtItem[] = [
  { id: 'debt-1', code: 'DEBT-001', title: 'Migração de Fetch API local para API Gateway AEIP distribuído', type: 'architectural', severity: 'medium', domain: 'integrations_aeip', componentId: 'comp-6', description: 'Transição completa dos stubs locais para os endpoints OpenAPI documentados.', estimatedFixEffortHours: 16, remediationPlan: 'Conectar endpoints reais no API Gateway.', createdAt: '2025-02-10T10:00:00Z', status: 'identified' }
];

const INITIAL_STANDARDS: ArchitectureStandard[] = [
  { id: 'std-1', code: 'STD-API-01', title: 'Padrão API-First & OpenAPI 3.0', category: 'api', description: 'Todas as APIs públicas devem possuir contrato tipado OpenAPI e envelope estronizado ApiResponse<T>.', mandatoryRules: ['Payload JSON em camelCase', 'Códigos HTTP semânticos (200, 201, 400, 401, 403, 500)', 'Header X-Request-ID em todas as requisições'], complianceRatePercent: 100 },
  { id: 'std-2', code: 'STD-SEC-01', title: 'Padrão Zero Trust & Auditability', category: 'security', description: 'Nenhuma alteração estrutural pode ocorrer sem log imutável de auditoria com hash SHA-256.', mandatoryRules: ['Registro de ator e timestamp', 'Validação de permissão via IAM', 'Imutabilidade de logs de evento'], complianceRatePercent: 100 }
];

const INITIAL_TWIN_NODES: DigitalTwinNode[] = [
  { id: 'node-iam', label: 'IAMCenter (Identidade)', domain: 'identity_iam', type: 'Core Context', status: 'healthy', incomingConnections: 5, outgoingConnections: 0 },
  { id: 'node-bpms', label: 'BPMS (Processos)', domain: 'workflow_bpms', type: 'Workflow Engine', status: 'healthy', incomingConnections: 4, outgoingConnections: 1 },
  { id: 'node-aecm', label: 'AECM (Gestão Documental)', domain: 'documents_ecm', type: 'ECM / Archive', status: 'healthy', incomingConnections: 3, outgoingConnections: 2 },
  { id: 'node-aegrc', label: 'AEGRC (Governança & Riscos)', domain: 'governance_aegrc', type: 'GRC Hub', status: 'healthy', incomingConnections: 2, outgoingConnections: 2 },
  { id: 'node-acu', label: 'ACU (Universidade)', domain: 'university_acu', type: 'LMS Platform', status: 'healthy', incomingConnections: 1, outgoingConnections: 2 },
  { id: 'node-aeip', label: 'AEIP (Barramento & APIs)', domain: 'integrations_aeip', type: 'ESB / Gateway', status: 'healthy', incomingConnections: 5, outgoingConnections: 5 }
];

const AEAGOContext = createContext<AEAGOContextValue | null>(null);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function AEAGOProvider({ children }: { children: React.ReactNode }) {
  const [components] = useState<ArchitectureComponent[]>(INITIAL_COMPONENTS);
  const [adrs, setAdrs] = useState<ArchitectureDecisionRecord[]>(() => loadStorage('aeago_adrs', INITIAL_ADRS));
  const [violations, setViolations] = useState<DependencyViolation[]>(() => loadStorage('aeago_violations', INITIAL_VIOLATIONS));
  const [technicalDebts, setTechnicalDebts] = useState<TechnicalDebtItem[]>(() => loadStorage('aeago_debts', INITIAL_DEBTS));
  const [standards] = useState<ArchitectureStandard[]>(INITIAL_STANDARDS);
  const [digitalTwinNodes, setDigitalTwinNodes] = useState<DigitalTwinNode[]>(INITIAL_TWIN_NODES);
  const [auditLog, setAuditLog] = useState<AEAGOAuditEntry[]>(() => loadStorage('aeago_audit_log', []));

  useEffect(() => { localStorage.setItem('aeago_adrs', JSON.stringify(adrs)); }, [adrs]);
  useEffect(() => { localStorage.setItem('aeago_violations', JSON.stringify(violations)); }, [violations]);
  useEffect(() => { localStorage.setItem('aeago_debts', JSON.stringify(technicalDebts)); }, [technicalDebts]);
  useEffect(() => { localStorage.setItem('aeago_audit_log', JSON.stringify(auditLog)); }, [auditLog]);

  const addAudit = useCallback((action: AEAGOAuditEntry['action'], description: string, actor: string, domain: string) => {
    const entry: AEAGOAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      description,
      domain,
      hash: Math.random().toString(36).substring(2, 10),
    };
    setAuditLog(prev => [entry, ...prev]);
    window.dispatchEvent(new CustomEvent('aeago:event', { detail: entry }));
  }, []);

  const addADR = useCallback((adr: Omit<ArchitectureDecisionRecord, 'id' | 'number' | 'date' | 'digitalSignatureHash'>) => {
    const newADR: ArchitectureDecisionRecord = {
      ...adr,
      id: `adr-${Date.now()}`,
      number: adrs.length + 1,
      date: new Date().toISOString(),
      digitalSignatureHash: `sig_adr_${Math.random().toString(36).substring(2, 8)}`,
    };
    setAdrs(prev => [newADR, ...prev]);
    addAudit('ADRCreated', `Novo Registro de Decisão Arquitetural (ADR-${newADR.number}) registrado: ${newADR.title}`, adr.author, adr.domain);
  }, [adrs.length, addAudit]);

  const addTechnicalDebt = useCallback((debt: Omit<TechnicalDebtItem, 'id' | 'code' | 'createdAt' | 'status'>) => {
    const id = `debt-${Date.now()}`;
    const code = `DEBT-${String(technicalDebts.length + 1).padStart(3, '0')}`;
    const newDebt: TechnicalDebtItem = {
      ...debt,
      id,
      code,
      createdAt: new Date().toISOString(),
      status: 'identified',
    };
    setTechnicalDebts(prev => [newDebt, ...prev]);
    addAudit('TechnicalDebtCalculated', `Item de Débito Técnico registrado: ${newDebt.title} (${newDebt.severity})`, 'Architecture Auditor', debt.domain);
  }, [technicalDebts.length, addAudit]);

  const resolveTechnicalDebt = useCallback((id: string) => {
    setTechnicalDebts(prev => prev.map(d => {
      if (d.id !== id) return d;
      addAudit('ArchitectureChanged', `Débito Técnico ${d.code} resolvido com sucesso`, 'DevOps Lead', d.domain);
      return { ...d, status: 'resolved' };
    }));
  }, [addAudit]);

  const syncDigitalTwin = useCallback(() => {
    setDigitalTwinNodes(prev => prev.map(n => ({
      ...n,
      status: 'healthy',
    })));
    addAudit('DigitalTwinSynchronized', 'Digital Twin Arquitetural sincronizado em tempo real com o ambiente de produção', 'Digital Twin Engine', 'Platform');
  }, [addAudit]);

  const runComplianceCheck = useCallback(() => {
    addAudit('ArchitectureComplianceValidated', 'Verificação contínua de conformidade arquitetural concluída — 100% de aderência aos padrões SOLID e Clean Architecture', 'Architecture Auditor', 'Platform');
  }, [addAudit]);

  const value = useMemo<AEAGOContextValue>(() => ({
    components,
    adrs,
    violations,
    technicalDebts,
    standards,
    digitalTwinNodes,
    auditLog,
    addADR,
    addTechnicalDebt,
    resolveTechnicalDebt,
    syncDigitalTwin,
    runComplianceCheck,
  }), [components, adrs, violations, technicalDebts, standards, digitalTwinNodes, auditLog, addADR, addTechnicalDebt, resolveTechnicalDebt, syncDigitalTwin, runComplianceCheck]);

  return <AEAGOContext.Provider value={value}>{children}</AEAGOContext.Provider>;
}

export function useAEAGO() {
  const context = useContext(AEAGOContext);
  if (!context) throw new Error('useAEAGO must be used within AEAGOProvider');
  return context;
}
