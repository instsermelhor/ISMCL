import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Enumerações de Domínio ─────────────────────────────────────────────────

export enum DataMartType {
  SOCIAL_CARE = 'SOCIAL_CARE',
  PSYCHOLOGY = 'PSYCHOLOGY',
  PSYCHIATRY = 'PSYCHIATRY',
  FINANCIAL = 'FINANCIAL',
  HUMAN_RESOURCES = 'HUMAN_RESOURCES',
  GOVERNANCE = 'GOVERNANCE',
  COMPLIANCE = 'COMPLIANCE',
  VOLUNTEER = 'VOLUNTEER',
  EXECUTIVE = 'EXECUTIVE',
}

export enum KpiCategory {
  ASSISTENTIAL = 'ASSISTENTIAL',
  CLINICAL = 'CLINICAL',
  SOCIAL = 'SOCIAL',
  FINANCIAL = 'FINANCIAL',
  OPERATIONAL = 'OPERATIONAL',
  GOVERNANCE = 'GOVERNANCE',
}

export enum KpiTrend {
  UPWARD = 'UPWARD',
  DOWNWARD = 'DOWNWARD',
  STABLE = 'STABLE',
}

export enum PredictionType {
  DROPOUT_RISK = 'DROPOUT_RISK',         // Risco de abandono do tratamento
  DEMAND_FORECAST = 'DEMAND_FORECAST',     // Previsão de demanda por especialidade
  RESOURCE_OVERLOAD = 'RESOURCE_OVERLOAD', // Sobrecarga operacional
  RECURRENCE_RISK = 'RECURRENCE_RISK',   // Risco de reincidência de vulnerabilidade
}

export enum ReportFormat {
  PDF = 'PDF',
  XLSX = 'XLSX',
  CSV = 'CSV',
  JSON = 'JSON',
}

export enum DataClassification {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED',
  SENSITIVE_HEALTH = 'SENSITIVE_HEALTH', // LGPD Art. 11
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class CreateKpiDto {
  @ApiProperty({ description: 'Código único do KPI', example: 'KPI-ATTENDANCE-RATE' })
  @IsString()
  kpiCode: string;

  @ApiProperty({ description: 'Nome descritivo do KPI', example: 'Taxa de Presença nos Atendimentos' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição da métrica e fórmula de cálculo' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Categoria do KPI', enum: KpiCategory })
  @IsEnum(KpiCategory)
  category: KpiCategory;

  @ApiProperty({ description: 'Unidade de medida (ex: "%", "horas", "casos")' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Meta estabelecida para o indicador' })
  @IsNumber()
  targetValue: number;

  @ApiPropertyOptional({ description: 'Fórmula SQL/Expressão de cálculo' })
  @IsOptional()
  @IsString()
  calculationFormula?: string;

  @ApiPropertyOptional({ description: 'Frequência de atualização em minutos', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  refreshIntervalMinutes?: number;
}

export class PredictiveModelQueryDto {
  @ApiProperty({ description: 'Tipo de predição desejada', enum: PredictionType })
  @IsEnum(PredictionType)
  type: PredictionType;

  @ApiProperty({ description: 'ID do beneficiário / entidade sob análise' })
  @IsString()
  entityId: string;

  @ApiPropertyOptional({ description: 'Variáveis contextuais adicionais' })
  @IsOptional()
  @IsObject()
  features?: Record<string, unknown>;
}

export class GenerateReportDto {
  @ApiProperty({ description: 'Título do relatório' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Data Mart de origem', enum: DataMartType })
  @IsEnum(DataMartType)
  dataMart: DataMartType;

  @ApiProperty({ description: 'Formato de saída', enum: ReportFormat })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ description: 'Filtro por data inicial (ISO 8601)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filtro por data final (ISO 8601)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'IDs de filtros específicos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filterIds?: string[];
}

export class RegisterDataAssetDto {
  @ApiProperty({ description: 'Nome do ativo de dados (tabela/tabela fato)' })
  @IsString()
  assetName: string;

  @ApiProperty({ description: 'Descrição da finalidade do ativo' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Classificação de sensibilidade LGPD', enum: DataClassification })
  @IsEnum(DataClassification)
  classification: DataClassification;

  @ApiProperty({ description: 'Dono do dado / Encarregado (DPO/Curador)' })
  @IsString()
  owner: string;

  @ApiPropertyOptional({ description: 'Período de retenção em meses', default: 60 })
  @IsOptional()
  @IsNumber()
  retentionMonths?: number;
}
