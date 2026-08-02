import { Injectable, Logger } from '@nestjs/common';
import { PreservationPolicyType } from '../dto/enterprise-knowledge.dto';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface PreservationRecord {
  preservationId: string;
  documentId: string;
  policyType: PreservationPolicyType;
  custodyChain: Array<{ action: string; agent: string; timestamp: string; note: string }>;
  currentHash: string;
  originalHash: string;
  retentionUntil?: string;
  isArchived: boolean;
  isDestroyed: boolean;
  registeredAt: string;
}

/**
 * DigitalPreservationService — P170 EKG
 *
 * Política corporativa de preservação digital de longo prazo.
 * Garante a autenticidade (hash SHA-256), cadeia de custódia, integridade,
 * regras de retenção legal/histórica, arquivamento seguro e descarte governado.
 */
@Injectable()
export class DigitalPreservationService {
  private readonly logger = new Logger(DigitalPreservationService.name);
  private readonly preservationStore: Map<string, PreservationRecord> = new Map();

  constructor(
    private readonly auditSvc: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async applyPolicy(
    documentId: string,
    policyType: PreservationPolicyType,
    initialHash: string,
    appliedBy = 'SYSTEM',
  ): Promise<PreservationRecord> {
    const preservationId = `PRESERV-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const retentionUntil = this.calculateRetentionDate(policyType);

    const record: PreservationRecord = {
      preservationId,
      documentId,
      policyType,
      custodyChain: [{
        action: 'POLICY_APPLIED',
        agent: appliedBy,
        timestamp: now,
        note: `Política ${policyType} aplicada`,
      }],
      currentHash: initialHash,
      originalHash: initialHash,
      retentionUntil,
      isArchived: false,
      isDestroyed: false,
      registeredAt: now,
    };

    this.preservationStore.set(preservationId, record);

    await this.auditSvc.recordAudit('PRESERVATION_POLICY_APPLIED', preservationId, appliedBy, {
      documentId,
      policyType,
      retentionUntil,
      initialHash,
    });

    await this.eventBus.publish(
      'aura.ekg.preservation.policy.applied.v1',
      { preservationId, documentId, policyType, retentionUntil },
      'EKG',
      { subject: preservationId },
    );

    this.logger.log(`[DigitalPreservation] Política "${policyType}" aplicada ao documento "${documentId}".`);
    return record;
  }

  async verifyIntegrity(preservationId: string, currentHash: string, verifiedBy: string): Promise<boolean> {
    const record = this.getOrThrow(preservationId);
    const isValid = record.originalHash === currentHash;

    record.custodyChain.push({
      action: isValid ? 'INTEGRITY_VERIFIED_PASS' : 'INTEGRITY_VERIFIED_FAIL',
      agent: verifiedBy,
      timestamp: new Date().toISOString(),
      note: isValid ? 'Hash confere com o original.' : 'ALERTA: Hash divergiu!',
    });

    await this.auditSvc.recordAudit('PRESERVATION_INTEGRITY_VERIFIED', preservationId, verifiedBy, { isValid });

    if (!isValid) {
      this.logger.error(`[DigitalPreservation] ⚠️ CORRUPÇÃO OU ALTERAÇÃO NÃO AUTORIZADA em "${preservationId}"!`);
    } else {
      this.logger.log(`[DigitalPreservation] ✅ Integridade confirmada para "${preservationId}".`);
    }

    return isValid;
  }

  async archiveDocument(preservationId: string, archivedBy: string): Promise<PreservationRecord> {
    const record = this.getOrThrow(preservationId);
    record.isArchived = true;
    record.custodyChain.push({
      action: 'DOCUMENT_ARCHIVED',
      agent: archivedBy,
      timestamp: new Date().toISOString(),
      note: 'Documento movido para armazenamento frio de longo prazo.',
    });

    await this.auditSvc.recordAudit('KNOWLEDGE_ARCHIVED', preservationId, archivedBy, { documentId: record.documentId });
    await this.eventBus.publish('aura.ekg.knowledge.archived.v1', { preservationId, documentId: record.documentId }, 'EKG', { subject: preservationId });

    this.logger.log(`[DigitalPreservation] Documento da preservação "${preservationId}" arquivado.`);
    return record;
  }

  getRecord(preservationId: string): PreservationRecord | undefined {
    return this.preservationStore.get(preservationId);
  }

  listPreservations(): PreservationRecord[] {
    return Array.from(this.preservationStore.values());
  }

  private calculateRetentionDate(policy: PreservationPolicyType): string | undefined {
    const now = new Date();
    switch (policy) {
      case PreservationPolicyType.PERMANENT_HISTORICAL: return undefined; // Nunca vence
      case PreservationPolicyType.LEGAL_RETENTION_10Y:
        now.setFullYear(now.getFullYear() + 10);
        return now.toISOString();
      case PreservationPolicyType.LEGAL_RETENTION_5Y:
        now.setFullYear(now.getFullYear() + 5);
        return now.toISOString();
      case PreservationPolicyType.OPERATIONAL_3Y:
        now.setFullYear(now.getFullYear() + 3);
        return now.toISOString();
      case PreservationPolicyType.TEMPORARY_1Y:
        now.setFullYear(now.getFullYear() + 1);
        return now.toISOString();
    }
  }

  private getOrThrow(preservationId: string): PreservationRecord {
    const p = this.preservationStore.get(preservationId);
    if (!p) throw new Error(`Preservação "${preservationId}" não encontrada.`);
    return p;
  }
}
