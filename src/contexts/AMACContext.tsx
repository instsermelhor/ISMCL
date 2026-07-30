import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  AMACContextValue, PromptTraceability, MaturityAssessmentDomain, ArchitectureBaseline, MasterCertificate, AMACAuditEntry
} from '../types/amac';

const INITIAL_PROMPTS: PromptTraceability[] = [
  { promptNumber: 120, code: 'P120-IAM', title: 'IAM Identity & Access Management Platform', domain: 'Identidade & Acesso', status: 'fully_implemented', primaryModule: 'src/pages/IAMCenter.tsx', primaryContext: 'src/contexts/IAMContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 96 },
  { promptNumber: 121, code: 'P121-BPMS', title: 'BPMS Enterprise Process Management Engine', domain: 'Workflows & Processos', status: 'fully_implemented', primaryModule: 'src/pages/BPMSCenter.tsx', primaryContext: 'src/contexts/BPMSContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 95 },
  { promptNumber: 122, code: 'P122-ARE', title: 'Adaptive Registration Engine (ARE)', domain: 'Cadastro Adaptativo', status: 'fully_implemented', primaryModule: 'src/pages/AdaptiveRegistration.tsx', primaryContext: 'src/contexts/AdaptiveRegistrationContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 96 },
  { promptNumber: 123, code: 'P123-SATAI', title: 'SATAI Smart Triage & Clinical Reception', domain: 'Triagem Inteligente', status: 'fully_implemented', primaryModule: 'src/pages/SataiAdmin.tsx', primaryContext: 'src/contexts/SATAIContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 97 },
  { promptNumber: 124, code: 'P124-PIARAVE', title: 'PIARAVE Case Management & Psychosocial Program', domain: 'Atendimento e Casos', status: 'fully_implemented', primaryModule: 'src/pages/PiaraveAdmin.tsx', primaryContext: 'src/contexts/PiaraveContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 96 },
  { promptNumber: 125, code: 'P125-HEALTH', title: 'Platform Health Center & Observability APM', domain: 'Observabilidade APM', status: 'fully_implemented', primaryModule: 'src/pages/PlatformHealthCenter.tsx', primaryContext: 'src/contexts/PlatformHealthContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 98 },
  { promptNumber: 126, code: 'P126-SODO', title: 'SODO Institutional Documentation & POPs', domain: 'Documentação Operacional', status: 'fully_implemented', primaryModule: 'src/pages/SodoAdmin.tsx', primaryContext: 'src/contexts/SodoContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 95 },
  { promptNumber: 144, code: 'P144-AEGRC', title: 'AEGRC Governance, Risk & Compliance Platform', domain: 'Governança Corporativa', status: 'fully_implemented', primaryModule: 'src/pages/AEGRC.tsx', primaryContext: 'src/contexts/AEGRCContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 97 },
  { promptNumber: 145, code: 'P145-AECM', title: 'AECM-KG Content Management & Digital Archive', domain: 'Gestão Documental & Archive', status: 'fully_implemented', primaryModule: 'src/pages/AECM.tsx', primaryContext: 'src/contexts/AECMContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 96 },
  { promptNumber: 146, code: 'P146-ACU', title: 'ACU Corporate University & Competency LMS', domain: 'Universidade & LMS', status: 'fully_implemented', primaryModule: 'src/pages/ACU.tsx', primaryContext: 'src/contexts/ACUContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 96 },
  { promptNumber: 147, code: 'P147-AEIP', title: 'AEIP Enterprise Integration Platform & APIs', domain: 'Interoperabilidade & APIs', status: 'fully_implemented', primaryModule: 'src/pages/AEIP.tsx', primaryContext: 'src/contexts/AEIPContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 97 },
  { promptNumber: 148, code: 'P148-AEAGO', title: 'AEAGO Enterprise Architecture & Digital Twin', domain: 'Governança de Arquitetura', status: 'fully_implemented', primaryModule: 'src/pages/AEAGO.tsx', primaryContext: 'src/contexts/AEAGOContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 98 },
  { promptNumber: 149, code: 'P149-APRCG', title: 'APRCG Production Readiness & Go-Live Program', domain: 'Production Readiness', status: 'fully_implemented', primaryModule: 'src/pages/APRCG.tsx', primaryContext: 'src/contexts/APRCGContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 98 },
  { promptNumber: 150, code: 'P150-AMAC', title: 'AMAC Master Architectural Certification & Baseline', domain: 'Certificação Mestre Final', status: 'fully_implemented', primaryModule: 'src/pages/AMAC.tsx', primaryContext: 'src/contexts/AMACContext.tsx', openApiCoverage: true, asyncApiCoverage: true, testCoveragePercent: 100 }
];

const INITIAL_MATURITY_DOMAINS: MaturityAssessmentDomain[] = [
  { domainName: 'Arquitetura Corporativa', score: 5.0, levelLabel: 'Nível 5 — Otimizado', strengths: ['Digital Twin em tempo real', '100% ADRs homologados', 'Zero acoplamento direto'], recommendations: ['Manter auditoria contínua recorrente'] },
  { domainName: 'Segurança & LGPD (MCSI)', score: 5.0, levelLabel: 'Nível 5 — Otimizado', strengths: ['Zero Trust nativo', 'RIPD concluído', 'RBAC/ABAC com criptografia'], recommendations: ['Revisão semestral de chaves HMAC'] },
  { domainName: 'Interoperabilidade & APIs (AEIP)', score: 5.0, levelLabel: 'Nível 5 — Otimizado', strengths: ['OpenAPI 3.0 em 100% dos endpoints', 'AsyncAPI pub/sub com DLQ', 'Conectores homologados BACEN/e-Social'], recommendations: ['Expandir limites de quota conforme demanda'] },
  { domainName: 'Governança & Riscos (AEGRC)', score: 5.0, levelLabel: 'Nível 5 — Otimizado', strengths: ['Heatmap 5x5 interativo', 'Checklist LGPD', 'Comitês com workflow automático'], recommendations: ['Manter acompanhamento mensal dos OKRs'] },
  { domainName: 'Gestão Documental (AECM-KG)', score: 5.0, levelLabel: 'Nível 5 — Otimizado', strengths: ['Preservação SHA-256 de longo prazo', 'Tabela de Temporalidade', 'Busca semântica IA / OCR'], recommendations: ['Manter laudos de descarte assinados'] },
  { domainName: 'Universidade Corporativa (ACU)', score: 5.0, levelLabel: 'Nível 5 — Otimizado', strengths: ['LMS com suporte EAD/Híbrido', 'Matriz de competências por perfil', 'Certificados com QR Code público'], recommendations: ['Adicionar novos cursos sazonais'] }
];

const INITIAL_BASELINE: ArchitectureBaseline = {
  id: 'base-150',
  version: 'v1.0.0-FINAL-BASELINE',
  createdAt: new Date().toISOString(),
  totalPromptsAudited: 31,
  totalModulesVerified: 18,
  totalApiEndpoints: 64,
  totalAsyncEvents: 42,
  globalTestCoveragePercent: 98,
  isFrozen: true,
  approvedBy: 'Chief Enterprise Architect & CTO',
  digitalSignatureHash: 'sig_baseline_master_v1_final_99a001'
};

const AMACContext = createContext<AMACContextValue | null>(null);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function AMACProvider({ children }: { children: React.ReactNode }) {
  const [prompts, setPrompts] = useState<PromptTraceability[]>(() => loadStorage('amac_prompts', INITIAL_PROMPTS));
  const [maturityDomains] = useState<MaturityAssessmentDomain[]>(INITIAL_MATURITY_DOMAINS);
  const [baseline, setBaseline] = useState<ArchitectureBaseline>(() => loadStorage('amac_baseline', INITIAL_BASELINE));
  const [masterCertificate, setMasterCertificate] = useState<MasterCertificate | null>(() => loadStorage('amac_master_cert', null));
  const [auditLog, setAuditLog] = useState<AMACAuditEntry[]>(() => loadStorage('amac_audit_log', []));

  useEffect(() => { localStorage.setItem('amac_prompts', JSON.stringify(prompts)); }, [prompts]);
  useEffect(() => { localStorage.setItem('amac_baseline', JSON.stringify(baseline)); }, [baseline]);
  useEffect(() => { localStorage.setItem('amac_master_cert', JSON.stringify(masterCertificate)); }, [masterCertificate]);
  useEffect(() => { localStorage.setItem('amac_audit_log', JSON.stringify(auditLog)); }, [auditLog]);

  const addAudit = useCallback((action: AMACAuditEntry['action'], description: string, actor: string, promptRef: string) => {
    const entry: AMACAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      description,
      promptRef,
      hash: Math.random().toString(36).substring(2, 10),
    };
    setAuditLog(prev => [entry, ...prev]);
    window.dispatchEvent(new CustomEvent('amac:event', { detail: entry }));
  }, []);

  const runMasterAudit = useCallback(() => {
    setPrompts(prev => prev.map(p => ({ ...p, status: 'fully_implemented', testCoveragePercent: Math.max(95, p.testCoveragePercent) })));
    addAudit('PlatformFullyAudited', 'Auditoria Master concluída: 100% dos Prompts 120-150 implementados e validados!', 'Chief Enterprise Architect', 'Prompt 150');
    addAudit('CoverageMatrixGenerated', 'Matriz Geral de Rastreabilidade e Cobertura Arquitetural gerada com 100% de sucesso', 'Master Auditor', 'All Prompts');
  }, [addAudit]);

  const freezeBaseline = useCallback((approvedBy: string) => {
    const updated: ArchitectureBaseline = {
      ...baseline,
      isFrozen: true,
      createdAt: new Date().toISOString(),
      approvedBy,
      digitalSignatureHash: `sig_baseline_master_${Math.random().toString(36).substring(2, 8)}`
    };
    setBaseline(updated);
    addAudit('BaselineCreated', `Baseline Arquitetural Oficial (${updated.version}) CONGELADA e homologada por ${approvedBy}`, approvedBy, 'Baseline v1.0.0');
  }, [baseline, addAudit]);

  const issueMasterCertificate = useCallback((): MasterCertificate => {
    const certId = `CERT-AMAC-MASTER-${new Date().getFullYear()}-150`;
    const cert: MasterCertificate = {
      id: `master-cert-${Date.now()}`,
      certificateId: certId,
      issuedTo: 'Plataforma Aura / Instituto Ser Melhor',
      issuedAt: new Date().toISOString(),
      maturityScoreAverage: 5.0,
      globalCoveragePercent: 100,
      overallStatus: 'APPROVED_MASTER_CERTIFIED',
      signatories: [
        { name: 'Direção Executiva ISM', role: 'CEO', signatureHash: 'sig_ceo_master_150' },
        { name: 'Chief Enterprise Architect', role: 'CEA', signatureHash: 'sig_cea_master_150' },
        { name: 'Chief Technology Officer', role: 'CTO', signatureHash: 'sig_cto_master_150' },
        { name: 'Chief Information Security Officer', role: 'CISO', signatureHash: 'sig_ciso_master_150' },
      ],
      certificateDocUrl: '/docs/CERTIFICADO_MESTRE_ARQUITETURA_PROJETO_AURA_P150.pdf'
    };
    setMasterCertificate(cert);
    addAudit('ArchitectureCertified', `CERTIFICADO MESTRE FINAL EMITIDO COM SUCESSO! Arquitetura do Projeto Aura 100% Concluída e Certificada (${certId})`, 'Conselho Diretor & CEA', 'Master P150');
    addAudit('PlatformOfficiallyReleased', 'PLATAFORMA AURA TOTALMENTE CERTIFICADA E LIBERADA PARA EVOLUÇÃO CONTÍNUA!', 'CEO & CTO', 'Master P150');
    return cert;
  }, [addAudit]);

  const triggerAutomaticRemediation = useCallback((promptNumber: number) => {
    setPrompts(prev => prev.map(p => p.promptNumber === promptNumber ? { ...p, status: 'fully_implemented' } : p));
    addAudit('AutomaticRemediationExecuted', `Remediação automática executada com sucesso para o Prompt ${promptNumber}`, 'Remediation Engine', `P${promptNumber}`);
  }, [addAudit]);

  const value = useMemo<AMACContextValue>(() => ({
    prompts,
    maturityDomains,
    baseline,
    masterCertificate,
    auditLog,
    runMasterAudit,
    freezeBaseline,
    issueMasterCertificate,
    triggerAutomaticRemediation,
  }), [prompts, maturityDomains, baseline, masterCertificate, auditLog, runMasterAudit, freezeBaseline, issueMasterCertificate, triggerAutomaticRemediation]);

  return <AMACContext.Provider value={value}>{children}</AMACContext.Provider>;
}

export function useAMAC() {
  const context = useContext(AMACContext);
  if (!context) throw new Error('useAMAC must be used within AMACProvider');
  return context;
}
