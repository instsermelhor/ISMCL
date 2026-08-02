import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface IntegrationAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

@Injectable()
export class IntegrationAuditService {
  private readonly logger = new Logger(IntegrationAuditService.name);
  private readonly auditStore: IntegrationAuditEntry[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<IntegrationAuditEntry> {
    const auditId = `EIEMP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');
    const entry: IntegrationAuditEntry = { auditId, action, subject, performedBy, timestamp, sha256Signature, metadata };
    this.auditStore.push(entry);
    await this.eventBus.publish('aura.eiemp.audit.completed.v1', { auditId, action, subject, sha256Signature }, 'EIEMP', { subject: auditId });
    this.logger.log(`[IntegrationAudit] ${action} -> "${subject}" — ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): IntegrationAuditEntry[] {
    return subject ? this.auditStore.filter((e) => e.subject === subject) : [...this.auditStore];
  }

  getAuditCount(): number { return this.auditStore.length; }
}
