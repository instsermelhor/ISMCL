import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ClinicalSpecialtyCategory {
  PSYCHOLOGY = 'PSYCHOLOGY',
  PSYCHIATRY = 'PSYCHIATRY',
  SOCIAL_WORK = 'SOCIAL_WORK',
  MULTIDISCIPLINARY = 'MULTIDISCIPLINARY',
  NURSING = 'NURSING',
  ADMINISTRATIVE_CARE = 'ADMINISTRATIVE_CARE',
}

export enum RecordSensitivityClassification {
  STANDARD = 'STANDARD',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED_PSYCHOLOGY = 'RESTRICTED_PSYCHOLOGY',
  HIGHLY_SENSITIVE = 'HIGHLY_SENSITIVE',
}

export enum AttachmentType {
  LAB_EXAM = 'LAB_EXAM',
  MEDICAL_REPORT = 'MEDICAL_REPORT',
  PSYCHOSOCIAL_OPINION = 'PSYCHOSOCIAL_OPINION',
  PDF_DOCUMENT = 'PDF_DOCUMENT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export class SoapNoteDto {
  @ApiProperty({ description: 'Subjetivo: Relato do paciente / queixa principal' })
  @IsString()
  subjective: string;

  @ApiProperty({ description: 'Objetivo: Exame físico / observações comportamentais / exames' })
  @IsString()
  objective: string;

  @ApiProperty({ description: 'Avaliação: Parecer técnico / hipótese diagnóstica' })
  @IsString()
  assessment: string;

  @ApiProperty({ description: 'Plano: Conduta assistencial / encaminhamentos / prescrição' })
  @IsString()
  plan: string;
}

export class CreateClinicalNoteDto {
  @ApiProperty({ description: 'ID do Prontuário Eletrônico' })
  @IsUUID()
  ehrId: string;

  @ApiProperty({ description: 'ID do Caso Assistencial' })
  @IsUUID()
  caseId: string;

  @ApiProperty({ description: 'Categoria da evolução', enum: ClinicalSpecialtyCategory })
  @IsEnum(ClinicalSpecialtyCategory)
  category: ClinicalSpecialtyCategory;

  @ApiProperty({ description: 'Classificação de sensibilidade', enum: RecordSensitivityClassification })
  @IsEnum(RecordSensitivityClassification)
  sensitivity: RecordSensitivityClassification;

  @ApiProperty({ description: 'Conteúdo estruturado no padrão SOAP (Subjetivo, Objetivo, Avaliação, Plano)' })
  @ValidateNested()
  @Type(() => SoapNoteDto)
  soapNote: SoapNoteDto;

  @ApiPropertyOptional({ description: 'Código do CID-10 / CID-11 se aplicável', example: 'F41.1' })
  @IsOptional()
  @IsString()
  icdCode?: string;
}

export class SignClinicalNoteDto {
  @ApiProperty({ description: 'ID da Nota Clínica / Evolução' })
  @IsUUID()
  noteId: string;

  @ApiProperty({ description: 'Assinatura eletrônica / hash digital do profissional' })
  @IsString()
  digitalSignature: string;
}

export class UpdateSoapNoteDto {
  @ApiPropertyOptional({ description: 'Subjetivo: Relato do paciente / queixa principal' })
  @IsOptional()
  @IsString()
  subjective?: string;

  @ApiPropertyOptional({ description: 'Objetivo: Exame físico / observações comportamentais / exames' })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({ description: 'Avaliação: Parecer técnico / hipótese diagnóstica' })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional({ description: 'Plano: Conduta assistencial / encaminhamentos / prescrição' })
  @IsOptional()
  @IsString()
  plan?: string;
}

export class UpdateDraftClinicalNoteDto {
  @ApiPropertyOptional({ description: 'Conteúdo estruturado no padrão SOAP para autosave' })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSoapNoteDto)
  soapNote?: UpdateSoapNoteDto;

  @ApiPropertyOptional({ description: 'Código do CID-10 / CID-11 se aplicável', example: 'F41.1' })
  @IsOptional()
  @IsString()
  icdCode?: string;
}

export class AddAttachmentDto {
  @ApiProperty({ description: 'ID do Prontuário Eletrônico' })
  @IsUUID()
  ehrId: string;

  @ApiProperty({ description: 'Tipo do anexo', enum: AttachmentType })
  @IsEnum(AttachmentType)
  attachmentType: AttachmentType;

  @ApiProperty({ description: 'Nome do arquivo', example: 'laudo_psicologico_março_2026.pdf' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'URL ou S3 key de acesso seguro ao arquivo' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Descrição / Observações do anexo' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class BreakGlassEmergencyAccessDto {
  @ApiProperty({ description: 'ID do Prontuário Eletrônico acessado emergencialmente' })
  @IsUUID()
  ehrId: string;

  @ApiProperty({ description: 'Justificativa clínica/legal OBRIGATÓRIA para o acesso de emergência' })
  @IsString()
  justification: string;
}
