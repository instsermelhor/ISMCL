import { Injectable, Logger } from '@nestjs/common';
import { ExternalAuditService } from './external-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface IntegrationHealthMetrics {
  partnerCode: string;
  availabilityPercentage: number;
  avgLatencyMs: number;
  throughputRpm: number;
  failedRequestsCount: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'DOWN';
  lastEvaluatedAt: string;
}

export interface IntegrationAlert {
  alertId: string;
  partnerCode: string;
  severity: 'WARNING' | 'HIGH' | 'CRITICAL';
  message: string;
  triggeredAt: string;
  resolvedAt?: string;
}

/**
 * IntegrationMonitoringService — Monitoramento em Tempo Real & Alertas (P155 AEIDIP)
 *
 * Monitora disponibilidade, latência, throughput, consumo de cota e falhas de integrações.
 * Dispara alertas automáticos e publica aura.interoperability.failure.detected.v1 ao detectar degradação.
 */
@Injectable()
export class IntegrationMonitoringService {
  private readonly logger = new Logger(IntegrationMonitoringService.name);
  private metricsStore: Map<string, IntegrationHealthMetrics> = new Map();
  private alertsLog: IntegrationAlert[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ExternalAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedMetrics();
  }

  private seedMetrics(): void {
    const seeds: IntegrationHealthMetrics[] = [
      {
        partnerCode: 'MINISTERIO_DA_SAUDE_SUS',
        availabilityPercentage: 99.95,
        avgLatencyMs: 145,
        throughputRpm: 120,
        failedRequestsCount: 2,
        status: 'HEALTHY',
        lastEvaluatedAt: new Date().toISOString(),
      },
      {
        partnerCode: 'SUAS_CADUNICO_SOCIAL',
        availabilityPercentage: 98.50,
        avgLatencyMs: 420,
        throughputRpm: 45,
        failedRequestsCount: 12,
        status: 'DEGRADED',
        lastEvaluatedAt: new Date().toISOString(),
      },
    ];

    for (const m of seeds) {
      this.metricsStore.set(m.partnerCode, m);
    }
  }

  async recordTelemetry(partnerCode: string, latencyMs: number, success: boolean): Promise<IntegrationHealthMetrics> {
    let metric = this.metricsStore.get(partnerCode);

    if (!metric) {
      metric = {
        partnerCode,
        availabilityPercentage: success ? 100.0 : 0.0,
        avgLatencyMs: latencyMs,
        throughputRpm: 1,
        failedRequestsCount: success ? 0 : 1,
        status: 'HEALTHY',
        lastEvaluatedAt: new Date().toISOString(),
      };
    } else {
      metric.avgLatencyMs = Math.round(metric.avgLatencyMs * 0.8 + latencyMs * 0.2);
      metric.lastEvaluatedAt = new Date().toISOString();
      metric.throughputRpm += 1;

      if (!success) {
        metric.failedRequestsCount += 1;
        metric.availabilityPercentage = Math.max(0, Math.round((metric.availabilityPercentage - 0.5) * 10) / 10);
      } else {
        metric.availabilityPercentage = Math.min(100, Math.round((metric.availabilityPercentage + 0.1) * 10) / 10);
      }

      // Avaliação de alerta
      if (metric.failedRequestsCount > 10 || metric.availabilityPercentage < 95.0) {
        metric.status = 'DEGRADED';
        await this.triggerAlert(partnerCode, 'HIGH', `Integração degradada com ${partnerCode}. Disponibilidade: ${metric.availabilityPercentage}%`);
      }
    }

    this.metricsStore.set(partnerCode, metric);
    return metric;
  }

  async triggerAlert(partnerCode: string, severity: IntegrationAlert['severity'], message: string): Promise<IntegrationAlert> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 6).toUpperCase();
    const alertId = `ALT-${year}-${seq}`;

    const alert: IntegrationAlert = {
      alertId,
      partnerCode,
      severity,
      message,
      triggeredAt: new Date().toISOString(),
    };

    this.alertsLog.push(alert);

    await this.auditService.recordAudit({
      serviceName: 'integration-monitoring-service',
      actionName: 'IntegrationFailureDetected',
      partnerCode,
      details: { alertId, severity, message },
    });

    await this.eventBus.publish(
      'aura.interoperability.failure.detected.v1',
      { alertId, partnerCode, severity, message },
      this.SYSTEM_TENANT,
      { subject: alertId },
    );

    this.logger.warn(`[IntegrationMonitoring] Alert Triggered: ${alertId} for ${partnerCode} (${severity})`);
    return alert;
  }

  getMetrics(partnerCode?: string): IntegrationHealthMetrics[] {
    const all = Array.from(this.metricsStore.values());
    return partnerCode ? all.filter((m) => m.partnerCode === partnerCode) : all;
  }

  getAlerts(partnerCode?: string): IntegrationAlert[] {
    return partnerCode ? this.alertsLog.filter((a) => a.partnerCode === partnerCode) : [...this.alertsLog];
  }
}
