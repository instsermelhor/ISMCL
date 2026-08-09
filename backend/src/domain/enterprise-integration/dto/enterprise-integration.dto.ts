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

export enum IntegrationStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum SecurityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
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

  @ApiProperty({ example: '/api/v2/social/benefits' })
  @IsString()
  basePath: string;

  @ApiProperty({ example: 'Permite consulta e solicitação de benefícios sociais.' })
  @IsString()
  description: string;

  @ApiProperty({ enum: APILifecycleStage, example: APILifecycleStage.PUBLISHED })
  @IsEnum(APILifecycleStage)
  lifecycleStage: APILifecycleStage;
}

export class RegisterConnectorDto {
  @ApiProperty({ example: 'CONN-CADUNICO-GOV' })
  @IsString()
  connectorId: string;

  @ApiProperty({ example: 'Conector CadÚnico Governo Federal' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ConnectorType, example: ConnectorType.GOVERNMENT })
  @IsEnum(ConnectorType)
  type: ConnectorType;

  @ApiProperty({ example: 'Conecta ao sistema do Cadastro Único para validação de dados sociais.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'https://cadunico.gov.br/api/v1' })
  @IsString()
  endpointUrl: string;

  @ApiProperty({ example: 'mTLS + OAuth2' })
  @IsString()
  authenticationMethod: string;
}

export class RegisterWebhookDto {
  @ApiProperty({ example: 'WH-BENEFIT-NOTIFICATIONS' })
  @IsString()
  webhookId: string;

  @ApiProperty({ example: 'https://parceiro.org.br/webhooks/aura' })
  @IsString()
  targetUrl: string;

  @ApiProperty({ type: [String], example: ['aura.benefits.approved.v1', 'aura.benefits.cancelled.v1'] })
  @IsArray()
  @IsString({ each: true })
  subscribedEvents: string[];

  @ApiProperty({ example: 'PARTE-NGO-SAUDE' })
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

export class PublishEventToExchangeDto extends PublishEventMeshEventDto {}

export class ReviewIntegrationDto {
  @ApiProperty()
  @IsString()
  integrationId: string;

  @ApiProperty({ enum: IntegrationStatus })
  @IsEnum(IntegrationStatus)
  status: IntegrationStatus;

  @ApiProperty()
  @IsString()
  reviewerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
