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
} from 'class-validator';
import { Type } from 'class-transformer';

// ── ENUMS ───────────────────────────────────────────────────────────────────

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

export enum RecommendationCategory {
  PROCESS_IMPROVEMENT = 'PROCESS_IMPROVEMENT',
  OPERATIONAL_OPTIMIZATION = 'OPERATIONAL_OPTIMIZATION',
  RESOURCE_ALLOCATION = 'RESOURCE_ALLOCATION',
  CAPACITY_BUILDING = 'CAPACITY_BUILDING',
  RISK_MANAGEMENT = 'RISK_MANAGEMENT',
  SECURITY_GOVERNANCE = 'SECURITY_GOVERNANCE',
  CARE_QUALITY = 'CARE_QUALITY',
  STRATEGIC_KPI = 'STRATEGIC_KPI',
}

// ── DTOS ────────────────────────────────────────────────────────────────────

export class CognitiveTaskRequestDto {
  @ApiProperty({ example: 'Avaliação multidiscipinar para caso complexo #CAS-2026-0091' })
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

  @ApiPropertyOptional({ example: { beneficiaryId: 'BEN-2026-0012', severity: 'HIGH' } })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

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

export class ReasoningQueryDto {
  @ApiProperty({ example: 'Quais intervenções tiveram maior taxa de sucesso para ansiedade severa no último trimestre?' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ example: ['KnowledgeGraph', 'EHR', 'ECM'] })
  @IsOptional()
  @IsArray()
  sources?: string[];
}
