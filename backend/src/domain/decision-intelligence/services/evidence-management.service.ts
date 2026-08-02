import { Injectable, Logger } from '@nestjs/common';
import { RecordEvidenceDto, EvidenceType } from '../dto/decision-intelligence.dto';
import { DecisionAuditService } from './decision-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface EvidenceRecord {
  evidenceId: string;
  evidenceType: EvidenceType;
  title: string;
  description: string;
  sourceEntityId?: string;
  metadata: Record<string, any>;
  collectedAt: string;
}

/**
 * EvidenceManagementService — Gestão de Evidências (P159 ADIP)
 *
 * Rastreia, valida e vincula evidências de apoio à decisão provenientes de:
 * indicadores de BI, documentos/normas do EKIP (P158), simulações do Digital Twin (P157),
 * observabilidade AUOC (P156) e histórico de decisões anteriores.
 */
@Injectable()
export class EvidenceManagementService {
  private readonly logger = new Logger(EvidenceManagementService.name);
  private evidenceStore: Map<string, EvidenceRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: DecisionAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedEvidences();
  }

  private seedEvidences(): void {
    const seeds: RecordEvidenceDto[] = [
      {
        evidenceType: EvidenceType.DIGITAL_TWIN_SIMULATION,
        title: 'Simulação ADT — Expansão Polo Sul',
        description: 'Simulação SIM-2026-042 prevê aumento de +45% de capacidade com 2 novos profissionais',
        sourceEntityId: 'SIM-2026-042',
        metadata: { sourceModule: 'digital-twin', confidence: 0.94 },
      },
      {
        evidenceType: EvidenceType.KNOWLEDGE_DOCUMENT,
        title: 'Protocolo de Atendimento Psicossocial',
        description: 'Protocolo KNOWLEDGE-2026-SEED-01 estabelece diretrizes de triagem em crise',
        sourceEntityId: 'KNOWLEDGE-2026-SEED-01',
        metadata: { sourceModule: 'enterprise-knowledge', domain: 'ASSISTENTIAL' },
      },
      {
        evidenceType: EvidenceType.METRIC_INDICATOR,
        title: 'NPS e Taxa de Ocupação Atual',
        description: 'NPS em 74 pontos, taxa de ocupação em 67.5% com tendência de alta de +0.8%/mês',
        sourceEntityId: 'KPI-NPS-01',
        metadata: { sourceModule: 'unified-operations', currentValue: 74 },
      },
    ];

    for (const dto of seeds) {
      const id = `EVID-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.evidenceStore.set(id, {
        evidenceId: id,
        ...dto,
        metadata: dto.metadata ?? {},
        collectedAt: new Date().toISOString(),
      });
    }
  }

  async recordEvidence(dto: RecordEvidenceDto): Promise<EvidenceRecord> {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const evidenceId = `EVID-${Date.now()}-${seq}`;

    const record: EvidenceRecord = {
      evidenceId,
      evidenceType: dto.evidenceType,
      title: dto.title,
      description: dto.description,
      sourceEntityId: dto.sourceEntityId,
      metadata: dto.metadata ?? {},
      collectedAt: new Date().toISOString(),
    };

    this.evidenceStore.set(evidenceId, record);

    await this.audit.recordDecisionAudit('COLLECT_EVIDENCE', evidenceId, 'SYSTEM', {
      title: dto.title,
      evidenceType: dto.evidenceType,
    });

    await this.eventBus.publish(
      'aura.decision.evidence.collected.v1',
      { evidenceId, title: dto.title, evidenceType: dto.evidenceType },
      this.SYSTEM_TENANT,
      { subject: evidenceId },
    );

    this.logger.log(`[EvidenceManagement] Recorded: ${evidenceId} (${dto.evidenceType})`);
    return record;
  }

  getEvidence(evidenceId: string): EvidenceRecord | undefined {
    return this.evidenceStore.get(evidenceId);
  }

  listEvidences(evidenceType?: EvidenceType): EvidenceRecord[] {
    return Array.from(this.evidenceStore.values()).filter(
      (e) => !evidenceType || e.evidenceType === evidenceType,
    );
  }
}
