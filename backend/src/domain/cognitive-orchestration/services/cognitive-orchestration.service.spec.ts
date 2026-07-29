import { Test, TestingModule } from '@nestjs/testing';
import { CognitiveAuditService } from './cognitive-audit.service';
import { CognitiveMemoryService } from './cognitive-memory.service';
import { AIPerformanceMonitoringService } from './ai-performance-monitoring.service';
import { ModelRegistryLifecycleService } from './model-registry-lifecycle.service';
import { AITaskRoutingService } from './ai-task-routing.service';
import { AICollaborationService } from './ai-collaboration.service';
import { InstitutionalReasoningEngine } from './institutional-reasoning.service';
import { AutonomousRecommendationService } from './autonomous-recommendation.service';
import { EventBusService } from '../../../core/event-bus/event-bus.service';
import {
  AgentType,
  CognitiveLevel,
  TaskPriority,
  ModelStatus,
  RecommendationCategory,
} from '../dto/cognitive-orchestration.dto';

describe('CognitiveOrchestration Services', () => {
  let auditService: CognitiveAuditService;
  let memoryService: CognitiveMemoryService;
  let performanceService: AIPerformanceMonitoringService;
  let modelRegistryService: ModelRegistryLifecycleService;
  let taskRoutingService: AITaskRoutingService;
  let collaborationService: AICollaborationService;
  let reasoningEngine: InstitutionalReasoningEngine;
  let recommendationService: AutonomousRecommendationService;

  const mockEventBusService = {
    emit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
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
        { provide: EventBusService, useValue: mockEventBusService },
      ],
    }).compile();

    auditService = module.get<CognitiveAuditService>(CognitiveAuditService);
    memoryService = module.get<CognitiveMemoryService>(CognitiveMemoryService);
    performanceService = module.get<AIPerformanceMonitoringService>(AIPerformanceMonitoringService);
    modelRegistryService = module.get<ModelRegistryLifecycleService>(ModelRegistryLifecycleService);
    taskRoutingService = module.get<AITaskRoutingService>(AITaskRoutingService);
    collaborationService = module.get<AICollaborationService>(AICollaborationService);
    reasoningEngine = module.get<InstitutionalReasoningEngine>(InstitutionalReasoningEngine);
    recommendationService = module.get<AutonomousRecommendationService>(AutonomousRecommendationService);

    jest.clearAllMocks();
  });

  describe('CognitiveAuditService', () => {
    it('should record cognitive audit log with SHA-256 hash and emit CloudEvent', async () => {
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
      expect(mockEventBusService.emit).toHaveBeenCalledWith(
        'aura.cognitive.audit_recorded',
        expect.objectContaining({
          type: 'aura.cognitive.audit_recorded',
          data: expect.objectContaining({ logId: log.logId }),
        }),
      );
    });

    it('should query audit logs filtered by agentId', async () => {
      const logs = await auditService.getAuditLogs('agent-clin-001');
      expect(logs).toBeInstanceOf(Array);
    });
  });

  describe('CognitiveMemoryService', () => {
    it('should store and query short-term and long-term memory entries', async () => {
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
      expect(mockEventBusService.emit).toHaveBeenCalledWith(
        'aura.cognitive.memory_stored',
        expect.anything(),
      );

      const queried = await memoryService.queryMemory('TENANT-001', 'BEN-2026-00001');
      expect(queried.length).toBeGreaterThan(0);
    });
  });

  describe('AIPerformanceMonitoringService', () => {
    it('should record AI telemetry metric and emit alert if latency is high', async () => {
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
      expect(mockEventBusService.emit).toHaveBeenCalledWith(
        'aura.cognitive.performance_recorded',
        expect.anything(),
      );

      const stats = await performanceService.getAggregatedStats('gemini-1.5-pro');
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.avgLatencyMs).toBeGreaterThan(0);
    });
  });

  describe('ModelRegistryLifecycleService', () => {
    it('should register model and perform lifecycle transition', async () => {
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
      expect(model.status).toBe(ModelStatus.STAGING);

      const promoted = await modelRegistryService.promoteModel(model.modelId, ModelStatus.PRODUCTION);
      expect(promoted.status).toBe(ModelStatus.PRODUCTION);
    });
  });

  describe('AITaskRoutingService', () => {
    it('should route task to optimal model based on cost, latency and capability', async () => {
      const decision = await taskRoutingService.routeTask({
        taskType: 'clinical_summary',
        priority: TaskPriority.HIGH,
        requiredCapabilities: ['clinical_knowledge', 'summarization'],
        maxLatencyMs: 2000,
        maxCostBrl: 0.10,
        contentLengthTokens: 1500,
      });

      expect(decision).toBeDefined();
      expect(decision.routingId).toMatch(/^RTE-2026-/);
      expect(decision.selectedModelId).toBeDefined();
      expect(decision.estimatedLatencyMs).toBeLessThanOrEqual(2000);
    });
  });

  describe('AICollaborationService', () => {
    it('should initiate multi-agent collaboration session', async () => {
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
      expect(session.roundsCompleted).toBeGreaterThan(0);
    });
  });

  describe('InstitutionalReasoningEngine', () => {
    it('should execute institutional reasoning and return structured output with confidence', async () => {
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
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.9);
      expect(result.auditTrail).toBeInstanceOf(Array);
    });
  });

  describe('AutonomousRecommendationService', () => {
    it('should generate autonomous recommendation and allow human review', async () => {
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

      const reviewed = await recommendationService.reviewRecommendation(
        rec.recommendationId,
        'USR-DOC-001',
        true,
        'Aprovado pelo médico responsável',
      );

      expect(reviewed.status).toBe('APPROVED');
      expect(reviewed.reviewedBy).toBe('USR-DOC-001');
    });
  });
});
