import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  AEIPContextValue, ManagedAPI, EventTopicMessage, Connector, WebhookEndpoint, DataSyncJob, IntegrationMetric, AEIPAuditEntry
} from '../types/aeip';

const INITIAL_APIS: ManagedAPI[] = [
  {
    id: 'api-1', code: 'API-IAM-01', name: 'IAM Identity & Access API', version: 'v1.2.0', protocol: 'REST',
    endpoint: '/api/v1/iam/users', status: 'active', rateLimitPerMinute: 1000, quotaPerDay: 100000,
    authMethod: 'OAuth2', description: 'Serviço corporativo de autenticação, perfis e permissões IAM.',
    targetService: 'IAMCenter', totalCalls24h: 42800, errorRatePercent: 0.02, avgLatencyMs: 14, openApiSpecUrl: '/docs/openapi-iam.json'
  },
  {
    id: 'api-2', code: 'API-BPMS-01', name: 'BPMS Workflow Execution API', version: 'v1.0.0', protocol: 'GraphQL',
    endpoint: '/graphql/bpms', status: 'active', rateLimitPerMinute: 500, quotaPerDay: 50000,
    authMethod: 'JWT', description: 'Motor de orquestração de processos e envio de tarefas de fluxo.',
    targetService: 'BPMSCenter', totalCalls24h: 18450, errorRatePercent: 0.1, avgLatencyMs: 28, openApiSpecUrl: '/docs/openapi-bpms.json'
  },
  {
    id: 'api-3', code: 'API-AECM-01', name: 'AECM Content & Search API', version: 'v2.0.0', protocol: 'gRPC',
    endpoint: 'grpc.aura.ism.org:50051', status: 'active', rateLimitPerMinute: 2000, quotaPerDay: 200000,
    authMethod: 'mTLS', description: 'API de alta performance para busca semântica, OCR e repositório ECM.',
    targetService: 'AECM-KG', totalCalls24h: 65100, errorRatePercent: 0.05, avgLatencyMs: 8, openApiSpecUrl: '/docs/openapi-aecm.json'
  }
];

const INITIAL_CONNECTORS: Connector[] = [
  {
    id: 'con-wa-01',
    code: 'CON-COM-01',
    name: 'WhatsApp Business Platform (Meta Cloud API)',
    category: 'communication',
    provider: 'Meta Platforms Inc. / WhatsApp Cloud API',
    version: 'v19.0',
    status: 'healthy',
    lastSyncAt: new Date().toISOString(),
    authConfigured: true,
    activeIntegrationsCount: 12,
    description: 'Envio de notificações ativas, confirmações de agendamento e links de atendimento via WhatsApp.',
    configParams: {
      WHATSAPP_PHONE_NUMBER_ID: '109283746501928',
      WHATSAPP_BUSINESS_ACCOUNT_ID: '987654321012345',
      WHATSAPP_ACCESS_TOKEN: 'EAAG...[ENCRYPTED_VAULT_TOKEN]',
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'aura_wa_verify_token_2026',
      DEFAULT_TEMPLATE_NAME: 'aura_appointment_confirmation',
    },
    commands: [
      'POST /v19.0/{phone_number_id}/messages (Enviar Template/Notificação)',
      'GET /v19.0/{phone_number_id} (Health Check API Meta)',
      'POST /webhook (Receber Webhook de Status de Entrega/Leitura)',
    ],
  },
  {
    id: 'con-meet-01',
    code: 'CON-COM-02',
    name: 'Google Meet & Calendar Telehealth Connector',
    category: 'communication',
    provider: 'Google Workspace / Google Calendar API v3',
    version: 'v3.0',
    status: 'healthy',
    lastSyncAt: new Date().toISOString(),
    authConfigured: true,
    activeIntegrationsCount: 8,
    description: 'Geração automática e segura de reuniões do Google Meet para teleconsultas e salas virtuais de atendimento.',
    configParams: {
      GOOGLE_CALENDAR_ID: 'atendimentos@institutosermelhor.org',
      GOOGLE_SERVICE_ACCOUNT_EMAIL: 'aura-telehealth@ismcl.iam.gserviceaccount.com',
      GOOGLE_SERVICE_ACCOUNT_KEY: '-----BEGIN PRIVATE KEY-----\\nMIIEvg...[VAULT]',
      DEFAULT_TIMEZONE: 'America/Sao_Paulo',
    },
    commands: [
      'POST /calendars/{calendarId}/events?conferenceDataVersion=1 (Criar Reunião Meet)',
      'PATCH /calendars/{calendarId}/events/{eventId} (Atualizar Reunião)',
      'DELETE /calendars/{calendarId}/events/{eventId} (Cancelar Reunião)',
    ],
  },
  {
    id: 'con-teams-01',
    code: 'CON-COM-03',
    name: 'Microsoft Teams & Graph API Connector',
    category: 'communication',
    provider: 'Microsoft Corporation / MS Graph API',
    version: 'v1.0',
    status: 'healthy',
    lastSyncAt: new Date().toISOString(),
    authConfigured: true,
    activeIntegrationsCount: 5,
    description: 'Integração com Microsoft Teams para reuniões institucionais, supervisão clínica e teleatendimentos corporativos.',
    configParams: {
      TEAMS_TENANT_ID: '72f988bf-86f1-41af-91ab-2d7cd011db47',
      TEAMS_CLIENT_ID: 'a897b654-3210-4bc3-9876-123456789abc',
      TEAMS_CLIENT_SECRET: 'ms_secret_...[ENCRYPTED_VAULT]',
      TEAMS_ORGANIZER_USER_ID: 'coordenacao@institutosermelhor.org',
    },
    commands: [
      'POST /users/{userId}/onlineMeetings (Criar Reunião Teams)',
      'PATCH /users/{userId}/onlineMeetings/{meetingId} (Atualizar Reunião)',
      'DELETE /users/{userId}/onlineMeetings/{meetingId} (Cancelar Reunião)',
    ],
  },
  {
    id: 'con-1',
    code: 'CON-GOV-01',
    name: 'Conector CadÚnico / e-Social',
    category: 'government',
    provider: 'Ministério do Desenvolvimento Social',
    version: 'v2.1',
    status: 'healthy',
    lastSyncAt: new Date().toISOString(),
    authConfigured: true,
    activeIntegrationsCount: 4,
    description: 'Sincronização de cadastros sociais e validação de benefícios.',
    configParams: {
      ESOCIAL_ENVIRONMENT: 'PRODUCTION',
      ESOCIAL_TRANSMITTER_CPF_CNPJ: '12.345.678/0001-90',
      ESOCIAL_CERTIFICATE_THUMBPRINT: 'A9B8C7D6E5F4...[PFX_CERT]',
    },
    commands: [
      'POST /api/v1/esocial/lote (Enviar Lote de Eventos)',
      'GET /api/v1/esocial/consulta (Consultar Protocolo de Recepção)',
    ],
  },
  {
    id: 'con-2',
    code: 'CON-FIN-01',
    name: 'Conector PIX & Banco Central (BACEN)',
    category: 'financial',
    provider: 'Banco Central do Brasil / Gateway PIX',
    version: 'v1.5',
    status: 'healthy',
    lastSyncAt: new Date().toISOString(),
    authConfigured: true,
    activeIntegrationsCount: 2,
    description: 'Processamento e reconciliação em tempo real de doações via PIX.',
    configParams: {
      PIX_KEY: 'pix@institutosermelhor.org',
      PIX_GATEWAY_CLIENT_ID: 'pix_client_ismcl_prod',
      PIX_GATEWAY_SECRET: 'pix_secret_...[VAULT]',
      BACEN_ENV: 'PRODUCTION',
    },
    commands: [
      'POST /v2/cobv (Criar Cobrança PIX com QR Code)',
      'GET /v2/pix (Consultar Pix Recebidos / Webhook Conciliação)',
    ],
  },
  {
    id: 'con-3',
    code: 'CON-AI-01',
    name: 'Conector Gemini AI Engine',
    category: 'ai_provider',
    provider: 'Google Cloud Vertex AI',
    version: 'v3.0',
    status: 'healthy',
    lastSyncAt: new Date().toISOString(),
    authConfigured: true,
    activeIntegrationsCount: 8,
    description: 'Provedor de inteligência artificial multimodal para triagem e busca semântica.',
    configParams: {
      GEMINI_MODEL: 'gemini-1.5-pro-latest',
      GOOGLE_CLOUD_PROJECT_ID: 'aura-ismcl-prod',
      VERTEX_LOCATION: 'us-central1',
    },
    commands: [
      'POST /v1/projects/{project}/locations/{location}/publishers/google/models/gemini:streamGenerateContent',
    ],
  },
];

const INITIAL_WEBHOOKS: WebhookEndpoint[] = [
  { id: 'wh-1', name: 'Notificações WhatsApp Business Cloud Webhook', targetUrl: 'https://api.whatsapp.com/v19.0/webhook', events: ['messages', 'message_deliveries', 'message_reads'], secretKeyHash: 'hmac_sha256_secret_771', status: 'active', retryPolicy: 'exponential_backoff', maxRetries: 5, delivered24h: 1240, failed24h: 3, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'wh-2', name: 'Sistema de Contabilidade Externa (TOTVS)', targetUrl: 'https://erp.parceiro.org/webhook/financial', events: ['FinancialTransactionCreated', 'DonationReceived'], secretKeyHash: 'hmac_sha256_secret_882', status: 'active', retryPolicy: 'linear', maxRetries: 3, delivered24h: 310, failed24h: 0, createdAt: '2025-02-01T10:00:00Z' }
];

const INITIAL_SYNC_JOBS: DataSyncJob[] = [
  { id: 'sync-1', name: 'Sincronização de Beneficiários e Famílias', sourceSystem: 'SATAI (Triagem)', targetSystem: 'Patients DB & ERP Social', syncMode: 'realtime', status: 'idle', lastRunAt: new Date().toISOString(), nextRunAt: new Date(Date.now() + 300000).toISOString(), recordsProcessed: 1420, conflictResolutionStrategy: 'source_wins' },
  { id: 'sync-2', name: 'Carga de Indicadores de Governança no BI', sourceSystem: 'AEGRC & ACU', targetSystem: 'Platform Health BI Engine', syncMode: 'batch', status: 'idle', lastRunAt: new Date().toISOString(), nextRunAt: new Date(Date.now() + 3600000).toISOString(), recordsProcessed: 8900, conflictResolutionStrategy: 'target_wins' }
];

const INITIAL_METRICS: IntegrationMetric[] = [
  { timestamp: '11:00', throughputRps: 145, latencyMs: 12, successCount: 8700, errorCount: 2 },
  { timestamp: '11:05', throughputRps: 160, latencyMs: 14, successCount: 9600, errorCount: 4 },
  { timestamp: '11:10', throughputRps: 182, latencyMs: 11, successCount: 10920, errorCount: 1 },
  { timestamp: '11:15', throughputRps: 195, latencyMs: 15, successCount: 11700, errorCount: 3 },
  { timestamp: '11:20', throughputRps: 210, latencyMs: 13, successCount: 12600, errorCount: 0 },
];

const AEIPContext = createContext<AEIPContextValue | null>(null);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function AEIPProvider({ children }: { children: React.ReactNode }) {
  const [apis, setApis] = useState<ManagedAPI[]>(() => loadStorage('aeip_apis', INITIAL_APIS));
  const [eventMessages, setEventMessages] = useState<EventTopicMessage[]>(() => loadStorage('aeip_events', []));
  const [dlqMessages, setDlqMessages] = useState<EventTopicMessage[]>(() => loadStorage('aeip_dlq', []));
  const [connectors, setConnectors] = useState<Connector[]>(() => loadStorage('aeip_connectors', INITIAL_CONNECTORS));
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(() => loadStorage('aeip_webhooks', INITIAL_WEBHOOKS));
  const [syncJobs, setSyncJobs] = useState<DataSyncJob[]>(() => loadStorage('aeip_sync_jobs', INITIAL_SYNC_JOBS));
  const [metrics] = useState<IntegrationMetric[]>(INITIAL_METRICS);
  const [auditLog, setAuditLog] = useState<AEIPAuditEntry[]>(() => loadStorage('aeip_audit_log', []));

  useEffect(() => { localStorage.setItem('aeip_apis', JSON.stringify(apis)); }, [apis]);
  useEffect(() => { localStorage.setItem('aeip_events', JSON.stringify(eventMessages)); }, [eventMessages]);
  useEffect(() => { localStorage.setItem('aeip_dlq', JSON.stringify(dlqMessages)); }, [dlqMessages]);
  useEffect(() => { localStorage.setItem('aeip_connectors', JSON.stringify(connectors)); }, [connectors]);
  useEffect(() => { localStorage.setItem('aeip_webhooks', JSON.stringify(webhooks)); }, [webhooks]);
  useEffect(() => { localStorage.setItem('aeip_sync_jobs', JSON.stringify(syncJobs)); }, [syncJobs]);
  useEffect(() => { localStorage.setItem('aeip_audit_log', JSON.stringify(auditLog)); }, [auditLog]);

  const addAudit = useCallback((action: AEIPAuditEntry['action'], description: string, actor: string, systemRef: string) => {
    const entry: AEIPAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      description,
      systemRef,
      hash: Math.random().toString(36).substring(2, 10),
    };
    setAuditLog(prev => [entry, ...prev]);
    window.dispatchEvent(new CustomEvent('aeip:event', { detail: entry }));
  }, []);

  const publishAPI = useCallback((api: Omit<ManagedAPI, 'id' | 'code' | 'totalCalls24h' | 'errorRatePercent' | 'avgLatencyMs'>) => {
    const id = `api-${Date.now()}`;
    const code = `API-${api.targetService.substring(0, 3).toUpperCase()}-${String(apis.length + 1).padStart(2, '0')}`;
    const newAPI: ManagedAPI = {
      ...api,
      id,
      code,
      totalCalls24h: 0,
      errorRatePercent: 0,
      avgLatencyMs: 10,
    };
    setApis(prev => [newAPI, ...prev]);
    addAudit('APIPublished', `API '${newAPI.name}' (${newAPI.code}) publicada no API Gateway`, 'DevOps / Architect', newAPI.targetService);
  }, [apis.length, addAudit]);

  const publishEvent = useCallback((topic: string, payload: Record<string, unknown>, publisher: string) => {
    const msg: EventTopicMessage = {
      id: `msg-${Date.now()}`,
      topic,
      payload,
      publisher,
      timestamp: new Date().toISOString(),
      status: 'published',
      retryCount: 0,
    };
    setEventMessages(prev => [msg, ...prev]);
    addAudit('IntegrationCreated', `Evento de tópico '${topic}' publicado por ${publisher}`, publisher, topic);
  }, [addAudit]);

  const registerWebhook = useCallback((webhook: Omit<WebhookEndpoint, 'id' | 'delivered24h' | 'failed24h' | 'createdAt'>) => {
    const newWh: WebhookEndpoint = {
      ...webhook,
      id: `wh-${Date.now()}`,
      delivered24h: 0,
      failed24h: 0,
      createdAt: new Date().toISOString(),
    };
    setWebhooks(prev => [newWh, ...prev]);
    addAudit('WebhookRegistered', `Webhook '${newWh.name}' registrado para o endpoint ${newWh.targetUrl}`, 'Integration Admin', newWh.name);
  }, [addAudit]);

  const installConnector = useCallback((connector: Omit<Connector, 'id' | 'code' | 'activeIntegrationsCount'>) => {
    const id = `con-${Date.now()}`;
    const code = `CON-${connector.category.substring(0, 3).toUpperCase()}-${String(connectors.length + 1).padStart(2, '0')}`;
    const newCon: Connector = {
      ...connector,
      id,
      code,
      activeIntegrationsCount: 1,
    };
    setConnectors(prev => [newCon, ...prev]);
    addAudit('ConnectorInstalled', `Conector '${newCon.name}' (${newCon.code}) instalado com sucesso`, 'System Architect', newCon.provider);
  }, [connectors.length, addAudit]);

  const triggerSyncJob = useCallback((jobId: string) => {
    setSyncJobs(prev => prev.map(job => {
      if (job.id !== jobId) return job;
      const updated = {
        ...job,
        status: 'completed' as const,
        lastRunAt: new Date().toISOString(),
        recordsProcessed: job.recordsProcessed + Math.floor(10 + Math.random() * 50),
      };
      addAudit('SynchronizationCompleted', `Job de sincronização '${job.name}' executado com sucesso`, 'Sync Engine', job.sourceSystem);
      return updated;
    }));
  }, [addAudit]);

  const replayDLQMessage = useCallback((messageId: string) => {
    setDlqMessages(prev => prev.filter(m => m.id !== messageId));
    addAudit('RetryExecuted', `Mensagem DLQ ${messageId} reprocessada com sucesso`, 'Integration Operator', 'EventBus DLQ');
  }, [addAudit]);

  const updateConnectorConfig = useCallback((connectorId: string, configParams: Record<string, string>) => {
    setConnectors(prev => prev.map(c => {
      if (c.id !== connectorId) return c;
      const updated = {
        ...c,
        configParams: { ...c.configParams, ...configParams },
        authConfigured: true,
        status: 'healthy' as const,
        lastSyncAt: new Date().toISOString(),
      };
      addAudit('ContractUpdated', `Parâmetros/credenciais do conector '${c.name}' (${c.code}) atualizados`, 'Integration Admin', c.provider);
      return updated;
    }));
  }, [addAudit]);

  const value = useMemo<AEIPContextValue>(() => ({
    apis,
    eventMessages,
    dlqMessages,
    connectors,
    webhooks,
    syncJobs,
    metrics,
    auditLog,
    publishAPI,
    publishEvent,
    registerWebhook,
    installConnector,
    updateConnectorConfig,
    triggerSyncJob,
    replayDLQMessage,
  }), [apis, eventMessages, dlqMessages, connectors, webhooks, syncJobs, metrics, auditLog, publishAPI, publishEvent, registerWebhook, installConnector, updateConnectorConfig, triggerSyncJob, replayDLQMessage]);

  return <AEIPContext.Provider value={value}>{children}</AEIPContext.Provider>;
}

export function useAEIP() {
  const context = useContext(AEIPContext);
  if (!context) throw new Error('useAEIP must be used within AEIPProvider');
  return context;
}
