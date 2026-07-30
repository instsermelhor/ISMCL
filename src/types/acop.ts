// =============================================================================
// ACOP — Aura Cognitive Orchestration Platform, Multi-Agent Intelligence &
//        Autonomous Decision Support
// Tipos e Interfaces TypeScript — Prompt 152 (Fase III — Ecossistema Cognitivo)
// =============================================================================

// ─── Agents ──────────────────────────────────────────────────────────────────

export type AgentDomain =
  | 'psychology'
  | 'psychiatry'
  | 'social_work'
  | 'legal'
  | 'financial'
  | 'hr'
  | 'compliance'
  | 'audit'
  | 'security'
  | 'case_management'
  | 'bi'
  | 'ecm'
  | 'corporate_university'
  | 'governance';

export type AgentStatus = 'idle' | 'processing' | 'awaiting_human' | 'error' | 'offline';

export interface SpecializedAgent {
  id: string;
  name: string;
  domain: AgentDomain;
  domainLabel: string;
  status: AgentStatus;
  currentTaskId: string | null;
  tasksCompleted: number;
  tasksInQueue: number;
  avgResponseMs: number;
  accuracyPercent: number;
  lastActiveAt: string;
  capabilities: string[];
  restrictedTo: string[]; // RBAC: roles que podem acionar este agente
}

// ─── Cognitive Tasks ─────────────────────────────────────────────────────────

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'queued' | 'routing' | 'processing' | 'awaiting_human_validation' | 'completed' | 'failed';

export interface CognitiveTask {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  domain: AgentDomain;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
  result: string | null;
  requiresHumanValidation: boolean;
  validatedBy: string | null;
  evidences: string[];
}

// ─── Institutional Reasoning ─────────────────────────────────────────────────

export type ReasoningSourceType = 'knowledge_graph' | 'ecm' | 'bi' | 'workflow' | 'business_rules' | 'vector_base' | 'policy_catalog' | 'institutional_history';

export interface ReasoningTrace {
  source: ReasoningSourceType;
  sourceLabel: string;
  contribution: string; // what this source provided
  weight: number; // 0.0-1.0 importance
}

export interface InstitutionalReasoning {
  id: string;
  question: string;
  conclusion: string;
  confidenceScore: number;
  traces: ReasoningTrace[];
  agentsInvolved: string[];
  createdAt: string;
  approved: boolean;
}

// ─── Cognitive Memory ─────────────────────────────────────────────────────────

export type MemoryType = 'decision' | 'pattern' | 'learning' | 'feedback' | 'rejected_recommendation' | 'accepted_recommendation' | 'context';

export interface CognitiveMemoryEntry {
  id: string;
  type: MemoryType;
  typeLabel: string;
  summary: string;
  domain: AgentDomain;
  relevanceScore: number; // 0.0-1.0
  timesReferenced: number;
  createdAt: string;
  lastReferencedAt: string;
  tags: string[];
}

// ─── Model Lifecycle ──────────────────────────────────────────────────────────

export type ModelLifecyclePhase = 'registered' | 'training' | 'validation' | 'staging' | 'production' | 'monitoring' | 'deprecated' | 'retired';

export interface ManagedModel {
  id: string;
  name: string;
  domain: string;
  version: string;
  phase: ModelLifecyclePhase;
  accuracyPercent: number;
  driftScore: number; // 0.0–1.0  (higher = more drift)
  latencyMs: number;
  computeCostPerCall: number; // USD cents
  callsThisMonth: number;
  qualityScore: number; // composite 0.0–1.0
  lastEvaluatedAt: string;
  ownedBy: string;
  alert: boolean;
  alertMessage: string | null;
}

// ─── Performance Monitoring ───────────────────────────────────────────────────

export interface AgentPerformanceMetric {
  agentId: string;
  agentName: string;
  period: string; // e.g. "Julho/2026"
  tasksCompleted: number;
  avgLatencyMs: number;
  accuracyPercent: number;
  humanOverrideRate: number; // % tasks overridden by human
  satisfactionScore: number; // 0-5
  drift: boolean;
}

// ─── Orchestration Events ─────────────────────────────────────────────────────

export type ACOPEventType =
  | 'CognitiveTaskAssigned'
  | 'AIAgentSelected'
  | 'RecommendationGenerated'
  | 'RecommendationApproved'
  | 'RecommendationRejected'
  | 'InstitutionalReasoningCompleted'
  | 'CognitiveMemoryUpdated'
  | 'ModelPerformanceChanged'
  | 'AIOrchestrationExecuted'
  | 'CognitiveAuditCompleted';

export interface ACOPAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: ACOPEventType;
  description: string;
  entityId: string;
  hash: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface ACOPContextValue {
  agents: SpecializedAgent[];
  tasks: CognitiveTask[];
  reasonings: InstitutionalReasoning[];
  cognitiveMemory: CognitiveMemoryEntry[];
  managedModels: ManagedModel[];
  performanceMetrics: AgentPerformanceMetric[];
  auditLog: ACOPAuditEntry[];

  // Actions
  assignTask: (task: Omit<CognitiveTask, 'id' | 'assignedAgentId' | 'assignedAgentName' | 'status' | 'createdAt' | 'completedAt' | 'result' | 'validatedBy'>) => void;
  validateTask: (taskId: string, validator: string) => void;
  runReasoning: (question: string) => InstitutionalReasoning;
  retireModel: (modelId: string) => void;
  promoteModel: (modelId: string) => void;
  forceRetrain: (modelId: string) => void;
}
