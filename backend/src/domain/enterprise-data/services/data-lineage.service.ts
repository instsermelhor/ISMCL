import { Injectable, Logger } from '@nestjs/common';
import { DataGovernanceAuditService } from './data-governance-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface LineageHop {
  hopId: string;
  sourceSystem: string;
  targetSystem: string;
  transformationLogic: string;
  executedAt: string;
}

export interface DataLineageGraph {
  lineageId: string;
  datasetName: string;
  originSystem: string;
  hops: LineageHop[];
  consumers: string[];
  generatedAt: string;
}

/**
 * DataLineageService — P172 EDGP
 *
 * Rastreabilidade completa dos dados (Data Lineage).
 * Mapeia e registra a origem, transformações intermediárias, integrações,
 * cálculos, consumidores e exportações ao longo de todo o ecossistema Aura.
 */
@Injectable()
export class DataLineageService {
  private readonly logger = new Logger(DataLineageService.name);
  private readonly lineageStore: Map<string, DataLineageGraph> = new Map();

  constructor(
    private readonly auditSvc: DataGovernanceAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async recordLineage(
    datasetName: string,
    originSystem: string,
    hops: Array<{ sourceSystem: string; targetSystem: string; transformationLogic: string }>,
    consumers: string[],
    recordedBy = 'DATA_PIPELINE',
  ): Promise<DataLineageGraph> {
    const lineageId = `LIN-${datasetName.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const lineageHops: LineageHop[] = hops.map((h, i) => ({
      hopId: `HOP-${i + 1}`,
      sourceSystem: h.sourceSystem,
      targetSystem: h.targetSystem,
      transformationLogic: h.transformationLogic,
      executedAt: now,
    }));

    const graph: DataLineageGraph = {
      lineageId,
      datasetName,
      originSystem,
      hops: lineageHops,
      consumers,
      generatedAt: now,
    };

    this.lineageStore.set(lineageId, graph);

    await this.auditSvc.recordAudit('DATA_LINEAGE_GENERATED', lineageId, recordedBy, {
      datasetName,
      originSystem,
      hopsCount: hops.length,
    });

    await this.eventBus.publish(
      'aura.edgp.data.lineage.generated.v1',
      { lineageId, datasetName, originSystem, hopsCount: hops.length },
      'EDGP',
      { subject: lineageId },
    );

    this.logger.log(`[DataLineage] Linhagem gerada "${lineageId}" para "${datasetName}" (${hops.length} saltos)`);
    return graph;
  }

  getLineage(datasetName: string): DataLineageGraph | undefined {
    return Array.from(this.lineageStore.values()).find(
      (l) => l.datasetName.toLowerCase() === datasetName.toLowerCase(),
    );
  }

  listLineages(): DataLineageGraph[] {
    return Array.from(this.lineageStore.values());
  }
}
