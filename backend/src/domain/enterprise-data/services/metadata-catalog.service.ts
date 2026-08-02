import { Injectable, Logger } from '@nestjs/common';
import { DataDomain, DataSensitivity } from '../dto/enterprise-data.dto';
import { DataGovernanceAuditService } from './data-governance-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface MetadataEntity {
  entityId: string;
  name: string;
  type: 'TABLE' | 'ATTRIBUTE' | 'API_ENDPOINT' | 'EVENT_CHANNEL' | 'DASHBOARD' | 'AI_MODEL';
  domain: DataDomain;
  description: string;
  sensitivity: DataSensitivity;
  owner: string;
  tags: string[];
  registeredAt: string;
}

/**
 * MetadataCatalogService — P172 EDGP
 *
 * Catálogo Corporativo de Metadados.
 * Registra automaticamente tabelas, entidades, atributos, APIs, eventos, dashboards
 * e modelos de IA com pesquisa semântica, proprietários e nível de sensibilidade.
 */
@Injectable()
export class MetadataCatalogService {
  private readonly logger = new Logger(MetadataCatalogService.name);
  private readonly catalog: Map<string, MetadataEntity> = new Map();

  constructor(
    private readonly auditSvc: DataGovernanceAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.initDefaultCatalog();
  }

  private initDefaultCatalog(): void {
    const entries: Omit<MetadataEntity, 'registeredAt'>[] = [
      { entityId: 'META-TBL-BENEFICIARY', name: 'beneficiaries', type: 'TABLE', domain: DataDomain.BENEFICIARIES, description: 'Tabela mestre de beneficiários', sensitivity: DataSensitivity.RESTRICTED, owner: 'Diretoria Social', tags: ['lgpd', 'cadastro'] },
      { entityId: 'META-API-HEALTH-RECORDS', name: 'GET /social-impact/indicators', type: 'API_ENDPOINT', domain: DataDomain.HEALTH_CARE, description: 'Endpoint de indicadores sociais', sensitivity: DataSensitivity.CONFIDENTIAL, owner: 'CTO', tags: ['rest', 'api'] },
      { entityId: 'META-EVT-MASTER-DATA', name: 'aura.edgp.master.data.created.v1', type: 'EVENT_CHANNEL', domain: DataDomain.TECHNOLOGY, description: 'Canal de eventos de MDM', sensitivity: DataSensitivity.INTERNAL, owner: 'CDO', tags: ['asyncapi', 'events'] },
    ];

    entries.forEach((e) => {
      this.catalog.set(e.entityId, { ...e, registeredAt: new Date().toISOString() });
    });
  }

  async registerEntity(
    name: string,
    type: MetadataEntity['type'],
    domain: DataDomain,
    description: string,
    sensitivity: DataSensitivity,
    owner: string,
    tags: string[] = [],
    registeredBy = 'SYSTEM',
  ): Promise<MetadataEntity> {
    const entityId = `META-${type}-${name.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`;
    const entity: MetadataEntity = {
      entityId,
      name,
      type,
      domain,
      description,
      sensitivity,
      owner,
      tags,
      registeredAt: new Date().toISOString(),
    };

    this.catalog.set(entityId, entity);

    await this.auditSvc.recordAudit('METADATA_CATALOG_UPDATED', entityId, registeredBy, {
      name,
      type,
      domain,
    });

    await this.eventBus.publish(
      'aura.edgp.metadata.catalog.updated.v1',
      { entityId, name, type, domain },
      'EDGP',
      { subject: entityId },
    );

    this.logger.log(`[MetadataCatalog] Metadado cadastrado "${entityId}": ${name} (${type})`);
    return entity;
  }

  searchCatalog(query: string, domain?: DataDomain): MetadataEntity[] {
    const q = query.toLowerCase();
    let items = Array.from(this.catalog.values()).filter((e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)),
    );

    if (domain) items = items.filter((e) => e.domain === domain);
    return items;
  }

  listCatalog(): MetadataEntity[] {
    return Array.from(this.catalog.values());
  }
}
