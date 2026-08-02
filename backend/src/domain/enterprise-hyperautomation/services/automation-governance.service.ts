import { Injectable, Logger } from '@nestjs/common';
import { AutomationStatus } from '../dto/enterprise-hyperautomation.dto';
import { AutomationAuditService } from './automation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface GovernancePolicy {
  policyId: string;
  automationId: string;
  approvedBy: string;
  version: string;
  requiresHumanReview: boolean;
  approvalDate: string;
  nextReviewDate: string;
  status: AutomationStatus;
}

/**
 * AutomationGovernanceService — P174 EHCOP
 *
 * Governança do ciclo de vida de automações institucionais.
 * Controla criação, homologação, publicação, versionamento, monitoramento
 * e desativação de automações. Nenhuma automação pode entrar em produção
 * sem aprovação formal registrada neste serviço.
 */
@Injectable()
export class AutomationGovernanceService {
  private readonly logger = new Logger(AutomationGovernanceService.name);
  private readonly policies: Map<string, GovernancePolicy> = new Map();

  constructor(
    private readonly auditSvc: AutomationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerPolicy(
    automationId: string,
    approvedBy: string,
    version: string,
    requiresHumanReview: boolean,
  ): Promise<GovernancePolicy> {
    const policyId = `GOV-${automationId}-${version.replace(/\./g, '_')}`;
    const today = new Date();
    const nextReview = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000); // +6 meses

    const policy: GovernancePolicy = {
      policyId,
      automationId,
      approvedBy,
      version,
      requiresHumanReview,
      approvalDate: today.toISOString(),
      nextReviewDate: nextReview.toISOString(),
      status: AutomationStatus.APPROVED,
    };

    this.policies.set(policyId, policy);

    await this.auditSvc.recordAudit('AUTOMATION_GOVERNANCE_APPROVED', policyId, approvedBy, {
      automationId, version, requiresHumanReview,
    });

    await this.eventBus.publish(
      'aura.ehcop.governance.approved.v1',
      { policyId, automationId, version, approvedBy },
      'EHCOP',
      { subject: policyId },
    );

    this.logger.log(`[AutomationGovernance] ✅ Política registrada: "${policyId}" — Aprovado por ${approvedBy}`);
    return policy;
  }

  async deprecateAutomation(automationId: string, deprecatedBy: string, reason: string): Promise<void> {
    const policy = Array.from(this.policies.values()).find((p) => p.automationId === automationId && p.status === AutomationStatus.APPROVED);
    if (policy) {
      policy.status = AutomationStatus.DEPRECATED;
    }
    await this.auditSvc.recordAudit('AUTOMATION_DEPRECATED', automationId, deprecatedBy, { reason });
    this.logger.warn(`[AutomationGovernance] ⚠️ Automação "${automationId}" depreciada por "${deprecatedBy}": ${reason}`);
  }

  getPolicy(policyId: string): GovernancePolicy | undefined {
    return this.policies.get(policyId);
  }

  listPolicies(status?: AutomationStatus): GovernancePolicy[] {
    const all = Array.from(this.policies.values());
    return status ? all.filter((p) => p.status === status) : all;
  }
}
