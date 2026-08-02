import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DigitalTwinCoreService } from './digital-twin-core.service';
import { OrganizationalSimulationService } from './organizational-simulation.service';
import { StrategicScenarioModelingService } from './strategic-scenario-modeling.service';
import { ImpactAnalysisService } from './impact-analysis.service';
import { PredictiveSimulationService } from './predictive-simulation.service';
import { ResourceOptimizationService } from './resource-optimization.service';
import { InstitutionalForecastService } from './institutional-forecast.service';
import { TwinSynchronizationService } from './twin-synchronization.service';
import { ExecutiveSimulationDashboardService } from './executive-simulation-dashboard.service';
import { DigitalTwinGovernanceService } from './digital-twin-governance.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  ForecastHorizon,
  ImpactDimension,
  ScenarioType,
  SimulationStatus,
  SimulationType,
  TwinSyncStatus,
} from '../dto/digital-twin.dto';

// ── Mock Factory ───────────────────────────────────────────────────────────────

const mockEventBusService = {
  emit: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue({ id: 'evt-dt-mock-001', type: 'mock.event', data: {} }),
  subscribe: jest.fn(),
};

const mockEventEmitter = { emit: jest.fn(), on: jest.fn() };

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('ADT — Digital Twin Platform Services (P157)', () => {
  let twinCore: DigitalTwinCoreService;
  let simulation: OrganizationalSimulationService;
  let scenarioModeling: StrategicScenarioModelingService;
  let impactAnalysis: ImpactAnalysisService;
  let predictiveSimulation: PredictiveSimulationService;
  let resourceOptimization: ResourceOptimizationService;
  let forecast: InstitutionalForecastService;
  let twinSync: TwinSynchronizationService;
  let executiveDashboard: ExecutiveSimulationDashboardService;
  let governance: DigitalTwinGovernanceService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigitalTwinGovernanceService,
        DigitalTwinCoreService,
        OrganizationalSimulationService,
        StrategicScenarioModelingService,
        ImpactAnalysisService,
        PredictiveSimulationService,
        ResourceOptimizationService,
        InstitutionalForecastService,
        TwinSynchronizationService,
        ExecutiveSimulationDashboardService,
        { provide: EventBusService, useValue: mockEventBusService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    twinCore            = module.get<DigitalTwinCoreService>(DigitalTwinCoreService);
    simulation          = module.get<OrganizationalSimulationService>(OrganizationalSimulationService);
    scenarioModeling    = module.get<StrategicScenarioModelingService>(StrategicScenarioModelingService);
    impactAnalysis      = module.get<ImpactAnalysisService>(ImpactAnalysisService);
    predictiveSimulation = module.get<PredictiveSimulationService>(PredictiveSimulationService);
    resourceOptimization = module.get<ResourceOptimizationService>(ResourceOptimizationService);
    forecast            = module.get<InstitutionalForecastService>(InstitutionalForecastService);
    twinSync            = module.get<TwinSynchronizationService>(TwinSynchronizationService);
    executiveDashboard  = module.get<ExecutiveSimulationDashboardService>(ExecutiveSimulationDashboardService);
    governance          = module.get<DigitalTwinGovernanceService>(DigitalTwinGovernanceService);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. DigitalTwinGovernanceService — SHA-256 Audit & Model Versioning
  // ════════════════════════════════════════════════════════════════════════════

  describe('DigitalTwinGovernanceService', () => {
    it('deve registrar auditoria SHA-256 e publicar CloudEvent', async () => {
      const entry = await governance.recordTwinAudit('test-component', 'TestAction', { key: 'value' });

      expect(entry.auditId).toMatch(/^DT-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
      expect(entry.componentName).toBe('test-component');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.digitaltwin.audit.completed.v1',
        expect.objectContaining({ auditId: entry.auditId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve versionar o modelo e retornar versão incrementada', () => {
      const v1 = governance.getCurrentModelVersion();
      governance.bumpModelVersion();
      const v2 = governance.getCurrentModelVersion();
      expect(v2).toBe(v1 + 1);
    });

    it('deve filtrar trilha por componente', async () => {
      await governance.recordTwinAudit('svc-a', 'ActionA', {});
      await governance.recordTwinAudit('svc-b', 'ActionB', {});

      const trail = governance.getAuditTrail('svc-a');
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.every((e) => e.componentName === 'svc-a')).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. DigitalTwinCoreService — Estado Organizacional
  // ════════════════════════════════════════════════════════════════════════════

  describe('DigitalTwinCoreService', () => {
    it('deve retornar estado inicial com dados organizacionais válidos', () => {
      const state = twinCore.getCurrentState();
      expect(state.twinId).toMatch(/^DT-CORE-/);
      expect(state.organization.totalStaff).toBeGreaterThan(0);
      expect(state.organization.activeBeneficiaries).toBeGreaterThan(0);
      expect(state.infrastructure.totalMicroservices).toBeGreaterThan(0);
      expect(state.indicators.nps).toBeGreaterThan(0);
    });

    it('deve atualizar o estado e publicar CloudEvent', async () => {
      const updated = await twinCore.refreshState({ syncStatus: 'SYNCHRONIZED' });

      expect(updated.syncStatus).toBe('SYNCHRONIZED');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.digitaltwin.twin.updated.v1',
        expect.objectContaining({ twinId: updated.twinId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. StrategicScenarioModelingService — Criação e Comparação de Cenários
  // ════════════════════════════════════════════════════════════════════════════

  describe('StrategicScenarioModelingService', () => {
    it('deve criar cenário estratégico OPTIMISTIC e publicar CloudEvent', async () => {
      const scenario = await scenarioModeling.createScenario({
        name: 'Expansão 2028',
        description: 'Expansão para 3 novos municípios',
        type: ScenarioType.OPTIMISTIC,
        parameters: { demandGrowthPercent: 45, additionalStaff: 20 },
        createdBy: 'CEO-01',
      });

      expect(scenario.scenarioId).toMatch(/^SCENARIO-/);
      expect(scenario.type).toBe(ScenarioType.OPTIMISTIC);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.digitaltwin.scenario.created.v1',
        expect.objectContaining({ scenarioId: scenario.scenarioId, type: ScenarioType.OPTIMISTIC }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve retornar lista com cenários pré-cadastrados (seed)', () => {
      const list = scenarioModeling.listScenarios();
      expect(list.length).toBeGreaterThanOrEqual(3);
    });

    it('deve comparar 2 cenários e recomendar o mais vantajoso', async () => {
      const [s1, s2] = scenarioModeling.listScenarios().slice(0, 2);
      const result = await scenarioModeling.compareScenarios([s1.scenarioId, s2.scenarioId]);

      expect(result.scenarioIds).toHaveLength(2);
      expect(result.recommendedScenarioId).toBeDefined();
      expect(result.rationale).toBeTruthy();
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.digitaltwin.scenario.compared.v1',
        expect.anything(),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve lançar erro ao comparar menos de 2 cenários', async () => {
      const [s1] = scenarioModeling.listScenarios();
      await expect(scenarioModeling.compareScenarios([s1.scenarioId])).rejects.toThrow();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. OrganizationalSimulationService — Motor de Simulações
  // ════════════════════════════════════════════════════════════════════════════

  describe('OrganizationalSimulationService', () => {
    it('deve simular aumento de demanda e gerar indicadores Antes vs. Depois', async () => {
      const result = await simulation.runSimulation({
        simulationType: SimulationType.DEMAND_INCREASE,
        parameters: { demandGrowthPercent: 30 },
        requestedBy: 'CEO-01',
      });

      expect(result.simulationId).toMatch(/^SIM-/);
      expect(result.status).toBe(SimulationStatus.COMPLETED);
      expect(result.afterState.attendanceCapacity).toBeGreaterThan(result.beforeState.attendanceCapacity);
      expect(result.deltaIndicators.attendanceCapacityDelta).toBeGreaterThan(0);
      expect(result.deltaIndicators.beneficiaryImpactDelta).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.digitaltwin.simulation.executed.v1',
        expect.objectContaining({ simulationId: result.simulationId, status: SimulationStatus.COMPLETED }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve listar simulações executadas', async () => {
      await simulation.runSimulation({ simulationType: SimulationType.NEW_PROGRAM, parameters: {} });
      const list = simulation.listSimulations();
      expect(list.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. ImpactAnalysisService — Análise Multidimensional
  // ════════════════════════════════════════════════════════════════════════════

  describe('ImpactAnalysisService', () => {
    it('deve analisar impacto em 4 dimensões e gerar score geral', async () => {
      const sim = await simulation.runSimulation({
        simulationType: SimulationType.INSTITUTIONAL_EXPANSION,
        parameters: { demandGrowthPercent: 25 },
      });

      const impact = await impactAnalysis.analyzeImpact({
        simulationId: sim.simulationId,
        dimensions: [ImpactDimension.BENEFICIARIES, ImpactDimension.BUDGET, ImpactDimension.PROFESSIONALS, ImpactDimension.SOCIAL_IMPACT],
      });

      expect(impact.analysisId).toMatch(/^IMP-/);
      expect(impact.dimensions).toHaveLength(4);
      expect(impact.overallImpactScore).toBeGreaterThan(0);
      expect(impact.overallImpactScore).toBeLessThanOrEqual(100);
      expect(impact.recommendedAction).toBeTruthy();
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.digitaltwin.impact.analysis.completed.v1',
        expect.objectContaining({ analysisId: impact.analysisId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve retornar severidade POSITIVE para dimensões com delta > 5', async () => {
      const sim = await simulation.runSimulation({ simulationType: SimulationType.NEW_PROGRAM, parameters: {} });
      const impact = await impactAnalysis.analyzeImpact({
        simulationId: sim.simulationId,
        dimensions: [ImpactDimension.BENEFICIARIES, ImpactDimension.SOCIAL_IMPACT],
      });

      const positiveDims = impact.dimensions.filter((d) => d.severity === 'POSITIVE');
      expect(positiveDims.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. ResourceOptimizationService — Custo-Benefício
  // ════════════════════════════════════════════════════════════════════════════

  describe('ResourceOptimizationService', () => {
    it('deve calcular otimização com 3 alternativas e recomendar a de melhor custo-benefício', async () => {
      const result = await resourceOptimization.optimizeResources({
        constraints: { targetCapacityPercent: 85, prioritizeVulnerableGroups: true },
      });

      expect(result.optimizationId).toMatch(/^OPT-/);
      expect(result.alternatives).toHaveLength(3);
      expect(result.recommendedAlternativeId).toBeTruthy();

      const recommended = result.alternatives.find((a) => a.alternativeId === result.recommendedAlternativeId);
      expect(recommended?.riskLevel).toBe('LOW');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.digitaltwin.resource.optimization.calculated.v1',
        expect.objectContaining({ optimizationId: result.optimizationId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. InstitutionalForecastService — Previsões de Longo Prazo
  // ════════════════════════════════════════════════════════════════════════════

  describe('InstitutionalForecastService', () => {
    it('deve gerar previsão de 12 meses com projeções mensais e score de sustentabilidade', async () => {
      const result = await forecast.generateForecast({ horizon: ForecastHorizon.TWELVE_MONTHS });

      expect(result.forecastId).toMatch(/^FCST-/);
      expect(result.projections).toHaveLength(12);
      expect(result.sustainabilityScore).toBeGreaterThan(0);
      expect(result.keyRisks.length).toBeGreaterThan(0);
      expect(result.keyOpportunities.length).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.digitaltwin.forecast.generated.v1',
        expect.objectContaining({ forecastId: result.forecastId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve gerar previsão de 24 meses com 24 pontos de projeção', async () => {
      const result = await forecast.generateForecast({ horizon: ForecastHorizon.TWENTY_FOUR_MONTHS });
      expect(result.projections).toHaveLength(24);
    });

    it('deve validar que capacidade projetada cresce ao longo do horizonte', async () => {
      const result = await forecast.generateForecast({ horizon: ForecastHorizon.SIX_MONTHS });
      const first = result.projections[0].projectedCapacity;
      const last = result.projections[result.projections.length - 1].projectedCapacity;
      expect(last).toBeGreaterThan(first);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. PredictiveSimulationService — Simulação Preditiva com IC
  // ════════════════════════════════════════════════════════════════════════════

  describe('PredictiveSimulationService', () => {
    it('deve gerar simulação preditiva com intervalo de confiança', async () => {
      const result = await predictiveSimulation.runPredictiveSimulation({
        horizon: ForecastHorizon.TWELVE_MONTHS,
      });

      expect(result.predictionId).toMatch(/^PRED-SIM-/);
      expect(result.confidenceInterval.low).toBeLessThan(result.confidenceInterval.mid);
      expect(result.confidenceInterval.mid).toBeLessThan(result.confidenceInterval.high);
      expect(result.forecastAccuracyPercent).toBeGreaterThan(85);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. TwinSynchronizationService — Sincronização com Módulos
  // ════════════════════════════════════════════════════════════════════════════

  describe('TwinSynchronizationService', () => {
    it('deve sincronizar Digital Twin com todos os módulos e publicar CloudEvent', async () => {
      const result = await twinSync.syncWithOperationalModules();

      expect(result.syncId).toMatch(/^SYNC-/);
      expect(result.status).toBe(TwinSyncStatus.SYNCHRONIZED);
      expect(result.syncedModules.length).toBeGreaterThan(0);
      expect(result.failedModules).toHaveLength(0);
      expect(result.deltaFieldsUpdated).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.digitaltwin.sync.completed.v1',
        expect.objectContaining({ syncId: result.syncId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve sincronizar apenas módulos especificados', async () => {
      const result = await twinSync.syncWithOperationalModules({
        targetModules: ['unified-operations', 'cognitive-orchestration'],
        triggeredBy: 'SCHEDULER',
      });

      expect(result.syncedModules).toEqual(['unified-operations', 'cognitive-orchestration']);
    });

    it('deve registrar resultado no histórico de sincronizações', async () => {
      await twinSync.syncWithOperationalModules();
      const history = twinSync.getSyncHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(twinSync.getLastSync()).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. ExecutiveSimulationDashboardService — Painel Executivo & NLQ
  // ════════════════════════════════════════════════════════════════════════════

  describe('ExecutiveSimulationDashboardService', () => {
    it('deve gerar painel executivo consolidado e publicar CloudEvent', async () => {
      const dashboard = await executiveDashboard.generateExecutiveDashboard();

      expect(dashboard.dashboardId).toMatch(/^DT-DASH-/);
      expect(dashboard.currentOrganizationalState).toBeDefined();
      expect(dashboard.activeScenarios).toBeGreaterThan(0);
      expect(dashboard.forecastSustainabilityScore).toBeGreaterThan(0);
      expect(dashboard.keyTrends.length).toBeGreaterThan(0);
      expect(dashboard.topRisks.length).toBeGreaterThan(0);
      expect(dashboard.executiveSummary).toBeTruthy();
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.digitaltwin.executive.simulation.generated.v1',
        expect.objectContaining({ dashboardId: dashboard.dashboardId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve responder consulta NLQ sobre beneficiários', async () => {
      const dashboard = await executiveDashboard.generateExecutiveDashboard('Quantos beneficiários estão ativos?');
      expect(dashboard.naturalLanguageAnswer).toBeDefined();
      expect(dashboard.naturalLanguageAnswer).toContain('beneficiário');
    });

    it('deve responder consulta NLQ sobre sustentabilidade financeira', async () => {
      const dashboard = await executiveDashboard.generateExecutiveDashboard('Qual a sustentabilidade financeira?');
      expect(dashboard.naturalLanguageAnswer).toContain('sustentabilidade');
    });
  });
});
