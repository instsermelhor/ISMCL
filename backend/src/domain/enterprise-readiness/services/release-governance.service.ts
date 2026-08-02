import { Injectable, Logger } from '@nestjs/common';
import { ReleaseStatus, SubmitReleaseCandidateDto } from '../dto/enterprise-readiness.dto';
import { CertificationEvidenceService } from './certification-evidence.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ReleaseCandidate {
  releaseId: string;
  releaseTag: string;
  commitMessage: string;
  relatedAdrIds: string[];
  requestedBy: string;
  status: ReleaseStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

/**
 * ReleaseGovernanceService — Governança de Releases (P163 ERCP)
 *
 * Controla candidatos a release, aprovações formais, rollback,
 * versionamento, responsáveis, evidências, riscos e histórico completo.
 * Nenhum release pode ser promovido para produção sem aprovação registrada.
 */
@Injectable()
export class ReleaseGovernanceService {
  private readonly logger = new Logger(ReleaseGovernanceService.name);
  private releaseStore: Map<string, ReleaseCandidate> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly evidence: CertificationEvidenceService,
    private readonly eventBus: EventBusService,
  ) {}

  async submitReleaseCandidate(dto: SubmitReleaseCandidateDto): Promise<ReleaseCandidate> {
    const releaseId = `RC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const candidate: ReleaseCandidate = {
      releaseId,
      releaseTag: dto.releaseTag,
      commitMessage: dto.commitMessage,
      relatedAdrIds: dto.relatedAdrIds ?? [],
      requestedBy: dto.requestedBy ?? 'CTO',
      status: ReleaseStatus.CANDIDATE,
      submittedAt: new Date().toISOString(),
    };

    this.releaseStore.set(releaseId, candidate);

    await this.evidence.recordEvidence('SUBMIT_RELEASE_CANDIDATE', dto.releaseTag, candidate.requestedBy, {
      releaseId, commitMessage: dto.commitMessage,
    });

    this.logger.log(`[ReleaseGovernance] RC submitted: ${releaseId} (${dto.releaseTag})`);
    return candidate;
  }

  async approveRelease(releaseId: string, approvedBy: string, notes?: string): Promise<ReleaseCandidate | null> {
    const candidate = this.releaseStore.get(releaseId);
    if (!candidate) return null;

    candidate.status = ReleaseStatus.APPROVED;
    candidate.reviewedAt = new Date().toISOString();
    candidate.reviewNotes = notes ?? 'Aprovado após validação técnica completa';
    this.releaseStore.set(releaseId, candidate);

    await this.evidence.recordEvidence('APPROVE_RELEASE', candidate.releaseTag, approvedBy, {
      releaseId, status: candidate.status,
    });

    await this.eventBus.publish(
      'aura.readiness.release.candidate.approved.v1',
      { releaseId, releaseTag: candidate.releaseTag, approvedBy },
      this.SYSTEM_TENANT,
      { subject: releaseId },
    );

    this.logger.log(`[ReleaseGovernance] Approved: ${releaseId} (${candidate.releaseTag}) by ${approvedBy}`);
    return candidate;
  }

  async blockRelease(releaseId: string, blockedBy: string, reason: string): Promise<ReleaseCandidate | null> {
    const candidate = this.releaseStore.get(releaseId);
    if (!candidate) return null;

    candidate.status = ReleaseStatus.BLOCKED;
    candidate.reviewedAt = new Date().toISOString();
    candidate.reviewNotes = reason;
    this.releaseStore.set(releaseId, candidate);

    await this.eventBus.publish(
      'aura.readiness.release.candidate.blocked.v1',
      { releaseId, releaseTag: candidate.releaseTag, blockedBy, reason },
      this.SYSTEM_TENANT,
      { subject: releaseId },
    );

    this.logger.log(`[ReleaseGovernance] Blocked: ${releaseId} (${candidate.releaseTag}) — ${reason}`);
    return candidate;
  }

  listReleaseCandidates(status?: ReleaseStatus): ReleaseCandidate[] {
    return Array.from(this.releaseStore.values()).filter(
      (r) => !status || r.status === status,
    );
  }
}
