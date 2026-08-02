import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject, IsBoolean } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum TenantStatus {
  PROVISIONING = 'PROVISIONING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export enum TenantTier {
  COMMUNITY_OSC = 'COMMUNITY_OSC',
  ENTERPRISE_FOUNDATION = 'ENTERPRISE_FOUNDATION',
  GOVERNMENTAL_PUBLIC = 'GOVERNMENTAL_PUBLIC',
  MAINTAINER_INSTITUTE = 'MAINTAINER_INSTITUTION', // Instituto Ser Melhor
}

export enum IsolationStrategy {
  LOGICAL_SHARED_DB = 'LOGICAL_SHARED_DB',
  SCHEMA_PER_TENANT = 'SCHEMA_PER_TENANT',
  DATABASE_PER_TENANT = 'DATABASE_PER_TENANT',
}

export enum FederationTrustLevel {
  NONE = 'NONE',
  LIMITED_REFERRAL_ONLY = 'LIMITED_REFERRAL_ONLY',
  FULL_DATA_SHARING = 'FULL_DATA_SHARING',
  CUSTOM_POLICY = 'CUSTOM_POLICY',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class RegisterTenantDto {
  @ApiProperty({ example: 'Fundação Vida & Esperança' })
  @IsString()
  organizationName: string;

  @ApiProperty({ example: 'vida-esperanca' })
  @IsString()
  tenantSlug: string;

  @ApiProperty({ enum: TenantTier, example: TenantTier.ENTERPRISE_FOUNDATION })
  @IsEnum(TenantTier)
  tier: TenantTier;

  @ApiPropertyOptional({ enum: IsolationStrategy, example: IsolationStrategy.SCHEMA_PER_TENANT })
  @IsOptional()
  @IsEnum(IsolationStrategy)
  isolationStrategy?: IsolationStrategy;

  @ApiPropertyOptional({ example: 'admin@vidaesperanca.org.br' })
  @IsOptional()
  @IsString()
  adminEmail?: string;
}

export class ConfigureWhiteLabelDto {
  @ApiProperty({ example: 'vida-esperanca' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: 'https://painel.vidaesperanca.org.br' })
  @IsString()
  customDomain: string;

  @ApiPropertyOptional({ example: 'https://cdn.vidaesperanca.org.br/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#1A365D' })
  @IsOptional()
  @IsString()
  primaryColorHex?: string;

  @ApiPropertyOptional({ example: ['social-erp', 'mental-health', 'impact-analytics'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledModules?: string[];
}

export class EstablishFederationDto {
  @ApiProperty({ example: 'tenant-ser-melhor-01' })
  @IsString()
  sourceTenantId: string;

  @ApiProperty({ example: 'vida-esperanca' })
  @IsString()
  targetTenantId: string;

  @ApiProperty({ enum: FederationTrustLevel, example: FederationTrustLevel.LIMITED_REFERRAL_ONLY })
  @IsEnum(FederationTrustLevel)
  trustLevel: FederationTrustLevel;

  @ApiPropertyOptional({ example: 'Acordo bilateral de encaminhamento psicossocial inter-institucional' })
  @IsOptional()
  @IsString()
  agreementDetails?: string;
}

export class ReviewTenantDto {
  @ApiProperty({ example: 'vida-esperanca' })
  @IsString()
  tenantId: string;

  @ApiProperty({ enum: TenantStatus, example: TenantStatus.ACTIVE })
  @IsEnum(TenantStatus)
  targetStatus: TenantStatus;

  @ApiProperty({ example: 'Homologação e auditoria de isolamento concluídas' })
  @IsString()
  reason: string;

  @ApiProperty({ example: 'CPlO' })
  @IsString()
  reviewedBy: string;
}
