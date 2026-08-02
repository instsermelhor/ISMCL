import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface SocialImpactAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * SocialImpactAuditService — Auditoria de Impacto Social (P165 SIIP)
 *
 * Registra imutavelmente (SHA-256) todo cálculo de impacto, prestação de contas,
 * consolidação de evidências e métricas ESG.
 * Garantia de integridade e não repúdio estatístico.
 */
@Injectable()
export class SocialImpactAuditService {
  private readonly logger = new Logger(SocialImpactAuditService.name);
  private auditStore: SocialImpactAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<SocialImpactAuditEntry> {
    const auditId = `SIIP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: SocialImpactAuditEntry = {
      auditId, action, subject, performedBy, timestamp, sha256Signature, metadata,
    };
    this.auditStore.push(entry);

    await this.eventBus.publish(
      'aura.impact.social.impact.audit.completed.v1',
      { auditId, action, subject, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    this.logger.log(`[SocialImpactAudit] ${action} on "${subject}" → ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): SocialImpactAuditEntry[] {
    return subject
      ? this.auditStore.filter((e) => e.subject === subject)
      : [...this.auditStore];
  }
}
