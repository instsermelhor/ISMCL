// =============================================================================
// APRCG — Aura Production Readiness, Enterprise Certification & Go-Live Program
// Tipos e Interfaces TypeScript — Prompt 149
// =============================================================================

export type CertificationStatus = 'approved' | 'approved_with_restrictions' | 'rejected' | 'pending';

export type CertificationDomain =
  | 'architecture'
  | 'development'
  | 'security_lgpd'
  | 'infrastructure_sre'
  | 'bi_analytics'
  | 'ai_engine'
  | 'integration_hub'
  | 'documentation_ecm'
  | 'compliance_legal';

export type UATCategory =
  | 'functional'
  | 'assistential'
  | 'administrative'
  | 'financial'
  | 'legal'
  | 'clinical'
  | 'social'
  | 'accessibility'
  | 'mobile';

export type GoLiveStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'rolled_back';

export interface ReadinessChecklistItem {
  id: string;
  category: 'infra' | 'security' | 'testing' | 'observability' | 'backup_dr' | 'compliance';
  title: string;
  description: string;
  isPassed: boolean;
  scorePercent: number;
  evidenceRef?: string;
}

export interface DomainCertification {
  id: string;
  domain: CertificationDomain;
  domainName: string;
  evaluatorName: string;
  evaluatorRole: string;
  status: CertificationStatus;
  notes: string;
  restrictions?: string[];
  certifiedAt: string;
  signatureHash: string;
}

export interface UATTestCase {
  id: string;
  code: string; // e.g. UAT-AST-01
  title: string;
  category: UATCategory;
  scenario: string;
  expectedResult: string;
  status: 'passed' | 'failed' | 'pending';
  testedBy: string;
  testedAt?: string;
  notes?: string;
}

export interface GoLiveWindow {
  id: string;
  releaseVersion: string; // e.g. "v2.0.0-PROD"
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: GoLiveStatus;
  rollbackPlanUrl: string;
  contingencyPlanUrl: string;
  releaseManager: string;
  postDeployChecklistPassed: boolean;
}

export interface ExecutiveApproval {
  id: string;
  roleTitle: 'CEO' | 'CTO' | 'CEA' | 'CISO' | 'CCO' | 'CAE' | 'CQO';
  approverName: string;
  isApproved: boolean;
  approvedAt?: string;
  digitalSignatureHash?: string;
  comments?: string;
}

export type APRCGEventType =
  | 'ProductionReadinessValidated'
  | 'AcceptanceTestsCompleted'
  | 'BusinessApproved'
  | 'GoLiveScheduled'
  | 'GoLiveExecuted'
  | 'RollbackExecuted'
  | 'ExecutiveApprovalGranted'
  | 'CertificationIssued'
  | 'ProductionAuditCompleted'
  | 'PlatformReleased';

export interface APRCGAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: APRCGEventType;
  description: string;
  releaseVersion: string;
  hash: string;
}

export interface APRCGContextValue {
  checklist: ReadinessChecklistItem[];
  certifications: DomainCertification[];
  uatCases: UATTestCase[];
  goLiveWindows: GoLiveWindow[];
  executiveApprovals: ExecutiveApproval[];
  auditLog: APRCGAuditEntry[];

  // Actions
  toggleChecklistItem: (id: string) => void;
  updateCertification: (domain: CertificationDomain, status: CertificationStatus, evaluatorName: string, evaluatorRole: string, notes: string, restrictions?: string[]) => void;
  executeUATCase: (id: string, status: 'passed' | 'failed', testedBy: string, notes?: string) => void;
  grantExecutiveApproval: (roleTitle: ExecutiveApproval['roleTitle'], approverName: string, comments?: string) => void;
  scheduleGoLive: (window: Omit<GoLiveWindow, 'id' | 'status' | 'postDeployChecklistPassed'>) => void;
  executeGoLive: (id: string) => void;
  executeRollback: (id: string, reason: string) => void;
}
