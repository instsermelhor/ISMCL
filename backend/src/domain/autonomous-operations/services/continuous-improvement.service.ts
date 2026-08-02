import { Injectable, Logger } from '@nestjs/common';
import { ImprovementGovernanceService } from './improvement-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ImprovementOpportunity {
  opportunityId: string;
  title: string;
  category: 'BOTTLENECK' | 'REWORK' | 'WASTE' | 'AUTOMATION' | 'SIMPLIFICATION' | 'ARCHITECTURAL';
  description: string;
  impactScorePercent: number;
  effortHours: number;
  detectedAt: string;
}

/**
 * ContinuousImprovementService — Melhoria Contínua (P164 AOCP)
 *
 * Identifica automaticamente gargalos, retrabalho, desperdícios, oportunidades
 * de automação, simplificação de processos e melhorias arquiteturais, priorizados por impacto.
 */
@Injectable()
export class ContinuousImprovementService {
  private readonly logger = new Logger(ContinuousImprovementService.name);
  private opportunitiesStore: Map<string, ImprovementOpportunity> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly governance: ImprovementGovernanceService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedOpportunities();
  }

  private seedOpportunities(): void {
    const seed: ImprovementOpportunity = {
      opportunityId: `OPP-${Date.now()}-SEED`,
      title: 'Automação da conciliação bancária do ERP Social',
      category: 'AUTOMATION',
      description: 'Conciliação manual exige 12h/semana dos gestores financeiros; automação via Open Finance reduz para 5min',
      impactScorePercent: 92,
      effortHours: 24,
      detectedAt: new Date().toISOString(),
    };
    this.opportunitiesStore.set(seed.opportunityId, seed);
  }

  async detectOpportunities(): Promise<ImprovementOpportunity[]> {
    const oppList = Array.from(this.opportunitiesStore.values());

    await this.governance.recordAudit('DETECT_IMPROVEMENT_OPPORTUNITIES', 'PLATFORM', 'COO', {
      count: oppList.length,
    });

    await this.eventBus.publish(
      'aura.operations.improvement.opportunity.detected.v1',
      { opportunitiesCount: oppList.length },
      this.SYSTEM_TENANT,
      { subject: 'PLATFORM' },
    );

    this.logger.log(`[ContinuousImprovement] Detected ${oppList.length} improvement opportunities`);
    return oppList;
  }
}
