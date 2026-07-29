import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

// ── Enumerações de Domínio de Integração ────────────────────────────────────

export enum IntegrationType {
  REST_API = 'REST_API',       // API RESTful OpenAPI 3.1
  GRAPHQL = 'GRAPHQL',         // API GraphQL Schema
  GRPC = 'GRPC',               // gRPC Protobuf
  WEBSOCKET = 'WEBSOCKET',     // WebSocket Realtime Stream
  WEBHOOK = 'WEBHOOK',         // Outbound / Inbound Webhook
  EVENT_BUS = 'EVENT_BUS',     // Event-Driven CloudEvents Bus
}

export enum ConnectorCategory {
  GOVERNMENT = 'GOVERNMENT',       // Sistemas Governamentais (SUS / CadÚnico / e-Social)
  FINANCIAL = 'FINANCIAL',         // Bancos / Open Finance / Pagamentos
  COMMUNICATION = 'COMMUNICATION', // WhatsApp / SMS / Email Gateway
  AI_PROVIDER = 'AI_PROVIDER',     // Gemini / OpenAI / Anthropic AI Hub
  CLOUD_STORAGE = 'CLOUD_STORAGE', // AWS S3 / Google Cloud Storage
  INSTITUTIONAL = 'INSTITUTIONAL', // Sistemas Legados / ERP
}

export enum IntegrationStatus {
  HOMOLOGATING = 'HOMOLOGATING', // Em Homologação
  ACTIVE = 'ACTIVE',             // Em Produção
  DEPRECATED = 'DEPRECATED',     // Obsoleto
  DISABLED = 'DISABLED',         // Desativado por Segurança
}

export enum SyncMode {
  REALTIME = 'REALTIME',       // Tempo Real (Streaming)
  BATCH = 'BATCH',             // Lote Agendado
  INCREMENTAL = 'INCREMENTAL', // Sincronização Incremental
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class RegisterApiDto {
  @ApiProperty({ description: 'Nome da API / Serviço' })
  @IsString()
  apiName: string;

  @ApiProperty({ description: 'Tipo de Protocolo de API', enum: IntegrationType })
  @IsEnum(IntegrationType)
  type: IntegrationType;

  @ApiProperty({ description: 'Versão da API (ex: v1, v2)' })
  @IsString()
  version: string;

  @ApiProperty({ description: 'Endpoint base da API' })
  @IsString()
  endpointUrl: string;

  @ApiPropertyOptional({ description: 'Quota diária de requisições (padrão: 100.000)' })
  @IsOptional()
  @IsNumber()
  @Min(100)
  dailyQuota?: number;

  @ApiPropertyOptional({ description: 'Rate limit por segundo (padrão: 100 req/s)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  rateLimitPerSec?: number;
}

export class RegisterWebhookDto {
  @ApiProperty({ description: 'Nome / Identificador do Webhook Target' })
  @IsString()
  targetName: string;

  @ApiProperty({ description: 'URL de destino para disparo de Webhook' })
  @IsUrl()
  targetUrl: string;

  @ApiProperty({ description: 'Tópico de Evento assinado (ex: aura.ecm.document.created.v1)' })
  @IsString()
  eventTopic: string;

  @ApiPropertyOptional({ description: 'Chave secreta HMAC para assinatura de payload' })
  @IsOptional()
  @IsString()
  secretHMAC?: string;
}

export class InstallConnectorDto {
  @ApiProperty({ description: 'Nome do Conector Corporativo' })
  @IsString()
  connectorName: string;

  @ApiProperty({ description: 'Categoria do Conector', enum: ConnectorCategory })
  @IsEnum(ConnectorCategory)
  category: ConnectorCategory;

  @ApiProperty({ description: 'Versão do Conector' })
  @IsString()
  version: string;

  @ApiPropertyOptional({ description: 'Configurações de autenticação em JSON' })
  @IsOptional()
  @IsString()
  authConfigPayload?: string;
}

export class TriggerSyncDto {
  @ApiProperty({ description: 'ID do Conector / Sistema Destino' })
  @IsString()
  connectorId: string;

  @ApiProperty({ description: 'Modo de Sincronização', enum: SyncMode })
  @IsEnum(SyncMode)
  syncMode: SyncMode;
}
