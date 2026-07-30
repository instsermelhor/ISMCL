// =============================================================================
// AEGRC — Aura Enterprise Governance, Risk, Compliance & Strategic Management
// Tipos e Interfaces TypeScript — Prompt 144
// =============================================================================

// ---------------------------------------------------------------------------
// Compartilhados
// ---------------------------------------------------------------------------

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type ApprovalStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
export type EffectivenessStatus = 'effective' | 'partial' | 'ineffective' | 'not_tested';

// ---------------------------------------------------------------------------
// ENTERPRISE RISK MANAGEMENT (ERM)
// ---------------------------------------------------------------------------

export type RiskCategory =
  | 'strategic'
  | 'operational'
  | 'assistential'
  | 'technological'
  | 'financial'
  | 'legal'
  | 'reputational'
  | 'continuity'
  | 'third_party';

export type RiskStatus = 'identified' | 'assessed' | 'mitigating' | 'mitigated' | 'accepted' | 'closed';

export type RiskResponse = 'accept' | 'mitigate' | 'transfer' | 'avoid';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface RiskIndicator {
  id: string;
  name: string;
  currentValue: string;
  threshold: string;
  unit: string;
  status: 'ok' | 'warning' | 'breach';
}

export interface Risk {
  id: string;
  code: string; // e.g. RSK-001
  title: string;
  description: string;
  category: RiskCategory;
  status: RiskStatus;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  inherentScore: number; // probability * impact
  residualScore: number; // after controls
  level: RiskLevel;
  response: RiskResponse;
  owner: string;
  reviewDate: string; // ISO date
  responseplan: string;
  mitigationActions: string[];
  relatedControlIds: string[];
  indicators: RiskIndicator[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  auditTrail: AuditEntry[];
}

// ---------------------------------------------------------------------------
// COMPLIANCE MANAGEMENT
// ---------------------------------------------------------------------------

export type ComplianceCategory =
  | 'lgpd'
  | 'institutional_policy'
  | 'code_of_ethics'
  | 'internal_norm'
  | 'regulatory'
  | 'contractual'
  | 'corporate_control';

export type ComplianceStatus = 'compliant' | 'in_analysis' | 'non_compliant' | 'not_applicable';

export interface ComplianceEvidence {
  id: string;
  description: string;
  documentRef: string;
  validatedAt: string;
  validatedBy: string;
}

export interface ComplianceItem {
  id: string;
  code: string; // e.g. LGPD-01
  title: string;
  description: string;
  category: ComplianceCategory;
  status: ComplianceStatus;
  owner: string;
  deadline: string;
  lastReviewDate: string;
  nextReviewDate: string;
  evidence: ComplianceEvidence[];
  relatedPolicyIds: string[];
  relatedRiskIds: string[];
  alerts: string[];
  createdAt: string;
  updatedAt: string;
  auditTrail: AuditEntry[];
}

// ---------------------------------------------------------------------------
// INTERNAL CONTROLS
// ---------------------------------------------------------------------------

export type ControlType = 'preventive' | 'detective' | 'corrective' | 'compensatory';

export interface InternalControl {
  id: string;
  code: string; // e.g. CTR-001
  name: string;
  description: string;
  type: ControlType;
  owner: string;
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  effectiveness: EffectivenessStatus;
  lastExecutionDate: string;
  nextExecutionDate: string;
  relatedRiskIds: string[];
  relatedComplianceIds: string[];
  evidenceDescription: string;
  createdAt: string;
  updatedAt: string;
  auditTrail: AuditEntry[];
}

// ---------------------------------------------------------------------------
// POLICY MANAGEMENT
// ---------------------------------------------------------------------------

export type PolicyType = 'policy' | 'norm' | 'regulation' | 'pop' | 'guideline' | 'manual';

export interface PolicyVersion {
  version: string; // e.g. "1.0", "2.1"
  content: string;
  changesDescription: string;
  publishedAt: string;
  publishedBy: string;
  approvedBy: string;
}

export interface Policy {
  id: string;
  code: string; // e.g. POL-001
  title: string;
  description: string;
  type: PolicyType;
  status: ApprovalStatus;
  currentVersion: string;
  versions: PolicyVersion[];
  owner: string;
  approver: string;
  publishedAt: string | null;
  expiresAt: string | null;
  reviewIntervalDays: number;
  nextReviewDate: string;
  relatedRiskIds: string[];
  relatedComplianceIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  auditTrail: AuditEntry[];
}

// ---------------------------------------------------------------------------
// STRATEGIC PLANNING
// ---------------------------------------------------------------------------

export type StrategicObjectiveStatus = 'not_started' | 'in_progress' | 'at_risk' | 'achieved' | 'discontinued';

export interface Initiative {
  id: string;
  title: string;
  description: string;
  objectiveId: string;
  owner: string;
  startDate: string;
  endDate: string;
  progress: number; // 0–100
  status: StrategicObjectiveStatus;
  budget: number | null;
  tags: string[];
}

export interface StrategicObjective {
  id: string;
  code: string; // e.g. OBJ-01
  title: string;
  description: string;
  perspective: 'financial' | 'customer' | 'internal_process' | 'learning_growth' | 'social_impact';
  owner: string;
  startDate: string;
  endDate: string;
  progress: number; // 0–100
  status: StrategicObjectiveStatus;
  initiatives: Initiative[];
  relatedOKRIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StrategicFoundation {
  mission: string;
  vision: string;
  values: string[];
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}

// ---------------------------------------------------------------------------
// OKR & KPI GOVERNANCE
// ---------------------------------------------------------------------------

export type OKRCycle = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual';
export type OKRStatus = 'on_track' | 'at_risk' | 'behind' | 'completed' | 'cancelled';

export interface KeyResult {
  id: string;
  title: string;
  metricType: 'percentage' | 'number' | 'currency' | 'boolean';
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  progress: number; // 0–100 calculated
  owner: string;
  dueDate: string;
  confidence: 'high' | 'medium' | 'low';
  lastUpdatedAt: string;
  checkIns: Array<{ date: string; value: number; note: string }>;
}

export interface OKR {
  id: string;
  code: string; // e.g. OKR-2025-01
  objective: string;
  description: string;
  cycle: OKRCycle;
  year: number;
  owner: string;
  team: string;
  status: OKRStatus;
  overallProgress: number; // avg of KRs
  keyResults: KeyResult[];
  relatedObjectiveId: string | null;
  createdAt: string;
  updatedAt: string;
  auditTrail: AuditEntry[];
}

// ---------------------------------------------------------------------------
// CORPORATE COMMITTEES
// ---------------------------------------------------------------------------

export type CommitteeMemberRole = 'president' | 'secretary' | 'member' | 'advisor' | 'guest';

export interface CommitteeMember {
  userId: string;
  name: string;
  role: CommitteeMemberRole;
  joinedAt: string;
  isActive: boolean;
}

export type MeetingStatus = 'scheduled' | 'in_progress' | 'concluded' | 'cancelled';

export interface AgendaItem {
  id: string;
  order: number;
  title: string;
  description: string;
  duration: number; // minutes
  presenter: string;
  type: 'information' | 'discussion' | 'decision' | 'approval';
}

export interface CommitteeDecision {
  id: string;
  title: string;
  description: string;
  decidedAt: string;
  decidedBy: string[];
  votes: { for: number; against: number; abstention: number };
  outcome: 'approved' | 'rejected' | 'deferred' | 'tabled';
  workflowTaskId: string | null; // integração BPMSContext
  deadline: string | null;
  responsibles: string[];
  auditTrail: AuditEntry[];
}

export interface CommitteeMeeting {
  id: string;
  committeeId: string;
  title: string;
  scheduledAt: string;
  location: string;
  isVirtual: boolean;
  status: MeetingStatus;
  quorumRequired: number;
  quorumAchieved: number;
  agenda: AgendaItem[];
  minutesText: string;
  decisions: CommitteeDecision[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Committee {
  id: string;
  code: string; // e.g. CMT-001
  name: string;
  description: string;
  type: 'advisory' | 'deliberative' | 'executive' | 'audit' | 'ethics' | 'risk';
  isActive: boolean;
  members: CommitteeMember[];
  meetings: CommitteeMeeting[];
  meetingFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'on_demand';
  createdAt: string;
  updatedAt: string;
  auditTrail: AuditEntry[];
}

// ---------------------------------------------------------------------------
// GOVERNANCE STRUCTURE
// ---------------------------------------------------------------------------

export interface GovernanceBody {
  id: string;
  name: string;
  type: 'board' | 'directorate' | 'committee' | 'unit';
  description: string;
  parentId: string | null;
  members: Array<{ name: string; role: string; since: string }>;
  responsibilities: string[];
  delegations: string[];
}

// ---------------------------------------------------------------------------
// AUDIT TRAIL (Trilhas Imutáveis)
// ---------------------------------------------------------------------------

export type GovernanceEventType =
  | 'RiskRegistered'
  | 'RiskMitigated'
  | 'PolicyPublished'
  | 'PolicyVersioned'
  | 'ComplianceViolationDetected'
  | 'ComplianceResolved'
  | 'InternalControlExecuted'
  | 'InternalControlFailed'
  | 'CommitteeDecisionRecorded'
  | 'CommitteeMeetingScheduled'
  | 'StrategicGoalUpdated'
  | 'InitiativeCreated'
  | 'OKRCompleted'
  | 'OKRCreated'
  | 'KeyResultUpdated'
  | 'AuditRecommendationImplemented'
  | 'GovernanceReviewCompleted'
  | 'GovernanceBodyUpdated';

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: GovernanceEventType | string;
  module: string;
  entityId: string;
  entityType: string;
  description: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  hash: string; // simulated immutable hash
  ipAddress?: string;
}

// ---------------------------------------------------------------------------
// AEGRC STORE (Estado Global)
// ---------------------------------------------------------------------------

export interface AEGRCState {
  // Governance
  strategicFoundation: StrategicFoundation;
  governanceBodies: GovernanceBody[];

  // ERM
  risks: Risk[];

  // Compliance
  complianceItems: ComplianceItem[];

  // Controls
  internalControls: InternalControl[];

  // Policies
  policies: Policy[];

  // Strategy
  strategicObjectives: StrategicObjective[];

  // OKRs
  okrs: OKR[];

  // Committees
  committees: Committee[];

  // Audit
  auditLog: AuditEntry[];
}

export interface AEGRCContextValue extends AEGRCState {
  // ERM Actions
  addRisk: (risk: Omit<Risk, 'id' | 'code' | 'inherentScore' | 'level' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => void;
  updateRisk: (id: string, updates: Partial<Risk>) => void;

  // Compliance Actions
  updateComplianceItem: (id: string, updates: Partial<ComplianceItem>) => void;

  // Control Actions
  addControl: (control: Omit<InternalControl, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => void;
  updateControl: (id: string, updates: Partial<InternalControl>) => void;

  // Policy Actions
  addPolicy: (policy: Omit<Policy, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => void;
  updatePolicy: (id: string, updates: Partial<Policy>) => void;

  // Strategic Planning Actions
  updateStrategicFoundation: (updates: Partial<StrategicFoundation>) => void;
  addStrategicObjective: (obj: Omit<StrategicObjective, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => void;
  updateStrategicObjective: (id: string, updates: Partial<StrategicObjective>) => void;

  // OKR Actions
  addOKR: (okr: Omit<OKR, 'id' | 'code' | 'overallProgress' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => void;
  updateKeyResult: (okrId: string, krId: string, newValue: number, note: string) => void;

  // Committee Actions
  addCommittee: (committee: Omit<Committee, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => void;
  addCommitteeMeeting: (committeeId: string, meeting: Omit<CommitteeMeeting, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addCommitteeDecision: (committeeId: string, meetingId: string, decision: Omit<CommitteeDecision, 'id' | 'decidedAt' | 'auditTrail'>) => void;

  // Computed
  risksByLevel: Record<RiskLevel, Risk[]>;
  complianceScore: number; // 0–100
  governanceMaturityScore: number; // 0–100
  criticalAlerts: Array<{ type: string; message: string; entityId: string }>;
}
