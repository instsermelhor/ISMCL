import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface StrategyAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * StrategyAuditService — P168 ESGP
 *
 * Registra imutavelmente (SHA-256) todo evento estratégico:
 * criação de planos, atualização de OKRs, KPIs, riscos e aprovações.
 */
@Injectable()
export class StrategyAuditService {
  private readonly logger = new Logger(StrategyAuditService.name);
  private readonly auditStore: StrategyAuditEntry[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<StrategyAuditEntry> {
    const auditId = `ESGP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: StrategyAuditEntry = {
      auditId, action, subject, performedBy, timestamp, sha256Signature, metadata,
    };
    this.auditStore.push(entry);

    await this.eventBus.publish(
      'aura.strategy.audit.completed.v1',
      { auditId, action, subject, sha256Signature },
      'ESGP',
      { subject: auditId },
    );

    this.logger.log(`[StrategyAudit] ${action} → "${subject}" — ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): StrategyAuditEntry[] {
    return subject
      ? this.auditStore.filter((e) => e.subject === subject)
      : [...this.auditStore];
  }
}
