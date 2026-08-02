import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum StrategicObjective {
  EXPAND_SOCIAL_IMPACT = 'EXPAND_SOCIAL_IMPACT',
  ENSURE_ASSISTENTIAL_QUALITY = 'ENSURE_ASSISTENTIAL_QUALITY',
  MAINTAIN_FINANCIAL_SUSTAINABILITY = 'MAINTAIN_FINANCIAL_SUSTAINABILITY',
  STRENGTHEN_GOVERNANCE_COMPLIANCE = 'STRENGTHEN_GOVERNANCE_COMPLIANCE',
  FOSTER_CONTINUOUS_INNOVATION = 'FOSTER_CONTINUOUS_INNOVATION',
  DEVELOP_HUMAN_CAPITAL = 'DEVELOP_HUMAN_CAPITAL',
}

export enum AlignmentStatus {
  PERFECTLY_ALIGNED = 'PERFECTLY_ALIGNED',
  ALIGNED = 'ALIGNED',
  SLIGHTLY_MISALIGNED = 'SLIGHTLY_MISALIGNED',
  CRITICALLY_MISALIGNED = 'CRITICALLY_MISALIGNED',
}

export enum GovernanceActionType {
  POLICY_VALIDATION = 'POLICY_VALIDATION',
  ROLE_SEGREGATION_CHECK = 'ROLE_SEGREGATION_CHECK',
  COMPLIANCE_AUDIT = 'COMPLIANCE_AUDIT',
  PREVENTIVE_CONTROL = 'PREVENTIVE_CONTROL',
  CORRECTIVE_ACTION = 'CORRECTIVE_ACTION',
}

export enum DomainCategory {
  ASSISTENTIAL_SOCIAL = 'ASSISTENTIAL_SOCIAL',
  MENTAL_HEALTH_PSYCHOLOGY = 'MENTAL_HEALTH_PSYCHOLOGY',
  PSYCHIATRY = 'PSYCHIATRY',
  LEGAL_COMPLIANCE = 'LEGAL_COMPLIANCE',
  FINANCIAL_BUDGET = 'FINANCIAL_BUDGET',
  HUMAN_RESOURCES_VOLUNTEERS = 'HUMAN_RESOURCES_VOLUNTEERS',
  TECHNOLOGY_AI = 'TECHNOLOGY_AI',
  GOVERNANCE_AUDIT = 'GOVERNANCE_AUDIT',
}

export enum ResilienceScenarioType {
  FINANCIAL_CRISIS = 'FINANCIAL_CRISIS',
  INFRASTRUCTURE_OUTAGE = 'INFRASTRUCTURE_OUTAGE',
  ASSISTENTIAL_DEMAND_SURGE = 'ASSISTENTIAL_DEMAND_SURGE',
  REGULATORY_CHANGE = 'REGULATORY_CHANGE',
  REPUTATIONAL_RISK = 'REPUTATIONAL_RISK',
}

export enum CommandAlertLevel {
  GREEN_NORMAL = 'GREEN_NORMAL',
  YELLOW_WARNING = 'YELLOW_WARNING',
  ORANGE_HIGH_RISK = 'ORANGE_HIGH_RISK',
  RED_CRITICAL_EMERGENCY = 'RED_CRITICAL_EMERGENCY',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class ValidateMissionAlignmentDto {
  @ApiProperty({ example: 'Projeto Expansão Polo Sul 2027' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Iniciativa para ampliação dos serviços de acolhimento psicossocial' })
  @IsString()
  description: string;

  @ApiProperty({ enum: StrategicObjective, example: StrategicObjective.EXPAND_SOCIAL_IMPACT })
  @IsEnum(StrategicObjective)
  targetObjective: StrategicObjective;

  @ApiPropertyOptional({ example: { estimatedBeneficiaries: 1200, budgetBrl: 150000 } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ExecuteGovernanceActionDto {
  @ApiProperty({ enum: GovernanceActionType, example: GovernanceActionType.POLICY_VALIDATION })
  @IsEnum(GovernanceActionType)
  actionType: GovernanceActionType;

  @ApiProperty({ example: 'Validação de Política LGPD para módulo de Conhecimento' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'enterprise-knowledge' })
  @IsOptional()
  @IsString()
  targetModule?: string;

  @ApiPropertyOptional({ example: { enforceStrictSegregation: true } })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class CoordinateDecisionDto {
  @ApiProperty({ example: 'Reestruturação de Atendimento em Rede' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Decisão de remanejamento de 6 profissionais entre unidades' })
  @IsString()
  summary: string;

  @ApiProperty({ example: ['EVID-2026-001', 'DEC-2026-002'] })
  @IsArray()
  @IsString({ each: true })
  evidenceIds: string[];

  @ApiProperty({ example: 'DIR-EXEC-01' })
  @IsString()
  coordinatedBy: string;

  @ApiPropertyOptional({ example: ['Aumentar divulgação de voluntariado 30 dias antes'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lessonsLearned?: string[];
}

export class RunCrossDomainAnalysisDto {
  @ApiProperty({ example: ['ASSISTENTIAL_SOCIAL', 'MENTAL_HEALTH_PSYCHOLOGY', 'FINANCIAL_BUDGET'] })
  @IsArray()
  @IsEnum(DomainCategory, { each: true })
  targetDomains: DomainCategory[];

  @ApiPropertyOptional({ example: { periodMonths: 6 } })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

export class SimulateResilienceScenarioDto {
  @ApiProperty({ enum: ResilienceScenarioType, example: ResilienceScenarioType.ASSISTENTIAL_DEMAND_SURGE })
  @IsEnum(ResilienceScenarioType)
  scenarioType: ResilienceScenarioType;

  @ApiProperty({ example: { demandGrowthPercent: 50, durationDays: 30 } })
  @IsObject()
  parameters: Record<string, any>;
}
