import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Enumerações de Domínio ─────────────────────────────────────────────────

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  AUDIT = 'AUDIT',
  SECURITY = 'SECURITY',
}

export enum ThreatType {
  BRUTE_FORCE = 'BRUTE_FORCE',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  ANOMALOUS_ACCESS = 'ANOMALOUS_ACCESS',
  API_ABUSE = 'API_ABUSE',
  UNAUTHORIZED_RESOURCED_ACCESS = 'UNAUTHORIZED_RESOURCED_ACCESS',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  CONTAINED = 'CONTAINED',
  ERADICATED = 'ERADICATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum PlaybookAction {
  REVOKE_SESSION = 'REVOKE_SESSION',
  BLOCK_IP = 'BLOCK_IP',
  ISOLATE_USER = 'ISOLATE_USER',
  LOCK_ACCOUNT = 'LOCK_ACCOUNT',
  TRIGGER_ALERT = 'TRIGGER_ALERT',
}

export enum ComplianceStandard {
  LGPD = 'LGPD',
  MCSI = 'MCSI',
  ZERO_TRUST = 'ZERO_TRUST',
  NEED_TO_KNOW = 'NEED_TO_KNOW',
  SECURITY_BY_DESIGN = 'SECURITY_BY_DESIGN',
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class IngestLogDto {
  @ApiProperty({ description: 'Nível do log', enum: LogLevel })
  @IsEnum(LogLevel)
  level: LogLevel;

  @ApiProperty({ description: 'Módulo de origem', example: 'EhrModule' })
  @IsString()
  module: string;

  @ApiProperty({ description: 'Mensagem de log' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Correlation ID para rastreamento distribuído' })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({ description: 'Trace ID' })
  @IsOptional()
  @IsString()
  traceId?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateIncidentDto {
  @ApiProperty({ description: 'Título do incidente de cibersegurança' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Tipo de ameaça detectada', enum: ThreatType })
  @IsEnum(ThreatType)
  threatType: ThreatType;

  @ApiProperty({ description: 'Severidade do incidente', enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty({ description: 'Descrição detalhada e evidências iniciais' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'ID do usuário ou IP afetado' })
  @IsOptional()
  @IsString()
  affectedTarget?: string;
}

export class ExecutePlaybookDto {
  @ApiProperty({ description: 'ID do incidente a conter' })
  @IsString()
  incidentId: string;

  @ApiProperty({ description: 'Ação do playbook SOC', enum: PlaybookAction })
  @IsEnum(PlaybookAction)
  action: PlaybookAction;

  @ApiPropertyOptional({ description: 'Justificativa técnica' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ description: 'Filtro por módulo de origem' })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ description: 'Filtro por padrão de conformidade', enum: ComplianceStandard })
  @IsOptional()
  @IsEnum(ComplianceStandard)
  standard?: ComplianceStandard;

  @ApiPropertyOptional({ description: 'Limite de registros', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
