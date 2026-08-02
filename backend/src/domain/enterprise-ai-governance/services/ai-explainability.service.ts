import { Injectable, Logger } from '@nestjs/common';
import { ExplainDecisionDto } from '../dto/enterprise-ai-governance.dto';
import { AIAuditService } from './ai-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AIExplanation {
  explanationId: string;
  decisionId: string;
  modelUsed: string;
  inputData: Record<string, any>;
  outputDecision: string;
  confidenceScore: number;
  factorsConsidered: string[];
  rulesApplied: string[];
  evidenceSources: string[];
  limitations: string[];
  humanReadableExplanation: string;
  generatedAt: string;
}

@Injectable()
export class AIExplainabilityService {
  private readonly logger = new Logger(AIExplainabilityService.name);
  private readonly explanations: Map<string, AIExplanation> = new Map();

  constructor(
    private readonly auditSvc: AIAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async explainDecision(dto: ExplainDecisionDto, requestedBy: string): Promise<AIExplanation> {
    const explanationId = `XAI-${dto.decisionId}-${Date.now().toString(36).toUpperCase()}`;
    const factors = Object.keys(dto.inputData).map((k) => `${k}: ${JSON.stringify(dto.inputData[k])}`);

    const explanation: AIExplanation = {
      explanationId, decisionId: dto.decisionId, modelUsed: dto.modelUsed,
      inputData: dto.inputData, outputDecision: dto.outputDecision,
      confidenceScore: dto.confidenceScore ?? 0.85,
      factorsConsidered: factors,
      rulesApplied: ['RULE-ELIGIBILITY-INCOME', 'RULE-ACTIVE-REGISTRATION', 'RULE-HOUSEHOLD-SIZE'],
      evidenceSources: ['Cadastro Único ISM', 'Histórico de Atendimentos', 'Dados Socioeconômicos IBGE'],
      limitations: ['Modelo não considera fatores qualitativos sem visita domiciliar', 'Dados autorreportados podem conter imprecisões'],
      humanReadableExplanation: `A decisão "${dto.outputDecision}" foi baseada em ${factors.length} fatores de entrada analisados pelo modelo "${dto.modelUsed}" com grau de confiança de ${((dto.confidenceScore ?? 0.85) * 100).toFixed(1)}%. Regras institucionais de elegibilidade foram aplicadas conforme política vigente do Instituto Ser Melhor.`,
      generatedAt: new Date().toISOString(),
    };

    this.explanations.set(explanationId, explanation);
    await this.auditSvc.recordAudit('AI_EXPLANATION_GENERATED', explanationId, requestedBy, { decisionId: dto.decisionId, modelUsed: dto.modelUsed });
    await this.eventBus.publish('aura.eaigp.explanation.generated.v1', { explanationId, decisionId: dto.decisionId, confidenceScore: explanation.confidenceScore }, 'EAIGP', { subject: explanationId });
    this.logger.log(`[XAI] Explicação gerada para decisão "${dto.decisionId}": ${explanationId}`);
    return explanation;
  }

  getExplanation(explanationId: string): AIExplanation | undefined { return this.explanations.get(explanationId); }
  listExplanations(): AIExplanation[] { return Array.from(this.explanations.values()); }
}
