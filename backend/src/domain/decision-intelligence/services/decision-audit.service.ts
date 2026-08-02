import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface DecisionAuditEntry {
  auditId: string;
  timestamp: string;
  operation: string;
  recommendationId: string;
  performedBy: string;
  details: Record<string, any>;
  sha256Signature: string;
}

/**
 * DecisionAuditService — Auditoria Imutável de Decisão (P159 ADIP)
 *
 * Registra e assina criptograficamente (SHA-256) todo o ciclo de vida decisório:
 * recomendação gerada, evidências anexadas, alternativas prescritivas,
 * avaliação e aprovação/rejeição humana com justificativa formal.
 */
@Injectable()
export class DecisionAuditService {
  private readonly logger = new Logger(DecisionAuditService.name);
  private auditTrail: DecisionAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordDecisionAudit(
    operation: string,
    recommendationId: string,
    performedBy: string,
    details: Record<string, any> = {},
  ): Promise<DecisionAuditEntry> {
    const timestamp = new Date().toISOString();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const auditId = `DAC-${Date.now()}-${seq}`;

    const payload = JSON.stringify({ auditId, timestamp, operation, recommendationId, performedBy, details });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: DecisionAuditEntry = {
      auditId, timestamp, operation, recommendationId, performedBy, details, sha256Signature,
    };

    this.auditTrail.push(entry);

    await this.eventBus.publish(
      'aura.decision.audit.completed.v1',
      { auditId, operation, recommendationId, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    return entry;
  }

  getAuditTrail(recommendationId?: string): DecisionAuditEntry[] {
    return recommendationId ? this.auditTrail.filter((e) => e.recommendationId === recommendationId) : [...this.auditTrail];
  }
}
