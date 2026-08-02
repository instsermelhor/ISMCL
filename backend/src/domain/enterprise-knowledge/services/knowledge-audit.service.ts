import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface KnowledgeAuditEntry {
  auditId: string;
  timestamp: string;
  operation: string;
  entityId: string;
  entityType: string;
  performedBy: string;
  details: Record<string, any>;
  sha256Signature: string;
}

/**
 * KnowledgeAuditService — Auditoria Imutável do Conhecimento (P158 AEKIP)
 *
 * Registra e assina criptograficamente (SHA-256) todas as operações sobre o
 * patrimônio de conhecimento: criação, leitura, atualização, aprovação,
 * publicação, arquivamento e descarte.
 */
@Injectable()
export class KnowledgeAuditService {
  private readonly logger = new Logger(KnowledgeAuditService.name);
  private auditTrail: KnowledgeAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(
    operation: string,
    entityId: string,
    entityType: string,
    performedBy: string,
    details: Record<string, any> = {},
  ): Promise<KnowledgeAuditEntry> {
    const timestamp = new Date().toISOString();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const auditId = `KAD-${Date.now()}-${seq}`;

    const payload = JSON.stringify({ auditId, timestamp, operation, entityId, entityType, performedBy, details });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: KnowledgeAuditEntry = {
      auditId, timestamp, operation, entityId, entityType, performedBy, details, sha256Signature,
    };

    this.auditTrail.push(entry);

    await this.eventBus.publish(
      'aura.knowledge.audit.completed.v1',
      { auditId, operation, entityId, entityType, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    return entry;
  }

  getAuditTrail(entityId?: string): KnowledgeAuditEntry[] {
    return entityId ? this.auditTrail.filter((e) => e.entityId === entityId) : [...this.auditTrail];
  }
}
