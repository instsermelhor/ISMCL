import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject, IsBoolean } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum TelemetryType {
  METRIC = 'METRIC',
  LOG = 'LOG',
  TRACE = 'TRACE',
  EVENT = 'EVENT',
  EXCEPTION = 'EXCEPTION',
}

export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export enum ChaosExperimentType {
  SERVICE_UNAVAILABILITY = 'SERVICE_UNAVAILABILITY',
  NETWORK_LATENCY = 'NETWORK_LATENCY',
  DATABASE_OUTAGE = 'DATABASE_OUTAGE',
  API_DEGRADATION = 'API_DEGRADATION',
  EVENT_QUEUE_FAILURE = 'EVENT_QUEUE_FAILURE',
}

export enum ChaosStatus {
  PLANNED = 'PLANNED',
  RUNNING = 'RUNNING',
  COMPLETED_SUCCESS = 'COMPLETED_SUCCESS',
  ABORTED_SAFETY_TRIGGER = 'ABORTED_SAFETY_TRIGGER',
  FAILED = 'FAILED',
}

export enum AnomalySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ── TELEMETRY DTOs ────────────────────────────────────────────────────────────

export class RecordTelemetryDto {
  @ApiProperty({ enum: TelemetryType, example: TelemetryType.METRIC })
  @IsEnum(TelemetryType)
  type: TelemetryType;

  @ApiProperty({ example: 'http_request_duration_seconds' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'EnterpriseStrategyModule' })
  @IsString()
  serviceName: string;

  @ApiProperty({ example: 0.045 })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ example: { endpoint: '/esgp/okrs', statusCode: 200 } })
  @IsOptional()
  @IsObject()
  labels?: Record<string, any>;

  @ApiPropertyOptional({ example: 'trace-8f921a-4c21' })
  @IsOptional()
  @IsString()
  traceId?: string;
}

// ── SLO DTOs ──────────────────────────────────────────────────────────────────

export class DefineSloDto {
  @ApiProperty({ example: 'SLO-AURA-AVAILABILITY-99.9' })
  @IsString()
  sloId: string;

  @ApiProperty({ example: 'Disponibilidade de APIs REST do Ecossistema' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'http_requests_success_ratio' })
  @IsString()
  sliMetricName: string;

  @ApiProperty({ example: 99.9, description: 'Alvo do SLO em percentual (ex: 99.9%)' })
  @IsNumber()
  targetPercentage: number;

  @ApiProperty({ example: 30, description: 'Janela de medição em dias' })
  @IsNumber()
  windowDays: number;
}

// ── CHAOS EXPERIMENT DTOs ─────────────────────────────────────────────────────

export class ExecuteChaosExperimentDto {
  @ApiProperty({ enum: ChaosExperimentType, example: ChaosExperimentType.NETWORK_LATENCY })
  @IsEnum(ChaosExperimentType)
  experimentType: ChaosExperimentType;

  @ApiProperty({ example: 'Simulação de latência de 500ms na comunicação entre serviços' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'SocialImpactModule' })
  @IsString()
  targetComponent: string;

  @ApiProperty({ example: 300, description: 'Duração máxima do experimento em segundos' })
  @IsNumber()
  durationSeconds: number;

  @ApiProperty({ example: 'Eng. Ricardo Ribeiro (SRE Principal)' })
  @IsString()
  authorizedBy: string;
}

// ── AIOPS DTOs ────────────────────────────────────────────────────────────────

export class TriggerAutonomousActionDto {
  @ApiProperty({ example: 'ANOMALY-LATENCY-P99-001' })
  @IsString()
  anomalyId: string;

  @ApiProperty({ example: 'Escalamento automático de réplicas no cluster' })
  @IsString()
  actionName: string;

  @ApiProperty({ example: 'AIOps Engine v2.5' })
  @IsString()
  aiEngineVersion: string;

  @ApiPropertyOptional({ example: { replicas: 5, targetModule: 'EnterpriseStrategyModule' } })
  @IsOptional()
  @IsObject()
  actionParameters?: Record<string, any>;
}
