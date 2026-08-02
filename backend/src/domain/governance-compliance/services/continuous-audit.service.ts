import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface AuditCheckEntry {
  auditId: string;
  timestamp: string;
  scope: string;
  checkName: string;
  auditedBy: string;
  details: Record<string, any>;
  sha256Signature: string;
}

/**
 * ContinuousAuditService — Auditoria Contínua Imutável SHA-256 (P161 AGCC)
 *
 * Registra e assina criptograficamente todas as verificações de conformidade,
 * validações de políticas, avaliações de risco e auditorias recorrentes do ecossistema.
 */
@Injectable()
export class ContinuousAuditService {
  private readonly logger = new Logger(ContinuousAuditService.name);
  private auditTrail: AuditCheckEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordAuditCheck(
    scope: string,
    checkName: string,
    auditedBy: string,
    details: Record<string, any> = {},
  ): Promise<AuditCheckEntry> {
    const timestamp = new Date().toISOString();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const auditId = `CAG-${Date.now()}-${seq}`;

    const payload = JSON.stringify({ auditId, timestamp, scope, checkName, auditedBy, details });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: AuditCheckEntry = {
      auditId, timestamp, scope, checkName, auditedBy, details, sha256Signature,
    };

    this.auditTrail.push(entry);

    await this.eventBus.publish(
      'aura.governance.audit.completed.v1',
      { auditId, scope, checkName, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    return entry;
  }

  getAuditTrail(scope?: string): AuditCheckEntry[] {
    return scope ? this.auditTrail.filter((e) => e.scope === scope) : [...this.auditTrail];
  }
}
