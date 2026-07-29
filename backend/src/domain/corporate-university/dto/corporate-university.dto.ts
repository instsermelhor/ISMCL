import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

// ── Enumerações de Domínio da Universidade Corporativa ─────────────────────

export enum CourseModality {
  ONLINE = 'ONLINE',          // EAD / SCORM / xAPI
  PRESENTIAL = 'PRESENTIAL',  // Presencial
  HYBRID = 'HYBRID',          // Híbrido
}

export enum CourseCategory {
  MANDATORY = 'MANDATORY',         // Capacitação Obrigatória (LGPD, Código de Ética)
  CLINICAL = 'CLINICAL',           // Capacitação Clínica / Assistencial (CFP / CFM)
  TECHNICAL = 'TECHNICAL',         // Capacitação Técnica / Sistemas
  BEHAVIORAL = 'BEHAVIORAL',       // Competências Comportamentais / Soft Skills
  INSTITUTIONAL = 'INSTITUTIONAL', // Institucional / Acolhimento
}

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export enum AssessmentType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // Objetiva
  CASE_STUDY = 'CASE_STUDY',           // Estudo de Caso
  PRACTICAL = 'PRACTICAL',             // Avaliação Prática / Simulação
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class CreateCourseDto {
  @ApiProperty({ description: 'Título do Curso / Capacitação' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descrição detalhada do curso' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Categoria do curso', enum: CourseCategory })
  @IsEnum(CourseCategory)
  category: CourseCategory;

  @ApiProperty({ description: 'Modalidade de ensino', enum: CourseModality })
  @IsEnum(CourseModality)
  modality: CourseModality;

  @ApiProperty({ description: 'Carga horária em horas' })
  @IsNumber()
  @Min(1)
  workloadHours: number;

  @ApiPropertyOptional({ description: 'Competências desenvolvidas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCompetencies?: string[];

  @ApiPropertyOptional({ description: 'Nota mínima para aprovação (0-100, padrão: 70)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingGrade?: number;
}

export class EnrollUserDto {
  @ApiProperty({ description: 'ID do curso' })
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'ID do usuário / aluno' })
  @IsString()
  userId: string;
}

export class SubmitAssessmentDto {
  @ApiProperty({ description: 'ID do curso' })
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'ID da avaliação' })
  @IsString()
  assessmentId: string;

  @ApiProperty({ description: 'Respostas submetidas (JSON / chaves)' })
  @IsString()
  answersPayload: string;
}

export class IssueCertificateDto {
  @ApiProperty({ description: 'ID da matrícula concluída' })
  @IsString()
  enrollmentId: string;
}
