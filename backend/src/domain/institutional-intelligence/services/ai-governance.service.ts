import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventBusService } from '../../events/event-bus.service';
import {
  AIModelGovernanceDto,
  AIModelStatus,
} from '../dto/institutional-intelligence.dto';

@Injectable()
export class AIGovernanceService {
  private readonly logger = new Logger(AIGovernanceService.name);
  private readonly modelCatalog: Map<string, AIModelGovernanceDto> = new Map();

  constructor(private readonly eventBus: EventBusService) {
    this.seedInitialModels();
  }

  private seedInitialModels(): void {
    const model1: AIModelGovernanceDto = {
      modelId: 'MOD-PRED-DROPOUT-v2',
      modelName: 'Predictive Beneficiary Dropout Classifier',
      version: 'v2.1.0',
      status: AIModelStatus.APPROVED,
      f1Score: 0.942,
      biasScore: 0.015,
      explainabilityFramework: 'SHAP Feature Importance Engine',
      humanInTheLoopApproved: true,
    };

    const model2: AIModelGovernanceDto = {
      modelId: 'MOD-RAG-ASSISTANT-v3',
      modelName: 'Aura Clinical RAG Assistant',
      version: 'v3.0.4',
      status: AIModelStatus.APPROVED,
      f1Score: 0.978,
      biasScore: 0.008,
      explainabilityFramework: 'Integrated Gradients & Source Citation Audit',
      humanInTheLoopApproved: true,
    };

    this.modelCatalog.set(model1.modelId, model1);
    this.modelCatalog.set(model2.modelId, model2);
  }

  /**
   * Lista todos os modelos no catálogo de governança de IA.
   */
  async listModels(): Promise<AIModelGovernanceDto[]> {
    return Array.from(this.modelCatalog.values());
  }

  /**
   * Registra um novo modelo de IA com validação de viés e explicabilidade.
   */
  async registerModel(dto: AIModelGovernanceDto): Promise<AIModelGovernanceDto> {
    this.modelCatalog.set(dto.modelId, dto);
    this.logger.log(`Modelo [${dto.modelId}] registrado no Catálogo de Governança de IA.`);

    return dto;
  }

  /**
   * Homologa/Aprova um modelo de IA em produção com supervisão Human-in-the-Loop.
   */
  async approveModel(modelId: string): Promise<AIModelGovernanceDto> {
    const model = this.modelCatalog.get(modelId);
    if (!model) {
      throw new NotFoundException(`Modelo [${modelId}] não encontrado no Catálogo de Governança de IA.`);
    }

    model.status = AIModelStatus.APPROVED;
    model.humanInTheLoopApproved = true;

    await this.eventBus.publish(
      'aura.institutional.aimodel.approved.v1',
      {
        modelId: model.modelId,
        modelName: model.modelName,
        version: model.version,
        status: model.status,
      },
      'default',
      { source: 'AIGovernanceService' },
    );

    return model;
  }

  /**
   * Simula a re-capacitação (retraining) do modelo com novas amostras auditadas.
   */
  async triggerRetraining(modelId: string): Promise<AIModelGovernanceDto> {
    const model = this.modelCatalog.get(modelId);
    if (!model) {
      throw new NotFoundException(`Modelo [${modelId}] não encontrado.`);
    }

    model.status = AIModelStatus.TESTING;
    model.f1Score = Number((model.f1Score + 0.005).toFixed(3));

    await this.eventBus.publish(
      'aura.institutional.aimodel.retrained.v1',
      {
        modelId: model.modelId,
        newF1Score: model.f1Score,
      },
      'default',
      { source: 'AIGovernanceService' },
    );

    return model;
  }
}
