import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { RecordExternalAuditDto } from '../dto/enterprise-interoperability.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface ExternalAuditEntry {
  auditId: string;
  logId: string;
  timestamp: string;
  serviceName: string;
  actionName: string;
  partnerCode: string;
  details: Record<string, any>;
  sha256Signature: string;
  supervisorId?: string;
}

/**
 * ExternalAuditService — Trilhas Imutáveis de Auditoria Externa (P155 AEIDIP)
 *
 * Registra e assina criptograficamente (SHA-256) toda troca externa de dados,
 * alteração de consentimento, transação de API Gateway e ação de governança.
 */
@Injectable()
export class ExternalAuditService {
  private readonly logger = new Logger(ExternalAuditService.name);
  private auditTrail: ExternalAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordAudit(dto: RecordExternalAuditDto): Promise<ExternalAuditEntry> {
    const timestamp = new Date().toISOString();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const year = new Date().getFullYear();
    const auditId = `AUD-EXT-${Date.now()}-${seq}`;
    const logId = `EXT-AUD-${year}-${seq}`;

    const payload = JSON.stringify({
      logId,
      timestamp,
      serviceName: dto.serviceName,
      actionName: dto.actionName,
      partnerCode: dto.partnerCode,
      details: dto.details,
      supervisorId: dto.supervisorId,
    });

    const sha256Signature = crypto.createHash('sha256').update(payload).digest('hex');

    const entry: ExternalAuditEntry = {
      auditId,
      logId,
      timestamp,
      serviceName: dto.serviceName,
      actionName: dto.actionName,
      partnerCode: dto.partnerCode,
      details: dto.details,
      sha256Signature,
      supervisorId: dto.supervisorId,
    };

    this.auditTrail.push(entry);

    await this.eventBus.publish(
      'aura.interoperability.audit.completed.v1',
      { auditId, logId, serviceName: dto.serviceName, partnerCode: dto.partnerCode, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    this.logger.log(`[ExternalAudit] ${dto.serviceName}::${dto.actionName} for ${dto.partnerCode} (sig: ${sha256Signature.substring(0, 12)}...)`);
    return entry;
  }

  getAuditTrail(partnerCode?: string): ExternalAuditEntry[] {
    if (partnerCode) {
      return this.auditTrail.filter((a) => a.partnerCode === partnerCode);
    }
    return [...this.auditTrail];
  }
}
