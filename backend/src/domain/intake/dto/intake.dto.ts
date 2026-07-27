import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  IsBoolean,
  IsNumber,
  IsUUID,
} from 'class-validator';

export enum IntakePriority {
  ROUTINE = 'ROUTINE',
  PRIORITY = 'PRIORITY',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY',
  CRITICAL = 'CRITICAL',
}

export enum DemandOrigin {
  SPONTANEOUS = 'SPONTANEOUS',
  INTERNAL_REFERRAL = 'INTERNAL_REFERRAL',
  HEALTH_NETWORK = 'HEALTH_NETWORK',
  SOCIAL_NETWORK = 'SOCIAL_NETWORK',
  JUDICIAL_ORDER = 'JUDICIAL_ORDER',
  PARTNER_INSTITUTION = 'PARTNER_INSTITUTION',
}

export enum ReferralSpecialty {
  PSYCHOLOGY = 'PSYCHOLOGY',
  PSYCHIATRY = 'PSYCHIATRY',
  SOCIAL_WORK = 'SOCIAL_WORK',
  CASE_MANAGEMENT = 'CASE_MANAGEMENT',
  TELEHEALTH = 'TELEHEALTH',
  EMERGENCY_CARE = 'EMERGENCY_CARE',
  PARTNER_NETWORK = 'PARTNER_NETWORK',
}

export class StartWelcomeDto {
  @ApiProperty({ description: 'ID do Beneficiário cadastrado' })
  @IsUUID()
  beneficiaryId: string;

  @ApiProperty({ description: 'Origem da demanda', enum: DemandOrigin })
  @IsEnum(DemandOrigin)
  origin: DemandOrigin;

  @ApiProperty({ description: 'Relato inicial da demanda trazida pelo usuário' })
  @IsString()
  initialChiefComplaint: string;

  @ApiPropertyOptional({ description: 'Identificador de encaminhamento externo' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class SubmitScreeningDto {
  @ApiProperty({ description: 'ID da sessão de acolhimento' })
  @IsUUID()
  intakeId: string;

  @ApiProperty({ description: 'Fatores clínicos relatados' })
  @IsArray()
  @IsString({ each: true })
  clinicalFactors: string[];

  @ApiProperty({ description: 'Fatores psicossociais e familiares' })
  @IsArray()
  @IsString({ each: true })
  psychosocialFactors: string[];

  @ApiPropertyOptional({ description: 'Indício de situação de crise ou violência' })
  @IsOptional()
  @IsBoolean()
  hasCrisisIndicators?: boolean;
}

export class EvaluateVulnerabilityDto {
  @ApiProperty({ description: 'ID do acolhimento' })
  @IsUUID()
  intakeId: string;

  @ApiProperty({ description: 'Índice de insegurança alimentar (0-10)' })
  @IsNumber()
  foodInsecurityIndex: number;

  @ApiProperty({ description: 'Índice de violência familiar/doméstica (0-10)' })
  @IsNumber()
  domesticViolenceIndex: number;

  @ApiProperty({ description: 'Índice de isolamento social/abandono (0-10)' })
  @IsNumber()
  socialIsolationIndex: number;
}

export class TriggerCrisisProtocolDto {
  @ApiProperty({ description: 'ID do acolhimento' })
  @IsUUID()
  intakeId: string;

  @ApiProperty({ description: 'Tipos de crise detectados', example: ['SUICIDE_RISK', 'DOMESTIC_VIOLENCE'] })
  @IsArray()
  @IsString({ each: true })
  crisisTypes: string[];

  @ApiProperty({ description: 'Detalhamento da emergência' })
  @IsString()
  details: string;
}

export class CreateCarePlanDto {
  @ApiProperty({ description: 'ID do caso aberto' })
  @IsUUID()
  caseId: string;

  @ApiProperty({ description: 'Objetivos do plano assistencial' })
  @IsArray()
  @IsString({ each: true })
  goals: string[];

  @ApiProperty({ description: 'Especialidades indicadas' })
  @IsArray()
  @IsEnum(ReferralSpecialty, { each: true })
  specialties: ReferralSpecialty[];

  @ApiProperty({ description: 'Frequência inicial recomendada', example: 'SEMANAL' })
  @IsString()
  recommendedFrequency: string;
}
