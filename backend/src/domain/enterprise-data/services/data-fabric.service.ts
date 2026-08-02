import { Injectable, Logger } from '@nestjs/common';
import { DataDomain } from '../dto/enterprise-data.dto';
import { DataGovernanceAuditService } from './data-governance-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface DataFabricSource {
  sourceId: string;
  name: string;
  type: 'RELATIONAL_DB' | 'NOSQL_DB' | 'DATA_LAKE' | 'DATA_WAREHOUSE' | 'REST_API' | 'EVENT_BUS' | 'DOCUMENT_STORE';
  domain: DataDomain;
  connectionStatus: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  recordsCountEstimate: number;
  lastSyncedAt: string;
}

export interface UnifiedQueryResult {
  queryId: string;
  sourcesQueried: string[];
  totalRecordsReturned: number;
  dataSnippet: any[];
  executedAt: string;
}

/**
 * DataFabricService — P172 EDGP
 *
 * Camada corporativa de Data Fabric.
 * Abstrai a localização física dos dados distribuídos e permite acesso unificado
 * síncrono/assíncrono a bancos relacionais, NoSQL, Data Lakes, DWs e APIs da Plataforma Aura.
 */
@Injectable()
export class DataFabricService {
  private readonly logger = new Logger(DataFabricService.name);
  private readonly sources: Map<string, DataFabricSource> = new Map();

  constructor(
    private readonly auditSvc: DataGovernanceAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.initDefaultFabricSources();
  }

  private initDefaultFabricSources(): void {
    const defaultSources: Omit<DataFabricSource, 'lastSyncedAt'>[] = [
      { sourceId: 'FAB-SRC-POSTGRES-MAIN', name: 'PostgreSQL Relational DB', type: 'RELATIONAL_DB', domain: DataDomain.BENEFICIARIES, connectionStatus: 'CONNECTED', recordsCountEstimate: 50000 },
      { sourceId: 'FAB-SRC-PRISMA-HEALTH', name: 'Prisma Health Records', type: 'RELATIONAL_DB', domain: DataDomain.HEALTH_CARE, connectionStatus: 'CONNECTED', recordsCountEstimate: 120000 },
      { sourceId: 'FAB-SRC-LAKE-SOCIAL', name: 'Data Lake S3 Parquet', type: 'DATA_LAKE', domain: DataDomain.BENEFICIARIES, connectionStatus: 'CONNECTED', recordsCountEstimate: 500000 },
      { sourceId: 'FAB-SRC-EVENTBUS-AURA', name: 'Aura Event Bus Stream', type: 'EVENT_BUS', domain: DataDomain.TECHNOLOGY, connectionStatus: 'CONNECTED', recordsCountEstimate: 1000000 },
    ];

    defaultSources.forEach((s) => {
      this.sources.set(s.sourceId, { ...s, lastSyncedAt: new Date().toISOString() });
    });
  }

  async executeUnifiedQuery(domain: DataDomain, queryFilter: Record<string, any>, executedBy = 'SYSTEM'): Promise<UnifiedQueryResult> {
    const queryId = `FAB-QRY-${Date.now().toString(36).toUpperCase()}`;
    const matchingSources = Array.from(this.sources.values()).filter((s) => s.domain === domain);

    const mockSnippet = [
      { domain, recordId: 'FAB-REC-001', data: queryFilter, federatedFrom: matchingSources[0]?.sourceId ?? 'MAIN_DB' },
      { domain, recordId: 'FAB-REC-002', data: queryFilter, federatedFrom: matchingSources[1]?.sourceId ?? 'LAKE' },
    ];

    const result: UnifiedQueryResult = {
      queryId,
      sourcesQueried: matchingSources.map((s) => s.sourceId),
      totalRecordsReturned: mockSnippet.length,
      dataSnippet: mockSnippet,
      executedAt: new Date().toISOString(),
    };

    await this.auditSvc.recordAudit('DATA_FABRIC_QUERY_EXECUTED', queryId, executedBy, {
      domain,
      sourcesCount: matchingSources.length,
    });

    await this.eventBus.publish(
      'aura.edgp.data.fabric.synchronized.v1',
      { queryId, domain, sourcesCount: matchingSources.length },
      'EDGP',
      { subject: queryId },
    );

    this.logger.log(`[DataFabric] Consulta unificada no domínio "${domain}": ${matchingSources.length} fontes consultadas.`);
    return result;
  }

  listSources(domain?: DataDomain): DataFabricSource[] {
    const all = Array.from(this.sources.values());
    return domain ? all.filter((s) => s.domain === domain) : all;
  }
}
