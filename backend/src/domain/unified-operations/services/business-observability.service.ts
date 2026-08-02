import { Injectable, Logger } from '@nestjs/common';
import { CalculateBusinessImpactDto } from '../dto/unified-operations.dto';
import { SreGovernanceService } from './sre-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface BusinessImpactResult {
  impactId: string;
  incidentId: string;
  affectedService: string;
  delayedAttendancesCount: number;
  affectedBeneficiariesCount: number;
  estimatedFinancialImpactBrl: number;
  socialImpactSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impactSummary: string;
  calculatedAt: string;
}

/**
 * BusinessObservabilityService — Observabilidade de Negócio e Impacto Institucional (P156 AUOC)
 *
 * Correlaciona falhas técnicas de TI (latência, indisponibilidade, erros em APIs) com impacto direto
 * nos processos institucionais e sociais do Instituto Ser Melhor (filas de acolhimento, atendimentos, custos).
 */
@Injectable()
export class BusinessObservabilityService {
  private readonly logger = new Logger(BusinessObservabilityService.name);
  private impactRegistry: Map<string, BusinessImpactResult> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly sreGovernance: SreGovernanceService,
    private readonly eventBus: EventBusService,
  ) {}

  async calculateBusinessImpact(dto: CalculateBusinessImpactDto): Promise<BusinessImpactResult> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const impactId = `BIZ-IMP-${year}-${seq}`;

    // Cálculo proporcional ao tempo de indisponibilidade
    const delayedAttendancesCount = dto.durationMinutes * 4;
    const affectedBeneficiariesCount = dto.durationMinutes * 3;
    const estimatedFinancialImpactBrl = dto.durationMinutes * 150.0;
    const socialImpactSeverity = dto.durationMinutes > 30 ? 'HIGH' : dto.durationMinutes > 15 ? 'MEDIUM' : 'LOW';

    const result: BusinessImpactResult = {
      impactId,
      incidentId: dto.incidentId,
      affectedService: dto.affectedService,
      delayedAttendancesCount,
      affectedBeneficiariesCount,
      estimatedFinancialImpactBrl,
      socialImpactSeverity,
      impactSummary: `Incidente ${dto.incidentId} impactou ${affectedBeneficiariesCount} beneficiários e atrasou ${delayedAttendancesCount} atendimentos no acolhimento.`,
      calculatedAt: new Date().toISOString(),
    };

    this.impactRegistry.set(impactId, result);

    await this.sreGovernance.recordOperationalAudit('business-observability', 'BusinessImpactCalculated', {
      impactId,
      incidentId: dto.incidentId,
      affectedBeneficiaries: affectedBeneficiariesCount,
      severity: socialImpactSeverity,
    });

    await this.eventBus.publish(
      'aura.operations.business_impact.calculated.v1',
      { impactId, incidentId: dto.incidentId, affectedBeneficiariesCount, socialImpactSeverity },
      this.SYSTEM_TENANT,
      { subject: impactId },
    );

    this.logger.log(`[BusinessObservability] Calculated Impact: ${impactId} for ${dto.affectedService} (${affectedBeneficiariesCount} beneficiaries affected)`);
    return result;
  }

  getImpact(impactId: string): BusinessImpactResult | undefined {
    return this.impactRegistry.get(impactId);
  }

  listImpacts(): BusinessImpactResult[] {
    return Array.from(this.impactRegistry.values());
  }
}
