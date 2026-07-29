import { KpiEngineService } from './kpi-engine.service';
import { DataWarehouseService } from './data-warehouse.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { DataGovernanceService } from './data-governance.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  KpiCategory,
  DataMartType,
  PredictionType,
  DataClassification,
} from '../dto/analytics.dto';

describe('KpiEngineService', () => {
  let service: KpiEngineService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new KpiEngineService(eventBusMock as EventBusService);
  });

  it('should have 6 strategic KPIs pre-loaded', () => {
    const kpis = service.listAll();
    expect(kpis.length).toBeGreaterThanOrEqual(6);
    expect(kpis.some((k) => k.kpiCode === 'KPI-ATTENDANCE-RATE')).toBe(true);
  });

  it('should create a custom KPI dynamically', async () => {
    const kpi = await service.create({
      kpiCode: 'KPI-TEST-CUSTOM',
      name: 'KPI de Teste Personalizado',
      description: 'Métrica de teste do SUPER_ADMIN',
      category: KpiCategory.OPERATIONAL,
      unit: '%',
      targetValue: 95,
    });

    expect(kpi.kpiId).toBeDefined();
    expect(kpi.kpiCode).toBe('KPI-TEST-CUSTOM');
  });

  it('should recalculate all KPIs and emit CloudEvents', async () => {
    const updated = await service.recalculateAll('default');
    expect(updated.length).toBeGreaterThanOrEqual(6);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.analytics.kpi.calculated.v1',
      expect.objectContaining({ kpiCode: expect.any(String) }),
      'default',
      expect.anything(),
    );
  });
});

describe('DataWarehouseService', () => {
  let service: DataWarehouseService;

  beforeEach(() => {
    service = new DataWarehouseService();
  });

  it('should return Data Mart summary for Psychology', () => {
    const summary = service.getDataMartSummary(DataMartType.PSYCHOLOGY);
    expect(summary.martType).toBe(DataMartType.PSYCHOLOGY);
    expect(summary.totalRecords).toBeGreaterThan(0);
    expect(summary.metrics.avgDurationMinutes).toBeGreaterThan(0);
  });
});

describe('PredictiveAnalyticsService', () => {
  let service: PredictiveAnalyticsService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new PredictiveAnalyticsService(eventBusMock as EventBusService);
  });

  it('should generate an explainable prediction for DROPOUT_RISK', async () => {
    const result = await service.predict(
      {
        type: PredictionType.DROPOUT_RISK,
        entityId: 'benef-001',
        features: { missedSessions: 3, socialVulnerabilityScore: 4 },
      },
      'default',
    );

    expect(result.predictionId).toBeDefined();
    expect(result.probabilityScore).toBeGreaterThan(0.5);
    expect(result.explanations.length).toBeGreaterThan(0);
    expect(result.recommendedAction).toBeDefined();
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.analytics.predictive.executed.v1',
      expect.objectContaining({ type: PredictionType.DROPOUT_RISK }),
      'default',
      expect.anything(),
    );
  });
});

describe('DataGovernanceService', () => {
  let service: DataGovernanceService;

  beforeEach(() => {
    service = new DataGovernanceService();
  });

  it('should return catalog assets and overall quality score', () => {
    const catalog = service.getCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(4);
    const score = service.getOverallQualityScore();
    expect(score).toBeGreaterThan(90);
  });
});
