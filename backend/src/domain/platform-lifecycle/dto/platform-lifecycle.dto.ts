import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum ComponentType {
  MICROSERVICE = 'MICROSERVICE',
  LIBRARY = 'LIBRARY',
  FRAMEWORK = 'FRAMEWORK',
  DATABASE = 'DATABASE',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  AI_MODEL = 'AI_MODEL',
  API_GATEWAY = 'API_GATEWAY',
  PIPELINE = 'PIPELINE',
  INTEGRATION = 'INTEGRATION',
}

export enum LifecyclePhase {
  PLANNING = 'PLANNING',
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  MAINTENANCE = 'MAINTENANCE',
  DEPRECATED = 'DEPRECATED',
  EOL = 'EOL', // End of Life
}

export enum TechnicalDebtSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TechnicalDebtCategory {
  LEGACY_CODE = 'LEGACY_CODE',
  DUPLICATION = 'DUPLICATION',
  OBSOLETE_DEPENDENCY = 'OBSOLETE_DEPENDENCY',
  ANTI_PATTERN = 'ANTI_PATTERN',
  VULNERABILITY = 'VULNERABILITY',
  INCOMPLETE_DOCUMENTATION = 'INCOMPLETE_DOCUMENTATION',
  INSUFFICIENT_TESTS = 'INSUFFICIENT_TESTS',
}

export enum ModernizationStrategy {
  REFACTOR = 'REFACTOR',
  REPLACE = 'REPLACE',
  REPLATFORM = 'REPLATFORM',
  RETIRE = 'RETIRE',
  RETAIN = 'RETAIN',
  MIGRATE = 'MIGRATE',
}

export enum HealthDimension {
  STABILITY = 'STABILITY',
  RELIABILITY = 'RELIABILITY',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  TEST_COVERAGE = 'TEST_COVERAGE',
  TECHNICAL_DEBT = 'TECHNICAL_DEBT',
  ARCHITECTURAL_COMPLIANCE = 'ARCHITECTURAL_COMPLIANCE',
  SUSTAINABILITY = 'SUSTAINABILITY',
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export class RegisterComponentDto {
  @ApiProperty({ example: 'decision-intelligence' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ComponentType, example: ComponentType.MICROSERVICE })
  @IsEnum(ComponentType)
  type: ComponentType;

  @ApiProperty({ example: '1.0.0' })
  @IsString()
  version: string;

  @ApiPropertyOptional({ enum: LifecyclePhase, example: LifecyclePhase.PRODUCTION })
  @IsOptional()
  @IsEnum(LifecyclePhase)
  phase?: LifecyclePhase;

  @ApiPropertyOptional({ example: { runtime: 'Node 20 LTS', nestjsVersion: '10.x' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RegisterTechnicalDebtDto {
  @ApiProperty({ enum: TechnicalDebtCategory, example: TechnicalDebtCategory.OBSOLETE_DEPENDENCY })
  @IsEnum(TechnicalDebtCategory)
  category: TechnicalDebtCategory;

  @ApiProperty({ enum: TechnicalDebtSeverity, example: TechnicalDebtSeverity.HIGH })
  @IsEnum(TechnicalDebtSeverity)
  severity: TechnicalDebtSeverity;

  @ApiProperty({ example: 'class-validator@0.13 usa API descontinuada no Node 20' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'enterprise-knowledge' })
  @IsOptional()
  @IsString()
  affectedComponent?: string;

  @ApiPropertyOptional({ example: 8, description: 'Esforço estimado em horas' })
  @IsOptional()
  @IsNumber()
  estimatedEffortHours?: number;
}

export class CreateModernizationPlanDto {
  @ApiProperty({ example: 'Migração do ORM TypeORM para Prisma' })
  @IsString()
  title: string;

  @ApiProperty({ enum: ModernizationStrategy, example: ModernizationStrategy.REPLACE })
  @IsEnum(ModernizationStrategy)
  strategy: ModernizationStrategy;

  @ApiProperty({ example: 'TypeORM possui limitações de performance em queries complexas' })
  @IsString()
  rationale: string;

  @ApiPropertyOptional({ example: ['case-management', 'ehr'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedComponents?: string[];

  @ApiPropertyOptional({ example: 80, description: 'Duração estimada em horas' })
  @IsOptional()
  @IsNumber()
  estimatedDurationHours?: number;
}

export class AssessDependencyDto {
  @ApiProperty({ example: '@nestjs/core' })
  @IsString()
  packageName: string;

  @ApiProperty({ example: '10.3.2' })
  @IsString()
  currentVersion: string;

  @ApiPropertyOptional({ example: '10.4.0' })
  @IsOptional()
  @IsString()
  latestVersion?: string;

  @ApiPropertyOptional({ example: 'MIT' })
  @IsOptional()
  @IsString()
  license?: string;
}
