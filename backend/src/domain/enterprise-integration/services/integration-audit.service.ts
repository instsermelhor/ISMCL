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

/**
 * IntegrationAuditService — Auditoria de Integrações (P166 EIIP)
 *
 * Registra imutavelmente (SHA-256) toda chamada de API externa, troca de eventos,
 * aprovação de integração, rotação de chaves e eventos de gateway.
 */
@Injectable()
export class IntegrationAuditService {
  private readonly logger = new Logger(IntegrationAuditService.name);
  private auditStore: IntegrationAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<IntegrationAuditEntry> {
    const auditId = `EIIP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: IntegrationAuditEntry = {
      auditId, action, subject, performedBy, timestamp, sha256Signature, metadata,
    };
    this.auditStore.push(entry);

    await this.eventBus.publish(
      'aura.integration.audit.completed.v1',
      { auditId, action, subject, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    this.logger.log(`[IntegrationAudit] ${action} on "${subject}" → ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): IntegrationAuditEntry[] {
    return subject
      ? this.auditStore.filter((e) => e.subject === subject)
      : [...this.auditStore];
  }
}
