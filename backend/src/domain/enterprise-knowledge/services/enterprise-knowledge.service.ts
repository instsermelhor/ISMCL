import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CreateKnowledgeItemDto,
  UpdateKnowledgeItemDto,
  KnowledgeStatus,
  KnowledgeDomain,
  KnowledgeType,
  ConfidentialityLevel,
} from '../dto/enterprise-knowledge.dto';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface KnowledgeItem {
  knowledgeId: string;
  title: string;
  description: string;
  type: KnowledgeType;
  domain: KnowledgeDomain;
  confidentialityLevel: ConfidentialityLevel;
  status: KnowledgeStatus;
  version: number;
  owner: string;
  tags: string[];
  parentId?: string;
  content?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/**
 * EnterpriseKnowledgeService — Hub Central de Conhecimento (P158 AEKIP)
 *
 * Gerencia o ciclo CRUD completo de todos os ativos de conhecimento:
 * documentos, políticas, normas, POPs, protocolos, artigos, pesquisas,
 * treinamentos, decisões, ADRs e FAQs com metadados completos e
 * versionamento automático a cada atualização.
 */
@Injectable()
export class EnterpriseKnowledgeService {
  private readonly logger = new Logger(EnterpriseKnowledgeService.name);
  private knowledgeRegistry: Map<string, KnowledgeItem> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedKnowledgeBase();
  }

  private seedKnowledgeBase(): void {
    const seeds: CreateKnowledgeItemDto[] = [
      {
        title: 'Protocolo de Atendimento Psicossocial',
        description: 'Diretrizes para atendimento de beneficiários em situação de vulnerabilidade',
        type: KnowledgeType.PROTOCOL,
        domain: KnowledgeDomain.ASSISTENTIAL,
        confidentialityLevel: ConfidentialityLevel.INTERNAL,
        owner: 'Equipe Psicologia',
        tags: ['psicossocial', 'protocolo', 'atendimento'],
      },
      {
        title: 'POP — Cadastro de Novo Beneficiário',
        description: 'Procedimento Operacional Padrão para registro de beneficiários no sistema',
        type: KnowledgeType.POP,
        domain: KnowledgeDomain.OPERATIONAL,
        confidentialityLevel: ConfidentialityLevel.INTERNAL,
        owner: 'Serviço Social',
        tags: ['pop', 'beneficiário', 'cadastro'],
      },
      {
        title: 'Política de Proteção de Dados (LGPD)',
        description: 'Política institucional de privacidade e proteção de dados pessoais',
        type: KnowledgeType.POLICY,
        domain: KnowledgeDomain.COMPLIANCE,
        confidentialityLevel: ConfidentialityLevel.PUBLIC,
        owner: 'DPO — Encarregado de Dados',
        tags: ['lgpd', 'privacidade', 'dados', 'política'],
      },
    ];

    for (const dto of seeds) {
      const id = `KNOWLEDGE-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const now = new Date().toISOString();
      this.knowledgeRegistry.set(id, {
        knowledgeId: id,
        ...dto,
        tags: dto.tags ?? [],
        status: KnowledgeStatus.PUBLISHED,
        version: 1,
        owner: dto.owner ?? 'SYSTEM',
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
      });
    }
  }

  async createKnowledgeItem(dto: CreateKnowledgeItemDto): Promise<KnowledgeItem> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const knowledgeId = `KNOWLEDGE-${year}-${seq}`;
    const now = new Date().toISOString();

    const item: KnowledgeItem = {
      knowledgeId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      domain: dto.domain,
      confidentialityLevel: dto.confidentialityLevel,
      status: KnowledgeStatus.DRAFT,
      version: 1,
      owner: dto.owner ?? 'UNKNOWN',
      tags: dto.tags ?? [],
      parentId: dto.parentId,
      content: dto.content,
      createdAt: now,
      updatedAt: now,
    };

    this.knowledgeRegistry.set(knowledgeId, item);

    await this.audit.recordAudit('CREATE', knowledgeId, dto.type, dto.owner ?? 'SYSTEM', { title: dto.title });

    await this.eventBus.publish(
      'aura.knowledge.item.created.v1',
      { knowledgeId, title: dto.title, type: dto.type, domain: dto.domain },
      this.SYSTEM_TENANT,
      { subject: knowledgeId },
    );

    this.logger.log(`[EnterpriseKnowledge] Created: ${knowledgeId} — ${dto.type}/${dto.domain}`);
    return item;
  }

  async updateKnowledgeItem(knowledgeId: string, dto: UpdateKnowledgeItemDto): Promise<KnowledgeItem> {
    const item = this.knowledgeRegistry.get(knowledgeId);
    if (!item) throw new NotFoundException(`Item de conhecimento não encontrado: ${knowledgeId}`);

    const updated: KnowledgeItem = {
      ...item,
      title: dto.title ?? item.title,
      status: dto.status ?? item.status,
      content: dto.content ?? item.content,
      tags: dto.tags ?? item.tags,
      version: item.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.knowledgeRegistry.set(knowledgeId, updated);

    await this.audit.recordAudit('UPDATE', knowledgeId, item.type, 'SYSTEM', {
      newVersion: updated.version, changeReason: dto.changeReason,
    });

    await this.eventBus.publish(
      'aura.knowledge.item.updated.v1',
      { knowledgeId, newVersion: updated.version, title: updated.title },
      this.SYSTEM_TENANT,
      { subject: knowledgeId },
    );

    return updated;
  }

  async publishKnowledgeItem(knowledgeId: string): Promise<KnowledgeItem> {
    const item = this.knowledgeRegistry.get(knowledgeId);
    if (!item) throw new NotFoundException(`Item não encontrado: ${knowledgeId}`);

    const published: KnowledgeItem = {
      ...item,
      status: KnowledgeStatus.PUBLISHED,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.knowledgeRegistry.set(knowledgeId, published);

    await this.eventBus.publish(
      'aura.knowledge.item.published.v1',
      { knowledgeId, title: item.title, domain: item.domain },
      this.SYSTEM_TENANT,
      { subject: knowledgeId },
    );

    return published;
  }

  getKnowledgeItem(knowledgeId: string): KnowledgeItem | undefined {
    return this.knowledgeRegistry.get(knowledgeId);
  }

  listKnowledgeItems(domain?: KnowledgeDomain, type?: KnowledgeType): KnowledgeItem[] {
    return Array.from(this.knowledgeRegistry.values()).filter(
      (item) =>
        (!domain || item.domain === domain) &&
        (!type || item.type === type),
    );
  }
}
