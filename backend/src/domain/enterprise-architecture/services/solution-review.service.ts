import { Injectable, Logger } from '@nestjs/common';
import { SubmitSolutionReviewDto, ArbReviewStatus } from '../dto/enterprise-architecture.dto';
import { ArchitectureReviewBoardService } from './architecture-review-board.service';
import { ArchitectureAuditService } from './architecture-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface SolutionReviewResult {
  solutionReviewId: string;
  solutionName: string;
  isAlignedWithAuraReferenceArchitecture: boolean;
  score: number; // 0-100
  findings: string[];
  reviewedAt: string;
  reviewedBy: string;
}

/**
 * SolutionReviewService — P171 EAGO
 *
 * Revisão Técnica de Soluções Propostas.
 * Avalia o alinhamento de novos projetos ou módulos com a Arquitetura de Referência
 * do Projeto Aura antes da submissão formal ao ARB (Architecture Review Board).
 */
@Injectable()
export class SolutionReviewService {
  private readonly logger = new Logger(SolutionReviewService.name);

  constructor(
    private readonly arbSvc: ArchitectureReviewBoardService,
    private readonly auditSvc: ArchitectureAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async reviewSolution(dto: SubmitSolutionReviewDto, reviewer = 'CHIEF_ENTERPRISE_ARCHITECT'): Promise<SolutionReviewResult> {
    const solutionReviewId = `SOL-REV-${Date.now().toString(36).toUpperCase()}`;

    // Submeter ao ARB
    const arbSession = await this.arbSvc.submitForReview(dto, reviewer);

    const findings: string[] = [];
    let score = 100;

    if (!dto.technologiesUsed?.includes('TypeScript')) {
      findings.push('Alerta: Linguagem primária recomendada é TypeScript com tipagem estrita.');
      score -= 15;
    }
    if (!dto.technologiesUsed?.includes('AsyncAPI 2.6.0') && !dto.technologiesUsed?.includes('Swagger')) {
      findings.push('Alerta: Especificação OpenAPI/AsyncAPI mandatória para integração.');
      score -= 15;
    }

    const isAlignedWithAuraReferenceArchitecture = score >= 70;

    const result: SolutionReviewResult = {
      solutionReviewId,
      solutionName: dto.solutionName,
      isAlignedWithAuraReferenceArchitecture,
      score,
      findings: findings.length > 0 ? findings : ['Solução perfeitamente alinhada com a Arquitetura de Referência Aura.'],
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewer,
    };

    await this.auditSvc.recordAudit('SOLUTION_REVIEWED', solutionReviewId, reviewer, {
      solutionName: dto.solutionName,
      score,
      isAligned: isAlignedWithAuraReferenceArchitecture,
      arbReviewId: arbSession.reviewId,
    });

    this.logger.log(`[SolutionReview] Solução "${dto.solutionName}" avaliada: ${score}/100 — Alinhada: ${isAlignedWithAuraReferenceArchitecture}`);
    return result;
  }
}
