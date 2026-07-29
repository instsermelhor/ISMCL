import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface CognitiveAuditEntry {
  auditId: string;
  timestamp: string;
  eventType: string;
  taskId?: string;
  agentId?: string;
  action: string;
  details: Record<string, any>;
  sha256Signature: string;
  humanSupervisorId?: string;
}

@Injectable()
export class CognitiveAuditService {
  private readonly logger = new Logger(CognitiveAuditService.name);
  private auditTrail: CognitiveAuditEntry[] = [];

  logAudit(
    eventType: string,
    action: string,
    details: Record<string, any>,
    taskId?: string,
    agentId?: string,
    humanSupervisorId?: string,
  ): CognitiveAuditEntry {
    const timestamp = new Date().toISOString();
    const auditId = `AUD-COG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const payload = JSON.stringify({ auditId, timestamp, eventType, taskId, agentId, action, details, humanSupervisorId });
    const sha256Signature = crypto.createHash('sha256').update(payload).digest('hex');

    const entry: CognitiveAuditEntry = {
      auditId,
      timestamp,
      eventType,
      taskId,
      agentId,
      action,
      details,
      sha256Signature,
      humanSupervisorId,
    };

    this.auditTrail.push(entry);
    this.logger.log(`[CognitiveAudit] ${eventType} - ${action} (Signature: ${sha256Signature.substring(0, 12)}...)`);
    return entry;
  }

  getAuditTrail(taskId?: string): CognitiveAuditEntry[] {
    if (taskId) {
      return this.auditTrail.filter((a) => a.taskId === taskId);
    }
    return [...this.auditTrail];
  }
}
