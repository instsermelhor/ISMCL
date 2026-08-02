import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface TwinAuditEntry {
  auditId: string;
  timestamp: string;
  componentName: string;
  actionName: string;
  details: Record<string, any>;
  sha256Signature: string;
  version: number;
}

/**
 * DigitalTwinGovernanceService — Governança do Digital Twin (P157 ADT)
 *
 * Controla modelos, premissas, parâmetros, versões, validações, aprovações,
 * histórico de simulações e auditoria imutável SHA-256 de todas as execuções.
 */
@Injectable()
export class DigitalTwinGovernanceService {
  private readonly logger = new Logger(DigitalTwinGovernanceService.name);
  private auditTrail: TwinAuditEntry[] = [];
  private modelVersion = 1;
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordTwinAudit(
    componentName: string,
    actionName: string,
    details: Record<string, any>,
  ): Promise<TwinAuditEntry> {
    const timestamp = new Date().toISOString();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const auditId = `DT-AUD-${Date.now()}-${seq}`;

    const payload = JSON.stringify({ auditId, timestamp, componentName, actionName, details });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: TwinAuditEntry = {
      auditId,
      timestamp,
      componentName,
      actionName,
      details,
      sha256Signature,
      version: this.modelVersion,
    };

    this.auditTrail.push(entry);

    await this.eventBus.publish(
      'aura.digitaltwin.audit.completed.v1',
      { auditId, componentName, actionName, sha256Signature, version: this.modelVersion },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    return entry;
  }

  bumpModelVersion(): number {
    return ++this.modelVersion;
  }

  getCurrentModelVersion(): number {
    return this.modelVersion;
  }

  getAuditTrail(componentName?: string): TwinAuditEntry[] {
    return componentName
      ? this.auditTrail.filter((a) => a.componentName === componentName)
      : [...this.auditTrail];
  }
}
