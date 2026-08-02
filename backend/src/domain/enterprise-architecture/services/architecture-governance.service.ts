import { Injectable, Logger } from '@nestjs/common';
import { ArchitectureDomain } from '../dto/enterprise-architecture.dto';
import { ArchitectureAuditService } from './architecture-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ArchitectureProposal {
  proposalId: string;
  title: string;
  domain: ArchitectureDomain;
  proposedBy: string;
  description: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXEMPTED';
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface ArchitectureException {
  exceptionId: string;
  proposalId: string;
  reason: string;
  grantedBy: string;
  expiresAt: string;
  grantedAt: string;
}

/**
 * ArchitectureGovernanceService — P171 EAGO
 *
 * Governança de Arquitetura Corporativa:
 * Controla a submissão de propostas de mudança, fluxo formal de revisão,
 * concessão de exceções temporárias com justificativa e reuso de padrões.
 */
@Injectable()
export class ArchitectureGovernanceService {
  private readonly logger = new Logger(ArchitectureGovernanceService.name);
  private readonly proposals: Map<string, ArchitectureProposal> = new Map();
  private readonly exceptions: Map<string, ArchitectureException> = new Map();

  constructor(
    private readonly auditSvc: ArchitectureAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async submitProposal(
    title: string,
    domain: ArchitectureDomain,
    description: string,
    proposedBy: string,
  ): Promise<ArchitectureProposal> {
    const proposalId = `PROP-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const proposal: ArchitectureProposal = {
      proposalId,
      title,
      domain,
      proposedBy,
      description,
      status: 'SUBMITTED',
      submittedAt: now,
    };

    this.proposals.set(proposalId, proposal);

    await this.auditSvc.recordAudit('ARCHITECTURE_PROPOSAL_SUBMITTED', proposalId, proposedBy, {
      title,
      domain,
    });

    await this.eventBus.publish(
      'aura.eago.architecture.proposal.submitted.v1',
      { proposalId, title, domain, proposedBy },
      'EAGO',
      { subject: proposalId },
    );

    this.logger.log(`[ArchitectureGovernance] Proposta "${proposalId}" submetida: "${title}" (${domain})`);
    return proposal;
  }

  async approveProposal(proposalId: string, approvedBy: string, notes = ''): Promise<ArchitectureProposal> {
    const prop = this.getProposalOrThrow(proposalId);
    prop.status = 'APPROVED';
    prop.reviewNotes = notes;
    prop.reviewedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('ARCHITECTURE_APPROVED', proposalId, approvedBy, { notes });
    await this.eventBus.publish('aura.eago.architecture.approved.v1', { proposalId, approvedBy }, 'EAGO', { subject: proposalId });

    this.logger.log(`[ArchitectureGovernance] Proposta "${proposalId}" APROVADA por ${approvedBy}.`);
    return prop;
  }

  async rejectProposal(proposalId: string, rejectedBy: string, reason: string): Promise<ArchitectureProposal> {
    const prop = this.getProposalOrThrow(proposalId);
    prop.status = 'REJECTED';
    prop.reviewNotes = reason;
    prop.reviewedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('ARCHITECTURE_REJECTED', proposalId, rejectedBy, { reason });
    await this.eventBus.publish('aura.eago.architecture.rejected.v1', { proposalId, rejectedBy, reason }, 'EAGO', { subject: proposalId });

    this.logger.warn(`[ArchitectureGovernance] Proposta "${proposalId}" REJEITADA por ${rejectedBy}. Motivo: ${reason}`);
    return prop;
  }

  async grantException(
    proposalId: string,
    reason: string,
    expiresInDays: number,
    grantedBy: string,
  ): Promise<ArchitectureException> {
    const prop = this.getProposalOrThrow(proposalId);
    prop.status = 'EXEMPTED';

    const exceptionId = `EXC-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + expiresInDays * 24 * 3600 * 1000).toISOString();

    const exception: ArchitectureException = {
      exceptionId,
      proposalId,
      reason,
      grantedBy,
      expiresAt: expiry,
      grantedAt: now.toISOString(),
    };

    this.exceptions.set(exceptionId, exception);

    await this.auditSvc.recordAudit('ARCHITECTURE_EXCEPTION_GRANTED', exceptionId, grantedBy, {
      proposalId,
      reason,
      expiresAt: expiry,
    });

    this.logger.warn(`[ArchitectureGovernance] Exceção "${exceptionId}" concedida até ${expiry} por ${grantedBy}.`);
    return exception;
  }

  getProposal(proposalId: string): ArchitectureProposal | undefined {
    return this.proposals.get(proposalId);
  }

  listProposals(status?: ArchitectureProposal['status']): ArchitectureProposal[] {
    const all = Array.from(this.proposals.values());
    return status ? all.filter((p) => p.status === status) : all;
  }

  private getProposalOrThrow(proposalId: string): ArchitectureProposal {
    const p = this.proposals.get(proposalId);
    if (!p) throw new Error(`Proposta "${proposalId}" não encontrada.`);
    return p;
  }
}
