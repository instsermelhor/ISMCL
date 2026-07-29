import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  RegisterOkrDto,
  RecordCommitteeDecisionDto,
  OkrStatus,
} from '../dto/governance.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface StrategicObjective {
  objectiveId: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'ACHIEVED' | 'CANCELLED';
  progressPercentage: number;
}

export interface OkrRecord {
  okrId: string;
  okrCode: string; // OKR-2026-QX-XXXXX
  objective: string;
  keyResults: Array<{ kr: string; progressPercentage: number; status: OkrStatus }>;
  cycle: string;
  ownerId: string;
  overallStatus: OkrStatus;
  createdAt: string;
}

export interface CommitteeDecision {
  decisionId: string;
  decisionCode: string; // DEC-2026-XXXXX
  committeeName: string;
  agenda: string;
  decision: string;
  actionPlan?: string;
  workflowTaskId?: string; // ID gerado no Workflow Engine
  recordedAt: string;
  digitalSignature: string;
}

/**
 * StrategicPlanningGrcService — Planejamento Estratégico, OKRs, Comitês e GRC Dashboard
 *
 * Funcionalidades:
 * - Planejamento Estratégico com Missão/Visão/Valores e Objetivos Estratégicos
 * - Gestão de OKRs (Objectives & Key Results) por ciclos trimestrais/anuais
 * - Registro imutável de deliberações de Comitês com assinatura digital e geração de tarefa no Workflow
 * - GRC Dashboard consolidado para a Diretoria (Riscos, Compliance, OKRs, Políticas)
 * - Emissão de CloudEvents `aura.governance.okr.updated.v1` e `aura.governance.committee.decision.v1`
 *
 * Referências: P116 AEGRC, P144 AEGRC Etapas 7, 8, 9, 11
 */
@Injectable()
export class StrategicPlanningGrcService {
  private readonly logger = new Logger(StrategicPlanningGrcService.name);
  private readonly strategicObjectives: StrategicObjective[] = [];
  private readonly okrs = new Map<string, OkrRecord>();
  private readonly decisions: CommitteeDecision[] = [];
  private decisionSequence = 1000;
  private okrSequence = 1000;

  constructor(private readonly eventBus: EventBusService) {
    this.seedStrategicPlan();
  }

  private seedStrategicPlan(): void {
    this.strategicObjectives.push(
      {
        objectiveId: randomUUID(),
        title: 'Ampliar o alcance assistencial para 500 beneficiários ativos até 2027',
        description: 'Expansão da capacidade de atendimento com novas turmas e profissionais voluntários.',
        status: 'ACTIVE',
        progressPercentage: 38,
      },
      {
        objectiveId: randomUUID(),
        title: 'Atingir 100% de conformidade LGPD e Zero Trust na Plataforma Aura',
        description: 'Certificação LGPD e Zero Trust em todos os módulos da plataforma.',
        status: 'ACTIVE',
        progressPercentage: 92,
      },
      {
        objectiveId: randomUUID(),
        title: 'Reduzir o tempo médio de acolhimento inicial para menos de 48h',
        description: 'Melhoria de SLA de triagem e acolhimento com suporte de IA (Prompt 141).',
        status: 'ACTIVE',
        progressPercentage: 75,
      },
    );

    this.logger.log(`[StrategicPlanning] 🎯 ${this.strategicObjectives.length} objetivos estratégicos carregados.`);
  }

  // ── OKR Management ────────────────────────────────────────────────────

  async registerOkr(dto: RegisterOkrDto, tenantId = 'default'): Promise<OkrRecord> {
    this.okrSequence++;
    const okrId = randomUUID();
    const okrCode = `OKR-${dto.cycle}-${this.okrSequence}`;
    const now = new Date().toISOString();

    const okr: OkrRecord = {
      okrId,
      okrCode,
      objective: dto.objective,
      keyResults: dto.keyResults.map((kr) => ({ kr, progressPercentage: 0, status: OkrStatus.ON_TRACK })),
      cycle: dto.cycle,
      ownerId: dto.ownerId,
      overallStatus: OkrStatus.ON_TRACK,
      createdAt: now,
    };

    this.okrs.set(okrId, okr);
    this.logger.log(`[OKR] 🎯 OKR registrado: ${okrCode} — "${dto.objective}" | ${dto.keyResults.length} KRs definidos.`);

    await this.eventBus.publish(
      'aura.governance.okr.registered.v1',
      { okrId, okrCode, objective: dto.objective, cycle: dto.cycle, ownerId: dto.ownerId },
      tenantId,
      { subject: okrId },
    );

    return okr;
  }

  // ── Corporate Committee Decisions ──────────────────────────────────────

  async recordCommitteeDecision(dto: RecordCommitteeDecisionDto, recordedBy: string, tenantId = 'default'): Promise<CommitteeDecision> {
    this.decisionSequence++;
    const decisionId = randomUUID();
    const decisionCode = `DEC-${new Date().getFullYear()}-${this.decisionSequence}`;
    const recordedAt = new Date().toISOString();

    // Assinatura digital da deliberação (imutabilidade)
    const { createHash } = await import('crypto');
    const sig = createHash('sha256')
      .update(`${decisionCode}:${dto.decision}:${recordedBy}:${recordedAt}`)
      .digest('hex');

    // Simulação de tarefa gerada no Workflow Engine (P139)
    const workflowTaskId = dto.actionPlan ? `TASK-${Date.now()}` : undefined;

    const decision: CommitteeDecision = {
      decisionId,
      decisionCode,
      committeeName: dto.committeeName,
      agenda: dto.agenda,
      decision: dto.decision,
      actionPlan: dto.actionPlan,
      workflowTaskId,
      recordedAt,
      digitalSignature: sig,
    };

    this.decisions.push(decision);
    this.logger.log(`[Committee] 📋 Deliberação registrada: ${decisionCode} — "${dto.committeeName}" | WorkflowTask: ${workflowTaskId ?? 'N/A'}`);

    await this.eventBus.publish(
      'aura.governance.committee.decision.v1',
      { decisionId, decisionCode, committeeName: dto.committeeName, workflowTaskId, recordedBy },
      tenantId,
      { subject: decisionId },
    );

    return decision;
  }

  // ── GRC Dashboard ─────────────────────────────────────────────────────

  buildGrcDashboard(
    risks: ReturnType<any>,
    policies: ReturnType<any>,
    controls: ReturnType<any>,
  ) {
    const criticalRisks = risks.filter((r: any) => r.riskLevel === 'CRITICAL').length;
    const highRisks = risks.filter((r: any) => r.riskLevel === 'HIGH').length;
    const publishedPolicies = policies.filter((p: any) => p.status === 'PUBLISHED').length;
    const avgOkrProgress = this.strategicObjectives.reduce((s, o) => s + o.progressPercentage, 0) / (this.strategicObjectives.length || 1);

    return {
      title: 'GRC Dashboard — Plataforma Aura / Instituto Ser Melhor',
      summary: {
        totalRisks: risks.length,
        criticalRisks,
        highRisks,
        totalPolicies: policies.length,
        publishedPolicies,
        totalControls: controls.length,
        totalOkrs: this.okrs.size,
        strategicProgressAvg: Number(avgOkrProgress.toFixed(1)),
        totalCommitteeDecisions: this.decisions.length,
      },
      strategicObjectives: this.strategicObjectives,
      recentDecisions: this.decisions.slice(-5).reverse(),
      generatedAt: new Date().toISOString(),
    };
  }

  listOkrs(): OkrRecord[] {
    return [...this.okrs.values()].reverse();
  }

  listDecisions(): CommitteeDecision[] {
    return [...this.decisions].reverse();
  }
}
