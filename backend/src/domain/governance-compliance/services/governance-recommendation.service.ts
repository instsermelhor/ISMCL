import { Injectable, Logger } from '@nestjs/common';
import { GenerateGovernanceRecommendationDto } from '../dto/governance-compliance.dto';
import { ContinuousAuditService } from './continuous-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface GovernanceRecommendationRecord {
  recommendationId: string;
  title: string;
  rationale: string;
  priority: string;
  suggestedOwner: string;
  evidencesCount: number;
  status: 'PROPOSED' | 'APPROVED' | 'IMPLEMENTED';
  generatedAt: string;
}

/**
 * GovernanceRecommendationService — Recomendações de Governança (P161 AGCC)
 *
 * Emite recomendações fundamentadas para melhoria contínua de processos, segurança,
 * conformidade, gestão de riscos, arquitetura e governança da Inteligência Artificial.
 */
@Injectable()
export class GovernanceRecommendationService {
  private readonly logger = new Logger(GovernanceRecommendationService.name);
  private recommendationStore: Map<string, GovernanceRecommendationRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: ContinuousAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedRecommendations();
  }

  private seedRecommendations(): void {
    const seeds: GenerateGovernanceRecommendationDto[] = [
      {
        title: 'MFA Mandatório para Acesso ao Centro de Comando Executivo',
        rationale: 'Reforço da política de Zero Trust para contas com privilégios de comando',
        priority: 'HIGH',
        suggestedOwner: 'CISO',
      },
    ];

    for (const dto of seeds) {
      const id = `REC-GOV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.recommendationStore.set(id, {
        recommendationId: id,
        title: dto.title,
        rationale: dto.rationale,
        priority: dto.priority ?? 'MEDIUM',
        suggestedOwner: dto.suggestedOwner ?? 'CGO',
        evidencesCount: 3,
        status: 'PROPOSED',
        generatedAt: new Date().toISOString(),
      });
    }
  }

  async generateRecommendation(dto: GenerateGovernanceRecommendationDto): Promise<GovernanceRecommendationRecord> {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const recommendationId = `REC-GOV-${Date.now()}-${seq}`;

    const record: GovernanceRecommendationRecord = {
      recommendationId,
      title: dto.title,
      rationale: dto.rationale,
      priority: dto.priority ?? 'MEDIUM',
      suggestedOwner: dto.suggestedOwner ?? 'CGO',
      evidencesCount: 2,
      status: 'PROPOSED',
      generatedAt: new Date().toISOString(),
    };

    this.recommendationStore.set(recommendationId, record);

    await this.audit.recordAuditCheck('GENERATE_GOVERNANCE_RECOMMENDATION', recommendationId, 'CGO', {
      title: dto.title, priority: record.priority,
    });

    await this.eventBus.publish(
      'aura.governance.recommendation.generated.v1',
      { recommendationId, title: dto.title, priority: record.priority },
      this.SYSTEM_TENANT,
      { subject: recommendationId },
    );

    this.logger.log(`[GovernanceRecommendation] Generated: ${recommendationId} — ${dto.title}`);
    return record;
  }

  listRecommendations(): GovernanceRecommendationRecord[] {
    return Array.from(this.recommendationStore.values());
  }
}
