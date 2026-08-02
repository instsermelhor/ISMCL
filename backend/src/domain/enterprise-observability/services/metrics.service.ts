import { Injectable, Logger } from '@nestjs/common';
import { ObservabilityAuditService } from './observability-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface MetricSummary {
  metricName: string;
  count: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  avg: number;
}

/**
 * MetricsService — P173 EORP
 *
 * Gestão de métricas corporativas e estatísticas de séries temporais.
 * Calcula agregados em tempo real (p50, p95, p99, min, max, avg) em conformidade
 * com as especificações OpenMetrics e Prometheus.
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly metricSeries: Map<string, number[]> = new Map();

  constructor(
    private readonly auditSvc: ObservabilityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  pushDataPoint(metricName: string, value: number): void {
    if (!this.metricSeries.has(metricName)) {
      this.metricSeries.set(metricName, []);
    }
    const series = this.metricSeries.get(metricName)!;
    series.push(value);

    // Manter janela deslizante de 1000 data points
    if (series.length > 1000) series.shift();
  }

  getMetricSummary(metricName: string): MetricSummary | undefined {
    const series = this.metricSeries.get(metricName);
    if (!series || series.length === 0) return undefined;

    const sorted = [...series].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = Math.round((sorted.reduce((s, v) => s + v, 0) / count) * 1000) / 1000;

    const p50 = sorted[Math.floor(count * 0.5)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];

    return {
      metricName,
      count,
      min,
      max,
      p50,
      p95,
      p99,
      avg,
    };
  }

  listMetrics(): string[] {
    return Array.from(this.metricSeries.keys());
  }
}
