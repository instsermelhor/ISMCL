import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { ArchitectureAuditService } from './architecture-audit.service';
import { EnterpriseArchitectureService } from './enterprise-architecture.service';
import { ArchitectureGovernanceService } from './architecture-governance.service';
import { ArchitectureComplianceService } from './architecture-compliance.service';
import { ArchitectureReviewBoardService } from './architecture-review-board.service';
import { ArchitectureDecisionRecordService } from './architecture-decision-record.service';
import { ArchitectureRepositoryService } from './architecture-repository.service';
import { ArchitectureDriftDetectionService } from './architecture-drift-detection.service';
import { ArchitectureEvolutionService } from './architecture-evolution.service';
import { SolutionReviewService } from './solution-review.service';

import {
  ArchitectureDomain,
  AdrStatus,
  ArbReviewStatus,
  TechnologyStatus,
} from '../dto/enterprise-architecture.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

describe('P171 EAGO — Enterprise Architecture Governance, Compliance & Evolution Platform', () => {
  let auditSvc: ArchitectureAuditService;
  let archSvc: EnterpriseArchitectureService;
  let govSvc: ArchitectureGovernanceService;
  let complianceSvc: ArchitectureComplianceService;
  let arbSvc: ArchitectureReviewBoardService;
  let adrSvc: ArchitectureDecisionRecordService;
  let repoSvc: ArchitectureRepositoryService;
  let driftSvc: ArchitectureDriftDetectionService;
  let evolutionSvc: ArchitectureEvolutionService;
  let solutionSvc: SolutionReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchitectureAuditService,
        EnterpriseArchitectureService,
        ArchitectureGovernanceService,
        ArchitectureComplianceService,
        ArchitectureReviewBoardService,
        ArchitectureDecisionRecordService,
        ArchitectureRepositoryService,
        ArchitectureDriftDetectionService,
        ArchitectureEvolutionService,
        SolutionReviewService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get(ArchitectureAuditService);
    archSvc = module.get(EnterpriseArchitectureService);
    govSvc = module.get(ArchitectureGovernanceService);
    complianceSvc = module.get(ArchitectureComplianceService);
    arbSvc = module.get(ArchitectureReviewBoardService);
    adrSvc = module.get(ArchitectureDecisionRecordService);
    repoSvc = module.get(ArchitectureRepositoryService);
    driftSvc = module.get(ArchitectureDriftDetectionService);
    evolutionSvc = module.get(ArchitectureEvolutionService);
    solutionSvc = module.get(SolutionReviewService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── ArchitectureAuditService ──────────────────────────────────────────────
  describe('ArchitectureAuditService', () => {
    it('deve registrar entrada de auditoria com assinatura SHA-256 válida', async () => {
      const entry = await auditSvc.recordAudit('ADR_TEST', 'ADR-001', 'CEA', { test: true });
      expect(entry.auditId).toMatch(/^EAGO-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
    });

    it('deve filtrar trilha por assunto', async () => {
      await auditSvc.recordAudit('ACT_A', 'subj-1', 'CEA');
      await auditSvc.recordAudit('ACT_B', 'subj-2', 'CEA');
      const trail = auditSvc.getAuditTrail('subj-1');
      expect(trail.every((t) => t.subject === 'subj-1')).toBe(true);
    });
  });

  // ── EnterpriseArchitectureService ────────────────────────────────────────
  describe('EnterpriseArchitectureService', () => {
    it('deve registrar artefato no repositório corporativo', async () => {
      const art = await archSvc.registerArtifact({
        name: 'C4 Container Model',
        domain: ArchitectureDomain.APPLICATION,
        description: 'Diagrama C4 Nível 2',
        format: 'C4_MODEL',
        author: 'Eng. Ricardo',
      });
      expect(art.artifactId).toMatch(/^ARCH-APPLICATION-/);
      expect(art.version).toBe(1);
    });

    it('deve verificar tecnologias homologadas no radar', () => {
      const isHomologated = archSvc.isTechnologyHomologated('NestJS');
      expect(isHomologated).toBe(true);
    });
  });

  // ── ArchitectureGovernanceService ────────────────────────────────────────
  describe('ArchitectureGovernanceService', () => {
    it('deve submeter proposta e conduzir aprovação/rejeição', async () => {
      const prop = await govSvc.submitProposal('Uso de GraphQL para Relatórios', ArchitectureDomain.INTEGRATION, 'Desc', 'Dev');
      expect(prop.proposalId).toMatch(/^PROP-/);

      const approved = await govSvc.approveProposal(prop.proposalId, 'CEA');
      expect(approved.status).toBe('APPROVED');
    });

    it('deve conceder exceção temporária', async () => {
      const prop = await govSvc.submitProposal('Lib legada', ArchitectureDomain.TECHNOLOGY, 'Desc', 'Dev');
      const exc = await govSvc.grantException(prop.proposalId, 'Necessidade de migração gradual', 30, 'CEA');
      expect(exc.exceptionId).toMatch(/^EXC-/);
    });
  });

  // ── ArchitectureComplianceService ────────────────────────────────────────
  describe('ArchitectureComplianceService', () => {
    it('deve calcular Score de Conformidade (0-100)', async () => {
      const report = await complianceSvc.evaluateCompliance('EnterpriseArchitectureModule', 'CEA');
      expect(report.reportId).toMatch(/^COMP-/);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.rating).toBe('EXCELLENT');
    });
  });

  // ── ArchitectureReviewBoardService ──────────────────────────────────────
  describe('ArchitectureReviewBoardService', () => {
    it('deve submeter solução, registrar votos e finalizar parecer ARB', async () => {
      const session = await arbSvc.submitForReview({
        solutionName: 'Módulo EAGO',
        summary: 'Governança da Arquitetura',
        primaryDomain: ArchitectureDomain.APPLICATION,
        leadArchitect: 'Eng. Ricardo',
      });

      await arbSvc.submitVote({
        reviewId: session.reviewId,
        voterName: 'Eng. Ana (CISO)',
        vote: ArbReviewStatus.APPROVED,
        comments: 'Aprovado sem ressalvas',
      });

      const finalized = await arbSvc.finalizeReview(session.reviewId, ArbReviewStatus.APPROVED, 'CEA');
      expect(finalized.status).toBe(ArbReviewStatus.APPROVED);
    });
  });

  // ── ArchitectureDecisionRecordService ────────────────────────────────────
  describe('ArchitectureDecisionRecordService', () => {
    it('deve criar, aceitar e substituir ADRs', async () => {
      const adr = await adrSvc.createAdr({
        title: 'ADR-100: Uso de EventBus',
        context: 'Contexto',
        problemStatement: 'Problema',
        alternativesEvaluated: ['Alt 1', 'Alt 2'],
        decision: 'Usar EventBus',
        justification: 'Justificativa',
        impacts: ['Impacto 1'],
        author: 'CEA',
      });
      expect(adr.adrId).toMatch(/^ADR-/);

      const accepted = await adrSvc.acceptAdr(adr.adrId, 'CEA', ['EventBusModule']);
      expect(accepted.status).toBe(AdrStatus.ACCEPTED);

      const newAdr = await adrSvc.createAdr({ title: 'ADR-101: Novo EventBus', context: 'c', problemStatement: 'p', alternativesEvaluated: [], decision: 'd', justification: 'j', impacts: [], author: 'CEA' });
      const superseded = await adrSvc.supersedeAdr(adr.adrId, newAdr.adrId, 'CEA');
      expect(superseded.status).toBe(AdrStatus.SUPERSEDED);
    });
  });

  // ── ArchitectureRepositoryService ────────────────────────────────────────
  describe('ArchitectureRepositoryService', () => {
    it('deve fornecer o catálogo oficial de componentes e microsserviços', () => {
      const catalog = repoSvc.getCatalog();
      expect(catalog.totalModules).toBeGreaterThan(0);
      expect(catalog.modules.every((m) => m.isHomologated)).toBe(true);
    });
  });

  // ── ArchitectureDriftDetectionService ─────────────────────────────────────
  describe('ArchitectureDriftDetectionService', () => {
    it('deve executar varredura de drift arquitetural', async () => {
      const report = await driftSvc.runDriftScan('CEA');
      expect(report.reportId).toMatch(/^DRIFT-SCAN-/);
      expect(report.detectedAt).toBeDefined();
    });
  });

  // ── ArchitectureEvolutionService ─────────────────────────────────────────
  describe('ArchitectureEvolutionService', () => {
    it('deve planejar marco de evolução e marcar como concluído', async () => {
      const milestone = await evolutionSvc.planEvolution({
        title: 'Migração para NestJS v11',
        description: 'Upgrade de versão do framework',
        targetQuarter: '2026-Q4',
        affectedComponents: ['AppModule'],
        owner: 'CEA',
      });
      expect(milestone.milestoneId).toMatch(/^EVO-2026-Q4-/);

      const completed = await evolutionSvc.markMilestoneCompleted(milestone.milestoneId, 'CEA');
      expect(completed.status).toBe('COMPLETED');
    });
  });

  // ── SolutionReviewService ─────────────────────────────────────────────────
  describe('SolutionReviewService', () => {
    it('deve avaliar alinhamento com a Arquitetura de Referência Aura', async () => {
      const review = await solutionSvc.reviewSolution({
        solutionName: 'Novo Módulo EAGO',
        summary: 'Governança',
        primaryDomain: ArchitectureDomain.APPLICATION,
        leadArchitect: 'CEA',
        technologiesUsed: ['TypeScript', 'AsyncAPI 2.6.0'],
      });
      expect(review.isAlignedWithAuraReferenceArchitecture).toBe(true);
      expect(review.score).toBe(100);
    });
  });
});
