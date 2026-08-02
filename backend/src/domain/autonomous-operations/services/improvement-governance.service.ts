import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface ImprovementAuditEntry {
  auditId: string;
  action: string;
  subject: string;
  performedBy: string;
  timestamp: string;
  sha256Signature: string;
  metadata: Record<string, any>;
}

/**
 * ImprovementGovernanceService — Governança de Melhorias e Auditoria (P164 AOCP)
 *
 * Registra imutavelmente (SHA-256) toda proposta, recomendação, aprovação,
 * rejeição, delegação de tarefa e aprendizado operacional.
 * Nenhuma recomendação implementada pode perder rastreabilidade.
 */
@Injectable()
export class ImprovementGovernanceService {
  private readonly logger = new Logger(ImprovementGovernanceService.name);
  private auditTrail: ImprovementAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    action: string,
    subject: string,
    performedBy: string,
    metadata: Record<string, any> = {},
  ): Promise<ImprovementAuditEntry> {
    const auditId = `AOCP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ auditId, action, subject, performedBy, timestamp, metadata });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: ImprovementAuditEntry = {
      auditId, action, subject, performedBy, timestamp, sha256Signature, metadata,
    };
    this.auditTrail.push(entry);

    await this.eventBus.publish(
      'aura.operations.audit.completed.v1',
      { auditId, action, subject, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    this.logger.log(`[ImprovementGovernance] ${action} on "${subject}" by ${performedBy} → ${auditId}`);
    return entry;
  }

  getAuditTrail(subject?: string): ImprovementAuditEntry[] {
    return subject
      ? this.auditTrail.filter((e) => e.subject === subject)
      : [...this.auditTrail];
  }
}
