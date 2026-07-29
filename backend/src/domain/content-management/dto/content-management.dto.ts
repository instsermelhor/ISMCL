import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';

// ── Enumerações de Domínio ECM ─────────────────────────────────────────────

export enum InformationClassification {
  PUBLIC = 'PUBLIC',                         // Público
  INTERNAL = 'INTERNAL',                     // Uso Interno
  RESTRICTED = 'RESTRICTED',                 // Restrito
  CONFIDENTIAL = 'CONFIDENTIAL',             // Confidencial
  HIGHLY_CONFIDENTIAL = 'HIGHLY_CONFIDENTIAL', // Altamente Confidencial (Prontuários / Segredo)
}

export enum DocumentCategory {
  ADMINISTRATIVE = 'ADMINISTRATIVE', // Administrativo
  ASSISTENTIAL = 'ASSISTENTIAL',     // Assistencial / Prontuário / Laudo
  FINANCIAL = 'FINANCIAL',           // Financeiro / Prestação de Contas
  LEGAL = 'LEGAL',                   // Jurídico / Contratos
  INSTITUTIONAL = 'INSTITUTIONAL',   // Institucional / Atas / Estatuto
  CONTRACT = 'CONTRACT',             // Contratos e Convênios
  POLICY = 'POLICY',                 // Políticas / Normas
  POP = 'POP',                       // Procedimentos Operacionais Padrão
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DISPOSED = 'DISPOSED',
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class CreateDocumentDto {
  @ApiProperty({ description: 'Título do documento' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Categoria do documento', enum: DocumentCategory })
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @ApiProperty({ description: 'Classificação da Informação (Segurança)', enum: InformationClassification })
  @IsEnum(InformationClassification)
  classification: InformationClassification;

  @ApiProperty({ description: 'Conteúdo bruto / Texto do documento' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Palavras-chave para indexação' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ description: 'Unidade organizacional proprietária' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Prazo de retenção em anos (padrão: 5 anos)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  retentionYears?: number;
}

export class UpdateDocumentVersionDto {
  @ApiProperty({ description: 'Novo conteúdo da versão' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Justificativa da alteração / versão' })
  @IsString()
  changeSummary: string;
}

export class SearchDocumentDto {
  @ApiPropertyOptional({ description: 'Termo de busca textual / semântica / OCR' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filtrar por Categoria', enum: DocumentCategory })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'Filtrar por Classificação', enum: InformationClassification })
  @IsOptional()
  @IsEnum(InformationClassification)
  classification?: InformationClassification;
}

export class DisposeDocumentDto {
  @ApiProperty({ description: 'Justificativa legal e autorização para descarte' })
  @IsString()
  reason: string;
}
