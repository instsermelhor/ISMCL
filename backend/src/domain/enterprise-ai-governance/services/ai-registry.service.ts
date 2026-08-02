import { Injectable, Logger } from '@nestjs/common';
import { RegisterAIAssetDto, AIAssetType, AIAssetLifecycle } from '../dto/enterprise-ai-governance.dto';
import { AIAuditService } from './ai-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AIAssetRecord {
  assetId: string;
  name: string;
  type: AIAssetType;
  version: string;
  owner: string;
  description: string;
  consumers: string[];
  lifecycle: AIAssetLifecycle;
  registeredAt: string;
  updatedAt: string;
}

@Injectable()
export class AIRegistryService {
  private readonly logger = new Logger(AIRegistryService.name);
  private readonly registry: Map<string, AIAssetRecord> = new Map();

  constructor(
    private readonly auditSvc: AIAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerAsset(dto: RegisterAIAssetDto, registeredBy: string): Promise<AIAssetRecord> {
    const record: AIAssetRecord = {
      assetId: dto.assetId,
      name: dto.name,
      type: dto.type,
      version: dto.version,
      owner: dto.owner,
      description: dto.description ?? '',
      consumers: dto.consumers ?? [],
      lifecycle: AIAssetLifecycle.DRAFT,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.registry.set(dto.assetId, record);

    await this.auditSvc.recordAudit('AI_ASSET_REGISTERED', dto.assetId, registeredBy, { type: dto.type, version: dto.version });
    await this.eventBus.publish('aura.eaigp.model.registered.v1', { assetId: dto.assetId, name: dto.name, type: dto.type, version: dto.version }, 'EAIGP', { subject: dto.assetId });

    this.logger.log(`[AIRegistry] Ativo de IA registrado: "${dto.name}" (${dto.assetId}) — Tipo: ${dto.type}`);
    return record;
  }

  async approveAsset(assetId: string, approvedBy: string): Promise<AIAssetRecord> {
    const asset = this.getOrThrow(assetId);
    asset.lifecycle = AIAssetLifecycle.HOMOLOGATED;
    asset.updatedAt = new Date().toISOString();
    await this.auditSvc.recordAudit('AI_ASSET_APPROVED', assetId, approvedBy, {});
    await this.eventBus.publish('aura.eaigp.model.approved.v1', { assetId, lifecycle: asset.lifecycle }, 'EAIGP', { subject: assetId });
    return asset;
  }

  async publishAsset(assetId: string, publishedBy: string): Promise<AIAssetRecord> {
    const asset = this.getOrThrow(assetId);
    if (asset.lifecycle !== AIAssetLifecycle.HOMOLOGATED) throw new Error(`Ativo "${assetId}" deve estar HOMOLOGATED para publicação.`);
    asset.lifecycle = AIAssetLifecycle.PUBLISHED;
    asset.updatedAt = new Date().toISOString();
    await this.auditSvc.recordAudit('AI_ASSET_PUBLISHED', assetId, publishedBy, { version: asset.version });
    await this.eventBus.publish('aura.eaigp.model.published.v1', { assetId, version: asset.version }, 'EAIGP', { subject: assetId });
    this.logger.log(`[AIRegistry] ✅ Ativo "${assetId}" publicado em produção.`);
    return asset;
  }

  async deprecateAsset(assetId: string, deprecatedBy: string, reason: string): Promise<AIAssetRecord> {
    const asset = this.getOrThrow(assetId);
    asset.lifecycle = AIAssetLifecycle.DEPRECATED;
    asset.updatedAt = new Date().toISOString();
    await this.auditSvc.recordAudit('AI_ASSET_DEPRECATED', assetId, deprecatedBy, { reason });
    return asset;
  }

  getAsset(assetId: string): AIAssetRecord | undefined { return this.registry.get(assetId); }

  listAssets(type?: AIAssetType): AIAssetRecord[] {
    const all = Array.from(this.registry.values());
    return type ? all.filter((a) => a.type === type) : all;
  }

  private getOrThrow(assetId: string): AIAssetRecord {
    const a = this.registry.get(assetId);
    if (!a) throw new Error(`Ativo de IA "${assetId}" não encontrado.`);
    return a;
  }
}
