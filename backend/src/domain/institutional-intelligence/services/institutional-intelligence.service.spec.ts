import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionalIntelligenceService } from './institutional-intelligence.service';
import { DecisionIntelligenceService } from './decision-intelligence.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { InstitutionalKnowledgeGraphService } from './institutional-knowledge-graph.service';
import { AIGovernanceService } from './ai-governance.service';
import { ContinuousOptimizationService } from './continuous-optimization.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  RiskCategory,
  RecommendationType,
  RecommendationStatus,
  KnowledgeNodeType,
} from '../dto/institutional-intelligence.dto';

describe('Institutional Intelligence Center (AIIC) - Prompt 151 Unit Tests', () => {
  let institutionalService: InstitutionalIntelligenceService;
  let decisionService: DecisionIntelligenceService;
  let predictiveService: PredictiveAnalyticsService;
  let recommendationService: RecommendationEngineService;
  let knowledgeGraphService: InstitutionalKnowledgeGraphService;
  let aiGovernanceService: AIGovernanceService;
  let optimizationService: ContinuousOptimizationService;

  const mockEventBusService = {
    publish: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionalIntelligenceService,
        DecisionIntelligenceService,
        PredictiveAnalyticsService,
        RecommendationEngineService,
        InstitutionalKnowledgeGraphService,
        AIGovernanceService,
        ContinuousOptimizationService,
        { provide: EventBusService, useValue: mockEventBusService },
      ],
    }).compile();

    institutionalService = module.get<InstitutionalIntelligenceService>(InstitutionalIntelligenceService);
    decisionService = module.get<DecisionIntelligenceService>(DecisionIntelligenceService);
    predictiveService = module.get<PredictiveAnalyticsService>(PredictiveAnalyticsService);
    recommendationService = module.get<RecommendationEngineService>(RecommendationEngineService);
    knowledgeGraphService = module.get<InstitutionalKnowledgeGraphService>(InstitutionalKnowledgeGraphService);
    aiGovernanceService = module.get<AIGovernanceService>(AIGovernanceService);
    optimizationService = module.get<ContinuousOptimizationService>(ContinuousOptimizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve realizar auditoria pré-implementação dos Prompts 120-150 com sucesso', async () => {
    const audit = async () => institutionalService.validatePreImplementationAudit();
    const result = await audit();
    expect(result.auditStatus).toBe('AUDIT_PASSED_SUCCESSFULLY');
    expect(result.dataQualityScorePercent).toBeGreaterThan(95);
  });

  it('deve obter a Visão Unificada da Organização e publicar evento CloudEvents', async () => {
    const view = await institutionalService.getUnifiedOrganizationalView();
    expect(view.activeBeneficiaries).toBeGreaterThan(1000);
    expect(mockEventBusService.publish).toHaveBeenCalledWith(
      'aura.institutional.insight.generated.v1',
      expect.any(Object),
      'default',
      expect.any(Object),
    );
  });

  it('deve simular cenário estratégico com análise de impacto e grau de confiança', async () => {
    const simulation = await decisionService.simulateScenario(
      'Aumento da Demanda',
      'Simulação de 30% mais inscritos',
      { demand: 30 },
    );
    expect(simulation.simulationId).toMatch(/^SIM-2026-/);
    expect(simulation.confidenceScore).toBeGreaterThan(0.9);
    expect(mockEventBusService.publish).toHaveBeenCalledWith(
      'aura.institutional.decision.simulated.v1',
      expect.any(Object),
      'default',
      expect.any(Object),
    );
  });

  it('deve prever risco de evasão de beneficiário com explicabilidade', async () => {
    const risk = await predictiveService.predictRisk(
      RiskCategory.BENEFICIARY_DROPOUT,
      'BEN-2026-9901',
    );
    expect(risk.riskCategory).toBe(RiskCategory.BENEFICIARY_DROPOUT);
    expect(risk.riskProbability).toBeGreaterThan(0.7);
    expect(mockEventBusService.publish).toHaveBeenCalledWith(
      'aura.institutional.prediction.calculated.v1',
      expect.any(Object),
      'default',
      expect.any(Object),
    );
  });

  it('deve criar recomendação explicável e aceitar feedback loop', async () => {
    const rec = await recommendationService.createRecommendation({
      type: RecommendationType.CARE_REFERRAL,
      targetId: 'BEN-2026-9901',
      title: 'Encaminhamento Psicológico',
      justification: 'PHQ-9 alto',
      confidenceScore: 0.95,
    });
    expect(rec.recommendationId).toMatch(/^REC-2026-/);

    const updated = await recommendationService.processFeedback(rec.recommendationId, {
      status: RecommendationStatus.ACCEPTED,
      feedbackNotes: 'Agendado com sucesso',
    });
    expect(updated.status).toBe(RecommendationStatus.ACCEPTED);
  });

  it('deve consultar o Grafo Institucional do Conhecimento', async () => {
    const graph = await knowledgeGraphService.queryGraph('Fernando', KnowledgeNodeType.PERSON);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(1);
    expect(graph.nodes[0].label).toContain('Fernando');
  });

  it('deve gerenciar governança de modelos de IA e aprovação Human-in-the-Loop', async () => {
    const models = await aiGovernanceService.listModels();
    expect(models.length).toBeGreaterThanOrEqual(2);

    const approved = await aiGovernanceService.approveModel(models[0].modelId);
    expect(approved.humanInTheLoopApproved).toBe(true);
  });

  it('deve listar planos de otimização contínua da organização', async () => {
    const plans = await optimizationService.listOptimizationPlans();
    expect(plans.length).toBeGreaterThanOrEqual(2);
  });
});
