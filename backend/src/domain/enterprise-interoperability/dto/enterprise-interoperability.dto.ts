import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── ENUMS ────────────────────────────────────────────────────────────────────

export enum PartnerType {
  GOVERNMENT_BODY = 'GOVERNMENT_BODY',
  HEALTHCARE_PROVIDER = 'HEALTHCARE_PROVIDER',
  SOCIAL_ASSISTANCE = 'SOCIAL_ASSISTANCE',
  EDUCATION_INSTITUTION = 'EDUCATION_INSTITUTION',
  JUSTICE_SYSTEM = 'JUSTICE_SYSTEM',
  IDENTITY_PROVIDER = 'IDENTITY_PROVIDER',
  FINANCIAL_PLATFORM = 'FINANCIAL_PLATFORM',
  ELECTRONIC_SIGNATURE = 'ELECTRONIC_SIGNATURE',
  DOCUMENT_STORAGE = 'DOCUMENT_STORAGE',
  COMMUNICATION_PROVIDER = 'COMMUNICATION_PROVIDER',
  NON_PROFIT_PARTNER = 'NON_PROFIT_PARTNER',
}

export enum ProtocolType {
  REST_OPENAPI = 'REST_OPENAPI',
  GRAPHQL = 'GRAPHQL',
  GRPC = 'GRPC',
  WEBHOOK = 'WEBHOOK',
  EVENT_DRIVEN_KAFKA = 'EVENT_DRIVEN_KAFKA',
  SOAP_LEGACY = 'SOAP_LEGACY',
}

export enum ConsentStatus {
  GRANTED = 'GRANTED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
}

export enum ConnectorType {
  SUS_RNDS = 'SUS_RNDS',
  E_SUS_APS = 'E_SUS_APS',
  SUAS_CADUNICO = 'SUAS_CADUNICO',
  GOV_BR_SSO = 'GOV_BR_SSO',
  INTEROP_FHIR_HL7 = 'INTEROP_FHIR_HL7',
  E_SIGNATURE_ICP_BR = 'E_SIGNATURE_ICP_BR',
  FINANCIAL_OPEN_BANKING = 'FINANCIAL_OPEN_BANKING',
  S3_DOCUMENT_VAULT = 'S3_DOCUMENT_VAULT',
  COMMUNICATION_WHATSAPP_SMS = 'COMMUNICATION_WHATSAPP_SMS',
  CUSTOM_PARTNER_API = 'CUSTOM_PARTNER_API',
}

export enum IntegrationSecurityLevel {
  PUBLIC = 'PUBLIC',
  STANDARD_AUTHENTICATED = 'STANDARD_AUTHENTICATED',
  HIGH_CONFIDENTIALITY = 'HIGH_CONFIDENTIALITY',
  MTLS_STRICT = 'MTLS_STRICT',
  ZERO_TRUST_CRITICAL = 'ZERO_TRUST_CRITICAL',
}

export enum ExchangeStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
  BLOCKED_BY_GOVERNANCE = 'BLOCKED_BY_GOVERNANCE',
  BLOCKED_BY_CONSENT = 'BLOCKED_BY_CONSENT',
  RETRYING = 'RETRYING',
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

// ── DTOS — PARTNER INTEGRATION ───────────────────────────────────────────────

export class RegisterPartnerDto {
  @ApiProperty({ example: 'MINISTERIO_DA_SAUDE_SUS' })
  @IsString()
  partnerCode: string;

  @ApiProperty({ example: 'Ministério da Saúde — Rede Nacional de Dados em Saúde (RNDS)' })
  @IsString()
  name: string;

  @ApiProperty({ enum: PartnerType, example: PartnerType.HEALTHCARE_PROVIDER })
  @IsEnum(PartnerType)
  partnerType: PartnerType;

  @ApiProperty({ example: 'rnds-integrator@saude.gov.br' })
  @IsString()
  contactEmail: string;

  @ApiProperty({ example: ['fhir_r4_clinical_notes', 'immunization_records'] })
  @IsArray()
  @IsString({ each: true })
  allowedScopes: string[];

  @ApiPropertyOptional({ example: '99.9%' })
  @IsOptional()
  @IsString()
  targetSla?: string;

  @ApiPropertyOptional({ example: 'CNPJ: 00.394.544/0001-51' })
  @IsOptional()
  @IsString()
  contractRef?: string;
}

// ── DTOS — CONNECTOR CONFIGURATION ──────────────────────────────────────────

export class ConfigureConnectorDto {
  @ApiProperty({ enum: ConnectorType, example: ConnectorType.SUS_RNDS })
  @IsEnum(ConnectorType)
  connectorType: ConnectorType;

  @ApiProperty({ example: 'Conector de Integração RNDS/FHIR R4' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://rnds-api.saude.gov.br/v1' })
  @IsString()
  endpointUrl: string;

  @ApiProperty({ enum: ProtocolType, example: ProtocolType.REST_OPENAPI })
  @IsEnum(ProtocolType)
  protocol: ProtocolType;

  @ApiProperty({ enum: IntegrationSecurityLevel, example: IntegrationSecurityLevel.MTLS_STRICT })
  @IsEnum(IntegrationSecurityLevel)
  securityLevel: IntegrationSecurityLevel;

  @ApiPropertyOptional({ example: { timeoutMs: 5000, retryAttempts: 3 } })
  @IsOptional()
  @IsObject()
  configPayload?: Record<string, any>;
}

// ── DTOS — API GATEWAY ───────────────────────────────────────────────────────

export class ApiGatewayRouteDto {
  @ApiProperty({ example: '/api/v1/interop/rnds/clinical-summary' })
  @IsString()
  path: string;

  @ApiProperty({ example: 'GET' })
  @IsString()
  method: string;

  @ApiProperty({ example: 'MINISTERIO_DA_SAUDE_SUS' })
  @IsString()
  targetPartnerCode: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  rateLimitPerMinute: number;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  monthlyQuota: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  requireMtls: boolean;

  @ApiPropertyOptional({ example: 'v1.2' })
  @IsOptional()
  @IsString()
  apiVersion?: string;
}

// ── DTOS — CONSENT MANAGEMENT ────────────────────────────────────────────────

export class CreateConsentDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: 'BEN-2026-0001' })
  @IsString()
  beneficiaryId: string;

  @ApiProperty({ example: 'MINISTERIO_DA_SAUDE_SUS' })
  @IsString()
  partnerCode: string;

  @ApiProperty({ example: 'Compartilhamento de histórico clínico para continuidade assistencial no SUS' })
  @IsString()
  purpose: string;

  @ApiProperty({ example: ['ehr_summary', 'prescriptions', 'vaccines'] })
  @IsArray()
  @IsString({ each: true })
  allowedDataScope: string[];

  @ApiProperty({ example: '2027-12-31T23:59:59Z' })
  @IsString()
  validUntil: string;

  @ApiPropertyOptional({ example: 'TERMO-CONSENT-LGPD-2026-V1' })
  @IsOptional()
  @IsString()
  legalTermsRef?: string;
}

export class RevokeConsentDto {
  @ApiProperty({ example: 'CNS-2026-0001' })
  @IsString()
  consentId: string;

  @ApiProperty({ example: 'Solicitação direta do beneficiário via Portal de Privacidade' })
  @IsString()
  revocationReason: string;

  @ApiProperty({ example: 'BEN-2026-0001' })
  @IsString()
  requestedBy: string;
}

// ── DTOS — DATA EXCHANGE ─────────────────────────────────────────────────────

export class DataExchangeTransactionDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: 'MINISTERIO_DA_SAUDE_SUS' })
  @IsString()
  partnerCode: string;

  @ApiProperty({ enum: ConnectorType, example: ConnectorType.SUS_RNDS })
  @IsEnum(ConnectorType)
  connectorType: ConnectorType;

  @ApiProperty({ enum: ProtocolType, example: ProtocolType.REST_OPENAPI })
  @IsEnum(ProtocolType)
  protocol: ProtocolType;

  @ApiProperty({ example: 'CLINICAL_SUMMARY_EXPORT' })
  @IsString()
  transactionType: string;

  @ApiProperty({ example: { beneficiaryId: 'BEN-2026-0001', recordType: 'EHR' } })
  @IsObject()
  payload: Record<string, any>;

  @ApiPropertyOptional({ example: 'CNS-2026-0001' })
  @IsOptional()
  @IsString()
  consentId?: string;
}

// ── DTOS — GOVERNANCE & AUDIT ────────────────────────────────────────────────

export class IntegrationGovernanceCheckDto {
  @ApiProperty({ example: 'MINISTERIO_DA_SAUDE_SUS' })
  @IsString()
  partnerCode: string;

  @ApiProperty({ enum: ProtocolType, example: ProtocolType.REST_OPENAPI })
  @IsEnum(ProtocolType)
  protocol: ProtocolType;

  @ApiProperty({ example: 'https://rnds-api.saude.gov.br/v1' })
  @IsString()
  targetEndpoint: string;

  @ApiProperty({ example: ['ehr_summary'] })
  @IsArray()
  @IsString({ each: true })
  requestedScopes: string[];
}

export class RecordExternalAuditDto {
  @ApiProperty({ example: 'enterprise-integration-service' })
  @IsString()
  serviceName: string;

  @ApiProperty({ example: 'DATA_EXCHANGE_EXECUTED' })
  @IsString()
  actionName: string;

  @ApiProperty({ example: 'MINISTERIO_DA_SAUDE_SUS' })
  @IsString()
  partnerCode: string;

  @ApiProperty({ example: { transactionId: 'TX-2026-001', status: 'SUCCESS' } })
  @IsObject()
  details: Record<string, any>;

  @ApiPropertyOptional({ example: 'CISO-AUDITOR-01' })
  @IsOptional()
  @IsString()
  supervisorId?: string;
}
