// ============================================================
// Tipos de Dados — BPMS, Workflow Engine e Central de Automação
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

export type WorkflowCategory = 'clinical' | 'administrative' | 'financial' | 'social';
export type WorkflowStatus = 'draft' | 'published' | 'archived';

export interface BPMNNode {
  id: string;
  type: 'start' | 'end' | 'task' | 'approval' | 'condition' | 'notification' | 'api_call' | 'delay';
  label: string;
  x: number;
  y: number;
  config: {
    assigneeRole?: string;
    assigneeId?: string;
    formId?: string;
    slaMinutes?: number;
    emailTemplate?: string;
    apiEndpoint?: string;
    ruleId?: string; // Regra condicional associada para desvios
  };
}

export interface BPMNEdge {
  id: string;
  source: string;
  target: string;
  conditionValue?: string; // ex: 'aprovado', 'rejeitado', 'true', 'false'
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  version: number;
  status: WorkflowStatus;
  nodes: BPMNNode[];
  edges: BPMNEdge[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: string;
}

// ------------------------------------------------------------
// Execução (Instâncias do Processo)
// ------------------------------------------------------------

export type ProcessInstanceStatus = 'running' | 'completed' | 'suspended' | 'failed';

export interface ProcessHistoryStep {
  id: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  completedAt: string;
  executorId?: string;
  executorName?: string;
  actionTaken?: string; // 'aprovado', 'rejeitado', 'completado', etc.
  comments?: string;
  slaStatus: 'met' | 'breached';
}

export interface ProcessInstance {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  status: ProcessInstanceStatus;
  startedAt: string;
  endedAt?: string;
  currentNodeId: string;
  currentNodeLabel: string;
  variables: Record<string, any>;
  history: ProcessHistoryStep[];
  slaDeadline?: string; // Data/Hora máxima de expiração do nó atual
}

// ------------------------------------------------------------
// Rules Engine (Motor de Regras)
// ------------------------------------------------------------

export interface RuleCondition {
  field: string; // Ex: 'age', 'role', 'specialty', 'value'
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'is_true' | 'is_false';
  value: any;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  logicalOperator: 'AND' | 'OR';
  thenNodeId: string; // Próximo passo se verdadeiro
  elseNodeId: string; // Próximo passo se falso
}

// ------------------------------------------------------------
// Formulários Dinâmicos
// ------------------------------------------------------------

export type FormFieldType =
  | 'text'
  | 'number'
  | 'cpf'
  | 'phone'
  | 'email'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Para select, radio, etc.
  conditionalShowFieldId?: string; // ABAC/Interface: exibe apenas se outro campo tiver valor X
  conditionalShowValue?: any;
}

export interface DynamicForm {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  createdAt: string;
}

// ------------------------------------------------------------
// Automação & Eventos
// ------------------------------------------------------------

export type AutomationTrigger =
  | 'new_registration'
  | 'new_consultation'
  | 'document_uploaded'
  | 'payment_received'
  | 'sla_breached';

export type AutomationActionType = 'send_email' | 'send_sms' | 'create_task' | 'call_webhook';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  actionType: AutomationActionType;
  actionConfig: {
    to?: string;
    template?: string;
    payloadUrl?: string;
    taskTitle?: string;
  };
  active: boolean;
}

// ------------------------------------------------------------
// Inteligência IA de Processos
// ------------------------------------------------------------

export interface ProcessIASuggestion {
  id: string;
  workflowId: string;
  workflowName: string;
  type: 'bottleneck' | 'optimization' | 'redundancy' | 'sla_risk';
  description: string;
  impactScore: number; // 0 a 100
  proposedChange: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ------------------------------------------------------------
// Auditoria
// ------------------------------------------------------------

export interface BPMSAuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create_workflow' | 'publish_workflow' | 'execute_workflow' | 'node_completed' | 'rule_updated' | 'ai_suggestion_approved' | 'ai_suggestion_rejected' | 'config_changed';
  workflowId?: string;
  instanceId?: string;
  details: string;
  ipAddress: string;
}
