// =============================================================================
// AEIP — Aura Enterprise Integration Platform, API Management & Interoperability Hub
// Tipos e Interfaces TypeScript — Prompt 147
// =============================================================================

export type IntegrationProtocol = 'REST' | 'GraphQL' | 'gRPC' | 'WebSocket' | 'AMQP' | 'Webhook';

export type APIStatus = 'alpha' | 'beta' | 'active' | 'deprecated' | 'retired';

export type ConnectorCategory =
  | 'government'
  | 'financial'
  | 'communication'
  | 'identity'
  | 'education'
  | 'analytics'
  | 'ai_provider'
  | 'cloud_storage'
  | 'institutional';

export type WebhookStatus = 'active' | 'degraded' | 'disabled' | 'failing';

export type SyncMode = 'realtime' | 'batch' | 'incremental' | 'full';

export interface ManagedAPI {
  id: string;
  code: string; // e.g. API-IAM-01
  name: string;
  version: string; // e.g. "v1.2.0"
  protocol: IntegrationProtocol;
  endpoint: string;
  status: APIStatus;
  rateLimitPerMinute: number;
  quotaPerDay: number;
  authMethod: 'OAuth2' | 'API_Key' | 'mTLS' | 'JWT';
  description: string;
  targetService: string;
  totalCalls24h: number;
  errorRatePercent: number;
  avgLatencyMs: number;
  openApiSpecUrl: string;
}

export interface EventTopicMessage {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  publisher: string;
  timestamp: string;
  status: 'published' | 'delivered' | 'dlq';
  retryCount: number;
}

export interface Connector {
  id: string;
  code: string; // e.g. CON-GOV-01
  name: string;
  category: ConnectorCategory;
  provider: string; // e.g. "e-Social / CadÚnico", "PIX / Banco Central", "WhatsApp Business"
  version: string;
  status: 'healthy' | 'warning' | 'error' | 'maintenance';
  lastSyncAt: string;
  authConfigured: boolean;
  activeIntegrationsCount: number;
  description: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  targetUrl: string;
  events: string[];
  secretKeyHash: string; // HMAC secret
  status: WebhookStatus;
  retryPolicy: 'exponential_backoff' | 'linear';
  maxRetries: number;
  delivered24h: number;
  failed24h: number;
  createdAt: string;
}

export interface DataSyncJob {
  id: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  syncMode: SyncMode;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRunAt: string;
  nextRunAt: string;
  recordsProcessed: number;
  conflictResolutionStrategy: 'source_wins' | 'target_wins' | 'manual_review';
}

export interface IntegrationMetric {
  timestamp: string;
  throughputRps: number;
  latencyMs: number;
  successCount: number;
  errorCount: number;
}

export type AEIPEventType =
  | 'IntegrationCreated'
  | 'APIPublished'
  | 'ConnectorInstalled'
  | 'WebhookRegistered'
  | 'SynchronizationCompleted'
  | 'ContractUpdated'
  | 'IntegrationFailed'
  | 'RetryExecuted'
  | 'IntegrationApproved'
  | 'GovernanceValidated';

export interface AEIPAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: AEIPEventType;
  description: string;
  systemRef: string;
  hash: string;
}

export interface AEIPContextValue {
  apis: ManagedAPI[];
  eventMessages: EventTopicMessage[];
  dlqMessages: EventTopicMessage[];
  connectors: Connector[];
  webhooks: WebhookEndpoint[];
  syncJobs: DataSyncJob[];
  metrics: IntegrationMetric[];
  auditLog: AEIPAuditEntry[];

  // Actions
  publishAPI: (api: Omit<ManagedAPI, 'id' | 'code' | 'totalCalls24h' | 'errorRatePercent' | 'avgLatencyMs'>) => void;
  publishEvent: (topic: string, payload: Record<string, unknown>, publisher: string) => void;
  registerWebhook: (webhook: Omit<WebhookEndpoint, 'id' | 'delivered24h' | 'failed24h' | 'createdAt'>) => void;
  installConnector: (connector: Omit<Connector, 'id' | 'code' | 'activeIntegrationsCount'>) => void;
  triggerSyncJob: (jobId: string) => void;
  replayDLQMessage: (messageId: string) => void;
}
