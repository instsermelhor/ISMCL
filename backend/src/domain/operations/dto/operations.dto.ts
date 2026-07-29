import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator';

// ── Enumerações de Domínio ─────────────────────────────────────────────────

export enum EnvironmentType {
  DEVELOPMENT = 'DEVELOPMENT',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
  DR_SITE = 'DR_SITE',
}

export enum DeploymentStrategy {
  BLUE_GREEN = 'BLUE_GREEN',
  CANARY = 'CANARY',
  ROLLING_UPDATE = 'ROLLING_UPDATE',
}

export enum SecretType {
  DB_CREDENTIAL = 'DB_CREDENTIAL',
  JWT_SIGNING_KEY = 'JWT_SIGNING_KEY',
  API_KEY = 'API_KEY',
  TLS_CERTIFICATE = 'TLS_CERTIFICATE',
}

export enum BackupType {
  FULL_DATABASE = 'FULL_DATABASE',
  EVENT_STORE = 'EVENT_STORE',
  CONFIG_SNAPSHOT = 'CONFIG_SNAPSHOT',
  SYSTEM_STATE = 'SYSTEM_STATE',
}

export enum CostCategory {
  COMPUTE = 'COMPUTE',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  MANAGED_SERVICES = 'MANAGED_SERVICES',
  AI_PROVIDERS = 'AI_PROVIDERS',
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class TriggerPipelineDto {
  @ApiProperty({ description: 'Nome do serviço a publicar', example: 'backend-core' })
  @IsString()
  serviceName: string;

  @ApiProperty({ description: 'Ambiente de destino', enum: EnvironmentType })
  @IsEnum(EnvironmentType)
  environment: EnvironmentType;

  @ApiProperty({ description: 'Estratégia de deploy', enum: DeploymentStrategy })
  @IsEnum(DeploymentStrategy)
  strategy: DeploymentStrategy;

  @ApiProperty({ description: 'Tag da imagem / Commit SHA', example: 'v1.4.0-cbf70ef' })
  @IsString()
  imageTag: string;
}

export class RotateSecretDto {
  @ApiProperty({ description: 'Nome do segredo a rotacionar', example: 'JWT_SECRET_KEY' })
  @IsString()
  secretName: string;

  @ApiProperty({ description: 'Tipo do segredo', enum: SecretType })
  @IsEnum(SecretType)
  type: SecretType;

  @ApiPropertyOptional({ description: 'Motivo da rotação' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class TriggerBackupDto {
  @ApiProperty({ description: 'Tipo de backup', enum: BackupType })
  @IsEnum(BackupType)
  type: BackupType;

  @ApiProperty({ description: 'Ambiente de origem', enum: EnvironmentType })
  @IsEnum(EnvironmentType)
  environment: EnvironmentType;
}

export class ScaleClusterDto {
  @ApiProperty({ description: 'Nome do Deployment / Workload' })
  @IsString()
  deploymentName: string;

  @ApiProperty({ description: 'Número desejado de réplicas' })
  @IsNumber()
  @Min(1)
  @Max(50)
  replicas: number;
}
