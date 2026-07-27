import { Injectable, Logger } from '@nestjs/common';
import { ClassifyRiskDto, RiskLevel } from '../dto/registration.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface MultidimensionalRiskAnalysis {
  registrationId: string;
  overallRiskLevel: RiskLevel;
  overallScore: number;
  dimensions: {
    clinical: { score: number; level: RiskLevel };
    psychosocial: { score: number; level: RiskLevel };
    vulnerability: { score: number; level: RiskLevel };
  };
  requiresImmediateIntervention: boolean;
  evaluatorNotes?: string;
  classifiedAt: string;
}

/**
 * RiskClassificationService — Classificação Multidimensional de Risco
 *
 * Calcula e gera a matriz de risco do cadastrado combinando as dimensões:
 * 1. Clínica (Complexidade de comorbidades)
 * 2. Psicossocial (Grau de suporte familiar e saúde mental)
 * 3. Vulnerabilidade Social (Situação de habitação e renda)
 *
 * Registra alerta automático para casos CRÍTICOS e emite o evento `aura.registration.risk.classified.v1`.
 *
 * Referências: P110 (AEWBPM), P128 (AECS), P133 (AAIRP Etapa 6)
 */
@Injectable()
export class RiskClassificationService {
  private readonly logger = new Logger(RiskClassificationService.name);

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Avalia as pontuações dimensionais e determina a matriz global de risco.
   */
  async classifyRisk(dto: ClassifyRiskDto, tenantId = 'default'): Promise<MultidimensionalRiskAnalysis> {
    const clinicalLevel = this.calculateLevel(dto.clinicalScore);
    const psychosocialLevel = this.calculateLevel(dto.psychosocialScore);
    const vulnerabilityLevel = this.calculateLevel(dto.vulnerabilityScore);

    // Média ponderada: Clínica (40%), Psicossocial (30%), Vulnerabilidade (30%)
    const overallScore = Math.round(
      dto.clinicalScore * 0.4 + dto.psychosocialScore * 0.3 + dto.vulnerabilityScore * 0.3,
    );

    const overallRiskLevel = this.calculateLevel(overallScore);

    // Requer intervenção imediata se alguma dimensão isolada for CRITICAL
    const requiresImmediateIntervention =
      clinicalLevel === RiskLevel.CRITICAL ||
      psychosocialLevel === RiskLevel.CRITICAL ||
      vulnerabilityLevel === RiskLevel.CRITICAL;

    const analysis: MultidimensionalRiskAnalysis = {
      registrationId: dto.registrationId,
      overallRiskLevel,
      overallScore,
      dimensions: {
        clinical: { score: dto.clinicalScore, level: clinicalLevel },
        psychosocial: { score: dto.psychosocialScore, level: psychosocialLevel },
        vulnerability: { score: dto.vulnerabilityScore, level: vulnerabilityLevel },
      },
      requiresImmediateIntervention,
      evaluatorNotes: dto.evaluatorNotes,
      classifiedAt: new Date().toISOString(),
    };

    if (requiresImmediateIntervention) {
      this.logger.error(
        `[RiskClassification] 🚨 ALERTA CRÍTICO: Cadastro ${dto.registrationId} exige intervenção imediata!`,
      );
    }

    // Publicação do evento institucional CloudEvents
    await this.eventBus.publish(
      'aura.registration.risk.classified.v1',
      {
        registrationId: dto.registrationId,
        overallRiskLevel,
        overallScore,
        requiresImmediateIntervention,
      },
      tenantId,
      { subject: dto.registrationId },
    );

    return analysis;
  }

  private calculateLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 35) return RiskLevel.MODERATE;
    return RiskLevel.LOW;
  }
}
