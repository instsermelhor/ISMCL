// ============================================================
// PLATFORM HEALTH & AUDIT CENTER — TYPE DEFINITIONS
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

export type ModuleStatus = 'online' | 'degraded' | 'offline' | 'maintenance';
export type IntegrationStatus = 'synced' | 'partial' | 'error' | 'pending';
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
export type ComplianceLevel = 'atendido' | 'parcial' | 'pendente' | 'nao_aplicavel';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertType = 'security' | 'performance' | 'integration' | 'backup' | 'compliance' | 'availability';
export type JourneyStatus = 'idle' | 'running' | 'completed' | 'failed';
export type BackupType = 'full' | 'incremental' | 'differential';
export type BackupStatus = 'success' | 'running' | 'failed' | 'scheduled';

// ─── Module Inventory ───────────────────────────────────────
export interface ModuleInventory {
  id: string;
  name: string;
  code: string;
  category: 'core' | 'social' | 'health' | 'admin' | 'security' | 'integration';
  status: ModuleStatus;
  version: string;
  lastDeploy: string;
  routes: string[];
  dependencies: string[];
  components: number;
  apis: number;
  uptime: number; // percentage 0-100
  responseTimeMs: number;
  errorRate: number; // percentage 0-100
  description: string;
}

// ─── Integration Check ──────────────────────────────────────
export interface IntegrationCheck {
  id: string;
  sourceModule: string;
  targetModule: string;
  type: 'sync' | 'async' | 'event' | 'webhook' | 'api';
  status: IntegrationStatus;
  lastChecked: string;
  latencyMs: number;
  dataFlow: 'unidirectional' | 'bidirectional';
  protocol: string;
  errorMessage?: string;
}

// ─── E2E Journey ────────────────────────────────────────────
export interface JourneyStep {
  id: string;
  stepIndex: number;
  name: string;
  module: string;
  action: string;
  status: TestStatus;
  durationMs?: number;
  error?: string;
  assertions: string[];
}

export interface E2eJourney {
  id: string;
  name: string;
  description: string;
  persona: string;
  priority: 'critical' | 'high' | 'medium';
  status: JourneyStatus;
  steps: JourneyStep[];
  totalDurationMs?: number;
  lastRunAt?: string;
  passRate?: number;
}

// ─── Load Test ──────────────────────────────────────────────
export interface LoadTestDataPoint {
  users: number;
  avgResponseMs: number;
  p95ResponseMs: number;
  p99ResponseMs: number;
  errorRate: number;
  cpuPercent: number;
  memoryPercent: number;
  dbConnectionsActive: number;
  requestsPerSecond: number;
}

export interface LoadTestResult {
  id: string;
  name: string;
  executedAt: string;
  durationMinutes: number;
  status: 'passed' | 'failed' | 'warning';
  dataPoints: LoadTestDataPoint[];
  conclusion: string;
}

// ─── Resilience Test ────────────────────────────────────────
export interface ResilienceTestResult {
  id: string;
  scenario: string;
  simulatedFailure: string;
  recoveryTimeSeconds: number;
  dataLossMinutes: number;
  status: 'passed' | 'failed';
  notes: string;
  executedAt: string;
}

// ─── Backup Record ──────────────────────────────────────────
export interface BackupRecord {
  id: string;
  type: BackupType;
  status: BackupStatus;
  scheduledAt: string;
  completedAt?: string;
  sizeGb: number;
  durationMinutes: number;
  rtoHours: number;
  rpoMinutes: number;
  location: string;
  integrityCheck: 'passed' | 'failed' | 'pending';
  notes?: string;
}

// ─── Security Alert ─────────────────────────────────────────
export interface SecurityAlert {
  id: string;
  type: AlertType;
  severity: SeverityLevel;
  title: string;
  description: string;
  module?: string;
  sourceIp?: string;
  userId?: string;
  timestamp: string;
  status: 'open' | 'acknowledged' | 'resolved';
  resolution?: string;
}

// ─── Compliance Item ────────────────────────────────────────
export interface ComplianceItem {
  id: string;
  framework: 'LGPD' | 'CFM' | 'CFP' | 'CRESS' | 'ISO_27001' | 'ISO_27701' | 'MS_Saude_Digital' | 'Instituto_ISM';
  article?: string;
  requirement: string;
  description: string;
  level: ComplianceLevel;
  evidence?: string;
  responsible: string;
  dueDate?: string;
  notes?: string;
}

// ─── Trace Log ──────────────────────────────────────────────
export interface TraceLog {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  startTime: string;
  durationMs: number;
  status: 'ok' | 'error' | 'timeout';
  tags: Record<string, string>;
  errorMessage?: string;
}

// ─── Health Metric ──────────────────────────────────────────
export interface HealthMetric {
  timestamp: string;
  cpuPercent: number;
  memoryPercent: number;
  dbConnectionsActive: number;
  dbConnectionsMax: number;
  apiLatencyMs: number;
  activeUsers: number;
  requestsPerMinute: number;
  errorRate: number;
  queueDepth: number;
}

// ─── Permission Audit ───────────────────────────────────────
export interface PermissionAuditItem {
  id: string;
  role: string;
  module: string;
  permissions: string[];
  hasExcessiveAccess: boolean;
  findings: string[];
  recommendation?: string;
}

// ─── Report ─────────────────────────────────────────────────
export type ReportType =
  | 'executive'
  | 'technical'
  | 'security'
  | 'integrations'
  | 'performance'
  | 'apis'
  | 'database'
  | 'workflows'
  | 'accessibility'
  | 'compliance'
  | 'corrections'
  | 'certification';

export interface GeneratedReport {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  status: 'ready' | 'generating' | 'error';
  summary: string;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  approved: boolean;
}

// ─── Platform Health Context State ──────────────────────────
export interface PlatformHealthState {
  modules: ModuleInventory[];
  integrations: IntegrationCheck[];
  journeys: E2eJourney[];
  activeJourneyId: string | null;
  loadTests: LoadTestResult[];
  resilienceTests: ResilienceTestResult[];
  backups: BackupRecord[];
  securityAlerts: SecurityAlert[];
  complianceItems: ComplianceItem[];
  traceLogs: TraceLog[];
  healthMetrics: HealthMetric[];
  permissionAudit: PermissionAuditItem[];
  reports: GeneratedReport[];
  isRunningJourney: boolean;
  isRunningLoadTest: boolean;
  currentTab: PlatformHealthTab;
}

export type PlatformHealthTab =
  | 'observability'
  | 'e2e'
  | 'inventory'
  | 'compliance'
  | 'load'
  | 'reports';

export interface PlatformHealthContextType extends PlatformHealthState {
  setCurrentTab: (tab: PlatformHealthTab) => void;
  runJourney: (journeyId: string) => Promise<void>;
  runLoadTest: (userCount: number) => Promise<void>;
  triggerBackup: (type: BackupType) => void;
  acknowledgeAlert: (alertId: string) => void;
  generateReport: (type: ReportType) => void;
  resetJourney: (journeyId: string) => void;
}
