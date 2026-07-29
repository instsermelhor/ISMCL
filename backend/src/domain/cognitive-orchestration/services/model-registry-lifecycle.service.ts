import { Injectable, Logger } from '@nestjs/common';
import { ModelLifecycleState, ModelRegistrationDto } from '../dto/cognitive-orchestration.dto';
import { CognitiveAuditService } from './cognitive-audit.service';
import { EventBusService } from '../../../core/event-bus/event-bus.service';

export interface RegisteredModelRecord {
  modelId: string;
  modelName: string;
  version: string;
  targetDomain: string;
  framework: string;
  state: ModelLifecycleState;
  accuracy: number;
  f1Score: number;
  registeredAt: string;
  deployedAt?: string;
  retiredAt?: string;
  humanApproverId?: string;
}

@Injectable()
export class ModelRegistryLifecycleService {
  private readonly logger = new Logger(ModelRegistryLifecycleService.name);
  private modelRegistry: Map<string, RegisteredModelRecord> = new Map();

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedDefaultModels();
  }

  private seedDefaultModels() {
    const defaultModels: RegisteredModelRecord[] = [
      {
        modelId: 'MOD-CLINICAL-BERT-V1',
        modelName: 'aura-clinical-bert',
        version: '1.0.0',
        targetDomain: 'PSYCHIATRY',
        framework: 'PyTorch / HuggingFace',
        state: ModelLifecycleState.DEPLOYED,
        accuracy: 0.95,
        f1Score: 0.94,
        registeredAt: new Date().toISOString(),
        deployedAt: new Date().toISOString(),
        humanApproverId: 'CISO-ADMIN-01',
      },
      {
        modelId: 'MOD-LEGAL-LLM-V2',
        modelName: 'aura-legal-analyzer',
        version: '2.0.0',
        targetDomain: 'LEGAL',
        framework: 'Llama-3-70B-Instruct-FineTuned',
        state: ModelLifecycleState.DEPLOYED,
        accuracy: 0.96,
        f1Score: 0.95,
        registeredAt: new Date().toISOString(),
        deployedAt: new Date().toISOString(),
        humanApproverId: 'LEGAL-HEAD-01',
      },
    ];

    for (const model of defaultModels) {
      this.modelRegistry.set(model.modelId, model);
    }
  }

  registerModel(dto: ModelRegistrationDto): RegisteredModelRecord {
    const modelId = `MOD-${dto.modelName.toUpperCase()}-${Date.now().toString(36)}`;

    const record: RegisteredModelRecord = {
      modelId,
      modelName: dto.modelName,
      version: dto.version,
      targetDomain: dto.targetDomain,
      framework: dto.framework,
      state: ModelLifecycleState.REGISTERED,
      accuracy: dto.accuracy,
      f1Score: dto.f1Score,
      registeredAt: new Date().toISOString(),
    };

    this.modelRegistry.set(modelId, record);
    this.auditService.logAudit('ModelRegistered', 'RegisterModel', { modelId, modelName: dto.modelName, version: dto.version });

    return record;
  }

  transitionState(modelId: string, newState: ModelLifecycleState, humanApproverId?: string): RegisteredModelRecord {
    const model = this.modelRegistry.get(modelId);
    if (!model) {
      throw new Error(`Modelo não encontrado no registro: ${modelId}`);
    }

    const previousState = model.state;
    model.state = newState;

    if (newState === ModelLifecycleState.DEPLOYED) {
      model.deployedAt = new Date().toISOString();
      model.humanApproverId = humanApproverId || 'SUPER-ADMIN';
    } else if (newState === ModelLifecycleState.RETIRED) {
      model.retiredAt = new Date().toISOString();
    }

    this.modelRegistry.set(modelId, model);

    this.auditService.logAudit(
      'ModelLifecycleTransition',
      `Transition ${previousState} -> ${newState}`,
      { modelId, previousState, newState, humanApproverId },
      undefined,
      modelId,
      humanApproverId,
    );

    this.eventBus.publish({
      id: `EVT-MOD-${Date.now()}`,
      source: 'aura/cognitive-orchestration/model-lifecycle',
      type: 'aura.cognitive.model.transitioned.v1',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { modelId, previousState, newState, humanApproverId },
    });

    return model;
  }

  listModels(): RegisteredModelRecord[] {
    return Array.from(this.modelRegistry.values());
  }

  getModel(modelId: string): RegisteredModelRecord | undefined {
    return this.modelRegistry.get(modelId);
  }
}
