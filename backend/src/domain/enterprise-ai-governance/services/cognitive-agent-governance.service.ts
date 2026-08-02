import { Injectable, Logger } from '@nestjs/common';
import { AIAuditService } from './ai-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface CognitiveAgentGovernanceRecord {
  recordId: string;
  agentId: string;
  agentName: string;
  modelUsed: string;
  governanceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNDER_REVIEW';
  permissionsGranted: string[];
  memoryEnabled: boolean;
  lastAuditDate: string;
  evaluatedAt: string;
}

@Injectable()
export class CognitiveAgentGovernanceService {
  private readonly logger = new Logger(CognitiveAgentGovernanceService.name);
  private readonly records: Map<string, CognitiveAgentGovernanceRecord> = new Map();

  constructor(
    private readonly auditSvc: AIAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async evaluateAgentCompliance(
    agentId: string, agentName: string, modelUsed: string,
    permissionsGranted: string[], memoryEnabled: boolean, evaluatedBy: string,
  ): Promise<CognitiveAgentGovernanceRecord> {
    const recordId = `COGAGENT-GOV-${agentId}-${Date.now().toString(36).toUpperCase()}`;
    const governanceStatus = permissionsGranted.length <= 5 && !memoryEnabled ? 'COMPLIANT' : 'UNDER_REVIEW';

    const record: CognitiveAgentGovernanceRecord = {
      recordId, agentId, agentName, modelUsed, governanceStatus,
      permissionsGranted, memoryEnabled, lastAuditDate: new Date().toISOString(),
      evaluatedAt: new Date().toISOString(),
    };

    this.records.set(recordId, record);
    await this.auditSvc.recordAudit('COGNITIVE_AGENT_GOVERNED', recordId, evaluatedBy, { agentId, governanceStatus, permissionsCount: permissionsGranted.length });
    await this.eventBus.publish('aura.eaigp.agent.governed.v1', { recordId, agentId, governanceStatus }, 'EAIGP', { subject: recordId });
    this.logger.log(`[CognitiveAgentGov] Agente "${agentName}" (${agentId}) avaliado: ${governanceStatus}`);
    return record;
  }

  getRecord(recordId: string): CognitiveAgentGovernanceRecord | undefined { return this.records.get(recordId); }
  listRecords(): CognitiveAgentGovernanceRecord[] { return Array.from(this.records.values()); }
}
