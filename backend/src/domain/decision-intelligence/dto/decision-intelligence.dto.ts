import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum DecisionDomain {
  STRATEGIC = 'STRATEGIC',
  OPERATIONAL = 'OPERATIONAL',
  ASSISTENTIAL = 'ASSISTENTIAL',
  FINANCIAL = 'FINANCIAL',
  CLINICAL = 'CLINICAL',
  HUMAN_RESOURCES = 'HUMAN_RESOURCES',
  GOVERNANCE = 'GOVERNANCE',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
}

export enum DecisionUrgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum DecisionStatus {
  PROPOSED = 'PROPOSED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED',
  OVERRIDDEN = 'OVERRIDDEN',
}

export enum EvidenceType {
  METRIC_INDICATOR = 'METRIC_INDICATOR',
  KNOWLEDGE_DOCUMENT = 'KNOWLEDGE_DOCUMENT',
  DIGITAL_TWIN_SIMULATION = 'DIGITAL_TWIN_SIMULATION',
  HISTORICAL_DECISION = 'HISTORICAL_DECISION',
  AUDIT_FINDING = 'AUDIT_FINDING',
  PROTOCOL_RULE = 'PROTOCOL_RULE',
  RESEARCH_STUDY = 'RESEARCH_STUDY',
}

export enum ConfidenceLevel {
  VERY_HIGH = 'VERY_HIGH', // >90%
  HIGH = 'HIGH',           // 75-90%
  MODERATE = 'MODERATE',   // 60-75%
  LOW = 'LOW',             // <60%
}

export enum KpiStatus {
  ON_TRACK = 'ON_TRACK',
  NEEDS_ATTENTION = 'NEEDS_ATTENTION',
  AT_RISK = 'AT_RISK',
  CRITICAL_DEVIATION = 'CRITICAL_DEVIATION',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class CreateDecisionRecommendationDto {
  @ApiProperty({ example: 'Redistribuição de Equipes de Atendimento em Saúde Mental' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Solicitação de recomendação baseada no aumento de demanda de 35% no Polo Sul' })
  @IsString()
  contextDescription: string;

  @ApiProperty({ enum: DecisionDomain, example: DecisionDomain.ASSISTENTIAL })
  @IsEnum(DecisionDomain)
  domain: DecisionDomain;

  @ApiProperty({ enum: DecisionUrgency, example: DecisionUrgency.HIGH })
  @IsEnum(DecisionUrgency)
  urgency: DecisionUrgency;

  @ApiPropertyOptional({ example: ['EVID-2026-001', 'KNOW-2026-002', 'SIM-2026-003'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceIds?: string[];

  @ApiPropertyOptional({ example: { targetLocation: 'Polo Sul', maxBudgetBrl: 50000 } })
  @IsOptional()
  @IsObject()
  constraints?: Record<string, any>;
}

export class RecordEvidenceDto {
  @ApiProperty({ enum: EvidenceType, example: EvidenceType.DIGITAL_TWIN_SIMULATION })
  @IsEnum(EvidenceType)
  evidenceType: EvidenceType;

  @ApiProperty({ example: 'Simulação SIM-2026-042 (Expansão Polo Sul)' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Simulação ADT prevê aumento de capacidade de +45% com 2 novos profissionais' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'SIM-2026-042' })
  @IsOptional()
  @IsString()
  sourceEntityId?: string;

  @ApiPropertyOptional({ example: { confidenceScore: 0.94 } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class EvaluateDecisionDto {
  @ApiProperty({ example: 'DEC-2026-XXXX' })
  @IsString()
  recommendationId: string;

  @ApiProperty({ example: 'Aprovação da Alternativa A com redistribuição interna de equipes' })
  @IsString()
  selectedOptionId: string;

  @ApiProperty({ example: 'Decisão aprovada em comitê gestor considerando baixo impacto orçamentário' })
  @IsString()
  justification: string;

  @ApiProperty({ example: 'GESTOR-01' })
  @IsString()
  evaluatedBy: string;
}

export class RunPredictiveAnalyticsDto {
  @ApiProperty({ enum: DecisionDomain, example: DecisionDomain.ASSISTENTIAL })
  @IsEnum(DecisionDomain)
  domain: DecisionDomain;

  @ApiProperty({ example: 12, description: 'Horizonte de projeção em meses' })
  @IsNumber()
  timeHorizonMonths: number;

  @ApiPropertyOptional({ example: { includeSeasonalAdjustments: true } })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class RunPrescriptiveAnalyticsDto {
  @ApiProperty({ example: 'DEC-2026-XXXX' })
  @IsString()
  decisionContextId: string;

  @ApiProperty({ example: { maxBudgetBrl: 100000, maxTimeMonths: 3 } })
  @IsObject()
  constraints: Record<string, any>;
}

export class RegisterKpiDto {
  @ApiProperty({ example: 'NPS de Atendimento Assistencial' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Mede a satisfação geral dos beneficiários' })
  @IsString()
  description: string;

  @ApiProperty({ enum: DecisionDomain, example: DecisionDomain.ASSISTENTIAL })
  @IsEnum(DecisionDomain)
  domain: DecisionDomain;

  @ApiProperty({ example: 80, description: 'Meta do KPI' })
  @IsNumber()
  targetValue: number;

  @ApiProperty({ example: 74, description: 'Valor atual do KPI' })
  @IsNumber()
  currentValue: number;

  @ApiProperty({ example: 'pontos' })
  @IsString()
  unit: string;
}
