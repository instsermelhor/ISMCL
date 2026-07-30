import { Injectable, Logger } from '@nestjs/common';
import { ApprovalStatus, ProcessGovernanceApprovalDto, SubmitGovernanceApprovalDto } from '../dto/autonomous-evolution.dto';
import { ContinuousEvolutionAuditService } from './continuous-evolution-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface GovernanceApprovalRecord {
  approvalId: string;
  changeId: string;
  title: string;
  impactAnalysisId: string;
  adrReference: string;
  requesterId: string;
  status: ApprovalStatus;
  technicalReviewerId?: string;
  securityReviewerId?: string;
  governanceApproverId?: string;
  rejectionReason?: string;
  comments?: string;
  submittedAt: string;
  updatedAt: string;
  approvedAt?: string;
}

/**
 * GovernanceApprovalService — Fluxo Formal de Aprovação Institucional (P153 AAEE)
 *
 * Garante que NENHUMA alteração estrutural seja executada automaticamente.
 * Exige validação em múltiplas camadas:
 * 1. Análise Técnica
 * 2. Análise de Segurança (CISO / DevSecOps)
 * 3. Análise de Impacto (Architecture Governance Office)
 * 4. Aprovação Institucional (Human-in-the-Loop)
 * 5. Registro em ADR + Atualização de Documentação
 */
@Injectable()
export class GovernanceApprovalService {
  private readonly logger = new Logger(GovernanceApprovalService.name);
  private approvalRegistry: Map<string, GovernanceApprovalRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ContinuousEvolutionAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async submitForApproval(dto: SubmitGovernanceApprovalDto): Promise<GovernanceApprovalRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const approvalId = `GOV-APP-${year}-${seq}`;

    const record: GovernanceApprovalRecord = {
      approvalId,
      changeId: dto.changeId,
      title: dto.title,
      impactAnalysisId: dto.impactAnalysisId,
      adrReference: dto.adrReference,
      requesterId: dto.requesterId ?? 'SYSTEM_EVOLUTION_ENGINE',
      status: ApprovalStatus.SUBMITTED,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.approvalRegistry.set(approvalId, record);

    await this.auditService.recordEvolutionAudit({
      componentName: 'governance-approval',
      actionName: 'ApprovalSubmitted',
      details: { approvalId, changeId: dto.changeId, title: dto.title, adrReference: dto.adrReference },
    });

    this.logger.log(`[GovernanceApproval] Submitted: ${approvalId} for change ${dto.changeId}`);
    return record;
  }

  async processApprovalStep(dto: ProcessGovernanceApprovalDto): Promise<GovernanceApprovalRecord> {
    const record = this.approvalRegistry.get(dto.approvalId);
    if (!record) {
      throw new Error(`Solicitação de aprovação não encontrada: ${dto.approvalId}`);
    }

    if (!dto.approved) {
      record.status = ApprovalStatus.REJECTED;
      record.rejectionReason = dto.comments ?? 'Rejeitado durante revisão de governança.';
      record.updatedAt = new Date().toISOString();

      await this.auditService.recordEvolutionAudit({
        componentName: 'governance-approval',
        actionName: 'ApprovalRejected',
        details: { approvalId: dto.approvalId, approverId: dto.approverId, reason: record.rejectionReason },
        humanSupervisorId: dto.approverId,
      });

      return record;
    }

    // Avança no pipeline de aprovação
    if (record.status === ApprovalStatus.SUBMITTED) {
      record.status = ApprovalStatus.TECHNICAL_REVIEW;
      record.technicalReviewerId = dto.approverId;
    } else if (record.status === ApprovalStatus.TECHNICAL_REVIEW) {
      record.status = ApprovalStatus.SECURITY_REVIEW;
      record.securityReviewerId = dto.approverId;
    } else if (record.status === ApprovalStatus.SECURITY_REVIEW) {
      record.status = ApprovalStatus.GOVERNANCE_APPROVED;
      record.governanceApproverId = dto.approverId;
      record.approvedAt = new Date().toISOString();

      await this.eventBus.publish(
        'aura.evolution.governance.approval_granted.v1',
        {
          approvalId: record.approvalId,
          changeId: record.changeId,
          adrReference: record.adrReference,
          approverId: dto.approverId,
        },
        this.SYSTEM_TENANT,
        { subject: record.approvalId },
      );
    }

    record.comments = dto.comments;
    record.updatedAt = new Date().toISOString();

    await this.auditService.recordEvolutionAudit({
      componentName: 'governance-approval',
      actionName: `ApprovalStepPassed_${record.status}`,
      details: { approvalId: dto.approvalId, approverId: dto.approverId, role: dto.approverRole, status: record.status },
      humanSupervisorId: dto.approverId,
    });

    this.logger.log(`[GovernanceApproval] Processed step for ${dto.approvalId} → Status: ${record.status} by ${dto.approverId}`);
    return record;
  }

  getApprovalStatus(approvalId: string): GovernanceApprovalRecord | undefined {
    return this.approvalRegistry.get(approvalId);
  }

  listApprovals(status?: ApprovalStatus): GovernanceApprovalRecord[] {
    const all = Array.from(this.approvalRegistry.values());
    return status ? all.filter((a) => a.status === status) : all;
  }
}
