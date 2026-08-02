import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EnterpriseKnowledgeService } from './enterprise-knowledge.service';
import { OrganizationalMemoryService } from './organizational-memory.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { KnowledgeLifecycleService } from './knowledge-lifecycle.service';
import { SemanticKnowledgeEngineService } from './semantic-knowledge-engine.service';
import { EnterpriseSearchService } from './enterprise-search.service';
import { InstitutionalTaxonomyService } from './institutional-taxonomy.service';
import { KnowledgeGovernanceService } from './knowledge-governance.service';
import { KnowledgeRecommendationService } from './knowledge-recommendation.service';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  ConfidentialityLevel,
  GraphEntityType,
  KnowledgeDomain,
  KnowledgeStatus,
  KnowledgeType,
  MemoryEventType,
} from '../dto/enterprise-knowledge.dto';

// ── Mock Factory ───────────────────────────────────────────────────────────────

const mockEventBusService = {
  emit: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue({ id: 'evt-ekip-mock-001', type: 'mock.event', data: {} }),
  subscribe: jest.fn(),
};

const mockEventEmitter = { emit: jest.fn(), on: jest.fn() };

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('AEKIP — Enterprise Knowledge Platform Services (P158)', () => {
  let knowledgeService: EnterpriseKnowledgeService;
  let memoryService: OrganizationalMemoryService;
  let graphService: KnowledgeGraphService;
  let lifecycleService: KnowledgeLifecycleService;
  let semanticEngine: SemanticKnowledgeEngineService;
  let searchService: EnterpriseSearchService;
  let taxonomyService: InstitutionalTaxonomyService;
  let governanceService: KnowledgeGovernanceService;
  let recommendationService: KnowledgeRecommendationService;
  let auditService: KnowledgeAuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeAuditService,
        EnterpriseKnowledgeService,
        OrganizationalMemoryService,
        KnowledgeGraphService,
        KnowledgeLifecycleService,
        SemanticKnowledgeEngineService,
        EnterpriseSearchService,
        InstitutionalTaxonomyService,
        KnowledgeGovernanceService,
        KnowledgeRecommendationService,
        { provide: EventBusService, useValue: mockEventBusService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    knowledgeService    = module.get<EnterpriseKnowledgeService>(EnterpriseKnowledgeService);
    memoryService       = module.get<OrganizationalMemoryService>(OrganizationalMemoryService);
    graphService        = module.get<KnowledgeGraphService>(KnowledgeGraphService);
    lifecycleService    = module.get<KnowledgeLifecycleService>(KnowledgeLifecycleService);
    semanticEngine      = module.get<SemanticKnowledgeEngineService>(SemanticKnowledgeEngineService);
    searchService       = module.get<EnterpriseSearchService>(EnterpriseSearchService);
    taxonomyService     = module.get<InstitutionalTaxonomyService>(InstitutionalTaxonomyService);
    governanceService   = module.get<KnowledgeGovernanceService>(KnowledgeGovernanceService);
    recommendationService = module.get<KnowledgeRecommendationService>(KnowledgeRecommendationService);
    auditService        = module.get<KnowledgeAuditService>(KnowledgeAuditService);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. KnowledgeAuditService — Trilha SHA-256 Imutável
  // ════════════════════════════════════════════════════════════════════════════

  describe('KnowledgeAuditService', () => {
    it('deve registrar auditoria SHA-256 e publicar CloudEvent', async () => {
      const entry = await auditService.recordAudit('CREATE', 'KNOW-001', 'DOCUMENT', 'USER-01', { detail: 'test' });

      expect(entry.auditId).toMatch(/^KAD-/);
      expect(entry.sha256Signature).toHaveLength(64);
      expect(entry.operation).toBe('CREATE');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.knowledge.audit.completed.v1',
        expect.objectContaining({ auditId: entry.auditId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve filtrar trilha por ID de entidade', async () => {
      await auditService.recordAudit('READ', 'KNOW-100', 'POP', 'USER-01');
      await auditService.recordAudit('READ', 'KNOW-200', 'POP', 'USER-01');

      const trail = auditService.getAuditTrail('KNOW-100');
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.every((e) => e.entityId === 'KNOW-100')).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. EnterpriseKnowledgeService — Hub CRUD & Versionamento
  // ════════════════════════════════════════════════════════════════════════════

  describe('EnterpriseKnowledgeService', () => {
    it('deve criar novo item de conhecimento e publicar CloudEvent', async () => {
      const item = await knowledgeService.createKnowledgeItem({
        title: 'POP — Atendimento Clínico',
        description: 'Procedimento para triagem e recepção assistencial',
        type: KnowledgeType.POP,
        domain: KnowledgeDomain.ASSISTENTIAL,
        confidentialityLevel: ConfidentialityLevel.INTERNAL,
        owner: 'Equipe de Enfermagem',
        tags: ['enfermagem', 'triagem'],
      });

      expect(item.knowledgeId).toMatch(/^KNOWLEDGE-/);
      expect(item.status).toBe(KnowledgeStatus.DRAFT);
      expect(item.version).toBe(1);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.knowledge.item.created.v1',
        expect.objectContaining({ knowledgeId: item.knowledgeId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve atualizar item e incrementar versão automaticamente', async () => {
      const item = await knowledgeService.createKnowledgeItem({
        title: 'Documento Base',
        description: 'Descrição inicial',
        type: KnowledgeType.DOCUMENT,
        domain: KnowledgeDomain.OPERATIONAL,
        confidentialityLevel: ConfidentialityLevel.INTERNAL,
      });

      const updated = await knowledgeService.updateKnowledgeItem(item.knowledgeId, {
        title: 'Documento Base — Atualizado',
        changeReason: 'Revisão anual',
      });

      expect(updated.version).toBe(2);
      expect(updated.title).toBe('Documento Base — Atualizado');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.knowledge.item.updated.v1',
        expect.objectContaining({ knowledgeId: item.knowledgeId, newVersion: 2 }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve listar itens pré-cadastrados (seed)', () => {
      const list = knowledgeService.listKnowledgeItems();
      expect(list.length).toBeGreaterThanOrEqual(3);
    });

    it('deve publicar item de conhecimento', async () => {
      const item = await knowledgeService.createKnowledgeItem({
        title: 'Diretriz de Segurança',
        description: 'Regras de acesso',
        type: KnowledgeType.NORM,
        domain: KnowledgeDomain.GOVERNANCE,
        confidentialityLevel: ConfidentialityLevel.INTERNAL,
      });

      const published = await knowledgeService.publishKnowledgeItem(item.knowledgeId);
      expect(published.status).toBe(KnowledgeStatus.PUBLISHED);
      expect(published.publishedAt).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. OrganizationalMemoryService — Memória Institucional
  // ════════════════════════════════════════════════════════════════════════════

  describe('OrganizationalMemoryService', () => {
    it('deve registrar evento de memória e publicar CloudEvent', async () => {
      const memory = await memoryService.recordMemory({
        eventType: MemoryEventType.INSTITUTIONAL_DECISION,
        title: 'Aprovação do Plano de Expansão 2027',
        description: 'Decisão da Diretoria Executiva de ampliar atendimento para o Polo Sul',
        recordedBy: 'CEO-01',
      });

      expect(memory.memoryId).toMatch(/^MEM-/);
      expect(memory.eventType).toBe(MemoryEventType.INSTITUTIONAL_DECISION);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.knowledge.memory.updated.v1',
        expect.objectContaining({ memoryId: memory.memoryId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve retornar histórico da memória filtrando por palavra-chave', () => {
      const result = memoryService.queryMemory(undefined, 'AUOC');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toContain('AUOC');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. KnowledgeGraphService — Grafo Corporativo
  // ════════════════════════════════════════════════════════════════════════════

  describe('KnowledgeGraphService', () => {
    it('deve adicionar nó e aresta ao grafo e publicar CloudEvent', async () => {
      const node = await graphService.addNode({
        label: 'Módulo AUOC',
        entityType: GraphEntityType.MODULE,
      });
      const docNode = graphService.getAllNodes()[0];

      const edge = await graphService.addEdge({
        sourceNodeId: docNode.nodeId,
        targetNodeId: node.nodeId,
        relationshipType: 'DOCUMENTED_BY',
      });

      expect(node.nodeId).toMatch(/^NODE-/);
      expect(edge.edgeId).toMatch(/^EDGE-/);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.knowledge.graph.updated.v1',
        expect.objectContaining({ action: 'ADD_EDGE' }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve navegar pelos nós relacionados', () => {
      const firstNode = graphService.getAllNodes()[0];
      const related = graphService.getRelatedNodes(firstNode.nodeId);
      expect(related.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. KnowledgeLifecycleService — Ciclo de Vida Documental
  // ════════════════════════════════════════════════════════════════════════════

  describe('KnowledgeLifecycleService', () => {
    it('deve transicionar item: DRAFT -> UNDER_REVIEW -> APPROVED -> ARCHIVED', async () => {
      const item = await knowledgeService.createKnowledgeItem({
        title: 'Manual de Procedimentos',
        description: 'Manual de operações',
        type: KnowledgeType.POP,
        domain: KnowledgeDomain.OPERATIONAL,
        confidentialityLevel: ConfidentialityLevel.INTERNAL,
      });

      const t1 = await lifecycleService.submitForReview(item.knowledgeId, 'AUTHOR-01');
      expect(t1.newStatus).toBe(KnowledgeStatus.UNDER_REVIEW);

      const t2 = await lifecycleService.approveKnowledgeItem(item.knowledgeId, 'REVIEWER-01');
      expect(t2.newStatus).toBe(KnowledgeStatus.APPROVED);

      const t3 = await lifecycleService.archiveKnowledgeItem(item.knowledgeId, 'ADMIN-01');
      expect(t3.newStatus).toBe(KnowledgeStatus.ARCHIVED);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. SemanticKnowledgeEngineService — Motor Semântico
  // ════════════════════════════════════════════════════════════════════════════

  describe('SemanticKnowledgeEngineService', () => {
    it('deve extrair conceitos e domínio assistencial de texto psicossocial', () => {
      const result = semanticEngine.analyzeText('Protocolo para acolhimento e triagem em saúde mental e psicologia');
      expect(result.domain).toBe(KnowledgeDomain.ASSISTENTIAL);
      expect(result.keyConcepts).toContain('Saúde Mental');
      expect(result.semanticEmbeddingSimulated).toHaveLength(16);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. EnterpriseSearchService — Pesquisa Semântica & RAG
  // ════════════════════════════════════════════════════════════════════════════

  describe('EnterpriseSearchService', () => {
    it('deve realizar busca semântica, retornar hits ordenados e resposta RAG', async () => {
      const result = await searchService.search({
        query: 'Como funciona o acolhimento em saúde mental e psicologia?',
        useRag: true,
      });

      expect(result.searchId).toMatch(/^SCH-/);
      expect(result.totalHits).toBeGreaterThan(0);
      expect(result.hits[0].similarityScore).toBeGreaterThan(0.5);
      expect(result.ragGeneratedAnswer).toContain('[RAG Engine]');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.knowledge.search.executed.v1',
        expect.objectContaining({ searchId: result.searchId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. InstitutionalTaxonomyService — Taxonomia Corporativa
  // ════════════════════════════════════════════════════════════════════════════

  describe('InstitutionalTaxonomyService', () => {
    it('deve retornar árvore de taxonomia pré-cadastrada', () => {
      const tree = taxonomyService.getTaxonomyTree();
      expect(tree.length).toBeGreaterThanOrEqual(4);
    });

    it('deve classificar item com nível de criticidade e validade em meses', () => {
      const res = taxonomyService.classifyItem(
        'KNOW-001',
        KnowledgeDomain.COMPLIANCE,
        KnowledgeType.POLICY,
        ConfidentialityLevel.INTERNAL,
      );
      expect(res.criticismLevel).toBe('CRITICAL');
      expect(res.validityMonths).toBe(12);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. KnowledgeGovernanceService — Alertas de Governança
  // ════════════════════════════════════════════════════════════════════════════

  describe('KnowledgeGovernanceService', () => {
    it('deve checar alertas de governança sem falhas', () => {
      const alerts = governanceService.checkGovernanceAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. KnowledgeRecommendationService — Recomendações
  // ════════════════════════════════════════════════════════════════════════════

  describe('KnowledgeRecommendationService', () => {
    it('deve gerar recomendações por perfil de usuário e publicar CloudEvent', async () => {
      const res = await recommendationService.generateRecommendations({
        userId: 'PROF-001',
        userRole: 'Psicólogo Clínico',
        contextDomain: KnowledgeDomain.ASSISTENTIAL,
        maxRecommendations: 2,
      });

      expect(res.recommendationId).toMatch(/^REC-/);
      expect(res.recommendations.length).toBeGreaterThan(0);
      expect(res.recommendations[0].recommendationScore).toBeGreaterThan(0.9);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.knowledge.recommendation.generated.v1',
        expect.objectContaining({ recommendationId: res.recommendationId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });
});
