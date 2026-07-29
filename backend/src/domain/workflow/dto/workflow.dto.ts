import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Enumerações de Domínio ─────────────────────────────────────────────────

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  ERROR = 'ERROR',
}

export enum NodeType {
  START_EVENT = 'START_EVENT',
  END_EVENT = 'END_EVENT',
  USER_TASK = 'USER_TASK',
  SERVICE_TASK = 'SERVICE_TASK',
  GATEWAY_XOR = 'GATEWAY_XOR',   // Decisão exclusiva (apenas um caminho)
  GATEWAY_AND = 'GATEWAY_AND',   // Paralelismo (todos os caminhos)
  GATEWAY_OR = 'GATEWAY_OR',     // Inclusivo (um ou mais caminhos)
  INTERMEDIATE_TIMER = 'INTERMEDIATE_TIMER',
  CALL_ACTIVITY = 'CALL_ACTIVITY', // Subprocesso reutilizável
  ESCALATION = 'ESCALATION',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELEGATED = 'DELEGATED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export enum TaskPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum RuleOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  CONTAINS = 'CONTAINS',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  IS_EMPTY = 'IS_EMPTY',
}

export enum RuleAction {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  ROUTE = 'ROUTE',           // Encaminhar para outro fluxo
  NOTIFY = 'NOTIFY',         // Disparar notificação
  CREATE_TASK = 'CREATE_TASK',
  ESCALATE = 'ESCALATE',
  SET_PRIORITY = 'SET_PRIORITY',
  OPEN_CASE = 'OPEN_CASE',
  EMIT_DOCUMENT = 'EMIT_DOCUMENT',
  SCHEDULE_APPOINTMENT = 'SCHEDULE_APPOINTMENT',
}

// ── DTOs de Workflow ───────────────────────────────────────────────────────

export class WorkflowNodeDto {
  @ApiProperty({ description: 'ID único do nó dentro do workflow' })
  @IsString()
  nodeId: string;

  @ApiProperty({ description: 'Tipo do nó BPMN 2.0', enum: NodeType })
  @IsEnum(NodeType)
  type: NodeType;

  @ApiProperty({ description: 'Nome descritivo do nó' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'IDs dos nós de destino (sequências de saída)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  next?: string[];

  @ApiPropertyOptional({ description: 'Condição de ativação (ex: "risk > 70")' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ description: 'Tempo de espera em minutos (para INTERMEDIATE_TIMER)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  delayMinutes?: number;

  @ApiPropertyOptional({ description: 'Papel/Cargo responsável por USER_TASK' })
  @IsOptional()
  @IsString()
  assigneeRole?: string;

  @ApiPropertyOptional({ description: 'ID do workflow chamado (para CALL_ACTIVITY)' })
  @IsOptional()
  @IsString()
  calledWorkflowId?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais do nó' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateWorkflowDto {
  @ApiProperty({ description: 'Nome do workflow', example: 'Fluxo de Triagem de Alto Risco' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição do workflow' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Versão do workflow', example: '1.0' })
  @IsString()
  version: string;

  @ApiProperty({ description: 'Nós BPMN 2.0 do workflow', type: [WorkflowNodeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[];

  @ApiPropertyOptional({ description: 'SLA máximo em horas para conclusão do workflow' })
  @IsOptional()
  @IsNumber()
  slaHours?: number;

  @ApiPropertyOptional({ description: 'Tags para categorização' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class StartWorkflowDto {
  @ApiProperty({ description: 'ID do Workflow a iniciar' })
  @IsString()
  workflowId: string;

  @ApiProperty({ description: 'ID do beneficiário / entidade correlata' })
  @IsUUID()
  entityId: string;

  @ApiPropertyOptional({ description: 'Contexto inicial do processo (variáveis)' })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}

// ── DTOs de Regras ─────────────────────────────────────────────────────────

export class RuleConditionDto {
  @ApiProperty({ description: 'Atributo a avaliar (ex: "beneficiary.riskScore")' })
  @IsString()
  attribute: string;

  @ApiProperty({ description: 'Operador de comparação', enum: RuleOperator })
  @IsEnum(RuleOperator)
  operator: RuleOperator;

  @ApiProperty({ description: 'Valor de referência' })
  value: unknown;
}

export class CreateRuleDto {
  @ApiProperty({ description: 'Nome da regra', example: 'Triagem de Alto Risco' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição da regra' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Categoria da regra', example: 'CLINICAL' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Prioridade de avaliação (1=máxima)' })
  @IsNumber()
  @Min(1)
  priority: number;

  @ApiProperty({ description: 'Condições da regra (AND entre todas)', type: [RuleConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions: RuleConditionDto[];

  @ApiProperty({ description: 'Ação a executar quando todas as condições são verdadeiras', enum: RuleAction })
  @IsEnum(RuleAction)
  action: RuleAction;

  @ApiPropertyOptional({ description: 'Parâmetros da ação', example: '{"priority": "CRITICAL"}' })
  @IsOptional()
  @IsObject()
  actionParams?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Regra ativa?', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ── DTOs de Tarefas ────────────────────────────────────────────────────────

export class CreateTaskDto {
  @ApiProperty({ description: 'Título da tarefa' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descrição detalhada da tarefa' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Prioridade da tarefa', enum: TaskPriority })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiPropertyOptional({ description: 'ID do responsável pela tarefa' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento (ISO 8601)' })
  @IsOptional()
  @IsString()
  dueAt?: string;

  @ApiPropertyOptional({ description: 'ID da instância de workflow associada' })
  @IsOptional()
  @IsString()
  workflowInstanceId?: string;

  @ApiPropertyOptional({ description: 'ID do caso assistencial associado' })
  @IsOptional()
  @IsUUID()
  caseId?: string;
}

export class CompleteTaskDto {
  @ApiProperty({ description: 'ID da tarefa a concluir' })
  @IsString()
  taskId: string;

  @ApiPropertyOptional({ description: 'Resultado/comentário de conclusão' })
  @IsOptional()
  @IsString()
  outcome?: string;
}

export class EvaluateDecisionDto {
  @ApiProperty({ description: 'Contexto de decisão com atributos do beneficiário/caso' })
  @IsObject()
  context: Record<string, unknown>;
}
