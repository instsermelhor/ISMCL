import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface AutomationAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * AutomationAuditService — P174 EHCOP
 *
 * Registra imutavelmente (SHA-256) todos os eventos da plataforma de
 * Hyperautomation: criação de automações, execuções RPA, ativações de agentes,
 * decisões automatizadas, aprovações humanas e alterações de governança.
 */
@Injectable()
export class AutomationAuditService {
  private readonly logger = new Logger(AutomationAuditService.name);
  private readonly auditStore: AutomationAuditEntry[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<AutomationAuditEntry> {
    const auditId = `EHCOP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: AutomationAuditEntry = {
      auditId, action, subject, performedBy, timestamp, sha256Signature, metadata,
    };
    this.auditStore.push(entry);

    await this.eventBus.publish(
      'aura.ehcop.audit.completed.v1',
      { auditId, action, subject, sha256Signature },
      'EHCOP',
      { subject: auditId },
    );

    this.logger.log(`[AutomationAudit] ${action} → "${subject}" — ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): AutomationAuditEntry[] {
    return subject
      ? this.auditStore.filter((e) => e.subject === subject)
      : [...this.auditStore];
  }

  getAuditCount(): number {
    return this.auditStore.length;
  }
}
