import { Injectable, Logger } from '@nestjs/common';
import { RecordBeneficiaryEvolutionDto } from '../dto/social-impact.dto';
import { SocialImpactAuditService } from './social-impact-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface BeneficiaryEvolutionRecord {
  recordId: string;
  pseudonymizedBeneficiaryId: string;
  programName: string;
  initialQualityOfLifeScore: number;
  currentQualityOfLifeScore: number;
  deltaImprovementPercent: number;
  notes: string;
  updatedAt: string;
}

/**
 * BeneficiaryEvolutionService — Acompanhamento Longitudinal de Beneficiários (P165 SIIP)
 *
 * Registra e analisa a evolução dos beneficiários com pseudonimização estrita LGPD,
 * comparando situação inicial, intervenções e qualidade de vida pós-alta.
 */
@Injectable()
export class BeneficiaryEvolutionService {
  private readonly logger = new Logger(BeneficiaryEvolutionService.name);
  private evolutionStore: Map<string, BeneficiaryEvolutionRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: SocialImpactAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async recordEvolution(dto: RecordBeneficiaryEvolutionDto): Promise<BeneficiaryEvolutionRecord> {
    const recordId = `EVOL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const delta = dto.initialQualityOfLifeScore > 0
      ? Math.round(((dto.currentQualityOfLifeScore - dto.initialQualityOfLifeScore) / dto.initialQualityOfLifeScore) * 100)
      : 100;

    const record: BeneficiaryEvolutionRecord = {
      recordId,
      pseudonymizedBeneficiaryId: dto.pseudonymizedBeneficiaryId,
      programName: dto.programName,
      initialQualityOfLifeScore: dto.initialQualityOfLifeScore,
      currentQualityOfLifeScore: dto.currentQualityOfLifeScore,
      deltaImprovementPercent: delta,
      notes: dto.notes ?? 'Evolução registrada conforme plano de atendimento',
      updatedAt: new Date().toISOString(),
    };

    this.evolutionStore.set(recordId, record);

    await this.auditService.recordAudit('RECORD_BENEFICIARY_EVOLUTION', dto.pseudonymizedBeneficiaryId, 'CSIO', {
      recordId, deltaImprovementPercent: delta,
    });

    await this.eventBus.publish(
      'aura.impact.beneficiary.evolution.updated.v1',
      { recordId, pseudonymizedBeneficiaryId: dto.pseudonymizedBeneficiaryId, deltaImprovementPercent: delta },
      this.SYSTEM_TENANT,
      { subject: recordId },
    );

    this.logger.log(`[BeneficiaryEvolution] Record ${recordId} for ${dto.pseudonymizedBeneficiaryId} → Delta: +${delta}%`);
    return record;
  }

  listEvolutions(): BeneficiaryEvolutionRecord[] {
    return Array.from(this.evolutionStore.values());
  }
}
