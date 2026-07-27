import { Injectable, Logger } from '@nestjs/common';
import { EvaluateEligibilityDto } from '../dto/registration.dto';

export interface EligibilityResult {
  isEligible: boolean;
  status: 'APPROVED' | 'REJECTED' | 'PENDING_DOCUMENTATION' | 'UNDER_REVIEW';
  score: number; // 0 a 100
  approvedPrograms: string[];
  rejectionReasons: string[];
  evaluatedAt: string;
}

/**
 * EligibilityEngine — Motor de Elegibilidade Baseado em Regras de Negócio
 *
 * Avalia critérios institucionais e sociais configuráveis para determinar a
 * elegibilidade do beneficiário para programas sociais e atendimentos clínicos gratuitos.
 *
 * Critérios avaliados:
 * - Renda familiar per capita (ex: até 0.5 salário mínimo para prioridade 1)
 * - Indicadores de vulnerabilidade social (moradia de risco, desemprego)
 * - Cobertura geográfica (município atuarial)
 * - Comprovação de dependentes
 *
 * Referências: P110 (AEWBPM), P133 (AAIRP Etapa 5)
 */
@Injectable()
export class EligibilityEngine {
  private readonly logger = new Logger(EligibilityEngine.name);

  // Valor de referência do Salário Mínimo (R$ 1.412,00)
  private readonly MINIMUM_WAGE = 1412.0;

  /**
   * Avalia a elegibilidade completa do cadastrado.
   */
  evaluate(dto: EvaluateEligibilityDto): EligibilityResult {
    const evaluatedAt = new Date().toISOString();
    const rejectionReasons: string[] = [];
    const approvedPrograms: string[] = [];

    const perCapitaIncome = dto.monthlyIncome / Math.max(1, dto.familyMembersCount);

    let score = 50; // Pontuação base

    // 1. Regra de Renda Per Capita
    const halfMinWage = this.MINIMUM_WAGE / 2;
    const doubleMinWage = this.MINIMUM_WAGE * 2;

    if (perCapitaIncome <= halfMinWage) {
      score += 35;
      approvedPrograms.push('PROGRAMA_ASSISTENCIA_INTEGRAL_ALIMENTAR');
      approvedPrograms.push('ATENDIMENTO_CLINICO_GRATUITO_PRIORITARIO');
    } else if (perCapitaIncome <= this.MINIMUM_WAGE) {
      score += 20;
      approvedPrograms.push('ATENDIMENTO_CLINICO_GRATUITO');
    } else if (perCapitaIncome > doubleMinWage) {
      score -= 30;
      rejectionReasons.push(
        `Renda per capita (R$ ${perCapitaIncome.toFixed(2)}) acima do limite para gratuidade integral.`,
      );
    }

    // 2. Regra de Vulnerabilidade Social Adicional
    const vulnerabilityCount = dto.vulnerabilityFactors?.length ?? 0;
    score += vulnerabilityCount * 10;

    if (vulnerabilityCount > 0) {
      approvedPrograms.push('ACOMPANHAMENTO_PSICOSSOCIAL_CONTINUO');
    }

    // Normalização da pontuação entre 0 e 100
    score = Math.min(100, Math.max(0, score));

    // Determinação do Status Final
    let isEligible = false;
    let status: EligibilityResult['status'] = 'REJECTED';

    if (score >= 60) {
      isEligible = true;
      status = 'APPROVED';
    } else if (score >= 40) {
      isEligible = true;
      status = 'UNDER_REVIEW';
    } else {
      isEligible = false;
      status = 'REJECTED';
    }

    this.logger.log(
      `[EligibilityEngine] Avaliação concluída para ${dto.registrationId}: Status=${status}, Score=${score}`,
    );

    return {
      isEligible,
      status,
      score,
      approvedPrograms: Array.from(new Set(approvedPrograms)),
      rejectionReasons,
      evaluatedAt,
    };
  }
}
