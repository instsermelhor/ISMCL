import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface ArchitectureAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * ArchitectureAuditService — P171 EAGO
 *
 * Registra imutavelmente (SHA-256) todo evento de governança arquitetural:
 * submissão de propostas, decisões ARB, criação/alteração de ADRs,
 * detecção de architecture drift e atualizações de conformidade.
 */
@Injectable()
export class ArchitectureAuditService {
  private readonly logger = new Logger(ArchitectureAuditService.name);
  private readonly auditStore: ArchitectureAuditEntry[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<ArchitectureAuditEntry> {
    const auditId = `EAGO-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: ArchitectureAuditEntry = {
      auditId, action, subject, performedBy, timestamp, sha256Signature, metadata,
    };
    this.auditStore.push(entry);

    await this.eventBus.publish(
      'aura.eago.audit.completed.v1',
      { auditId, action, subject, sha256Signature },
      'EAGO',
      { subject: auditId },
    );

    this.logger.log(`[ArchitectureAudit] ${action} → "${subject}" — ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): ArchitectureAuditEntry[] {
    return subject
      ? this.auditStore.filter((e) => e.subject === subject)
      : [...this.auditStore];
  }

  getAuditCount(): number {
    return this.auditStore.length;
  }
}
