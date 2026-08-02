import {
  Controller,
  Get,
  Post,
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

import { EnterpriseArchitectureService } from '../services/enterprise-architecture.service';
import { ArchitectureGovernanceService } from '../services/architecture-governance.service';
import { ArchitectureComplianceService } from '../services/architecture-compliance.service';
import { ArchitectureReviewBoardService } from '../services/architecture-review-board.service';
import { ArchitectureDecisionRecordService } from '../services/architecture-decision-record.service';
import { ArchitectureRepositoryService } from '../services/architecture-repository.service';
import { ArchitectureDriftDetectionService } from '../services/architecture-drift-detection.service';
import { ArchitectureEvolutionService } from '../services/architecture-evolution.service';
import { SolutionReviewService } from '../services/solution-review.service';
import { ArchitectureAuditService } from '../services/architecture-audit.service';

import {
  RegisterArchitectureArtifactDto,
  CreateAdrDto,
  SubmitSolutionReviewDto,
  SubmitArbVoteDto,
  CreateEvolutionPlanDto,
  ArchitectureDomain,
  AdrStatus,
  ArbReviewStatus,
  DriftSeverity,
  TechnologyStatus,
} from '../dto/enterprise-architecture.dto';

/**
 * EnterpriseArchitectureController — P171 EAGO (Fase XXI)
 *
 * REST API da Governança da Arquitetura Corporativa, Conformidade Contínua
 * e Evolução Arquitetural (EAGO):
 * Repositório corporativo, governança, conformidade, ARB (Conselho Arquitetural Digital),
 * ADRs, catálogo de componentes, detecção de architecture drift, evolução e auditoria.
 */
@ApiBearerAuth()
@ApiTags('EAGO — Enterprise Architecture Governance, Compliance & Evolution (P171)')
@Controller('eago')
export class EnterpriseArchitectureController {
  constructor(
    private readonly archSvc: EnterpriseArchitectureService,
    private readonly govSvc: ArchitectureGovernanceService,
    private readonly complianceSvc: ArchitectureComplianceService,
    private readonly arbSvc: ArchitectureReviewBoardService,
    private readonly adrSvc: ArchitectureDecisionRecordService,
    private readonly repoSvc: ArchitectureRepositoryService,
    private readonly driftSvc: ArchitectureDriftDetectionService,
    private readonly evolutionSvc: ArchitectureEvolutionService,
    private readonly solutionSvc: SolutionReviewService,
    private readonly auditSvc: ArchitectureAuditService,
  ) {}

  // ── ENTERPRISE ARCHITECTURE REPOSITORY ─────────────────────────────────────

  @Post('artifacts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar artefato no Repositório Corporativo de Arquitetura' })
  @ApiResponse({ status: 201, description: 'Artefato arquitetural registrado.' })
  registerArtifact(@Body() dto: RegisterArchitectureArtifactDto) {
    return this.archSvc.registerArtifact(dto, dto.author ?? 'API_USER');
  }

  @Get('artifacts')
  @ApiOperation({ summary: 'Listar artefatos de arquitetura por domínio' })
  @ApiQuery({ name: 'domain', required: false, enum: ArchitectureDomain })
  listArtifacts(@Query('domain') domain?: ArchitectureDomain) {
    return this.archSvc.listArtifacts(domain);
  }

  @Get('technologies')
  @ApiOperation({ summary: 'Listar radar de tecnologias homologadas' })
  @ApiQuery({ name: 'status', required: false, enum: TechnologyStatus })
  listTechnologies(@Query('status') status?: TechnologyStatus) {
    return this.archSvc.listHomologatedTechnologies(status);
  }

  @Post('technologies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar tecnologia no radar de homologação' })
  registerTechnology(
    @Body('name') name: string,
    @Body('category') category: string,
    @Body('status') status: TechnologyStatus,
    @Body('allowedDomains') allowedDomains: ArchitectureDomain[],
    @Body('rationale') rationale: string,
  ) {
    return this.archSvc.registerHomologatedTechnology(
      name,
      category,
      status,
      allowedDomains ?? [],
      rationale ?? '',
      'CEA',
    );
  }

  // ── GOVERNANCE & PROPOSALS ──────────────────────────────────────────────────

  @Post('proposals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submeter proposta de alteração arquitetural' })
  submitProposal(
    @Body('title') title: string,
    @Body('domain') domain: ArchitectureDomain,
    @Body('description') description: string,
  ) {
    return this.govSvc.submitProposal(title, domain, description, 'API_USER');
  }

  @Post('proposals/:proposalId/approve')
  @ApiOperation({ summary: 'Aprovar proposta arquitetural' })
  approveProposal(
    @Param('proposalId') proposalId: string,
    @Body('notes') notes: string,
  ) {
    return this.govSvc.approveProposal(proposalId, 'CEA', notes ?? '');
  }

  @Post('proposals/:proposalId/reject')
  @ApiOperation({ summary: 'Rejeitar proposta arquitetural' })
  rejectProposal(
    @Param('proposalId') proposalId: string,
    @Body('reason') reason: string,
  ) {
    return this.govSvc.rejectProposal(proposalId, 'CEA', reason ?? 'Não alinhado aos princípios Aura');
  }

  @Post('proposals/:proposalId/exception')
  @ApiOperation({ summary: 'Conceder exceção arquitetural temporária' })
  grantException(
    @Param('proposalId') proposalId: string,
    @Body('reason') reason: string,
    @Body('expiresInDays') expiresInDays: number,
  ) {
    return this.govSvc.grantException(proposalId, reason, expiresInDays ?? 90, 'CEA');
  }

  @Get('proposals')
  @ApiOperation({ summary: 'Listar propostas arquiteturais' })
  listProposals(@Query('status') status?: any) {
    return this.govSvc.listProposals(status);
  }

  // ── COMPLIANCE ──────────────────────────────────────────────────────────────

  @Post('compliance/evaluate')
  @ApiOperation({ summary: 'Executar avaliação contínua de conformidade arquitetural' })
  evaluateCompliance(@Body('moduleName') moduleName: string) {
    return this.complianceSvc.evaluateCompliance(moduleName ?? 'Ecosystem Core', 'API_USER');
  }

  @Get('compliance/latest')
  @ApiOperation({ summary: 'Obter último relatório de conformidade do módulo' })
  @ApiQuery({ name: 'moduleName' })
  getLatestComplianceReport(@Query('moduleName') moduleName: string) {
    return this.complianceSvc.getLatestReport(moduleName ?? 'Ecosystem Core');
  }

  // ── ARCHITECTURE REVIEW BOARD (ARB) ─────────────────────────────────────────

  @Post('arb/reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submeter solução para apreciação do Conselho ARB' })
  submitForArbReview(@Body() dto: SubmitSolutionReviewDto) {
    return this.arbSvc.submitForReview(dto, 'API_USER');
  }

  @Post('arb/vote')
  @ApiOperation({ summary: 'Registrar voto de membro do ARB' })
  submitArbVote(@Body() dto: SubmitArbVoteDto) {
    return this.arbSvc.submitVote(dto);
  }

  @Post('arb/reviews/:reviewId/finalize')
  @ApiOperation({ summary: 'Finalizar decisão do Conselho ARB' })
  finalizeArbReview(
    @Param('reviewId') reviewId: string,
    @Body('finalStatus') finalStatus: ArbReviewStatus,
    @Body('conditions') conditions: string[],
    @Body('notes') notes: string,
  ) {
    return this.arbSvc.finalizeReview(reviewId, finalStatus, 'CEA', conditions ?? [], notes ?? '');
  }

  @Get('arb/reviews')
  @ApiOperation({ summary: 'Listar sessões de revisão do ARB' })
  @ApiQuery({ name: 'status', required: false, enum: ArbReviewStatus })
  listArbReviews(@Query('status') status?: ArbReviewStatus) {
    return this.arbSvc.listReviews(status);
  }

  // ── ADR (ARCHITECTURE DECISION RECORDS) ─────────────────────────────────────

  @Post('adrs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Architecture Decision Record (ADR)' })
  createAdr(@Body() dto: CreateAdrDto) {
    return this.adrSvc.createAdr(dto, 'API_USER');
  }

  @Post('adrs/:adrId/accept')
  @ApiOperation({ summary: 'Aceitar ADR e vincular aos componentes afetados' })
  acceptAdr(
    @Param('adrId') adrId: string,
    @Body('affectedComponents') affectedComponents: string[],
  ) {
    return this.adrSvc.acceptAdr(adrId, 'CEA', affectedComponents ?? []);
  }

  @Post('adrs/:oldAdrId/supersede')
  @ApiOperation({ summary: 'Substituir ADR antigo por novo ADR' })
  supersedeAdr(
    @Param('oldAdrId') oldAdrId: string,
    @Body('newAdrId') newAdrId: string,
  ) {
    return this.adrSvc.supersedeAdr(oldAdrId, newAdrId, 'CEA');
  }

  @Get('adrs')
  @ApiOperation({ summary: 'Listar ADRs registrados' })
  @ApiQuery({ name: 'status', required: false, enum: AdrStatus })
  listAdrs(@Query('status') status?: AdrStatus) {
    return this.adrSvc.listAdrs(status);
  }

  @Get('adrs/:adrId')
  @ApiOperation({ summary: 'Obter ADR por ID' })
  getAdr(@Param('adrId') adrId: string) {
    const a = this.adrSvc.getAdr(adrId);
    if (!a) return { error: 'ADR não encontrado', adrId };
    return a;
  }

  // ── REPOSITORY & CATALOG ────────────────────────────────────────────────────

  @Get('repository/catalog')
  @ApiOperation({ summary: 'Catálogo corporativo oficial de microsserviços e componentes' })
  getComponentCatalog() {
    return this.repoSvc.getCatalog();
  }

  // ── ARCHITECTURE DRIFT DETECTION ───────────────────────────────────────────

  @Post('drift/scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar varredura automática de Architecture Drift' })
  runDriftScan() {
    return this.driftSvc.runDriftScan('API_USER');
  }

  @Get('drift/violations')
  @ApiOperation({ summary: 'Listar violações de architecture drift identificadas' })
  @ApiQuery({ name: 'severity', required: false, enum: DriftSeverity })
  listDriftViolations(@Query('severity') severity?: DriftSeverity) {
    return this.driftSvc.listViolations(severity);
  }

  // ── EVOLUTION ROADMAP ───────────────────────────────────────────────────────

  @Post('evolution/plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Planejar marco no roadmap de evolução arquitetural' })
  planEvolution(@Body() dto: CreateEvolutionPlanDto) {
    return this.evolutionSvc.planEvolution(dto, 'API_USER');
  }

  @Post('evolution/milestones/:milestoneId/complete')
  @ApiOperation({ summary: 'Concluir marco de evolução arquitetural' })
  completeEvolutionMilestone(@Param('milestoneId') milestoneId: string) {
    return this.evolutionSvc.markMilestoneCompleted(milestoneId, 'CEA');
  }

  @Get('evolution/roadmap')
  @ApiOperation({ summary: 'Obter roadmap completo da evolução arquitetural' })
  getEvolutionRoadmap() {
    return this.evolutionSvc.listRoadmap();
  }

  // ── SOLUTION REVIEW ─────────────────────────────────────────────────────────

  @Post('solutions/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar revisão técnica de solução frente à Arquitetura de Referência' })
  reviewSolution(@Body() dto: SubmitSolutionReviewDto) {
    return this.solutionSvc.reviewSolution(dto, 'CEA');
  }

  // ── AUDIT ────────────────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Trilha imutável de auditoria de arquitetura EAGO (SHA-256)' })
  @ApiQuery({ name: 'subject', required: false })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditSvc.getAuditTrail(subject);
  }
}
