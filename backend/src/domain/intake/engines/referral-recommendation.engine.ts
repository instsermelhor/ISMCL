import { Injectable, Logger } from '@nestjs/common';
import { ReferralSpecialty, IntakePriority } from '../dto/intake.dto';

export interface ReferralRecommendation {
  specialty: ReferralSpecialty;
  urgency: 'NORMAL' | 'HIGH' | 'IMMEDIATE';
  reason: string;
  suggestedProfessionalsCount: number;
}

/**
 * ReferralRecommendationEngine — Encaminhamento Inteligente Multidisciplinar
 *
 * Determina as especialidades e programas de destino para os quais o caso
 * deve ser direcionado imediatamente após o acolhimento e triagem.
 *
 * Mapeamento:
 * - Fatores emocionais/crise -> Psicologia / Psiquiatria / Telemedicina
 * - Fatores socioeconômicos/moradia -> Serviço Social / Gestão de Casos
 * - Risco extremo -> Atendimento Emergencial Presencial / Rede de Apoio
 *
 * Referências: P110 (AEWBPM), P134 (AIWSP Etapa 8)
 */
@Injectable()
export class ReferralRecommendationEngine {
  private readonly logger = new Logger(ReferralRecommendationEngine.name);

  /**
   * Gera recomendações de encaminhamento para o caso.
   */
  recommend(
    priority: IntakePriority,
    clinicalFactors: string[],
    psychosocialFactors: string[],
    hasCrisis: boolean,
  ): ReferralRecommendation[] {
    const recommendations: ReferralRecommendation[] = [];

    if (hasCrisis || priority === IntakePriority.CRITICAL) {
      recommendations.push({
        specialty: ReferralSpecialty.EMERGENCY_CARE,
        urgency: 'IMMEDIATE',
        reason: 'Situação de crise exige intervenção médica/psiquiátrica de urgência.',
        suggestedProfessionalsCount: 2,
      });
      recommendations.push({
        specialty: ReferralSpecialty.PSYCHIATRY,
        urgency: 'IMMEDIATE',
        reason: 'Avaliação psiquiátrica prioritária para contenção de danos.',
        suggestedProfessionalsCount: 1,
      });
    }

    if (psychosocialFactors.some((f) => f.includes('EMOTIONAL') || f.includes('ANXIETY') || f.includes('DEPRESSION'))) {
      recommendations.push({
        specialty: ReferralSpecialty.PSYCHOLOGY,
        urgency: priority === IntakePriority.EMERGENCY ? 'HIGH' : 'NORMAL',
        reason: 'Acompanhamento psicoterápico contínuo indicado pelos fatores emocionais.',
        suggestedProfessionalsCount: 1,
      });
    }

    if (psychosocialFactors.some((f) => f.includes('HOUSING') || f.includes('FOOD') || f.includes('INCOME'))) {
      recommendations.push({
        specialty: ReferralSpecialty.SOCIAL_WORK,
        urgency: 'NORMAL',
        reason: 'Atendimento do Serviço Social para inclusão em programas de proteção social.',
        suggestedProfessionalsCount: 1,
      });
    }

    // Default fallback se nenhuma especialidade específica tiver sido acionada
    if (recommendations.length === 0) {
      recommendations.push({
        specialty: ReferralSpecialty.CASE_MANAGEMENT,
        urgency: 'NORMAL',
        reason: 'Acompanhamento geral pela equipe de Gestão de Casos.',
        suggestedProfessionalsCount: 1,
      });
    }

    this.logger.log(
      `[ReferralEngine] Encaminhamento gerado: ${recommendations.map((r) => r.specialty).join(', ')}`,
    );

    return recommendations;
  }
}
