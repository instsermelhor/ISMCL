import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  IsISO8601,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Enumerações de Domínio ─────────────────────────────────────────────────

export enum DocumentType {
  PRESCRIPTION = 'PRESCRIPTION',           // Receita médica/psiquiátrica
  EXAM_REQUEST = 'EXAM_REQUEST',           // Solicitação de exame
  REFERRAL = 'REFERRAL',                   // Encaminhamento
  DECLARATION = 'DECLARATION',             // Declaração
  MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE', // Atestado
  THERAPEUTIC_PLAN = 'THERAPEUTIC_PLAN',   // Plano terapêutico
  CLINICAL_GUIDANCE = 'CLINICAL_GUIDANCE', // Orientações clínicas
  PSYCHOLOGICAL_REPORT = 'PSYCHOLOGICAL_REPORT', // Parecer psicológico
  SOCIAL_REPORT = 'SOCIAL_REPORT',         // Relatório social
  MULTIDISCIPLINARY_REPORT = 'MULTIDISCIPLINARY_REPORT', // Relatório multidisciplinar
  MEDICAL_REPORT = 'MEDICAL_REPORT',       // Laudo médico/psiquiátrico
  INSTITUTIONAL = 'INSTITUTIONAL',         // Documento institucional
}

export enum DocumentSensitivity {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED',
  HIGHLY_SENSITIVE = 'HIGHLY_SENSITIVE',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  VALIDATED = 'VALIDATED',
  DELIVERED = 'DELIVERED',
  ARCHIVED = 'ARCHIVED',
  REVOKED = 'REVOKED',
}

export enum SignatureMode {
  SEQUENTIAL = 'SEQUENTIAL',  // Assinatura em cadeia obrigatória
  PARALLEL = 'PARALLEL',      // Qualquer ordem
  COSIGNATURE = 'COSIGNATURE', // Co-assinatura simultânea
}

export enum DeliveryChannel {
  PORTAL = 'PORTAL',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  AUTHENTICATED_DOWNLOAD = 'AUTHENTICATED_DOWNLOAD',
  CONTROLLED_SHARING = 'CONTROLLED_SHARING',
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class PrescriptionItemDto {
  @ApiProperty({ description: 'Nome do medicamento ou item prescrito' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Dosagem / concentração', example: '20mg' })
  @IsString()
  dosage: string;

  @ApiProperty({ description: 'Instruções de uso', example: '1 comprimido, 2x ao dia, por 30 dias' })
  @IsString()
  instructions: string;

  @ApiPropertyOptional({ description: 'Quantidade total', example: '60 comprimidos' })
  @IsOptional()
  @IsString()
  quantity?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ description: 'ID do Beneficiário' })
  @IsUUID()
  beneficiaryId: string;

  @ApiPropertyOptional({ description: 'ID do Prontuário Eletrônico associado' })
  @IsOptional()
  @IsUUID()
  ehrId?: string;

  @ApiPropertyOptional({ description: 'ID do Caso Assistencial associado' })
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @ApiProperty({ description: 'Tipo de documento', enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ description: 'Título do documento', example: 'Receita de Antidepressivo ISRS' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'CID-10/11 aplicável', example: 'F32.1' })
  @IsOptional()
  @IsString()
  icdCode?: string;

  @ApiPropertyOptional({ description: 'Itens da prescrição (para PRESCRIPTION e EXAM_REQUEST)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items?: PrescriptionItemDto[];

  @ApiPropertyOptional({ description: 'Conteúdo textual livre do documento' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Classificação de sensibilidade', enum: DocumentSensitivity })
  @IsEnum(DocumentSensitivity)
  sensitivity: DocumentSensitivity;

  @ApiPropertyOptional({ description: 'Data de validade do documento (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'IDs dos signatários adicionais (co-assinantes)' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  additionalSignatories?: string[];

  @ApiPropertyOptional({ description: 'Modo de assinatura', enum: SignatureMode })
  @IsOptional()
  @IsEnum(SignatureMode)
  signatureMode?: SignatureMode;
}

export class SignDocumentDto {
  @ApiProperty({ description: 'ID do Documento a assinar' })
  @IsUUID()
  documentId: string;

  @ApiProperty({ description: 'Hash ou token de assinatura do profissional' })
  @IsString()
  signatureToken: string;
}

export class ValidateDocumentDto {
  @ApiProperty({ description: 'ID do Documento a validar' })
  @IsUUID()
  documentId: string;
}

export class DeliverDocumentDto {
  @ApiProperty({ description: 'ID do Documento a entregar' })
  @IsUUID()
  documentId: string;

  @ApiProperty({ description: 'Canais de distribuição', enum: DeliveryChannel, isArray: true })
  @IsArray()
  @IsEnum(DeliveryChannel, { each: true })
  channels: DeliveryChannel[];

  @ApiPropertyOptional({ description: 'Mensagem adicional para o destinatário' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Nome do template', example: 'Receita Psiquiátrica Padrão' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tipo de documento', enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Conteúdo HTML/Markdown do template com variáveis {{variavel}}' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais do template' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
