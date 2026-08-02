import { Injectable, Logger } from '@nestjs/common';
import { OptimizeResourcesDto } from '../dto/digital-twin.dto';
import { DigitalTwinGovernanceService } from './digital-twin-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ResourceOptimizationAlternative {
  alternativeId: string;
  label: string;
  teamAllocation: Record<string, number>;
  estimatedCapacityIncrease: number;
  estimatedCostBrl: number;
  costBenefitRatio: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ResourceOptimizationResult {
  optimizationId: string;
  scenarioId?: string;
  currentCapacityPercent: number;
  targetCapacityPercent: number;
  alternatives: ResourceOptimizationAlternative[];
  recommendedAlternativeId: string;
  optimizedAt: string;
}

/**
 * ResourceOptimizationService — Otimização Inteligente de Recursos (P157 ADT)
 *
 * Simula diferentes estratégias de alocação de equipes, distribuição de atendimentos,
 * capacidade operacional e utilização financeira, apresentando alternativas comparáveis
 * com análise de custo-benefício.
 */
@Injectable()
export class ResourceOptimizationService {
  private readonly logger = new Logger(ResourceOptimizationService.name);
  private optimizationRegistry: Map<string, ResourceOptimizationResult> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly governance: DigitalTwinGovernanceService,
    private readonly eventBus: EventBusService,
  ) {}

  async optimizeResources(dto: OptimizeResourcesDto): Promise<ResourceOptimizationResult> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const optimizationId = `OPT-${year}-${seq}`;
    const targetCapacity = dto.constraints?.targetCapacityPercent ?? 85;

    const alternatives: ResourceOptimizationAlternative[] = [
      {
        alternativeId: `${optimizationId}-ALT-A`,
        label: 'Redistribuição Interna de Equipes',
        teamAllocation: { psicologia: 24, servico_social: 18, saude: 12, admin: 8 },
        estimatedCapacityIncrease: 12.5,
        estimatedCostBrl: 18000,
        costBenefitRatio: 2.8,
        riskLevel: 'LOW',
      },
      {
        alternativeId: `${optimizationId}-ALT-B`,
        label: 'Contratação de Voluntários Especializados',
        teamAllocation: { psicologia: 22, servico_social: 20, saude: 14, voluntarios: 15, admin: 8 },
        estimatedCapacityIncrease: 22.0,
        estimatedCostBrl: 9500,
        costBenefitRatio: 4.6,
        riskLevel: 'LOW',
      },
      {
        alternativeId: `${optimizationId}-ALT-C`,
        label: 'Expansão com Novo Polo Operacional',
        teamAllocation: { psicologia: 30, servico_social: 26, saude: 18, admin: 12 },
        estimatedCapacityIncrease: 48.0,
        estimatedCostBrl: 95000,
        costBenefitRatio: 1.9,
        riskLevel: 'HIGH',
      },
    ];

    // Recomenda a alternativa com melhor custo-benefício
    const recommended = alternatives.reduce((a, b) => (a.costBenefitRatio >= b.costBenefitRatio ? a : b));

    const result: ResourceOptimizationResult = {
      optimizationId,
      scenarioId: dto.scenarioId,
      currentCapacityPercent: 67.5,
      targetCapacityPercent: targetCapacity,
      alternatives,
      recommendedAlternativeId: recommended.alternativeId,
      optimizedAt: new Date().toISOString(),
    };

    this.optimizationRegistry.set(optimizationId, result);

    await this.governance.recordTwinAudit('resource-optimization', 'ResourceOptimizationCalculated', {
      optimizationId, recommendedAlternativeId: recommended.alternativeId, costBenefitRatio: recommended.costBenefitRatio,
    });

    await this.eventBus.publish(
      'aura.digitaltwin.resource.optimization.calculated.v1',
      { optimizationId, recommendedAlternativeId: recommended.alternativeId, targetCapacityPercent: targetCapacity },
      this.SYSTEM_TENANT,
      { subject: optimizationId },
    );

    this.logger.log(`[ResourceOptimization] ${optimizationId} → Recommended: ${recommended.label} (CBR: ${recommended.costBenefitRatio})`);
    return result;
  }

  getOptimization(optimizationId: string): ResourceOptimizationResult | undefined {
    return this.optimizationRegistry.get(optimizationId);
  }

  listOptimizations(): ResourceOptimizationResult[] {
    return Array.from(this.optimizationRegistry.values());
  }
}
