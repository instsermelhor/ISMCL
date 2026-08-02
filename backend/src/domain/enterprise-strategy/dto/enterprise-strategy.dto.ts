import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum StrategicPlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ARCHIVED = 'ARCHIVED',
}

export enum OKRLevel {
  INSTITUTIONAL = 'INSTITUTIONAL',
  BOARD = 'BOARD',
  COORDINATION = 'COORDINATION',
  TEAM = 'TEAM',
}

export enum OKRStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  AT_RISK = 'AT_RISK',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BscPerspective {
  INSTITUTIONAL_SOCIAL = 'INSTITUTIONAL_SOCIAL',
  BENEFICIARIES = 'BENEFICIARIES',
  INTERNAL_PROCESSES = 'INTERNAL_PROCESSES',
  LEARNING_INNOVATION = 'LEARNING_INNOVATION',
  FINANCIAL_SUSTAINABILITY = 'FINANCIAL_SUSTAINABILITY',
  GOVERNANCE = 'GOVERNANCE',
}

export enum KpiCategory {
  SOCIAL_IMPACT = 'SOCIAL_IMPACT',
  CARE = 'CARE',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  SOCIAL_ASSISTANCE = 'SOCIAL_ASSISTANCE',
  VOLUNTEERING = 'VOLUNTEERING',
  FINANCE = 'FINANCE',
  COMPLIANCE = 'COMPLIANCE',
  TECHNOLOGY = 'TECHNOLOGY',
  SECURITY = 'SECURITY',
  INNOVATION = 'INNOVATION',
}

export enum KpiPeriodicity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

export enum StrategicRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum StrategicRiskCategory {
  INSTITUTIONAL = 'INSTITUTIONAL',
  FINANCIAL = 'FINANCIAL',
  REGULATORY = 'REGULATORY',
  TECHNOLOGICAL = 'TECHNOLOGICAL',
  OPERATIONAL = 'OPERATIONAL',
  REPUTATIONAL = 'REPUTATIONAL',
}

export enum PortfolioItemType {
  PROGRAM = 'PROGRAM',
  PROJECT = 'PROJECT',
  INITIATIVE = 'INITIATIVE',
}

export enum PortfolioItemStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ── STRATEGIC PLANNING DTOs ───────────────────────────────────────────────────

export class CreateStrategicPlanDto {
  @ApiProperty({ example: 'Plano Estratégico ISM 2024–2027' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Promover o desenvolvimento humano e social de forma integral' })
  @IsString()
  mission: string;

  @ApiProperty({ example: 'Ser referência nacional em inovação social sustentável' })
  @IsString()
  vision: string;

  @ApiPropertyOptional({ example: ['Dignidade Humana', 'Transparência', 'Inovação'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];

  @ApiPropertyOptional({ example: ['Evidência', 'Escuta Ativa', 'Colaboração'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  principles?: string[];

  @ApiProperty({ example: 2024 })
  @IsNumber()
  startYear: number;

  @ApiProperty({ example: 2027 })
  @IsNumber()
  endYear: number;
}

// ── OKR DTOs ─────────────────────────────────────────────────────────────────

export class CreateOKRDto {
  @ApiProperty({ example: 'Ampliar cobertura de atendimento psicossocial' })
  @IsString()
  objective: string;

  @ApiProperty({ enum: OKRLevel, example: OKRLevel.INSTITUTIONAL })
  @IsEnum(OKRLevel)
  level: OKRLevel;

  @ApiProperty({ example: 'Q1-2025' })
  @IsString()
  cycle: string;

  @ApiProperty({ example: 'Diretoria de Atendimento' })
  @IsString()
  owner: string;

  @ApiPropertyOptional({ example: 'okr-parent-001' })
  @IsOptional()
  @IsString()
  parentOkrId?: string;

  @ApiPropertyOptional({
    example: [
      { description: 'Atingir 1.200 atendimentos mensais', target: 1200, unit: 'atendimentos' },
    ],
  })
  @IsOptional()
  @IsArray()
  keyResults?: Array<{ description: string; target: number; unit: string }>;
}

export class UpdateOKRProgressDto {
  @ApiProperty({ example: 'okr-001' })
  @IsString()
  okrId: string;

  @ApiProperty({ example: 'kr-001' })
  @IsString()
  keyResultId: string;

  @ApiProperty({ example: 850 })
  @IsNumber()
  currentValue: number;

  @ApiPropertyOptional({ example: 'Crescimento acelerado em março' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ── BSC DTOs ──────────────────────────────────────────────────────────────────

export class CreateBscObjectiveDto {
  @ApiProperty({ example: 'Maximizar impacto social por beneficiário atendido' })
  @IsString()
  description: string;

  @ApiProperty({ enum: BscPerspective, example: BscPerspective.BENEFICIARIES })
  @IsEnum(BscPerspective)
  perspective: BscPerspective;

  @ApiProperty({ example: 'Plano Estratégico ISM 2024–2027' })
  @IsString()
  strategicPlanId: string;

  @ApiPropertyOptional({ example: ['kpi-social-impact-001', 'kpi-care-002'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  linkedKpiIds?: string[];
}

// ── KPI DTOs ──────────────────────────────────────────────────────────────────

export class CreateKpiDto {
  @ApiProperty({ example: 'Taxa de Reinserção Social' })
  @IsString()
  name: string;

  @ApiProperty({ enum: KpiCategory, example: KpiCategory.SOCIAL_IMPACT })
  @IsEnum(KpiCategory)
  category: KpiCategory;

  @ApiProperty({ example: '(Beneficiários Reinsertos / Total Atendidos) * 100' })
  @IsString()
  formula: string;

  @ApiProperty({ enum: KpiPeriodicity, example: KpiPeriodicity.MONTHLY })
  @IsEnum(KpiPeriodicity)
  periodicity: KpiPeriodicity;

  @ApiProperty({ example: 'Coordenação de Impacto Social' })
  @IsString()
  owner: string;

  @ApiProperty({ example: 'Sistema de Gestão de Casos' })
  @IsString()
  dataSource: string;

  @ApiPropertyOptional({ example: { min: 40, target: 65, stretch: 80 } })
  @IsOptional()
  @IsObject()
  targets?: { min?: number; target?: number; stretch?: number };

  @ApiPropertyOptional({ example: '%' })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class RecordKpiValueDto {
  @ApiProperty({ example: 'kpi-001' })
  @IsString()
  kpiId: string;

  @ApiProperty({ example: 62.5 })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ example: '2025-01' })
  @IsOptional()
  @IsString()
  period?: string;
}

// ── PORTFOLIO DTOs ────────────────────────────────────────────────────────────

export class CreatePortfolioItemDto {
  @ApiProperty({ example: 'Programa Saúde Mental Comunitária 2025' })
  @IsString()
  name: string;

  @ApiProperty({ enum: PortfolioItemType, example: PortfolioItemType.PROGRAM })
  @IsEnum(PortfolioItemType)
  type: PortfolioItemType;

  @ApiProperty({ example: 'Ampliar acesso a saúde mental em comunidades vulneráveis' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'okr-001' })
  @IsString()
  linkedOkrId: string;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Diretora Clínica' })
  @IsOptional()
  @IsString()
  sponsor?: string;
}

// ── BUDGET DTOs ───────────────────────────────────────────────────────────────

export class AlignBudgetDto {
  @ApiProperty({ example: 'portfolio-item-001' })
  @IsString()
  portfolioItemId: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  allocatedAmount: number;

  @ApiProperty({ example: 'Convênio Municipal de Saúde Mental' })
  @IsString()
  fundingSource: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @IsNumber()
  fiscalYear?: number;
}

// ── STRATEGIC RISK DTOs ───────────────────────────────────────────────────────

export class CreateStrategicRiskDto {
  @ApiProperty({ example: 'Redução de repasses governamentais para OSCs' })
  @IsString()
  description: string;

  @ApiProperty({ enum: StrategicRiskCategory, example: StrategicRiskCategory.FINANCIAL })
  @IsEnum(StrategicRiskCategory)
  category: StrategicRiskCategory;

  @ApiProperty({ enum: StrategicRiskLevel, example: StrategicRiskLevel.HIGH })
  @IsEnum(StrategicRiskLevel)
  likelihood: StrategicRiskLevel;

  @ApiProperty({ enum: StrategicRiskLevel, example: StrategicRiskLevel.CRITICAL })
  @IsEnum(StrategicRiskLevel)
  impact: StrategicRiskLevel;

  @ApiProperty({ example: 'okr-001' })
  @IsString()
  linkedObjectiveId: string;

  @ApiPropertyOptional({ example: 'Diversificação de fontes de financiamento' })
  @IsOptional()
  @IsString()
  mitigationPlan?: string;
}
