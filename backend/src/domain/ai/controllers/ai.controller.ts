import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { AiAssistantService } from '../services/ai-assistant.service';
import { RagKnowledgeService } from '../services/rag-knowledge.service';
import { PromptGovernanceService } from '../services/prompt-governance.service';
import {
  InvokeAssistantDto,
  QueryRagDto,
  CreateKnowledgeArticleDto,
  CreatePromptTemplateDto,
} from '../dto/ai.dto';

/**
 * AiController — APIs REST da Plataforma de Inteligência Artificial, Conhecimento e RAG (AEAI-KP)
 *
 * Expõe endpoints para:
 * - Invocação dos 10 Assistentes Inteligentes Especializados
 * - Consultas RAG na Base Corporativa de Conhecimento
 * - Gestão e indexação de artigos/POPs na Base de Conhecimento
 * - Governança corporativa de prompts (Criação, Aprovação e Rollback por SUPER_ADMIN)
 *
 * Referências: P141 AEAI-KP Etapa 11, OpenAPI 3.1
 */
@ApiTags('Artificial Intelligence, Knowledge & RAG Platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(
    private readonly assistantService: AiAssistantService,
    private readonly ragService: RagKnowledgeService,
    private readonly promptGov: PromptGovernanceService,
  ) {}

  // ── Assistentes Especializados ──────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL, AuraRole.BENEFICIARY)
  @Post('assistants/invoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invocar Assistente Inteligente Especializado (10 papéis disponíveis)' })
  async invokeAssistant(
    @Body() dto: InvokeAssistantDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const response = await this.assistantService.invoke(dto, req.user.sub, tenantId);
    return BaseResponseDto.ok(response, requestId, undefined, `Resposta do ${response.assistantName} gerada.`);
  }

  // ── RAG & Base de Conhecimento ──────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('rag/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Consulta RAG direta na Base de Conhecimento Institucional' })
  async queryRag(@Body() dto: QueryRagDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const result = await this.ragService.queryRag(dto, tenantId);
    return BaseResponseDto.ok(result, requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('knowledge/articles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Indexar novo Artigo/POP na Base Corporativa de Conhecimento' })
  async createArticle(@Body() dto: CreateKnowledgeArticleDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const article = this.ragService.createArticle(dto);
    return BaseResponseDto.created(article, requestId, `Artigo "${dto.title}" indexado no banco vetorial.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('knowledge/articles')
  @ApiOperation({ summary: 'Listar Artigos da Base de Conhecimento' })
  async listArticles(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.ragService.listArticles(), requestId);
  }

  // ── Prompt Governance ──────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('prompts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Rascunho de Prompt Template [SUPER_ADMIN]' })
  async createPrompt(@Body() dto: CreatePromptTemplateDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const prompt = this.promptGov.create(dto);
    return BaseResponseDto.created(prompt, requestId, `Prompt "${dto.name}" criado como RASCUNHO.`);
  }

  @Roles(AuraRole.SUPER_ADMIN)
  @Patch('prompts/:id/approve')
  @ApiOperation({ summary: 'Aprovar e Homologar Prompt Template [SUPER_ADMIN]' })
  async approvePrompt(
    @Param('id') promptId: string,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const prompt = this.promptGov.approve(promptId, req.user.sub);
    return BaseResponseDto.ok(prompt, requestId, undefined, `Prompt "${prompt.name}" APROVADO para uso.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('prompts')
  @ApiOperation({ summary: 'Listar Prompts Homologados (Catálogo de Prompts)' })
  async listPrompts(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.promptGov.listAll(), requestId);
  }
}
