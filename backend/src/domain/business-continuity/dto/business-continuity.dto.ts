import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum CriticalityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  VITAL = 'VITAL',
}

export enum IncidentCategory {
  CYBERSECURITY = 'CYBERSECURITY',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  NATURAL_DISASTER = 'NATURAL_DISASTER',
  OPERATIONAL = 'OPERATIONAL',
  HEALTH_SAFETY = 'HEALTH_SAFETY',
  REGULATORY = 'REGULATORY',
  REPUTATIONAL = 'REPUTATIONAL',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
}

export enum IncidentSeverity {
  P1_CRITICAL = 'P1_CRITICAL',
  P2_HIGH = 'P2_HIGH',
  P3_MEDIUM = 'P3_MEDIUM',
  P4_LOW = 'P4_LOW',
}

export enum IncidentStatus {
  DETECTED = 'DETECTED',
  TRIAGED = 'TRIAGED',
  CONTAINED = 'CONTAINED',
  ERADICATING = 'ERADICATING',
  RECOVERING = 'RECOVERING',
  RESOLVED = 'RESOLVED',
  POST_INCIDENT = 'POST_INCIDENT',
}

export enum RecoveryStatus {
  STANDBY = 'STANDBY',
  INITIATED = 'INITIATED',
  IN_PROGRESS = 'IN_PROGRESS',
  VALIDATED = 'VALIDATED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum CrisisStatus {
  MONITORING = 'MONITORING',
  DECLARED = 'DECLARED',
  ACTIVE = 'ACTIVE',
  CONTAINED = 'CONTAINED',
  RESOLVED = 'RESOLVED',
}

export enum BiaImpactDomain {
  ASSISTENTIAL = 'ASSISTENTIAL',
  OPERATIONAL = 'OPERATIONAL',
  FINANCIAL = 'FINANCIAL',
  TECHNOLOGICAL = 'TECHNOLOGICAL',
  LEGAL = 'LEGAL',
  REPUTATIONAL = 'REPUTATIONAL',
  REGULATORY = 'REGULATORY',
  SOCIAL = 'SOCIAL',
}

export enum CommunicationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
  PORTAL = 'PORTAL',
  EXECUTIVE_PANEL = 'EXECUTIVE_PANEL',
}

// ── BUSINESS CONTINUITY DTOs ──────────────────────────────────────────────────

export class RegisterCriticalProcessDto {
  @ApiProperty({ example: 'Atendimento Psicossocial de Emergência' })
  @IsString()
  name: string;

  @ApiProperty({ enum: CriticalityLevel, example: CriticalityLevel.VITAL })
  @IsEnum(CriticalityLevel)
  criticality: CriticalityLevel;

  @ApiProperty({ example: 4, description: 'Recovery Time Objective em horas' })
  @IsNumber()
  rtoHours: number;

  @ApiProperty({ example: 1, description: 'Recovery Point Objective em horas' })
  @IsNumber()
  rpoHours: number;

  @ApiProperty({ example: 'Diretora de Atendimento' })
  @IsString()
  owner: string;

  @ApiPropertyOptional({ example: ['EHR', 'Scheduling', 'Case Management'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[];

  @ApiPropertyOptional({ example: 'Ativação de atendimento presencial em sede alternativa' })
  @IsOptional()
  @IsString()
  continuityProcedure?: string;
}

// ── INCIDENT RESPONSE DTOs ────────────────────────────────────────────────────

export class CreateIncidentDto {
  @ApiProperty({ example: 'Ransomware detectado em servidor de produção' })
  @IsString()
  title: string;

  @ApiProperty({ enum: IncidentCategory, example: IncidentCategory.CYBERSECURITY })
  @IsEnum(IncidentCategory)
  category: IncidentCategory;

  @ApiProperty({ enum: IncidentSeverity, example: IncidentSeverity.P1_CRITICAL })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty({ example: 'Servidor DB-01 apresentou comportamento anômalo de criptografia' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'Sistema de monitoramento Prometheus' })
  @IsOptional()
  @IsString()
  detectedBy?: string;

  @ApiPropertyOptional({ example: ['EHR', 'Documents'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedSystems?: string[];
}

// ── DISASTER RECOVERY DTOs ────────────────────────────────────────────────────

export class InitiateRecoveryDto {
  @ApiProperty({ example: 'incident-001' })
  @IsString()
  incidentId: string;

  @ApiProperty({ example: 'Falha catastrófica — restore do backup de D-1' })
  @IsString()
  scenarioDescription: string;

  @ApiPropertyOptional({ example: ['EHR', 'Documents', 'Scheduling'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetSystems?: string[];

  @ApiPropertyOptional({ example: 'backup-2025-07-31T23:00:00Z' })
  @IsOptional()
  @IsString()
  backupSnapshotId?: string;
}

// ── CRISIS MANAGEMENT DTOs ────────────────────────────────────────────────────

export class DeclareCrisisDto {
  @ApiProperty({ example: 'Ataque de ransomware — Interrupção total dos sistemas' })
  @IsString()
  title: string;

  @ApiProperty({ enum: IncidentSeverity, example: IncidentSeverity.P1_CRITICAL })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty({ example: 'incident-001' })
  @IsString()
  linkedIncidentId: string;

  @ApiPropertyOptional({ example: ['CEO', 'CTO', 'CISO', 'COO'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  crisisCommittee?: string[];

  @ApiPropertyOptional({ example: 'Crise de TI com impacto operacional amplo — protocolo Nível 1 ativado' })
  @IsOptional()
  @IsString()
  initialStatement?: string;
}

// ── BIA DTOs ──────────────────────────────────────────────────────────────────

export class RunBIADto {
  @ApiProperty({ example: 'Atendimento Psicossocial de Emergência' })
  @IsString()
  processName: string;

  @ApiProperty({ example: 8, description: 'Duração estimada da interrupção em horas' })
  @IsNumber()
  outageHours: number;

  @ApiPropertyOptional({ example: { ASSISTENTIAL: 'CRITICAL', FINANCIAL: 'HIGH' } })
  @IsOptional()
  @IsObject()
  domainWeights?: Partial<Record<BiaImpactDomain, string>>;
}

// ── EMERGENCY COMMUNICATION DTOs ─────────────────────────────────────────────

export class SendEmergencyNotificationDto {
  @ApiProperty({ example: 'crisis-001' })
  @IsString()
  crisisId: string;

  @ApiProperty({ example: 'ALERTA CRÍTICO: Sistemas em recuperação. Atendimento presencial ativado.' })
  @IsString()
  message: string;

  @ApiProperty({ enum: CommunicationChannel, isArray: true, example: [CommunicationChannel.EMAIL, CommunicationChannel.WHATSAPP] })
  @IsArray()
  @IsEnum(CommunicationChannel, { each: true })
  channels: CommunicationChannel[];

  @ApiPropertyOptional({ example: ['diretoria@sermelhor.org.br', 'ti@sermelhor.org.br'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];

  @ApiPropertyOptional({ example: 'P1_CRITICAL', enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  priority?: IncidentSeverity;
}
