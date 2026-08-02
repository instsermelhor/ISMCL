import { Injectable, Logger } from '@nestjs/common';
import { SubmitSolutionReviewDto, SubmitArbVoteDto, ArbReviewStatus } from '../dto/enterprise-architecture.dto';
import { ArchitectureAuditService } from './architecture-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ArbVote {
  voterName: string;
  vote: ArbReviewStatus;
  comments: string;
  votedAt: string;
}

export interface ArbReviewSession {
  reviewId: string;
  solutionName: string;
  summary: string;
  primaryDomain: string;
  leadArchitect: string;
  technologiesUsed: string[];
  status: ArbReviewStatus;
  votes: ArbVote[];
  conditions: string[];
  finalDecisionNotes?: string;
  submittedAt: string;
  decidedAt?: string;
}

/**
 * ArchitectureReviewBoardService — P171 EAGO
 *
 * Conselho Arquitetural Digital (Architecture Review Board — ARB).
 * Permite a avaliação formal de novas soluções, tecnologias e mudanças estruturais
 * com coleta de votos dos arquitetos do comitê (CEA, CTO, CISO, CAIO, CGO).
 */
@Injectable()
export class ArchitectureReviewBoardService {
  private readonly logger = new Logger(ArchitectureReviewBoardService.name);
  private readonly reviews: Map<string, ArbReviewSession> = new Map();

  constructor(
    private readonly auditSvc: ArchitectureAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async submitForReview(dto: SubmitSolutionReviewDto, submittedBy = 'SYSTEM'): Promise<ArbReviewSession> {
    const reviewId = `ARB-REV-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const session: ArbReviewSession = {
      reviewId,
      solutionName: dto.solutionName,
      summary: dto.summary,
      primaryDomain: dto.primaryDomain,
      leadArchitect: dto.leadArchitect,
      technologiesUsed: dto.technologiesUsed ?? [],
      status: ArbReviewStatus.SUBMITTED,
      votes: [],
      conditions: [],
      submittedAt: now,
    };

    this.reviews.set(reviewId, session);

    await this.auditSvc.recordAudit('ARB_REVIEW_SUBMITTED', reviewId, submittedBy, {
      solutionName: dto.solutionName,
      leadArchitect: dto.leadArchitect,
    });

    this.logger.log(`[ArchitectureReviewBoard] Solução "${dto.solutionName}" submetida para o ARB — ID: ${reviewId}`);
    return session;
  }

  async submitVote(dto: SubmitArbVoteDto): Promise<ArbReviewSession> {
    const session = this.getOrThrow(dto.reviewId);
    const existingVoteIdx = session.votes.findIndex((v) => v.voterName === dto.voterName);

    const vote: ArbVote = {
      voterName: dto.voterName,
      vote: dto.vote,
      comments: dto.comments,
      votedAt: new Date().toISOString(),
    };

    if (existingVoteIdx >= 0) {
      session.votes[existingVoteIdx] = vote;
    } else {
      session.votes.push(vote);
    }

    session.status = ArbReviewStatus.IN_REVIEW;

    await this.auditSvc.recordAudit('ARB_VOTE_CAST', dto.reviewId, dto.voterName, {
      vote: dto.vote,
      comments: dto.comments,
    });

    this.logger.log(`[ArchitectureReviewBoard] Voto registrado em "${dto.reviewId}" por ${dto.voterName}: ${dto.vote}`);
    return session;
  }

  async finalizeReview(
    reviewId: string,
    finalStatus: ArbReviewStatus,
    decidedBy: string,
    conditions: string[] = [],
    notes = '',
  ): Promise<ArbReviewSession> {
    const session = this.getOrThrow(reviewId);
    session.status = finalStatus;
    session.conditions = conditions;
    session.finalDecisionNotes = notes;
    session.decidedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('ARB_REVIEW_FINALIZED', reviewId, decidedBy, {
      finalStatus,
      conditions,
      notes,
    });

    await this.eventBus.publish(
      'aura.eago.solution.reviewed.v1',
      { reviewId, solutionName: session.solutionName, finalStatus, decidedBy },
      'EAGO',
      { subject: reviewId },
    );

    this.logger.log(`[ArchitectureReviewBoard] Sessão "${reviewId}" finalizada pelo ARB com status: ${finalStatus}`);
    return session;
  }

  getReview(reviewId: string): ArbReviewSession | undefined {
    return this.reviews.get(reviewId);
  }

  listReviews(status?: ArbReviewStatus): ArbReviewSession[] {
    const all = Array.from(this.reviews.values());
    return status ? all.filter((r) => r.status === status) : all;
  }

  private getOrThrow(reviewId: string): ArbReviewSession {
    const r = this.reviews.get(reviewId);
    if (!r) throw new Error(`Sessão ARB "${reviewId}" não encontrada.`);
    return r;
  }
}
