import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface LifecycleAuditEntry {
  auditId: string;
  action: string;
  component: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * LifecycleAuditService — Auditoria do Ciclo de Vida (P162 EPLM)
 *
 * Registra imutavelmente (SHA-256) toda alteração arquitetural, release,
 * deprecação, atualização de dependência e decisão de modernização.
 */
@Injectable()
export class LifecycleAuditService {
  private readonly logger = new Logger(LifecycleAuditService.name);
  private trail: LifecycleAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async record(
    action: string,
    component: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<LifecycleAuditEntry> {
    const auditId = `EPLM-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, component, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: LifecycleAuditEntry = { auditId, action, component, performedBy, timestamp, sha256Signature, metadata };
    this.trail.push(entry);

    await this.eventBus.publish(
      'aura.lifecycle.audit.completed.v1',
      { auditId, action, component, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    this.logger.log(`[LifecycleAudit] ${action} on ${component} by ${performedBy} → ${auditId}`);
    return entry;
  }

  getTrail(component?: string): LifecycleAuditEntry[] {
    return component ? this.trail.filter((e) => e.component === component) : [...this.trail];
  }
}
