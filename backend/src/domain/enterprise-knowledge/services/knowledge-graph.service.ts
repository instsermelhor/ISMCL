import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeNodeType, CreateKnowledgeRelationDto } from '../dto/enterprise-knowledge.dto';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface KnowledgeNode {
  nodeId: string;
  name: string;
  type: KnowledgeNodeType;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface KnowledgeEdge {
  edgeId: string;
  sourceNodeId: string;
  sourceType: KnowledgeNodeType;
  targetNodeId: string;
  targetType: KnowledgeNodeType;
  relationType: string; // e.g., GOVERNS, IMPLEMENTS, MITIGATES, MEASURES, DEPENDS_ON, PRODUCED_BY
  createdAt: string;
}

export interface KnowledgeGraphTopology {
  totalNodes: number;
  totalEdges: number;
  nodeTypeCounts: Record<KnowledgeNodeType, number>;
}

/**
 * KnowledgeGraphService — P170 EKG
 *
 * Grafo Corporativo de Conhecimento relacionando pessoas, projetos, programas,
 * processos, documentos, indicadores (KPIs), riscos, políticas, sistemas,
 * decisões e evidências. Suporta travessia de relacionamentos e consultas semânticas.
 */
@Injectable()
export class KnowledgeGraphService {
  private readonly logger = new Logger(KnowledgeGraphService.name);
  private readonly nodes: Map<string, KnowledgeNode> = new Map();
  private readonly edges: Map<string, KnowledgeEdge> = new Map();

  constructor(
    private readonly auditSvc: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerNode(nodeId: string, name: string, type: KnowledgeNodeType, metadata: Record<string, any> = {}): Promise<KnowledgeNode> {
    const node: KnowledgeNode = {
      nodeId,
      name,
      type,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.nodes.set(nodeId, node);
    this.logger.log(`[KnowledgeGraph] Nó registrado: "${nodeId}" (${type}) — "${name}"`);
    return node;
  }

  async addRelation(dto: CreateKnowledgeRelationDto, registeredBy = 'SYSTEM'): Promise<KnowledgeEdge> {
    const edgeId = `EDGE-${Date.now().toString(36).toUpperCase()}`;
    const edge: KnowledgeEdge = {
      edgeId,
      sourceNodeId: dto.sourceNodeId,
      sourceType: dto.sourceType,
      targetNodeId: dto.targetNodeId,
      targetType: dto.targetType,
      relationType: dto.relationType.toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    this.edges.set(edgeId, edge);

    await this.auditSvc.recordAudit('KNOWLEDGE_GRAPH_RELATION_ADDED', edgeId, registeredBy, {
      source: dto.sourceNodeId,
      relation: dto.relationType,
      target: dto.targetNodeId,
    });

    await this.eventBus.publish(
      'aura.ekg.knowledge.graph.updated.v1',
      { edgeId, sourceNodeId: dto.sourceNodeId, relationType: dto.relationType, targetNodeId: dto.targetNodeId },
      'EKG',
      { subject: edgeId },
    );

    this.logger.log(`[KnowledgeGraph] Aresta adicionada: ${dto.sourceNodeId} --[${dto.relationType}]--> ${dto.targetNodeId}`);
    return edge;
  }

  getNodeNeighbors(nodeId: string): { outgoing: KnowledgeEdge[]; incoming: KnowledgeEdge[] } {
    const all = Array.from(this.edges.values());
    return {
      outgoing: all.filter((e) => e.sourceNodeId === nodeId),
      incoming: all.filter((e) => e.targetNodeId === nodeId),
    };
  }

  getNode(nodeId: string): KnowledgeNode | undefined {
    return this.nodes.get(nodeId);
  }

  getGraphTopology(): KnowledgeGraphTopology {
    const nodeTypeCounts: Partial<Record<KnowledgeNodeType, number>> = {};
    for (const n of this.nodes.values()) {
      nodeTypeCounts[n.type] = (nodeTypeCounts[n.type] ?? 0) + 1;
    }

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodeTypeCounts: nodeTypeCounts as Record<KnowledgeNodeType, number>,
    };
  }

  findPath(startNodeId: string, endNodeId: string, maxDepth = 4): string[] | null {
    const visited = new Set<string>();
    const queue: Array<{ current: string; path: string[] }> = [{ current: startNodeId, path: [startNodeId] }];

    while (queue.length > 0) {
      const { current, path } = queue.shift()!;
      if (current === endNodeId) return path;
      if (path.length > maxDepth) continue;

      visited.add(current);
      const outgoing = Array.from(this.edges.values()).filter((e) => e.sourceNodeId === current);
      for (const edge of outgoing) {
        if (!visited.has(edge.targetNodeId)) {
          queue.push({ current: edge.targetNodeId, path: [...path, edge.targetNodeId] });
        }
      }
    }

    return null; // Caminho não encontrado
  }
}
