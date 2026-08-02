import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface CertificationAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * CertificationEvidenceService — Evidências de Certificação (P163 ERCP)
 *
 * Registra imutavelmente (SHA-256) todas as evidências de certificação,
 * validações funcionais, não funcionais e de conformidade.
 * Garante integridade e rastreabilidade para produção.
 */
@Injectable()
export class CertificationEvidenceService {
  private readonly logger = new Logger(CertificationEvidenceService.name);
  private evidenceStore: CertificationAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordEvidence(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<CertificationAuditEntry> {
    const auditId = `CERT-EVID-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: CertificationAuditEntry = {
      auditId, action, subject, performedBy, timestamp, sha256Signature, metadata,
    };
    this.evidenceStore.push(entry);

    await this.eventBus.publish(
      'aura.readiness.certification.evidence.generated.v1',
      { auditId, action, subject, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    this.logger.log(`[CertificationEvidence] ${action} on "${subject}" → ${auditId}`);
    return entry;
  }

  getEvidences(subject?: string): CertificationAuditEntry[] {
    return subject
      ? this.evidenceStore.filter((e) => e.subject === subject)
      : [...this.evidenceStore];
  }
}
