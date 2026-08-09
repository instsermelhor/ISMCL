import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationalMemoryService } from './organizational-memory.service';
import { LessonsLearnedService } from './lessons-learned.service';
import { InstitutionalTaxonomyService } from './institutional-taxonomy.service';
import { EnterpriseSearchService } from './enterprise-search.service';
import { KnowledgeRecommendationService } from './knowledge-recommendation.service';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EnterpriseKnowledgeService } from './enterprise-knowledge.service';
import { SemanticKnowledgeEngineService } from './semantic-knowledge-engine.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  MemoryEventType,
  KnowledgeNodeType,
  KnowledgeDomain,
  ConfidentialityLevel,
  DocumentCategory,
} from '../dto/enterprise-knowledge.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

describe('P170 EKG — Serviços Corrigidos: Organizational Memory, Lessons Learned, Taxonomy, Search, Recommendation', () => {
  let memorySvc: OrganizationalMemoryService;
  let lessonsSvc: LessonsLearnedService;
  let taxonomySvc: InstitutionalTaxonomyService;
  let searchSvc: EnterpriseSearchService;
  let recommendationSvc: KnowledgeRecommendationService;
  let auditSvc: KnowledgeAuditService;
  let knowledgeSvc: EnterpriseKnowledgeService;
  let semanticSvc: SemanticKnowledgeEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeAuditService,
        EnterpriseKnowledgeService,
        SemanticKnowledgeEngineService,
        OrganizationalMemoryService,
        LessonsLearnedService,
        InstitutionalTaxonomyService,
        EnterpriseSearchService,
        KnowledgeRecommendationService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get(KnowledgeAuditService);
    knowledgeSvc = module.get(EnterpriseKnowledgeService);
    semanticSvc = module.get(SemanticKnowledgeEngineService);
    memorySvc = module.get(OrganizationalMemoryService);
    lessonsSvc = module.get(LessonsLearnedService);
    taxonomySvc = module.get(InstitutionalTaxonomyService);
    searchSvc = module.get(EnterpriseSearchService);
    recommendationSvc = module.get(KnowledgeRecommendationService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── OrganizationalMemoryService ────────────────────────────────────────────

  describe('OrganizationalMemoryService', () => {
    it('deve registrar memória organizacional com ID estruturado', async () => {
      const entry = await memorySvc.recordMemory({
        title: 'Adoção do ACTG Gateway',
        description: 'Implementação do módulo de telecomunicações ACTG para teleconsulta',
        eventType: MemoryEventType.ARCHITECTURAL_CHANGE,
        recordedBy: 'CTO-AURA',
      });

      expect(entry.memoryId).toMatch(/^MEM-/);
      expect(entry.eventType).toBe(MemoryEventType.ARCHITECTURAL_CHANGE);
      expect(entry.recordedBy).toBe('CTO-AURA');
    });

    it('deve registrar auditoria com performedBy correto (não eventType)', async () => {
      const spy = jest.spyOn(auditSvc, 'recordAudit');

      await memorySvc.recordMemory({
        title: 'Lição Aprendida Kafka',
        description: 'Consumer groups por domínio evitam colisões',
        eventType: MemoryEventType.LESSON_LEARNED,
        recordedBy: 'SRE-LEAD',
      });

      expect(spy).toHaveBeenCalledWith(
        'RECORD_MEMORY',
        expect.any(String),
        'SRE-LEAD', // performedBy deve ser recordedBy, não eventType
        expect.objectContaining({ eventType: MemoryEventType.LESSON_LEARNED }),
      );
    });

    it('deve filtrar memórias por tipo de evento', async () => {
      await memorySvc.recordMemory({
        title: 'Decisão Estratégica: Multi-tenant',
        description: 'Adoção do modelo federado',
        eventType: MemoryEventType.STRATEGIC_DECISION,
        recordedBy: 'CEO',
      });

      const results = memorySvc.queryMemory(MemoryEventType.STRATEGIC_DECISION);
      expect(results.every((r) => r.eventType === MemoryEventType.STRATEGIC_DECISION)).toBe(true);
    });

    it('deve ter memórias seed pré-carregadas', () => {
      const all = memorySvc.getAllMemory();
      expect(all.length).toBeGreaterThan(0);
    });

    it('deve publicar evento ao registrar memória', async () => {
      await memorySvc.recordMemory({
        title: 'Marco Técnico',
        description: 'Deploy na nuvem',
        eventType: MemoryEventType.PROJECT_MILESTONE,
        recordedBy: 'DevOps',
      });

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.knowledge.memory.updated.v1',
        expect.objectContaining({ eventType: MemoryEventType.PROJECT_MILESTONE }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── LessonsLearnedService ──────────────────────────────────────────────────

  describe('LessonsLearnedService', () => {
    it('deve registrar lição aprendida com campos opcionais como string vazia por padrão', async () => {
      const lesson = await lessonsSvc.registerLesson({
        title: 'Backup sem restauração',
        description: 'Backup executado mas não testado em restore',
        author: 'SRE-Lead',
        // campos opcionais não fornecidos
      });

      expect(lesson.lessonId).toMatch(/^LESSON-/);
      expect(lesson.rootCause).toBe('');
      expect(lesson.preventiveAction).toBe('');
      expect(lesson.targetProcess).toBe('');
      expect(lesson.context).toBe('');
      expect(lesson.isApplied).toBe(false);
    });

    it('deve registrar lição aprendida com todos os campos preenchidos', async () => {
      const lesson = await lessonsSvc.registerLesson({
        title: 'Kafka Consumer Group Collision',
        description: 'Mensagens duplicadas por consumer groups compartilhados',
        context: 'Incidente Produção 2025-06',
        rootCause: 'Consumer group único para múltiplos domínios',
        preventiveAction: 'Separar consumer groups por bounded context',
        targetProcess: 'Event-Driven Architecture',
        author: 'Eng. Sênior',
      });

      expect(lesson.context).toBe('Incidente Produção 2025-06');
      expect(lesson.rootCause).toBe('Consumer group único para múltiplos domínios');
      expect(lesson.targetProcess).toBe('Event-Driven Architecture');
    });

    it('deve marcar lição como aplicada com timestamp', async () => {
      const lesson = await lessonsSvc.registerLesson({
        title: 'Deploy sem rollback',
        description: 'Deploy sem strategy de rollback',
        author: 'DevOps',
      });

      const applied = await lessonsSvc.markAsApplied(lesson.lessonId, 'CTO');
      expect(applied.isApplied).toBe(true);
      expect(applied.appliedAt).toBeDefined();
    });

    it('deve listar lições filtradas por processo alvo', async () => {
      await lessonsSvc.registerLesson({
        title: 'Lição DR',
        description: 'Teste de DR falhou',
        targetProcess: 'Disaster Recovery',
        author: 'SRE',
      });

      const drLessons = lessonsSvc.listLessons('Disaster Recovery');
      expect(drLessons.every((l) => l.targetProcess.toLowerCase().includes('disaster recovery'))).toBe(true);
    });

    it('deve lançar erro ao marcar como aplicada ID inexistente', async () => {
      await expect(lessonsSvc.markAsApplied('LESSON-INEXISTENTE', 'Admin')).rejects.toThrow();
    });
  });

  // ── InstitutionalTaxonomyService ───────────────────────────────────────────

  describe('InstitutionalTaxonomyService', () => {
    it('deve classificar todos os KnowledgeNodeTypes sem erro', () => {
      const allTypes = Object.values(KnowledgeNodeType);

      for (const type of allTypes) {
        const result = taxonomySvc.classifyItem(
          `node-${type}`,
          KnowledgeDomain.GOVERNANCE,
          type as any,
          ConfidentialityLevel.INTERNAL,
        );
        expect(result.criticismLevel).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
        expect(result.validityMonths).toBeGreaterThan(0);
      }
    });

    it('deve classificar POLICY como CRITICAL com validade de 12 meses', () => {
      const result = taxonomySvc.classifyItem(
        'doc-policy-001',
        KnowledgeDomain.GOVERNANCE,
        KnowledgeNodeType.POLICY,
        ConfidentialityLevel.RESTRICTED,
      );

      expect(result.criticismLevel).toBe('CRITICAL');
      expect(result.validityMonths).toBe(12);
    });

    it('deve classificar PERSON como LOW', () => {
      const result = taxonomySvc.classifyItem(
        'person-001',
        KnowledgeDomain.CLINICAL,
        KnowledgeNodeType.PERSON,
        ConfidentialityLevel.PUBLIC,
      );

      expect(result.criticismLevel).toBe('LOW');
    });

    it('deve classificar RISK como HIGH', () => {
      const result = taxonomySvc.classifyItem(
        'risk-001',
        KnowledgeDomain.OPERATIONAL,
        KnowledgeNodeType.RISK,
        ConfidentialityLevel.CONFIDENTIAL,
      );

      expect(result.criticismLevel).toBe('HIGH');
    });

    it('deve retornar árvore de taxonomia com categorias seed', () => {
      const tree = taxonomySvc.getTaxonomyTree();
      expect(tree.length).toBeGreaterThan(0);
      expect(tree.some((c) => c.domain === KnowledgeDomain.GOVERNANCE)).toBe(true);
    });
  });

  // ── EnterpriseSearchService ────────────────────────────────────────────────

  describe('EnterpriseSearchService', () => {
    beforeEach(async () => {
      await knowledgeSvc.createDocument({
        title: 'Protocolo de Crise Psicossocial',
        summary: 'Procedimentos de resposta a crises psicossociais graves',
        category: DocumentCategory.PROTOCOL,
        content: 'Em caso de crise psicossocial, acionar equipe de resposta imediata em até 15 minutos.',
        authorId: 'coord-01',
        tags: ['crise', 'psicossocial', 'protocolo'],
      });
    });

    it('deve executar busca semântica e retornar hits', async () => {
      const result = await searchSvc.search({ query: 'crise psicossocial' });

      expect(result.searchId).toMatch(/^SCH-/);
      expect(result.totalHits).toBeGreaterThan(0);
      expect(result.executedAt).toBeDefined();
    });

    it('deve gerar resposta RAG com o hit mais relevante', async () => {
      const result = await searchSvc.search({ query: 'protocolo crise resposta' });

      expect(result.ragGeneratedAnswer).toBeDefined();
      expect(result.ragGeneratedAnswer).toContain('[RAG Engine]');
    });

    it('deve publicar evento de busca executada', async () => {
      await searchSvc.search({ query: 'política atendimento' });

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.knowledge.search.executed.v1',
        expect.objectContaining({ query: 'política atendimento' }),
        'SYSTEM',
        expect.any(Object),
      );
    });

    it('deve registrar auditoria com performedBy correto', async () => {
      const spy = jest.spyOn(auditSvc, 'recordAudit');
      await searchSvc.search({ query: 'normas LGPD' });

      expect(spy).toHaveBeenCalledWith(
        'SEARCH',
        expect.any(String),
        'USER', // performedBy deve ser string 'USER', não metadata
        expect.objectContaining({ query: 'normas LGPD' }),
      );
    });
  });

  // ── KnowledgeRecommendationService ────────────────────────────────────────

  describe('KnowledgeRecommendationService', () => {
    it('deve gerar recomendações com ID estruturado', async () => {
      const result = await recommendationSvc.generateRecommendations({
        userId: 'prof-001',
      });

      expect(result.recommendationId).toMatch(/^REC-/);
      expect(result.userId).toBe('prof-001');
      expect(result.recommendedAt).toBeDefined();
    });

    it('deve respeitar o limite máximo de recomendações', async () => {
      // Cria documentos suficientes
      for (let i = 0; i < 5; i++) {
        await knowledgeSvc.createDocument({
          title: `Documento ${i}`,
          summary: `Resumo do documento ${i}`,
          category: DocumentCategory.POLICY,
          content: `Conteúdo ${i}`,
          authorId: 'autor-01',
          tags: [],
        });
      }

      const result = await recommendationSvc.generateRecommendations({
        userId: 'user-001',
        limit: 2,
      });

      expect(result.recommendations.length).toBeLessThanOrEqual(2);
    });

    it('deve registrar auditoria com userId como performedBy', async () => {
      const spy = jest.spyOn(auditSvc, 'recordAudit');

      await recommendationSvc.generateRecommendations({ userId: 'prof-audit-test' });

      expect(spy).toHaveBeenCalledWith(
        'GENERATE_RECOMMENDATIONS',
        expect.any(String),
        'prof-audit-test', // userId deve ser o performedBy
        expect.objectContaining({ type: 'RECOMMENDATION' }),
      );
    });

    it('deve publicar evento de recomendações geradas', async () => {
      await recommendationSvc.generateRecommendations({ userId: 'prof-002' });

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.knowledge.recommendation.generated.v1',
        expect.objectContaining({ userId: 'prof-002' }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });
});
