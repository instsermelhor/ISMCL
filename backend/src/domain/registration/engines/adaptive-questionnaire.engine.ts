import { Injectable, Logger } from '@nestjs/common';

export interface QuestionOption {
  value: string;
  label: string;
  nextQuestionId?: string;
  triggersVulnerabilityAlert?: boolean;
}

export interface Question {
  id: string;
  code: string;
  statement: string;
  category: 'CLINICAL' | 'PSYCHOSOCIAL' | 'HOUSING' | 'EMPLOYMENT' | 'SECURITY';
  minAge?: number;
  maxAge?: number;
  targetGender?: 'MALE' | 'FEMALE' | 'ALL';
  options: QuestionOption[];
}

export interface AdaptiveFlowResult {
  nextQuestion: Question | null;
  completionPercentage: number;
  flaggedVulnerabilities: string[];
  isCompleted: boolean;
}

/**
 * AdaptiveQuestionnaireEngine — Motor Inteligente de Questionários Adaptativos
 *
 * Constrói a sequência de perguntas dinamicamente em tempo real com base no
 * perfil demográfico (idade, gênero), programa social e nas respostas anteriores.
 *
 * Referências: P110 (AEWBPM), P133 (AAIRP Etapa 4)
 */
@Injectable()
export class AdaptiveQuestionnaireEngine {
  private readonly logger = new Logger(AdaptiveQuestionnaireEngine.name);

  private readonly questionBank: Question[] = [
    {
      id: 'q-moradia',
      code: 'HOUSING_01',
      statement: 'Qual é o tipo de moradia da sua família?',
      category: 'HOUSING',
      options: [
        { value: 'PROPRIA', label: 'Própria quitada' },
        { value: 'ALUGADA', label: 'Alugada' },
        { value: 'CEDIDA', label: 'Cedida / Favor' },
        { value: 'OCUPACAO_RISCO', label: 'Área de risco / Invasão', triggersVulnerabilityAlert: true },
        { value: 'SITUACAO_RUA', label: 'Situação de rua', triggersVulnerabilityAlert: true },
      ],
    },
    {
      id: 'q-saude-mental',
      code: 'HEALTH_01',
      statement: 'Alguém na sua residência necessita de acompanhamento contínuo de saúde mental?',
      category: 'CLINICAL',
      options: [
        { value: 'SIM_INTENSO', label: 'Sim, acompanhamento intensivo', triggersVulnerabilityAlert: true },
        { value: 'SIM_EVENTUAL', label: 'Sim, ocasional' },
        { value: 'NAO', label: 'Não' },
      ],
    },
    {
      id: 'q-trabalho-infantil',
      code: 'SECURITY_01',
      statement: 'Existe alguma criança ou adolescente menor de 16 anos trabalhando na família?',
      category: 'SECURITY',
      minAge: 0,
      maxAge: 17,
      options: [
        { value: 'SIM', label: 'Sim', triggersVulnerabilityAlert: true },
        { value: 'NAO', label: 'Não' },
      ],
    },
  ];

  /**
   * Avalia as respostas fornecidas até o momento e determina a próxima pergunta.
   */
  evaluateFlow(
    answersHistory: Record<string, string>,
    userAge?: number,
    userGender?: 'MALE' | 'FEMALE' | 'ALL',
  ): AdaptiveFlowResult {
    const answeredIds = new Set(Object.keys(answersHistory));
    const flaggedVulnerabilities: string[] = [];

    // Identifica alertas de vulnerabilidade nas respostas já dadas
    for (const question of this.questionBank) {
      const selectedValue = answersHistory[question.id];
      if (selectedValue) {
        const option = question.options.find((o) => o.value === selectedValue);
        if (option?.triggersVulnerabilityAlert) {
          flaggedVulnerabilities.push(`${question.code}: ${option.label}`);
        }
      }
    }

    // Filtra perguntas elegíveis pelo perfil demográfico
    const eligibleQuestions = this.questionBank.filter((q) => {
      if (answeredIds.has(q.id)) return false;

      if (userAge !== undefined) {
        if (q.minAge !== undefined && userAge < q.minAge) return false;
        if (q.maxAge !== undefined && userAge > q.maxAge) return false;
      }

      if (userGender && q.targetGender && q.targetGender !== 'ALL' && q.targetGender !== userGender) {
        return false;
      }

      return true;
    });

    const isCompleted = eligibleQuestions.length === 0;
    const nextQuestion = eligibleQuestions[0] ?? null;

    const totalQuestions = this.questionBank.length;
    const answeredCount = answeredIds.size;
    const completionPercentage = Math.min(100, Math.round((answeredCount / totalQuestions) * 100));

    return {
      nextQuestion,
      completionPercentage,
      flaggedVulnerabilities,
      isCompleted,
    };
  }
}
