import { Injectable, Logger } from '@nestjs/common';
import {
  CreateBscObjectiveDto,
  BscPerspective,
} from '../dto/enterprise-strategy.dto';
import { StrategyAuditService } from './strategy-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface BscObjective {
  bscObjId: string;
  description: string;
  perspective: BscPerspective;
  strategicPlanId: string;
  linkedKpiIds: string[];
  currentScore?: number; // 0–100
  createdAt: string;
  updatedAt: string;
}

export interface BscScorecard {
  scorecardId: string;
  name: string;
  strategicPlanId: string;
  perspectives: Record<BscPerspective, BscObjective[]>;
  overallScore: number;
  generatedAt: string;
}

/**
 * BalancedScorecardService — P168 ESGP
 *
 * Implementa o Balanced Scorecard adaptado ao Instituto Ser Melhor com
 * 6 perspectivas: Institucional/Social, Beneficiários, Processos Internos,
 * Aprendizagem & Inovação, Sustentabilidade Financeira e Governança.
 */
@Injectable()
export class BalancedScorecardService {
  private readonly logger = new Logger(BalancedScorecardService.name);
  private readonly objectives: Map<string, BscObjective> = new Map();
  private readonly scorecards: Map<string, BscScorecard> = new Map();

  constructor(
    private readonly auditSvc: StrategyAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async createObjective(dto: CreateBscObjectiveDto, createdBy = 'SYSTEM'): Promise<BscObjective> {
    const bscObjId = `BSC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const now = new Date().toISOString();

    const obj: BscObjective = {
      bscObjId,
      description: dto.description,
      perspective: dto.perspective,
      strategicPlanId: dto.strategicPlanId,
      linkedKpiIds: dto.linkedKpiIds ?? [],
      createdAt: now,
      updatedAt: now,
    };

    this.objectives.set(bscObjId, obj);

    await this.auditSvc.recordAudit('BSC_OBJECTIVE_CREATED', bscObjId, createdBy, {
      perspective: dto.perspective,
      description: dto.description,
    });

    await this.eventBus.publish(
      'aura.strategy.bsc.updated.v1',
      { bscObjId, perspective: dto.perspective, strategicPlanId: dto.strategicPlanId },
      'ESGP',
      { subject: bscObjId },
    );

    this.logger.log(`[BalancedScorecard] Objetivo BSC "${bscObjId}" criado — perspectiva: ${dto.perspective}`);
    return obj;
  }

  async scoreObjective(bscObjId: string, score: number, scoredBy: string): Promise<BscObjective> {
    const obj = this.getObjOrThrow(bscObjId);
    obj.currentScore = Math.min(100, Math.max(0, score));
    obj.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('BSC_OBJECTIVE_SCORED', bscObjId, scoredBy, { score });
    await this.eventBus.publish(
      'aura.strategy.bsc.updated.v1',
      { bscObjId, score },
      'ESGP',
      { subject: bscObjId },
    );
    return obj;
  }

  generateScorecard(strategicPlanId: string, name: string): BscScorecard {
    const allPerspectives = Object.values(BscPerspective);
    const perspectives: Partial<Record<BscPerspective, BscObjective[]>> = {};
    for (const p of allPerspectives) {
      perspectives[p] = Array.from(this.objectives.values()).filter(
        (o) => o.strategicPlanId === strategicPlanId && o.perspective === p,
      );
    }

    // Score médio por perspectiva e geral
    const scores = allPerspectives.map((p) => {
      const objs = perspectives[p] ?? [];
      const scored = objs.filter((o) => o.currentScore !== undefined);
      return scored.length ? scored.reduce((a, o) => a + (o.currentScore ?? 0), 0) / scored.length : 0;
    });
    const overallScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const scorecardId = `SC-${strategicPlanId}-${Date.now().toString(36).toUpperCase()}`;
    const scorecard: BscScorecard = {
      scorecardId,
      name,
      strategicPlanId,
      perspectives: perspectives as Record<BscPerspective, BscObjective[]>,
      overallScore: Math.round(overallScore * 10) / 10,
      generatedAt: new Date().toISOString(),
    };

    this.scorecards.set(scorecardId, scorecard);
    this.logger.log(`[BalancedScorecard] Scorecard "${scorecardId}" gerado — score geral: ${scorecard.overallScore}`);
    return scorecard;
  }

  listObjectives(perspective?: BscPerspective): BscObjective[] {
    const all = Array.from(this.objectives.values());
    return perspective ? all.filter((o) => o.perspective === perspective) : all;
  }

  listScorecards(): BscScorecard[] {
    return Array.from(this.scorecards.values());
  }

  private getObjOrThrow(bscObjId: string): BscObjective {
    const o = this.objectives.get(bscObjId);
    if (!o) throw new Error(`Objetivo BSC "${bscObjId}" não encontrado.`);
    return o;
  }
}
