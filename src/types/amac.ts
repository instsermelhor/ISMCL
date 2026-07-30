// =============================================================================
// AMAC — Aura Master Architectural Certification, Audit & Continuous Evolution
// Tipos e Interfaces TypeScript — Prompt 150 (Prompt Mestre Final)
// =============================================================================

export type PromptImplementationStatus = 'fully_implemented' | 'partially_implemented' | 'specified_only' | 'gap_detected';

export interface PromptTraceability {
  promptNumber: number; // e.g. 120 to 150
  code: string; // e.g. "P120-IAM", "P144-AEGRC", "P150-AMAC"
  title: string;
  domain: string;
  status: PromptImplementationStatus;
  primaryModule: string; // e.g. "src/pages/AEGRC.tsx"
  primaryContext: string; // e.g. "src/contexts/AEGRCContext.tsx"
  openApiCoverage: boolean;
  asyncApiCoverage: boolean;
  testCoveragePercent: number; // e.g. 96
}

export interface MaturityAssessmentDomain {
  domainName: string;
  score: number; // 1 to 5 (CMMI)
  levelLabel: string; // e.g. "Level 5 — Optimized"
  strengths: string[];
  recommendations: string[];
}

export interface ArchitectureBaseline {
  id: string;
  version: string; // e.g. "v1.0.0-FINAL-BASELINE"
  createdAt: string;
  totalPromptsAudited: number;
  totalModulesVerified: number;
  totalApiEndpoints: number;
  totalAsyncEvents: number;
  globalTestCoveragePercent: number;
  isFrozen: boolean;
  approvedBy: string;
  digitalSignatureHash: string;
}

export interface MasterCertificate {
  id: string;
  certificateId: string; // e.g. CERT-AMAC-PROD-2025-150
  issuedTo: string; // "Plataforma Aura / Instituto Ser Melhor"
  issuedAt: string;
  maturityScoreAverage: number; // 5.0
  globalCoveragePercent: number; // 100%
  overallStatus: 'APPROVED_MASTER_CERTIFIED';
  signatories: Array<{ name: string; role: string; signatureHash: string }>;
  certificateDocUrl: string;
}

export type AMACEventType =
  | 'PlatformFullyAudited'
  | 'CoverageMatrixGenerated'
  | 'GapDetected'
  | 'AutomaticRemediationExecuted'
  | 'ArchitectureCertified'
  | 'BaselineCreated'
  | 'MaturityAssessmentCompleted'
  | 'ContinuousEvolutionStarted'
  | 'DocumentationSynchronized'
  | 'PlatformOfficiallyReleased';

export interface AMACAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: AMACEventType;
  description: string;
  promptRef: string;
  hash: string;
}

export interface AMACContextValue {
  prompts: PromptTraceability[];
  maturityDomains: MaturityAssessmentDomain[];
  baseline: ArchitectureBaseline;
  masterCertificate: MasterCertificate | null;
  auditLog: AMACAuditEntry[];

  // Actions
  runMasterAudit: () => void;
  freezeBaseline: (approvedBy: string) => void;
  issueMasterCertificate: () => MasterCertificate;
  triggerAutomaticRemediation: (promptNumber: number) => void;
}
