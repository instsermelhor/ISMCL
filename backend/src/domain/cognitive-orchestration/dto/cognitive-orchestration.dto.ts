import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsUUID,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── ENUMS ────────────────────────────────────────────────────────────────────

export enum AgentDomainRole {
  PSYCHOLOGY = 'PSYCHOLOGY',
  PSYCHIATRY = 'PSYCHIATRY',
  SOCIAL_WORK = 'SOCIAL_WORK',
  LEGAL = 'LEGAL',
  FINANCE = 'FINANCE',
  HUMAN_RESOURCES = 'HUMAN_RESOURCES',
  COMPLIANCE = 'COMPLIANCE',
  AUDIT = 'AUDIT',
  SECURITY = 'SECURITY',
  CASE_MANAGEMENT = 'CASE_MANAGEMENT',
  BI_ANALYTICS = 'BI_ANALYTICS',
  ECM_DOCUMENTS = 'ECM_DOCUMENTS',
  CORPORATE_UNIVERSITY = 'CORPORATE_UNIVERSITY',
  GOVERNANCE = 'GOVERNANCE',
}

/** AgentType — classifica o agente por capacidade funcional (compatível com spec P152) */
export enum AgentType {
  CLINICAL_ASSISTANT = 'CLINICAL_ASSISTANT',
  SOCIAL_ASSISTANT = 'SOCIAL_ASSISTANT',
  LEGAL_ADVISOR = 'LEGAL_ADVISOR',
  FINANCIAL_ANALYST = 'FINANCIAL_ANALYST',
  HR_ADVISOR = 'HR_ADVISOR',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  AUDIT_INSPECTOR = 'AUDIT_INSPECTOR',
  SECURITY_GUARDIAN = 'SECURITY_GUARDIAN',
  CASE_COORDINATOR = 'CASE_COORDINATOR',
  BI_ANALYST = 'BI_ANALYST',
  ECM_MANAGER = 'ECM_MANAGER',
  TRAINING_FACILITATOR = 'TRAINING_FACILITATOR',
  GOVERNANCE_SUPERVISOR = 'GOVERNANCE_SUPERVISOR',
  ORCHESTRATOR = 'ORCHESTRATOR',
}

/** CognitiveLevel — nível de raciocínio cognitivo exercido pelo agente */
export enum CognitiveLevel {
  PERCEPTION = 'PERCEPTION',
  PATTERN_RECOGNITION = 'PATTERN_RECOGNITION',
  REASONING = 'REASONING',
  DECISION_MAKING = 'DECISION_MAKING',
  META_COGNITION = 'META_COGNITION',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  URGENT_EMERGENCY = 'URGENT_EMERGENCY',
}

export enum TaskStatus {
  SUBMITTED = 'SUBMITTED',
  ROUTED = 'ROUTED',
  IN_PROGRESS = 'IN_PROGRESS',
  AGENT_CONSENSUS = 'AGENT_CONSENSUS',
  HUMAN_REVIEW_PENDING = 'HUMAN_REVIEW_PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

export enum ModelLifecycleState {
  REGISTERED = 'REGISTERED',
  TRAINING = 'TRAINING',
  HOMOLOGATING = 'HOMOLOGATING',
  DEPLOYED = 'DEPLOYED',
  DEGRADED = 'DEGRADED',
  RETIRED = 'RETIRED',
  REPLACED = 'REPLACED',
}

/** ModelStatus — alias explícito para compatibilidade com spec de testes */
export enum ModelStatus {
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
  RETIRED = 'RETIRED',
  DEPRECATED = 'DEPRECATED',
}

export enum RecommendationCategory {
  PROCESS_IMPROVEMENT = 'PROCESS_IMPROVEMENT',
  OPERATIONAL_OPTIMIZATION = 'OPERATIONAL_OPTIMIZATION',
  RESOURCE_ALLOCATION = 'RESOURCE_ALLOCATION',
  CAPACITY_BUILDING = 'CAPACITY_BUILDING',
  RISK_MANAGEMENT = 'RISK_MANAGEMENT',
  SECURITY_GOVERNANCE = 'SECURITY_GOVERNANCE',
  CARE_QUALITY = 'CARE_QUALITY',
  STRATEGIC_KPI = 'STRATEGIC_KPI',
  CLINICAL_PROTOCOL = 'CLINICAL_PROTOCOL',
}

// ── DTOS — COGNITIVE TASK DISPATCH ──────────────────────────────────────────

export class TaskContextDto {
  @ApiPropertyOptional({ example: 'Avaliação multidisciplinar emergencial' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: { beneficiaryId: 'BEN-2026-0012', severity: 'HIGH' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class DispatchCognitiveTaskDto {
  @ApiProperty({ example: 'TASK-2026-0091' })
  @IsString()
  taskId: string;

  @ApiProperty({ example: 'Avaliação multidisciplinar para caso complexo #CAS-2026-0091' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Determinar melhor plano terapêutico integrando Psicologia, Assistência Social e Psiquiatria' })
  @IsString()
  description: string;

  @ApiProperty({ enum: AgentDomainRole, isArray: true, example: [AgentDomainRole.PSYCHOLOGY, AgentDomainRole.SOCIAL_WORK] })
  @IsArray()
  @IsEnum(AgentDomainRole, { each: true })
  targetDomains: AgentDomainRole[];

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiPropertyOptional({ example: 'CAS-2026-0091' })
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => TaskContextDto)
  taskContext?: TaskContextDto;
}

/** @deprecated Use DispatchCognitiveTaskDto instead */
export class CognitiveTaskRequestDto extends DispatchCognitiveTaskDto {
  @ApiPropertyOptional({ example: { beneficiaryId: 'BEN-2026-0012', severity: 'HIGH' } })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

// ── DTOS — AGENT MESSAGES ────────────────────────────────────────────────────

export class AgentMessageDto {
  @ApiProperty({ example: 'agent-psychology-v1' })
  @IsString()
  agentId: string;

  @ApiProperty({ enum: AgentDomainRole, example: AgentDomainRole.PSYCHOLOGY })
  @IsEnum(AgentDomainRole)
  domainRole: AgentDomainRole;

  @ApiProperty({ example: 'Recomendo acompanhamento semanal com foco em TCC' })
  @IsString()
  analysis: string;

  @ApiProperty({ example: 0.92 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ example: ['Escala PHQ-9', 'Prontuário EHR-2026-0044'] })
  @IsArray()
  @IsString({ each: true })
  evidences: string[];
}

// ── DTOS — MODEL REGISTRY ────────────────────────────────────────────────────

export class ModelRegistrationDto {
  @ApiProperty({ example: 'aura-clinical-bert-v2' })
  @IsString()
  modelName: string;

  @ApiProperty({ example: '2.1.0' })
  @IsString()
  version: string;

  @ApiProperty({ enum: AgentDomainRole, example: AgentDomainRole.PSYCHIATRY })
  @IsEnum(AgentDomainRole)
  targetDomain: AgentDomainRole;

  @ApiProperty({ example: 'HuggingFace / PyTorch Clinical BERT Fine-Tuned' })
  @IsString()
  framework: string;

  @ApiProperty({ example: 0.94 })
  @IsNumber()
  accuracy: number;

  @ApiProperty({ example: 0.93 })
  @IsNumber()
  f1Score: number;
}

/** RegisterModelDto — assinatura do spec P152 */
export class RegisterModelDto {
  @ApiProperty({ example: 'Aura-Triage-v2.1' })
  @IsString()
  modelName: string;

  @ApiProperty({ example: 'Local-Ollama-FineTuned' })
  @IsString()
  provider: string;

  @ApiProperty({ example: '2.1.0' })
  @IsString()
  version: string;

  @ApiProperty({ example: 'Triagem e Classificação de Risco' })
  @IsString()
  domainCategory: string;

  @ApiPropertyOptional({ example: 's3://aura-models/triage-v2.1.bin' })
  @IsOptional()
  @IsString()
  artifactUrl?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4...' })
  @IsOptional()
  @IsString()
  checksumSha256?: string;

  @ApiProperty({ example: ['screening', 'triage', 'phq9_scoring'] })
  @IsArray()
  @IsString({ each: true })
  capabilities: string[];

  @ApiPropertyOptional({ example: 0.002 })
  @IsOptional()
  @IsNumber()
  costPer1kTokensBrl?: number;
}

// ── DTOS — COGNITIVE MEMORY ──────────────────────────────────────────────────

export class StoreMemoryDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ example: 'BEN-2026-00001' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ example: 'short_term', enum: ['short_term', 'long_term', 'working'] })
  @IsString()
  memoryType: 'short_term' | 'long_term' | 'working';

  @ApiProperty({ example: 'recent_symptom_summary' })
  @IsString()
  key: string;

  @ApiProperty({ example: { symptoms: ['ansiedade', 'insônia'] } })
  @IsObject()
  content: Record<string, any>;

  @ApiPropertyOptional({ example: 0.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  importance?: number;

  @ApiPropertyOptional({ example: ['triagem', 'anamnese'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'vec_emb_998123' })
  @IsOptional()
  @IsString()
  vectorEmbeddingRef?: string;
}

// ── DTOS — AI PERFORMANCE TELEMETRY ──────────────────────────────────────────

export class RecordTelemetryDto {
  @ApiProperty({ example: 'gemini-1.5-pro' })
  @IsString()
  modelId: string;

  @ApiPropertyOptional({ example: 'Google Cloud Vertex AI' })
  @IsOptional()
  @IsString()
  providerName?: string;

  @ApiProperty({ example: 320 })
  @IsNumber()
  latencyMs: number;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsNumber()
  tokensInput?: number;

  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsNumber()
  tokensOutput?: number;

  @ApiPropertyOptional({ example: 0.045 })
  @IsOptional()
  @IsNumber()
  estimatedCostBrl?: number;

  @ApiPropertyOptional({ example: 0.03 })
  @IsOptional()
  @IsNumber()
  hallucinationRiskScore?: number;

  @ApiPropertyOptional({ example: 0.01 })
  @IsOptional()
  @IsNumber()
  biasScore?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  successStatus: boolean;
}

// ── DTOS — AI TASK ROUTING ───────────────────────────────────────────────────

export class RouteTaskDto {
  @ApiProperty({ example: 'clinical_summary' })
  @IsString()
  taskType: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({ example: ['clinical_knowledge', 'summarization'] })
  @IsArray()
  @IsString({ each: true })
  requiredCapabilities: string[];

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  maxLatencyMs?: number;

  @ApiPropertyOptional({ example: 0.10 })
  @IsOptional()
  @IsNumber()
  maxCostBrl?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  contentLengthTokens?: number;
}

// ── DTOS — AI COLLABORATION SESSION ─────────────────────────────────────────

export class CollaborationParticipantDto {
  @ApiProperty({ example: 'agent-clin-001' })
  @IsString()
  agentId: string;

  @ApiProperty({ example: 'Assistente Clínico' })
  @IsString()
  role: string;
}

export class InitiateCollaborationDto {
  @ApiProperty({ example: 'Discussão de Caso Complexo Multidisciplinar' })
  @IsString()
  topic: string;

  @ApiProperty({ type: [CollaborationParticipantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollaborationParticipantDto)
  participants: CollaborationParticipantDto[];

  @ApiPropertyOptional({ example: { caseId: 'CAS-2026-00001' } })
  @IsOptional()
  @IsObject()
  contextPayload?: Record<string, any>;
}

// ── DTOS — COGNITIVE AUDIT ───────────────────────────────────────────────────

export class RecordAuditLogDto {
  @ApiProperty({ example: 'agent-clin-001' })
  @IsString()
  agentId: string;

  @ApiProperty({ enum: AgentType, example: AgentType.CLINICAL_ASSISTANT })
  @IsEnum(AgentType)
  agentType: AgentType;

  @ApiProperty({ enum: CognitiveLevel, example: CognitiveLevel.DECISION_MAKING })
  @IsEnum(CognitiveLevel)
  cognitiveLevel: CognitiveLevel;

  @ApiProperty({ example: 'clinical_protocol_recommendation' })
  @IsString()
  actionName: string;

  @ApiPropertyOptional({ example: 'e3b0c44298fc...' })
  @IsOptional()
  @IsString()
  inputPayloadHash?: string;

  @ApiPropertyOptional({ example: 'ca978112ca1b...' })
  @IsOptional()
  @IsString()
  outputResponseHash?: string;

  @ApiPropertyOptional({ example: 'Recomendação baseada em diretrizes do CFM 2.314/2022' })
  @IsOptional()
  @IsString()
  explanationSummary?: string;

  @ApiProperty({ example: 0.96 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  humanInTheLoopRequired: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  humanApproved?: boolean;

  @ApiPropertyOptional({ example: 'USR-PRO-001' })
  @IsOptional()
  @IsString()
  humanReviewerId?: string;

  @ApiPropertyOptional({ example: 142 })
  @IsOptional()
  @IsNumber()
  latencyMs?: number;

  @ApiPropertyOptional({ example: 850 })
  @IsOptional()
  @IsNumber()
  tokensUsed?: number;
}

// ── DTOS — REASONING ─────────────────────────────────────────────────────────

export class ReasoningQueryDto {
  @ApiProperty({ example: 'Quais intervenções tiveram maior taxa de sucesso para ansiedade severa?' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ example: ['KnowledgeGraph', 'EHR', 'ECM'] })
  @IsOptional()
  @IsArray()
  sources?: string[];
}

export class ExecuteReasoningDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: 'Determinar protocolo de acolhimento emergencial' })
  @IsString()
  goal: string;

  @ApiPropertyOptional({ example: { riskLevel: 'HIGH', suicidalIdeation: false } })
  @IsOptional()
  @IsObject()
  contextData?: Record<string, any>;

  @ApiPropertyOptional({ example: ['Respeitar Resolução CFP 011/2012', 'SLA < 2 horas'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  constraints?: string[];
}

// ── DTOS — RECOMMENDATION ────────────────────────────────────────────────────

export class GenerateRecommendationDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ enum: RecommendationCategory, example: RecommendationCategory.CLINICAL_PROTOCOL })
  @IsEnum(RecommendationCategory)
  category: RecommendationCategory;

  @ApiPropertyOptional({ example: 'BEN-2026-00001' })
  @IsOptional()
  @IsString()
  targetEntityId?: string;

  @ApiProperty({ example: 'Recomendação de Encaminhamento para Psiquiatria Infantil' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Beneficiário apresenta pontuação elevada na escala Y-BOCS.' })
  @IsString()
  description: string;

  @ApiProperty({ example: ['Agendar consulta com psiquiatra infantil'] })
  @IsArray()
  @IsString({ each: true })
  suggestedActions: string[];

  @ApiProperty({ example: 0.94 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore: number;

  @ApiPropertyOptional({ example: ['EHR-2026-00001', 'TRG-2026-00001'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceReferences?: string[];
}

export class RecommendationFeedbackDto {
  @ApiProperty({ example: 'REC-2026-0082' })
  @IsString()
  recommendationId: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({ example: 'PROF-1092' })
  @IsString()
  validatorUserId: string;

  @ApiPropertyOptional({ example: 'Plano terapêutico aprovado e incorporado à rotina do beneficiário.' })
  @IsOptional()
  @IsString()
  comments?: string;
}
