import { Injectable, Logger } from '@nestjs/common';
import {
  CreateKpiDto,
  RecordKpiValueDto,
  KpiCategory,
  KpiPeriodicity,
} from '../dto/enterprise-strategy.dto';
import { StrategyAuditService } from './strategy-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface KpiHistoryEntry {
  period: string;
  value: number;
  recordedAt: string;
  recordedBy: string;
}

export interface KPIRecord {
  kpiId: string;
  name: string;
  category: KpiCategory;
  formula: string;
  periodicity: KpiPeriodicity;
  owner: string;
  dataSource: string;
  unit: string;
  targets: { min?: number; target?: number; stretch?: number };
  currentValue?: number;
  currentPeriod?: string;
  trend: 'UP' | 'DOWN' | 'STABLE' | 'UNKNOWN';
  history: KpiHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

/**
 * InstitutionalKpiService — P168 ESGP
 *
 * Catálogo corporativo de KPIs parametrizáveis com fórmulas, metas,
 * periodicidade, rastreabilidade e histórico completo.
 * Suporta 10 categorias cobrindo toda a operação institucional.
 */
@Injectable()
export class InstitutionalKpiService {
  private readonly logger = new Logger(InstitutionalKpiService.name);
  private readonly kpiStore: Map<string, KPIRecord> = new Map();

  constructor(
    private readonly auditSvc: StrategyAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async createKPI(dto: CreateKpiDto, createdBy = 'SYSTEM'): Promise<KPIRecord> {
    const kpiId = `KPI-${dto.category}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const kpi: KPIRecord = {
      kpiId,
      name: dto.name,
      category: dto.category,
      formula: dto.formula,
      periodicity: dto.periodicity,
      owner: dto.owner,
      dataSource: dto.dataSource,
      unit: dto.unit ?? '',
      targets: dto.targets ?? {},
      trend: 'UNKNOWN',
      history: [],
      createdAt: now,
      updatedAt: now,
    };

    this.kpiStore.set(kpiId, kpi);

    await this.auditSvc.recordAudit('KPI_CREATED', kpiId, createdBy, {
      name: dto.name,
      category: dto.category,
      formula: dto.formula,
    });

    this.logger.log(`[InstitutionalKPI] KPI "${kpiId}" criado: ${dto.name}`);
    return kpi;
  }

  async recordValue(dto: RecordKpiValueDto, recordedBy = 'SYSTEM'): Promise<KPIRecord> {
    const kpi = this.getKPIOrThrow(dto.kpiId);
    const period = dto.period ?? this.getCurrentPeriod(kpi.periodicity);
    const now = new Date().toISOString();

    // Calcular tendência
    const prevValue = kpi.currentValue;
    if (prevValue !== undefined) {
      kpi.trend = dto.value > prevValue ? 'UP' : dto.value < prevValue ? 'DOWN' : 'STABLE';
    }

    kpi.currentValue = dto.value;
    kpi.currentPeriod = period;
    kpi.updatedAt = now;

    kpi.history.push({
      period,
      value: dto.value,
      recordedAt: now,
      recordedBy,
    });

    await this.auditSvc.recordAudit('KPI_VALUE_RECORDED', dto.kpiId, recordedBy, {
      value: dto.value,
      period,
      trend: kpi.trend,
    });

    await this.eventBus.publish(
      'aura.strategy.kpi.calculated.v1',
      { kpiId: dto.kpiId, value: dto.value, period, trend: kpi.trend },
      'ESGP',
      { subject: dto.kpiId },
    );

    this.logger.log(`[InstitutionalKPI] KPI "${dto.kpiId}" valor: ${dto.value} (${period}) — tendência: ${kpi.trend}`);
    return kpi;
  }

  getKPI(kpiId: string): KPIRecord | undefined {
    return this.kpiStore.get(kpiId);
  }

  listKPIs(category?: KpiCategory, periodicity?: KpiPeriodicity): KPIRecord[] {
    let kpis = Array.from(this.kpiStore.values());
    if (category) kpis = kpis.filter((k) => k.category === category);
    if (periodicity) kpis = kpis.filter((k) => k.periodicity === periodicity);
    return kpis;
  }

  getKPIHistory(kpiId: string): KpiHistoryEntry[] {
    return this.getKPIOrThrow(kpiId).history;
  }

  assessTarget(kpiId: string): { status: 'BELOW_MIN' | 'BELOW_TARGET' | 'ON_TARGET' | 'STRETCH_ACHIEVED'; value: number } {
    const kpi = this.getKPIOrThrow(kpiId);
    const value = kpi.currentValue ?? 0;
    const { min, target, stretch } = kpi.targets;

    let status: 'BELOW_MIN' | 'BELOW_TARGET' | 'ON_TARGET' | 'STRETCH_ACHIEVED' = 'BELOW_MIN';
    if (stretch !== undefined && value >= stretch) status = 'STRETCH_ACHIEVED';
    else if (target !== undefined && value >= target) status = 'ON_TARGET';
    else if (min !== undefined && value >= min) status = 'BELOW_TARGET';
    else status = 'BELOW_MIN';

    return { status, value };
  }

  private getKPIOrThrow(kpiId: string): KPIRecord {
    const k = this.kpiStore.get(kpiId);
    if (!k) throw new Error(`KPI "${kpiId}" não encontrado.`);
    return k;
  }

  private getCurrentPeriod(periodicity: KpiPeriodicity): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const w = Math.ceil(now.getDate() / 7);
    const q = Math.ceil((now.getMonth() + 1) / 3);

    switch (periodicity) {
      case KpiPeriodicity.DAILY: return `${y}-${m}-${String(now.getDate()).padStart(2, '0')}`;
      case KpiPeriodicity.WEEKLY: return `${y}-W${w}`;
      case KpiPeriodicity.MONTHLY: return `${y}-${m}`;
      case KpiPeriodicity.QUARTERLY: return `${y}-Q${q}`;
      case KpiPeriodicity.ANNUAL: return `${y}`;
    }
  }
}
