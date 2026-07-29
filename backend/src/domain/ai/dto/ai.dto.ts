import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Enumerações de Domínio ─────────────────────────────────────────────────

export enum LLMProvider {
  GEMINI = 'GEMINI',
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  LOCAL_LLAMA = 'LOCAL_LLAMA',
}

export enum AssistantRole {
  BENEFICIARY = 'BENEFICIARY',               // Assistente do Beneficiário
  PSYCHOLOGIST = 'PSYCHOLOGIST',             // Assistente do Psicólogo
  PSYCHIATRIST = 'PSYCHIATRIST',             // Assistente do Psiquiatra
  SOCIAL_WORKER = 'SOCIAL_WORKER',           // Assistente do Assistente Social
  VOLUNTEER = 'VOLUNTEER',                   // Assistente do Voluntário
  ADMINISTRATIVE = 'ADMINISTRATIVE',         // Assistente Administrativo
  FINANCIAL = 'FINANCIAL',                   // Assistente Financeiro
  LEGAL = 'LEGAL',                           // Assistente Jurídico Institucional
  EXECUTIVE = 'EXECUTIVE',                   // Assistente da Diretoria
  SUPER_ADMIN = 'SUPER_ADMIN',               // Assistente do Super Administrador
}

export enum KnowledgeCategory {
  SOP_POP = 'SOP_POP',                       // Procedimentos Operacionais Padrão
  CLINICAL_PROTOCOL = 'CLINICAL_PROTOCOL',   // Protocolos Assistenciais/Clínicos
  INSTITUTIONAL_POLICY = 'INSTITUTIONAL_POLICY', // Políticas Institucionais/LGPD
  TECHNICAL_DOC = 'TECHNICAL_DOC',           // Documentação Técnica
  FAQ = 'FAQ',                               // Perguntas Frequentes
  CORPORATE_UNIVERSITY = 'CORPORATE_UNIVERSITY', // Treinamentos
}

export enum PromptStatus {
  DRAFT = 'DRAFT',
  HOMOLOGATING = 'HOMOLOGATING',
  APPROVED = 'APPROVED',
  DEPRECATED = 'DEPRECATED',
}

export enum AIRiskClassification {
  LOW = 'LOW',                 // Informações institucionais de caráter público
  MODERATE = 'MODERATE',       // Orientações operacionais internas
  HIGH = 'HIGH',               // Sugestões assistenciais (exige revisão humana obrigatória)
  CRITICAL = 'CRITICAL',       // Decisões médicas/jurídicas (bloqueadas para ação direta)
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class InvokeAssistantDto {
  @ApiProperty({ description: 'Papel do assistente especializado', enum: AssistantRole })
  @IsEnum(AssistantRole)
  assistantRole: AssistantRole;

  @ApiProperty({ description: 'Mensagem / Pergunta do usuário' })
  @IsString()
  userPrompt: string;

  @ApiPropertyOptional({ description: 'ID da sessão de conversa (para memória de contexto)' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'ID do beneficiário ou entidade associada' })
  @IsOptional()
  @IsString()
  contextEntityId?: string;

  @ApiPropertyOptional({ description: 'Habilitar busca RAG na Base de Conhecimento?', default: true })
  @IsOptional()
  @IsBoolean()
  enableRag?: boolean;
}

export class QueryRagDto {
  @ApiProperty({ description: 'Consulta de busca semântica RAG' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Categorias de conhecimento a buscar', enum: KnowledgeCategory, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(KnowledgeCategory, { each: true })
  categories?: KnowledgeCategory[];

  @ApiPropertyOptional({ description: 'Número máximo de documentos relevantes', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  topK?: number;
}

export class CreateKnowledgeArticleDto {
  @ApiProperty({ description: 'Título do artigo / documento' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Categoria do conhecimento', enum: KnowledgeCategory })
  @IsEnum(KnowledgeCategory)
  category: KnowledgeCategory;

  @ApiProperty({ description: 'Conteúdo textual completo para indexação RAG' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Tags para categorização adicionais' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreatePromptTemplateDto {
  @ApiProperty({ description: 'Nome identificador do prompt template' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Assistente-alvo', enum: AssistantRole })
  @IsEnum(AssistantRole)
  targetAssistant: AssistantRole;

  @ApiProperty({ description: 'Template de System Prompt com variáveis {{variavel}}' })
  @IsString()
  systemPrompt: string;

  @ApiPropertyOptional({ description: 'Instruções de segurança / alinhamento de IA Responsável' })
  @IsOptional()
  @IsString()
  safetyGuardrails?: string;
}
