import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { KnowledgeAuditService } from './knowledge-audit.service';
import { EnterpriseKnowledgeService } from './enterprise-knowledge.service';
import { InstitutionalMemoryService } from './institutional-memory.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { SemanticSearchService } from './semantic-search.service';
import { DigitalPreservationService } from './digital-preservation.service';
import { KnowledgeLifecycleService } from './knowledge-lifecycle.service';
import { LessonsLearnedService } from './lessons-learned.service';
import { OrganizationalLearningService } from './organizational-learning.service';
import { KnowledgeGovernanceService } from './knowledge-governance.service';

import {
  DocumentCategory,
  KnowledgeStatus,
  ConfidentialityLevel,
  PreservationPolicyType,
  KnowledgeNodeType,
} from '../dto/enterprise-knowledge.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

describe('P170 EKG — Enterprise Knowledge Governance, Institutional Memory & Digital Preservation', () => {
  let auditSvc: KnowledgeAuditService;
  let knowledgeSvc: EnterpriseKnowledgeService;
  let memorySvc: InstitutionalMemoryService;
  let graphSvc: KnowledgeGraphService;
  let searchSvc: SemanticSearchService;
  let preservationSvc: DigitalPreservationService;
  let lifecycleSvc: KnowledgeLifecycleService;
  let lessonsSvc: LessonsLearnedService;
  let learningSvc: OrganizationalLearningService;
  let governanceSvc: KnowledgeGovernanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeAuditService,
        EnterpriseKnowledgeService,
        InstitutionalMemoryService,
        KnowledgeGraphService,
        SemanticSearchService,
        DigitalPreservationService,
        KnowledgeLifecycleService,
        LessonsLearnedService,
        OrganizationalLearningService,
        KnowledgeGovernanceService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get(KnowledgeAuditService);
    knowledgeSvc = module.get(EnterpriseKnowledgeService);
    memorySvc = module.get(InstitutionalMemoryService);
    graphSvc = module.get(KnowledgeGraphService);
    searchSvc = module.get(SemanticSearchService);
    preservationSvc = module.get(DigitalPreservationService);
    lifecycleSvc = module.get(KnowledgeLifecycleService);
    lessonsSvc = module.get(LessonsLearnedService);
    learningSvc = module.get(OrganizationalLearningService);
    governanceSvc = module.get(KnowledgeGovernanceService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── KnowledgeAuditService ────────────────────────────────────────────────
  describe('KnowledgeAuditService', () => {
    it('deve registrar auditoria documental com assinatura SHA-256 válida', async () => {
      const entry = await auditSvc.recordAudit('DOC_CREATED', 'DOC-001', 'CKO', { test: true });
      expect(entry.auditId).toMatch(/^EKG-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
    });

    it('deve filtrar trilha por assunto', async () => {
      await auditSvc.recordAudit('ACT_A', 'doc-x', 'CKO');
      await auditSvc.recordAudit('ACT_B', 'doc-y', 'CKO');
      const trail = auditSvc.getAuditTrail('doc-x');
      expect(trail.every((t) => t.subject === 'doc-x')).toBe(true);
    });
  });

  // ── EnterpriseKnowledgeService ───────────────────────────────────────────
  describe('EnterpriseKnowledgeService', () => {
    it('deve criar documento corporativo com hash de versão', async () => {
      const doc = await knowledgeSvc.createDocument({
        title: 'Política de Proteção Infantil',
        summary: 'Diretrizes de proteção integral à criança e ao adolescente.',
        category: DocumentCategory.POLICY,
        content: 'Diretrizes completas de segurança...',
        authorId: 'autora-01',
        author: 'Dra. Maria',
        tags: ['proteção-infantil'],
        confidentiality: ConfidentialityLevel.INTERNAL,
      });
      expect(doc.documentId).toMatch(/^DOC-POLICY-/);
      expect(doc.version).toBe(1);
      expect(doc.summary).toBeDefined();
      expect(doc.versionHistory).toHaveLength(1);
      expect(doc.versionHistory[0].sha256Hash).toHaveLength(64);
    });

    it('deve atualizar documento e incrementar histórico de versão', async () => {
      const doc = await knowledgeSvc.createDocument({
        title: 'POP Atendimento',
        summary: 'Procedimento operacional padrão de atendimento.',
        category: DocumentCategory.STANDARD_OPERATING_PROCEDURE,
        content: 'Versão 1',
        authorId: 'autor-01',
        tags: [],
      });
      const updated = await knowledgeSvc.updateDocument(doc.documentId, {
        content: 'Versão 2 atualizada',
        updatedBy: 'Revisor',
      });
      expect(updated.version).toBe(2);
      expect(updated.versionHistory).toHaveLength(2);
    });
  });

  // ── InstitutionalMemoryService ───────────────────────────────────────────
  describe('InstitutionalMemoryService', () => {
    it('deve registrar memória institucional e permitir busca cronológica', async () => {
      const mem = await memorySvc.recordMemory(
        'Decisão de Adoção de Arquitetura Federada',
        'STRATEGIC_DECISION',
        'Adoção da plataforma multi-tenant federada',
        'Expansão para outras OSCs',
        'Escalabilidade nacional',
        ['CEO', 'CTO'],
        'CKO',
        '2025-06-15T10:00:00Z',
      );
      expect(mem.memoryId).toMatch(/^MEM-STRATEGIC_DECISION-/);

      const timeline = memorySvc.getChronologicalTimeline('STRATEGIC_DECISION');
      expect(timeline.length).toBeGreaterThan(0);
    });
  });

  // ── KnowledgeGraphService ────────────────────────────────────────────────
  describe('KnowledgeGraphService', () => {
    it('deve registrar nós e arestas com travessia e busca de caminhos', async () => {
      await graphSvc.registerNode('DOC-POL-01', 'Política de Proteção', KnowledgeNodeType.POLICY);
      await graphSvc.registerNode('PROJ-SM-01', 'Projeto Saúde Mental', KnowledgeNodeType.PROJECT);

      const edge = await graphSvc.addRelation({
        sourceNodeId: 'DOC-POL-01',
        sourceType: KnowledgeNodeType.POLICY,
        targetNodeId: 'PROJ-SM-01',
        targetType: KnowledgeNodeType.PROJECT,
        relationType: 'GOVERNS',
      });
      expect(edge.edgeId).toMatch(/^EDGE-/);

      const topology = graphSvc.getGraphTopology();
      expect(topology.totalNodes).toBe(2);
      expect(topology.totalEdges).toBe(1);

      const path = graphSvc.findPath('DOC-POL-01', 'PROJ-SM-01');
      expect(path).toEqual(['DOC-POL-01', 'PROJ-SM-01']);
    });
  });

  // ── SemanticSearchService ────────────────────────────────────────────────
  describe('SemanticSearchService', () => {
    it('deve realizar busca semântica e gerar resumo de contexto RAG', async () => {
      await knowledgeSvc.createDocument({
        title: 'Protocolo de Emergência Psicossocial',
        category: DocumentCategory.PROTOCOL,
        content: 'Em caso de crise grave, acionar a equipe de resposta em até 15 minutos.',
        author: 'Coordenação',
      });

      const response = await searchSvc.search({
        query: 'crise psicossocial resposta de emergência',
      });

      expect(response.totalHits).toBeGreaterThan(0);
      expect(response.ragContextSummary).toContain('Protocolo de Emergência Psicossocial');
    });
  });

  // ── DigitalPreservationService ───────────────────────────────────────────
  describe('DigitalPreservationService', () => {
    it('deve aplicar política de preservação e validar integridade por hash', async () => {
      const hash = 'a'.repeat(64);
      const record = await preservationSvc.applyPolicy('DOC-POL-01', PreservationPolicyType.PERMANENT_HISTORICAL, hash, 'CKO');
      expect(record.preservationId).toMatch(/^PRESERV-/);

      const isValid = await preservationSvc.verifyIntegrity(record.preservationId, hash, 'AUDITOR');
      expect(isValid).toBe(true);

      const isInvalid = await preservationSvc.verifyIntegrity(record.preservationId, 'b'.repeat(64), 'AUDITOR');
      expect(isInvalid).toBe(false);
    });

    it('deve arquivar documento em armazenamento frio', async () => {
      const hash = 'c'.repeat(64);
      const record = await preservationSvc.applyPolicy('DOC-OLD-01', PreservationPolicyType.TEMPORARY_1Y, hash, 'CKO');
      const archived = await preservationSvc.archiveDocument(record.preservationId, 'CKO');
      expect(archived.isArchived).toBe(true);
    });
  });

  // ── KnowledgeLifecycleService ────────────────────────────────────────────
  describe('KnowledgeLifecycleService', () => {
    it('deve conduzir documento pelo fluxo DRAFT -> APPROVED -> PUBLISHED', async () => {
      const doc = await knowledgeSvc.createDocument({
        title: 'Norma de Segurança',
        category: DocumentCategory.STANDARD,
        content: 'Norma de acesso',
        author: 'Autor',
      });

      await lifecycleSvc.submitForReview(doc.documentId, 'Autor');
      expect(doc.status).toBe(KnowledgeStatus.IN_REVIEW);

      await lifecycleSvc.approveDocument(doc.documentId, 'CISO');
      expect(doc.status).toBe(KnowledgeStatus.APPROVED);

      await lifecycleSvc.publishDocument(doc.documentId, 'CKO');
      expect(doc.status).toBe(KnowledgeStatus.PUBLISHED);
    });

    it('deve impedir publicação de documento não aprovado', async () => {
      const doc = await knowledgeSvc.createDocument({
        title: 'Rascunho não aprovado',
        category: DocumentCategory.MANUAL,
        content: 'Conteúdo preliminar',
        author: 'Autor',
      });

      await expect(lifecycleSvc.publishDocument(doc.documentId, 'CKO')).rejects.toThrow();
    });
  });

  // ── LessonsLearnedService ────────────────────────────────────────────────
  describe('LessonsLearnedService', () => {
    it('deve registrar lição aprendida e marcar como aplicada', async () => {
      const lesson = await lessonsSvc.registerLesson({
        title: 'Backup sem teste de restauração falhou',
        context: 'Incidente DR 2025',
        rootCause: 'Falta de teste periódico automatizado',
        preventiveAction: 'Implementar script de teste mensal',
        targetProcess: 'Disaster Recovery',
        author: 'Engenheiro de SRE',
      });
      expect(lesson.lessonId).toMatch(/^LESSON-/);
      expect(lesson.isApplied).toBe(false);

      const applied = await lessonsSvc.markAsApplied(lesson.lessonId, 'CTO');
      expect(applied.isApplied).toBe(true);
    });
  });

  // ── OrganizationalLearningService ────────────────────────────────────────
  describe('OrganizationalLearningService', () => {
    it('deve registrar competência e calcular Índice de Aprendizado', async () => {
      await learningSvc.registerCompetency('Governança de Conhecimento', 'MANAGERIAL');
      const report = await learningSvc.generateLearningReport('CKO');

      expect(report.reportId).toMatch(/^LEARN-REP-/);
      expect(report.learningIndex).toBeGreaterThanOrEqual(0);
      expect(report.learningIndex).toBeLessThanOrEqual(100);
    });
  });

  // ── KnowledgeGovernanceService ───────────────────────────────────────────
  describe('KnowledgeGovernanceService', () => {
    it('deve gerar resumo semântico e resposta fundamentada com fontes', async () => {
      const doc = await knowledgeSvc.createDocument({
        title: 'Política de Atendimento Social',
        category: DocumentCategory.POLICY,
        content: 'O atendimento social no Instituto Ser Melhor segue o princípio de gratuidade e acolhimento humano.',
        author: 'Diretoria Social',
      });

      const summary = await governanceSvc.summarizeDocument(doc.documentId);
      expect(summary.summary).toContain('[Resumo IA]');

      const qa = await governanceSvc.answerGroundedQuestion('Quais os princípios do atendimento social?');
      expect(qa.groundedExclusively).toBe(true);
      expect(qa.citedSources.length).toBeGreaterThan(0);
    });

    it('deve checar inconsistências e duplicidades', async () => {
      const check = await governanceSvc.checkInconsistencies();
      expect(check.checkedAt).toBeDefined();
    });
  });
});
