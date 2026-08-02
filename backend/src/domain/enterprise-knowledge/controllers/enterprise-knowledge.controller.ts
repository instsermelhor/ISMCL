import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EnterpriseKnowledgeService } from '../services/enterprise-knowledge.service';
import { OrganizationalMemoryService } from '../services/organizational-memory.service';
import { KnowledgeGraphService } from '../services/knowledge-graph.service';
import { KnowledgeLifecycleService } from '../services/knowledge-lifecycle.service';
import { EnterpriseSearchService } from '../services/enterprise-search.service';
import { InstitutionalTaxonomyService } from '../services/institutional-taxonomy.service';
import { KnowledgeGovernanceService } from '../services/knowledge-governance.service';
import { KnowledgeRecommendationService } from '../services/knowledge-recommendation.service';
import { KnowledgeAuditService } from '../services/knowledge-audit.service';
import {
  AddGraphEdgeDto,
  AddGraphNodeDto,
  CreateKnowledgeItemDto,
  GenerateRecommendationDto,
  KnowledgeDomain,
  KnowledgeType,
  MemoryEventType,
  RecordOrganizationalMemoryDto,
  SearchKnowledgeDto,
  UpdateKnowledgeItemDto,
} from '../dto/enterprise-knowledge.dto';

@ApiTags('AEKIP — Enterprise Knowledge Platform (P158)')
@ApiBearerAuth()
@Controller('api/v1/knowledge')
export class EnterpriseKnowledgeController {
  constructor(
    private readonly knowledgeService: EnterpriseKnowledgeService,
    private readonly memoryService: OrganizationalMemoryService,
    private readonly graphService: KnowledgeGraphService,
    private readonly lifecycleService: KnowledgeLifecycleService,
    private readonly searchService: EnterpriseSearchService,
    private readonly taxonomyService: InstitutionalTaxonomyService,
    private readonly governanceService: KnowledgeGovernanceService,
    private readonly recommendationService: KnowledgeRecommendationService,
    private readonly auditService: KnowledgeAuditService,
  ) {}

  // ── 1. KNOWLEDGE ITEMS CRUD & LIFECYCLE ──────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria novo item de conhecimento' })
  @ApiResponse({ status: 201, description: 'Item criado com sucesso' })
  async createKnowledgeItem(@Body() dto: CreateKnowledgeItemDto) {
    return this.knowledgeService.createKnowledgeItem(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista itens de conhecimento com filtros por domínio e tipo' })
  @ApiQuery({ name: 'domain', required: false, enum: KnowledgeDomain })
  @ApiQuery({ name: 'type', required: false, enum: KnowledgeType })
  listKnowledgeItems(
    @Query('domain') domain?: KnowledgeDomain,
    @Query('type') type?: KnowledgeType,
  ) {
    return this.knowledgeService.listKnowledgeItems(domain, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha item de conhecimento específico' })
  @ApiParam({ name: 'id', type: String })
  getKnowledgeItem(@Param('id') id: string) {
    return this.knowledgeService.getKnowledgeItem(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza item de conhecimento (gera nova versão imutável)' })
  @ApiParam({ name: 'id', type: String })
  async updateKnowledgeItem(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeItemDto,
  ) {
    return this.knowledgeService.updateKnowledgeItem(id, dto);
  }

  @Post(':id/submit-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submete item para revisão formal' })
  async submitForReview(@Param('id') id: string, @Body('requestedBy') requestedBy: string) {
    return this.lifecycleService.submitForReview(id, requestedBy ?? 'USER');
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprova formalmente item de conhecimento' })
  async approveKnowledgeItem(@Param('id') id: string, @Body('approvedBy') approvedBy: string) {
    return this.lifecycleService.approveKnowledgeItem(id, approvedBy ?? 'APPROVER');
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publica item de conhecimento aprovado' })
  async publishKnowledgeItem(@Param('id') id: string) {
    return this.knowledgeService.publishKnowledgeItem(id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arquiva item de conhecimento' })
  async archiveKnowledgeItem(@Param('id') id: string, @Body('archivedBy') archivedBy: string) {
    return this.lifecycleService.archiveKnowledgeItem(id, archivedBy ?? 'ADMIN');
  }

  // ── 2. SEMANTIC SEARCH & RAG ────────────────────────────────────────────────

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pesquisa semântica por linguagem natural com RAG' })
  async searchKnowledge(@Body() dto: SearchKnowledgeDto) {
    return this.searchService.search(dto);
  }

  // ── 3. ORGANIZATIONAL MEMORY ────────────────────────────────────────────────

  @Post('memory')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra memória organizacional de decisão, incidente ou lição aprendida' })
  async recordMemory(@Body() dto: RecordOrganizationalMemoryDto) {
    return this.memoryService.recordMemory(dto);
  }

  @Get('memory')
  @ApiOperation({ summary: 'Consulta eventos de memória organizacional' })
  @ApiQuery({ name: 'eventType', required: false, enum: MemoryEventType })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  queryMemory(
    @Query('eventType') eventType?: MemoryEventType,
    @Query('keyword') keyword?: string,
  ) {
    return this.memoryService.queryMemory(eventType, keyword);
  }

  // ── 4. KNOWLEDGE GRAPH ──────────────────────────────────────────────────────

  @Get('graph/nodes')
  @ApiOperation({ summary: 'Lista todos os nós do Grafo Corporativo de Conhecimento' })
  getGraphNodes() {
    return this.graphService.getAllNodes();
  }

  @Post('graph/nodes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adiciona novo nó ao Grafo de Conhecimento' })
  async addGraphNode(@Body() dto: AddGraphNodeDto) {
    return this.graphService.addNode(dto);
  }

  @Post('graph/edges')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adiciona nova aresta/relação ao Grafo de Conhecimento' })
  async addGraphEdge(@Body() dto: AddGraphEdgeDto) {
    return this.graphService.addEdge(dto);
  }

  @Get('graph/nodes/:id/related')
  @ApiOperation({ summary: 'Navega semanticamente pelos nós relacionados a uma entidade' })
  getRelatedNodes(@Param('id') id: string) {
    return this.graphService.getRelatedNodes(id);
  }

  // ── 5. TAXONOMY ─────────────────────────────────────────────────────────────

  @Get('taxonomy')
  @ApiOperation({ summary: 'Retorna a arvore de taxonomia corporativa' })
  getTaxonomyTree() {
    return this.taxonomyService.getTaxonomyTree();
  }

  // ── 6. RECOMMENDATIONS ──────────────────────────────────────────────────────

  @Post('recommendations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gera recomendações contextuais de conhecimento por perfil de usuário' })
  async generateRecommendations(@Body() dto: GenerateRecommendationDto) {
    return this.recommendationService.generateRecommendations(dto);
  }

  // ── 7. GOVERNANCE & AUDIT ───────────────────────────────────────────────────

  @Get('governance/alerts')
  @ApiOperation({ summary: 'Retorna alertas de governança (itens vencidos, sem responsável)' })
  checkGovernanceAlerts() {
    return this.governanceService.checkGovernanceAlerts();
  }

  @Get('audit/trail')
  @ApiOperation({ summary: 'Consulta a trilha imutável de auditoria do conhecimento (SHA-256)' })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  getAuditTrail(@Query('entityId') entityId?: string) {
    return this.auditService.getAuditTrail(entityId);
  }
}
