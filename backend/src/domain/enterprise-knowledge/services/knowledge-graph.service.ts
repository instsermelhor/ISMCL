import { Injectable, Logger } from '@nestjs/common';
import { AddGraphEdgeDto, AddGraphNodeDto, GraphEntityType } from '../dto/enterprise-knowledge.dto';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface GraphNode {
  nodeId: string;
  label: string;
  entityType: GraphEntityType;
  externalId?: string;
  properties: Record<string, any>;
  createdAt: string;
}

export interface GraphEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: string;
  properties: Record<string, any>;
  createdAt: string;
}

/**
 * KnowledgeGraphService — Grafo Corporativo de Conhecimento (P158 AEKIP)
 *
 * Mapeia e relaciona semanticamente pessoas, processos, documentos, projetos,
 * indicadores, políticas, normas, treinamentos, módulos da plataforma e
 * agentes de IA, permitindo a navegação por grafo e a descoberta de conexões.
 */
@Injectable()
export class KnowledgeGraphService {
  private readonly logger = new Logger(KnowledgeGraphService.name);
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedGraph();
  }

  private seedGraph(): void {
    const docNode: AddGraphNodeDto = {
      label: 'Protocolo de Atendimento Psicossocial',
      entityType: GraphEntityType.DOCUMENT,
      externalId: 'KNOWLEDGE-2026-SEED-01',
    };
    const processNode: AddGraphNodeDto = {
      label: 'Processo de Acolhimento e Triagem',
      entityType: GraphEntityType.PROCESS,
    };
    const departmentNode: AddGraphNodeDto = {
      label: 'Equipe de Psicologia',
      entityType: GraphEntityType.DEPARTMENT,
    };

    const n1 = this.addNodeSync(docNode);
    const n2 = this.addNodeSync(processNode);
    const n3 = this.addNodeSync(departmentNode);

    this.addEdgeSync({
      sourceNodeId: n1.nodeId,
      targetNodeId: n2.nodeId,
      relationshipType: 'GUIDES_PROCESS',
    });
    this.addEdgeSync({
      sourceNodeId: n3.nodeId,
      targetNodeId: n1.nodeId,
      relationshipType: 'OWNER_OF',
    });
  }

  private addNodeSync(dto: AddGraphNodeDto): GraphNode {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const nodeId = `NODE-${Date.now()}-${seq}`;
    const node: GraphNode = {
      nodeId,
      label: dto.label,
      entityType: dto.entityType,
      externalId: dto.externalId,
      properties: dto.properties ?? {},
      createdAt: new Date().toISOString(),
    };
    this.nodes.set(nodeId, node);
    return node;
  }

  private addEdgeSync(dto: AddGraphEdgeDto): GraphEdge {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const edgeId = `EDGE-${Date.now()}-${seq}`;
    const edge: GraphEdge = {
      edgeId,
      sourceNodeId: dto.sourceNodeId,
      targetNodeId: dto.targetNodeId,
      relationshipType: dto.relationshipType,
      properties: dto.properties ?? {},
      createdAt: new Date().toISOString(),
    };
    this.edges.set(edgeId, edge);
    return edge;
  }

  async addNode(dto: AddGraphNodeDto): Promise<GraphNode> {
    const node = this.addNodeSync(dto);
    await this.audit.recordAudit('ADD_NODE', node.nodeId, node.entityType, 'SYSTEM', { label: dto.label });
    await this.eventBus.publish(
      'aura.knowledge.graph.updated.v1',
      { action: 'ADD_NODE', nodeId: node.nodeId, entityType: node.entityType },
      this.SYSTEM_TENANT,
      { subject: node.nodeId },
    );
    return node;
  }

  async addEdge(dto: AddGraphEdgeDto): Promise<GraphEdge> {
    if (!this.nodes.has(dto.sourceNodeId) || !this.nodes.has(dto.targetNodeId)) {
      throw new Error('Nó de origem ou destino não encontrado no Grafo.');
    }
    const edge = this.addEdgeSync(dto);
    await this.audit.recordAudit('ADD_EDGE', edge.edgeId, 'EDGE', 'SYSTEM', {
      source: dto.sourceNodeId,
      target: dto.targetNodeId,
      relation: dto.relationshipType,
    });
    await this.eventBus.publish(
      'aura.knowledge.graph.updated.v1',
      { action: 'ADD_EDGE', edgeId: edge.edgeId, relationshipType: dto.relationshipType },
      this.SYSTEM_TENANT,
      { subject: edge.edgeId },
    );
    return edge;
  }

  getRelatedNodes(nodeId: string): { node: GraphNode; relationship: string }[] {
    const results: { node: GraphNode; relationship: string }[] = [];
    for (const edge of this.edges.values()) {
      if (edge.sourceNodeId === nodeId) {
        const target = this.nodes.get(edge.targetNodeId);
        if (target) results.push({ node: target, relationship: edge.relationshipType });
      } else if (edge.targetNodeId === nodeId) {
        const source = this.nodes.get(edge.sourceNodeId);
        if (source) results.push({ node: source, relationship: `INVERSE_${edge.relationshipType}` });
      }
    }
    return results;
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }
}
