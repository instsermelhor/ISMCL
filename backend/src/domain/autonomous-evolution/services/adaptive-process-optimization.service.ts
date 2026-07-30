import { Injectable, Logger } from '@nestjs/common';
import { ProposeProcessOptimizationDto } from '../dto/autonomous-evolution.dto';
import { ContinuousEvolutionAuditService } from './continuous-evolution-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ProcessAnalysisResult {
  processId: string;
  avgExecutionTimeMs: number;
  queueDepth: number;
  professionalLoadIndex: number; // 0 to 1
  productivityScore: number;
  efficiencyRating: 'OPTIMAL' | 'ACCEPTABLE' | 'NEEDS_OPTIMIZATION' | 'CRITICAL_BOTTLENECK';
  analyzedAt: string;
}

export interface OptimizationProposalRecord {
  proposalId: string;
  tenantId: string;
  processId: string;
  title: string;
  proposedParameters: Record<string, any>;
  rationale: string;
  status: 'PROPOSED' | 'APPLIED' | 'REJECTED';
  humanApproverId?: string;
  proposedAt: string;
  appliedAt?: string;
}

/**
 * AdaptiveProcessOptimizationService — Otimização Adaptativa de Processos (P153 AAEE)
 *
 * Analisa métricas operacionais e propõe ajustes parametrizáveis sem alterar regras críticas automaticamente:
 * - Tempos de execução e SLA
 * - Profundidade de filas de espera (SmartQueue)
 * - Carga e distribuição entre profissionais
 * - Produtividade e eficiência institucional
 */
@Injectable()
export class AdaptiveProcessOptimizationService {
  private readonly logger = new Logger(AdaptiveProcessOptimizationService.name);
  private proposalRegistry: Map<string, OptimizationProposalRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ContinuousEvolutionAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async analyzeProcessMetrics(processId: string): Promise<ProcessAnalysisResult> {
    // Simula telemetria operacional do processo
    const avgExecutionTimeMs = 180 + Math.floor(Math.random() * 320);
    const queueDepth = Math.floor(Math.random() * 15);
    const professionalLoadIndex = Math.round((0.4 + Math.random() * 0.5) * 100) / 100;
    const productivityScore = Math.round((0.8 + Math.random() * 0.18) * 100) / 100;

    let efficiencyRating: ProcessAnalysisResult['efficiencyRating'] = 'OPTIMAL';
    if (queueDepth > 10 || professionalLoadIndex > 0.85) {
      efficiencyRating = 'CRITICAL_BOTTLENECK';
    } else if (queueDepth > 5 || professionalLoadIndex > 0.70) {
      efficiencyRating = 'NEEDS_OPTIMIZATION';
    } else if (avgExecutionTimeMs > 350) {
      efficiencyRating = 'ACCEPTABLE';
    }

    return {
      processId,
      avgExecutionTimeMs,
      queueDepth,
      professionalLoadIndex,
      productivityScore,
      efficiencyRating,
      analyzedAt: new Date().toISOString(),
    };
  }

  async proposeOptimization(dto: ProposeProcessOptimizationDto): Promise<OptimizationProposalRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const proposalId = `OPT-${year}-${seq}`;

    const record: OptimizationProposalRecord = {
      proposalId,
      tenantId: dto.tenantId,
      processId: dto.processId,
      title: dto.title,
      proposedParameters: dto.proposedParameters,
      rationale: dto.rationale,
      status: 'PROPOSED',
      proposedAt: new Date().toISOString(),
    };

    this.proposalRegistry.set(proposalId, record);

    await this.auditService.recordEvolutionAudit({
      componentName: 'adaptive-process-optimization',
      actionName: 'OptimizationProposed',
      details: { proposalId, processId: dto.processId, title: dto.title },
    });

    this.logger.log(`[AdaptiveOptimization] Proposed: ${proposalId} for process ${dto.processId}`);
    return record;
  }

  async applyParametricAdjustment(
    proposalId: string,
    humanApproverId: string,
  ): Promise<OptimizationProposalRecord> {
    const record = this.proposalRegistry.get(proposalId);
    if (!record) {
      throw new Error(`Proposta de otimização não encontrada: ${proposalId}`);
    }

    record.status = 'APPLIED';
    record.humanApproverId = humanApproverId;
    record.appliedAt = new Date().toISOString();

    await this.auditService.recordEvolutionAudit({
      componentName: 'adaptive-process-optimization',
      actionName: 'OptimizationApplied',
      details: { proposalId, processId: record.processId, humanApproverId },
      humanSupervisorId: humanApproverId,
    });

    await this.eventBus.publish(
      'aura.evolution.process.optimized.v1',
      {
        proposalId,
        processId: record.processId,
        appliedParameters: record.proposedParameters,
        humanApproverId,
      },
      record.tenantId,
      { subject: proposalId },
    );

    this.logger.log(`[AdaptiveOptimization] Applied: ${proposalId} by ${humanApproverId}`);
    return record;
  }

  getProposal(proposalId: string): OptimizationProposalRecord | undefined {
    return this.proposalRegistry.get(proposalId);
  }

  listProposals(): OptimizationProposalRecord[] {
    return Array.from(this.proposalRegistry.values());
  }
}
