import { Injectable, Logger } from '@nestjs/common';
import { CognitiveAuditService } from './cognitive-audit.service';
import { EventBusService } from '../../../core/event-bus/event-bus.service';

export interface AIPerformanceMetric {
  agentOrModelId: string;
  accuracy: number;
  avgLatencyMs: number;
  computeCostBRL: number;
  modelDriftIndex: number; // 0.0 to 1.0 (0 = stable, >0.2 = drift alert)
  recommendationQualityScore: number;
  userApprovalRate: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'DRIFT_ALERT' | 'CRITICAL';
  lastEvaluatedAt: string;
}

@Injectable()
export class AIPerformanceMonitoringService {
  private readonly logger = new Logger(AIPerformanceMonitoringService.name);
  private metricsStore: Map<string, AIPerformanceMetric> = new Map();

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedMetrics();
  }

  private seedMetrics() {
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
      });
    }
  }

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
        userApprovalRate: isApprovedByUser ? 1.0 : 0.8,
        status: 'OPTIMAL',
        lastEvaluatedAt: new Date().toISOString(),
      };
    } else {
      // Exponential moving average for latency
      metric.avgLatencyMs = Math.round(metric.avgLatencyMs * 0.8 + latencyMs * 0.2);
      metric.lastEvaluatedAt = new Date().toISOString();

      if (isApprovedByUser !== undefined) {
        metric.userApprovalRate = Math.round((metric.userApprovalRate * 0.9 + (isApprovedByUser ? 1 : 0) * 0.1) * 100) / 100;
      }

      // Check degradation or drift
      if (metric.userApprovalRate < 0.75 || metric.modelDriftIndex > 0.25) {
        metric.status = 'DRIFT_ALERT';
        this.logger.warn(`[AIPerformance] Drift Alert for agent/model: ${agentOrModelId}`);

        this.eventBus.publish({
          id: `PERF-${Date.now()}`,
          source: 'aura/cognitive-orchestration/performance',
          type: 'aura.cognitive.performance.changed.v1',
          datacontenttype: 'application/json',
          time: new Date().toISOString(),
          data: { agentOrModelId, status: metric.status, driftIndex: metric.modelDriftIndex, approvalRate: metric.userApprovalRate },
        });
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
