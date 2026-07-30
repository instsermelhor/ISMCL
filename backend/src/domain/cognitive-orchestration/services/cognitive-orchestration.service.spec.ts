import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CognitiveAuditService } from './cognitive-audit.service';
import { CognitiveMemoryService } from './cognitive-memory.service';
import { AIPerformanceMonitoringService } from './ai-performance-monitoring.service';
import { ModelRegistryLifecycleService } from './model-registry-lifecycle.service';
import { AITaskRoutingService } from './ai-task-routing.service';
import { AICollaborationService } from './ai-collaboration.service';
import { InstitutionalReasoningEngine } from './institutional-reasoning.service';
import { AutonomousRecommendationService } from './autonomous-recommendation.service';
import { CognitiveOrchestratorService } from './cognitive-orchestrator.service';
import { MultiAgentCoordinationService } from './multi-agent-coordination.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  AgentType,
  CognitiveLevel,
  TaskPriority,
  ModelStatus,
  RecommendationCategory,
  AgentDomainRole,
} from '../dto/cognitive-orchestration.dto';

// ── Mock Factories ─────────────────────────────────────────────────────────────

const mockEventBusService = {
  emit: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue({ id: 'evt-mock-001', type: 'mock.event', data: {} }),
  subscribe: jest.fn(),
  getDlq: jest.fn().mockReturnValue([]),
  replayDlq: jest.fn().mockResolvedValue(0),
};

const mockEventEmitter = {
  emit: jest.fn(),
  on: jest.fn(),
};

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('ACOP — CognitiveOrchestration Services (P152)', () => {
  let auditService: CognitiveAuditService;
  let memoryService: CognitiveMemoryService;
  let performanceService: AIPerformanceMonitoringService;
  let modelRegistryService: ModelRegistryLifecycleService;
  let taskRoutingService: AITaskRoutingService;
  let collaborationService: AICollaborationService;
  let reasoningEngine: InstitutionalReasoningEngine;
  let recommendationService: AutonomousRecommendationService;
  let orchestratorService: CognitiveOrchestratorService;
  let multiAgentService: MultiAgentCoordinationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CognitiveAuditService,
        CognitiveMemoryService,
        AIPerformanceMonitoringService,
        ModelRegistryLifecycleService,
        AITaskRoutingService,
        AICollaborationService,
        InstitutionalReasoningEngine,
        AutonomousRecommendationService,
        CognitiveOrchestratorService,
        MultiAgentCoordinationService,
        { provide: EventBusService, useValue: mockEventBusService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    auditService        = module.get<CognitiveAuditService>(CognitiveAuditService);
    memoryService       = module.get<CognitiveMemoryService>(CognitiveMemoryService);
    performanceService  = module.get<AIPerformanceMonitoringService>(AIPerformanceMonitoringService);
    modelRegistryService = module.get<ModelRegistryLifecycleService>(ModelRegistryLifecycleService);
    taskRoutingService  = module.get<AITaskRoutingService>(AITaskRoutingService);
    collaborationService = module.get<AICollaborationService>(AICollaborationService);
    reasoningEngine     = module.get<InstitutionalReasoningEngine>(InstitutionalReasoningEngine);
    recommendationService = module.get<AutonomousRecommendationService>(AutonomousRecommendationService);
    orchestratorService = module.get<CognitiveOrchestratorService>(CognitiveOrchestratorService);
    multiAgentService   = module.get<MultiAgentCoordinationService>(MultiAgentCoordinationService);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. CognitiveAuditService
  // ════════════════════════════════════════════════════════════════════════════

  describe('CognitiveAuditService', () => {
    it('deve registrar log de auditoria cognitiva com SHA-256 e logId correto', async () => {
      const log = await auditService.recordAuditLog({
        agentId: 'agent-clin-001',
        agentType: AgentType.CLINICAL_ASSISTANT,
        cognitiveLevel: CognitiveLevel.DECISION_MAKING,
        actionName: 'clinical_protocol_recommendation',
        inputPayloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        outputResponseHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
        explanationSummary: 'Recomendação baseada em diretrizes do CFM 2.314/2022',
        confidenceScore: 0.96,
        humanInTheLoopRequired: true,
        humanApproved: true,
        humanReviewerId: 'USR-PRO-001',
        latencyMs: 142,
        tokensUsed: 850,
      });

      expect(log).toBeDefined();
      expect(log.logId).toMatch(/^COG-AUD-2026-/);
      expect(log.immutableSignature).toHaveLength(64);
      expect(log.agentType).toBe(AgentType.CLINICAL_ASSISTANT);
      expect(log.cognitiveLevel).toBe(CognitiveLevel.DECISION_MAKING);
      expect(log.humanInTheLoopRequired).toBe(true);
      expect(log.humanApproved).toBe(true);
      expect(log.confidenceScore).toBe(0.96);
    });

    it('deve filtrar logs de auditoria por agentId', async () => {
      await auditService.recordAuditLog({
        agentId: 'agent-clin-001',
        agentType: AgentType.CLINICAL_ASSISTANT,
        cognitiveLevel: CognitiveLevel.REASONING,
        actionName: 'test_action',
        confidenceScore: 0.88,
        humanInTheLoopRequired: false,
      });

      const logs = await auditService.getAuditLogs('agent-clin-001');
      expect(logs).toBeInstanceOf(Array);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every((l) => l.agentId === 'agent-clin-001')).toBe(true);
    });

    it('deve retornar todos os logs quando agentId não for fornecido', async () => {
      await auditService.recordAuditLog({
        agentId: 'agent-soc-001',
        agentType: AgentType.SOCIAL_ASSISTANT,
        cognitiveLevel: CognitiveLevel.PERCEPTION,
        actionName: 'social_assessment',
        confidenceScore: 0.91,
        humanInTheLoopRequired: false,
      });

      const allLogs = await auditService.getAuditLogs();
      expect(allLogs).toBeInstanceOf(Array);
      expect(allLogs.length).toBeGreaterThan(0);
    });

    it('deve manter backward-compat com logAudit()', () => {
      const entry = auditService.logAudit(
        'TestEvent',
        'testAction',
        { foo: 'bar' },
        'TASK-001',
        'agent-001',
        'supervisor-001',
      );
      expect(entry).toBeDefined();
      expect(entry.auditId).toMatch(/^AUD-COG-/);
      expect(entry.sha256Signature).toHaveLength(64);
      expect(entry.immutableSignature).toBe(entry.sha256Signature);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. CognitiveMemoryService
  // ════════════════════════════════════════════════════════════════════════════

  describe('CognitiveMemoryService', () => {
    it('deve armazenar e recuperar memória de curto prazo por tenant e entidade', async () => {
      const memory = await memoryService.storeMemory({
        tenantId: 'TENANT-001',
        entityId: 'BEN-2026-00001',
        memoryType: 'short_term',
        key: 'recent_symptom_summary',
        content: { symptoms: ['ansiedade', 'insônia'], severity: 'moderada' },
        importance: 0.8,
        tags: ['triagem', 'anamnese'],
        vectorEmbeddingRef: 'vec_emb_998123',
      });

      expect(memory).toBeDefined();
      expect(memory.memoryId).toMatch(/^MEM-2026-/);
      expect(memory.memoryType).toBe('short_term');
      expect(memory.tenantId).toBe('TENANT-001');
      expect(memory.entityId).toBe('BEN-2026-00001');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.cognitive.memory.updated.v1',
        expect.objectContaining({ memoryId: memory.memoryId }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve consultar memórias por tenant e entidade', async () => {
      await memoryService.storeMemory({
        tenantId: 'TENANT-002',
        entityId: 'BEN-2026-00002',
        memoryType: 'long_term',
        key: 'institutional_learning_001',
        content: { lesson: 'Alta adesão ao tratamento com TCC semanal' },
        importance: 0.9,
        tags: ['aprendizado'],
      });

      const queried = await memoryService.queryMemory('TENANT-002', 'BEN-2026-00002');
      expect(queried.length).toBeGreaterThan(0);
    });

    it('deve incluir memórias do SYSTEM tenant em qualquer consulta', async () => {
      const systemMemories = await memoryService.queryMemory('TENANT-QUALQUER');
      // Seeds são do SYSTEM_TENANT, devem aparecer em qualquer consulta
      expect(systemMemories.length).toBeGreaterThan(0);
    });

    it('deve manter backward-compat com recordMemory()', () => {
      const record = memoryService.recordMemory(
        'HUMAN_FEEDBACK',
        'TEST_KEY',
        { data: 'test' },
        0.85,
      );
      expect(record).toBeDefined();
      expect(record.memoryId).toMatch(/^MEM-/);
    });

    it('deve buscar memórias por termo textual', () => {
      const results = memoryService.searchMemory('PHQ-9');
      expect(results).toBeInstanceOf(Array);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. AIPerformanceMonitoringService
  // ════════════════════════════════════════════════════════════════════════════

  describe('AIPerformanceMonitoringService', () => {
    it('deve registrar métrica de telemetria e publicar CloudEvent', async () => {
      const metric = await performanceService.recordTelemetry({
        modelId: 'gemini-1.5-pro',
        providerName: 'Google Cloud Vertex AI',
        latencyMs: 3200,
        tokensInput: 1200,
        tokensOutput: 450,
        estimatedCostBrl: 0.045,
        hallucinationRiskScore: 0.03,
        biasScore: 0.01,
        successStatus: true,
      });

      expect(metric).toBeDefined();
      expect(metric.metricId).toMatch(/^TEL-2026-/);
      expect(metric.modelId).toBe('gemini-1.5-pro');
      expect(metric.latencyMs).toBe(3200);
      expect(metric.successStatus).toBe(true);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.cognitive.performance_recorded',
        expect.objectContaining({ metricId: metric.metricId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve calcular estatísticas agregadas após registros de telemetria', async () => {
      await performanceService.recordTelemetry({
        modelId: 'gemini-1.5-pro',
        latencyMs: 200,
        successStatus: true,
      });
      await performanceService.recordTelemetry({
        modelId: 'gemini-1.5-pro',
        latencyMs: 400,
        successStatus: false,
      });

      const stats = await performanceService.getAggregatedStats('gemini-1.5-pro');
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.avgLatencyMs).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(1);
    });

    it('deve retornar stats zerados para modelo sem telemetria', async () => {
      const stats = await performanceService.getAggregatedStats('modelo-sem-dados');
      expect(stats.totalRequests).toBe(0);
      expect(stats.avgLatencyMs).toBe(0);
    });

    it('deve manter backward-compat com evaluateAgentPerformance()', () => {
      const metric = performanceService.evaluateAgentPerformance('agent-test-001', 250, true);
      expect(metric).toBeDefined();
      expect(metric.agentOrModelId).toBe('agent-test-001');
      expect(metric.status).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. ModelRegistryLifecycleService
  // ════════════════════════════════════════════════════════════════════════════

  describe('ModelRegistryLifecycleService', () => {
    it('deve registrar modelo com RegisterModelDto (spec P152) e retornar STAGING', async () => {
      const model = await modelRegistryService.registerModel({
        modelName: 'Aura-Triage-v2.1',
        provider: 'Local-Ollama-FineTuned',
        version: '2.1.0',
        domainCategory: 'Triagem e Classificação de Risco',
        artifactUrl: 's3://aura-models/triage-v2.1.bin',
        checksumSha256: 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890',
        capabilities: ['screening', 'triage', 'phq9_scoring'],
        costPer1kTokensBrl: 0.002,
      });

      expect(model).toBeDefined();
      expect(model.modelId).toMatch(/^MOD-/);
      expect(model.status).toBe(ModelStatus.STAGING);
      expect(model.capabilities).toContain('triage');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.cognitive.model.registered.v1',
        expect.objectContaining({ modelId: model.modelId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve promover modelo para PRODUCTION com aprovação humana', async () => {
      const model = await modelRegistryService.registerModel({
        modelName: 'Aura-Test-Promote',
        provider: 'OpenAI',
        version: '1.0.0',
        domainCategory: 'Teste',
        capabilities: ['test'],
      });

      const promoted = await modelRegistryService.promoteModel(
        model.modelId,
        ModelStatus.PRODUCTION,
        'CISO-001',
      );

      expect(promoted.status).toBe(ModelStatus.PRODUCTION);
      expect(promoted.deployedAt).toBeDefined();
      expect(promoted.humanApproverId).toBe('CISO-001');
    });

    it('deve lançar erro ao promover modelo inexistente', async () => {
      await expect(
        modelRegistryService.promoteModel('MOD-INEXISTENTE-000', ModelStatus.PRODUCTION),
      ).rejects.toThrow('não encontrado');
    });

    it('deve listar todos os modelos registrados incluindo seeds', () => {
      const models = modelRegistryService.listModels();
      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThanOrEqual(3); // 3 seeds
    });

    it('deve obter modelo por ID específico', () => {
      const model = modelRegistryService.getModel('MOD-CLINICAL-BERT-V1');
      expect(model).toBeDefined();
      expect(model!.modelName).toBe('aura-clinical-bert');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. AITaskRoutingService
  // ════════════════════════════════════════════════════════════════════════════

  describe('AITaskRoutingService', () => {
    it('deve rotear tarefa para modelo ideal por capacidade e latência', async () => {
      const decision = await taskRoutingService.routeTask({
        taskType: 'clinical_summary',
        priority: TaskPriority.HIGH,
        requiredCapabilities: ['clinical_knowledge', 'summarization'],
        maxLatencyMs: 5000,
        maxCostBrl: 1.0,
        contentLengthTokens: 1500,
      });

      expect(decision).toBeDefined();
      expect(decision.routingId).toMatch(/^RTE-2026-/);
      expect(decision.selectedModelId).toBeDefined();
      expect(decision.priority).toBe(TaskPriority.HIGH);
      expect(decision.routedAt).toBeDefined();
    });

    it('deve selecionar agente com menor carga entre disponíveis', async () => {
      const d1 = await taskRoutingService.routeTask({
        taskType: 'general',
        priority: TaskPriority.MEDIUM,
        requiredCapabilities: [],
        maxLatencyMs: 10000,
        maxCostBrl: 10,
      });
      expect(d1.selectedModelId).toBeDefined();
    });

    it('deve manter backward-compat com selectOptimalAgents()', () => {
      const agents = taskRoutingService.selectOptimalAgents(
        [AgentDomainRole.PSYCHOLOGY, AgentDomainRole.SOCIAL_WORK],
        TaskPriority.HIGH,
      );
      expect(agents).toBeInstanceOf(Array);
      expect(agents.length).toBeGreaterThan(0);
    });

    it('deve liberar carga do agente após conclusão', () => {
      const agentId = 'agent-psychology-v1';
      // Seleciona para aumentar carga
      taskRoutingService.selectOptimalAgents([AgentDomainRole.PSYCHOLOGY], TaskPriority.LOW);
      // Libera
      taskRoutingService.releaseAgentLoad(agentId);
      const pool = taskRoutingService.getAgentPoolStatus();
      const agent = pool.find((a) => a.agentId === agentId);
      expect(agent).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. AICollaborationService
  // ════════════════════════════════════════════════════════════════════════════

  describe('AICollaborationService', () => {
    it('deve iniciar sessão de colaboração multi-agente com sessionId e consensusScore', async () => {
      const session = await collaborationService.initiateCollaborationSession({
        topic: 'Discussão de Caso Complexo Multidisciplinar',
        participants: [
          { agentId: 'agent-clin-001', role: 'Assistente Clínico' },
          { agentId: 'agent-soc-002', role: 'Assistente Social' },
          { agentId: 'agent-wf-003', role: 'Orquestrador de Workflow' },
        ],
        contextPayload: { caseId: 'CAS-2026-00001', beneficiaryId: 'BEN-2026-00001' },
      });

      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^COL-2026-/);
      expect(session.consensusScore).toBeGreaterThan(0);
      expect(session.consensusScore).toBeLessThanOrEqual(1);
      expect(session.roundsCompleted).toBeGreaterThan(0);
      expect(session.participants).toHaveLength(3);
      expect(session.status).toMatch(/CONSENSUS_REACHED|ESCALATED/);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.cognitive.collaboration.session_started.v1',
        expect.objectContaining({ sessionId: session.sessionId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve manter backward-compat com synthesizeConsensus()', () => {
      const result = collaborationService.synthesizeConsensus('TASK-001', [
        { agentId: 'a1', domainRole: AgentDomainRole.PSYCHOLOGY, analysis: 'TCC indicado', confidence: 0.92, evidences: [] },
        { agentId: 'a2', domainRole: AgentDomainRole.PSYCHIATRY, analysis: 'Medicação avaliada', confidence: 0.89, evidences: [] },
      ]);
      expect(result.taskId).toBe('TASK-001');
      expect(result.consensusScore).toBeGreaterThan(0);
      expect(result.hasConflict).toBe(false);
    });

    it('deve detectar conflito quando confiança de agente é baixa', () => {
      const result = collaborationService.synthesizeConsensus('TASK-CONFLICT', [
        { agentId: 'a1', domainRole: AgentDomainRole.LEGAL, analysis: 'Opção A', confidence: 0.95, evidences: [] },
        { agentId: 'a2', domainRole: AgentDomainRole.COMPLIANCE, analysis: 'Opção B', confidence: 0.45, evidences: [] },
      ]);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictDetails).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. InstitutionalReasoningEngine
  // ════════════════════════════════════════════════════════════════════════════

  describe('InstitutionalReasoningEngine', () => {
    it('deve executar raciocínio institucional e retornar resultado estruturado com confiança ≥ 0.85', async () => {
      const result = await reasoningEngine.executeReasoning({
        tenantId: 'TENANT-001',
        goal: 'Determinar protocolo de acolhimento emergencial',
        contextData: {
          riskLevel: 'HIGH',
          suicidalIdeation: false,
          supportNetwork: 'WEAK',
        },
        constraints: ['Respeitar Resolução CFP 011/2012', 'SLA < 2 horas'],
      });

      expect(result).toBeDefined();
      expect(result.reasoningId).toMatch(/^RSN-2026-/);
      expect(result.queryId).toBe(result.reasoningId);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.85);
      expect(result.auditTrail).toBeInstanceOf(Array);
      expect(result.auditTrail.length).toBeGreaterThan(0);
      expect(result.policyComplianceVerified).toBe(true);
      expect(result.evidenceChain).toBeInstanceOf(Array);
      expect(result.evidenceChain.length).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.cognitive.reasoning.completed.v1',
        expect.objectContaining({ reasoningId: result.reasoningId }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve aceitar ReasoningQueryDto legado (backward-compat)', async () => {
      const result = await reasoningEngine.executeReasoning({
        query: 'Quais intervenções tiveram maior taxa de sucesso para ansiedade severa?',
        sources: ['KnowledgeGraph', 'ECM'],
      });
      expect(result.reasoningId).toMatch(/^RSN-2026-/);
      expect(result.confidenceScore).toBeGreaterThan(0);
    });

    it('deve filtrar evidências apenas das fontes solicitadas', async () => {
      const result = await reasoningEngine.executeReasoning({
        query: 'Teste de filtragem de fontes',
        sources: ['KnowledgeGraph'],
      });
      expect(result.evidenceChain.every((e) => e.source === 'KnowledgeGraph')).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. AutonomousRecommendationService
  // ════════════════════════════════════════════════════════════════════════════

  describe('AutonomousRecommendationService', () => {
    it('deve gerar recomendação com objeto DTO e exigir aprovação humana', async () => {
      const rec = await recommendationService.generateRecommendation({
        tenantId: 'TENANT-001',
        category: RecommendationCategory.CLINICAL_PROTOCOL,
        targetEntityId: 'BEN-2026-00001',
        title: 'Recomendação de Encaminhamento para Psiquiatria Infantil',
        description: 'Beneficiário apresenta pontuação elevada na escala Y-BOCS.',
        suggestedActions: [
          'Agendar consulta com psiquiatra infantil',
          'Enviar notificação à equipe de assistência social',
        ],
        confidenceScore: 0.94,
        evidenceReferences: ['EHR-2026-00001', 'TRG-2026-00001'],
      });

      expect(rec).toBeDefined();
      expect(rec.recommendationId).toMatch(/^REC-2026-/);
      expect(rec.requiresHumanApproval).toBe(true);
      expect(rec.requiresHumanValidation).toBe(true);
      expect(rec.status).toBe('PROPOSED');
      expect(rec.confidenceScore).toBe(0.94);
      expect(rec.category).toBe(RecommendationCategory.CLINICAL_PROTOCOL);
    });

    it('deve processar revisão humana (aprovação) e atualizar status', async () => {
      const rec = await recommendationService.generateRecommendation({
        tenantId: 'TENANT-001',
        category: RecommendationCategory.CARE_QUALITY,
        title: 'Teste Aprovação',
        description: 'Recomendação para teste de aprovação',
        suggestedActions: ['Ação A'],
        confidenceScore: 0.91,
      });

      const reviewed = await recommendationService.reviewRecommendation(
        rec.recommendationId,
        'USR-DOC-001',
        true,
        'Aprovado pelo médico responsável',
      );

      expect(reviewed.status).toBe('APPROVED');
      expect(reviewed.reviewedBy).toBe('USR-DOC-001');
      expect(reviewed.validatorUserId).toBe('USR-DOC-001');
      expect(reviewed.validatedAt).toBeDefined();
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.cognitive.recommendation.approved.v1',
        expect.objectContaining({ recommendationId: rec.recommendationId, approved: true }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve processar revisão humana (rejeição) e atualizar status', async () => {
      const rec = await recommendationService.generateRecommendation({
        tenantId: 'TENANT-001',
        category: RecommendationCategory.OPERATIONAL_OPTIMIZATION,
        title: 'Teste Rejeição',
        description: 'Desc',
        suggestedActions: ['Ação B'],
        confidenceScore: 0.72,
      });

      const reviewed = await recommendationService.reviewRecommendation(
        rec.recommendationId,
        'USR-DIR-002',
        false,
        'Fora do escopo do projeto atual',
      );

      expect(reviewed.status).toBe('REJECTED');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.cognitive.recommendation.rejected.v1',
        expect.objectContaining({ approved: false }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve lançar erro ao revisar recomendação inexistente', async () => {
      await expect(
        recommendationService.reviewRecommendation('REC-INEXISTENTE-0000', 'USR-001', true),
      ).rejects.toThrow('não encontrada');
    });

    it('deve filtrar recomendações por categoria', async () => {
      const careRecs = recommendationService.listRecommendations(RecommendationCategory.CARE_QUALITY);
      expect(careRecs.every((r) => r.category === RecommendationCategory.CARE_QUALITY)).toBe(true);
    });

    it('deve manter backward-compat com processHumanFeedback()', () => {
      const seededRec = recommendationService.getRecommendation('REC-2026-0001');
      expect(seededRec).toBeDefined();

      const result = recommendationService.processHumanFeedback({
        recommendationId: 'REC-2026-0001',
        approved: true,
        validatorUserId: 'PROF-001',
        comments: 'Excelente recomendação',
      });
      expect(result.status).toBe('APPROVED');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. CognitiveOrchestratorService (Orquestrador Central)
  // ════════════════════════════════════════════════════════════════════════════

  describe('CognitiveOrchestratorService', () => {
    it('deve orquestrar tarefa end-to-end com múltiplos agentes e retornar orchestrationId', async () => {
      const result = await orchestratorService.orchestrate({
        taskId: 'TASK-2026-00001',
        title: 'Avaliação multidisciplinar emergencial',
        description: 'Determinar plano terapêutico para caso de alto risco',
        tenantId: 'TENANT-001',
        targetDomains: [AgentDomainRole.PSYCHOLOGY, AgentDomainRole.SOCIAL_WORK],
        priority: TaskPriority.HIGH,
        caseId: 'CAS-2026-00001',
        requireReasoning: true,
        requireRecommendation: false,
      });

      expect(result).toBeDefined();
      expect(result.orchestrationId).toMatch(/^ORCH-2026-/);
      expect(result.taskId).toBe('TASK-2026-00001');
      expect(result.status).toMatch(/COMPLETED|ESCALATED/);
      expect(result.selectedAgents).toBeInstanceOf(Array);
      expect(result.selectedAgents.length).toBeGreaterThan(0);
      expect(result.consensusScore).toBeGreaterThan(0);
      expect(result.synthesizedAnalysis).toBeDefined();
      expect(result.auditTrailRef).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('deve publicar eventos de início e conclusão da orquestração', async () => {
      jest.clearAllMocks();
      await orchestratorService.orchestrate({
        taskId: 'TASK-2026-00002',
        title: 'Teste de eventos',
        description: 'Verificar publicação de eventos',
        tenantId: 'TENANT-001',
        targetDomains: [AgentDomainRole.GOVERNANCE],
        priority: TaskPriority.MEDIUM,
        requireReasoning: false,
        requireRecommendation: false,
      });

      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.cognitive.orchestration.started.v1',
        expect.objectContaining({ taskId: 'TASK-2026-00002' }),
        'TENANT-001',
        expect.anything(),
      );
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.cognitive.orchestration.completed.v1',
        expect.objectContaining({ taskId: 'TASK-2026-00002' }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve incluir resultado de raciocínio quando requireReasoning=true', async () => {
      const result = await orchestratorService.orchestrate({
        taskId: 'TASK-2026-00003',
        title: 'Com Raciocínio',
        description: 'Testar integração com reasoning engine',
        tenantId: 'TENANT-001',
        targetDomains: [AgentDomainRole.CASE_MANAGEMENT],
        priority: TaskPriority.LOW,
        requireReasoning: true,
        requireRecommendation: false,
      });

      expect(result.reasoningResult).toBeDefined();
      expect(result.reasoningResult!.reasoningId).toMatch(/^RSN-/);
      expect(result.reasoningResult!.confidenceScore).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. MultiAgentCoordinationService
  // ════════════════════════════════════════════════════════════════════════════

  describe('MultiAgentCoordinationService', () => {
    it('deve registrar 14 agentes especializados ao inicializar', () => {
      const agents = multiAgentService.getAgentCatalog();
      expect(agents.length).toBe(14);

      const domains = agents.map((a) => a.domainRole);
      expect(domains).toContain(AgentDomainRole.PSYCHOLOGY);
      expect(domains).toContain(AgentDomainRole.PSYCHIATRY);
      expect(domains).toContain(AgentDomainRole.SOCIAL_WORK);
      expect(domains).toContain(AgentDomainRole.LEGAL);
      expect(domains).toContain(AgentDomainRole.FINANCE);
      expect(domains).toContain(AgentDomainRole.HUMAN_RESOURCES);
      expect(domains).toContain(AgentDomainRole.COMPLIANCE);
      expect(domains).toContain(AgentDomainRole.AUDIT);
      expect(domains).toContain(AgentDomainRole.SECURITY);
      expect(domains).toContain(AgentDomainRole.CASE_MANAGEMENT);
      expect(domains).toContain(AgentDomainRole.BI_ANALYTICS);
      expect(domains).toContain(AgentDomainRole.ECM_DOCUMENTS);
      expect(domains).toContain(AgentDomainRole.CORPORATE_UNIVERSITY);
      expect(domains).toContain(AgentDomainRole.GOVERNANCE);
    });

    it('deve atribuir tarefa a agentes disponíveis e publicar evento', async () => {
      const task = await multiAgentService.assignTask(
        'Avaliação de Caso',
        'Avaliação multidisciplinar complexa',
        'TENANT-001',
        [AgentDomainRole.PSYCHOLOGY, AgentDomainRole.PSYCHIATRY],
        TaskPriority.CRITICAL,
      );

      expect(task).toBeDefined();
      expect(task.coordinationId).toMatch(/^COORD-2026-/);
      expect(task.assignedAgents.length).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.cognitive.task.assigned.v1',
        expect.objectContaining({ coordinationId: task.coordinationId }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve resolver conflito ético escalando para supervisão humana', () => {
      const resolution = multiAgentService.resolveConflict(
        'TASK-CONFLICT-001',
        ['agent-psychology-v1', 'agent-psychiatry-v1'],
        'ETHICAL_BOUNDARY',
      );

      expect(resolution).toBeDefined();
      expect(resolution.conflictId).toMatch(/^CONF-/);
      expect(resolution.resolution).toBe('ESCALATE_HUMAN');
      expect(resolution.resolvedBy).toBe('HUMAN_SUPERVISOR');
    });

    it('deve resolver conflito de recomendação por confiança ponderada', () => {
      const resolution = multiAgentService.resolveConflict(
        'TASK-CONFLICT-002',
        ['agent-legal-v1', 'agent-compliance-v1'],
        'RECOMMENDATION_DIVERGENCE',
      );
      expect(resolution.resolution).toBe('CONFIDENCE_WEIGHTED');
    });

    it('deve retornar health summary correto', () => {
      const health = multiAgentService.getSystemHealth();
      expect(health.totalAgents).toBe(14);
      expect(health.healthyAgents).toBe(14);
      expect(health.totalActiveTasks).toBeGreaterThanOrEqual(0);
    });

    it('deve filtrar agentes por domínio específico', () => {
      const psychAgents = multiAgentService.getAgentsByDomain(AgentDomainRole.PSYCHOLOGY);
      expect(psychAgents.length).toBeGreaterThan(0);
      expect(psychAgents.every((a) => a.domainRole === AgentDomainRole.PSYCHOLOGY)).toBe(true);
    });
  });
});
