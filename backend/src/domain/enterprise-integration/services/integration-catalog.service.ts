import { Injectable, Logger } from '@nestjs/common';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface CatalogEntry {
  entryId: string;
  name: string;
  category: 'API' | 'EVENT' | 'CONNECTOR' | 'WEBHOOK' | 'PARTNER' | 'CONTRACT';
  description: string;
  owner: string;
  tags: string[];
  documentationUrl?: string;
  registeredAt: string;
}

@Injectable()
export class IntegrationCatalogService {
  private readonly logger = new Logger(IntegrationCatalogService.name);
  private readonly catalog: Map<string, CatalogEntry> = new Map();

  constructor(
    private readonly auditSvc: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerEntry(
    name: string, category: CatalogEntry['category'], description: string,
    owner: string, tags: string[], documentationUrl?: string, registeredBy?: string,
  ): Promise<CatalogEntry> {
    const entryId = `CAT-${category}-${Date.now().toString(36).toUpperCase()}`;
    const entry: CatalogEntry = { entryId, name, category, description, owner, tags, documentationUrl, registeredAt: new Date().toISOString() };
    this.catalog.set(entryId, entry);
    await this.auditSvc.recordAudit('CATALOG_ENTRY_REGISTERED', entryId, registeredBy ?? 'SYSTEM', { name, category });
    this.logger.log(`[IntegrationCatalog] Entrada registrada: "${name}" [${category}] (${entryId})`);
    return entry;
  }

  search(query: string, category?: CatalogEntry['category']): CatalogEntry[] {
    const lower = query.toLowerCase();
    return Array.from(this.catalog.values()).filter((e) =>
      (!category || e.category === category) &&
      (e.name.toLowerCase().includes(lower) || e.description.toLowerCase().includes(lower) || e.tags.some((t) => t.toLowerCase().includes(lower)))
    );
  }

  listAll(category?: CatalogEntry['category']): CatalogEntry[] {
    const all = Array.from(this.catalog.values());
    return category ? all.filter((e) => e.category === category) : all;
  }

  getEntry(entryId: string): CatalogEntry | undefined { return this.catalog.get(entryId); }
}
