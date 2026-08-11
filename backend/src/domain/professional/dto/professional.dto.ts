import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum ProfessionalStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

export enum ProfessionalBondType {
  VOLUNTEER = 'VOLUNTEER',
  EMPLOYEE = 'EMPLOYEE',
  PARTNER = 'PARTNER',
}

export enum ProfessionType {
  PSYCHOLOGIST = 'PSYCHOLOGIST',
  SOCIAL_WORKER = 'SOCIAL_WORKER',
  PEDAGOGUE = 'PEDAGOGUE',
  NURSE = 'NURSE',
  PHYSICIAN = 'PHYSICIAN',
  LAWYER = 'LAWYER',
  OTHER = 'OTHER',
}

// ── DTOs de Query ─────────────────────────────────────────────────────────────

/**
 * Filtros de busca paginada de profissionais.
 */
export class ProfessionalSearchDto {
  @ApiPropertyOptional({ description: 'Nome parcial do profissional' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: ProfessionType, description: 'Tipo de profissão' })
  @IsOptional()
  @IsEnum(ProfessionType)
  profession?: ProfessionType;

  @ApiPropertyOptional({ description: 'Especialidade (texto livre)', example: 'Psicoterapia Cognitivo-Comportamental' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @ApiPropertyOptional({ enum: ProfessionalBondType, description: 'Tipo de vínculo institucional' })
  @IsOptional()
  @IsEnum(ProfessionalBondType)
  bondType?: ProfessionalBondType;

  @ApiPropertyOptional({ enum: ProfessionalStatus, description: 'Status do profissional' })
  @IsOptional()
  @IsEnum(ProfessionalStatus)
  status?: ProfessionalStatus;

  @ApiPropertyOptional({ description: 'Página (1-indexed)', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

// ── DTOs de Update ────────────────────────────────────────────────────────────

/**
 * Campos editáveis do perfil do profissional.
 */
export class UpdateProfessionalDto {
  @ApiPropertyOptional({ description: 'Nome social' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  socialName?: string;

  @ApiPropertyOptional({ description: 'Telefone de contato' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: ProfessionType, description: 'Profissão' })
  @IsOptional()
  @IsEnum(ProfessionType)
  profession?: ProfessionType;

  @ApiPropertyOptional({ description: 'Especialidade' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @ApiPropertyOptional({ description: 'Número do conselho profissional (CRP, CRM, CRESS...)' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  councilNumber?: string;

  @ApiPropertyOptional({ description: 'Estado do conselho (UF)' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  councilState?: string;

  @ApiPropertyOptional({ description: 'Status do conselho (ATIVO, SUSPENSO...)' })
  @IsOptional()
  @IsString()
  councilStatus?: string;

  @ApiPropertyOptional({ enum: ProfessionalStatus, description: 'Status do profissional (apenas ADMIN+)' })
  @IsOptional()
  @IsEnum(ProfessionalStatus)
  status?: ProfessionalStatus;
}

// ── Interfaces de Resposta ───────────────────────────────────────────────────

export interface AvailabilitySlot {
  id: string;
  dayOfWeek?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  isAvailable: boolean;
  notes?: string | null;
}

export interface ProfessionalResponsePayload {
  id: string;
  fullName: string;
  socialName: string | null;
  email: string;
  phone: string | null;
  bondType: string;
  status: string;
  profession: string | null;
  specialty: string | null;
  councilNumber: string | null;
  councilState: string | null;
  councilStatus: string | null;
  joinedAt: string;
  availabilities?: AvailabilitySlot[];
}
