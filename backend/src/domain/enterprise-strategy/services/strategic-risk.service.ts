import { Injectable, Logger } from '@nestjs/common';
import {
  CreateStrategicRiskDto,
  StrategicRiskLevel,
  StrategicRiskCategory,
} from '../dto/enterprise-strategy.dto';
import { StrategyAuditService } from './strategy-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export type RiskStatus = 'OPEN' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED';

export interface StrategicRiskRecord {
  riskId: string;
  description: string;
  category: StrategicRiskCategory;
  likelihood: StrategicRiskLevel;
  impact: StrategicRiskLevel;
  riskScore: number; // 1–16 (4x4 matrix)
  riskLevel: StrategicRiskLevel;
  linkedObjectiveId: string;
  mitigationPlan: string;
  status: RiskStatus;
  owner: string;
  identifiedAt: string;
  lastReviewedAt: string;
  responseHistory: Array<{ action: string; performedBy: string; date: string; notes: string }>;
}

/**
 * StrategicRiskService — P168 ESGP
 *
 * Gestão de riscos estratégicos com classificação por 6 categorias,
 * matriz 4x4 de probabilidade × impacto, planos de mitigação e
 * monitoramento contínuo com alertas automáticos.
 */
@Injectable()
export class StrategicRiskService {
  private readonly logger = new Logger(StrategicRiskService.name);
  private readonly riskStore: Map<string, StrategicRiskRecord> = new Map();

  private readonly LEVEL_WEIGHTS: Record<StrategicRiskLevel, number> = {
    [StrategicRiskLevel.LOW]: 1,
    [StrategicRiskLevel.MEDIUM]: 2,
    [StrategicRiskLevel.HIGH]: 3,
    [StrategicRiskLevel.CRITICAL]: 4,
  };

  constructor(
    private readonly auditSvc: StrategyAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async identifyRisk(dto: CreateStrategicRiskDto, identifiedBy = 'SYSTEM'): Promise<StrategicRiskRecord> {
    const riskId = `RISK-${dto.category}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const likelihoodScore = this.LEVEL_WEIGHTS[dto.likelihood];
    const impactScore = this.LEVEL_WEIGHTS[dto.impact];
    const riskScore = likelihoodScore * impactScore;
    const riskLevel = this.scoreToLevel(riskScore);

    const risk: StrategicRiskRecord = {
      riskId,
      description: dto.description,
      category: dto.category,
      likelihood: dto.likelihood,
      impact: dto.impact,
      riskScore,
      riskLevel,
      linkedObjectiveId: dto.linkedObjectiveId,
      mitigationPlan: dto.mitigationPlan ?? 'Plano de mitigação a ser elaborado.',
      status: 'OPEN',
      owner: identifiedBy,
      identifiedAt: now,
      lastReviewedAt: now,
      responseHistory: [],
    };

    this.riskStore.set(riskId, risk);

    await this.auditSvc.recordAudit('STRATEGIC_RISK_IDENTIFIED', riskId, identifiedBy, {
      category: dto.category,
      riskScore,
      riskLevel,
      linkedObjectiveId: dto.linkedObjectiveId,
    });

    await this.eventBus.publish(
      'aura.strategy.risk.identified.v1',
      { riskId, description: dto.description, riskLevel, riskScore },
      'ESGP',
      { subject: riskId },
    );

    if (riskLevel === StrategicRiskLevel.CRITICAL) {
      this.logger.error(`[StrategicRisk] RISCO CRÍTICO identificado: "${riskId}" — ${dto.description}`);
    } else {
      this.logger.warn(`[StrategicRisk] Risco "${riskId}" identificado — nível: ${riskLevel} (score: ${riskScore})`);
    }

    return risk;
  }

  async updateMitigationStatus(
    riskId: string,
    action: string,
    status: RiskStatus,
    notes: string,
    performedBy: string,
  ): Promise<StrategicRiskRecord> {
    const risk = this.getRiskOrThrow(riskId);
    risk.status = status;
    risk.lastReviewedAt = new Date().toISOString();
    risk.responseHistory.push({ action, performedBy, date: risk.lastReviewedAt, notes });

    await this.auditSvc.recordAudit('RISK_STATUS_UPDATED', riskId, performedBy, { action, status, notes });
    this.logger.log(`[StrategicRisk] Risco "${riskId}" atualizado para "${status}"`);
    return risk;
  }

  getRisk(riskId: string): StrategicRiskRecord | undefined {
    return this.riskStore.get(riskId);
  }

  listRisks(category?: StrategicRiskCategory, level?: StrategicRiskLevel, status?: RiskStatus): StrategicRiskRecord[] {
    let risks = Array.from(this.riskStore.values());
    if (category) risks = risks.filter((r) => r.category === category);
    if (level) risks = risks.filter((r) => r.riskLevel === level);
    if (status) risks = risks.filter((r) => r.status === status);
    return risks.sort((a, b) => b.riskScore - a.riskScore);
  }

  getRiskHeatmap(): Record<string, number> {
    const heatmap: Record<string, number> = {};
    for (const risk of this.riskStore.values()) {
      heatmap[risk.riskLevel] = (heatmap[risk.riskLevel] ?? 0) + 1;
    }
    return heatmap;
  }

  private scoreToLevel(score: number): StrategicRiskLevel {
    if (score >= 12) return StrategicRiskLevel.CRITICAL;
    if (score >= 6) return StrategicRiskLevel.HIGH;
    if (score >= 3) return StrategicRiskLevel.MEDIUM;
    return StrategicRiskLevel.LOW;
  }

  private getRiskOrThrow(riskId: string): StrategicRiskRecord {
    const r = this.riskStore.get(riskId);
    if (!r) throw new Error(`Risco "${riskId}" não encontrado.`);
    return r;
  }
}
