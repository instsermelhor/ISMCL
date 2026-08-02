import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum AgentSpecialty {
  ARCHITECTURE = 'ARCHITECTURE',
  SECURITY = 'SECURITY',
  COMPLIANCE = 'COMPLIANCE',
  OBSERVABILITY = 'OBSERVABILITY',
  BUSINESS_INTELLIGENCE = 'BUSINESS_INTELLIGENCE',
  ARTIFICIAL_INTELLIGENCE = 'ARTIFICIAL_INTELLIGENCE',
  DOCUMENT_MANAGEMENT = 'DOCUMENT_MANAGEMENT',
  HELP_DESK = 'HELP_DESK',
  SOCIAL_ERP = 'SOCIAL_ERP',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  QUALITY_ASSURANCE = 'QUALITY_ASSURANCE',
}

export enum RecommendationCategory {
  PROCESS = 'PROCESS',
  ARCHITECTURE = 'ARCHITECTURE',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  COST = 'COST',
  GOVERNANCE = 'GOVERNANCE',
  AI = 'AI',
  USER_EXPERIENCE = 'USER_EXPERIENCE',
  SUSTAINABILITY = 'SUSTAINABILITY',
}

export enum RecommendationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RecommendationStatus {
  PROPOSED = 'PROPOSED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  IMPLEMENTED = 'IMPLEMENTED',
}

export enum TaskAssigneeType {
  AI_AGENT = 'AI_AGENT',
  TECHNICAL_TEAM = 'TECHNICAL_TEAM',
  MANAGER = 'MANAGER',
  INSTITUTIONAL_LEAD = 'INSTITUTIONAL_LEAD',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class CoordinateAgentsDto {
  @ApiProperty({ example: 'Avaliação de gargalo no módulo de agendamento' })
  @IsString()
  taskDescription: string;

  @ApiProperty({ enum: AgentSpecialty, isArray: true, example: [AgentSpecialty.ARCHITECTURE, AgentSpecialty.OBSERVABILITY] })
  @IsArray()
  @IsEnum(AgentSpecialty, { each: true })
  targetSpecialties: AgentSpecialty[];

  @ApiPropertyOptional({ example: { targetModule: 'scheduling' } })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class GenerateRecommendationDto {
  @ApiProperty({ example: 'Implementação de cache Redis para consultas de relatórios executivos' })
  @IsString()
  title: string;

  @ApiProperty({ enum: RecommendationCategory, example: RecommendationCategory.PERFORMANCE })
  @IsEnum(RecommendationCategory)
  category: RecommendationCategory;

  @ApiProperty({ example: 'Consultas ao BI demoram mais de 2.5s no horário de pico' })
  @IsString()
  justification: string;

  @ApiProperty({ enum: RecommendationPriority, example: RecommendationPriority.HIGH })
  @IsEnum(RecommendationPriority)
  priority: RecommendationPriority;

  @ApiPropertyOptional({ example: 'Redução do tempo de resposta de 2.5s para 180ms' })
  @IsOptional()
  @IsString()
  expectedImpact?: string;

  @ApiPropertyOptional({ example: 16, description: 'Esforço estimado em horas' })
  @IsOptional()
  @IsNumber()
  estimatedEffortHours?: number;
}

export class DelegateTaskDto {
  @ApiProperty({ example: 'Refatoração da query de agregação do ERP Social' })
  @IsString()
  title: string;

  @ApiProperty({ enum: TaskAssigneeType, example: TaskAssigneeType.AI_AGENT })
  @IsEnum(TaskAssigneeType)
  assigneeType: TaskAssigneeType;

  @ApiProperty({ example: 'agent-sql-optimizer-01' })
  @IsString()
  assigneeId: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiPropertyOptional({ example: '2026-08-15T23:59:59Z' })
  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class ReviewRecommendationDto {
  @ApiProperty({ example: 'REC-1728391' })
  @IsString()
  recommendationId: string;

  @ApiProperty({ enum: RecommendationStatus, example: RecommendationStatus.APPROVED })
  @IsEnum(RecommendationStatus)
  decision: RecommendationStatus.APPROVED | RecommendationStatus.REJECTED;

  @ApiProperty({ example: 'Aprovado conforme diretrizes do Comitê de Arquitetura' })
  @IsString()
  reviewNotes: string;

  @ApiProperty({ example: 'CTO' })
  @IsString()
  reviewedBy: string;
}

export class RecordOperationalLearningDto {
  @ApiProperty({ example: 'Otimização de índice no PostgreSQL para prontuários' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Adição de índice composto (beneficiary_id, created_at)' })
  @IsString()
  actionTaken: string;

  @ApiProperty({ example: 'Tempo médio de busca caiu de 1.8s para 14ms (melhoria de 99.2%)' })
  @IsString()
  resultMetrics: string;

  @ApiProperty({ example: 'Índices compostos reduzem o consumo de I/O em queries relacionais frequentes' })
  @IsString()
  lessonLearned: string;
}
