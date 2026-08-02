import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface FederationAuditEntry {
  auditId: string;
  action: string;
  tenantId: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * FederationAuditService — Auditoria de Federação e Tenants (P167 FMIP)
 *
 * Registra imutavelmente (SHA-256) todo evento de provisionamento, federação,
 * alteração White Label, licenciamento e isolamento de tenants.
 */
@Injectable()
export class FederationAuditService {
  private readonly logger = new Logger(FederationAuditService.name);
  private auditStore: FederationAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    tenantId: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<FederationAuditEntry> {
    const auditId = `FMIP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, tenantId, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: FederationAuditEntry = {
      auditId, action, tenantId, performedBy, timestamp, sha256Signature, metadata,
    };
    this.auditStore.push(entry);

    await this.eventBus.publish(
      'aura.tenant.audit.completed.v1',
      { auditId, action, tenantId, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    this.logger.log(`[FederationAudit] ${action} on tenant "${tenantId}" → ${auditId}`);
    return entry;
  }

  getAuditTrail(tenantId?: string): FederationAuditEntry[] {
    return tenantId
      ? this.auditStore.filter((e) => e.tenantId === tenantId)
      : [...this.auditStore];
  }
}
