import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
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
import { EnterpriseContentManagementService } from '../services/enterprise-content-management.service';
import { RetentionSearchService } from '../services/retention-search.service';
import {
  CreateDocumentDto,
  UpdateDocumentVersionDto,
  SearchDocumentDto,
  DisposeDocumentDto,
} from '../dto/content-management.dto';

/**
 * ContentManagementController — APIs REST de Enterprise Content Management (ECM), Arquivo Digital e Governança Documental (AECM-KG)
 *
 * Expõe endpoints para criação de documentos, versionamento imutável com checksum SHA-256,
 * classificação da informação, arquivo digital, descarte seguro com rastro de auditoria e pesquisa corporativa.
 *
 * Referências: P145 AECM-KG Etapa 11, OpenAPI 3.1, LGPD, MCSI
 */
@ApiTags('Enterprise Content Management & Digital Archives (ECM)')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'ecm', version: '1' })
export class ContentManagementController {
  constructor(
    private readonly ecmService: EnterpriseContentManagementService,
    private readonly searchService: RetentionSearchService,
  ) {}

  // ── Document Management ────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Documento Corporativo no Repositório ECM' })
  async createDocument(
    @Body() dto: CreateDocumentDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const doc = await this.ecmService.createDocument(dto, req.user.sub, tenantId);
    return BaseResponseDto.created(doc, requestId, `Documento ${doc.documentCode} cadastrado com sucesso.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('documents')
  @ApiOperation({ summary: 'Listar Documentos do Repositório ECM Corporativo' })
  async listDocuments(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.ecmService.listDocuments(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('documents/:id')
  @ApiOperation({ summary: 'Consultar Documento e Histórico Completo de Versões (SHA-256)' })
  async getDocument(@Param('id') id: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const doc = this.ecmService.findDocumentOrThrow(id);
    return BaseResponseDto.ok(doc, requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('documents/:id/versions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Criar Nova Versão Documental (Versionamento Imutável)' })
  async createNewVersion(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentVersionDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const doc = await this.ecmService.createNewVersion(id, dto, req.user.sub, tenantId);
    return BaseResponseDto.ok(doc, requestId, undefined, `Nova versão v${doc.currentVersion} criada para ${doc.documentCode}.`);
  }

  // ── Digital Archive & Retention ────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Post('documents/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transferir Documento para o Arquivo Digital de Longo Prazo' })
  async archiveDocument(
    @Param('id') id: string,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const doc = await this.searchService.archiveDocument(id, req.user.sub, tenantId);
    return BaseResponseDto.ok(doc, requestId, undefined, `Documento ${doc.documentCode} transferido para o Arquivo Digital.`);
  }

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('documents/:id/dispose')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Descarte Seguro de Documento [SUPER_ADMIN — Tabela de Temporalidade]' })
  async disposeDocument(
    @Param('id') id: string,
    @Body() dto: DisposeDocumentDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const record = await this.searchService.disposeDocument(id, dto, req.user.sub, tenantId);
    return BaseResponseDto.ok(record, requestId, undefined, `Documento ${record.documentCode} descartado com rastro de auditoria SHA-256.`);
  }

  // ── Enterprise Search & Audit ──────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('search')
  @ApiOperation({ summary: 'Pesquisa Corporativa Inteligente (Texto Completo, Metadados, OCR, Semântica)' })
  async searchDocuments(@Query() dto: SearchDocumentDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const searchResult = await this.searchService.searchDocuments(dto, tenantId);
    return BaseResponseDto.ok(searchResult, requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Get('disposals')
  @ApiOperation({ summary: 'Histórico de Descartes Documentais (Trilha de Auditoria)' })
  async listDisposals(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.searchService.listDisposals(), requestId);
  }
}
