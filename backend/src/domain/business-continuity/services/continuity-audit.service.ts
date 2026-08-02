import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface ContinuityAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * ContinuityAuditService — P169 BCORP
 *
 * Registra imutavelmente (SHA-256) todos os eventos de continuidade,
 * crises, incidentes e recuperação. Toda ação crítica deve ser auditada.
 */
@Injectable()
export class ContinuityAuditService {
  private readonly logger = new Logger(ContinuityAuditService.name);
  private readonly auditStore: ContinuityAuditEntry[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<ContinuityAuditEntry> {
    const auditId = `BCORP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: ContinuityAuditEntry = {
      auditId, action, subject, performedBy, timestamp, sha256Signature, metadata,
    };
    this.auditStore.push(entry);

    await this.eventBus.publish(
      'aura.bcorp.audit.completed.v1',
      { auditId, action, subject, sha256Signature },
      'BCORP',
      { subject: auditId },
    );

    this.logger.log(`[ContinuityAudit] ${action} → "${subject}" — ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): ContinuityAuditEntry[] {
    return subject
      ? this.auditStore.filter((e) => e.subject === subject || e.metadata?.incidentId === subject)
      : [...this.auditStore];
  }

  getAuditCount(): number {
    return this.auditStore.length;
  }
}
