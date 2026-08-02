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
  ApiQuery,
} from '@nestjs/swagger';

import { EnterpriseKnowledgeService } from '../services/enterprise-knowledge.service';
import { InstitutionalMemoryService } from '../services/institutional-memory.service';
import { KnowledgeGraphService } from '../services/knowledge-graph.service';
import { SemanticSearchService } from '../services/semantic-search.service';
import { DigitalPreservationService } from '../services/digital-preservation.service';
import { KnowledgeLifecycleService } from '../services/knowledge-lifecycle.service';
import { LessonsLearnedService } from '../services/lessons-learned.service';
import { OrganizationalLearningService } from '../services/organizational-learning.service';
import { KnowledgeGovernanceService } from '../services/knowledge-governance.service';
import { KnowledgeAuditService } from '../services/knowledge-audit.service';

import {
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  RegisterLessonLearnedDto,
  CreateKnowledgeRelationDto,
  SemanticSearchQueryDto,
  DocumentCategory,
  KnowledgeStatus,
  PreservationPolicyType,
  KnowledgeNodeType,
} from '../dto/enterprise-knowledge.dto';

/**
 * EnterpriseKnowledgeController — P170 EKG (Fase XX)
 *
 * REST API da Plataforma Corporativa de Governança do Conhecimento,
 * Memória Institucional e Preservação Digital (EKG):
 * Repositório corporativo, memória cronológica, grafo de conhecimento,
 * pesquisa semântica/RAG, preservação digital, ciclo de vida, lições aprendidas,
 * aprendizado organizacional, IA semântica e auditoria imutável.
 */
@ApiBearerAuth()
@ApiTags('EKG — Enterprise Knowledge Governance, Institutional Memory & Digital Preservation (P170)')
@Controller('ekg')
export class EnterpriseKnowledgeController {
  constructor(
    private readonly knowledgeSvc: EnterpriseKnowledgeService,
    private readonly memorySvc: InstitutionalMemoryService,
    private readonly graphSvc: KnowledgeGraphService,
    private readonly searchSvc: SemanticSearchService,
    private readonly preservationSvc: DigitalPreservationService,
    private readonly lifecycleSvc: KnowledgeLifecycleService,
    private readonly lessonsSvc: LessonsLearnedService,
    private readonly learningSvc: OrganizationalLearningService,
    private readonly governanceSvc: KnowledgeGovernanceService,
    private readonly auditSvc: KnowledgeAuditService,
  ) {}

  // ── ENTERPRISE KNOWLEDGE REPOSITORY ─────────────────────────────────────────

  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar documento no repositório corporativo' })
  @ApiResponse({ status: 201, description: 'Documento criado com metadados estruturados.' })
  createDocument(@Body() dto: CreateKnowledgeDocumentDto) {
    return this.knowledgeSvc.createDocument(dto, dto.author ?? 'API_USER');
  }

  @Put('documents/:documentId')
  @ApiOperation({ summary: 'Atualizar documento e gerar nova versão com hash SHA-256' })
  updateDocument(
    @Param('documentId') documentId: string,
    @Body() dto: UpdateKnowledgeDocumentDto,
  ) {
    return this.knowledgeSvc.updateDocument(documentId, dto);
  }

  @Get('documents')
  @ApiOperation({ summary: 'Listar documentos corporativos com filtros' })
  @ApiQuery({ name: 'category', required: false, enum: DocumentCategory })
  @ApiQuery({ name: 'status', required: false, enum: KnowledgeStatus })
  @ApiQuery({ name: 'tag', required: false })
  listDocuments(
    @Query('category') category?: DocumentCategory,
    @Query('status') status?: KnowledgeStatus,
    @Query('tag') tag?: string,
  ) {
    return this.knowledgeSvc.listDocuments(category, status, tag);
  }

  @Get('documents/:documentId')
  @ApiOperation({ summary: 'Obter detalhamento de documento por ID' })
  getDocument(@Param('documentId') documentId: string) {
    const doc = this.knowledgeSvc.getDocument(documentId);
    if (!doc) return { error: 'Documento não encontrado', documentId };
    return doc;
  }

  // ── INSTITUTIONAL MEMORY ────────────────────────────────────────────────────

  @Post('memory')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar marco permanentemente na Memória Institucional' })
  recordMemory(
    @Body('title') title: string,
    @Body('category') category: any,
    @Body('description') description: string,
    @Body('context') context: string,
    @Body('impact') impact: string,
    @Body('keyActors') keyActors: string[],
    @Body('occurredAt') occurredAt?: string,
  ) {
    return this.memorySvc.recordMemory(
      title,
      category,
      description ?? '',
      context ?? '',
      impact ?? '',
      keyActors ?? [],
      'API_USER',
      occurredAt,
    );
  }

  @Get('memory/timeline')
  @ApiOperation({ summary: 'Obter linha do tempo cronológica da Memória Institucional' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'startYear', required: false })
  @ApiQuery({ name: 'endYear', required: false })
  getMemoryTimeline(
    @Query('category') category?: any,
    @Query('startYear') startYear?: number,
    @Query('endYear') endYear?: number,
  ) {
    return this.memorySvc.getChronologicalTimeline(category, startYear, endYear);
  }

  // ── KNOWLEDGE GRAPH ─────────────────────────────────────────────────────────

  @Post('graph/nodes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nó no Grafo Corporativo de Conhecimento' })
  registerGraphNode(
    @Body('nodeId') nodeId: string,
    @Body('name') name: string,
    @Body('type') type: KnowledgeNodeType,
    @Body('metadata') metadata: Record<string, any>,
  ) {
    return this.graphSvc.registerNode(nodeId, name, type, metadata ?? {});
  }

  @Post('graph/relations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar aresta/relacionamento ao Grafo de Conhecimento' })
  addGraphRelation(@Body() dto: CreateKnowledgeRelationDto) {
    return this.graphSvc.addRelation(dto, 'API_USER');
  }

  @Get('graph/topology')
  @ApiOperation({ summary: 'Métricas de topologia do Grafo de Conhecimento' })
  getGraphTopology() {
    return this.graphSvc.getGraphTopology();
  }

  @Get('graph/neighbors/:nodeId')
  @ApiOperation({ summary: 'Obter vizinhança direta (arestas de saída/entrada) de um nó' })
  getNodeNeighbors(@Param('nodeId') nodeId: string) {
    return this.graphSvc.getNodeNeighbors(nodeId);
  }

  @Get('graph/path')
  @ApiOperation({ summary: 'Localizar caminho semântico entre dois nós no grafo' })
  @ApiQuery({ name: 'startNodeId' })
  @ApiQuery({ name: 'endNodeId' })
  findGraphPath(
    @Query('startNodeId') startNodeId: string,
    @Query('endNodeId') endNodeId: string,
  ) {
    const path = this.graphSvc.findPath(startNodeId, endNodeId);
    if (!path) return { message: 'Nenhum caminho encontrado entre os nós', startNodeId, endNodeId };
    return { startNodeId, endNodeId, path };
  }

  // ── SEMANTIC SEARCH ─────────────────────────────────────────────────────────

  @Post('search/semantic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar pesquisa semântica integrada ao RAG de IA' })
  searchSemantic(@Body() dto: SemanticSearchQueryDto) {
    return this.searchSvc.search(dto, 'API_USER');
  }

  // ── DIGITAL PRESERVATION ───────────────────────────────────────────────────

  @Post('preservation/apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Aplicar política de preservação digital de longo prazo' })
  applyPreservationPolicy(
    @Body('documentId') documentId: string,
    @Body('policyType') policyType: PreservationPolicyType,
    @Body('initialHash') initialHash: string,
  ) {
    return this.preservationSvc.applyPolicy(documentId, policyType, initialHash, 'API_USER');
  }

  @Post('preservation/:preservationId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar integridade do documento contra o hash SHA-256 original' })
  verifyPreservationIntegrity(
    @Param('preservationId') preservationId: string,
    @Body('currentHash') currentHash: string,
  ) {
    return this.preservationSvc.verifyIntegrity(preservationId, currentHash, 'API_USER');
  }

  @Post('preservation/:preservationId/archive')
  @ApiOperation({ summary: 'Mover documento para armazenamento frio (arquivado)' })
  archivePreservedDocument(@Param('preservationId') preservationId: string) {
    return this.preservationSvc.archiveDocument(preservationId, 'API_USER');
  }

  @Get('preservation')
  @ApiOperation({ summary: 'Listar registros de preservação digital' })
  listPreservations() {
    return this.preservationSvc.listPreservations();
  }

  // ── KNOWLEDGE LIFECYCLE ─────────────────────────────────────────────────────

  @Post('lifecycle/:documentId/submit-review')
  @ApiOperation({ summary: 'Submeter documento para revisão' })
  submitDocumentForReview(
    @Param('documentId') documentId: string,
    @Body('notes') notes: string,
  ) {
    return this.lifecycleSvc.submitForReview(documentId, 'API_USER', notes ?? '');
  }

  @Post('lifecycle/:documentId/approve')
  @ApiOperation({ summary: 'Aprovar formalmente documento corporativo' })
  approveDocument(
    @Param('documentId') documentId: string,
    @Body('notes') notes: string,
  ) {
    return this.lifecycleSvc.approveDocument(documentId, 'API_USER', notes ?? '');
  }

  @Post('lifecycle/:documentId/publish')
  @ApiOperation({ summary: 'Publicar documento aprovado' })
  publishDocument(
    @Param('documentId') documentId: string,
    @Body('notes') notes: string,
  ) {
    return this.lifecycleSvc.publishDocument(documentId, 'API_USER', notes ?? '');
  }

  @Post('lifecycle/:documentId/deprecate')
  @ApiOperation({ summary: 'Marcar documento como obsoleto (Deprecated)' })
  deprecateDocument(
    @Param('documentId') documentId: string,
    @Body('reason') reason: string,
  ) {
    return this.lifecycleSvc.deprecateDocument(documentId, 'API_USER', reason ?? 'Obsolescência natural');
  }

  @Get('lifecycle/:documentId/history')
  @ApiOperation({ summary: 'Histórico de transições do ciclo de vida' })
  getLifecycleHistory(@Param('documentId') documentId: string) {
    return this.lifecycleSvc.getTransitionHistory(documentId);
  }

  // ── LESSONS LEARNED ─────────────────────────────────────────────────────────

  @Post('lessons')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar lição aprendida com causa raiz e ações preventivas' })
  registerLesson(@Body() dto: RegisterLessonLearnedDto) {
    return this.lessonsSvc.registerLesson(dto);
  }

  @Post('lessons/:lessonId/apply')
  @ApiOperation({ summary: 'Marcar lição aprendida como efetivamente aplicada ao processo' })
  markLessonAsApplied(@Param('lessonId') lessonId: string) {
    return this.lessonsSvc.markAsApplied(lessonId, 'API_USER');
  }

  @Get('lessons')
  @ApiOperation({ summary: 'Listar lições aprendidas catalogadas' })
  @ApiQuery({ name: 'targetProcess', required: false })
  @ApiQuery({ name: 'onlyApplied', required: false })
  listLessons(
    @Query('targetProcess') targetProcess?: string,
    @Query('onlyApplied') onlyApplied?: boolean,
  ) {
    return this.lessonsSvc.listLessons(targetProcess, onlyApplied);
  }

  // ── ORGANIZATIONAL LEARNING ─────────────────────────────────────────────────

  @Post('learning/competencies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar competência corporativa no catálogo' })
  registerCompetency(
    @Body('name') name: string,
    @Body('category') category: any,
  ) {
    return this.learningSvc.registerCompetency(name, category ?? 'TECHNICAL', 'API_USER');
  }

  @Get('learning/report')
  @ApiOperation({ summary: 'Relatório do aprendizado organizacional e Índice de Aprendizado' })
  getLearningReport() {
    return this.learningSvc.generateLearningReport('API_USER');
  }

  @Get('learning/competencies')
  @ApiOperation({ summary: 'Listar competências corporativas mapeadas' })
  listCompetencies() {
    return this.learningSvc.listCompetencies();
  }

  // ── SEMANTIC AI & GOVERNANCE ────────────────────────────────────────────────

  @Post('governance/summarize/:documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resumir documento corporativo usando IA Semântica' })
  summarizeDocument(@Param('documentId') documentId: string) {
    return this.governanceSvc.summarizeDocument(documentId);
  }

  @Post('governance/ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consulta RAG com resposta baseada EXCLUSIVAMENTE na Base Institucional' })
  answerGroundedQuestion(@Body('question') question: string) {
    return this.governanceSvc.answerGroundedQuestion(question, 'API_USER');
  }

  @Get('governance/check-inconsistencies')
  @ApiOperation({ summary: 'Verificar inconsistências, duplicidades e documentos obsoletos' })
  checkInconsistencies() {
    return this.governanceSvc.checkInconsistencies();
  }

  // ── KNOWLEDGE AUDIT ─────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Trilha imutável de auditoria documental EKG (SHA-256)' })
  @ApiQuery({ name: 'subject', required: false })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditSvc.getAuditTrail(subject);
  }
}
