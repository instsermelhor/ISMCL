import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface DataGovernanceAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * DataGovernanceAuditService — P172 EDGP
 *
 * Registra imutavelmente (SHA-256) todo evento de governança de dados:
 * resolução de MDM, sincronização Data Fabric, contratos de dados,
 * ações de Data Stewards e métricas de qualidade.
 */
@Injectable()
export class DataGovernanceAuditService {
  private readonly logger = new Logger(DataGovernanceAuditService.name);
  private readonly auditStore: DataGovernanceAuditEntry[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<DataGovernanceAuditEntry> {
    const auditId = `EDGP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: DataGovernanceAuditEntry = {
      auditId, action, subject, performedBy, timestamp, sha256Signature, metadata,
    };
    this.auditStore.push(entry);

    await this.eventBus.publish(
      'aura.edgp.audit.completed.v1',
      { auditId, action, subject, sha256Signature },
      'EDGP',
      { subject: auditId },
    );

    this.logger.log(`[DataGovernanceAudit] ${action} → "${subject}" — ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): DataGovernanceAuditEntry[] {
    return subject
      ? this.auditStore.filter((e) => e.subject === subject)
      : [...this.auditStore];
  }

  getAuditCount(): number {
    return this.auditStore.length;
  }
}
