import { Injectable, Logger } from '@nestjs/common';
import { IntakePriority } from '../dto/intake.dto';

export interface PriorityClassificationResult {
  priority: IntakePriority;
  score: number; // 0 a 100
  slaHours: number; // SLA máximo para primeiro atendimento humano
  rationale: string;
  evaluatedAt: string;
}

/**
 * PriorityClassificationEngine — Classificação Automática de Prioridade Assistencial
 *
 * Determina a prioridade do acolhimento e o SLA máximo em horas para o primeiro atendimento humano:
 * - CRITICAL   → SLA: 0.5h (30 minutos — emergência imediata)
 * - EMERGENCY  → SLA: 2h
 * - URGENT     → SLA: 24h (1 dia útil)
 * - PRIORITY   → SLA: 48h (2 dias úteis)
 * - ROUTINE    → SLA: 120h (5 dias úteis)
 *
 * Referências: P110 (AEWBPM), P134 (AIWSP Etapa 5)
 */
@Injectable()
export class PriorityClassificationEngine {
  private readonly logger = new Logger(PriorityClassificationEngine.name);

  /**
   * Avalia a pontuação e os fatores de crise para determinar a prioridade.
   */
  classify(
    hasCrisis: boolean,
    vulnerabilityIndex: number, // 0 a 30
    clinicalFactorsCount: number,
    psychosocialFactorsCount: number,
  ): PriorityClassificationResult {
    const evaluatedAt = new Date().toISOString();

    if (hasCrisis) {
      return {
        priority: IntakePriority.CRITICAL,
        score: 100,
        slaHours: 0.5, // 30 minutos
        rationale: 'Situação de crise grave ou emergência com risco à integridade física/psíquica.',
        evaluatedAt,
      };
    }

    const calculatedScore = Math.min(
      95,
      vulnerabilityIndex * 2 + clinicalFactorsCount * 10 + psychosocialFactorsCount * 8,
    );

    let priority = IntakePriority.ROUTINE;
    let slaHours = 120; // 5 dias

    if (calculatedScore >= 75) {
      priority = IntakePriority.EMERGENCY;
      slaHours = 2;
    } else if (calculatedScore >= 55) {
      priority = IntakePriority.URGENT;
      slaHours = 24;
    } else if (calculatedScore >= 35) {
      priority = IntakePriority.PRIORITY;
      slaHours = 48;
    }

    this.logger.log(
      `[PriorityClassification] Prioridade atribuída: ${priority} (Score: ${calculatedScore}, SLA: ${slaHours}h)`,
    );

    return {
      priority,
      score: calculatedScore,
      slaHours,
      rationale: `Classificação calculada com base na vulnerabilidade (${vulnerabilityIndex}) e fatores clínicos/sociais.`,
      evaluatedAt,
    };
  }
}
