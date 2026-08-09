import { Injectable, Logger } from '@nestjs/common';
import { IntegrationStatus, ReviewIntegrationDto } from '../dto/enterprise-integration.dto';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface IntegrationGovernanceReview {
  reviewId: string;
  integrationId: string;
  decision: IntegrationStatus;
  reviewedBy: string;
  reviewNotes: string;
  reviewedAt: string;
}

/**
 * IntegrationGovernanceService — Governança de Integrações (P166 EIIP)
 *
 * Controla o ciclo de vida, homologação, aprovação, atração de riscos e conformidade
 * de todas as integrações da Plataforma Aura. Nenhuma integração é ativada sem homologação formal.
 */
@Injectable()
export class IntegrationGovernanceService {
  private readonly logger = new Logger(IntegrationGovernanceService.name);
  private reviewHistory: IntegrationGovernanceReview[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async reviewIntegration(dto: ReviewIntegrationDto): Promise<IntegrationGovernanceReview> {
    const reviewId = `REV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const review: IntegrationGovernanceReview = {
      reviewId,
      integrationId: dto.integrationId,
      decision: dto.decision ?? dto.status,
      reviewedBy: dto.reviewedBy ?? dto.reviewerId,
      reviewNotes: dto.notes ?? '',
      reviewedAt: new Date().toISOString(),
    };

    this.reviewHistory.push(review);

    await this.auditService.recordAudit('REVIEW_INTEGRATION', dto.integrationId, dto.reviewedBy ?? dto.reviewerId, {
      reviewId, decision: dto.decision ?? dto.status,
    });

    const eventName = dto.decision === IntegrationStatus.APPROVED
      ? 'aura.integration.approved.v1'
      : 'aura.integration.rejected.v1';

    await this.eventBus.publish(
      eventName,
      { reviewId, integrationId: dto.integrationId, decision: dto.decision, reviewedBy: dto.reviewedBy },
      this.SYSTEM_TENANT,
      { subject: dto.integrationId },
    );

    this.logger.log(`[IntegrationGovernance] Integration ${dto.integrationId} → ${dto.decision} by ${dto.reviewedBy}`);
    return review;
  }

  getReviewHistory(): IntegrationGovernanceReview[] {
    return [...this.reviewHistory];
  }
}
