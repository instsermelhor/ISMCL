import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnifiedOperationsService } from './unified-operations.service';
import { EnterpriseObservabilityService } from './enterprise-observability.service';
import { AiOpsIntelligenceService } from './ai-ops-intelligence.service';
import { IncidentManagementService } from './incident-management.service';
import { ServiceHealthMonitoringService } from './service-health-monitoring.service';
import { PredictiveFailureAnalysisService } from './predictive-failure-analysis.service';
import { BusinessObservabilityService } from './business-observability.service';
import { ResilienceManagementService } from './resilience-management.service';
import { OperationalAutomationService } from './operational-automation.service';
import { SreGovernanceService } from './sre-governance.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  ChaosTestType,
  IncidentStatus,
  RemediationAction,
  SeverityLevel,
  SloBreachType,
} from '../dto/unified-operations.dto';

// ── Mock Factories ─────────────────────────────────────────────────────────────

const mockEventBusService = {
  emit: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue({ id: 'evt-ops-mock-001', type: 'mock.event', data: {} }),
  subscribe: jest.fn(),
  getDlq: jest.fn().mockReturnValue([]),
  replayDlq: jest.fn().mockResolvedValue(0),
};

const mockEventEmitter = {
  emit: jest.fn(),
  on: jest.fn(),
};

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('AUOC — Unified Operations Center Services (P156)', () => {
  let unifiedOps: UnifiedOperationsService;
  let observability: EnterpriseObservabilityService;
  let aiOps: AiOpsIntelligenceService;
  let incidentMgmt: IncidentManagementService;
  let healthMonitoring: ServiceHealthMonitoringService;
  let predictiveAnalysis: PredictiveFailureAnalysisService;
  let businessObservability: BusinessObservabilityService;
  let resilience: ResilienceManagementService;
  let automation: OperationalAutomationService;
  let sreGovernance: SreGovernanceService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SreGovernanceService,
        EnterpriseObservabilityService,
        AiOpsIntelligenceService,
        IncidentManagementService,
        ServiceHealthMonitoringService,
        PredictiveFailureAnalysisService,
        BusinessObservabilityService,
        ResilienceManagementService,
        OperationalAutomationService,
        UnifiedOperationsService,
        { provide: EventBusService, useValue: mockEventBusService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    unifiedOps         = module.get<UnifiedOperationsService>(UnifiedOperationsService);
    observability      = module.get<EnterpriseObservabilityService>(EnterpriseObservabilityService);
    aiOps              = module.get<AiOpsIntelligenceService>(AiOpsIntelligenceService);
    incidentMgmt       = module.get<IncidentManagementService>(IncidentManagementService);
    healthMonitoring   = module.get<ServiceHealthMonitoringService>(ServiceHealthMonitoringService);
    predictiveAnalysis = module.get<PredictiveFailureAnalysisService>(PredictiveFailureAnalysisService);
    businessObservability = module.get<BusinessObservabilityService>(BusinessObservabilityService);
    resilience         = module.get<ResilienceManagementService>(ResilienceManagementService);
    automation         = module.get<OperationalAutomationService>(OperationalAutomationService);
    sreGovernance      = module.get<SreGovernanceService>(SreGovernanceService);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. SreGovernanceService — SLO Evaluation & Audit Trail
  // ════════════════════════════════════════════════════════════════════════════

  describe('SreGovernanceService', () => {
    it('deve avaliar SLO de um microsserviço com ErrorBudget calculado', async () => {
      const result = await sreGovernance.evaluateSlo({
        serviceName: 'cognitive-orchestration',
        targetAvailabilityPercentage: 99.9,
        targetLatencyMs: 300,
      });

      expect(result).toBeDefined();
      expect(result.evaluationId).toMatch(/^SLO-EVAL-/);
      expect(result.serviceName).toBe('cognitive-orchestration');
      expect(result.errorBudgetPercentage).toBeDefined();
      expect(result.remainingErrorBudgetPercentage).toBeGreaterThanOrEqual(0);
      expect(typeof result.isBreached).toBe('boolean');
    });

    it('deve registrar auditoria operacional imutável com assinatura SHA-256', async () => {
      const audit = await sreGovernance.recordOperationalAudit(
        'test-component',
        'TestAction',
        { data: 'test' },
      );

      expect(audit).toBeDefined();
      expect(audit.auditId).toMatch(/^AUD-OPS-/);
      expect(audit.sha256Signature).toHaveLength(64);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.audit.completed.v1',
        expect.objectContaining({ auditId: audit.auditId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve filtrar trilha de auditoria por componente', async () => {
      await sreGovernance.recordOperationalAudit('my-service', 'ActionA', {});
      await sreGovernance.recordOperationalAudit('other-service', 'ActionB', {});

      const trail = sreGovernance.getAuditTrail('my-service');
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.every((a) => a.componentName === 'my-service')).toBe(true);
    });

    it('deve publicar evento SLO_BREACHED quando disponibilidade estiver abaixo da meta', async () => {
      const result = await sreGovernance.evaluateSlo({
        serviceName: 'fragile-service',
        targetAvailabilityPercentage: 100, // impossível → forçará breach
        targetLatencyMs: 100,
      });

      expect(result.isBreached).toBe(true);
      expect(result.breachType).toBe(SloBreachType.AVAILABILITY_DROPPED);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.slo.breached.v1',
        expect.objectContaining({ serviceName: 'fragile-service' }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. EnterpriseObservabilityService — Telemetria & Correlação
  // ════════════════════════════════════════════════════════════════════════════

  describe('EnterpriseObservabilityService', () => {
    it('deve coletar telemetria e retornar registro com ID', async () => {
      const record = await observability.collectTelemetry({
        tenantId: 'TENANT-001',
        serviceName: 'autonomous-evolution',
        telemetryType: 'metric',
        name: 'evolution_cycle_duration_ms',
        value: 230,
        labels: { environment: 'production' },
      });

      expect(record).toBeDefined();
      expect(record.telemetryId).toMatch(/^TEL-/);
      expect(record.serviceName).toBe('autonomous-evolution');
    });

    it('deve retornar contexto correlacionado de telemetria por serviço', async () => {
      await observability.collectTelemetry({ tenantId: 'T1', serviceName: 'svc-a', telemetryType: 'log', name: 'login', value: 1 });
      await observability.collectTelemetry({ tenantId: 'T1', serviceName: 'svc-a', telemetryType: 'metric', name: 'latency', value: 120 });

      const ctx = observability.getCorrelatedContext('svc-a');
      expect(ctx.serviceName).toBe('svc-a');
      expect(ctx.logsCount).toBeGreaterThan(0);
      expect(ctx.metricsCount).toBeGreaterThan(0);
    });

    it('deve filtrar telemetria por tipo', async () => {
      await observability.collectTelemetry({ tenantId: 'T1', serviceName: 'svc-b', telemetryType: 'trace', name: 'http_request', value: 1 });

      const traces = observability.queryTelemetry('svc-b', 'trace');
      expect(traces.length).toBeGreaterThan(0);
      expect(traces.every((t) => t.telemetryType === 'trace')).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. AiOpsIntelligenceService — Detecção de Anomalias
  // ════════════════════════════════════════════════════════════════════════════

  describe('AiOpsIntelligenceService', () => {
    it('deve detectar anomalia e publicar CloudEvent', async () => {
      const result = await aiOps.detectAnomalies({ targetService: 'enterprise-interoperability' });

      expect(result).toBeDefined();
      expect(result.anomalyId).toMatch(/^ANM-/);
      expect(result.anomalyDetected).toBe(true);
      expect(result.anomalyScore).toBeGreaterThan(0);
      expect(result.xaiConfidenceScore).toBeGreaterThan(0.9);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.anomaly.detected.v1',
        expect.objectContaining({ anomalyId: result.anomalyId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve listar anomalias registradas e incluir a detectada', async () => {
      const result = await aiOps.detectAnomalies({ targetService: 'cognitive-orchestration' });
      const list = aiOps.listAnomalies();

      expect(list.length).toBeGreaterThan(0);
      expect(list.some((a) => a.anomalyId === result.anomalyId)).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. IncidentManagementService — Ciclo de Vida P1-P4
  // ════════════════════════════════════════════════════════════════════════════

  describe('IncidentManagementService', () => {
    it('deve abrir incidente P1-Critical com meta SLA de 15 minutos', async () => {
      const incident = await incidentMgmt.createIncident({
        tenantId: 'TENANT-001',
        title: 'Falha Crítica no EventBus',
        description: 'Kafka cluster unreachable',
        severity: SeverityLevel.P1_CRITICAL,
        affectedService: 'event-bus-kafka',
      });

      expect(incident).toBeDefined();
      expect(incident.incidentId).toMatch(/^INC-/);
      expect(incident.status).toBe(IncidentStatus.DETECTED);
      expect(incident.targetSlaMinutes).toBe(15);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.incident.detected.v1',
        expect.objectContaining({ incidentId: incident.incidentId, severity: SeverityLevel.P1_CRITICAL }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve resolver incidente com pós-mortem e lições aprendidas', async () => {
      const incident = await incidentMgmt.createIncident({
        tenantId: 'TENANT-001',
        title: 'Latência Alta em AAEE',
        description: 'Slow evolution cycles',
        severity: SeverityLevel.P2_HIGH,
        affectedService: 'autonomous-evolution',
      });

      const resolved = await incidentMgmt.resolveIncident({
        incidentId: incident.incidentId,
        resolutionNotes: 'Reiniciado com autorremediação',
        lessonsLearned: ['Aumentar auto-scaling threshold'],
        resolvedBy: 'SRE-LEAD-01',
      });

      expect(resolved.status).toBe(IncidentStatus.RESOLVED);
      expect(resolved.resolvedBy).toBe('SRE-LEAD-01');
      expect(resolved.lessonsLearned).toHaveLength(1);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.incident.resolved.v1',
        expect.objectContaining({ incidentId: incident.incidentId }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve lançar erro ao tentar resolver incidente inexistente', async () => {
      await expect(
        incidentMgmt.resolveIncident({
          incidentId: 'INC-INEXISTENTE-9999',
          resolutionNotes: 'Resolved',
          lessonsLearned: [],
          resolvedBy: 'SRE',
        }),
      ).rejects.toThrow('Incidente não encontrado: INC-INEXISTENTE-9999');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. ServiceHealthMonitoringService
  // ════════════════════════════════════════════════════════════════════════════

  describe('ServiceHealthMonitoringService', () => {
    it('deve retornar saúde dos serviços pré-cadastrados (seed)', () => {
      const all = healthMonitoring.getAllHealthStatus();
      expect(all.length).toBeGreaterThanOrEqual(5);
      expect(all.every((h) => h.status !== undefined)).toBe(true);
    });

    it('deve executar health check e publicar CloudEvent', async () => {
      const result = await healthMonitoring.runHealthCheck('cognitive-orchestration');

      expect(result.serviceName).toBe('cognitive-orchestration');
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.health.updated.v1',
        expect.objectContaining({ serviceName: 'cognitive-orchestration' }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. PredictiveFailureAnalysisService
  // ════════════════════════════════════════════════════════════════════════════

  describe('PredictiveFailureAnalysisService', () => {
    it('deve gerar previsão de falha com score de probabilidade e publicar CloudEvent', async () => {
      const prediction = await predictiveAnalysis.analyzePredictiveFailures('autonomous-evolution');

      expect(prediction).toBeDefined();
      expect(prediction.predictionId).toMatch(/^PRED-/);
      expect(prediction.probabilityScore).toBeGreaterThan(0.8);
      expect(prediction.timeToFailureMinutes).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.predictive_failure.generated.v1',
        expect.objectContaining({ predictionId: prediction.predictionId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve listar previsões geradas', async () => {
      await predictiveAnalysis.analyzePredictiveFailures('enterprise-interoperability');
      const list = predictiveAnalysis.listPredictions();
      expect(list.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. BusinessObservabilityService
  // ════════════════════════════════════════════════════════════════════════════

  describe('BusinessObservabilityService', () => {
    it('deve calcular impacto de negócio com base na duração do incidente', async () => {
      const impact = await businessObservability.calculateBusinessImpact({
        incidentId: 'INC-2026-0001',
        affectedService: 'cognitive-orchestration',
        durationMinutes: 45,
      });

      expect(impact).toBeDefined();
      expect(impact.impactId).toMatch(/^BIZ-IMP-/);
      expect(impact.delayedAttendancesCount).toBe(180); // 45 * 4
      expect(impact.affectedBeneficiariesCount).toBe(135); // 45 * 3
      expect(impact.socialImpactSeverity).toBe('HIGH');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.business_impact.calculated.v1',
        expect.objectContaining({ impactId: impact.impactId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. ResilienceManagementService — Chaos Engineering
  // ════════════════════════════════════════════════════════════════════════════

  describe('ResilienceManagementService', () => {
    it('deve executar teste de caos com autorrecuperação e publicar CloudEvent', async () => {
      const result = await resilience.runChaosTest({
        testType: ChaosTestType.LATENCY_INJECTION,
        targetComponent: 'enterprise-interoperability',
        durationMinutes: 3,
        params: { injectedLatencyMs: 2000 },
      });

      expect(result).toBeDefined();
      expect(result.testId).toMatch(/^CHAOS-/);
      expect(result.systemRecoveredAutomatically).toBe(true);
      expect(result.recoveryTimeSeconds).toBeGreaterThan(0);
      expect(result.resilienceScorePercentage).toBeGreaterThan(90);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.resilience_test.completed.v1',
        expect.objectContaining({ testId: result.testId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. OperationalAutomationService — Autorremediação
  // ════════════════════════════════════════════════════════════════════════════

  describe('OperationalAutomationService', () => {
    it('deve executar autorremediação RESTART_SERVICE com audit SHA-256', async () => {
      const result = await automation.triggerAutoRemediation({
        action: RemediationAction.RESTART_SERVICE,
        targetService: 'cognitive-orchestration',
        rationale: 'Detectado vazamento de memória pelo AIOps',
      });

      expect(result).toBeDefined();
      expect(result.remediationId).toMatch(/^REM-/);
      expect(result.status).toBe('EXECUTED');
      expect(result.action).toBe(RemediationAction.RESTART_SERVICE);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.remediation.executed.v1',
        expect.objectContaining({ remediationId: result.remediationId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve executar autorremediação AUTO_SCALE_PODS em serviço de integração', async () => {
      const result = await automation.triggerAutoRemediation({
        action: RemediationAction.AUTO_SCALE_PODS,
        targetService: 'enterprise-interoperability',
        rationale: 'Volume de requisições 300% acima do baseline',
        operatorId: 'SRE-AUTO-BOT',
      });

      expect(result.action).toBe(RemediationAction.AUTO_SCALE_PODS);
      expect(result.operatorId).toBe('SRE-AUTO-BOT');
    });

    it('deve listar todas as ações de autorremediação executadas', async () => {
      await automation.triggerAutoRemediation({
        action: RemediationAction.FLUSH_CACHE,
        targetService: 'autonomous-evolution',
        rationale: 'Cache stale detectado',
      });

      const list = automation.listRemediations();
      expect(list.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. UnifiedOperationsService — Dashboard Consolidado End-to-End
  // ════════════════════════════════════════════════════════════════════════════

  describe('UnifiedOperationsService', () => {
    it('deve gerar dashboard operacional consolidado com visão end-to-end', async () => {
      const dashboard = await unifiedOps.getOperationalDashboard();

      expect(dashboard).toBeDefined();
      expect(dashboard.dashboardId).toMatch(/^DASH-OPS-/);
      expect(['GREEN', 'YELLOW', 'RED']).toContain(dashboard.overallHealthStatus);
      expect(dashboard.totalServices).toBeGreaterThanOrEqual(5);
      expect(dashboard.healthyServices).toBeGreaterThanOrEqual(0);
      expect(dashboard.lastSloEvaluations.length).toBeGreaterThan(0);
      expect(dashboard.summary).toContain('Estado geral');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.operations.health.updated.v1',
        expect.objectContaining({ dashboardId: dashboard.dashboardId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });
});
