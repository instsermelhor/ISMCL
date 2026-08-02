import { Injectable, Logger } from '@nestjs/common';
import { StewardOverrideDto } from '../dto/enterprise-data.dto';
import { MasterDataManagementService } from './master-data-management.service';
import { DataGovernanceAuditService } from './data-governance-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface StewardActionLog {
  actionId: string;
  recordId: string;
  actionType: 'CORRECTION' | 'MERGE_CONFLICT_RESOLVED' | 'QUALITY_OVERRIDE';
  correctedAttributes: Record<string, any>;
  justification: string;
  stewardName: string;
  timestamp: string;
}

/**
 * DataStewardshipService — P172 EDGP
 *
 * Gestão operacional de dados pelos Data Stewards.
 * Permite a correção manual auditada de inconsistências, resolução de conflitos
 * de deduplicação, aprovações de alterações críticas e rastreabilidade total de overrides.
 */
@Injectable()
export class DataStewardshipService {
  private readonly logger = new Logger(DataStewardshipService.name);
  private readonly stewardLogs: Map<string, StewardActionLog> = new Map();

  constructor(
    private readonly mdmSvc: MasterDataManagementService,
    private readonly auditSvc: DataGovernanceAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async applyStewardOverride(dto: StewardOverrideDto): Promise<StewardActionLog> {
    const actionId = `STEWARD-ACT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    // Atualizar o Golden Record no MDM
    await this.mdmSvc.updateGoldenAttributes(
      dto.recordId,
      dto.correctedAttributes,
      dto.stewardName,
    );

    const log: StewardActionLog = {
      actionId,
      recordId: dto.recordId,
      actionType: 'CORRECTION',
      correctedAttributes: dto.correctedAttributes,
      justification: dto.justification,
      stewardName: dto.stewardName,
      timestamp: now,
    };

    this.stewardLogs.set(actionId, log);

    await this.auditSvc.recordAudit('DATA_STEWARD_ACTION_PERFORMED', actionId, dto.stewardName, {
      recordId: dto.recordId,
      justification: dto.justification,
      attributesChanged: Object.keys(dto.correctedAttributes),
    });

    await this.eventBus.publish(
      'aura.edgp.data.steward.action.performed.v1',
      { actionId, recordId: dto.recordId, stewardName: dto.stewardName, justification: dto.justification },
      'EDGP',
      { subject: actionId },
    );

    this.logger.log(`[DataStewardship] Override manual aplicado em "${dto.recordId}" pelo Steward ${dto.stewardName}`);
    return log;
  }

  getActionLog(actionId: string): StewardActionLog | undefined {
    return this.stewardLogs.get(actionId);
  }

  listActionLogs(recordId?: string): StewardActionLog[] {
    const all = Array.from(this.stewardLogs.values());
    return recordId ? all.filter((l) => l.recordId === recordId) : all;
  }
}
