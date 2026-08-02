import { Injectable, Logger } from '@nestjs/common';
import { CreateAdrDto, AdrStatus } from '../dto/enterprise-architecture.dto';
import { ArchitectureAuditService } from './architecture-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ADRRecord {
  adrId: string;
  title: string;
  context: string;
  problemStatement: string;
  alternativesEvaluated: string[];
  decision: string;
  justification: string;
  impacts: string[];
  status: AdrStatus;
  author: string;
  supersededBy?: string;
  affectedComponents: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * ArchitectureDecisionRecordService — P171 EAGO
 *
 * Gestão corporativa de ADRs (Architecture Decision Records).
 * Registra decisões arquiteturais com contexto, problemas, alternativas avaliadas,
 * justificativas técnicas, impactos e vínculo direto com os componentes do sistema.
 */
@Injectable()
export class ArchitectureDecisionRecordService {
  private readonly logger = new Logger(ArchitectureDecisionRecordService.name);
  private readonly adrStore: Map<string, ADRRecord> = new Map();

  constructor(
    private readonly auditSvc: ArchitectureAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async createAdr(dto: CreateAdrDto, createdBy = 'SYSTEM'): Promise<ADRRecord> {
    const adrId = `ADR-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const record: ADRRecord = {
      adrId,
      title: dto.title,
      context: dto.context,
      problemStatement: dto.problemStatement,
      alternativesEvaluated: dto.alternativesEvaluated ?? [],
      decision: dto.decision,
      justification: dto.justification,
      impacts: dto.impacts ?? [],
      status: AdrStatus.PROPOSED,
      author: dto.author ?? createdBy,
      affectedComponents: [],
      createdAt: now,
      updatedAt: now,
    };

    this.adrStore.set(adrId, record);

    await this.auditSvc.recordAudit('ADR_CREATED', adrId, createdBy, {
      title: dto.title,
      decision: dto.decision,
    });

    await this.eventBus.publish(
      'aura.eago.adr.created.v1',
      { adrId, title: dto.title, status: record.status, author: record.author },
      'EAGO',
      { subject: adrId },
    );

    this.logger.log(`[ADRService] ADR "${adrId}" criado: "${dto.title}"`);
    return record;
  }

  async acceptAdr(adrId: string, acceptedBy: string, affectedComponents: string[] = []): Promise<ADRRecord> {
    const adr = this.getOrThrow(adrId);
    adr.status = AdrStatus.ACCEPTED;
    adr.affectedComponents = affectedComponents;
    adr.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('ADR_ACCEPTED', adrId, acceptedBy, { affectedComponents });
    await this.eventBus.publish('aura.eago.adr.updated.v1', { adrId, status: adr.status }, 'EAGO', { subject: adrId });

    this.logger.log(`[ADRService] ADR "${adrId}" aceito por ${acceptedBy}.`);
    return adr;
  }

  async supersedeAdr(oldAdrId: string, newAdrId: string, supersededBy: string): Promise<ADRRecord> {
    const oldAdr = this.getOrThrow(oldAdrId);
    oldAdr.status = AdrStatus.SUPERSEDED;
    oldAdr.supersededBy = newAdrId;
    oldAdr.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('ADR_SUPERSEDED', oldAdrId, supersededBy, { newAdrId });
    this.logger.log(`[ADRService] ADR "${oldAdrId}" substituído pelo ADR "${newAdrId}".`);
    return oldAdr;
  }

  getAdr(adrId: string): ADRRecord | undefined {
    return this.adrStore.get(adrId);
  }

  listAdrs(status?: AdrStatus): ADRRecord[] {
    const all = Array.from(this.adrStore.values());
    return status ? all.filter((a) => a.status === status) : all;
  }

  private getOrThrow(adrId: string): ADRRecord {
    const a = this.adrStore.get(adrId);
    if (!a) throw new Error(`ADR "${adrId}" não encontrado.`);
    return a;
  }
}
