import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  WorkflowDefinition,
  ProcessInstance,
  DynamicForm,
  BusinessRule,
  AutomationRule,
  ProcessIASuggestion,
  BPMSAuditEvent,
  BPMNNode,
  BPMNEdge,
  ProcessHistoryStep,
} from '../types/bpms';
import {
  initialWorkflows,
  initialRules,
  initialForms,
  initialInstances,
  initialAutomations,
  initialIASuggestions,
  initialAuditLogs,
} from '../data/bpms-mock';
import { useAuth } from './AuthContext';

interface BPMSContextType {
  workflows: WorkflowDefinition[];
  instances: ProcessInstance[];
  rules: BusinessRule[];
  forms: DynamicForm[];
  automations: AutomationRule[];
  suggestions: ProcessIASuggestion[];
  auditLogs: BPMSAuditEvent[];
  
  // Workflows
  createWorkflow: (workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<WorkflowDefinition>;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => Promise<WorkflowDefinition>;
  publishWorkflow: (id: string) => Promise<void>;
  archiveWorkflow: (id: string) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;

  // Instâncias
  startProcessInstance: (workflowId: string, initialVariables: Record<string, any>) => Promise<ProcessInstance>;
  completeTaskNode: (instanceId: string, actionTaken?: string, comments?: string) => Promise<void>;
  triggerSystemEvent: (eventName: string, payload: Record<string, any>) => Promise<void>;

  // Regras
  saveRule: (rule: BusinessRule) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;

  // Formulários
  saveForm: (form: DynamicForm) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;

  // Automações
  toggleAutomation: (id: string) => Promise<void>;
  saveAutomation: (automation: AutomationRule) => Promise<void>;

  // IA
  approveSuggestion: (id: string) => Promise<void>;
  rejectSuggestion: (id: string) => Promise<void>;
}

const BPMSContext = createContext<BPMSContextType | null>(null);

export function BPMSProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(initialWorkflows);
  const [instances, setInstances] = useState<ProcessInstance[]>(initialInstances);
  const [rules, setRules] = useState<BusinessRule[]>(initialRules);
  const [forms, setForms] = useState<DynamicForm[]>(initialForms);
  const [automations, setAutomations] = useState<AutomationRule[]>(initialAutomations);
  const [suggestions, setSuggestions] = useState<ProcessIASuggestion[]>(initialIASuggestions);
  const [auditLogs, setAuditLogs] = useState<BPMSAuditEvent[]>(initialAuditLogs);

  // Auxiliar para Logs
  const addAudit = useCallback((action: BPMSAuditEvent['action'], details: string, wfId?: string, instId?: string) => {
    const newLog: BPMSAuditEvent = {
      id: `aud-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: user?.iamId ?? 'system',
      userName: user?.name ?? 'Sistema',
      action,
      workflowId: wfId,
      instanceId: instId,
      details,
      ipAddress: '127.0.0.1',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [user]);

  // ------------------------------------------------------------
  // WORKFLOW ENGINE
  // ------------------------------------------------------------

  const createWorkflow = useCallback(async (data: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<WorkflowDefinition> => {
    const newWf: WorkflowDefinition = {
      ...data,
      id: `wf-${Math.random().toString(36).substr(2, 9)}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkflows(prev => [newWf, ...prev]);
    addAudit('create_workflow', `Criou o fluxo administrativo "${newWf.name}"`, newWf.id);
    return newWf;
  }, [addAudit]);

  const updateWorkflow = useCallback(async (id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> => {
    let updatedWf: WorkflowDefinition | null = null;
    setWorkflows(prev =>
      prev.map(w => {
        if (w.id === id) {
          updatedWf = {
            ...w,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return updatedWf;
        }
        return w;
      })
    );
    if (updatedWf) {
      addAudit('create_workflow', `Atualizou metadados ou diagrama do fluxo "${(updatedWf as WorkflowDefinition).name}"`, id);
      return updatedWf;
    }
    throw new Error('Workflow não encontrado');
  }, [addAudit]);

  const publishWorkflow = useCallback(async (id: string): Promise<void> => {
    setWorkflows(prev =>
      prev.map(w => {
        if (w.id === id) {
          addAudit('publish_workflow', `Publicou nova versão operacional (${w.version + 1}) do fluxo "${w.name}"`, id);
          return {
            ...w,
            version: w.version + 1,
            status: 'published',
            publishedAt: new Date().toISOString(),
          };
        }
        return w;
      })
    );
  }, [addAudit]);

  const archiveWorkflow = useCallback(async (id: string): Promise<void> => {
    setWorkflows(prev =>
      prev.map(w => {
        if (w.id === id) {
          addAudit('publish_workflow', `Arquivou/Desativou o fluxo "${w.name}"`, id);
          return { ...w, status: 'archived' };
        }
        return w;
      })
    );
  }, [addAudit]);

  const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
    const found = workflows.find(w => w.id === id);
    if (found) {
      addAudit('publish_workflow', `Excluiu permanentemente a definição de fluxo "${found.name}"`, id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
    }
  }, [workflows, addAudit]);

  // ------------------------------------------------------------
  // PROCESS EXECUTION & RULES ENGINE
  // ------------------------------------------------------------

  const evaluateRule = useCallback((ruleId: string, variables: Record<string, any>): boolean => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return false;

    const results = rule.conditions.map(cond => {
      const varVal = variables[cond.field];
      if (varVal === undefined) return false;

      switch (cond.operator) {
        case 'equals': return String(varVal) === String(cond.value);
        case 'greater_than': return Number(varVal) > Number(cond.value);
        case 'less_than': return Number(varVal) < Number(cond.value);
        case 'contains': return String(varVal).includes(String(cond.value));
        case 'is_true': return varVal === true || String(varVal) === 'true';
        case 'is_false': return varVal === false || String(varVal) === 'false';
        default: return false;
      }
    });

    if (rule.logicalOperator === 'OR') {
      return results.some(r => r);
    }
    return results.every(r => r);
  }, [rules]);

  // Avança a instância de processo no grafo BPMN 2.0
  const advanceProcess = useCallback((inst: ProcessInstance, wfs: WorkflowDefinition[]): ProcessInstance => {
    const wf = wfs.find(w => w.id === inst.workflowId);
    if (!wf || inst.status === 'completed' || inst.status === 'failed') return inst;

    let currentNode = wf.nodes.find(n => n.id === inst.currentNodeId);
    if (!currentNode) return inst;

    // Achar conexões saindo deste nó
    let outgoingEdges = wf.edges.filter(e => e.source === inst.currentNodeId);

    if (outgoingEdges.length === 0) {
      // Se não há próximas conexões, encerra o processo no nó final
      return {
        ...inst,
        status: 'completed',
        endedAt: new Date().toISOString(),
        currentNodeLabel: 'Fim do Processo',
      };
    }

    let nextNodeId = outgoingEdges[0].target;

    // Se o nó atual for uma validação condicional ou decisão de regras
    if (currentNode.type === 'condition') {
      const ruleId = currentNode.config.ruleId;
      if (ruleId) {
        const isTrue = evaluateRule(ruleId, inst.variables);
        const matchEdge = outgoingEdges.find(e => e.conditionValue === String(isTrue));
        if (matchEdge) {
          nextNodeId = matchEdge.target;
        }
      }
    }

    const nextNode = wf.nodes.find(n => n.id === nextNodeId);
    if (!nextNode) return inst;

    // Cria o passo no histórico
    const step: ProcessHistoryStep = {
      id: `step-${Math.random().toString(36).substr(2, 9)}`,
      nodeId: currentNode.id,
      nodeLabel: currentNode.label,
      nodeType: currentNode.type,
      completedAt: new Date().toISOString(),
      executorName: user?.name ?? 'Motor de Processos',
      slaStatus: inst.slaDeadline && new Date() > new Date(inst.slaDeadline) ? 'breached' : 'met',
    };

    const newHistory = [...inst.history, step];
    
    // Calcula novo SLA se aplicável
    let newSlaDeadline: string | undefined = undefined;
    if (nextNode.config.slaMinutes) {
      newSlaDeadline = new Date(Date.now() + nextNode.config.slaMinutes * 60 * 1000).toISOString();
    }

    const updatedInstance: ProcessInstance = {
      ...inst,
      currentNodeId: nextNode.id,
      currentNodeLabel: nextNode.label,
      history: newHistory,
      slaDeadline: newSlaDeadline,
    };

    // Caso o próximo nó seja um passo automatizado (Notificação, API, etc.), ele executa e avança de novo
    if (nextNode.type === 'notification' || nextNode.type === 'api_call') {
      // Simula chamada de webhook ou email
      return advanceProcess(updatedInstance, wfs);
    }

    if (nextNode.type === 'end') {
      return {
        ...updatedInstance,
        status: 'completed',
        endedAt: new Date().toISOString(),
      };
    }

    return updatedInstance;
  }, [user, evaluateRule]);

  const startProcessInstance = useCallback(async (workflowId: string, initialVariables: Record<string, any>): Promise<ProcessInstance> => {
    const wf = workflows.find(w => w.id === workflowId);
    if (!wf) throw new Error('Fluxo não encontrado.');

    const startNode = wf.nodes.find(n => n.type === 'start');
    if (!startNode) throw new Error('Fluxo sem nó de início.');

    const newInst: ProcessInstance = {
      id: `inst-${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      workflowName: wf.name,
      workflowVersion: wf.version,
      status: 'running',
      startedAt: new Date().toISOString(),
      currentNodeId: startNode.id,
      currentNodeLabel: startNode.label,
      variables: initialVariables,
      history: [],
    };

    // Avança automaticamente do início para o próximo nó
    const processedInst = advanceProcess(newInst, workflows);
    
    setInstances(prev => [processedInst, ...prev]);
    addAudit('execute_workflow', `Iniciou a execução do processo "${wf.name}"`, workflowId, processedInst.id);
    
    return processedInst;
  }, [workflows, advanceProcess, addAudit]);

  const completeTaskNode = useCallback(async (instanceId: string, actionTaken?: string, comments?: string): Promise<void> => {
    setInstances(prev =>
      prev.map(inst => {
        if (inst.id === instanceId) {
          const updated = advanceProcess({
            ...inst,
            variables: {
              ...inst.variables,
              [`${inst.currentNodeId}.action`]: actionTaken,
              [`${inst.currentNodeId}.comments`]: comments,
            }
          }, workflows);
          addAudit('node_completed', `Concluiu a etapa "${inst.currentNodeLabel}" com status "${actionTaken ?? 'sucesso'}"`, inst.workflowId, inst.id);
          return updated;
        }
        return inst;
      })
    );
  }, [workflows, advanceProcess, addAudit]);

  const triggerSystemEvent = useCallback(async (eventName: string, payload: Record<string, any>): Promise<void> => {
    // Motor de Automações: Event-driven triggers
    const matchedAutomations = automations.filter(a => a.trigger === eventName && a.active);
    
    matchedAutomations.forEach(auto => {
      // Registra no log de auditoria o disparo automático da ação configurada
      addAudit('node_completed', `Automação "${auto.name}" disparada por evento "${eventName}". Ação: ${auto.actionType}.`);
    });

    // Se o evento for novo cadastro de beneficiário, pode iniciar fluxo correspondente
    if (eventName === 'new_registration') {
      const targetWf = workflows.find(w => w.name.includes('Acolhimento'));
      if (targetWf) {
        startProcessInstance(targetWf.id, {
          'beneficiary.name': payload.name || 'Desconhecido',
          'beneficiary.age': payload.age || 18,
          'beneficiary.income': payload.income || 0,
        });
      }
    }
  }, [automations, workflows, startProcessInstance, addAudit]);

  // ------------------------------------------------------------
  // RULES ENGINE MANAGEMENT
  // ------------------------------------------------------------

  const saveRule = useCallback(async (rule: BusinessRule): Promise<void> => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = rule;
        return updated;
      }
      return [...prev, rule];
    });
    addAudit('rule_updated', `Salvou regra condicional do rules engine: "${rule.name}"`);
  }, [addAudit]);

  const deleteRule = useCallback(async (id: string): Promise<void> => {
    setRules(prev => prev.filter(r => r.id !== id));
    addAudit('rule_updated', `Removeu regra condicional ID ${id}`);
  }, [addAudit]);

  // ------------------------------------------------------------
  // FORMULÁRIOS DINÂMICOS
  // ------------------------------------------------------------

  const saveForm = useCallback(async (form: DynamicForm): Promise<void> => {
    setForms(prev => {
      const idx = prev.findIndex(f => f.id === form.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = form;
        return updated;
      }
      return [...prev, form];
    });
    addAudit('rule_updated', `Salvou formulário dinâmico no catálogo: "${form.name}"`);
  }, [addAudit]);

  const deleteForm = useCallback(async (id: string): Promise<void> => {
    setForms(prev => prev.filter(f => f.id !== id));
    addAudit('rule_updated', `Removeu formulário dinâmico ID ${id}`);
  }, [addAudit]);

  // ------------------------------------------------------------
  // AUTOMAÇÕES
  // ------------------------------------------------------------

  const toggleAutomation = useCallback(async (id: string): Promise<void> => {
    setAutomations(prev =>
      prev.map(a => (a.id === id ? { ...a, active: !a.active } : a))
    );
    const found = automations.find(a => a.id === id);
    if (found) {
      addAudit('config_changed' as any, `${found.active ? 'Desativou' : 'Ativou'} regra de automação "${found.name}"`);
    }
  }, [automations, addAudit]);

  const saveAutomation = useCallback(async (automation: AutomationRule): Promise<void> => {
    setAutomations(prev => {
      const idx = prev.findIndex(a => a.id === automation.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = automation;
        return updated;
      }
      return [...prev, automation];
    });
    addAudit('config_changed' as any, `Salvou configuração da automação "${automation.name}"`);
  }, [addAudit]);

  // ------------------------------------------------------------
  // SUGESTÕES IA DE PROCESSOS
  // ------------------------------------------------------------

  const approveSuggestion = useCallback(async (id: string): Promise<void> => {
    setSuggestions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'approved' } : s))
    );
    const found = suggestions.find(s => s.id === id);
    if (found) {
      addAudit('ai_suggestion_approved', `Aprovou e implementou recomendação da IA no fluxo "${found.workflowName}"`);
      // Otimização real simulada: se gargalo, estende ou automatiza
      if (found.type === 'bottleneck') {
        publishWorkflow(found.workflowId);
      }
    }
  }, [suggestions, publishWorkflow, addAudit]);

  const rejectSuggestion = useCallback(async (id: string): Promise<void> => {
    setSuggestions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'rejected' } : s))
    );
    const found = suggestions.find(s => s.id === id);
    if (found) {
      addAudit('ai_suggestion_rejected', `Rejeitou recomendação da IA no fluxo "${found.workflowName}"`);
    }
  }, [suggestions, addAudit]);

  return (
    <BPMSContext.Provider
      value={{
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
      }}
    >
      {children}
    </BPMSContext.Provider>
  );
}

export function useBPMS() {
  const context = useContext(BPMSContext);
  if (!context) {
    throw new Error('useBPMS deve ser usado dentro de um BPMSProvider');
  }
  return context;
}
