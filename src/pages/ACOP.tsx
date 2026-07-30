import React, { useState } from 'react';
import {
  Bot, Network, Brain, BookOpen, BarChart3, Cpu, Activity, ShieldCheck,
  Check, Clock, AlertTriangle, Play, RefreshCw, ChevronUp, ChevronDown,
  Minus, GitBranch, Zap, CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '../utils';
import { useACOP } from '../contexts/ACOPContext';
import type { SpecializedAgent, CognitiveTask, ManagedModel, CognitiveMemoryEntry } from '../types/acop';

// ─── Utilities ────────────────────────────────────────────────────────────────

const AGENT_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  idle:                    { label: 'Disponível',         color: 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30', dot: 'bg-emerald-400' },
  processing:              { label: 'Processando',        color: 'text-violet-400 bg-violet-900/30 border-violet-500/30',    dot: 'bg-violet-400 animate-pulse' },
  awaiting_human:          { label: 'Aguarda Humano',     color: 'text-amber-400 bg-amber-900/30 border-amber-500/30',       dot: 'bg-amber-400 animate-pulse' },
  error:                   { label: 'Erro',               color: 'text-red-400 bg-red-900/30 border-red-500/30',             dot: 'bg-red-400' },
  offline:                 { label: 'Offline',            color: 'text-slate-500 bg-slate-900/30 border-slate-600/30',       dot: 'bg-slate-500' },
};

const TASK_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  queued:                     { label: 'Na Fila',              color: 'text-slate-400 bg-slate-900/30 border-slate-600/30' },
  routing:                    { label: 'Roteando',             color: 'text-sky-400 bg-sky-900/30 border-sky-500/30' },
  processing:                 { label: 'Processando',          color: 'text-violet-400 bg-violet-900/30 border-violet-500/30' },
  awaiting_human_validation:  { label: 'Aguarda Validação',    color: 'text-amber-400 bg-amber-900/30 border-amber-500/30' },
  completed:                  { label: 'Concluída',            color: 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30' },
  failed:                     { label: 'Falhou',               color: 'text-red-400 bg-red-900/30 border-red-500/30' },
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-400 bg-red-900/30 border-red-500/30',
  high:     'text-orange-400 bg-orange-900/30 border-orange-500/30',
  medium:   'text-yellow-400 bg-yellow-900/30 border-yellow-500/30',
  low:      'text-teal-400 bg-teal-900/30 border-teal-500/30',
};

const MODEL_PHASE_COLOR: Record<string, string> = {
  production:  'text-emerald-400 bg-emerald-900/30 border-emerald-500/30',
  monitoring:  'text-amber-400 bg-amber-900/30 border-amber-500/30',
  staging:     'text-sky-400 bg-sky-900/30 border-sky-500/30',
  training:    'text-violet-400 bg-violet-900/30 border-violet-500/30',
  validation:  'text-teal-400 bg-teal-900/30 border-teal-500/30',
  registered:  'text-slate-400 bg-slate-900/30 border-slate-600/30',
  deprecated:  'text-orange-400 bg-orange-900/30 border-orange-500/30',
  retired:     'text-red-400 bg-red-900/30 border-red-500/30',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: SpecializedAgent }) {
  const cfg = AGENT_STATUS_CONFIG[agent.status];
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', cfg.dot)} />
          <span className="text-sm font-bold text-white">{agent.name}</span>
        </div>
        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0', cfg.color)}>{cfg.label}</span>
      </div>
      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{agent.domainLabel}</div>
      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
        <div className="p-1.5 rounded-lg bg-black/30">
          <div className="font-bold text-emerald-400">{agent.tasksCompleted.toLocaleString('pt-BR')}</div>
          <div className="text-[9px] text-slate-500">Concluídas</div>
        </div>
        <div className="p-1.5 rounded-lg bg-black/30">
          <div className="font-bold text-amber-400">{agent.tasksInQueue}</div>
          <div className="text-[9px] text-slate-500">Na Fila</div>
        </div>
        <div className="p-1.5 rounded-lg bg-black/30">
          <div className="font-bold text-violet-400">{agent.accuracyPercent}%</div>
          <div className="text-[9px] text-slate-500">Acurácia</div>
        </div>
      </div>
      <div className="text-[10px] text-slate-500">Latência média: <span className="text-slate-300">{agent.avgResponseMs}ms</span></div>
    </div>
  );
}

function TaskCard({ task, onValidate }: { task: CognitiveTask; onValidate: (id: string) => void }) {
  const statusCfg = TASK_STATUS_CONFIG[task.status];
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-white">{task.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">Solicitante: {task.requestedBy}</div>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', statusCfg.color)}>{statusCfg.label}</span>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', PRIORITY_COLOR[task.priority])}>{task.priority.toUpperCase()}</span>
        </div>
      </div>

      {task.assignedAgentName && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Bot className="w-3 h-3 text-violet-400" />
          <span>Agente: <span className="text-violet-300 font-semibold">{task.assignedAgentName}</span></span>
        </div>
      )}

      {task.result && (
        <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-200">{task.result}</div>
      )}

      {task.evidences.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.evidences.map(e => (
            <span key={e} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-slate-400">{e}</span>
          ))}
        </div>
      )}

      {task.status === 'awaiting_human_validation' && (
        <button onClick={() => onValidate(task.id)} className="w-full py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors">
          <Check className="w-3.5 h-3.5 inline mr-1.5" /> Validar e Concluir
        </button>
      )}
      {task.status === 'completed' && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> Validado por: {task.validatedBy}
        </div>
      )}
    </div>
  );
}

function ModelLifecycleCard({ model, onRetire, onPromote, onRetrain }: {
  model: ManagedModel;
  onRetire: (id: string) => void;
  onPromote: (id: string) => void;
  onRetrain: (id: string) => void;
}) {
  return (
    <div className={cn('p-5 rounded-2xl bg-white/5 border space-y-3', model.alert ? 'border-amber-500/40' : 'border-white/10')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-white">{model.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{model.domain} · {model.version}</div>
        </div>
        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0', MODEL_PHASE_COLOR[model.phase])}>
          {model.phase.toUpperCase()}
        </span>
      </div>

      {model.alert && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-900/30 border border-amber-500/30 text-xs text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {model.alertMessage}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-black/30">
          <div className="font-bold text-emerald-400">{model.accuracyPercent}%</div>
          <div className="text-[9px] text-slate-500">Acurácia</div>
        </div>
        <div className="p-2 rounded-xl bg-black/30">
          <div className={cn('font-bold', model.driftScore > 0.15 ? 'text-red-400' : 'text-teal-400')}>
            {(model.driftScore * 100).toFixed(0)}%
          </div>
          <div className="text-[9px] text-slate-500">Drift</div>
        </div>
        <div className="p-2 rounded-xl bg-black/30">
          <div className="font-bold text-sky-400">{model.latencyMs}ms</div>
          <div className="text-[9px] text-slate-500">Latência</div>
        </div>
        <div className="p-2 rounded-xl bg-black/30">
          <div className="font-bold text-violet-400">{model.callsThisMonth.toLocaleString('pt-BR')}</div>
          <div className="text-[9px] text-slate-500">Chamadas/Mês</div>
        </div>
      </div>

      <div className="flex gap-1.5">
        {model.phase === 'staging' && (
          <button onClick={() => onPromote(model.id)} className="flex-1 py-1.5 bg-emerald-600/70 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors">Promover</button>
        )}
        <button onClick={() => onRetrain(model.id)} className="flex-1 py-1.5 bg-violet-600/40 hover:bg-violet-600/60 text-violet-300 text-xs font-semibold rounded-lg transition-colors">
          <RefreshCw className="w-3 h-3 inline mr-1" /> Retreinar
        </button>
        {model.phase === 'production' && (
          <button onClick={() => onRetire(model.id)} className="py-1.5 px-3 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold rounded-lg transition-colors">Aposentar</button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ACOP() {
  const {
    agents, tasks, reasonings, cognitiveMemory, managedModels, performanceMetrics, auditLog,
    validateTask, runReasoning, retireModel, promoteModel, forceRetrain
  } = useACOP();

  const [activeTab, setActiveTab] = useState<
    'orchestrator' | 'agents' | 'tasks' | 'reasoning' | 'memory' | 'model_lifecycle' | 'performance' | 'audit'
  >('orchestrator');

  const [reasoningQuery, setReasoningQuery] = useState('');

  const processingAgents = agents.filter(a => a.status === 'processing').length;
  const awaitingHuman = tasks.filter(t => t.status === 'awaiting_human_validation').length;
  const alertModels = managedModels.filter(m => m.alert).length;
  const totalTasksActive = tasks.filter(t => t.status !== 'completed' && t.status !== 'failed').length;

  const tabs = [
    { id: 'orchestrator',    label: 'Orquestrador Cognitivo',   icon: Network },
    { id: 'agents',          label: 'Agentes Especializados',    icon: Bot },
    { id: 'tasks',           label: 'Tarefas Cognitivas',        icon: Cpu },
    { id: 'reasoning',       label: 'Motor de Raciocínio',       icon: Brain },
    { id: 'memory',          label: 'Memória Cognitiva',         icon: BookOpen },
    { id: 'model_lifecycle', label: 'Ciclo de Vida de Modelos',  icon: GitBranch },
    { id: 'performance',     label: 'Performance & Monitoring',  icon: BarChart3 },
    { id: 'audit',           label: 'Auditoria Cognitiva',       icon: ShieldCheck },
  ] as const;

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#050811] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/10 bg-[#0c1222]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <Network className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">ACOP — Prompt 152</h1>
              <span className="px-2 py-0.5 rounded text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-500/30 font-bold">Fase III — Ecossistema Cognitivo</span>
              {awaitingHuman > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/50 text-amber-400 border border-amber-500/30">
                  {awaitingHuman} AGUARDAM VALIDAÇÃO
                </span>
              )}
              {alertModels > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/50 text-red-400 border border-red-500/30">
                  {alertModels} ALERTA{alertModels > 1 ? 'S' : ''} MODELO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Cognitive Orchestration Platform, Multi-Agent Intelligence & Autonomous Decision Support</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="shrink-0 border-b border-white/10 bg-[#0c1222]/60 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all shrink-0',
                  isActive ? 'border-indigo-500 text-indigo-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                )}>
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'tasks' && awaitingHuman > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-600 text-white">{awaitingHuman}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── TAB 1: ORQUESTRADOR COGNITIVO ── */}
        {activeTab === 'orchestrator' && (
          <div className="space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-indigo-400">{agents.length}</div>
                <div className="text-xs text-slate-400 mt-1">Agentes Especializados</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-violet-400">{processingAgents}</div>
                <div className="text-xs text-slate-400 mt-1">Agentes Ativos Agora</div>
              </div>
              <div className={cn('p-4 rounded-2xl border', awaitingHuman > 0 ? 'bg-amber-900/20 border-amber-500/30' : 'bg-white/5 border-white/10')}>
                <div className={cn('text-2xl font-bold', awaitingHuman > 0 ? 'text-amber-400' : 'text-white')}>{awaitingHuman}</div>
                <div className="text-xs text-slate-400 mt-1">Aguardam Validação Humana</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">{totalTasksActive}</div>
                <div className="text-xs text-slate-400 mt-1">Tarefas Ativas</div>
              </div>
            </div>

            {/* Orchestration View */}
            <div className="p-5 rounded-2xl bg-white/5 border border-indigo-500/20 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" /> Mapa de Agentes — Orquestrador Cognitivo Central
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {agents.map(agent => {
                  const cfg = AGENT_STATUS_CONFIG[agent.status];
                  return (
                    <div key={agent.id} className={cn('p-3 rounded-xl border text-center space-y-1.5', agent.status !== 'idle' ? 'border-indigo-500/30 bg-indigo-900/10' : 'border-white/5 bg-white/5')}>
                      <div className={cn('w-2.5 h-2.5 rounded-full mx-auto', cfg.dot)} />
                      <div className="text-[10px] font-bold text-white leading-tight">{agent.domainLabel}</div>
                      <div className={cn('text-[9px] font-semibold', cfg.color.split(' ')[0])}>{cfg.label}</div>
                      {agent.tasksInQueue > 0 && <div className="text-[9px] text-slate-500">{agent.tasksInQueue} na fila</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Tasks (quick view) */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white">Tarefas em Andamento</h3>
              {tasks.filter(t => t.status !== 'completed' && t.status !== 'failed').map(task => {
                const sc = TASK_STATUS_CONFIG[task.status];
                return (
                  <div key={task.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 text-xs">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0', sc.color)}>{sc.label}</span>
                    <span className="text-white font-semibold">{task.title}</span>
                    {task.assignedAgentName && <span className="text-slate-400 ml-auto shrink-0">→ {task.assignedAgentName}</span>}
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border shrink-0', PRIORITY_COLOR[task.priority])}>{task.priority}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: AGENTES ESPECIALIZADOS ── */}
        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
          </div>
        )}

        {/* ── TAB 3: TAREFAS COGNITIVAS ── */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-400">
              O Orquestrador roteia tarefas automaticamente para o agente mais adequado considerando domínio, carga, prioridade e disponibilidade. Tarefas críticas exigem supervisão humana obrigatória.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} onValidate={id => validateTask(id, 'Supervisor Institucional')} />
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: MOTOR DE RACIOCÍNIO ── */}
        {activeTab === 'reasoning' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={reasoningQuery}
                onChange={e => setReasoningQuery(e.target.value)}
                placeholder="Digite uma pergunta institucional para o Motor de Raciocínio (ex: Quais são as causas da evasão?)..."
                className="flex-1 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={() => { if (reasoningQuery.trim()) { runReasoning(reasoningQuery); setReasoningQuery(''); } }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors">
                <Brain className="w-4 h-4" />
              </button>
            </div>

            {reasonings.map(r => (
              <div key={r.id} className="p-5 rounded-2xl bg-white/5 border border-indigo-500/20 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-indigo-300 italic">"{r.question}"</div>
                  <div className="shrink-0 text-xs font-bold text-emerald-400">{Math.round(r.confidenceScore * 100)}% confiança</div>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-200 leading-relaxed">{r.conclusion}</div>
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fontes e Evidências</div>
                  {r.traces.map((trace, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="text-xs font-semibold text-indigo-300 w-36 shrink-0">{trace.sourceLabel}</div>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${trace.weight * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-400 w-8 text-right">{Math.round(trace.weight * 100)}%</div>
                      <div className="text-xs text-slate-400 flex-1 hidden md:block">{trace.contribution}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500">Agentes envolvidos: {r.agentsInvolved.length} · Criado em: {new Date(r.createdAt).toLocaleString('pt-BR')}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 5: MEMÓRIA COGNITIVA ── */}
        {activeTab === 'memory' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-900/20 border border-indigo-500/30 text-xs text-indigo-300">
              A Memória Cognitiva Institucional armazena decisões, padrões, aprendizados e feedbacks para aprimorar continuamente as análises e recomendações dos agentes.
            </div>
            <div className="space-y-3">
              {cognitiveMemory.map(mem => (
                <div key={mem.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/40 text-indigo-400 border border-indigo-500/30">{mem.typeLabel}</span>
                      <span className="text-sm font-semibold text-white">{mem.summary.substring(0, 80)}...</span>
                    </div>
                    <span className="text-xs font-bold text-violet-400 shrink-0">{Math.round(mem.relevanceScore * 100)}% relevância</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Referenciada {mem.timesReferenced}x</span>
                    <span>·</span>
                    <span>Domínio: {mem.domain}</span>
                    <span>·</span>
                    <div className="flex gap-1">
                      {mem.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">#{t}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 6: CICLO DE VIDA DE MODELOS ── */}
        {activeTab === 'model_lifecycle' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              {['production', 'monitoring', 'staging', 'training', 'validation', 'deprecated', 'retired'].map(phase => (
                <div key={phase} className={cn('px-2.5 py-1 rounded-full border font-semibold', MODEL_PHASE_COLOR[phase])}>
                  {phase}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {managedModels.map(m => (
                <ModelLifecycleCard key={m.id} model={m} onRetire={retireModel} onPromote={promoteModel} onRetrain={forceRetrain} />
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 7: PERFORMANCE & MONITORING ── */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-separate border-spacing-0">
                <thead>
                  <tr>
                    {['Agente', 'Período', 'Tarefas', 'Latência Média', 'Acurácia', 'Override Humano', 'Satisfação', 'Drift'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {performanceMetrics.map((m, idx) => (
                    <tr key={m.agentId} className={cn('transition-colors', idx % 2 === 0 ? 'bg-white/3' : '')}>
                      <td className="px-3 py-2.5 font-semibold text-white">{m.agentName}</td>
                      <td className="px-3 py-2.5 text-slate-400">{m.period}</td>
                      <td className="px-3 py-2.5 text-slate-300">{m.tasksCompleted.toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-2.5 text-sky-400">{m.avgLatencyMs}ms</td>
                      <td className="px-3 py-2.5 text-emerald-400 font-bold">{m.accuracyPercent}%</td>
                      <td className="px-3 py-2.5 text-amber-400">{m.humanOverrideRate}%</td>
                      <td className="px-3 py-2.5 text-violet-400 font-bold">{m.satisfactionScore}/5</td>
                      <td className="px-3 py-2.5">
                        {m.drift
                          ? <span className="text-red-400 font-bold">⚠ Drift</span>
                          : <span className="text-emerald-400">Estável</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 8: AUDITORIA COGNITIVA ── */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-400">
              Log imutável de todos os eventos cognitivos da plataforma — 100% rastreável (LGPD + XAI + Zero Trust).
            </div>
            {auditLog.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">Nenhum evento cognitivo registrado ainda. Interaja com os agentes para gerar o log.</div>
            ) : (
              auditLog.map(entry => (
                <div key={entry.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3 text-xs">
                  <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/40 text-indigo-400 border border-indigo-500/20 shrink-0 max-w-36 text-center">{entry.action}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-200">{entry.description}</div>
                    <div className="text-slate-500 mt-0.5">{entry.actor} · {new Date(entry.timestamp).toLocaleString('pt-BR')} · hash:{entry.hash}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
