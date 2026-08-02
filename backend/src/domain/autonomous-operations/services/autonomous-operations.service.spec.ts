import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { ImprovementGovernanceService } from './improvement-governance.service';
import { AIOperationsOrchestratorService } from './ai-operations-orchestrator.service';
import { MultiAgentCoordinationService } from './multi-agent-coordination.service';
import { ContinuousImprovementService } from './continuous-improvement.service';
import { OperationalRecommendationService } from './operational-recommendation.service';
import { AITaskDelegationService } from './ai-task-delegation.service';
import { OperationalOptimizationService } from './operational-optimization.service';
import { AIPerformanceMonitoringService } from './ai-performance-monitoring.service';
import { AutonomousAssistanceService } from './autonomous-assistance.service';
import { OperationalLearningService } from './operational-learning.service';

import {
  AgentSpecialty,
  RecommendationCategory,
  RecommendationPriority,
  RecommendationStatus,
  TaskAssigneeType,
  TaskPriority,
} from '../dto/autonomous-operations.dto';

// ── Mock ─────────────────────────────────────────────────────────────────────

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Prompt 164 — AOCP: Autonomous Operations, AI Orchestration & Continuous Improvement Platform', () => {
  let governanceService: ImprovementGovernanceService;
  let orchestratorService: AIOperationsOrchestratorService;
  let multiAgentService: MultiAgentCoordinationService;
  let continuousService: ContinuousImprovementService;
  let recommendationService: OperationalRecommendationService;
  let delegationService: AITaskDelegationService;
  let optimizationService: OperationalOptimizationService;
  let performanceService: AIPerformanceMonitoringService;
  let assistanceService: AutonomousAssistanceService;
  let learningService: OperationalLearningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImprovementGovernanceService,
        AIOperationsOrchestratorService,
        MultiAgentCoordinationService,
        ContinuousImprovementService,
        OperationalRecommendationService,
        AITaskDelegationService,
        OperationalOptimizationService,
        AIPerformanceMonitoringService,
        AutonomousAssistanceService,
        OperationalLearningService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    governanceService = module.get(ImprovementGovernanceService);
    orchestratorService = module.get(AIOperationsOrchestratorService);
    multiAgentService = module.get(MultiAgentCoordinationService);
    continuousService = module.get(ContinuousImprovementService);
    recommendationService = module.get(OperationalRecommendationService);
    delegationService = module.get(AITaskDelegationService);
    optimizationService = module.get(OperationalOptimizationService);
    performanceService = module.get(AIPerformanceMonitoringService);
    assistanceService = module.get(AutonomousAssistanceService);
    learningService = module.get(OperationalLearningService);

    jest.clearAllMocks();
  });

  // ── 1. ImprovementGovernanceService ───────────────────────────────────────

  describe('ImprovementGovernanceService', () => {
    it('should record an audit entry with SHA-256 signature', async () => {
      const entry = await governanceService.recordAudit('TEST_ACTION', 'subject-1', 'CAIO');
      expect(entry.auditId).toMatch(/^AOCP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
    });

    it('should publish aura.operations.audit.completed.v1 event', async () => {
      await governanceService.recordAudit('ACTION', 'sub', 'COO');
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.operations.audit.completed.v1',
        expect.objectContaining({ action: 'ACTION' }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 2. AIOperationsOrchestratorService ─────────────────────────────────────

  describe('AIOperationsOrchestratorService', () => {
    it('should return orchestrator status with HUMAN_APPROVAL_REQUIRED mode', async () => {
      const status = await orchestratorService.getOrchestratorStatus();
      expect(status.orchestratorId).toMatch(/^ORCH-/);
      expect(status.orchestratorState).toBe('ACTIVE');
      expect(status.governanceMode).toBe('HUMAN_APPROVAL_REQUIRED');
    });
  });

  // ── 3. MultiAgentCoordinationService ──────────────────────────────────────

  describe('MultiAgentCoordinationService', () => {
    it('should seed 11 specialized AI agents', () => {
      const agents = multiAgentService.listAgents();
      expect(agents.length).toBe(11);
    });

    it('should coordinate agents for a given demand', async () => {
      const res = await multiAgentService.coordinateAgents({
        taskDescription: 'Otimização de rotas assistenciais',
        targetSpecialties: [AgentSpecialty.ARCHITECTURE, AgentSpecialty.SOCIAL_ERP],
      });
      expect(res.coordinationId).toMatch(/^COORD-/);
      expect(res.participatingAgents).toHaveLength(2);
      expect(res.consensusOutput).toContain('Consenso estabelecido');
    });
  });

  // ── 4. ContinuousImprovementService ────────────────────────────────────────

  describe('ContinuousImprovementService', () => {
    it('should detect improvement opportunities', async () => {
      const opps = await continuousService.detectOpportunities();
      expect(opps.length).toBeGreaterThan(0);
      expect(opps[0].impactScorePercent).toBeGreaterThan(50);
    });
  });

  // ── 5. OperationalRecommendationService ────────────────────────────────────

  describe('OperationalRecommendationService', () => {
    it('should generate an operational recommendation in PROPOSED status', async () => {
      const rec = await recommendationService.generateRecommendation({
        title: 'Implementação de CDN Edge',
        category: RecommendationCategory.PERFORMANCE,
        justification: 'Alta latência para usuários em regiões remotas',
        priority: RecommendationPriority.HIGH,
      });
      expect(rec.recommendationId).toMatch(/^REC-/);
      expect(rec.status).toBe(RecommendationStatus.PROPOSED);
    });

    it('should approve a recommendation under human review', async () => {
      const rec = await recommendationService.generateRecommendation({
        title: 'Atualização de modelo LLM',
        category: RecommendationCategory.AI,
        justification: 'Novo modelo Gemini com 30% menor latência',
        priority: RecommendationPriority.MEDIUM,
      });
      const reviewed = await recommendationService.reviewRecommendation({
        recommendationId: rec.recommendationId,
        decision: RecommendationStatus.APPROVED,
        reviewNotes: 'Homologado',
        reviewedBy: 'CTO',
      });
      expect(reviewed?.status).toBe(RecommendationStatus.APPROVED);
    });
  });

  // ── 6. AITaskDelegationService ──────────────────────────────────────────────

  describe('AITaskDelegationService', () => {
    it('should delegate a task to an AI agent or human', async () => {
      const task = await delegationService.delegateTask({
        title: 'Análise estatística de dados assistenciais',
        assigneeType: TaskAssigneeType.AI_AGENT,
        assigneeId: 'agent-bi-01',
        priority: TaskPriority.HIGH,
      });
      expect(task.taskId).toMatch(/^TASK-/);
      expect(task.status).toBe('ASSIGNED');
    });
  });

  // ── 7. OperationalOptimizationService ─────────────────────────────────────

  describe('OperationalOptimizationService', () => {
    it('should create an operational optimization plan', async () => {
      const plan = await optimizationService.createOptimizationPlan('SCHEDULING_MODULE');
      expect(plan.planId).toMatch(/^OPT-PLAN-/);
      expect(plan.throughputGainPercent).toBeGreaterThan(0);
    });
  });

  // ── 8. AIPerformanceMonitoringService ──────────────────────────────────────

  describe('AIPerformanceMonitoringService', () => {
    it('should return AI performance metrics with high accuracy', async () => {
      const perf = await performanceService.getPerformanceMetrics();
      expect(perf.monitoringId).toMatch(/^AI-PERF-/);
      expect(perf.accuracyScorePercent).toBeGreaterThan(90);
      expect(perf.hallucinationRatePercent).toBeLessThan(1.0);
    });
  });

  // ── 9. AutonomousAssistanceService ─────────────────────────────────────────

  describe('AutonomousAssistanceService', () => {
    it('should provide real-time assistance output', async () => {
      const session = await assistanceService.provideAssistance('COO', 'Como otimizar a fila de atendimentos?');
      expect(session.sessionId).toMatch(/^ASSIST-/);
      expect(session.assistanceOutput).toContain('COO');
      expect(session.confidencePercent).toBeGreaterThan(90);
    });
  });

  // ── 10. OperationalLearningService ─────────────────────────────────────────

  describe('OperationalLearningService', () => {
    it('should record operational learning with lessons learned', async () => {
      const learn = await learningService.recordLearning({
        title: 'Adição de réplicas de leitura no PostgreSQL',
        actionTaken: 'Criadas 2 réplicas de leitura para relatórios',
        resultMetrics: 'Carga no banco principal caiu de 92% para 34%',
        lessonLearned: 'Separar leitura e escrita estabiliza a aplicação em horários de pico',
      });
      expect(learn.learningId).toMatch(/^LEARN-/);
      expect(learn.lessonLearned).toBeDefined();
    });
  });
});
