import { Injectable, Logger } from '@nestjs/common';
import { CreateGoldenRecordDto, ResolveIdentityDto, MasterEntityCategory } from '../dto/enterprise-data.dto';
import { DataGovernanceAuditService } from './data-governance-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface GoldenRecord {
  goldenId: string;
  category: MasterEntityCategory;
  primaryNaturalKey: string;
  goldenAttributes: Record<string, any>;
  sourceSystemIds: string[];
  confidenceScore: number; // 0.0 - 1.0
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface IdentityResolutionResult {
  isMatchFound: boolean;
  goldenId?: string;
  matchConfidence: number;
  recommendedAction: 'LINK' | 'CREATE_NEW' | 'MANUAL_STEWARD_REVIEW';
}

/**
 * MasterDataManagementService — P172 EDGP
 *
 * Gerenciamento de Dados Mestres (MDM).
 * Mantém registros mestres (Golden Records) para beneficiários, profissionais,
 * voluntários, colaboradores, parceiros e projetos. Implementa deduplicação,
 * resolução de identidade probabilística e consolidação da visão única da verdade.
 */
@Injectable()
export class MasterDataManagementService {
  private readonly logger = new Logger(MasterDataManagementService.name);
  private readonly goldenRecords: Map<string, GoldenRecord> = new Map();

  constructor(
    private readonly auditSvc: DataGovernanceAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async createGoldenRecord(dto: CreateGoldenRecordDto, createdBy = 'MDM_ENGINE'): Promise<GoldenRecord> {
    const goldenId = `GOLDEN-${dto.category}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const record: GoldenRecord = {
      goldenId,
      category: dto.category,
      primaryNaturalKey: dto.primaryNaturalKey,
      goldenAttributes: dto.goldenAttributes,
      sourceSystemIds: dto.sourceSystemIds ?? ['PRIMARY'],
      confidenceScore: 1.0,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.goldenRecords.set(goldenId, record);

    await this.auditSvc.recordAudit('MASTER_DATA_CREATED', goldenId, createdBy, {
      category: dto.category,
      naturalKey: dto.primaryNaturalKey,
    });

    await this.eventBus.publish(
      'aura.edgp.master.data.created.v1',
      { goldenId, category: dto.category, primaryNaturalKey: dto.primaryNaturalKey },
      'EDGP',
      { subject: goldenId },
    );

    this.logger.log(`[MDM] Golden Record criado "${goldenId}" (${dto.category}) — Key: ${dto.primaryNaturalKey}`);
    return record;
  }

  async resolveIdentity(dto: ResolveIdentityDto): Promise<IdentityResolutionResult> {
    const candidateCpf = dto.candidateRecord['cpf'] || dto.candidateRecord['primaryNaturalKey'];
    const candidateName = (dto.candidateRecord['fullName'] || dto.candidateRecord['name'] || '').toLowerCase();

    for (const record of this.goldenRecords.values()) {
      if (record.category !== dto.category) continue;

      const recordCpf = record.primaryNaturalKey || record.goldenAttributes['cpf'];
      const recordName = (record.goldenAttributes['fullName'] || record.goldenAttributes['name'] || '').toLowerCase();

      // Match exato por chave natural (CPF/ID)
      if (candidateCpf && recordCpf && candidateCpf.replace(/\D/g, '') === recordCpf.replace(/\D/g, '')) {
        return { isMatchFound: true, goldenId: record.goldenId, matchConfidence: 1.0, recommendedAction: 'LINK' };
      }

      // Match probabilístico por nome
      if (candidateName && recordName && candidateName === recordName) {
        return { isMatchFound: true, goldenId: record.goldenId, matchConfidence: 0.85, recommendedAction: 'LINK' };
      }
    }

    return { isMatchFound: false, matchConfidence: 0.0, recommendedAction: 'CREATE_NEW' };
  }

  async updateGoldenAttributes(goldenId: string, updatedAttributes: Record<string, any>, updatedBy: string): Promise<GoldenRecord> {
    const record = this.getOrThrow(goldenId);
    record.goldenAttributes = { ...record.goldenAttributes, ...updatedAttributes };
    record.version += 1;
    record.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('MASTER_DATA_UPDATED', goldenId, updatedBy, { version: record.version });
    await this.eventBus.publish('aura.edgp.master.data.updated.v1', { goldenId, version: record.version }, 'EDGP', { subject: goldenId });

    this.logger.log(`[MDM] Golden Record "${goldenId}" atualizado para v${record.version}.`);
    return record;
  }

  getGoldenRecord(goldenId: string): GoldenRecord | undefined {
    return this.goldenRecords.get(goldenId);
  }

  listGoldenRecords(category?: MasterEntityCategory): GoldenRecord[] {
    const all = Array.from(this.goldenRecords.values());
    return category ? all.filter((r) => r.category === category) : all;
  }

  private getOrThrow(goldenId: string): GoldenRecord {
    const r = this.goldenRecords.get(goldenId);
    if (!r) throw new Error(`Golden Record "${goldenId}" não encontrado.`);
    return r;
  }
}
