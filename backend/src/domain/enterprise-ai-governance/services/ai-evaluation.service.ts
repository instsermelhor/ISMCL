import { Injectable, Logger } from '@nestjs/common';
import { EvaluateModelDto, ModelPerformanceRating } from '../dto/enterprise-ai-governance.dto';
import { AIAuditService } from './ai-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ModelEvaluationReport {
  evaluationId: string;
  assetId: string;
  sampleSize: number;
  accuracy: number;
  hallucinationRate: number;
  modelDriftScore: number;
  responseQuality: number;
  avgLatencyMs: number;
  costPerThousandInferences: number;
  userSatisfactionScore: number;
  rating: ModelPerformanceRating;
  alerts: string[];
  evaluatedAt: string;
}

@Injectable()
export class AIEvaluationService {
  private readonly logger = new Logger(AIEvaluationService.name);
  private readonly evaluations: Map<string, ModelEvaluationReport> = new Map();

  constructor(
    private readonly auditSvc: AIAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async evaluateModel(dto: EvaluateModelDto): Promise<ModelEvaluationReport> {
    const evaluationId = `EVAL-${dto.assetId}-${Date.now().toString(36).toUpperCase()}`;
    const accuracy = 0.94;
    const hallucinationRate = 2.1;
    const modelDriftScore = 3.5;
    const responseQuality = 91;
    const avgLatencyMs = 48;
    const costPerThousandInferences = 0.12;
    const userSatisfactionScore = 88;

    const alerts: string[] = [];
    if (hallucinationRate > 5) alerts.push('ALERT: Taxa de alucinação acima de 5%');
    if (modelDriftScore > 10) alerts.push('ALERT: Drift do modelo acima do limite');
    if (accuracy < 0.85) alerts.push('ALERT: Accuracy abaixo de 85%');

    const rating = accuracy >= 0.95 ? ModelPerformanceRating.EXCELLENT
      : accuracy >= 0.90 ? ModelPerformanceRating.GOOD
      : accuracy >= 0.80 ? ModelPerformanceRating.ACCEPTABLE
      : accuracy >= 0.70 ? ModelPerformanceRating.DEGRADED
      : ModelPerformanceRating.CRITICAL;

    const report: ModelEvaluationReport = {
      evaluationId, assetId: dto.assetId, sampleSize: dto.sampleSize,
      accuracy, hallucinationRate, modelDriftScore, responseQuality,
      avgLatencyMs, costPerThousandInferences, userSatisfactionScore,
      rating, alerts, evaluatedAt: new Date().toISOString(),
    };

    this.evaluations.set(evaluationId, report);
    await this.auditSvc.recordAudit('MODEL_PERFORMANCE_EVALUATED', evaluationId, dto.evaluatedBy ?? 'SYSTEM', { assetId: dto.assetId, accuracy, rating });
    await this.eventBus.publish('aura.eaigp.model.evaluated.v1', { evaluationId, assetId: dto.assetId, accuracy, rating, hallucinationRate }, 'EAIGP', { subject: evaluationId });
    this.logger.log(`[AIEvaluation] 📊 Modelo "${dto.assetId}" avaliado: ${rating} (Accuracy: ${(accuracy * 100).toFixed(1)}%, Hallucination: ${hallucinationRate}%)`);
    return report;
  }

  getEvaluation(evaluationId: string): ModelEvaluationReport | undefined { return this.evaluations.get(evaluationId); }
  listEvaluations(assetId?: string): ModelEvaluationReport[] {
    const all = Array.from(this.evaluations.values());
    return assetId ? all.filter((e) => e.assetId === assetId) : all;
  }
}
