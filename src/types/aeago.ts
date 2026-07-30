// =============================================================================
// AEAGO — Aura Enterprise Architecture Governance, Digital Twin & Platform Evolution
// Tipos e Interfaces TypeScript — Prompt 148
// =============================================================================

export type ArchitectureDomain =
  | 'identity_iam'
  | 'workflow_bpms'
  | 'triage_satai'
  | 'case_piarave'
  | 'documents_ecm'
  | 'university_acu'
  | 'integrations_aeip'
  | 'governance_aegrc'
  | 'security_mcsi'
  | 'observability';

export type ADRStatus = 'proposed' | 'accepted' | 'superseded' | 'rejected' | 'deprecated';

export type DebtSeverity = 'critical' | 'high' | 'medium' | 'low';
export type DebtType = 'architectural' | 'code' | 'documentation' | 'test' | 'infrastructure' | 'security';

export interface ArchitectureComponent {
  id: string;
  code: string; // e.g. COMP-IAM-01
  name: string;
  domain: ArchitectureDomain;
  type: 'microservice' | 'frontend_module' | 'context_provider' | 'database' | 'event_bus' | 'api_gateway';
  status: 'operational' | 'deprecated' | 'planned';
  description: string;
  technologies: string[];
  dependencies: string[]; // IDs of other components
  owner: string;
}

export interface ArchitectureDecisionRecord {
  id: string;
  number: number; // e.g. ADR-001
  title: string;
  status: ADRStatus;
  domain: ArchitectureDomain;
  context: string;
  decision: string;
  consequences: string;
  alternativesConsidered: string[];
  author: string;
  approver: string;
  date: string;
  version: string;
  digitalSignatureHash: string;
}

export interface DependencyViolation {
  id: string;
  sourceComponentId: string;
  sourceComponentName: string;
  targetComponentId: string;
  targetComponentName: string;
  violationType: 'circular_dependency' | 'domain_leak' | 'direct_bypass' | 'tight_coupling';
  severity: DebtSeverity;
  recommendation: string;
  detectedAt: string;
}

export interface TechnicalDebtItem {
  id: string;
  code: string; // e.g. DEBT-001
  title: string;
  type: DebtType;
  severity: DebtSeverity;
  domain: ArchitectureDomain;
  componentId: string;
  description: string;
  estimatedFixEffortHours: number;
  remediationPlan: string;
  createdAt: string;
  status: 'identified' | 'in_remediation' | 'resolved';
}

export interface ArchitectureStandard {
  id: string;
  code: string; // e.g. STD-API-01
  title: string;
  category: 'api' | 'event' | 'ui' | 'security' | 'testing' | 'devsecops';
  description: string;
  mandatoryRules: string[];
  complianceRatePercent: number;
}

export interface DigitalTwinNode {
  id: string;
  label: string;
  domain: ArchitectureDomain;
  type: string;
  status: 'healthy' | 'warning' | 'degraded';
  incomingConnections: number;
  outgoingConnections: number;
}

export type AEAGOEventType =
  | 'ArchitectureChanged'
  | 'ADRCreated'
  | 'DependencyViolationDetected'
  | 'ArchitectureComplianceValidated'
  | 'TechnicalDebtCalculated'
  | 'PlatformStandardUpdated'
  | 'DigitalTwinSynchronized'
  | 'EvolutionRoadmapUpdated'
  | 'ArchitectureAuditCompleted'
  | 'RepositoryUpdated';

export interface AEAGOAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: AEAGOEventType;
  description: string;
  domain: string;
  hash: string;
}

export interface AEAGOContextValue {
  components: ArchitectureComponent[];
  adrs: ArchitectureDecisionRecord[];
  violations: DependencyViolation[];
  technicalDebts: TechnicalDebtItem[];
  standards: ArchitectureStandard[];
  digitalTwinNodes: DigitalTwinNode[];
  auditLog: AEAGOAuditEntry[];

  // Actions
  addADR: (adr: Omit<ArchitectureDecisionRecord, 'id' | 'number' | 'date' | 'digitalSignatureHash'>) => void;
  addTechnicalDebt: (debt: Omit<TechnicalDebtItem, 'id' | 'code' | 'createdAt' | 'status'>) => void;
  resolveTechnicalDebt: (id: string) => void;
  syncDigitalTwin: () => void;
  runComplianceCheck: () => void;
}
