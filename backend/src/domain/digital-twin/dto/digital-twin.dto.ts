import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsObject, Min, Max } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum ScenarioType {
  OPTIMISTIC = 'OPTIMISTIC',
  EXPECTED = 'EXPECTED',
  CONSERVATIVE = 'CONSERVATIVE',
  CRITICAL = 'CRITICAL',
  CUSTOM = 'CUSTOM',
}

export enum SimulationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ImpactDimension {
  BENEFICIARIES = 'BENEFICIARIES',
  PROFESSIONALS = 'PROFESSIONALS',
  VOLUNTEERS = 'VOLUNTEERS',
  BUDGET = 'BUDGET',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  INDICATORS = 'INDICATORS',
  RISKS = 'RISKS',
  COMPLIANCE = 'COMPLIANCE',
  PERFORMANCE = 'PERFORMANCE',
  SOCIAL_IMPACT = 'SOCIAL_IMPACT',
}

export enum ForecastHorizon {
  THREE_MONTHS = 'THREE_MONTHS',
  SIX_MONTHS = 'SIX_MONTHS',
  TWELVE_MONTHS = 'TWELVE_MONTHS',
  TWENTY_FOUR_MONTHS = 'TWENTY_FOUR_MONTHS',
}

export enum TwinSyncStatus {
  SYNCHRONIZED = 'SYNCHRONIZED',
  SYNCING = 'SYNCING',
  STALE = 'STALE',
  ERROR = 'ERROR',
}

export enum SimulationType {
  DEMAND_INCREASE = 'DEMAND_INCREASE',
  RESOURCE_REDUCTION = 'RESOURCE_REDUCTION',
  NEW_PROGRAM = 'NEW_PROGRAM',
  INSTITUTIONAL_EXPANSION = 'INSTITUTIONAL_EXPANSION',
  PROCESS_CHANGE = 'PROCESS_CHANGE',
  REGULATORY_CHANGE = 'REGULATORY_CHANGE',
  STAFF_REDISTRIBUTION = 'STAFF_REDISTRIBUTION',
}

// ── DTOS ──────────────────────────────────────────────────────────────────────

export class CreateScenarioDto {
  @ApiProperty({ example: 'Expansão para Polo Sul — 2027' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Projeção de expansão para novo polo com 3 equipes adicionais' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ScenarioType, example: ScenarioType.OPTIMISTIC })
  @IsEnum(ScenarioType)
  type: ScenarioType;

  @ApiPropertyOptional({ example: { demandGrowthPercent: 40, additionalStaff: 12, budgetIncreasePercent: 25 } })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ example: 'STRATEGY-TEAM-01' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class RunSimulationDto {
  @ApiProperty({ enum: SimulationType, example: SimulationType.DEMAND_INCREASE })
  @IsEnum(SimulationType)
  simulationType: SimulationType;

  @ApiPropertyOptional({ example: 'SCENARIO-2026-XXXX' })
  @IsOptional()
  @IsString()
  scenarioId?: string;

  @ApiProperty({ example: { demandGrowthPercent: 35, timeHorizonMonths: 12 } })
  @IsObject()
  parameters: Record<string, any>;

  @ApiPropertyOptional({ example: 'CEO-01' })
  @IsOptional()
  @IsString()
  requestedBy?: string;
}

export class AnalyzeImpactDto {
  @ApiProperty({ example: 'SIM-2026-XXXX' })
  @IsString()
  simulationId: string;

  @ApiProperty({ example: ['BENEFICIARIES', 'BUDGET', 'PROFESSIONALS', 'RISKS'] })
  @IsArray()
  @IsEnum(ImpactDimension, { each: true })
  dimensions: ImpactDimension[];

  @ApiPropertyOptional({ example: { financialUncertaintyPercent: 10 } })
  @IsOptional()
  @IsObject()
  assumptions?: Record<string, any>;
}

export class OptimizeResourcesDto {
  @ApiPropertyOptional({ example: 'SCENARIO-2026-XXXX' })
  @IsOptional()
  @IsString()
  scenarioId?: string;

  @ApiProperty({ example: { targetCapacityPercent: 85, prioritizeVulnerableGroups: true } })
  @IsObject()
  constraints: Record<string, any>;
}

export class GenerateForecastDto {
  @ApiProperty({ enum: ForecastHorizon, example: ForecastHorizon.TWELVE_MONTHS })
  @IsEnum(ForecastHorizon)
  horizon: ForecastHorizon;

  @ApiPropertyOptional({ example: 'SCENARIO-2026-XXXX' })
  @IsOptional()
  @IsString()
  baseScenarioId?: string;

  @ApiPropertyOptional({ example: { seasonalAdjustment: true, includeMacroRisks: true } })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class SyncDigitalTwinDto {
  @ApiPropertyOptional({ example: ['unified-operations', 'cognitive-orchestration', 'enterprise-interoperability'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetModules?: string[];

  @ApiPropertyOptional({ example: 'SYNC-SCHEDULER' })
  @IsOptional()
  @IsString()
  triggeredBy?: string;
}
