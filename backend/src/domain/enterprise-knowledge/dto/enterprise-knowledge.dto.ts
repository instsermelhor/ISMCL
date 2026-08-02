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
}

// ── ENTERPRISE KNOWLEDGE DTOs ─────────────────────────────────────────────────

export class CreateKnowledgeDocumentDto {
  @ApiProperty({ example: 'Política Corporativa de Proteção à Criança e Adolescente' })
  @IsString()
  title: string;

  @ApiProperty({ enum: DocumentCategory, example: DocumentCategory.POLICY })
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @ApiProperty({ example: 'Diretrizes obrigatórias de proteção integral nos atendimentos do ISM.' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'Dra. Maria Silva (Diretoria Social)' })
  @IsString()
  author: string;

  @ApiPropertyOptional({ enum: ConfidentialityLevel, example: ConfidentialityLevel.INTERNAL })
  @IsOptional()
  @IsEnum(ConfidentialityLevel)
  confidentiality?: ConfidentialityLevel;

  @ApiPropertyOptional({ example: ['proteção infantil', 'direitos humanos', 'compliance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: ['Assistência Social', 'Atendimento Psicossocial'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relevantDomains?: string[];

  @ApiPropertyOptional({ enum: PreservationPolicyType, example: PreservationPolicyType.PERMANENT_HISTORICAL })
  @IsOptional()
  @IsEnum(PreservationPolicyType)
  preservationPolicy?: PreservationPolicyType;
}

export class UpdateKnowledgeDocumentDto {
  @ApiPropertyOptional({ example: 'Conteúdo atualizado com novos parâmetros legais' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: ['novas diretrizes LGPD'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'Dra. Maria Silva' })
  @IsString()
  updatedBy: string;

  @ApiPropertyOptional({ example: 'Revisão anual obrigatória de compliance' })
  @IsOptional()
  @IsString()
  changeSummary?: string;
}

// ── LESSONS LEARNED DTOs ──────────────────────────────────────────────────────

export class RegisterLessonLearnedDto {
  @ApiProperty({ example: 'Migração de banco de dados em janela de pico causou degradação' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Infraestrutura / TI' })
  @IsString()
  context: string;

  @ApiProperty({ example: 'Execução de DDLs pesados durante horário comercial sem réplica de leitura isolada.' })
  @IsString()
  rootCause: string;

  @ApiProperty({ example: 'Agendar migrações estritamente entre 00h e 04h com failover pré-validado.' })
  @IsString()
  preventiveAction: string;

  @ApiProperty({ example: 'Engenharia de Software / DevOps' })
  @IsString()
  targetProcess: string;

  @ApiProperty({ example: 'Eng. Carlos Souza' })
  @IsString()
  author: string;
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
  relationType: string; // e.g. GOVERNS, IMPLEMENTS, MITIGATES, MEASURES, DEPENDS_ON
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
