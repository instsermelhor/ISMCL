import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum ImpactDimension {
  SHELTER_ACCOMMODATION = 'SHELTER_ACCOMMODATION',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  SOCIAL_ASSISTANCE = 'SOCIAL_ASSISTANCE',
  HUMAN_DEVELOPMENT = 'HUMAN_DEVELOPMENT',
  EDUCATION = 'EDUCATION',
  SOCIAL_PROTECTION = 'SOCIAL_PROTECTION',
  VOLUNTEERING = 'VOLUNTEERING',
  INSTITUTIONAL_MANAGEMENT = 'INSTITUTIONAL_MANAGEMENT',
  FINANCIAL_SUSTAINABILITY = 'FINANCIAL_SUSTAINABILITY',
  COMMUNITY_IMPACT = 'COMMUNITY_IMPACT',
}

export enum ProgramEvaluationMetric {
  REACH = 'REACH',
  COVERAGE = 'COVERAGE',
  EFFECTIVENESS = 'EFFECTIVENESS',
  EFFICIENCY = 'EFFICIENCY',
  SUSTAINABILITY = 'SUSTAINABILITY',
  SATISFACTION = 'SATISFACTION',
  COST_PER_OUTCOME = 'COST_PER_OUTCOME',
  SOCIAL_RETURN_ON_INVESTMENT = 'SOCIAL_RETURN_ON_INVESTMENT', // SROI
}

export enum ESGCategory {
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  SOCIAL = 'SOCIAL',
  GOVERNANCE = 'GOVERNANCE',
  DIVERSITY_INCLUSION = 'DIVERSITY_INCLUSION',
  ACCESSIBILITY = 'ACCESSIBILITY',
  INSTITUTIONAL_RESPONSIBILITY = 'INSTITUTIONAL_RESPONSIBILITY',
}

export enum AccountabilityReportType {
  SPONSOR_REPORT = 'SPONSOR_REPORT',
  AUDIT_REPORT = 'AUDIT_REPORT',
  BOARD_REPORT = 'BOARD_REPORT',
  PUBLIC_TRANSPARENCY_REPORT = 'PUBLIC_TRANSPARENCY_REPORT',
  SOCIAL_IMPACT_ANNUAL_REPORT = 'SOCIAL_IMPACT_ANNUAL_REPORT',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class CalculateSocialImpactDto {
  @ApiProperty({ enum: ImpactDimension, example: ImpactDimension.MENTAL_HEALTH })
  @IsEnum(ImpactDimension)
  dimension: ImpactDimension;

  @ApiPropertyOptional({ example: '2026-Q1' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ example: 'Região Metropolitana SP' })
  @IsOptional()
  @IsString()
  territory?: string;
}

export class RecordBeneficiaryEvolutionDto {
  @ApiProperty({ example: 'BENEF-PSEUDO-891273', description: 'ID pseudonimizado conforme LGPD' })
  @IsString()
  pseudonymizedBeneficiaryId: string;

  @ApiProperty({ example: 'Programa Acolher' })
  @IsString()
  programName: string;

  @ApiProperty({ example: 42, description: 'Score inicial de qualidade de vida (0-100)' })
  @IsNumber()
  initialQualityOfLifeScore: number;

  @ApiProperty({ example: 88, description: 'Score atual de qualidade de vida (0-100)' })
  @IsNumber()
  currentQualityOfLifeScore: number;

  @ApiPropertyOptional({ example: 'Acompanhamento pós-alta institucional em andamento' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class EvaluateProgramDto {
  @ApiProperty({ example: 'Programa Acolher & Reintegrar' })
  @IsString()
  programId: string;

  @ApiPropertyOptional({ example: 1200, description: 'Número total de beneficiários atendidos' })
  @IsOptional()
  @IsNumber()
  beneficiariesServed?: number;

  @ApiPropertyOptional({ example: 450.0, description: 'Custo por resultado em BRL' })
  @IsOptional()
  @IsNumber()
  costPerOutcomeBrl?: number;
}

export class GenerateAccountabilityReportDto {
  @ApiProperty({ enum: AccountabilityReportType, example: AccountabilityReportType.SPONSOR_REPORT })
  @IsEnum(AccountabilityReportType)
  reportType: AccountabilityReportType;

  @ApiProperty({ example: 'Conselho Consultivo ISM' })
  @IsString()
  targetAudience: string;

  @ApiPropertyOptional({ example: '2026-Q1/Q2' })
  @IsOptional()
  @IsString()
  period?: string;
}
