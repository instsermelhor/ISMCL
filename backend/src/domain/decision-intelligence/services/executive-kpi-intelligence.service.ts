import { Injectable, Logger } from '@nestjs/common';
import { DecisionDomain, KpiStatus, RegisterKpiDto } from '../dto/decision-intelligence.dto';
import { DecisionAuditService } from './decision-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface KpiRecord {
  kpiId: string;
  name: string;
  description: string;
  domain: DecisionDomain;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: KpiStatus;
  deviationPercent: number;
  lastEvaluatedAt: string;
}

/**
 * ExecutiveKpiIntelligenceService — Gestão Inteligente de KPIs (P159 ADIP)
 *
 * Alinha e monitora indicadores estratégicos corporativos com a missão do
 * Instituto Ser Melhor, emitindo alertas automáticos quando ocorrem desvios
 * significativos em relação às metas homologadas.
 */
@Injectable()
export class ExecutiveKpiIntelligenceService {
  private readonly logger = new Logger(ExecutiveKpiIntelligenceService.name);
  private kpiRegistry: Map<string, KpiRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: DecisionAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedKpis();
  }

  private seedKpis(): void {
    const seeds: RegisterKpiDto[] = [
      { name: 'NPS Assistencial', description: 'Satisfação geral dos beneficiários com o atendimento', domain: DecisionDomain.ASSISTENTIAL, targetValue: 80, currentValue: 74, unit: 'pts' },
      { name: 'Capacidade Média de Atendimento', description: 'Atendimentos mensais realizados', domain: DecisionDomain.OPERATIONAL, targetValue: 4800, currentValue: 4240, unit: 'atendimentos/mês' },
      { name: 'Índice de Sustentabilidade Financeira', description: 'Cobertura de custos fixos por recursos próprios/doações', domain: DecisionDomain.FINANCIAL, targetValue: 90, currentValue: 88, unit: '%' },
      { name: 'Score de Impacto Social', description: 'Índice composto de transformação social', domain: DecisionDomain.STRATEGIC, targetValue: 85, currentValue: 88.2, unit: 'pts' },
    ];

    for (const dto of seeds) {
      const id = `KPI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const dev = Math.round(((dto.currentValue - dto.targetValue) / dto.targetValue) * 1000) / 10;
      let status = KpiStatus.ON_TRACK;
      if (dev < -15) status = KpiStatus.CRITICAL_DEVIATION;
      else if (dev < -5) status = KpiStatus.NEEDS_ATTENTION;

      this.kpiRegistry.set(id, {
        kpiId: id,
        ...dto,
        status,
        deviationPercent: dev,
        lastEvaluatedAt: new Date().toISOString(),
      });
    }
  }

  async registerKpi(dto: RegisterKpiDto): Promise<KpiRecord> {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const kpiId = `KPI-${seq}`;
    const dev = Math.round(((dto.currentValue - dto.targetValue) / dto.targetValue) * 1000) / 10;

    let status = KpiStatus.ON_TRACK;
    const absDev = Math.abs(dev);
    if (absDev > 15) status = KpiStatus.CRITICAL_DEVIATION;
    else if (absDev > 5) status = KpiStatus.NEEDS_ATTENTION;

    const record: KpiRecord = {
      kpiId,
      ...dto,
      status,
      deviationPercent: dev,
      lastEvaluatedAt: new Date().toISOString(),
    };

    this.kpiRegistry.set(kpiId, record);

    if (status === KpiStatus.CRITICAL_DEVIATION || status === KpiStatus.NEEDS_ATTENTION) {
      await this.eventBus.publish(
        'aura.decision.kpi.alert.detected.v1',
        { kpiId, name: dto.name, status, deviationPercent: dev },
        this.SYSTEM_TENANT,
        { subject: kpiId },
      );
    }

    this.logger.log(`[ExecutiveKpi] Registered: ${kpiId} (${status})`);
    return record;
  }

  listKpis(domain?: DecisionDomain): KpiRecord[] {
    return Array.from(this.kpiRegistry.values()).filter(
      (k) => !domain || k.domain === domain,
    );
  }
}
