import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { RecordEvolutionAuditDto } from '../dto/autonomous-evolution.dto';

export interface EvolutionAuditEntry {
  auditId: string;
  logId: string;
  timestamp: string;
  componentName: string;
  actionName: string;
  details: Record<string, any>;
  sha256Signature: string;
  humanSupervisorId?: string;
}

/**
 * ContinuousEvolutionAuditService — Trilhas Imutáveis de Auditoria da Evolução (P153 AAEE)
 *
 * Registra e assina criptograficamente (SHA-256) toda decisão, recomendação,
 * otimização e evento de governança gerado pelo Motor de Evolução Autônoma.
 */
@Injectable()
export class ContinuousEvolutionAuditService {
  private readonly logger = new Logger(ContinuousEvolutionAuditService.name);
  private auditTrail: EvolutionAuditEntry[] = [];

  async recordEvolutionAudit(dto: RecordEvolutionAuditDto): Promise<EvolutionAuditEntry> {
    const timestamp = new Date().toISOString();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const year = new Date().getFullYear();
    const auditId = `AUD-EVO-${Date.now()}-${seq}`;
    const logId = `EVO-AUD-${year}-${seq}`;

    const payload = JSON.stringify({
      logId,
      timestamp,
      componentName: dto.componentName,
      actionName: dto.actionName,
      details: dto.details,
      humanSupervisorId: dto.humanSupervisorId,
    });

    const sha256Signature = crypto.createHash('sha256').update(payload).digest('hex');

    const entry: EvolutionAuditEntry = {
      auditId,
      logId,
      timestamp,
      componentName: dto.componentName,
      actionName: dto.actionName,
      details: dto.details,
      sha256Signature,
      humanSupervisorId: dto.humanSupervisorId,
    };

    this.auditTrail.push(entry);
    this.logger.log(`[EvolutionAudit] ${dto.componentName}::${dto.actionName} (sig: ${sha256Signature.substring(0, 12)}...)`);
    return entry;
  }

  getEvolutionAuditTrail(componentName?: string): EvolutionAuditEntry[] {
    if (componentName) {
      return this.auditTrail.filter((a) => a.componentName === componentName);
    }
    return [...this.auditTrail];
  }
}
