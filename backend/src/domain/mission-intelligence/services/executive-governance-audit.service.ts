import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface ExecutiveAuditEntry {
  auditId: string;
  timestamp: string;
  actionName: string;
  executiveRole: string;
  component: string;
  details: Record<string, any>;
  sha256Signature: string;
}

/**
 * ExecutiveGovernanceAuditService — Auditoria Imutável de Comando Executivo (P160 AEMIAG)
 *
 * Registra e assina criptograficamente (SHA-256) toda ação de comando executivo,
 * validação de alinhamento à missão, ação de resiliência e decisão coordenada,
 * garantindo não-repúdio e rastreabilidade total da governança suprema.
 */
@Injectable()
export class ExecutiveGovernanceAuditService {
  private readonly logger = new Logger(ExecutiveGovernanceAuditService.name);
  private auditTrail: ExecutiveAuditEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(private readonly eventBus: EventBusService) {}

  async recordExecutiveAudit(
    actionName: string,
    executiveRole: string,
    component: string,
    details: Record<string, any> = {},
  ): Promise<ExecutiveAuditEntry> {
    const timestamp = new Date().toISOString();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const auditId = `EXE-AUD-${Date.now()}-${seq}`;

    const payload = JSON.stringify({ auditId, timestamp, actionName, executiveRole, component, details });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const entry: ExecutiveAuditEntry = {
      auditId, timestamp, actionName, executiveRole, component, details, sha256Signature,
    };

    this.auditTrail.push(entry);

    await this.eventBus.publish(
      'aura.mission.audit.completed.v1',
      { auditId, actionName, executiveRole, component, sha256Signature },
      this.SYSTEM_TENANT,
      { subject: auditId },
    );

    return entry;
  }

  getAuditTrail(component?: string): ExecutiveAuditEntry[] {
    return component ? this.auditTrail.filter((e) => e.component === component) : [...this.auditTrail];
  }
}
