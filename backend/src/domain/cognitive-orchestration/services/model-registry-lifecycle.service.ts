import { Injectable, Logger } from '@nestjs/common';
import { ModelLifecycleState, ModelRegistrationDto, RegisterModelDto, ModelStatus } from '../dto/cognitive-orchestration.dto';
import { CognitiveAuditService } from './cognitive-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

// ── INTERFACES ────────────────────────────────────────────────────────────────

export interface RegisteredModelRecord {
  modelId: string;
  modelName: string;
  provider?: string;
  version: string;
  targetDomain: string;
  domainCategory?: string;
  framework?: string;
  capabilities?: string[];
  state: ModelLifecycleState;
  status: ModelStatus;
  accuracy?: number;
  f1Score?: number;
  artifactUrl?: string;
  checksumSha256?: string;
  costPer1kTokensBrl?: number;
  registeredAt: string;
  deployedAt?: string;
  retiredAt?: string;
  humanApproverId?: string;
}

// ── SERVICE ───────────────────────────────────────────────────────────────────

/**
 * ModelRegistryLifecycleService — Gestão do Ciclo de Vida de Modelos (P152 ACOP)
 *
 * Controla registro, treinamento, versionamento, homologação, implantação,
 * monitoramento, aposentadoria e substituição de modelos de IA.
 *
 * Referências: P111 (AEAIP), P152 (ACOP), ADR-152
 */
@Injectable()
export class ModelRegistryLifecycleService {
  private readonly logger = new Logger(ModelRegistryLifecycleService.name);
  private modelRegistry: Map<string, RegisteredModelRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedDefaultModels();
  }

  private seedDefaultModels(): void {
    const defaults: RegisteredModelRecord[] = [
      {
        modelId: 'MOD-CLINICAL-BERT-V1',
        modelName: 'aura-clinical-bert',
        provider: 'HuggingFace',
        version: '1.0.0',
        targetDomain: 'PSYCHIATRY',
        domainCategory: 'Avaliação Psiquiátrica e Triagem de Risco',
        framework: 'PyTorch / HuggingFace',
        capabilities: ['psychiatric_evaluation', 'risk_assessment', 'phq9_scoring'],
        state: ModelLifecycleState.DEPLOYED,
        status: ModelStatus.PRODUCTION,
        accuracy: 0.95,
        f1Score: 0.94,
        costPer1kTokensBrl: 0.004,
        registeredAt: new Date().toISOString(),
        deployedAt: new Date().toISOString(),
        humanApproverId: 'CISO-ADMIN-01',
      },
      {
        modelId: 'MOD-LEGAL-LLM-V2',
        modelName: 'aura-legal-analyzer',
        provider: 'Meta',
        version: '2.0.0',
        targetDomain: 'LEGAL',
        domainCategory: 'Análise Jurídica e Compliance',
        framework: 'Llama-3-70B-Instruct-FineTuned',
        capabilities: ['legal_advice', 'contract_review', 'compliance_check'],
        state: ModelLifecycleState.DEPLOYED,
        status: ModelStatus.PRODUCTION,
        accuracy: 0.96,
        f1Score: 0.95,
        costPer1kTokensBrl: 0.005,
        registeredAt: new Date().toISOString(),
        deployedAt: new Date().toISOString(),
        humanApproverId: 'LEGAL-HEAD-01',
      },
      {
        modelId: 'MOD-TRIAGE-V21',
        modelName: 'aura-triage-classifier',
        provider: 'Local-Ollama-FineTuned',
        version: '2.1.0',
        targetDomain: 'CASE_MANAGEMENT',
        domainCategory: 'Triagem e Classificação de Risco',
        framework: 'Ollama / Mistral-7B-FineTuned',
        capabilities: ['screening', 'triage', 'phq9_scoring', 'risk_classification'],
        state: ModelLifecycleState.HOMOLOGATING,
        status: ModelStatus.STAGING,
        accuracy: 0.93,
        f1Score: 0.92,
        costPer1kTokensBrl: 0.002,
        registeredAt: new Date().toISOString(),
        humanApproverId: undefined,
      },
    ];

    for (const model of defaults) {
      this.modelRegistry.set(model.modelId, model);
    }
  }

  // ── Método principal P152 (assinatura do spec — RegisterModelDto) ────────────

  /**
   * Registra um novo modelo no catálogo corporativo.
   * Aceita tanto ModelRegistrationDto (legado) quanto RegisterModelDto (spec P152).
   */
  async registerModel(dto: RegisterModelDto | ModelRegistrationDto): Promise<RegisteredModelRecord> {
    const isNewFormat = 'provider' in dto && 'domainCategory' in dto;
    const modelName = dto.modelName;
    const version = dto.version;
    const seq = Date.now().toString(36).toUpperCase();
    const modelId = `MOD-${modelName.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-${seq}`;

    const record: RegisteredModelRecord = {
      modelId,
      modelName,
      version,
      provider: isNewFormat ? (dto as RegisterModelDto).provider : undefined,
      targetDomain: isNewFormat ? (dto as RegisterModelDto).domainCategory : (dto as ModelRegistrationDto).targetDomain,
      domainCategory: isNewFormat ? (dto as RegisterModelDto).domainCategory : undefined,
      framework: isNewFormat ? undefined : (dto as ModelRegistrationDto).framework,
      capabilities: isNewFormat ? (dto as RegisterModelDto).capabilities : [],
      state: ModelLifecycleState.REGISTERED,
      status: ModelStatus.STAGING,
      accuracy: isNewFormat ? undefined : (dto as ModelRegistrationDto).accuracy,
      f1Score: isNewFormat ? undefined : (dto as ModelRegistrationDto).f1Score,
      artifactUrl: isNewFormat ? (dto as RegisterModelDto).artifactUrl : undefined,
      checksumSha256: isNewFormat ? (dto as RegisterModelDto).checksumSha256 : undefined,
      costPer1kTokensBrl: isNewFormat ? (dto as RegisterModelDto).costPer1kTokensBrl : undefined,
      registeredAt: new Date().toISOString(),
    };

    this.modelRegistry.set(modelId, record);

    this.auditService.logAudit('ModelRegistered', 'RegisterModel', {
      modelId,
      modelName,
      version,
      domainCategory: record.targetDomain,
    });

    await this.eventBus.publish(
      'aura.cognitive.model.registered.v1',
      { modelId, modelName, version, status: record.status },
      this.SYSTEM_TENANT,
      { subject: modelId },
    );

    this.logger.log(`[ModelRegistry] Registered: ${modelId} (${modelName} v${version}) → STAGING`);
    return record;
  }

  /**
   * Promove um modelo para um novo status (STAGING → PRODUCTION etc.).
   * Compatível com a assinatura do spec P152.
   */
  async promoteModel(modelId: string, newStatus: ModelStatus, humanApproverId?: string): Promise<RegisteredModelRecord> {
    const model = this.modelRegistry.get(modelId);
    if (!model) {
      throw new Error(`Modelo não encontrado no registro: ${modelId}`);
    }

    const previousStatus = model.status;
    model.status = newStatus;

    if (newStatus === ModelStatus.PRODUCTION) {
      model.state = ModelLifecycleState.DEPLOYED;
      model.deployedAt = new Date().toISOString();
      model.humanApproverId = humanApproverId || 'SUPER-ADMIN';
    } else if (newStatus === ModelStatus.RETIRED) {
      model.state = ModelLifecycleState.RETIRED;
      model.retiredAt = new Date().toISOString();
    } else if (newStatus === ModelStatus.DEPRECATED) {
      model.state = ModelLifecycleState.REPLACED;
    }

    this.modelRegistry.set(modelId, model);

    this.auditService.logAudit(
      'ModelPromoted',
      `Promote ${previousStatus} → ${newStatus}`,
      { modelId, previousStatus, newStatus, humanApproverId },
      undefined,
      modelId,
      humanApproverId,
    );

    await this.eventBus.publish(
      'aura.cognitive.model.transitioned.v1',
      { modelId, previousStatus, newStatus, humanApproverId },
      this.SYSTEM_TENANT,
      { subject: modelId },
    );

    this.logger.log(`[ModelRegistry] Promoted: ${modelId} ${previousStatus} → ${newStatus}`);
    return model;
  }

  /**
   * @deprecated Usar promoteModel() — mantido para backward-compat.
   */
  transitionState(
    modelId: string,
    newState: ModelLifecycleState,
    humanApproverId?: string,
  ): RegisteredModelRecord {
    const model = this.modelRegistry.get(modelId);
    if (!model) {
      throw new Error(`Modelo não encontrado no registro: ${modelId}`);
    }

    const previousState = model.state;
    model.state = newState;

    if (newState === ModelLifecycleState.DEPLOYED) {
      model.deployedAt = new Date().toISOString();
      model.humanApproverId = humanApproverId || 'SUPER-ADMIN';
      model.status = ModelStatus.PRODUCTION;
    } else if (newState === ModelLifecycleState.RETIRED) {
      model.retiredAt = new Date().toISOString();
      model.status = ModelStatus.RETIRED;
    }

    this.modelRegistry.set(modelId, model);

    this.auditService.logAudit(
      'ModelLifecycleTransition',
      `Transition ${previousState} → ${newState}`,
      { modelId, previousState, newState, humanApproverId },
      undefined,
      modelId,
      humanApproverId,
    );

    this.eventBus
      .publish(
        'aura.cognitive.model.transitioned.v1',
        { modelId, previousState, newState, humanApproverId },
        this.SYSTEM_TENANT,
      )
      .catch((e) => this.logger.error(e));

    return model;
  }

  listModels(): RegisteredModelRecord[] {
    return Array.from(this.modelRegistry.values());
  }

  getModel(modelId: string): RegisteredModelRecord | undefined {
    return this.modelRegistry.get(modelId);
  }
}
