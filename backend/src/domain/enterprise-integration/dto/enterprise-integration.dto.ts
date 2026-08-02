import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject, IsBoolean } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum APILifecycleStage {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
}

export enum ConnectorType {
  GOVERNMENT = 'GOVERNMENT',
  ERP = 'ERP',
  CRM = 'CRM',
  HEALTH_PLATFORM = 'HEALTH_PLATFORM',
  EDUCATION_PLATFORM = 'EDUCATION_PLATFORM',
  FINANCIAL = 'FINANCIAL',
  AUTH_PROVIDER = 'AUTH_PROVIDER',
  COMMUNICATION = 'COMMUNICATION',
  AI_PROVIDER = 'AI_PROVIDER',
  CUSTOM = 'CUSTOM',
}

export enum WebhookStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  FAILED = 'FAILED',
  RETIRED = 'RETIRED',
}

export enum PartnerStatus {
  PENDING = 'PENDING',
  SANDBOX = 'SANDBOX',
  HOMOLOGATED = 'HOMOLOGATED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum EventMeshRoutingPolicy {
  BROADCAST = 'BROADCAST',
  TOPIC_FILTER = 'TOPIC_FILTER',
  CONTENT_FILTER = 'CONTENT_FILTER',
  PRIORITY = 'PRIORITY',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class RegisterAPIDto {
  @ApiProperty({ example: 'API-SOCIAL-BENEFITS-V2' })
  @IsString()
  apiId: string;

  @ApiProperty({ example: 'API de Gestão de Benefícios Sociais' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2.0.0' })
  @IsString()
  version: string;

  @ApiProperty({ example: '/api/v2/benefits' })
  @IsString()
  basePath: string;

  @ApiProperty({ example: 'Equipe ISM — Plataforma Digital' })
  @IsString()
  owner: string;

  @ApiPropertyOptional({ example: 'Gerencia benefícios sociais para beneficiários do Instituto Ser Melhor.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 100, description: 'Rate limit em req/min' })
  @IsOptional()
  @IsNumber()
  rateLimitRpm?: number;
}

export class RegisterConnectorDto {
  @ApiProperty({ example: 'CONN-GOVBR-CPFVALIDATION' })
  @IsString()
  connectorId: string;

  @ApiProperty({ example: 'Validação de CPF via Gov.br' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ConnectorType, example: ConnectorType.GOVERNMENT })
  @IsEnum(ConnectorType)
  type: ConnectorType;

  @ApiProperty({ example: 'https://api.gov.br/cpf/validate' })
  @IsString()
  endpointUrl: string;

  @ApiProperty({ example: 'OAuth2' })
  @IsString()
  authMethod: string;
}

export class RegisterWebhookDto {
  @ApiProperty({ example: 'WH-BENEFIT-APPROVED' })
  @IsString()
  webhookId: string;

  @ApiProperty({ example: 'https://partner.org.br/hooks/benefit-notification' })
  @IsString()
  targetUrl: string;

  @ApiProperty({ example: ['BENEFIT_APPROVED', 'BENEFIT_REJECTED'] })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiProperty({ example: 'ISM-PARTNER-NGO-SAUDE' })
  @IsString()
  subscriberId: string;
}

export class RegisterPartnerDto {
  @ApiProperty({ example: 'PARTNER-NGO-SAUDE-SP' })
  @IsString()
  partnerId: string;

  @ApiProperty({ example: 'ONG Saúde para Todos — SP' })
  @IsString()
  partnerName: string;

  @ApiProperty({ example: 'ONG' })
  @IsString()
  partnerType: string;

  @ApiProperty({ example: 'integracao@saudesp.org.br' })
  @IsString()
  technicalContact: string;

  @ApiPropertyOptional({ example: ['READ_BENEFITS', 'READ_VOLUNTEERS'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requestedScopes?: string[];
}

export class PublishEventMeshEventDto {
  @ApiProperty({ example: 'aura.benefits.approved.v1' })
  @IsString()
  topic: string;

  @ApiProperty({ example: { beneficiaryId: 'B-001', benefitId: 'BEN-0042' } })
  @IsObject()
  payload: Record<string, any>;

  @ApiProperty({ example: 'EnterpriseIntegrationService' })
  @IsString()
  source: string;

  @ApiProperty({ enum: EventMeshRoutingPolicy, example: EventMeshRoutingPolicy.TOPIC_FILTER })
  @IsEnum(EventMeshRoutingPolicy)
  routingPolicy: EventMeshRoutingPolicy;
}
