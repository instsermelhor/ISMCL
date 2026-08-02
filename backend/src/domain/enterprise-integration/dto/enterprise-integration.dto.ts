import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject, IsBoolean } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum IntegrationProtocol {
  REST = 'REST',
  GRAPHQL = 'GRAPHQL',
  GRPC = 'GRPC',
  WEBHOOK = 'WEBHOOK',
  EVENT_DRIVEN_KAFKA = 'EVENT_DRIVEN_KAFKA',
  SAML2 = 'SAML2',
  OAUTH2_1 = 'OAUTH2_1',
}

export enum PartnerType {
  GOVERNMENTAL = 'GOVERNMENTAL',
  HEALTHCARE_PROVIDER = 'HEALTHCARE_PROVIDER',
  SOCIAL_ASSISTANCE = 'SOCIAL_ASSISTANCE',
  EDUCATIONAL = 'EDUCATIONAL',
  FINANCIAL_INSTITUTION = 'FINANCIAL_INSTITUTION',
  IDENTITY_PROVIDER = 'IDENTITY_PROVIDER',
  AUDIT_FIRM = 'AUDIT_FIRM',
  NGO_PARTNER = 'NGO_PARTNER',
}

export enum IntegrationStatus {
  PROPOSED = 'PROPOSED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DEPRECATED = 'DEPRECATED',
}

export enum SecurityLevel {
  STANDARD_TLS = 'STANDARD_TLS',
  MTLS_STRICT = 'MTLS_STRICT',
  ZERO_TRUST_SIGNED = 'ZERO_TRUST_SIGNED',
  END_TO_END_ENCRYPTED = 'END_TO_END_ENCRYPTED',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class RegisterPartnerDto {
  @ApiProperty({ example: 'Ministério do Desenvolvimento Social' })
  @IsString()
  partnerName: string;

  @ApiProperty({ enum: PartnerType, example: PartnerType.GOVERNMENTAL })
  @IsEnum(PartnerType)
  partnerType: PartnerType;

  @ApiProperty({ example: 'suporte@mds.gov.br' })
  @IsString()
  contactEmail: string;

  @ApiPropertyOptional({ example: { targetSlaPercent: 99.9, maxRequestsPerMinute: 1000 } })
  @IsOptional()
  @IsObject()
  slaPolicy?: Record<string, any>;
}

export class CreateIntegrationDto {
  @ApiProperty({ example: 'Integração Cadastro Único SUAS' })
  @IsString()
  integrationName: string;

  @ApiProperty({ example: 'PARTNER-GOV-01' })
  @IsString()
  partnerId: string;

  @ApiProperty({ enum: IntegrationProtocol, example: IntegrationProtocol.REST })
  @IsEnum(IntegrationProtocol)
  protocol: IntegrationProtocol;

  @ApiProperty({ enum: SecurityLevel, example: SecurityLevel.MTLS_STRICT })
  @IsEnum(SecurityLevel)
  securityLevel: SecurityLevel;

  @ApiPropertyOptional({ example: 'https://api.cadunico.gov.br/v1/beneficiarios' })
  @IsOptional()
  @IsString()
  targetEndpointUrl?: string;

  @ApiPropertyOptional({ example: ['read:beneficiary_status', 'write:attendance_log'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedScopes?: string[];
}

export class ReviewIntegrationDto {
  @ApiProperty({ example: 'INT-89123' })
  @IsString()
  integrationId: string;

  @ApiProperty({ enum: IntegrationStatus, example: IntegrationStatus.APPROVED })
  @IsEnum(IntegrationStatus)
  decision: IntegrationStatus.APPROVED | IntegrationStatus.REJECTED;

  @ApiProperty({ example: 'Homologado após auditoria CISO e mTLS verificado' })
  @IsString()
  reviewNotes: string;

  @ApiProperty({ example: 'CInO' })
  @IsString()
  reviewedBy: string;
}

export class PublishEventToExchangeDto {
  @ApiProperty({ example: 'aura.external.partner.data.synced.v1' })
  @IsString()
  topic: string;

  @ApiProperty({ example: { partnerId: 'PARTNER-GOV-01', recordsSynced: 150 } })
  @IsObject()
  payload: Record<string, any>;
}
