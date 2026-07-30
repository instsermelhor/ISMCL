import { Injectable, Logger } from '@nestjs/common';
import { EvaluateInnovationDto, InnovationPhase, SubmitInnovationProposalDto } from '../dto/autonomous-evolution.dto';
import { ContinuousEvolutionAuditService } from './continuous-evolution-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface InnovationProposalRecord {
  innovationId: string;
  tenantId: string;
  title: string;
  description: string;
  domainArea: string;
  phase: InnovationPhase;
  strategicAlignmentScore: number; // 0 to 1
  impactScore?: number;
  riskScore?: number;
  priorityScore?: number; // (strategicAlignment * 0.4 + impact * 0.4 - risk * 0.2)
  estimatedCostBrl: number;
  proposerId: string;
  evaluatorId?: string;
  evaluationComments?: string;
  approvedBy?: string;
  submittedAt: string;
  evaluatedAt?: string;
  pilotStartedAt?: string;
  adoptedAt?: string;
}

/**
 * InnovationManagementService — Gestão Institucional da Inovação (P153 AAEE)
 *
 * Gerencia o ciclo de vida completo de iniciativas inovadoras:
 * PROPOSAL → EVALUATION → EXPERIMENTATION → PILOT → ADOPTION / CLOSED
 *
 * Priorização algorítmica baseada na fórmula:
 * PriorityScore = (StrategicAlignment × 0.40) + (ImpactScore × 0.40) - (RiskScore × 0.20)
 */
@Injectable()
export class InnovationManagementService {
  private readonly logger = new Logger(InnovationManagementService.name);
  private innovationRegistry: Map<string, InnovationProposalRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ContinuousEvolutionAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedInnovations();
  }

  private seedInnovations(): void {
    const seeds: InnovationProposalRecord[] = [
      {
        innovationId: 'INV-2026-0001',
        tenantId: this.SYSTEM_TENANT,
        title: 'Triagem Assistida por Processamento de Linguagem Natural Multimodal',
        description: 'Análise integrada de prontuário, voz e bio-marcadores durante recepção.',
        domainArea: 'Saúde Mental & Psicologia',
        phase: InnovationPhase.PILOT,
        strategicAlignmentScore: 0.95,
        impactScore: 0.90,
        riskScore: 0.20,
        priorityScore: 0.70,
        estimatedCostBrl: 25000.00,
        proposerId: 'DR-INNOVATION-01',
        evaluatorId: 'EVAL-USER-001',
        approvedBy: 'CINO-ADMIN-01',
        submittedAt: new Date().toISOString(),
        evaluatedAt: new Date().toISOString(),
        pilotStartedAt: new Date().toISOString(),
      },
    ];

    for (const inv of seeds) {
      this.innovationRegistry.set(inv.innovationId, inv);
    }
  }

  async submitProposal(dto: SubmitInnovationProposalDto): Promise<InnovationProposalRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const innovationId = `INV-${year}-${seq}`;

    const record: InnovationProposalRecord = {
      innovationId,
      tenantId: dto.tenantId,
      title: dto.title,
      description: dto.description,
      domainArea: dto.domainArea,
      phase: InnovationPhase.PROPOSAL,
      strategicAlignmentScore: dto.strategicAlignmentScore,
      estimatedCostBrl: dto.estimatedCostBrl,
      proposerId: dto.proposerId ?? 'ANONYMOUS_PROPOSER',
      submittedAt: new Date().toISOString(),
    };

    this.innovationRegistry.set(innovationId, record);

    await this.auditService.recordEvolutionAudit({
      componentName: 'innovation-management',
      actionName: 'InnovationProposed',
      details: { innovationId, title: dto.title, domainArea: dto.domainArea },
    });

    await this.eventBus.publish(
      'aura.evolution.innovation.proposed.v1',
      {
        innovationId,
        title: dto.title,
        domainArea: dto.domainArea,
        strategicAlignmentScore: dto.strategicAlignmentScore,
      },
      dto.tenantId,
      { subject: innovationId },
    );

    this.logger.log(`[InnovationManagement] Proposed: ${innovationId} (${dto.title})`);
    return record;
  }

  async evaluateProposal(dto: EvaluateInnovationDto): Promise<InnovationProposalRecord> {
    const record = this.innovationRegistry.get(dto.innovationId);
    if (!record) {
      throw new Error(`Proposta de inovação não encontrada: ${dto.innovationId}`);
    }

    record.impactScore = dto.impactScore;
    record.riskScore = dto.riskScore;
    record.evaluatorId = dto.evaluatorId;
    record.evaluationComments = dto.evaluationComments;
    record.phase = InnovationPhase.EVALUATION;
    record.evaluatedAt = new Date().toISOString();

    // Calcula score de prioridade
    record.priorityScore = Math.round(
      (record.strategicAlignmentScore * 0.4 + dto.impactScore * 0.4 - dto.riskScore * 0.2) * 100,
    ) / 100;

    this.logger.log(`[InnovationManagement] Evaluated: ${dto.innovationId} → PriorityScore: ${record.priorityScore}`);
    return record;
  }

  async approvePilot(innovationId: string, approverId: string): Promise<InnovationProposalRecord> {
    const record = this.innovationRegistry.get(innovationId);
    if (!record) {
      throw new Error(`Proposta de inovação não encontrada: ${innovationId}`);
    }

    record.phase = InnovationPhase.PILOT;
    record.approvedBy = approverId;
    record.pilotStartedAt = new Date().toISOString();

    await this.auditService.recordEvolutionAudit({
      componentName: 'innovation-management',
      actionName: 'InnovationApproved',
      details: { innovationId, approvedBy: approverId, phase: record.phase },
      humanSupervisorId: approverId,
    });

    await this.eventBus.publish(
      'aura.evolution.innovation.approved.v1',
      {
        innovationId,
        approvedBy: approverId,
        phase: record.phase,
      },
      record.tenantId,
      { subject: innovationId },
    );

    this.logger.log(`[InnovationManagement] Pilot Approved: ${innovationId} by ${approverId}`);
    return record;
  }

  listInnovations(phase?: InnovationPhase): InnovationProposalRecord[] {
    const all = Array.from(this.innovationRegistry.values());
    const filtered = phase ? all.filter((i) => i.phase === phase) : all;
    // Ordena por score de prioridade decrescente
    return filtered.sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
  }

  getInnovation(innovationId: string): InnovationProposalRecord | undefined {
    return this.innovationRegistry.get(innovationId);
  }
}
