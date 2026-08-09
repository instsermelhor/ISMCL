import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum DocumentCategory {
  POLICY = 'POLICY',
  STANDARD_OPERATING_PROCEDURE = 'STANDARD_OPERATING_PROCEDURE', // POP
  STANDARD = 'STANDARD',
  MANUAL = 'MANUAL',
  PROCESS = 'PROCESS',
  STRATEGIC_DECISION = 'STRATEGIC_DECISION',
  MEETING_MINUTES = 'MEETING_MINUTES',
  PROJECT = 'PROJECT',
  RESEARCH = 'RESEARCH',
  ARTICLE = 'ARTICLE',
  PROTOCOL = 'PROTOCOL',
  EDUCATIONAL_CONTENT = 'EDUCATIONAL_CONTENT',
}

export enum KnowledgeStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DEPRECATED = 'DEPRECATED',
}

export enum ConfidentialityLevel {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  RESTRICTED = 'RESTRICTED',
  CONFIDENTIAL = 'CONFIDENTIAL',
  SECRET = 'SECRET',
}

export enum PreservationPolicyType {
  PERMANENT_HISTORICAL = 'PERMANENT_HISTORICAL',
  LEGAL_RETENTION_5Y = 'LEGAL_RETENTION_5Y',
  LEGAL_RETENTION_10Y = 'LEGAL_RETENTION_10Y',
  OPERATIONAL_3Y = 'OPERATIONAL_3Y',
  TEMPORARY_1Y = 'TEMPORARY_1Y',
}

export enum KnowledgeNodeType {
  PERSON = 'PERSON',
  PROJECT = 'PROJECT',
  PROGRAM = 'PROGRAM',
  PROCESS = 'PROCESS',
  DOCUMENT = 'DOCUMENT',
  INDICATOR = 'INDICATOR',
  RISK = 'RISK',
  POLICY = 'POLICY',
  SYSTEM = 'SYSTEM',
  DECISION = 'DECISION',
  EVIDENCE = 'EVIDENCE',
  NORM = 'NORM',
  PROTOCOL = 'PROTOCOL',
  POP = 'POP',
  ADR = 'ADR',
  ARTICLE = 'ARTICLE',
  RESEARCH = 'RESEARCH',
  TRAINING = 'TRAINING',
  FAQ = 'FAQ',
  LESSON_LEARNED = 'LESSON_LEARNED',
  TEMPLATE = 'TEMPLATE',
  MULTIMEDIA = 'MULTIMEDIA',
}

export type KnowledgeType = KnowledgeNodeType;
export const KnowledgeType = KnowledgeNodeType;

export enum KnowledgeDomain {
  CLINICAL = 'CLINICAL',
  SOCIAL = 'SOCIAL',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  GOVERNANCE = 'GOVERNANCE',
  LEGAL = 'LEGAL',
  FINANCIAL = 'FINANCIAL',
  TECHNOLOGY = 'TECHNOLOGY',
  OPERATIONAL = 'OPERATIONAL',
  ASSISTENTIAL = 'ASSISTENTIAL',
  COMPLIANCE = 'COMPLIANCE',
  TECHNICAL = 'TECHNICAL',
}

export enum MemoryEventType {
  STRATEGIC_DECISION = 'STRATEGIC_DECISION',
  POLICY_CHANGE = 'POLICY_CHANGE',
  INCIDENT_LESSON = 'INCIDENT_LESSON',
  PROJECT_MILESTONE = 'PROJECT_MILESTONE',
  INNOVATION = 'INNOVATION',
  ARCHITECTURAL_CHANGE = 'ARCHITECTURAL_CHANGE',
  LESSON_LEARNED = 'LESSON_LEARNED',
}

export class RegisterLessonLearnedDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preventiveAction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetProcess?: string;

  @ApiProperty()
  @IsString()
  author: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// ── ENTERPRISE KNOWLEDGE DTOs ─────────────────────────────────────────────────

export class CreateKnowledgeDocumentDto {
  @ApiProperty({ example: 'Política de Proteção à Infância e Adolescência' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Diretrizes institucionais obrigatórias...' })
  @IsString()
  summary: string;

  @ApiProperty({ example: 'Conteúdo completo da política...' })
  @IsString()
  content: string;

  @ApiProperty({ enum: DocumentCategory, example: DocumentCategory.POLICY })
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @ApiProperty({ enum: ConfidentialityLevel, example: ConfidentialityLevel.INTERNAL })
  @IsEnum(ConfidentialityLevel)
  confidentiality: ConfidentialityLevel;

  @ApiProperty({ type: [String], example: ['proteção-infantil', 'lgpd', 'compliance'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ example: 'Comitê de Ética e Governança' })
  @IsString()
  authorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relevantDomains?: string[];

  @ApiPropertyOptional({ enum: PreservationPolicyType, default: PreservationPolicyType.PERMANENT_HISTORICAL })
  @IsOptional()
  @IsEnum(PreservationPolicyType)
  preservationPolicy?: PreservationPolicyType;
}

export class UpdateKnowledgeDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  changeSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: DocumentCategory })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ enum: KnowledgeStatus })
  @IsOptional()
  @IsEnum(KnowledgeStatus)
  status?: KnowledgeStatus;

  @ApiPropertyOptional({ enum: ConfidentialityLevel })
  @IsOptional()
  @IsEnum(ConfidentialityLevel)
  confidentiality?: ConfidentialityLevel;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relevantDomains?: string[];
}

// ── KNOWLEDGE GRAPH DTOs ──────────────────────────────────────────────────────

export class CreateKnowledgeRelationDto {
  @ApiProperty({ example: 'DOC-POLICY-001' })
  @IsString()
  sourceNodeId: string;

  @ApiProperty({ enum: KnowledgeNodeType, example: KnowledgeNodeType.DOCUMENT })
  @IsEnum(KnowledgeNodeType)
  sourceType: KnowledgeNodeType;

  @ApiProperty({ example: 'PROJ-SAUDE-MENTAL' })
  @IsString()
  targetNodeId: string;

  @ApiProperty({ enum: KnowledgeNodeType, example: KnowledgeNodeType.PROJECT })
  @IsEnum(KnowledgeNodeType)
  targetType: KnowledgeNodeType;

  @ApiProperty({ example: 'GOVERNS' })
  @IsString()
  relationType: string;
}

// ── SEMANTIC SEARCH DTOs ──────────────────────────────────────────────────────

export class SemanticSearchQueryDto {
  @ApiProperty({ example: 'Como proceder em caso de denúncia de violação de direitos infantis?' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ enum: DocumentCategory })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ enum: ConfidentialityLevel })
  @IsOptional()
  @IsEnum(ConfidentialityLevel)
  maxConfidentiality?: ConfidentialityLevel;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  topK?: number;
}

export class SearchKnowledgeDto extends SemanticSearchQueryDto {}

export class GenerateRecommendationDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ enum: KnowledgeDomain })
  @IsOptional()
  @IsEnum(KnowledgeDomain)
  domain?: KnowledgeDomain;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class RecordOrganizationalMemoryDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: MemoryEventType })
  @IsEnum(MemoryEventType)
  eventType: MemoryEventType;

  @ApiProperty()
  @IsString()
  recordedBy: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
