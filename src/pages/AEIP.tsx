import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Network, Cpu, Globe, Radio, Webhook, RefreshCw, Activity, Layers,
  Plus, CheckCircle2, AlertTriangle, ShieldCheck, Zap, Lock, Terminal,
  Server, ArrowRight, Play, Database, Key, HardDrive, Settings, Sliders,
  MessageSquare, ExternalLink, Shield
} from 'lucide-react';
import { cn } from '../utils';
import { useAEIP } from '../contexts/AEIPContext';
import type { IntegrationProtocol, APIStatus, ConnectorCategory, WebhookStatus, ManagedAPI, WebhookEndpoint, Connector } from '../types/aeip';

const PROTOCOL_CONFIG: Record<IntegrationProtocol, { label: string; color: string; bg: string }> = {
  REST: { label: 'REST OpenAPI', color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
  GraphQL: { label: 'GraphQL', color: 'text-pink-400', bg: 'bg-pink-900/30' },
  gRPC: { label: 'gRPC Protobuf', color: 'text-cyan-400', bg: 'bg-cyan-900/30' },
  WebSocket: { label: 'WebSocket', color: 'text-amber-400', bg: 'bg-amber-900/30' },
  AMQP: { label: 'AMQP RabbitMQ', color: 'text-orange-400', bg: 'bg-orange-900/30' },
  Webhook: { label: 'HTTP Webhook', color: 'text-purple-400', bg: 'bg-purple-900/30' },
};

const CATEGORY_CONFIG: Record<ConnectorCategory, { label: string; color: string }> = {
  government: { label: 'Governamental (e-Social/CadÚnico)', color: 'text-blue-400' },
  financial: { label: 'Financeiro (PIX/BACEN)', color: 'text-emerald-400' },
  communication: { label: 'Comunicação (WhatsApp/Email)', color: 'text-purple-400' },
  identity: { label: 'Identidade Digital', color: 'text-amber-400' },
  education: { label: 'Educacional / LMS', color: 'text-indigo-400' },
  analytics: { label: 'Plataforma Analítica / BI', color: 'text-pink-400' },
  ai_provider: { label: 'Provedor de IA (Gemini/Cloud)', color: 'text-cyan-400' },
  cloud_storage: { label: 'Armazenamento em Nuvem', color: 'text-teal-400' },
  institutional: { label: 'Serviço Institucional', color: 'text-slate-400' },
};

export function AEIP() {
  const navigate = useNavigate();
  const {
    apis, eventMessages, dlqMessages, connectors, webhooks, syncJobs, metrics, auditLog,
    publishAPI, publishEvent, registerWebhook, installConnector, updateConnectorConfig, triggerSyncJob, replayDLQMessage
  } = useAEIP();

  const [activeTab, setActiveTab] = useState<'hub' | 'api' | 'eventbus' | 'connectors' | 'webhooks' | 'sync' | 'monitoring' | 'audit'>('hub');
  const [showApiModal, setShowApiModal] = useState(false);
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [selectedConnectorForConfig, setSelectedConnectorForConfig] = useState<Connector | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamVal, setNewParamVal] = useState('');

  // Form API
  const [apiForm, setApiForm] = useState({
    name: '', version: 'v1.0.0', protocol: 'REST' as IntegrationProtocol, endpoint: '',
    authMethod: 'OAuth2' as ManagedAPI['authMethod'], description: '', targetService: 'IAMCenter', rateLimitPerMinute: 1000, quotaPerDay: 100000
  });

  // Form Conector
  const [connectorForm, setConnectorForm] = useState({
    name: '', category: 'government' as ConnectorCategory, provider: '', version: 'v1.0', description: ''
  });

  // Form Webhook
  const [webhookForm, setWebhookForm] = useState({
    name: '', targetUrl: '', events: 'UserCreated, TriageCompleted', retryPolicy: 'exponential_backoff' as WebhookEndpoint['retryPolicy'], maxRetries: 5
  });

  const handlePublishApi = (e: React.FormEvent) => {
    e.preventDefault();
    publishAPI({
      ...apiForm,
      status: 'active',
      openApiSpecUrl: `/docs/openapi-${apiForm.targetService.toLowerCase()}.json`
    });
    setShowApiModal(false);
    setApiForm({ name: '', version: 'v1.0.0', protocol: 'REST', endpoint: '', authMethod: 'OAuth2', description: '', targetService: 'IAMCenter', rateLimitPerMinute: 1000, quotaPerDay: 100000 });
  };

  const handleInstallConnector = (e: React.FormEvent) => {
    e.preventDefault();
    installConnector({
      ...connectorForm,
      status: 'healthy',
      lastSyncAt: new Date().toISOString(),
      authConfigured: true
    });
    setShowConnectorModal(false);
    setConnectorForm({ name: '', category: 'government', provider: '', version: 'v1.0', description: '' });
  };

  const handleRegisterWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    registerWebhook({
      name: webhookForm.name,
      targetUrl: webhookForm.targetUrl,
      events: webhookForm.events.split(',').map(s => s.trim()).filter(Boolean),
      secretKeyHash: `hmac_${Math.random().toString(36).substring(2, 10)}`,
      status: 'active',
      retryPolicy: webhookForm.retryPolicy,
      maxRetries: webhookForm.maxRetries
    });
    setShowWebhookModal(false);
    setWebhookForm({ name: '', targetUrl: '', events: 'UserCreated, TriageCompleted', retryPolicy: 'exponential_backoff', maxRetries: 5 });
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0a0d14] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/10 bg-[#121624]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-600/20 border border-cyan-500/30">
            <Network className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">AEIP</h1>
              <span className="px-2 py-0.5 rounded text-xs bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 font-semibold">Prompt 147</span>
            </div>
            <p className="text-xs text-slate-400">Enterprise Integration Platform, API Management & Interoperability Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowConnectorModal(true)} className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors">
            + Conector
          </button>
          <button onClick={() => setShowApiModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-cyan-900/20">
            <Plus className="w-4 h-4" /> Publicar API
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 border-b border-white/10 bg-[#121624]/60 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {[
            { id: 'hub', label: 'Integration Hub', icon: Network },
            { id: 'api', label: 'API Gateway & Dev Portal', icon: Globe },
            { id: 'eventbus', label: 'Event Bus & DLQ', icon: Radio },
            { id: 'connectors', label: 'Conectores Institucionais', icon: Cpu },
            { id: 'webhooks', label: 'Gerenciador de Webhooks', icon: Webhook },
            { id: 'sync', label: 'Sincronização de Dados', icon: RefreshCw },
            { id: 'monitoring', label: 'Monitoramento & SLA', icon: Activity },
            { id: 'audit', label: 'Auditoria de Integrações', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all shrink-0',
                  isActive ? 'border-cyan-500 text-cyan-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: INTEGRATION HUB */}
        {activeTab === 'hub' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-cyan-400">{apis.length}</div>
                <div className="text-xs text-slate-400 mt-1">APIs Gerenciadas</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">{connectors.length}</div>
                <div className="text-xs text-slate-400 mt-1">Conectores Ativos</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-purple-400">{webhooks.length}</div>
                <div className="text-xs text-slate-400 mt-1">Webhooks Cadastrados</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-amber-400">{dlqMessages.length}</div>
                <div className="text-xs text-slate-400 mt-1">Mensagens em DLQ</div>
              </div>
            </div>

            {/* Hub Topology */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" /> Arquitetura de Barramento ESB & Integration Hub
              </h3>
              <p className="text-xs text-slate-300">
                Nenhum microsserviço comunica-se diretamente. Toda troca de payloads passa por autenticação OAuth 2.1 / mTLS, validação de contrato OpenAPI e publicação no barramento AsyncAPI.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs space-y-2">
                  <div className="font-bold text-cyan-400">1. Ingestion & API Gateway</div>
                  <div className="text-slate-400">Roteamento, Rate Limiting, Throttling e Autenticação JWT/mTLS.</div>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs space-y-2">
                  <div className="font-bold text-emerald-400">2. Event Bus & Mediation</div>
                  <div className="text-slate-400">Publicação/Assinatura assíncrona, filas de tópicos e reprocessamento DLQ.</div>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs space-y-2">
                  <div className="font-bold text-purple-400">3. Connectors & Data Sync</div>
                  <div className="text-slate-400">Conectores homologados com e-Social, BACEN, WhatsApp e Gemini AI.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: API GATEWAY & DEV PORTAL */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            {apis.map(api => {
              const proto = PROTOCOL_CONFIG[api.protocol];
              return (
                <div key={api.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400">{api.code}</span>
                      <span className="text-sm font-semibold text-white">{api.name}</span>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', proto.bg, proto.color)}>{proto.label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-500/30">Ativa ({api.version})</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>{api.endpoint}</span>
                    <span className="text-slate-500">Auth: {api.authMethod}</span>
                  </div>

                  <p className="text-xs text-slate-300">{api.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
                    <span>Chamadas (24h): {api.totalCalls24h.toLocaleString('pt-BR')}</span>
                    <span>Latência Média: {api.avgLatencyMs}ms</span>
                    <span>Taxa de Erro: {api.errorRatePercent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: EVENT BUS & DLQ */}
        {activeTab === 'eventbus' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-500/30 flex items-center justify-between">
              <div className="text-xs text-amber-300">
                <span className="font-bold">Dead Letter Queue (DLQ):</span> {dlqMessages.length} mensagem(ns) com falha aguardando reprocessamento.
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Últimos Eventos Publicados no Barramento</h4>
              {eventMessages.length === 0 ? (
                <div className="text-center text-slate-500 py-12 text-sm">Nenhum evento no barramento recentemente.</div>
              ) : (
                eventMessages.map(msg => (
                  <div key={msg.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400">Tópico: {msg.topic}</span>
                      <span className="text-slate-500">{new Date(msg.timestamp).toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 text-xs font-mono text-slate-300">
                      {JSON.stringify(msg.payload)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CONECTORES INSTITUCIONAIS */}
        {activeTab === 'connectors' && (
          <div className="space-y-4">
            {/* Banner de Comunicação & Omnichannel Gateway */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-cyan-900/30 to-[#121624] border border-purple-500/30 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ACTG — Aura Communication & Teleattendance Gateway</h3>
                  <p className="text-xs text-slate-300">
                    Gerencie provedores de WhatsApp Business Cloud API, Google Meet, Microsoft Teams e canais omnichannel de atendimento.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/omnichannel-admin')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md"
              >
                Painel Canais ACTG <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectors.map(con => {
                const cat = CATEGORY_CONFIG[con.category];
                return (
                  <div key={con.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400">{con.code}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 font-semibold">
                          Saudável ({con.version})
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-bold text-white">{con.name}</div>
                        <div className={cn('text-xs font-medium mt-0.5', cat.color)}>{cat.label}</div>
                      </div>

                      <p className="text-xs text-slate-300">{con.description}</p>

                      {/* Lista de Comandos suportados */}
                      {con.commands && con.commands.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Terminal className="w-3 h-3 text-cyan-400" /> Comandos de Integração API
                          </span>
                          <div className="space-y-1">
                            {con.commands.map((cmd, idx) => (
                              <div key={idx} className="px-2.5 py-1 rounded-lg bg-black/40 text-[11px] font-mono text-cyan-300 border border-white/5">
                                {cmd}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Parâmetros e Credenciais Ativas */}
                      {con.configParams && (
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Key className="w-3 h-3 text-amber-400" /> Parâmetros de Integração ({Object.keys(con.configParams).length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(con.configParams).map(([key, val]) => (
                              <span key={key} className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20" title={`${key}: ${val}`}>
                                {key}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span className="truncate">Provedor: {con.provider}</span>
                      <button
                        onClick={() => {
                          setSelectedConnectorForConfig(con);
                          setConfigForm(con.configParams ?? {});
                          setNewParamKey('');
                          setNewParamVal('');
                        }}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                      >
                        <Settings className="w-3.5 h-3.5" /> Credenciais & Comandos
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: WEBHOOKS */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Webhooks Ativos ({webhooks.length})</span>
              <button onClick={() => setShowWebhookModal(true)} className="px-3 py-1.5 rounded-xl bg-cyan-600/20 text-cyan-400 text-xs font-semibold border border-cyan-500/30">
                + Novo Webhook
              </button>
            </div>
            {webhooks.map(wh => (
              <div key={wh.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white">{wh.name}</div>
                  <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-500/30">Ativo</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 text-xs font-mono text-slate-300">{wh.targetUrl}</div>
                <div className="text-xs text-slate-400 flex items-center gap-4 flex-wrap">
                  <span>Eventos: {wh.events.join(', ')}</span>
                  <span>Entregues (24h): {wh.delivered24h}</span>
                  <span>Falhas: {wh.failed24h}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: SINCRONIZAÇÃO DE DADOS */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            {syncJobs.map(job => (
              <div key={job.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white">{job.name}</div>
                  <button onClick={() => triggerSyncJob(job.id)} className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Executar Agora
                  </button>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <span>{job.sourceSystem}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{job.targetSystem}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-4 pt-2 border-t border-white/10">
                  <span>Modo: {job.syncMode}</span>
                  <span>Registros Processados: {job.recordsProcessed.toLocaleString('pt-BR')}</span>
                  <span>Conflito: {job.conflictResolutionStrategy}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 7: MONITORAMENTO & SLA */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">99.98%</div>
                <div className="text-xs text-slate-400 mt-1">Uptime Geral APIs (SLA)</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-cyan-400">14ms</div>
                <div className="text-xs text-slate-400 mt-1">Latência Média Global</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-purple-400">182 rps</div>
                <div className="text-xs text-slate-400 mt-1">Throughput Atual</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white">Métricas de Desempenho do Barramento (Últimos minutos)</h4>
              <div className="space-y-2">
                {metrics.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-black/40">
                    <span className="font-mono text-slate-400">{m.timestamp}</span>
                    <span className="text-cyan-400">{m.throughputRps} req/s</span>
                    <span className="text-slate-300">{m.latencyMs}ms latência</span>
                    <span className="text-emerald-400">{m.successCount} sucessos</span>
                    <span className="text-red-400">{m.errorCount} erros</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: AUDITORIA DE INTEGRAÇÕES */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            {auditLog.length === 0 ? (
              <div className="text-center text-slate-500 py-12 text-sm">Nenhum evento de integração registrado ainda.</div>
            ) : (
              auditLog.map(log => (
                <div key={log.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-cyan-400 mr-2">[{log.action}]</span>
                    <span className="text-slate-300">{log.description}</span>
                  </div>
                  <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modais */}
      <AnimatePresence>
        {showApiModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#121624] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-base font-bold text-white">Publicar Nova API no Gateway</h3>
              <form onSubmit={handlePublishApi} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nome da API</label>
                  <input type="text" required value={apiForm.name} onChange={e => setApiForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Endpoint de Destino</label>
                  <input type="text" required value={apiForm.endpoint} onChange={e => setApiForm(p => ({ ...p, endpoint: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500" placeholder="/api/v1/servico/recurso" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Protocolo</label>
                    <select value={apiForm.protocol} onChange={e => setApiForm(p => ({ ...p, protocol: e.target.value as IntegrationProtocol }))} className="w-full bg-[#121624] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500">
                      {Object.entries(PROTOCOL_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Autenticação</label>
                    <select value={apiForm.authMethod} onChange={e => setApiForm(p => ({ ...p, authMethod: e.target.value as ManagedAPI['authMethod'] }))} className="w-full bg-[#121624] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500">
                      <option value="OAuth2">OAuth 2.1</option><option value="JWT">JWT Token</option>
                      <option value="mTLS">mTLS Cert</option><option value="API_Key">API Key</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Descrição</label>
                  <textarea value={apiForm.description} onChange={e => setApiForm(p => ({ ...p, description: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500" rows={2} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowApiModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors">Publicar API</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal de Configuração de Credenciais do Conector */}
        {selectedConnectorForConfig && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#121624] border border-cyan-500/30 rounded-3xl p-6 max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedConnectorForConfig.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedConnectorForConfig.code} · {selectedConnectorForConfig.provider}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 font-mono">
                  {selectedConnectorForConfig.version}
                </span>
              </div>

              {/* Comandos do Conector */}
              {selectedConnectorForConfig.commands && selectedConnectorForConfig.commands.length > 0 && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-black/40 border border-white/5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Comandos de Integração Registrados
                  </h4>
                  <div className="space-y-1">
                    {selectedConnectorForConfig.commands.map((cmd, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs font-mono text-cyan-300">
                        {cmd}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulário de Parâmetros / Credenciais */}
              <form onSubmit={e => {
                e.preventDefault();
                const finalConfig = { ...configForm };
                if (newParamKey.trim()) {
                  finalConfig[newParamKey.trim()] = newParamVal.trim();
                }
                updateConnectorConfig(selectedConnectorForConfig.id, finalConfig);
                setSelectedConnectorForConfig(null);
              }} className="space-y-3 text-xs">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Parâmetros de Autenticação & Vault
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {Object.entries(configForm).map(([key, value]) => (
                    <div key={key} className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                        <span>{key}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = { ...configForm };
                            delete copy[key];
                            setConfigForm(copy);
                          }}
                          className="text-red-400 hover:text-red-300 text-[10px]"
                        >
                          Remover
                        </button>
                      </div>
                      <input
                        type="text"
                        value={value}
                        onChange={e => setConfigForm(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-cyan-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Adicionar Novo Parâmetro */}
                <div className="p-3 rounded-2xl bg-white/5 border border-dashed border-white/15 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">+ Adicionar Novo Parâmetro / Chave Vault</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="CHAVE (ex: API_KEY)"
                      value={newParamKey}
                      onChange={e => setNewParamKey(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="VALOR"
                      value={newParamVal}
                      onChange={e => setNewParamVal(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedConnectorForConfig(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" /> Salvar Credenciais
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
