import { Injectable, Logger } from '@nestjs/common';
import { AutomateDecisionDto, DecisionOutcome } from '../dto/enterprise-hyperautomation.dto';
import { AutomationAuditService } from './automation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface DecisionRecord {
  decisionId: string;
  decisionName: string;
  outcome: DecisionOutcome;
  explanation: string;
  ruleSetId?: string;
  confidenceScore: number; // 0-100
  contextData: Record<string, any>;
  appliedRules: string[];
  decidedAt: string;
}

/**
 * DecisionAutomationService — P174 EHCOP
 *
 * Automação de Decisões Institucionais.
 * Executa decisões baseadas em regras, modelos analíticos e IA.
 * Toda decisão é explicável (XAI), auditável e pode ser escalonada
 * para revisão humana quando o contexto exigir julgamento qualitativo.
 */
@Injectable()
export class DecisionAutomationService {
  private readonly logger = new Logger(DecisionAutomationService.name);
  private readonly decisions: Map<string, DecisionRecord> = new Map();

  constructor(
    private readonly auditSvc: AutomationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async automateDecision(dto: AutomateDecisionDto, requestedBy: string): Promise<DecisionRecord> {
    // Motor de decisão baseado em regras institucionais
    const { outcome, explanation, appliedRules, confidence } = this.evaluateRules(dto);

    const record: DecisionRecord = {
      decisionId: dto.decisionId,
      decisionName: dto.decisionName,
      outcome,
      explanation,
      ruleSetId: dto.ruleSetId,
      confidenceScore: confidence,
      contextData: dto.contextData,
      appliedRules,
      decidedAt: new Date().toISOString(),
    };

    this.decisions.set(dto.decisionId, record);

    await this.auditSvc.recordAudit('DECISION_AUTOMATED', dto.decisionId, requestedBy, {
      outcome,
      confidence,
      appliedRules,
    });

    await this.eventBus.publish(
      'aura.ehcop.decision.automated.v1',
      { decisionId: dto.decisionId, decisionName: dto.decisionName, outcome, confidenceScore: confidence },
      'EHCOP',
      { subject: dto.decisionId },
    );

    this.logger.log(`[DecisionAutomation] ⚖️ Decisão "${dto.decisionName}": ${outcome} (Confiança: ${confidence}%)`);
    return record;
  }

  private evaluateRules(dto: AutomateDecisionDto): { outcome: DecisionOutcome; explanation: string; appliedRules: string[]; confidence: number } {
    const { contextData } = dto;

    // Exemplo: Elegibilidade de Benefício
    if (contextData.monthlyIncome !== undefined) {
      const income = Number(contextData.monthlyIncome);
      const household = Number(contextData.householdSize ?? 1);
      const perCapita = income / household;
      const activeReg = contextData.activeRegistration === true;

      if (!activeReg) {
        return { outcome: DecisionOutcome.REJECTED, explanation: 'Cadastro inativo no sistema.', appliedRules: ['RULE-ACTIVE-REGISTRATION'], confidence: 99 };
      }
      if (perCapita <= 218) { // linha de extrema pobreza
        return { outcome: DecisionOutcome.APPROVED, explanation: `Renda per capita de R$ ${perCapita.toFixed(2)} abaixo do limiar de elegibilidade.`, appliedRules: ['RULE-EXTREME-POVERTY', 'RULE-HOUSEHOLD-SIZE'], confidence: 95 };
      }
      if (perCapita <= 500) {
        return { outcome: DecisionOutcome.ESCALATED_HUMAN, explanation: `Renda per capita R$ ${perCapita.toFixed(2)} — zona limítrofe requer análise social.`, appliedRules: ['RULE-BORDERLINE-INCOME'], confidence: 62 };
      }
      return { outcome: DecisionOutcome.REJECTED, explanation: `Renda per capita R$ ${perCapita.toFixed(2)} acima do limiar permitido.`, appliedRules: ['RULE-INCOME-THRESHOLD'], confidence: 93 };
    }

    // Default: escalar para humano
    return { outcome: DecisionOutcome.ESCALATED_HUMAN, explanation: 'Dados insuficientes para decisão automatizada.', appliedRules: ['RULE-INSUFFICIENT-CONTEXT'], confidence: 30 };
  }

  getDecision(decisionId: string): DecisionRecord | undefined {
    return this.decisions.get(decisionId);
  }

  listDecisions(): DecisionRecord[] {
    return Array.from(this.decisions.values());
  }
}
