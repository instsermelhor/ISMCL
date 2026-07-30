// =============================================================================
// AIIC — Aura Institutional Intelligence Center, Decision Support &
//        Continuous Optimization Platform
// Tipos e Interfaces TypeScript — Prompt 151 (Fase II — Inteligência Institucional)
// =============================================================================

// ─── AI Model Catalog ────────────────────────────────────────────────────────

export type AIModelStatus = 'proposed' | 'in_review' | 'approved' | 'active' | 'retraining' | 'deprecated' | 'decommissioned';
export type AIModelType = 'predictive' | 'recommendation' | 'nlp' | 'classification' | 'clustering' | 'anomaly_detection';

export interface AIModel {
  id: string;
  name: string;
  type: AIModelType;
  version: string;
  status: AIModelStatus;
  description: string;
  domain: string; // "Assistencial", "Financeiro", "RH", etc.
  accuracyPercent: number;
  biasScore: number; // 0.0 – 1.0 (menor é melhor)
  explainabilityScore: number; // 0.0 – 1.0 (maior é melhor)
  lastTrainedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  tags: string[];
  auditLog: Array<{ event: string; actor: string; timestamp: string }>;
}

// ─── Predictive Analytics ────────────────────────────────────────────────────

export type PredictionTarget =
  | 'beneficiary_dropout'
  | 'professional_overload'
  | 'clinical_risk'
  | 'future_demand'
  | 'volunteer_availability'
  | 'financial_risk'
  | 'operational_risk'
  | 'institutional_kpi';

export interface PredictionResult {
  id: string;
  target: PredictionTarget;
  targetLabel: string;
  probability: number; // 0.0 – 1.0
  confidenceLevel: 'high' | 'medium' | 'low';
  horizon: string; // e.g. "próximas 4 semanas"
  explanation: string;
  modelId: string;
  generatedAt: string;
  reviewedByHuman: boolean;
  actionRequired: boolean;
  suggestedAction: string;
}

// ─── Recommendation Engine ───────────────────────────────────────────────────

export type RecommendationType =
  | 'referral'
  | 'training'
  | 'protocol'
  | 'workflow'
  | 'document'
  | 'policy'
  | 'process_optimization'
  | 'risk_mitigation';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  typeLabel: string;
  title: string;
  description: string;
  targetAudience: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidenceScore: number;
  justification: string;
  modelId: string;
  accepted: boolean | null; // null = pending
  feedback: string | null;
  createdAt: string;
  expiresAt: string | null;
}

// ─── Knowledge Graph ─────────────────────────────────────────────────────────

export type KGNodeType = 'person' | 'organization' | 'project' | 'service' | 'document' | 'competency' | 'risk' | 'process' | 'indicator';

export interface KGNode {
  id: string;
  type: KGNodeType;
  label: string;
  properties: Record<string, string | number>;
  connections: number;
}

export interface KGEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
}

export interface KnowledgeGraph {
  nodes: KGNode[];
  edges: KGEdge[];
  lastUpdatedAt: string;
  totalRelationships: number;
}

// ─── Institutional Insight ───────────────────────────────────────────────────

export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface InstitutionalInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: InsightSeverity;
  relatedModule: string;
  dataSource: string[];
  generatedAt: string;
  actionItems: string[];
  linkedRecommendationIds: string[];
}

// ─── Continuous Optimization ─────────────────────────────────────────────────

export type OptimizationStatus = 'identified' | 'in_analysis' | 'action_planned' | 'implementing' | 'completed';

export interface OptimizationOpportunity {
  id: string;
  title: string;
  area: string;
  type: 'bottleneck' | 'redundancy' | 'waste' | 'risk' | 'improvement';
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  status: OptimizationStatus;
  description: string;
  proposedAction: string;
  estimatedGain: string;
  identifiedAt: string;
}

// ─── Executive Dashboard ─────────────────────────────────────────────────────

export interface ExecutiveKPI {
  id: string;
  label: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  domain: string;
  alert: boolean;
  alertMessage: string | null;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type AIICEventType =
  | 'InstitutionalInsightGenerated'
  | 'RecommendationCreated'
  | 'PredictionCalculated'
  | 'OptimizationSuggested'
  | 'AIModelApproved'
  | 'AIModelRetrained'
  | 'KnowledgeGraphUpdated'
  | 'ExecutiveAlertIssued'
  | 'RiskPredictionGenerated'
  | 'ContinuousImprovementStarted';

export interface AIICAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: AIICEventType;
  description: string;
  entityId: string;
  hash: string;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export interface AIICContextValue {
  models: AIModel[];
  predictions: PredictionResult[];
  recommendations: Recommendation[];
  knowledgeGraph: KnowledgeGraph;
  insights: InstitutionalInsight[];
  optimizations: OptimizationOpportunity[];
  executiveKPIs: ExecutiveKPI[];
  auditLog: AIICAuditEntry[];

  // Actions
  approveModel: (modelId: string, approver: string) => void;
  retrainModel: (modelId: string) => void;
  acceptRecommendation: (recId: string, feedback: string) => void;
  rejectRecommendation: (recId: string, feedback: string) => void;
  runPredictions: () => void;
  runOptimizationScan: () => void;
  queryKnowledgeGraph: (query: string) => KGNode[];
}
