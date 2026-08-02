import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface ObservabilityAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * ObservabilityAuditService — P173 EORP
 *
 * Registra imutavelmente (SHA-256) todo evento de observabilidade:
 * experimentos de chaos, ações autônomas AIOps, consumo de Error Budget
 * e alterações de parâmetros de telemetria.
 */
@Injectable()
export class ObservabilityAuditService {
  private readonly logger = new Logger(ObservabilityAuditService.name);
  private readonly auditStore: ObservabilityAuditEntry[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<ObservabilityAuditEntry> {
    const auditId = `EORP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: ObservabilityAuditEntry = {
      auditId, action, subject, performedBy, timestamp, sha256Signature, metadata,
    };
    this.auditStore.push(entry);

    await this.eventBus.publish(
      'aura.eorp.audit.completed.v1',
      { auditId, action, subject, sha256Signature },
      'EORP',
      { subject: auditId },
    );

    this.logger.log(`[ObservabilityAudit] ${action} → "${subject}" — ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): ObservabilityAuditEntry[] {
    return subject
      ? this.auditStore.filter((e) => e.subject === subject)
      : [...this.auditStore];
  }

  getAuditCount(): number {
    return this.auditStore.length;
  }
}
