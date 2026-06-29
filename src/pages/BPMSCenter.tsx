import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Settings,
  Plus,
  GitBranch,
  FileText,
  Sliders,
  BellRing,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Upload,
  UserCheck,
  Zap,
  TrendingUp,
  Cpu,
  Trash2,
  Copy,
  ChevronRight,
  Eye,
  Info,
  Calendar,
} from 'lucide-react';
import { useBPMS } from '../contexts/BPMSContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils';
import { BPMNNode, WorkflowDefinition, BusinessRule, DynamicForm, AutomationRule } from '../types/bpms';

type Tab = 'dashboard' | 'designer' | 'rules' | 'forms' | 'automations' | 'audit' | 'ia';

export function BPMSCenter() {
  const {
    workflows,
    instances,
    rules,
    forms,
    automations,
    suggestions,
    auditLogs,
    createWorkflow,
    updateWorkflow,
    publishWorkflow,
    archiveWorkflow,
    deleteWorkflow,
    startProcessInstance,
    completeTaskNode,
    triggerSystemEvent,
    saveRule,
    deleteRule,
    saveForm,
    deleteForm,
    toggleAutomation,
    saveAutomation,
    approveSuggestion,
    rejectSuggestion,
  } = useBPMS();

  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(workflows[0] || null);

  // Construtor Visual Estados
  const [selectedNode, setSelectedNode] = useState<BPMNNode | null>(null);

  // Estado para Criar/Editar Regra
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);

  // Estado para Criar/Editar Formulário
  const [editingForm, setEditingForm] = useState<DynamicForm | null>(null);

  // Métricas de Dashboard
  const metrics = useMemo(() => {
    const active = instances.filter(i => i.status === 'running').length;
    const completed = instances.filter(i => i.status === 'completed').length;
    const slaBreached = instances.filter(i => {
      if (i.status !== 'running') return false;
      return i.slaDeadline ? new Date() > new Date(i.slaDeadline) : false;
    }).length;
    const totalWfs = workflows.length;
    const activeRules = rules.length;
    const activeForms = forms.length;

    return { active, completed, slaBreached, totalWfs, activeRules, activeForms };
  }, [instances, workflows, rules, forms]);

  // Handler para simular disparo de evento
  const handleSimulateEvent = (eventName: string) => {
    triggerSystemEvent(eventName as any, { name: 'Menor de Idade Simulação', age: 15, income: 1200 });
    alert(`Evento de sistema "${eventName}" simulado com sucesso. Verifique a aba de instâncias no Dashboard!`);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">BPMS & Workflow Engine</h1>
              <p className="text-sm text-slate-500">Modelagem, automação e orquestração institucional</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">
              <Zap className="w-3.5 h-3.5" />
              Low-Code Activo
            </div>
            <button
              onClick={() => handleSimulateEvent('new_registration')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all shadow-sm"
            >
              <Play className="w-4 h-4" />
              Simular Evento Cadastro
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-8 shrink-0">
        <nav className="flex gap-1 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Monitoramento', icon: Activity },
            { id: 'designer', label: 'Designer Visual', icon: GitBranch },
            { id: 'rules', label: 'Rules Engine', icon: Sliders },
            { id: 'forms', label: 'Formulários Dinâmicos', icon: FileText },
            { id: 'automations', label: 'Central de Automações', icon: BellRing },
            { id: 'ia', label: 'IA Otimizador', icon: Cpu, badge: suggestions.filter(s => s.status === 'pending').length },
            { id: 'audit', label: 'Rastreabilidade', icon: Info },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200',
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-700 bg-teal-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 ? (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold ml-1">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          
          {/* ===== TAB DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Metricas */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Processos Ativos', value: metrics.active, icon: Play, color: 'text-teal-600', bg: 'bg-teal-50' },
                  { label: 'SLA Estourados', value: metrics.slaBreached, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { label: 'Processos Concluídos', value: metrics.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Workflows Publicados', value: metrics.totalWfs, icon: GitBranch, color: 'text-slate-600', bg: 'bg-slate-100' },
                  { label: 'Regras de Negócio', value: metrics.activeRules, icon: Sliders, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Formulários Dinâmicos', value: metrics.activeForms, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((item, idx) => (
                  <div key={idx} className={cn('rounded-2xl p-4 border border-slate-200/60 shadow-sm bg-white', item.bg)}>
                    <div className="flex items-center justify-between mb-2">
                      <item.icon className={cn('w-5 h-5', item.color)} />
                    </div>
                    <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabela de Instâncias em Execução */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Instâncias em Execução</h3>
                    <p className="text-xs text-slate-400">Orquestração em tempo real de tarefas e SLAs</p>
                  </div>
                  <button className="text-xs text-teal-600 font-semibold hover:underline">Ver todas</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {instances.map(inst => {
                    const isOverdue = inst.slaDeadline ? new Date() > new Date(inst.slaDeadline) : false;
                    return (
                      <div key={inst.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{inst.workflowName}</span>
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">v{inst.workflowVersion}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">ID da Instância: <span className="font-mono">{inst.id}</span> · Iniciado em: {new Date(inst.startedAt).toLocaleString('pt-BR')}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Etapa Atual</p>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mt-0.5">
                              {inst.currentNodeLabel}
                            </span>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-slate-400">SLA/Prazo</p>
                            {inst.status === 'completed' ? (
                              <span className="text-xs text-emerald-600 font-medium">Finalizado</span>
                            ) : isOverdue ? (
                              <span className="text-xs text-rose-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Atrasado</span>
                            ) : inst.slaDeadline ? (
                              <span className="text-xs text-slate-600 font-medium">{new Date(inst.slaDeadline).toLocaleTimeString('pt-BR')}</span>
                            ) : (
                              <span className="text-xs text-slate-400">Sem SLA</span>
                            )}
                          </div>

                          {inst.status === 'running' && (
                            <button
                              onClick={() => completeTaskNode(inst.id, 'aprovado')}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              Avançar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== TAB DESIGNER VISUAL ===== */}
          {activeTab === 'designer' && (
            <motion.div
              key="designer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px] overflow-hidden"
            >
              {/* Seleção de Fluxo e Propriedades */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col space-y-4 overflow-y-auto">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Catálogo de Processos</label>
                  <select
                    value={selectedWorkflow?.id}
                    onChange={e => setSelectedWorkflow(workflows.find(w => w.id === e.target.value) || null)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white text-slate-700"
                  >
                    {workflows.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-slate-500 uppercase">Propriedades Gerais</p>
                  <div className="mt-2 space-y-2 text-xs text-slate-600">
                    <p><span className="font-semibold">Versão:</span> {selectedWorkflow?.version}</p>
                    <p><span className="font-semibold">Status:</span> {selectedWorkflow?.status === 'published' ? 'Publicado' : 'Rascunho'}</p>
                    <p><span className="font-semibold">Autor:</span> {selectedWorkflow?.author}</p>
                    <p className="text-slate-400 mt-1 italic">{selectedWorkflow?.description}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                  <button
                    onClick={() => selectedWorkflow && publishWorkflow(selectedWorkflow.id)}
                    className="w-full py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-500 transition-colors shadow-sm"
                  >
                    Publicar Versão
                  </button>
                  <button
                    onClick={() => selectedWorkflow && archiveWorkflow(selectedWorkflow.id)}
                    className="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    Desativar / Arquivar
                  </button>
                </div>

                {/* Caixa de Ferramentas Drag & Drop BPMN */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Adicionar Elementos BPMN 2.0</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'start', label: 'Início', bg: 'bg-emerald-50 text-emerald-700' },
                      { type: 'end', label: 'Fim', bg: 'bg-red-50 text-red-700' },
                      { type: 'task', label: 'Tarefa Humana', bg: 'bg-blue-50 text-blue-700' },
                      { type: 'approval', label: 'Aprovação', bg: 'bg-indigo-50 text-indigo-700' },
                      { type: 'condition', label: 'Decisão Regra', bg: 'bg-amber-50 text-amber-700' },
                      { type: 'notification', label: 'Notificação', bg: 'bg-sky-50 text-sky-700' },
                      { type: 'api_call', label: 'Chamada API', bg: 'bg-slate-100 text-slate-700' },
                    ].map(el => (
                      <div
                        key={el.type}
                        className={cn('p-2 rounded-lg text-center cursor-grab text-[11px] font-semibold border border-transparent hover:border-slate-300 transition-all active:scale-95', el.bg)}
                        draggable
                      >
                        {el.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Canvas do Designer Visul BPMN */}
              <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 relative overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-2 flex items-center justify-between text-xs text-slate-500 shrink-0">
                  <span>Canvas BPMN 2.0 — Arraste elementos da esquerda para o canvas</span>
                  <div className="flex gap-2">
                    <button className="hover:underline">Visualizar XML</button>
                    <span>|</span>
                    <button className="hover:underline">Exportar BPMN</button>
                  </div>
                </div>
                
                {/* Área interativa do Canvas */}
                <div className="flex-1 bg-slate-900 relative p-6 overflow-auto">
                  <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid-canvas" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-canvas)" />
                  </svg>

                  {/* Desenhar conexões (Edges) */}
                  {selectedWorkflow?.edges.map(edge => {
                    const src = selectedWorkflow.nodes.find(n => n.id === edge.source);
                    const tgt = selectedWorkflow.nodes.find(n => n.id === edge.target);
                    if (!src || !tgt) return null;
                    return (
                      <div
                        key={edge.id}
                        className="absolute pointer-events-none"
                        style={{
                          left: `${Math.min(src.x, tgt.x) + 40}px`,
                          top: `${Math.min(src.y, tgt.y) + 20}px`,
                          width: `${Math.abs(src.x - tgt.x)}px`,
                          height: `${Math.abs(src.y - tgt.y) + 4}px`,
                        }}
                      >
                        <svg className="w-full h-full overflow-visible">
                          <line
                            x1={src.x < tgt.x ? 0 : Math.abs(src.x - tgt.x)}
                            y1={src.y < tgt.y ? 0 : Math.abs(src.y - tgt.y)}
                            x2={src.x < tgt.x ? Math.abs(src.x - tgt.x) : 0}
                            y2={src.y < tgt.y ? Math.abs(src.y - tgt.y) : 0}
                            stroke="#5c6b73"
                            strokeWidth="2.5"
                            strokeDasharray={edge.conditionValue ? '4' : '0'}
                          />
                        </svg>
                        {edge.conditionValue && (
                          <span
                            className="absolute bg-slate-800 text-[9px] text-teal-400 border border-teal-500/20 px-1 py-0.5 rounded font-mono shadow-md"
                            style={{
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                            }}
                          >
                            {edge.conditionValue}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Renderizar Nós BPMN */}
                  {selectedWorkflow?.nodes.map(node => {
                    const isSel = selectedNode?.id === node.id;
                    const colors = {
                      start: 'border-emerald-500 bg-emerald-950 text-emerald-300',
                      end: 'border-red-500 bg-red-950 text-red-300',
                      condition: 'border-amber-500 bg-amber-950 text-amber-300 rounded-[10px] rotate-45',
                      task: 'border-blue-500 bg-blue-950 text-blue-300',
                      approval: 'border-indigo-500 bg-indigo-950 text-indigo-300',
                      notification: 'border-sky-500 bg-sky-950 text-sky-300',
                      api_call: 'border-slate-500 bg-slate-900 text-slate-300',
                      delay: 'border-zinc-500 bg-zinc-900 text-zinc-300',
                    }[node.type] || 'border-slate-200 bg-white text-slate-700';

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={cn(
                          'absolute cursor-pointer flex items-center justify-center text-center p-3 text-[11px] font-bold border-2 shadow-lg transition-all duration-150',
                          node.type === 'condition' ? 'w-24 h-24' : 'w-32 h-14 rounded-2xl',
                          isSel ? 'ring-2 ring-teal-400 scale-105' : 'hover:scale-[1.02]',
                          colors
                        )}
                        style={{ left: `${node.x}px`, top: `${node.y}px` }}
                      >
                        <div className={cn(node.type === 'condition' && '-rotate-45')}>
                          <p>{node.label}</p>
                          {node.config.slaMinutes && (
                            <span className="text-[8px] opacity-70 block mt-0.5">{node.config.slaMinutes}m SLA</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detalhes do Nó Selecionado */}
                {selectedNode && (
                  <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase">Configuração do Nó: <span className="text-slate-800">{selectedNode.label}</span></h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedNode.id} · Tipo: {selectedNode.type}</p>
                    </div>
                    <div className="flex gap-4">
                      {selectedNode.config.slaMinutes !== undefined && (
                        <div>
                          <label className="text-[9px] font-semibold text-slate-400 uppercase block">Tempo de SLA (minutos)</label>
                          <input
                            type="number"
                            value={selectedNode.config.slaMinutes}
                            onChange={e => {
                              const minutes = Number(e.target.value);
                              setSelectedWorkflow(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  nodes: prev.nodes.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, slaMinutes: minutes } } : n)
                                };
                              });
                              setSelectedNode(prev => prev ? { ...prev, config: { ...prev.config, slaMinutes: minutes } } : null);
                            }}
                            className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </div>
                      )}
                      
                      {selectedNode.config.assigneeRole !== undefined && (
                        <div>
                          <label className="text-[9px] font-semibold text-slate-400 uppercase block">Responsável (Perfil)</label>
                          <select
                            value={selectedNode.config.assigneeRole}
                            onChange={e => {
                              const role = e.target.value;
                              setSelectedWorkflow(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  nodes: prev.nodes.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, assigneeRole: role } } : n)
                                };
                              });
                              setSelectedNode(prev => prev ? { ...prev, config: { ...prev.config, assigneeRole: role } } : null);
                            }}
                            className="w-32 rounded border border-slate-200 px-2 py-1 text-xs"
                          >
                            <option value="coordinator">Coordenador</option>
                            <option value="professional">Profissional Técnico</option>
                            <option value="manager">Gestor</option>
                            <option value="director">Diretor</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== TAB RULES ENGINE ===== */}
          {activeTab === 'rules' && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Configuração de Regras de Negócio (Rules Engine)</h2>
                  <p className="text-sm text-slate-500">Defina regras lógicas combinadas sem necessidade de alteração de código</p>
                </div>
                <button
                  onClick={() => setEditingRule({ id: `rule-${Date.now()}`, name: '', description: '', logicalOperator: 'AND', conditions: [{ field: '', operator: 'equals', value: '' }], thenNodeId: '', elseNodeId: '' })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nova Regra
                </button>
              </div>

              {/* Lista de Regras */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rules.map(rule => (
                  <div key={rule.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{rule.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{rule.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/40">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Condições ({rule.logicalOperator})</p>
                      <div className="space-y-2">
                        {rule.conditions.map((cond, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-mono text-slate-700 bg-white border border-slate-100 p-2 rounded-lg shadow-sm">
                            <span className="font-semibold text-teal-600">{cond.field}</span>
                            <span className="text-slate-400">{cond.operator.replace('_', ' ')}</span>
                            <span className="font-semibold text-slate-800">"{String(cond.value)}"</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                        <p className="text-[10px] text-emerald-600 uppercase font-bold">Se Verdadeiro (Then)</p>
                        <p className="font-semibold text-emerald-800 mt-1">Ir para nó: {rule.thenNodeId}</p>
                      </div>
                      <div className="bg-red-50/50 border border-red-100 rounded-xl p-3">
                        <p className="text-[10px] text-rose-600 uppercase font-bold">Se Falso (Else)</p>
                        <p className="font-semibold text-rose-800 mt-1">Ir para nó: {rule.elseNodeId}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal de Criação / Edição de Regra */}
              {editingRule && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-3xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Salvar Regra de Negócio</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Nome da Regra</label>
                        <input
                          type="text"
                          value={editingRule.name}
                          onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                          placeholder="Ex: Alerta de Menor de Idade"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Descrição</label>
                        <textarea
                          value={editingRule.description}
                          onChange={e => setEditingRule({ ...editingRule, description: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-sm h-16"
                        />
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-600 uppercase">Condições</label>
                          <select
                            value={editingRule.logicalOperator}
                            onChange={e => setEditingRule({ ...editingRule, logicalOperator: e.target.value as 'AND' | 'OR' })}
                            className="text-xs rounded border border-slate-200 px-2 py-1"
                          >
                            <option value="AND">Requer TODAS as condições (AND)</option>
                            <option value="OR">Requer QUALQUER condição (OR)</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          {editingRule.conditions.map((cond, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <input
                                type="text"
                                value={cond.field}
                                onChange={e => {
                                  const list = [...editingRule.conditions];
                                  list[idx].field = e.target.value;
                                  setEditingRule({ ...editingRule, conditions: list });
                                }}
                                placeholder="Campo (ex: beneficiary.age)"
                                className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-xs font-mono"
                              />
                              <select
                                value={cond.operator}
                                onChange={e => {
                                  const list = [...editingRule.conditions];
                                  list[idx].operator = e.target.value as any;
                                  setEditingRule({ ...editingRule, conditions: list });
                                }}
                                className="rounded border border-slate-200 px-2 py-1.5 text-xs"
                              >
                                <option value="equals">Igual</option>
                                <option value="greater_than">Maior que</option>
                                <option value="less_than">Menor que</option>
                                <option value="contains">Contém</option>
                                <option value="is_true">Verdadeiro</option>
                                <option value="is_false">Falso</option>
                              </select>
                              <input
                                type="text"
                                value={String(cond.value)}
                                onChange={e => {
                                  const list = [...editingRule.conditions];
                                  list[idx].value = e.target.value;
                                  setEditingRule({ ...editingRule, conditions: list });
                                }}
                                placeholder="Valor"
                                className="w-24 rounded border border-slate-200 px-2 py-1.5 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Destino Se Verdadeiro (ID do Nó)</label>
                          <input
                            type="text"
                            value={editingRule.thenNodeId}
                            onChange={e => setEditingRule({ ...editingRule, thenNodeId: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Destino Se Falso (ID do Nó)</label>
                          <input
                            type="text"
                            value={editingRule.elseNodeId}
                            onChange={e => setEditingRule({ ...editingRule, elseNodeId: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                      <button
                        onClick={() => { saveRule(editingRule); setEditingRule(null); }}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold"
                      >
                        Salvar Regra
                      </button>
                      <button
                        onClick={() => setEditingRule(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== TAB FORMULÁRIOS DINÂMICOS ===== */}
          {activeTab === 'forms' && (
            <motion.div
              key="forms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Construtor de Formulários Dinâmicos</h2>
                  <p className="text-sm text-slate-500">Crie campos condicionais e reutilizáveis anexáveis a qualquer nó de tarefa no designer</p>
                </div>
                <button
                  onClick={() => setEditingForm({ id: `form-${Date.now()}`, name: '', description: '', fields: [], createdAt: new Date().toISOString() })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Novo Formulário
                </button>
              </div>

              {/* Lista de Formulários */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {forms.map(form => (
                  <div key={form.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{form.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{form.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingForm(form)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteForm(form.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Estrutura de Campos ({form.fields.length})</p>
                      <div className="space-y-2">
                        {form.fields.map((field, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                            <div>
                              <span className="font-semibold text-slate-800">{field.label}</span>
                              {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                            </div>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">{field.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Construtor de Formulários */}
              {editingForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-3xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Salvar Estrutura de Formulário</h3>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Nome do Formulário</label>
                        <input
                          type="text"
                          value={editingForm.name}
                          onChange={e => setEditingForm({ ...editingForm, name: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Descrição</label>
                        <textarea
                          value={editingForm.description}
                          onChange={e => setEditingForm({ ...editingForm, description: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-sm h-16"
                        />
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-600 uppercase">Campos do Formulário</label>
                          <button
                            type="button"
                            onClick={() => {
                              const list = [...editingForm.fields, { id: `field-${Date.now()}`, label: '', type: 'text' as const, required: true }];
                              setEditingForm({ ...editingForm, fields: list });
                            }}
                            className="text-xs text-teal-600 font-semibold hover:underline"
                          >
                            + Adicionar Campo
                          </button>
                        </div>

                        <div className="space-y-3">
                          {editingForm.fields.map((field, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-150 relative">
                              <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={field.label}
                                    onChange={e => {
                                      const list = [...editingForm.fields];
                                      list[idx].label = e.target.value;
                                      setEditingForm({ ...editingForm, fields: list });
                                    }}
                                    placeholder="Rótulo do Campo (ex: CPF do Tutor)"
                                    className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                                  />
                                  <select
                                    value={field.type}
                                    onChange={e => {
                                      const list = [...editingForm.fields];
                                      list[idx].type = e.target.value as any;
                                      setEditingForm({ ...editingForm, fields: list });
                                    }}
                                    className="rounded border border-slate-200 px-2 py-1 text-xs"
                                  >
                                    <option value="text">Texto Simples</option>
                                    <option value="number">Número</option>
                                    <option value="cpf">CPF</option>
                                    <option value="phone">Telefone</option>
                                    <option value="email">E-mail</option>
                                    <option value="date">Data</option>
                                    <option value="select">Lista de Seleção</option>
                                    <option value="file">Envio de Arquivo</option>
                                  </select>
                                </div>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={e => {
                                      const list = [...editingForm.fields];
                                      list[idx].required = e.target.checked;
                                      setEditingForm({ ...editingForm, fields: list });
                                    }}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600"
                                  />
                                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Obrigatoriedade</span>
                                </label>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const list = editingForm.fields.filter((_, i) => i !== idx);
                                  setEditingForm({ ...editingForm, fields: list });
                                }}
                                className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                      <button
                        onClick={() => { saveForm(editingForm); setEditingForm(null); }}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold"
                      >
                        Salvar Formulário
                      </button>
                      <button
                        onClick={() => setEditingForm(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== TAB AUTOMAÇÕES ===== */}
          {activeTab === 'automations' && (
            <motion.div
              key="automations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">Central de Automações</h2>
                <p className="text-sm text-slate-500">Configure ações automáticas a partir de gatilhos do sistema</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {automations.map(auto => (
                  <div key={auto.id} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{auto.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Gatilho: <span className="font-mono">{auto.trigger}</span> · Ação: <span className="font-mono">{auto.actionType}</span></p>
                        {auto.actionConfig.payloadUrl && <p className="text-[10px] text-slate-500 font-mono mt-1 break-all bg-slate-50 p-1.5 rounded">{auto.actionConfig.payloadUrl}</p>}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleAutomation(auto.id)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
                        auto.active ? 'bg-teal-500' : 'bg-slate-250'
                      )}
                    >
                      <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-250', auto.active ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== TAB AUDITORIA (RASTREAMENTO) ===== */}
          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Rastreabilidade & Logs BPM</h2>
                  <p className="text-sm text-slate-500">Histórico de execução de todas as tarefas e auditoria imutável do sistema</p>
                </div>
                <button className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50">
                  <Download className="w-3.5 h-3.5" /> Exportar CSV
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Horário</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Operador</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Ação</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Detalhes</th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-slate-400 uppercase">ID Processo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                        <td className="px-5 py-3 text-slate-700 font-semibold">{log.userName}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] uppercase">
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{log.details}</td>
                        <td className="px-5 py-3 text-right font-mono text-slate-400">{log.workflowId || log.instanceId || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ===== TAB IA OTIMIZADOR ===== */}
          {activeTab === 'ia' && (
            <motion.div
              key="ia"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">Inteligência Artificial Otimizadora de Processos</h2>
                <p className="text-sm text-slate-500">
                  Análise autônoma de fluxos para sugerir simplificações e prever gargalos. A IA nunca altera processos sem autorização prévia.
                </p>
              </div>

              <div className="space-y-4">
                {suggestions.map(sug => (
                  <div
                    key={sug.id}
                    className={cn(
                      'border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all bg-white',
                      sug.status === 'approved' ? 'border-emerald-200 bg-emerald-50/10' :
                        sug.status === 'rejected' ? 'border-slate-200 opacity-60' : 'border-amber-200'
                    )}
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{sug.workflowName}</span>
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-md uppercase',
                          sug.type === 'bottleneck' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {sug.type === 'bottleneck' ? 'Gargalo Detectado' : 'Redundância Identificada'}
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">
                          Impacto: {sug.impactScore}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium">{sug.description}</p>
                      
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Mudança Proposta</p>
                        <p className="text-xs text-slate-700 mt-1 font-medium">{sug.proposedChange}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex md:flex-col gap-2 justify-end">
                      {sug.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => approveSuggestion(sug.id)}
                            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-500 transition-colors shadow-sm"
                          >
                            Aprovar & Aplicar
                          </button>
                          <button
                            onClick={() => rejectSuggestion(sug.id)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                          >
                            Recusar
                          </button>
                        </>
                      ) : (
                        <span className={cn(
                          'text-xs font-bold px-3 py-1 rounded-full text-center',
                          sug.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        )}>
                          {sug.status === 'approved' ? 'Aprovada e Aplicada' : 'Rejeitada'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
