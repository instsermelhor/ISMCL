import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

export enum CaseStatus {
  OPEN = 'OPEN',
  ACTIVE = 'ACTIVE',
  IN_REVIEW = 'IN_REVIEW',
  ON_HOLD = 'ON_HOLD',
  SUSPENDED = 'SUSPENDED',
  DISCHARGED = 'DISCHARGED',
  CLOSED = 'CLOSED',
}

export enum GoalCategory {
  CLINICAL = 'CLINICAL',
  PSYCHOSOCIAL = 'PSYCHOSOCIAL',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  EDUCATIONAL = 'EDUCATIONAL',
  FAMILY = 'FAMILY',
}

export enum CaseDischargeReason {
  OBJECTIVES_MET = 'OBJECTIVES_MET',
  BENEFICIARY_REQUEST = 'BENEFICIARY_REQUEST',
  TRANSFERRED_PARTNER = 'TRANSFERRED_PARTNER',
  NON_COMPLIANCE = 'NON_COMPLIANCE',
  ADMINISTRATIVE_CLOSURE = 'ADMINISTRATIVE_CLOSURE',
}

export class UpdateCaseStatusDto {
  @ApiProperty({ description: 'Novo status do caso assistencial', enum: CaseStatus })
  @IsEnum(CaseStatus)
  status: CaseStatus;

  @ApiProperty({ description: 'Justificativa da alteração de status' })
  @IsString()
  justification: string;
}

export class AssignMultidisciplinaryTeamDto {
  @ApiProperty({ description: 'ID do caso assistencial' })
  @IsUUID()
  caseId: string;

  @ApiProperty({ description: 'ID do Profissional Responsável Principal' })
  @IsUUID()
  leadProfessionalId: string;

  @ApiPropertyOptional({ description: 'IDs de outros profissionais da equipe multidisciplinar' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  teamMemberIds?: string[];
}

export class CreateCarePlanDto {
  @ApiProperty({ description: 'ID do caso assistencial' })
  @IsUUID()
  caseId: string;

  @ApiProperty({ description: 'Objetivos terapêuticos e psicossociais' })
  @IsArray()
  @IsString({ each: true })
  goals: string[];

  @ApiProperty({ description: 'Intervenções planejadas' })
  @IsArray()
  @IsString({ each: true })
  interventions: string[];

  @ApiProperty({ description: 'Frequência dos atendimentos', example: 'SEMANAL' })
  @IsString()
  frequency: string;

  @ApiProperty({ description: 'Critérios para alta assistencial' })
  @IsString()
  dischargeCriteria: string;
}

export class AddGoalDto {
  @ApiProperty({ description: 'ID do caso assistencial' })
  @IsUUID()
  caseId: string;

  @ApiProperty({ description: 'Título da meta', example: 'Adesão ao acompanhamento psicoterápico' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Categoria da meta', enum: GoalCategory })
  @IsEnum(GoalCategory)
  category: GoalCategory;

  @ApiPropertyOptional({ description: 'Prazo estipulado (ISO Date)' })
  @IsOptional()
  @IsString()
  deadline?: string;
}

export class UpdateGoalProgressDto {
  @ApiProperty({ description: 'ID da meta' })
  @IsUUID()
  goalId: string;

  @ApiProperty({ description: 'Percentual de conclusão (0-100)', example: 75 })
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage: number;

  @ApiPropertyOptional({ description: 'Notas sobre o progresso' })
  @IsOptional()
  @IsString()
  progressNotes?: string;
}

export class EvaluateOutcomeDto {
  @ApiProperty({ description: 'ID do caso assistencial' })
  @IsUUID()
  caseId: string;

  @ApiProperty({ description: 'Score de evolução clínica (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  clinicalEvolutionScore: number;

  @ApiProperty({ description: 'Score de evolução psicossocial (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  psychosocialEvolutionScore: number;

  @ApiProperty({ description: 'Taxa de adesão ao plano de cuidados (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  adherencePercentage: number;
}

export class CloseCaseDto {
  @ApiProperty({ description: 'ID do caso assistencial' })
  @IsUUID()
  caseId: string;

  @ApiProperty({ description: 'Motivo da alta / encerramento', enum: CaseDischargeReason })
  @IsEnum(CaseDischargeReason)
  dischargeReason: CaseDischargeReason;

  @ApiProperty({ description: 'Resumo final do parecer multidisciplinar' })
  @IsString()
  finalSummary: string;
}
