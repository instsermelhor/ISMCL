import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { ObservabilityAuditService } from './observability-audit.service';
import { EnterpriseObservabilityService } from './enterprise-observability.service';
import { TelemetryService } from './telemetry.service';
import { DistributedTracingService } from './distributed-tracing.service';
import { MetricsService } from './metrics.service';
import { LoggingService } from './logging.service';
import { ReliabilityEngineeringService } from './reliability-engineering.service';
import { SLOManagementService } from './slo-management.service';
import { ChaosEngineeringService } from './chaos-engineering.service';
import { AutonomousOperationsService } from './autonomous-operations.service';

import {
  TelemetryType,
  LogLevel,
  ChaosExperimentType,
  AnomalySeverity,
} from '../dto/enterprise-observability.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

describe('P173 EORP — Enterprise Observability, SRE & Autonomous Operations Platform', () => {
  let auditSvc: ObservabilityAuditService;
  let obsSvc: EnterpriseObservabilityService;
  let telemetrySvc: TelemetryService;
  let tracingSvc: DistributedTracingService;
  let metricsSvc: MetricsService;
  let loggingSvc: LoggingService;
  let sreSvc: ReliabilityEngineeringService;
  let sloSvc: SLOManagementService;
  let chaosSvc: ChaosEngineeringService;
  let aiopsSvc: AutonomousOperationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObservabilityAuditService,
        EnterpriseObservabilityService,
        TelemetryService,
        DistributedTracingService,
        MetricsService,
        LoggingService,
        ReliabilityEngineeringService,
        SLOManagementService,
        ChaosEngineeringService,
        AutonomousOperationsService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get(ObservabilityAuditService);
    obsSvc = module.get(EnterpriseObservabilityService);
    telemetrySvc = module.get(TelemetryService);
    tracingSvc = module.get(DistributedTracingService);
    metricsSvc = module.get(MetricsService);
    loggingSvc = module.get(LoggingService);
    sreSvc = module.get(ReliabilityEngineeringService);
    sloSvc = module.get(SLOManagementService);
    chaosSvc = module.get(ChaosEngineeringService);
    aiopsSvc = module.get(AutonomousOperationsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── ObservabilityAuditService ─────────────────────────────────────────────
  describe('ObservabilityAuditService', () => {
    it('deve registrar auditoria de observabilidade com assinatura SHA-256 válida', async () => {
      const entry = await auditSvc.recordAudit('CHAOS_EXECUTED', 'CHAOS-TEST-01', 'SRE_LEAD', { target: 'SocialModule' });
      expect(entry.auditId).toMatch(/^EORP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
      expect(entry.action).toBe('CHAOS_EXECUTED');
    });

    it('deve filtrar trilha de auditoria por assunto', async () => {
      await auditSvc.recordAudit('ACT_A', 'subject-obs-1', 'SRE');
      await auditSvc.recordAudit('ACT_B', 'subject-obs-2', 'SRE');
      const trail = auditSvc.getAuditTrail('subject-obs-1');
      expect(trail.every((t) => t.subject === 'subject-obs-1')).toBe(true);
    });
  });

  // ── EnterpriseObservabilityService ───────────────────────────────────────
  describe('EnterpriseObservabilityService', () => {
    it('deve retornar visão executiva com todos os componentes monitorados', async () => {
      const overview = await obsSvc.getOverview();
      expect(overview.totalComponentsMonitored).toBeGreaterThan(0);
      expect(overview.overallHealth).toMatch(/HEALTHY|DEGRADED|UNHEALTHY/);
    });

    it('deve atualizar heartbeat e status de componente monitorado', async () => {
      const updated = await obsSvc.updateComponentHeartbeat('Aura Web Portal', 'DEGRADED');
      expect(updated.status).toBe('DEGRADED');
      expect(updated.lastHeartbeat).toBeTruthy();
    });
  });

  // ── TelemetryService ──────────────────────────────────────────────────────
  describe('TelemetryService', () => {
    it('deve registrar telemetria OpenTelemetry e correlacionar por traceId', async () => {
      const traceId = 'trace-test-eorp-001';
      const rec1 = await telemetrySvc.recordTelemetry({
        type: TelemetryType.METRIC,
        name: 'http_request_duration_seconds',
        serviceName: 'EnterpriseStrategyModule',
        value: 0.042,
        traceId,
      });
      const rec2 = await telemetrySvc.recordTelemetry({
        type: TelemetryType.TRACE,
        name: 'span.downstream',
        serviceName: 'BusinessContinuityModule',
        value: 0.012,
        traceId,
      });

      expect(rec1.telemetryId).toMatch(/^OTEL-/);
      const byTrace = telemetrySvc.getTelemetryByTrace(traceId);
      expect(byTrace).toHaveLength(2);
      expect(byTrace.every((r) => r.traceId === traceId)).toBe(true);
    });
  });

  // ── DistributedTracingService ─────────────────────────────────────────────
  describe('DistributedTracingService', () => {
    it('deve iniciar trace e acumular spans de microsserviços com latências', async () => {
      const traceId = await tracingSvc.startTrace('ApiGateway', 'POST /eorp/tracing/start');
      expect(traceId).toMatch(/^TRACE-/);

      await tracingSvc.addSpanToTrace(traceId, 'EnterpriseDataModule', 'MDM.resolveIdentity', 22, 200);
      await tracingSvc.addSpanToTrace(traceId, 'SocialImpactModule', 'ImpactCalculation.run', 58, 200);

      const graph = tracingSvc.getTrace(traceId);
      expect(graph).toBeDefined();
      expect(graph!.spansCount).toBe(3); // root + 2
      expect(graph!.totalDurationMs).toBe(80);
      expect(graph!.hasErrors).toBe(false);
    });

    it('deve marcar grafo com erro quando span retornar status 500', async () => {
      const traceId = await tracingSvc.startTrace('ApiGateway', 'POST /esgp/okrs');
      await tracingSvc.addSpanToTrace(traceId, 'EnterpriseStrategyModule', 'OKR.save', 14, 500);
      const graph = tracingSvc.getTrace(traceId);
      expect(graph!.hasErrors).toBe(true);
    });
  });

  // ── MetricsService ────────────────────────────────────────────────────────
  describe('MetricsService', () => {
    it('deve calcular estatísticas de métrica (min, max, p95, avg) com séries temporais', () => {
      const metric = 'api.latency.ms';
      for (let i = 1; i <= 100; i++) metricsSvc.pushDataPoint(metric, i);

      const summary = metricsSvc.getMetricSummary(metric);
      expect(summary).toBeDefined();
      expect(summary!.count).toBe(100);
      expect(summary!.min).toBe(1);
      expect(summary!.max).toBe(100);
      expect(summary!.p95).toBeGreaterThan(summary!.p50);
    });
  });

  // ── LoggingService ────────────────────────────────────────────────────────
  describe('LoggingService', () => {
    it('deve registrar log com mascaramento automático de dados sensíveis (LGPD)', async () => {
      const entry = await loggingSvc.log(
        LogLevel.WARN,
        'BeneficiaryModule',
        'Tentativa de atualização do CPF 123.456.789-00',
        { cpf: '12345678900', requestId: 'REQ-99' },
      );

      expect(entry.message).not.toContain('123.456.789-00');
      expect(entry.context['cpf']).toBe('*** MASKED_LGPD ***');
    });

    it('deve pesquisar logs por palavra-chave', async () => {
      await loggingSvc.log(LogLevel.ERROR, 'DataFabric', 'Query timeout na camada de abstração', {});
      const results = loggingSvc.searchLogs('timeout');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].message).toContain('timeout');
    });
  });

  // ── ReliabilityEngineeringService ─────────────────────────────────────────
  describe('ReliabilityEngineeringService', () => {
    it('deve calcular Reliability Score SRE com MTTR e MTBF', async () => {
      const report = await sreSvc.calculateReliabilityScore('SRE_TEST');
      expect(report.reportId).toMatch(/^SRE-REP-/);
      expect(report.reliabilityScore).toBeGreaterThanOrEqual(0);
      expect(report.reliabilityScore).toBeLessThanOrEqual(100);
      expect(report.rating).toMatch(/EXCELLENT|STABLE|DEGRADED|CRITICAL/);
      expect(report.mttrMinutes).toBeGreaterThan(0);
      expect(report.mtbfHours).toBeGreaterThan(0);
    });
  });

  // ── SLOManagementService ──────────────────────────────────────────────────
  describe('SLOManagementService', () => {
    it('deve definir SLO, avaliar consumo de Error Budget e Burn Rate', async () => {
      const slo = await sloSvc.defineSlo({
        sloId: 'SLO-EORP-TEST-99.5',
        description: 'Disponibilidade do Data Fabric EORP',
        sliMetricName: 'fabric_requests_success_ratio',
        targetPercentage: 99.5,
        windowDays: 30,
      });

      expect(slo.sloId).toBe('SLO-EORP-TEST-99.5');
      expect(slo.targetPercentage).toBe(99.5);

      const evaluated = await sloSvc.evaluateSloStatus('SLO-EORP-TEST-99.5');
      expect(evaluated.currentPercentage).toBeGreaterThan(0);
      expect(evaluated.errorBudgetStatus).toMatch(/HEALTHY|WARNING|EXHAUSTED/);
      expect(evaluated.burnRate).toBeGreaterThanOrEqual(0);
    });
  });

  // ── ChaosEngineeringService ───────────────────────────────────────────────
  describe('ChaosEngineeringService', () => {
    it('deve executar experimento de Chaos com travas de segurança e auditoria', async () => {
      const experiment = await chaosSvc.executeExperiment({
        experimentType: ChaosExperimentType.NETWORK_LATENCY,
        description: 'Simulação de latência de 500ms entre DataFabric e DW',
        targetComponent: 'DataFabricService',
        durationSeconds: 120,
        authorizedBy: 'SRE_Principal_Ricardo',
      });

      expect(experiment.experimentId).toMatch(/^CHAOS-/);
      expect(experiment.authorizedBy).toBe('SRE_Principal_Ricardo');
      expect(experiment.safetyCircuitBreakerTriggered).toBe(false);
      expect(experiment.findings).toBeTruthy();
    });
  });

  // ── AutonomousOperationsService (AIOps) ──────────────────────────────────
  describe('AutonomousOperationsService', () => {
    it('deve detectar anomalia e executar ação autônoma auditada pelo motor AIOps', async () => {
      const anomaly = await aiopsSvc.detectAnomaly(
        'http_request_duration_seconds_p99',
        AnomalySeverity.HIGH,
        'Latência p99 ultrapassou 800ms no módulo ESGP',
        'Escalonar réplicas do EnterpriseStrategyModule para 4 instâncias',
      );

      expect(anomaly.anomalyId).toMatch(/^ANOMALY-/);
      expect(anomaly.severity).toBe(AnomalySeverity.HIGH);

      const action = await aiopsSvc.executeAutonomousAction({
        anomalyId: anomaly.anomalyId,
        actionName: 'Auto-scaling EnterpriseStrategyModule → 4 réplicas',
        aiEngineVersion: 'AIOps-Engine-v3.1',
      });

      expect(action.actionId).toMatch(/^AUTO-ACT-/);
      expect(action.anomalyId).toBe(anomaly.anomalyId);
      expect(action.status).toBe('EXECUTED_SUCCESS');
    });
  });
});
