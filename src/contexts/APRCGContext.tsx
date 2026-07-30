import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  APRCGContextValue, ReadinessChecklistItem, DomainCertification, UATTestCase,
  GoLiveWindow, ExecutiveApproval, APRCGAuditEntry, CertificationDomain, CertificationStatus
} from '../types/aprcg';

const INITIAL_CHECKLIST: ReadinessChecklistItem[] = [
  { id: 'chk-1', category: 'infra', title: 'Infraestrutura Multi-Região e Load Balancing', description: 'Ambiente de produção configurado com alta disponibilidade em sa-east-1.', isPassed: true, scorePercent: 100, evidenceRef: 'DOC-INFRA-PROD-2025' },
  { id: 'chk-2', category: 'testing', title: 'Cobertura de Testes de Regressão ≥ 95%', description: 'Suíte de testes automatizados unitários, de integração, carga e resiliência.', isPassed: true, scorePercent: 96, evidenceRef: 'REPORT-TEST-COVERAGE-96' },
  { id: 'chk-3', category: 'security', title: 'Auditoria Zero Trust, LGPD e Penetration Test', description: 'Varredura DevSecOps e teste de intrusão concluído com 0 falhas críticas.', isPassed: true, scorePercent: 100, evidenceRef: 'PENTEST-CERT-2025-01' },
  { id: 'chk-4', category: 'backup_dr', title: 'Planos de Contingência e Disaster Recovery', description: 'Simulado de Failover e restauração de backups em menos de 15 minutos (RTO/RPO).', isPassed: true, scorePercent: 98, evidenceRef: 'DR-SIMULATION-REPORT-2025' },
  { id: 'chk-5', category: 'observability', title: 'Observabilidade, Alertas & Health Center (APM)', description: 'Métricas de APM, OpenTelemetry, tracing e alertas integrados no Health Center.', isPassed: true, scorePercent: 100, evidenceRef: 'MONITORING-SLA-CONFIG' },
  { id: 'chk-6', category: 'compliance', title: 'Treinamento da Equipe Operacional na ACU', description: '100% dos voluntários e profissionais capacitados nos módulos da Universidade Corporativa.', isPassed: true, scorePercent: 100, evidenceRef: 'ACU-TRAINING-RECORD-100' }
];

const INITIAL_CERTIFICATIONS: DomainCertification[] = [
  { id: 'cert-1', domain: 'architecture', domainName: 'Arquitetura Corporativa (EAO)', evaluatorName: 'Chief Enterprise Architect', evaluatorRole: 'CEA', status: 'approved', notes: 'Arquitetura alinhada aos Prompts 120-148, com Digital Twin e barramento AsyncAPI.', certifiedAt: '2025-03-01T10:00:00Z', signatureHash: 'sig_cea_99a81' },
  { id: 'cert-2', domain: 'security_lgpd', domainName: 'Segurança da Informação e LGPD', evaluatorName: 'Chief Information Security Officer', evaluatorRole: 'CISO / DPO', status: 'approved', notes: 'Controles Zero Trust, RIPD concluído e criptografia ponta a ponta homologada.', certifiedAt: '2025-03-02T14:00:00Z', signatureHash: 'sig_ciso_77b22' },
  { id: 'cert-3', domain: 'infrastructure_sre', domainName: 'Infraestrutura e SRE', evaluatorName: 'Principal SRE', evaluatorRole: 'SRE Lead', status: 'approved', notes: 'Cluster Kubernetes auto-escalável com redundância multi-zona.', certifiedAt: '2025-03-03T11:00:00Z', signatureHash: 'sig_sre_44c33' },
  { id: 'cert-4', domain: 'integration_hub', domainName: 'Barramento de Integrações (AEIP)', evaluatorName: 'Chief Integration Officer', evaluatorRole: 'CIO', status: 'approved', notes: 'Hub de APIs OpenAPI 3.0 e conectores e-Social/BACEN validados.', certifiedAt: '2025-03-04T16:00:00Z', signatureHash: 'sig_cio_55d44' }
];

const INITIAL_UAT_CASES: UATTestCase[] = [
  { id: 'uat-1', code: 'UAT-AST-01', title: 'Triagem Inteligente SATAI e Acolhimento PIARAVE', category: 'assistential', scenario: 'Simulação completa de triagem de vulnerabilidade social com encaminhamento automático ao psicólogo.', expectedResult: 'Prontuário criado e notificação emitida no BPMS.', status: 'passed', testedBy: 'Dra. Roberta Santos', testedAt: '2025-03-05T10:00:00Z' },
  { id: 'uat-2', code: 'UAT-FIN-01', title: 'Recebimento de Doação via PIX e Reconciliação BACEN', category: 'financial', scenario: 'Processamento de doação pública com emissão de recibo social e atualização no ERP.', expectedResult: 'Recibo gerado no SODO e lançamento contábil efetuado.', status: 'passed', testedBy: 'Diretoria Financeira', testedAt: '2025-03-06T11:00:00Z' }
];

const INITIAL_GOLIVE_WINDOWS: GoLiveWindow[] = [
  {
    id: 'gl-1',
    releaseVersion: 'v2.0.0-PROD-RELEASE',
    scheduledStartAt: '2025-03-20T22:00:00Z',
    scheduledEndAt: '2025-03-21T02:00:00Z',
    status: 'scheduled',
    rollbackPlanUrl: '/docs/plan_rollback_v2.0.pdf',
    contingencyPlanUrl: '/docs/plan_contingency_v2.0.pdf',
    releaseManager: 'Principal Release Manager',
    postDeployChecklistPassed: true
  }
];

const INITIAL_EXECUTIVE_APPROVALS: ExecutiveApproval[] = [
  { id: 'app-1', roleTitle: 'CEO', approverName: 'Direção Executiva ISM', isApproved: true, approvedAt: '2025-03-07T10:00:00Z', digitalSignatureHash: 'sig_ceo_1001', comments: 'Operação plenamente autorizada.' },
  { id: 'app-2', roleTitle: 'CTO', approverName: 'Chief Technology Officer', isApproved: true, approvedAt: '2025-03-07T10:30:00Z', digitalSignatureHash: 'sig_cto_1002', comments: 'Arquitetura técnica 100% pronta.' },
  { id: 'app-3', roleTitle: 'CISO', approverName: 'Chief Information Security Officer', isApproved: true, approvedAt: '2025-03-07T11:00:00Z', digitalSignatureHash: 'sig_ciso_1003', comments: 'Conformidade de segurança e LGPD certificada.' },
  { id: 'app-4', roleTitle: 'CEA', approverName: 'Chief Enterprise Architect', isApproved: true, approvedAt: '2025-03-07T11:30:00Z', digitalSignatureHash: 'sig_cea_1004', comments: 'Governança arquitetural validada.' }
];

const APRCGContext = createContext<APRCGContextValue | null>(null);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function APRCGProvider({ children }: { children: React.ReactNode }) {
  const [checklist, setChecklist] = useState<ReadinessChecklistItem[]>(() => loadStorage('aprcg_checklist', INITIAL_CHECKLIST));
  const [certifications, setCertifications] = useState<DomainCertification[]>(() => loadStorage('aprcg_certifications', INITIAL_CERTIFICATIONS));
  const [uatCases, setUatCases] = useState<UATTestCase[]>(() => loadStorage('aprcg_uat', INITIAL_UAT_CASES));
  const [goLiveWindows, setGoLiveWindows] = useState<GoLiveWindow[]>(() => loadStorage('aprcg_golive', INITIAL_GOLIVE_WINDOWS));
  const [executiveApprovals, setExecutiveApprovals] = useState<ExecutiveApproval[]>(() => loadStorage('aprcg_approvals', INITIAL_EXECUTIVE_APPROVALS));
  const [auditLog, setAuditLog] = useState<APRCGAuditEntry[]>(() => loadStorage('aprcg_audit_log', []));

  useEffect(() => { localStorage.setItem('aprcg_checklist', JSON.stringify(checklist)); }, [checklist]);
  useEffect(() => { localStorage.setItem('aprcg_certifications', JSON.stringify(certifications)); }, [certifications]);
  useEffect(() => { localStorage.setItem('aprcg_uat', JSON.stringify(uatCases)); }, [uatCases]);
  useEffect(() => { localStorage.setItem('aprcg_golive', JSON.stringify(goLiveWindows)); }, [goLiveWindows]);
  useEffect(() => { localStorage.setItem('aprcg_approvals', JSON.stringify(executiveApprovals)); }, [executiveApprovals]);
  useEffect(() => { localStorage.setItem('aprcg_audit_log', JSON.stringify(auditLog)); }, [auditLog]);

  const addAudit = useCallback((action: APRCGAuditEntry['action'], description: string, actor: string, releaseVersion: string) => {
    const entry: APRCGAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      description,
      releaseVersion,
      hash: Math.random().toString(36).substring(2, 10),
    };
    setAuditLog(prev => [entry, ...prev]);
    window.dispatchEvent(new CustomEvent('aprcg:event', { detail: entry }));
  }, []);

  const toggleChecklistItem = useCallback((id: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, isPassed: !item.isPassed, scorePercent: !item.isPassed ? 100 : 0 };
      addAudit('ProductionReadinessValidated', `Item '${item.title}' alterado para ${updated.isPassed ? 'APROVADO' : 'PENDENTE'}`, 'QA Lead', 'v2.0.0-PROD');
      return updated;
    }));
  }, [addAudit]);

  const updateCertification = useCallback((domain: CertificationDomain, status: CertificationStatus, evaluatorName: string, evaluatorRole: string, notes: string, restrictions?: string[]) => {
    setCertifications(prev => {
      const existing = prev.find(c => c.domain === domain);
      const signatureHash = `sig_${evaluatorRole.toLowerCase()}_${Math.random().toString(36).substring(2, 8)}`;
      if (existing) {
        return prev.map(c => c.domain === domain ? { ...c, status, evaluatorName, evaluatorRole, notes, restrictions, certifiedAt: new Date().toISOString(), signatureHash } : c);
      } else {
        const newCert: DomainCertification = {
          id: `cert-${Date.now()}`,
          domain,
          domainName: domain.toUpperCase(),
          evaluatorName,
          evaluatorRole,
          status,
          notes,
          restrictions,
          certifiedAt: new Date().toISOString(),
          signatureHash
        };
        return [...prev, newCert];
      }
    });
    addAudit('CertificationIssued', `Parecer de certificação emitido para o domínio ${domain}: ${status.toUpperCase()}`, evaluatorName, 'v2.0.0-PROD');
  }, [addAudit]);

  const executeUATCase = useCallback((id: string, status: 'passed' | 'failed', testedBy: string, notes?: string) => {
    setUatCases(prev => prev.map(caseItem => {
      if (caseItem.id !== id) return caseItem;
      const updated = { ...caseItem, status, testedBy, testedAt: new Date().toISOString(), notes };
      addAudit('AcceptanceTestsCompleted', `Caso de teste UAT ${caseItem.code} finalizado com status ${status.toUpperCase()}`, testedBy, 'v2.0.0-PROD');
      return updated;
    }));
  }, [addAudit]);

  const grantExecutiveApproval = useCallback((roleTitle: ExecutiveApproval['roleTitle'], approverName: string, comments?: string) => {
    setExecutiveApprovals(prev => prev.map(app => {
      if (app.roleTitle !== roleTitle) return app;
      const hash = `sig_${roleTitle.toLowerCase()}_${Math.random().toString(36).substring(2, 8)}`;
      addAudit('ExecutiveApprovalGranted', `Aprovação formal Go-Live concedida por ${approverName} (${roleTitle})`, approverName, 'v2.0.0-PROD');
      return { ...app, isApproved: true, approverName, approvedAt: new Date().toISOString(), digitalSignatureHash: hash, comments };
    }));
  }, [addAudit]);

  const scheduleGoLive = useCallback((window: Omit<GoLiveWindow, 'id' | 'status' | 'postDeployChecklistPassed'>) => {
    const newWindow: GoLiveWindow = {
      ...window,
      id: `gl-${Date.now()}`,
      status: 'scheduled',
      postDeployChecklistPassed: false,
    };
    setGoLiveWindows(prev => [newWindow, ...prev]);
    addAudit('GoLiveScheduled', `Janela de Go-Live agendada para a versão ${newWindow.releaseVersion}`, window.releaseManager, newWindow.releaseVersion);
  }, [addAudit]);

  const executeGoLive = useCallback((id: string) => {
    setGoLiveWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      addAudit('GoLiveExecuted', `GO-LIVE EXECUTADO COM SUCESSO! Plataforma Aura liberada em produção (Versão ${w.releaseVersion})`, w.releaseManager, w.releaseVersion);
      addAudit('PlatformReleased', `PLATAFORMA OPERACIONAL EM PRODUÇÃO!`, 'CEO / PMO', w.releaseVersion);
      return { ...w, status: 'completed' as const, postDeployChecklistPassed: true };
    }));
  }, [addAudit]);

  const executeRollback = useCallback((id: string, reason: string) => {
    setGoLiveWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      addAudit('RollbackExecuted', `Rollback acionado para a versão ${w.releaseVersion}: ${reason}`, w.releaseManager, w.releaseVersion);
      return { ...w, status: 'rolled_back' as const };
    }));
  }, [addAudit]);

  const value = useMemo<APRCGContextValue>(() => ({
    checklist,
    certifications,
    uatCases,
    goLiveWindows,
    executiveApprovals,
    auditLog,
    toggleChecklistItem,
    updateCertification,
    executeUATCase,
    grantExecutiveApproval,
    scheduleGoLive,
    executeGoLive,
    executeRollback,
  }), [checklist, certifications, uatCases, goLiveWindows, executiveApprovals, auditLog, toggleChecklistItem, updateCertification, executeUATCase, grantExecutiveApproval, scheduleGoLive, executeGoLive, executeRollback]);

  return <APRCGContext.Provider value={value}>{children}</APRCGContext.Provider>;
}

export function useAPRCG() {
  const context = useContext(APRCGContext);
  if (!context) throw new Error('useAPRCG must be used within APRCGProvider');
  return context;
}
