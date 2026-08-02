import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MissionIntelligenceService } from './mission-intelligence.service';
import { InstitutionalCommandCenterService } from './institutional-command-center.service';
import { AutonomousGovernanceOrchestratorService } from './autonomous-governance-orchestrator.service';
import { StrategicAlignmentService } from './strategic-alignment.service';
import { InstitutionalPolicyEnforcementService } from './institutional-policy-enforcement.service';
import { EnterpriseDecisionCoordinationService } from './enterprise-decision-coordination.service';
import { CrossDomainIntelligenceService } from './cross-domain-intelligence.service';
import { MissionPerformanceAnalyticsService } from './mission-performance-analytics.service';
import { InstitutionalResilienceCoordinationService } from './institutional-resilience-coordination.service';
import { ExecutiveGovernanceAuditService } from './executive-governance-audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  AlignmentStatus,
  CommandAlertLevel,
  DomainCategory,
  GovernanceActionType,
  ResilienceScenarioType,
  StrategicObjective,
} from '../dto/mission-intelligence.dto';

// ── Mock Factory ───────────────────────────────────────────────────────────────

const mockEventBusService = {
  emit: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue({ id: 'evt-aemiag-mock-001', type: 'mock.event', data: {} }),
  subscribe: jest.fn(),
};

const mockEventEmitter = { emit: jest.fn(), on: jest.fn() };

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('AEMIAG — Enterprise Mission Intelligence & Autonomous Governance (P160)', () => {
  let missionCore: MissionIntelligenceService;
  let commandCenter: InstitutionalCommandCenterService;
  let governanceOrchestrator: AutonomousGovernanceOrchestratorService;
  let alignmentService: StrategicAlignmentService;
  let policyEnforcement: InstitutionalPolicyEnforcementService;
  let decisionCoordination: EnterpriseDecisionCoordinationService;
  let crossDomainService: CrossDomainIntelligenceService;
  let performanceAnalytics: MissionPerformanceAnalyticsService;
  let resilienceCoordination: InstitutionalResilienceCoordinationService;
  let auditService: ExecutiveGovernanceAuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutiveGovernanceAuditService,
        MissionIntelligenceService,
        InstitutionalCommandCenterService,
        AutonomousGovernanceOrchestratorService,
        StrategicAlignmentService,
        InstitutionalPolicyEnforcementService,
        EnterpriseDecisionCoordinationService,
        CrossDomainIntelligenceService,
        MissionPerformanceAnalyticsService,
        InstitutionalResilienceCoordinationService,
        { provide: EventBusService, useValue: mockEventBusService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    missionCore            = module.get<MissionIntelligenceService>(MissionIntelligenceService);
    commandCenter          = module.get<InstitutionalCommandCenterService>(InstitutionalCommandCenterService);
    governanceOrchestrator = module.get<AutonomousGovernanceOrchestratorService>(AutonomousGovernanceOrchestratorService);
    alignmentService       = module.get<StrategicAlignmentService>(StrategicAlignmentService);
    policyEnforcement      = module.get<InstitutionalPolicyEnforcementService>(InstitutionalPolicyEnforcementService);
    decisionCoordination   = module.get<EnterpriseDecisionCoordinationService>(EnterpriseDecisionCoordinationService);
    crossDomainService     = module.get<CrossDomainIntelligenceService>(CrossDomainIntelligenceService);
    performanceAnalytics   = module.get<MissionPerformanceAnalyticsService>(MissionPerformanceAnalyticsService);
    resilienceCoordination = module.get<InstitutionalResilienceCoordinationService>(InstitutionalResilienceCoordinationService);
    auditService           = module.get<ExecutiveGovernanceAuditService>(ExecutiveGovernanceAuditService);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. ExecutiveGovernanceAuditService — Trilha Imutável SHA-256 de Comando
  // ════════════════════════════════════════════════════════════════════════════

  describe('ExecutiveGovernanceAuditService', () => {
    it('deve registrar auditoria executiva SHA-256 e publicar CloudEvent', async () => {
      const entry = await auditService.recordExecutiveAudit('COMMAND_ACTION', 'CEO', 'command-center', { action: 'test' });

      expect(entry.auditId).toMatch(/^EXE-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
      expect(entry.executiveRole).toBe('CEO');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.mission.audit.completed.v1',
        expect.objectContaining({ auditId: entry.auditId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve filtrar trilha executiva por componente', async () => {
      await auditService.recordExecutiveAudit('ACTION_A', 'CGO', 'component-a');
      await auditService.recordExecutiveAudit('ACTION_B', 'CRO', 'component-b');

      const trail = auditService.getAuditTrail('component-a');
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.every((e) => e.component === 'component-a')).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. MissionIntelligenceService — Visão Unificada & Alinhamento
  // ════════════════════════════════════════════════════════════════════════════

  describe('MissionIntelligenceService', () => {
    it('deve retornar a visão consolidada do ecossistema Aura (38 microsserviços)', () => {
      const state = missionCore.getMissionState();
      expect(state.platformName).toContain('Plataforma Aura');
      expect(state.consolidatedModulesCount).toBe(38);
      expect(state.overallAlignmentScorePercent).toBeGreaterThan(90);
      expect(state.strategicObjectivesStatus[StrategicObjective.EXPAND_SOCIAL_IMPACT].status).toBe(AlignmentStatus.PERFECTLY_ALIGNED);
    });

    it('deve validar alinhamento de projeto à missão e publicar CloudEvent', async () => {
      const result = await missionCore.validateMissionAlignment({
        title: 'Programa de Atendimento em Saúde Mental 2027',
        description: 'Expansão de psicologia em polos de acolhimento',
        targetObjective: StrategicObjective.ENSURE_ASSISTENTIAL_QUALITY,
      });

      expect(result.status).toBe(AlignmentStatus.PERFECTLY_ALIGNED);
      expect(result.alignmentPercent).toBeGreaterThan(95);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.mission.alignment.validated.v1',
        expect.objectContaining({ title: result.title }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. InstitutionalCommandCenterService — Centro de Comando Executivo
  // ════════════════════════════════════════════════════════════════════════════

  describe('InstitutionalCommandCenterService', () => {
    it('deve gerar dashboard executivo em tempo real com contadores e alertas', async () => {
      const dashboard = await commandCenter.getCommandCenterDashboard();

      expect(dashboard.commandCenterId).toMatch(/^CMD-/);
      expect(dashboard.alertLevel).toBe(CommandAlertLevel.GREEN_NORMAL);
      expect(dashboard.activeBeneficiariesTotal).toBeGreaterThan(0);
      expect(dashboard.socialImpactIndexPercent).toBeGreaterThan(80);
      expect(dashboard.governanceCompliancePercent).toBeGreaterThan(95);
      expect(dashboard.overallSystemAvailabilityPercent).toBeGreaterThan(99);
      expect(dashboard.activeAlerts.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. AutonomousGovernanceOrchestratorService — Orquestrador de Governança
  // ════════════════════════════════════════════════════════════════════════════

  describe('AutonomousGovernanceOrchestratorService', () => {
    it('deve orquestrar ação de governança autônoma e publicar CloudEvent', async () => {
      const result = await governanceOrchestrator.orchestrateGovernanceAction({
        actionType: GovernanceActionType.POLICY_VALIDATION,
        description: 'Validação de política LGPD no módulo de conhecimento',
        targetModule: 'enterprise-knowledge',
      });

      expect(result.executionId).toMatch(/^GOV-EXEC-/);
      expect(result.isCompliant).toBe(true);
      expect(result.enforcedRulesCount).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.mission.governance.action.executed.v1',
        expect.objectContaining({ executionId: result.executionId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. StrategicAlignmentService — Verificação Contínua de Alinhamento
  // ════════════════════════════════════════════════════════════════════════════

  describe('StrategicAlignmentService', () => {
    it('deve verificar alinhamento contínuo de 42 iniciativas', async () => {
      const result = await alignmentService.checkStrategicAlignment();

      expect(result.checkId).toMatch(/^ALIGN-/);
      expect(result.evaluatedInitiativesCount).toBe(42);
      expect(result.overallAlignmentPercent).toBeGreaterThan(95);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. InstitutionalPolicyEnforcementService — Fiscalização de Políticas
  // ════════════════════════════════════════════════════════════════════════════

  describe('InstitutionalPolicyEnforcementService', () => {
    it('deve fiscalizar e aplicar políticas institucionais sem violações', async () => {
      const report = await policyEnforcement.enforceInstitutionalPolicies();

      expect(report.reportId).toMatch(/^POL-ENF-/);
      expect(report.evaluatedPoliciesCount).toBeGreaterThan(0);
      expect(report.violationsCount).toBe(0);
      expect(report.policies.every((p) => p.status === 'ENFORCED')).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. EnterpriseDecisionCoordinationService — Coordenação Decisória
  // ════════════════════════════════════════════════════════════════════════════

  describe('EnterpriseDecisionCoordinationService', () => {
    it('deve coordenar decisão executiva ponta a ponta e publicar CloudEvent', async () => {
      const record = await decisionCoordination.coordinateDecision({
        title: 'Reestruturação Preventiva de Polos Assistenciais',
        summary: 'Remanejamento estratégico para maximizar impacto social',
        evidenceIds: ['EVID-2026-001', 'DEC-2026-002'],
        coordinatedBy: 'CEO-01',
      });

      expect(record.coordinationId).toMatch(/^COORD-/);
      expect(record.status).toBe('COORDINATED');
      expect(record.lessonsLearned.length).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.mission.decision.coordinated.v1',
        expect.objectContaining({ coordinationId: record.coordinationId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve retornar o histórico corporativo de decisões coordenadas', async () => {
      await decisionCoordination.coordinateDecision({
        title: 'Decisão Teste',
        summary: 'Resumo',
        evidenceIds: [],
        coordinatedBy: 'DIR-01',
      });

      const history = decisionCoordination.getDecisionHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. CrossDomainIntelligenceService — Inteligência Transversal
  // ════════════════════════════════════════════════════════════════════════════

  describe('CrossDomainIntelligenceService', () => {
    it('deve correlacionar domínios e gerar insight transversal com score de confiança', async () => {
      const insight = await crossDomainService.runCrossDomainAnalysis({
        targetDomains: [DomainCategory.ASSISTENTIAL_SOCIAL, DomainCategory.MENTAL_HEALTH_PSYCHOLOGY, DomainCategory.FINANCIAL_BUDGET],
      });

      expect(insight.insightId).toMatch(/^INS-CROSS-/);
      expect(insight.confidenceScorePercent).toBeGreaterThan(90);
      expect(insight.patternIdentified).toBeTruthy();
      expect(insight.systemicOpportunity).toBeTruthy();
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.mission.crossdomain.insight.generated.v1',
        expect.objectContaining({ insightId: insight.insightId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. MissionPerformanceAnalyticsService — Metrics de Impacto Social
  // ════════════════════════════════════════════════════════════════════════════

  describe('MissionPerformanceAnalyticsService', () => {
    it('deve calcular métricas de desempenho orientado por missão e publicar CloudEvent', async () => {
      const metrics = await performanceAnalytics.calculateMissionPerformance();

      expect(metrics.metricsId).toMatch(/^PERF-/);
      expect(metrics.socialImpactScore).toBeGreaterThan(80);
      expect(metrics.assistentialEffectiveness).toBeGreaterThan(90);
      expect(metrics.overallMissionScore).toBeGreaterThan(85);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.mission.performance.calculated.v1',
        expect.objectContaining({ metricsId: metrics.metricsId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. InstitutionalResilienceCoordinationService — Gestão de Crises e DR
  // ════════════════════════════════════════════════════════════════════════════

  describe('InstitutionalResilienceCoordinationService', () => {
    it('deve simular cenário de estresse institucional e publicar CloudEvent', async () => {
      const result = await resilienceCoordination.simulateResilienceScenario({
        scenarioType: ResilienceScenarioType.ASSISTENTIAL_DEMAND_SURGE,
        parameters: { demandGrowthPercent: 50 },
      });

      expect(result.simulationId).toMatch(/^RES-SIM-/);
      expect(result.systemicResilienceScore).toBeGreaterThan(90);
      expect(result.businessContinuityScorePercent).toBeGreaterThan(95);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.mission.resilience.simulated.v1',
        expect.objectContaining({ simulationId: result.simulationId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });
});
