import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject, IsBoolean } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum AIAssetType {
  MODEL = 'MODEL',
  LLM = 'LLM',
  AGENT = 'AGENT',
  EMBEDDING = 'EMBEDDING',
  RAG_PIPELINE = 'RAG_PIPELINE',
  PROMPT = 'PROMPT',
  TOOL = 'TOOL',
  PIPELINE = 'PIPELINE',
}

export enum AIAssetLifecycle {
  DRAFT = 'DRAFT',
  VALIDATING = 'VALIDATING',
  HOMOLOGATED = 'HOMOLOGATED',
  PUBLISHED = 'PUBLISHED',
  MONITORING = 'MONITORING',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
}

export enum AIRiskCategory {
  ASSISTENTIAL = 'ASSISTENTIAL',
  LEGAL = 'LEGAL',
  REGULATORY = 'REGULATORY',
  OPERATIONAL = 'OPERATIONAL',
  ETHICAL = 'ETHICAL',
  TECHNOLOGICAL = 'TECHNOLOGICAL',
  REPUTATIONAL = 'REPUTATIONAL',
}

export enum AIRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum PromptStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
}

export enum ModelPerformanceRating {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  ACCEPTABLE = 'ACCEPTABLE',
  DEGRADED = 'DEGRADED',
  CRITICAL = 'CRITICAL',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class RegisterAIAssetDto {
  @ApiProperty({ example: 'AURA-LLM-GEMINI-2.5-PRO' })
  @IsString()
  assetId: string;

  @ApiProperty({ example: 'Gemini 2.5 Pro — Motor Principal de Linguagem' })
  @IsString()
  name: string;

  @ApiProperty({ enum: AIAssetType, example: AIAssetType.LLM })
  @IsEnum(AIAssetType)
  type: AIAssetType;

  @ApiProperty({ example: '2.5.0' })
  @IsString()
  version: string;

  @ApiProperty({ example: 'Dr. Ricardo Ribeiro (CAIO)' })
  @IsString()
  owner: string;

  @ApiPropertyOptional({ example: 'Motor de linguagem principal para agentes cognitivos e RAG institucional.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['CognitiveAgentService', 'DecisionAutomationService'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  consumers?: string[];
}

export class RegisterPromptDto {
  @ApiProperty({ example: 'PROMPT-BENEFIT-ELIGIBILITY-V3' })
  @IsString()
  promptId: string;

  @ApiProperty({ example: 'Análise de Elegibilidade de Benefício Social' })
  @IsString()
  objective: string;

  @ApiProperty({ example: 'Você é um assistente social especializado do Instituto Ser Melhor...' })
  @IsString()
  content: string;

  @ApiProperty({ example: '3.0.0' })
  @IsString()
  version: string;

  @ApiProperty({ example: 'Equipe de IA Social — Dra. Ana Mendes' })
  @IsString()
  author: string;

  @ApiPropertyOptional({ example: 'AURA-LLM-GEMINI-2.5-PRO' })
  @IsOptional()
  @IsString()
  compatibleModel?: string;

  @ApiPropertyOptional({ example: ['Não deve emitir juízo de valor', 'Apenas dados objetivos'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];
}

export class EvaluateModelDto {
  @ApiProperty({ example: 'AURA-LLM-GEMINI-2.5-PRO' })
  @IsString()
  assetId: string;

  @ApiProperty({ example: 500, description: 'Total de inferências avaliadas' })
  @IsNumber()
  sampleSize: number;

  @ApiPropertyOptional({ example: 'CAIO' })
  @IsOptional()
  @IsString()
  evaluatedBy?: string;
}

export class RegisterAIRiskDto {
  @ApiProperty({ example: 'AURA-LLM-GEMINI-2.5-PRO' })
  @IsString()
  assetId: string;

  @ApiProperty({ enum: AIRiskCategory, example: AIRiskCategory.ETHICAL })
  @IsEnum(AIRiskCategory)
  category: AIRiskCategory;

  @ApiProperty({ enum: AIRiskLevel, example: AIRiskLevel.MEDIUM })
  @IsEnum(AIRiskLevel)
  level: AIRiskLevel;

  @ApiProperty({ example: 'Possível viés socioeconômico na análise de elegibilidade de benefícios' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Revisão bimestral com amostra representativa e validação por assistentes sociais' })
  @IsString()
  mitigationPlan: string;
}

export class ExplainDecisionDto {
  @ApiProperty({ example: 'DEC-BENEFIT-001' })
  @IsString()
  decisionId: string;

  @ApiProperty({ example: 'AURA-LLM-GEMINI-2.5-PRO' })
  @IsString()
  modelUsed: string;

  @ApiProperty({ example: { monthlyIncome: 500, householdSize: 5, activeRegistration: true } })
  @IsObject()
  inputData: Record<string, any>;

  @ApiProperty({ example: 'APPROVED' })
  @IsString()
  outputDecision: string;

  @ApiPropertyOptional({ example: 0.95 })
  @IsOptional()
  @IsNumber()
  confidenceScore?: number;
}
