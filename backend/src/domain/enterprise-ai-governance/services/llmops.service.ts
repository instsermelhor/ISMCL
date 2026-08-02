import { Injectable, Logger } from '@nestjs/common';
import { AIAuditService } from './ai-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface LLMConfiguration {
  configId: string;
  modelId: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  contextWindowSize: number;
  memoryEnabled: boolean;
  tools: string[];
  rateLimitRpm: number;
  costPerMillionTokens: number;
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING';
  updatedAt: string;
}

@Injectable()
export class LLMOpsService {
  private readonly logger = new Logger(LLMOpsService.name);
  private readonly configs: Map<string, LLMConfiguration> = new Map();

  constructor(
    private readonly auditSvc: AIAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async configureLLM(
    modelId: string, provider: string, temperature: number, maxTokens: number,
    contextWindowSize: number, memoryEnabled: boolean, tools: string[],
    rateLimitRpm: number, costPerMillionTokens: number, configuredBy: string,
  ): Promise<LLMConfiguration> {
    const configId = `LLMCFG-${modelId}-${Date.now().toString(36).toUpperCase()}`;
    const config: LLMConfiguration = {
      configId, modelId, provider, temperature, maxTokens, contextWindowSize,
      memoryEnabled, tools, rateLimitRpm, costPerMillionTokens, status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };
    this.configs.set(configId, config);
    await this.auditSvc.recordAudit('LLM_CONFIGURED', configId, configuredBy, { modelId, provider, temperature });
    this.logger.log(`[LLMOps] LLM configurado: ${modelId} (Provider: ${provider}, Temp: ${temperature})`);
    return config;
  }

  async switchProvider(configId: string, newProvider: string, switchedBy: string): Promise<LLMConfiguration> {
    const cfg = this.configs.get(configId);
    if (!cfg) throw new Error(`Configuração LLM "${configId}" não encontrada.`);
    const oldProvider = cfg.provider;
    cfg.provider = newProvider;
    cfg.updatedAt = new Date().toISOString();
    await this.auditSvc.recordAudit('LLM_PROVIDER_SWITCHED', configId, switchedBy, { oldProvider, newProvider });
    this.logger.log(`[LLMOps] Provider alterado: ${oldProvider} → ${newProvider} (${configId})`);
    return cfg;
  }

  getConfig(configId: string): LLMConfiguration | undefined { return this.configs.get(configId); }
  listConfigs(): LLMConfiguration[] { return Array.from(this.configs.values()); }
}
