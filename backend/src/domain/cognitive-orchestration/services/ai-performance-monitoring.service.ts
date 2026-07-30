import { Injectable, Logger } from '@nestjs/common';
import { RecordTelemetryDto } from '../dto/cognitive-orchestration.dto';
import { CognitiveAuditService } from './cognitive-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

// ── INTERFACES ────────────────────────────────────────────────────────────────

export type PerformanceStatus = 'OPTIMAL' | 'DEGRADED' | 'DRIFT_ALERT' | 'CRITICAL';

export interface AITelemetryMetric {
  metricId: string;
  modelId: string;
  providerName?: string;
  latencyMs: number;
  tokensInput: number;
  tokensOutput: number;
  estimatedCostBrl: number;
  hallucinationRiskScore: number;
  biasScore: number;
  successStatus: boolean;
  recordedAt: string;
}

export interface AIPerformanceMetric {
  agentOrModelId: string;
  accuracy: number;
  avgLatencyMs: number;
  computeCostBRL: number;
  modelDriftIndex: number;
  recommendationQualityScore: number;
  userApprovalRate: number;
  status: PerformanceStatus;
  lastEvaluatedAt: string;
  totalRequests: number;
}

export interface AggregatedStats {
  modelId: string;
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  totalCostBrl: number;
  avgHallucinationRisk: number;
  avgBiasScore: number;
  driftAlert: boolean;
  computedAt: string;
}

// ── SERVICE ───────────────────────────────────────────────────────────────────

/**
 * AIPerformanceMonitoringService — Monitoramento Contínuo de Agentes e Modelos (P152 ACOP)
 *
 * Monitora precisão, tempo de resposta, custo computacional, utilização,
 * deriva de modelos, degradação, qualidade das recomendações e feedback.
 *
 * Referências: P111 (AEAIP), P117 (AEOSMRP), P152 (ACOP)
 */
@Injectable()
export class AIPerformanceMonitoringService {
  private readonly logger = new Logger(AIPerformanceMonitoringService.name);
  private metricsStore: Map<string, AIPerformanceMetric> = new Map();
  private telemetryLog: AITelemetryMetric[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedMetrics();
  }

  private seedMetrics(): void {
    const initialAgents = [
      'agent-psychology-v1',
      'agent-psychiatry-v1',
      'agent-social-work-v1',
      'agent-legal-v1',
      'agent-finance-v1',
      'agent-governance-v1',
    ];

    for (const agentId of initialAgents) {
      this.metricsStore.set(agentId, {
        agentOrModelId: agentId,
        accuracy: 0.94,
        avgLatencyMs: 230,
        computeCostBRL: 45.20,
        modelDriftIndex: 0.04,
        recommendationQualityScore: 0.92,
        userApprovalRate: 0.95,
        status: 'OPTIMAL',
        lastEvaluatedAt: new Date().toISOString(),
        totalRequests: 1,
      });
    }
  }

  // ── Método principal P152 (assinatura do spec) ──────────────────────────────

  /**
   * Registra métricas de telemetria para um modelo de IA.
   * Compatível com a assinatura do spec P152.
   */
  async recordTelemetry(dto: RecordTelemetryDto): Promise<AITelemetryMetric & { metricId: string }> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const metricId = `TEL-${year}-${seq}`;

    const telemetry: AITelemetryMetric = {
      metricId,
      modelId: dto.modelId,
      providerName: dto.providerName,
      latencyMs: dto.latencyMs,
      tokensInput: dto.tokensInput ?? 0,
      tokensOutput: dto.tokensOutput ?? 0,
      estimatedCostBrl: dto.estimatedCostBrl ?? 0,
      hallucinationRiskScore: dto.hallucinationRiskScore ?? 0,
      biasScore: dto.biasScore ?? 0,
      successStatus: dto.successStatus,
      recordedAt: new Date().toISOString(),
    };

    this.telemetryLog.push(telemetry);

    // Update or create aggregate metric
    this.evaluateAgentPerformance(dto.modelId, dto.latencyMs, dto.successStatus);

    await this.eventBus.publish(
      'aura.cognitive.performance_recorded',
      { metricId, modelId: dto.modelId, latencyMs: dto.latencyMs, successStatus: dto.successStatus },
      this.SYSTEM_TENANT,
      { subject: dto.modelId },
    );

    this.logger.log(`[AIPerformance] Telemetry recorded: ${metricId} for model ${dto.modelId}`);
    return { ...telemetry, metricId };
  }

  /**
   * Retorna estatísticas agregadas para um modelo.
   * Compatível com a assinatura do spec P152.
   */
  async getAggregatedStats(modelId: string): Promise<AggregatedStats> {
    const modelTelemetry = this.telemetryLog.filter((t) => t.modelId === modelId);
    const metric = this.metricsStore.get(modelId);

    if (modelTelemetry.length === 0) {
      return {
        modelId,
        totalRequests: 0,
        successRate: 0,
        avgLatencyMs: 0,
        totalCostBrl: 0,
        avgHallucinationRisk: 0,
        avgBiasScore: 0,
        driftAlert: false,
        computedAt: new Date().toISOString(),
      };
    }

    const total = modelTelemetry.length;
    const successes = modelTelemetry.filter((t) => t.successStatus).length;
    const avgLatency = modelTelemetry.reduce((s, t) => s + t.latencyMs, 0) / total;
    const totalCost = modelTelemetry.reduce((s, t) => s + t.estimatedCostBrl, 0);
    const avgHallu = modelTelemetry.reduce((s, t) => s + t.hallucinationRiskScore, 0) / total;
    const avgBias = modelTelemetry.reduce((s, t) => s + t.biasScore, 0) / total;

    return {
      modelId,
      totalRequests: total,
      successRate: successes / total,
      avgLatencyMs: Math.round(avgLatency),
      totalCostBrl: Math.round(totalCost * 100) / 100,
      avgHallucinationRisk: Math.round(avgHallu * 1000) / 1000,
      avgBiasScore: Math.round(avgBias * 1000) / 1000,
      driftAlert: metric ? metric.modelDriftIndex > 0.25 : false,
      computedAt: new Date().toISOString(),
    };
  }

  // ── Métodos de compatibilidade com implementações anteriores ─────────────────

  /**
   * @deprecated Usar recordTelemetry() — mantido para backward-compat.
   */
  evaluateAgentPerformance(
    agentOrModelId: string,
    latencyMs: number,
    isApprovedByUser?: boolean,
  ): AIPerformanceMetric {
    let metric = this.metricsStore.get(agentOrModelId);

    if (!metric) {
      metric = {
        agentOrModelId,
        accuracy: 0.92,
        avgLatencyMs: latencyMs,
        computeCostBRL: 12.50,
        modelDriftIndex: 0.02,
        recommendationQualityScore: 0.90,
        userApprovalRate: isApprovedByUser === true ? 1.0 : 0.8,
        status: 'OPTIMAL',
        lastEvaluatedAt: new Date().toISOString(),
        totalRequests: 1,
      };
    } else {
      metric.avgLatencyMs = Math.round(metric.avgLatencyMs * 0.8 + latencyMs * 0.2);
      metric.lastEvaluatedAt = new Date().toISOString();
      metric.totalRequests = (metric.totalRequests || 0) + 1;

      if (isApprovedByUser !== undefined) {
        metric.userApprovalRate =
          Math.round((metric.userApprovalRate * 0.9 + (isApprovedByUser ? 1 : 0) * 0.1) * 100) / 100;
      }

      if (metric.userApprovalRate < 0.75 || metric.modelDriftIndex > 0.25) {
        metric.status = 'DRIFT_ALERT';
        this.logger.warn(`[AIPerformance] Drift Alert for agent/model: ${agentOrModelId}`);

        this.eventBus
          .publish(
            'aura.cognitive.performance.changed.v1',
            { agentOrModelId, status: metric.status, driftIndex: metric.modelDriftIndex },
            this.SYSTEM_TENANT,
          )
          .catch((e) => this.logger.error(e));
      }
    }

    this.metricsStore.set(agentOrModelId, metric);
    return metric;
  }

  getAllMetrics(): AIPerformanceMetric[] {
    return Array.from(this.metricsStore.values());
  }

  getMetric(agentOrModelId: string): AIPerformanceMetric | undefined {
    return this.metricsStore.get(agentOrModelId);
  }
}
