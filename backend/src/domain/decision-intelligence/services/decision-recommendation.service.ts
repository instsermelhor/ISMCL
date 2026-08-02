import { Injectable, Logger } from '@nestjs/common';
import { CreateDecisionRecommendationDto, DecisionDomain, DecisionStatus, DecisionUrgency } from '../dto/decision-intelligence.dto';
import { ExplainableAiDecisionService, XaiExplanationReport } from './explainable-ai-decision.service';
import { EvidenceManagementService, EvidenceRecord } from './evidence-management.service';
import { DecisionAuditService } from './decision-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface DecisionRecommendationRecord {
  recommendationId: string;
  title: string;
  contextDescription: string;
  domain: DecisionDomain;
  urgency: DecisionUrgency;
  status: DecisionStatus;
  evidences: EvidenceRecord[];
  xaiReport: XaiExplanationReport;
  recommendedOptionTitle: string;
  createdAt: string;
  evaluatedBy?: string;
  evaluatedAt?: string;
  evaluationJustification?: string;
}

/**
 * DecisionRecommendationService — Motor de Recomendações Prescritivas (P159 ADIP)
 *
 * Consolida evidências, simulações e o raciocínio explicável XAI para emitir
 * recomendações prescritivas transparentes e fundamentadas.
 */
@Injectable()
export class DecisionRecommendationService {
  private readonly logger = new Logger(DecisionRecommendationService.name);
  private recommendationRegistry: Map<string, DecisionRecommendationRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly evidenceService: EvidenceManagementService,
    private readonly xaiService: ExplainableAiDecisionService,
    private readonly audit: DecisionAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedRecommendations();
  }

  private seedRecommendations(): void {
    const recId = 'DEC-2026-SEED-01';
    const evids = this.evidenceService.listEvidences();
    const xai = this.xaiService.generateExplanation(recId, evids.map((e) => e.evidenceId), 'ASSISTENTIAL');

    this.recommendationRegistry.set(recId, {
      recommendationId: recId,
      title: 'Redistribuição Preventiva de Profissionais de Psicologia',
      contextDescription: 'Gargalo assistencial previsto no Polo Sul com taxa de ocupação em 87%',
      domain: DecisionDomain.ASSISTENTIAL,
      urgency: DecisionUrgency.HIGH,
      status: DecisionStatus.PROPOSED,
      evidences: evids,
      xaiReport: xai,
      recommendedOptionTitle: 'Redistribuição Interna de Equipes de Psicologia (Alternativa A)',
      createdAt: new Date().toISOString(),
    });
  }

  async createRecommendation(dto: CreateDecisionRecommendationDto): Promise<DecisionRecommendationRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const recommendationId = `DEC-${year}-${seq}`;

    // Coleta evidências associadas
    const evidences: EvidenceRecord[] = [];
    if (dto.evidenceIds && dto.evidenceIds.length > 0) {
      for (const id of dto.evidenceIds) {
        const ev = this.evidenceService.getEvidence(id);
        if (ev) evidences.push(ev);
      }
    }
    if (evidences.length === 0) {
      evidences.push(...this.evidenceService.listEvidences().slice(0, 2));
    }

    const xaiReport = this.xaiService.generateExplanation(
      recommendationId,
      evidences.map((e) => e.evidenceId),
      dto.domain,
    );

    const record: DecisionRecommendationRecord = {
      recommendationId,
      title: dto.title,
      contextDescription: dto.contextDescription,
      domain: dto.domain,
      urgency: dto.urgency,
      status: DecisionStatus.PROPOSED,
      evidences,
      xaiReport,
      recommendedOptionTitle: xaiReport.consideredAlternatives[0] ?? 'Opção Única Recomendada',
      createdAt: new Date().toISOString(),
    };

    this.recommendationRegistry.set(recommendationId, record);

    await this.audit.recordDecisionAudit('CREATE_RECOMMENDATION', recommendationId, 'SYSTEM', {
      title: dto.title, domain: dto.domain, confidenceScore: xaiReport.confidenceScorePercent,
    });

    await this.eventBus.publish(
      'aura.decision.recommendation.generated.v1',
      { recommendationId, title: dto.title, domain: dto.domain, urgency: dto.urgency },
      this.SYSTEM_TENANT,
      { subject: recommendationId },
    );

    this.logger.log(`[DecisionRecommendation] Created: ${recommendationId} (${dto.domain})`);
    return record;
  }

  getRecommendation(id: string): DecisionRecommendationRecord | undefined {
    return this.recommendationRegistry.get(id);
  }

  listRecommendations(domain?: DecisionDomain, status?: DecisionStatus): DecisionRecommendationRecord[] {
    return Array.from(this.recommendationRegistry.values()).filter(
      (r) => (!domain || r.domain === domain) && (!status || r.status === status),
    );
  }

  updateRecord(record: DecisionRecommendationRecord): void {
    this.recommendationRegistry.set(record.recommendationId, record);
  }
}
