import { Injectable, Logger } from '@nestjs/common';
import { ComplianceFramework, RecordComplianceEvidenceDto } from '../dto/governance-compliance.dto';
import { ContinuousAuditService } from './continuous-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ComplianceEvidenceRecord {
  evidenceId: string;
  framework: ComplianceFramework;
  title: string;
  description: string;
  metadata: Record<string, any>;
  registeredAt: string;
}

/**
 * ComplianceEvidenceService — Gestão e Preservação de Evidências (P161 AGCC)
 *
 * Coleta, valida e preserva evidências de conformidade regulatória (LGPD, Zero Trust,
 * Privacy by Design, Security by Design, políticas internas e segregação de papéis).
 */
@Injectable()
export class ComplianceEvidenceService {
  private readonly logger = new Logger(ComplianceEvidenceService.name);
  private evidenceStore: Map<string, ComplianceEvidenceRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: ContinuousAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedEvidences();
  }

  private seedEvidences(): void {
    const seeds: RecordComplianceEvidenceDto[] = [
      {
        framework: ComplianceFramework.LGPD,
        title: 'Relatório de Minimização de Dados de Beneficiários',
        description: 'Certifica que dados sensíveis de beneficiários transitam apenas de forma pseudonimizada',
        metadata: { dpoVerified: true, verifiedAt: new Date().toISOString() },
      },
      {
        framework: ComplianceFramework.ZERO_TRUST,
        title: 'Certificado de Criptografia TLS 1.3 & mTLS',
        description: 'Evidência de comunicação cifrada em 100% dos microsserviços',
        metadata: { cisoVerified: true, cipherSuites: ['TLS_AES_256_GCM_SHA384'] },
      },
    ];

    for (const dto of seeds) {
      const id = `EVID-COMP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.evidenceStore.set(id, {
        evidenceId: id,
        ...dto,
        metadata: dto.metadata ?? {},
        registeredAt: new Date().toISOString(),
      });
    }
  }

  async recordEvidence(dto: RecordComplianceEvidenceDto): Promise<ComplianceEvidenceRecord> {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const evidenceId = `EVID-COMP-${Date.now()}-${seq}`;

    const record: ComplianceEvidenceRecord = {
      evidenceId,
      framework: dto.framework,
      title: dto.title,
      description: dto.description,
      metadata: dto.metadata ?? {},
      registeredAt: new Date().toISOString(),
    };

    this.evidenceStore.set(evidenceId, record);

    await this.audit.recordAuditCheck('RECORD_EVIDENCE', evidenceId, 'CCO', {
      title: dto.title, framework: dto.framework,
    });

    await this.eventBus.publish(
      'aura.governance.evidence.registered.v1',
      { evidenceId, title: dto.title, framework: dto.framework },
      this.SYSTEM_TENANT,
      { subject: evidenceId },
    );

    this.logger.log(`[ComplianceEvidence] Recorded: ${evidenceId} (${dto.framework})`);
    return record;
  }

  listEvidences(framework?: ComplianceFramework): ComplianceEvidenceRecord[] {
    return Array.from(this.evidenceStore.values()).filter(
      (e) => !framework || e.framework === framework,
    );
  }
}
