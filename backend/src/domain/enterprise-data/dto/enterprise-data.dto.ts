import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject, IsBoolean } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum DataDomain {
  BENEFICIARIES = 'BENEFICIARIES',
  HEALTH_CARE = 'HEALTH_CARE',
  SOCIAL_ASSISTANCE = 'SOCIAL_ASSISTANCE',
  VOLUNTEERS = 'VOLUNTEERS',
  HUMAN_RESOURCES = 'HUMAN_RESOURCES',
  FINANCIAL = 'FINANCIAL',
  GOVERNANCE = 'GOVERNANCE',
  TECHNOLOGY = 'TECHNOLOGY',
}

export enum MasterEntityCategory {
  BENEFICIARY = 'BENEFICIARY',
  PROFESSIONAL = 'PROFESSIONAL',
  VOLUNTEER = 'VOLUNTEER',
  EMPLOYEE = 'EMPLOYEE',
  PARTNER = 'PARTNER',
  PROGRAM = 'PROGRAM',
  PROJECT = 'PROJECT',
  ORGANIZATION = 'ORGANIZATION',
  ASSET = 'ASSET',
}

export enum DataSensitivity {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED', // Sensitive Personal Data (LGPD Art. 5º II)
}

export enum DataQualityDimension {
  COMPLETENESS = 'COMPLETENESS',
  CONSISTENCY = 'CONSISTENCY',
  UNIQUENESS = 'UNIQUENESS',
  ACCURACY = 'ACCURACY',
  TIMELINESS = 'TIMELINESS',
  REFERENTIAL_INTEGRITY = 'REFERENTIAL_INTEGRITY',
  CONFORMITY = 'CONFORMITY',
}

// ── DATA GOVERNANCE DTOs ──────────────────────────────────────────────────────

export class DefineDataDomainDto {
  @ApiProperty({ enum: DataDomain, example: DataDomain.BENEFICIARIES })
  @IsEnum(DataDomain)
  domain: DataDomain;

  @ApiProperty({ example: 'Dra. Maria Silva (Diretoria Social)' })
  @IsString()
  owner: string;

  @ApiProperty({ example: 'Coord. João Pereira' })
  @IsString()
  steward: string;

  @ApiProperty({ example: 'Dados cadastrais, histórico assistencial e prontuários' })
  @IsString()
  description: string;

  @ApiProperty({ enum: DataSensitivity, example: DataSensitivity.RESTRICTED })
  @IsEnum(DataSensitivity)
  defaultSensitivity: DataSensitivity;

  @ApiPropertyOptional({ example: 10, description: 'Anos de retenção legal' })
  @IsOptional()
  @IsNumber()
  retentionYears?: number;
}

// ── MDM DTOs ──────────────────────────────────────────────────────────────────

export class CreateGoldenRecordDto {
  @ApiProperty({ enum: MasterEntityCategory, example: MasterEntityCategory.BENEFICIARY })
  @IsEnum(MasterEntityCategory)
  category: MasterEntityCategory;

  @ApiProperty({ example: '123.456.789-00' })
  @IsString()
  primaryNaturalKey: string;

  @ApiProperty({ example: { fullName: 'Maria das Dores Santos', birthDate: '1985-04-12', cpf: '12345678900' } })
  @IsObject()
  goldenAttributes: Record<string, any>;

  @ApiPropertyOptional({ example: ['EHR-SYS-001', 'ERP-SOC-102'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceSystemIds?: string[];
}

export class ResolveIdentityDto {
  @ApiProperty({ enum: MasterEntityCategory, example: MasterEntityCategory.BENEFICIARY })
  @IsEnum(MasterEntityCategory)
  category: MasterEntityCategory;

  @ApiProperty({ example: { fullName: 'Maria D. Santos', cpf: '12345678900' } })
  @IsObject()
  candidateRecord: Record<string, any>;
}

// ── DATA CONTRACT DTOs ────────────────────────────────────────────────────────

export class PublishDataContractDto {
  @ApiProperty({ example: 'BeneficiaryEventsContract' })
  @IsString()
  contractName: string;

  @ApiProperty({ example: '1.0.0' })
  @IsString()
  version: string;

  @ApiProperty({ enum: DataDomain, example: DataDomain.BENEFICIARIES })
  @IsEnum(DataDomain)
  domain: DataDomain;

  @ApiProperty({ example: { type: 'object', required: ['beneficiaryId', 'action'], properties: { beneficiaryId: { type: 'string' } } } })
  @IsObject()
  schemaDefinition: Record<string, any>;

  @ApiProperty({ example: 'SocialImpactService' })
  @IsString()
  producerService: string;

  @ApiPropertyOptional({ example: ['AnalyticsEngine', 'ReportingService'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  consumerServices?: string[];
}

// ── DATA STEWARDSHIP DTOs ─────────────────────────────────────────────────────

export class StewardOverrideDto {
  @ApiProperty({ example: 'GOLDEN-BENEFICIARY-123' })
  @IsString()
  recordId: string;

  @ApiProperty({ example: { fullName: 'Maria das Dores dos Santos' } })
  @IsObject()
  correctedAttributes: Record<string, any>;

  @ApiProperty({ example: 'Certidão de nascimento apresentada fisicamente confirmando sobrenome correto' })
  @IsString()
  justification: string;

  @ApiProperty({ example: 'DataSteward-João' })
  @IsString()
  stewardName: string;
}
