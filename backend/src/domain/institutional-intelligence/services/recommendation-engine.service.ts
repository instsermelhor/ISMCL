import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';
import {
  CreateRecommendationDto,
  FeedbackRecommendationDto,
  RecommendationStatus,
  RecommendationType,
} from '../dto/institutional-intelligence.dto';

export interface RecommendationRecord {
  recommendationId: string;
  type: RecommendationType;
  targetId: string;
  title: string;
  justification: string;
  confidenceScore: number;
  status: RecommendationStatus;
  feedbackNotes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class RecommendationEngineService {
  private readonly logger = new Logger(RecommendationEngineService.name);
  private readonly recommendationsCatalog: Map<string, RecommendationRecord> = new Map();

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Gera e registra uma nova recomendação inteligente explicável com grau de confiança.
   */
  async createRecommendation(
    dto: CreateRecommendationDto,
  ): Promise<RecommendationRecord> {
    const recommendationId = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const record: RecommendationRecord = {
      recommendationId,
      type: dto.type,
      targetId: dto.targetId,
      title: dto.title,
      justification: dto.justification,
      confidenceScore: dto.confidenceScore,
      status: RecommendationStatus.PROPOSED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.recommendationsCatalog.set(recommendationId, record);
    this.logger.log(`Nova recomendação [${recommendationId}] criada para alvo [${dto.targetId}]`);

    await this.eventBus.publish(
      'aura.institutional.recommendation.created.v1',
      {
        recommendationId: record.recommendationId,
        type: record.type,
        targetId: record.targetId,
        status: record.status,
      },
      'default',
      { source: 'RecommendationEngineService' },
    );

    return record;
  }

  /**
   * Registra feedback (aceitação/rejeição) para retroalimentação contínua do modelo de recomendações.
   */
  async processFeedback(
    recommendationId: string,
    dto: FeedbackRecommendationDto,
  ): Promise<RecommendationRecord> {
    const record = this.recommendationsCatalog.get(recommendationId);
    if (!record) {
      throw new NotFoundException(`Recomendação [${recommendationId}] não encontrada.`);
    }

    record.status = dto.status;
    record.feedbackNotes = dto.feedbackNotes;
    record.updatedAt = new Date().toISOString();

    this.logger.log(`Feedback da recomendação [${recommendationId}] atualizado para status [${dto.status}]`);

    return record;
  }

  /**
   * Lista todas as recomendações do catálogo.
   */
  async listRecommendations(): Promise<RecommendationRecord[]> {
    return Array.from(this.recommendationsCatalog.values());
  }
}
