import { Injectable, Logger } from '@nestjs/common';
import { AIAuditService } from './ai-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AIGovernancePolicy {
  policyId: string;
  assetId: string;
  policyName: string;
  requiresHumanReview: boolean;
  maxAutonomyLevel: 'FULL_AUTO' | 'SUPERVISED' | 'HUMAN_REQUIRED';
  dataAccessScope: string[];
  retentionDays: number;
  approvedBy: string;
  status: 'ACTIVE' | 'PENDING' | 'REVOKED';
  approvedAt: string;
}

@Injectable()
export class AIGovernanceService {
  private readonly logger = new Logger(AIGovernanceService.name);
  private readonly policies: Map<string, AIGovernancePolicy> = new Map();

  constructor(
    private readonly auditSvc: AIAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async createPolicy(
    assetId: string, policyName: string, requiresHumanReview: boolean,
    maxAutonomyLevel: AIGovernancePolicy['maxAutonomyLevel'],
    dataAccessScope: string[], retentionDays: number, approvedBy: string,
  ): Promise<AIGovernancePolicy> {
    const policyId = `AIGOV-${assetId}-${Date.now().toString(36).toUpperCase()}`;
    const policy: AIGovernancePolicy = {
      policyId, assetId, policyName, requiresHumanReview, maxAutonomyLevel,
      dataAccessScope, retentionDays, approvedBy, status: 'ACTIVE',
      approvedAt: new Date().toISOString(),
    };
    this.policies.set(policyId, policy);
    await this.auditSvc.recordAudit('AI_GOVERNANCE_POLICY_CREATED', policyId, approvedBy, { assetId, maxAutonomyLevel });
    this.logger.log(`[AIGovernance] Política criada: "${policyName}" para ativo ${assetId}`);
    return policy;
  }

  async revokePolicy(policyId: string, revokedBy: string, reason: string): Promise<AIGovernancePolicy> {
    const p = this.policies.get(policyId);
    if (!p) throw new Error(`Política "${policyId}" não encontrada.`);
    p.status = 'REVOKED';
    await this.auditSvc.recordAudit('AI_GOVERNANCE_POLICY_REVOKED', policyId, revokedBy, { reason });
    return p;
  }

  getPolicy(policyId: string): AIGovernancePolicy | undefined { return this.policies.get(policyId); }
  listPolicies(status?: AIGovernancePolicy['status']): AIGovernancePolicy[] {
    const all = Array.from(this.policies.values());
    return status ? all.filter((p) => p.status === status) : all;
  }
}
