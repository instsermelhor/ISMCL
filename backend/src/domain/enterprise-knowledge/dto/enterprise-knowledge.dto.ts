import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum KnowledgeType {
  DOCUMENT = 'DOCUMENT',
  POLICY = 'POLICY',
  NORM = 'NORM',
  POP = 'POP',
  PROTOCOL = 'PROTOCOL',
  ARTICLE = 'ARTICLE',
  RESEARCH = 'RESEARCH',
  TRAINING = 'TRAINING',
  DECISION = 'DECISION',
  ADR = 'ADR',
  FAQ = 'FAQ',
  LESSON_LEARNED = 'LESSON_LEARNED',
  TEMPLATE = 'TEMPLATE',
  MULTIMEDIA = 'MULTIMEDIA',
}

export enum KnowledgeStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
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

export enum KnowledgeDomain {
  OPERATIONAL = 'OPERATIONAL',
  ASSISTENTIAL = 'ASSISTENTIAL',
  TECHNICAL = 'TECHNICAL',
  GOVERNANCE = 'GOVERNANCE',
  LEGAL = 'LEGAL',
  FINANCIAL = 'FINANCIAL',
  STRATEGIC = 'STRATEGIC',
  TRAINING = 'TRAINING',
  INNOVATION = 'INNOVATION',
  COMPLIANCE = 'COMPLIANCE',
}

export enum MemoryEventType {
  INSTITUTIONAL_DECISION = 'INSTITUTIONAL_DECISION',
  PROCESS_IMPROVEMENT = 'PROCESS_IMPROVEMENT',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',
  AUDIT_FINDING = 'AUDIT_FINDING',
  LESSON_LEARNED = 'LESSON_LEARNED',
  INCIDENT_RESOLVED = 'INCIDENT_RESOLVED',
  RECOMMENDATION = 'RECOMMENDATION',
  OPERATIONAL_REVIEW = 'OPERATIONAL_REVIEW',
  ARCHITECTURAL_CHANGE = 'ARCHITECTURAL_CHANGE',
}

export enum GraphEntityType {
  PERSON = 'PERSON',
  PROCESS = 'PROCESS',
  DOCUMENT = 'DOCUMENT',
  PROJECT = 'PROJECT',
  INDICATOR = 'INDICATOR',
  MODULE = 'MODULE',
  TRAINING = 'TRAINING',
  POLICY = 'POLICY',
  AI_AGENT = 'AI_AGENT',
  DEPARTMENT = 'DEPARTMENT',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class CreateKnowledgeItemDto {
  @ApiProperty({ example: 'Protocolo de Atendimento em Saúde Mental' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Diretrizes para atendimento psicossocial de beneficiários em crise' })
  @IsString()
  description: string;

  @ApiProperty({ enum: KnowledgeType, example: KnowledgeType.PROTOCOL })
  @IsEnum(KnowledgeType)
  type: KnowledgeType;

  @ApiProperty({ enum: KnowledgeDomain, example: KnowledgeDomain.ASSISTENTIAL })
  @IsEnum(KnowledgeDomain)
  domain: KnowledgeDomain;

  @ApiProperty({ enum: ConfidentialityLevel, example: ConfidentialityLevel.INTERNAL })
  @IsEnum(ConfidentialityLevel)
  confidentialityLevel: ConfidentialityLevel;

  @ApiPropertyOptional({ example: 'Equipe de Psicologia' })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({ example: ['psicologia', 'saúde mental', 'protocolo', 'atendimento'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'KNOWLEDGE-2026-XXXX' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: { content: 'Texto completo do protocolo...', attachments: [] } })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}

export class UpdateKnowledgeItemDto {
  @ApiPropertyOptional({ example: 'Protocolo de Atendimento em Saúde Mental — v2' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Atualização da seção de triagem' })
  @IsOptional()
  @IsString()
  changeReason?: string;

  @ApiPropertyOptional({ enum: KnowledgeStatus })
  @IsOptional()
  @IsEnum(KnowledgeStatus)
  status?: KnowledgeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class SearchKnowledgeDto {
  @ApiProperty({ example: 'Como realizar triagem de saúde mental?' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ enum: KnowledgeDomain })
  @IsOptional()
  @IsEnum(KnowledgeDomain)
  domain?: KnowledgeDomain;

  @ApiPropertyOptional({ enum: KnowledgeType })
  @IsOptional()
  @IsEnum(KnowledgeType)
  type?: KnowledgeType;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  topK?: number;

  @ApiPropertyOptional({ description: 'Usar RAG para gerar resposta contextual', example: true })
  @IsOptional()
  useRag?: boolean;
}

export class RecordOrganizationalMemoryDto {
  @ApiProperty({ enum: MemoryEventType, example: MemoryEventType.LESSON_LEARNED })
  @IsEnum(MemoryEventType)
  eventType: MemoryEventType;

  @ApiProperty({ example: 'Implementação do Módulo AUOC — P156' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'A integração com Kafka exigiu configuração de consumer groups por domínio' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'SRE-LEAD-01' })
  @IsOptional()
  @IsString()
  recordedBy?: string;

  @ApiPropertyOptional({ example: { relatedModule: 'unified-operations', phase: 'VII' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AddGraphNodeDto {
  @ApiProperty({ example: 'Protocolo de Saúde Mental' })
  @IsString()
  label: string;

  @ApiProperty({ enum: GraphEntityType, example: GraphEntityType.DOCUMENT })
  @IsEnum(GraphEntityType)
  entityType: GraphEntityType;

  @ApiPropertyOptional({ example: 'KNOWLEDGE-2026-XXXX' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}

export class AddGraphEdgeDto {
  @ApiProperty({ example: 'NODE-2026-XXXX' })
  @IsString()
  sourceNodeId: string;

  @ApiProperty({ example: 'NODE-2026-YYYY' })
  @IsString()
  targetNodeId: string;

  @ApiProperty({ example: 'REFERENCES', description: 'Tipo de relação semântica' })
  @IsString()
  relationshipType: string;

  @ApiPropertyOptional({ example: { strength: 0.85 } })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}

export class GenerateRecommendationDto {
  @ApiProperty({ example: 'PROF-001' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ example: 'psicologia' })
  @IsOptional()
  @IsString()
  userRole?: string;

  @ApiPropertyOptional({ example: KnowledgeDomain.ASSISTENTIAL })
  @IsOptional()
  @IsEnum(KnowledgeDomain)
  contextDomain?: KnowledgeDomain;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  maxRecommendations?: number;
}
