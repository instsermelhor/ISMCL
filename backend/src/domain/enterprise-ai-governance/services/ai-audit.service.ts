import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface AIAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

@Injectable()
export class AIAuditService {
  private readonly logger = new Logger(AIAuditService.name);
  private readonly auditStore: AIAuditEntry[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<AIAuditEntry> {
    const auditId = `EAIGP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: AIAuditEntry = { auditId, action, subject, performedBy, timestamp, sha256Signature, metadata };
    this.auditStore.push(entry);

    await this.eventBus.publish('aura.eaigp.audit.completed.v1', { auditId, action, subject, sha256Signature }, 'EAIGP', { subject: auditId });
    this.logger.log(`[AIAudit] ${action} → "${subject}" — ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): AIAuditEntry[] {
    return subject ? this.auditStore.filter((e) => e.subject === subject) : [...this.auditStore];
  }

  getAuditCount(): number { return this.auditStore.length; }
}
