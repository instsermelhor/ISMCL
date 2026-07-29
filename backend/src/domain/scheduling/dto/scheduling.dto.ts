import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsISO8601,
  IsInt,
  Min,
  Max,
} from 'class-validator';

// ── Enumerações de Domínio ─────────────────────────────────────────────────

export enum AppointmentModality {
  IN_PERSON = 'IN_PERSON',
  TELEHEALTH = 'TELEHEALTH',
  HOME_VISIT = 'HOME_VISIT',
  INSTITUTIONAL_VISIT = 'INSTITUTIONAL_VISIT',
  SOCIAL_FOLLOW_UP = 'SOCIAL_FOLLOW_UP',
  RETURN = 'RETURN',
  THERAPEUTIC_GROUP = 'THERAPEUTIC_GROUP',
  WORKSHOP = 'WORKSHOP',
  TRAINING = 'TRAINING',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABSENT = 'ABSENT',
  ABANDONED = 'ABANDONED',
}

export enum QueuePriority {
  CRITICAL = 'CRITICAL',   // Crise / Emergência (SLA: 30 min)
  EMERGENCY = 'EMERGENCY', // Urgente (SLA: 2h)
  URGENT = 'URGENT',       // Prioridade (SLA: 24h)
  HIGH = 'HIGH',            // Alta (SLA: 48h)
  ROUTINE = 'ROUTINE',     // Rotina (SLA: 120h)
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
  PORTAL = 'PORTAL',
}

// ── DTOs ──────────────────────────────────────────────────────────────────

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID do Beneficiário' })
  @IsUUID()
  beneficiaryId: string;

  @ApiProperty({ description: 'ID do Profissional responsável' })
  @IsUUID()
  professionalId: string;

  @ApiPropertyOptional({ description: 'ID do Caso Assistencial vinculado' })
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @ApiProperty({ description: 'Modalidade do atendimento', enum: AppointmentModality })
  @IsEnum(AppointmentModality)
  modality: AppointmentModality;

  @ApiProperty({ description: 'Data/hora do início do atendimento (ISO 8601)', example: '2026-08-01T10:00:00-03:00' })
  @IsISO8601()
  scheduledAt: string;

  @ApiProperty({ description: 'Duração em minutos', example: 50 })
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Notas ou observações para o profissional' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelAppointmentDto {
  @ApiProperty({ description: 'ID do Agendamento' })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ description: 'Motivo do cancelamento' })
  @IsString()
  reason: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'ID do Agendamento a remarcar' })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ description: 'Nova data/hora do atendimento (ISO 8601)' })
  @IsISO8601()
  newScheduledAt: string;

  @ApiProperty({ description: 'Motivo da remarcação' })
  @IsString()
  reason: string;
}

export class RecordAttendanceDto {
  @ApiProperty({ description: 'ID do Agendamento' })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ description: 'Status final do atendimento', enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Duração efetiva em minutos' })
  @IsOptional()
  @IsInt()
  @Min(1)
  effectiveDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Justificativa de falta ou abandono' })
  @IsOptional()
  @IsString()
  justification?: string;
}
