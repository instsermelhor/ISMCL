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

export enum SeverityLevel {
  P1_CRITICAL = 'P1_CRITICAL',
  P2_HIGH = 'P2_HIGH',
  P3_MEDIUM = 'P3_MEDIUM',
  P4_LOW = 'P4_LOW',
}

export enum IncidentStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  IDENTIFIED = 'IDENTIFIED',
  MONITORING = 'MONITORING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum ServiceHealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  MAINTENANCE = 'MAINTENANCE',
  UNKNOWN = 'UNKNOWN',
}

export enum RemediationAction {
  RESTART_SERVICE = 'RESTART_SERVICE',
  PURGE_QUEUE = 'PURGE_QUEUE',
  AUTO_SCALE_PODS = 'AUTO_SCALE_PODS',
  ISOLATE_COMPONENT = 'ISOLATE_COMPONENT',
  ENABLE_GRACEFUL_DEGRADATION = 'ENABLE_GRACEFUL_DEGRADATION',
  FLUSH_CACHE = 'FLUSH_CACHE',
}

export enum ChaosTestType {
  LATENCY_INJECTION = 'LATENCY_INJECTION',
  SERVICE_OUTAGE = 'SERVICE_OUTAGE',
  PACKET_LOSS = 'PACKET_LOSS',
  RESOURCE_EXHAUSTION = 'RESOURCE_EXHAUSTION',
  FAILOVER_SIMULATION = 'FAILOVER_SIMULATION',
}

export enum SloBreachType {
  AVAILABILITY_DROPPED = 'AVAILABILITY_DROPPED',
  LATENCY_EXCEEDED = 'LATENCY_EXCEEDED',
  ERROR_RATE_SPIKED = 'ERROR_RATE_SPIKED',
  ERROR_BUDGET_EXHAUSTED = 'ERROR_BUDGET_EXHAUSTED',
}

// ── DTOS — TELEMETRY & OBSERVABILITY ────────────────────────────────────────

export class CollectTelemetryDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: 'cognitive-orchestration' })
  @IsString()
  serviceName: string;

  @ApiProperty({ example: 'metric' })
  @IsString()
  telemetryType: 'log' | 'metric' | 'trace' | 'event';

  @ApiProperty({ example: 'http_requests_latency_seconds' })
  @IsString()
  name: string;

  @ApiProperty({ example: 0.145 })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ example: { environment: 'production', pod: 'acop-pod-01' } })
  @IsOptional()
  @IsObject()
  labels?: Record<string, any>;
}

// ── DTOS — AIOPS ─────────────────────────────────────────────────────────────

export class DetectAnomalyDto {
  @ApiProperty({ example: 'cognitive-orchestration' })
  @IsString()
  targetService: string;

  @ApiPropertyOptional({ example: { timeWindowMinutes: 15, zScoreThreshold: 3.0 } })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

// ── DTOS — INCIDENT MANAGEMENT ───────────────────────────────────────────────

export class CreateIncidentDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: 'Alta Latência no Roteamento ACOP (P152)' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Latência média de roteamento excedeu 2000ms nos últimos 10 minutos' })
  @IsString()
  description: string;

  @ApiProperty({ enum: SeverityLevel, example: SeverityLevel.P1_CRITICAL })
  @IsEnum(SeverityLevel)
  severity: SeverityLevel;

  @ApiProperty({ example: 'cognitive-orchestration' })
  @IsString()
  affectedService: string;

  @ApiPropertyOptional({ example: 'SRE-LEAD-01' })
  @IsOptional()
  @IsString()
  assigneeId?: string;
}

export class ResolveIncidentDto {
  @ApiProperty({ example: 'INC-2026-0001' })
  @IsString()
  incidentId: string;

  @ApiProperty({ example: 'Aplicação de autorremediação com restart do pool de agentes' })
  @IsString()
  resolutionNotes: string;

  @ApiProperty({ example: ['Manter cache vetorial aquecido', 'Aumentar réplicas do ACOP'] })
  @IsArray()
  @IsString({ each: true })
  lessonsLearned: string[];

  @ApiProperty({ example: 'SRE-LEAD-01' })
  @IsString()
  resolvedBy: string;
}

// ── DTOS — BUSINESS OBSERVABILITY ──────────────────────────────────────────

export class CalculateBusinessImpactDto {
  @ApiProperty({ example: 'INC-2026-0001' })
  @IsString()
  incidentId: string;

  @ApiProperty({ example: 'cognitive-orchestration' })
  @IsString()
  affectedService: string;

  @ApiProperty({ example: 45 })
  @IsNumber()
  durationMinutes: number;
}

// ── DTOS — OPERATIONAL AUTOMATION ────────────────────────────────────────────

export class TriggerAutoRemediationDto {
  @ApiProperty({ enum: RemediationAction, example: RemediationAction.RESTART_SERVICE })
  @IsEnum(RemediationAction)
  action: RemediationAction;

  @ApiProperty({ example: 'cognitive-orchestration' })
  @IsString()
  targetService: string;

  @ApiProperty({ example: 'Detecção de vazamento de memória por AIOps' })
  @IsString()
  rationale: string;

  @ApiPropertyOptional({ example: 'SRE-AUTO-BOT' })
  @IsOptional()
  @IsString()
  operatorId?: string;
}

// ── DTOS — RESILIENCE & CHAOS ENGINEERING ─────────────────────────────────────

export class RunChaosTestDto {
  @ApiProperty({ enum: ChaosTestType, example: ChaosTestType.LATENCY_INJECTION })
  @IsEnum(ChaosTestType)
  testType: ChaosTestType;

  @ApiProperty({ example: 'enterprise-interoperability' })
  @IsString()
  targetComponent: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  durationMinutes: number;

  @ApiPropertyOptional({ example: { injectedLatencyMs: 3000 } })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}

// ── DTOS — SRE GOVERNANCE ────────────────────────────────────────────────────

export class EvaluateSloDto {
  @ApiProperty({ example: 'cognitive-orchestration' })
  @IsString()
  serviceName: string;

  @ApiProperty({ example: 99.9 })
  @IsNumber()
  targetAvailabilityPercentage: number;

  @ApiProperty({ example: 300 })
  @IsNumber()
  targetLatencyMs: number;
}
