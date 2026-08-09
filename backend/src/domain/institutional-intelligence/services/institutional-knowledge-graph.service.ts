import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';
import {
  KnowledgeNodeDto,
  KnowledgeEdgeDto,
  KnowledgeNodeType,
} from '../dto/institutional-intelligence.dto';

@Injectable()
export class InstitutionalKnowledgeGraphService {
  private readonly logger = new Logger(InstitutionalKnowledgeGraphService.name);

  private readonly nodes: Map<string, KnowledgeNodeDto> = new Map();
  private readonly edges: Map<string, KnowledgeEdgeDto> = new Map();

  constructor(private readonly eventBus: EventBusService) {
    this.seedInitialKnowledgeGraph();
  }

  private seedInitialKnowledgeGraph(): void {
    const node1: KnowledgeNodeDto = {
      nodeId: 'NODE-P-101',
      label: 'Dr. Fernando Ramos',
      type: KnowledgeNodeType.PERSON,
      properties: { role: 'Psiquiatra', CRM: 'SP-182736', department: 'Saúde Mental' },
    };
    const node2: KnowledgeNodeDto = {
      nodeId: 'NODE-P-102',
      label: 'Dra. Camila Souza',
      type: KnowledgeNodeType.PERSON,
      properties: { role: 'Psicóloga', CRP: '06/99812', department: 'Acolhimento' },
    };
    const node3: KnowledgeNodeDto = {
      nodeId: 'NODE-PRJ-201',
      label: 'Projeto Acolher Ser Melhor',
      type: KnowledgeNodeType.PROJECT,
      properties: { budget: 250000, targetAudience: 'Jovens e Adolescentes' },
    };

    this.nodes.set(node1.nodeId, node1);
    this.nodes.set(node2.nodeId, node2);
    this.nodes.set(node3.nodeId, node3);

    const edge1: KnowledgeEdgeDto = {
      edgeId: 'EDGE-E-501',
      sourceNodeId: 'NODE-P-101',
      targetNodeId: 'NODE-PRJ-201',
      relationType: 'LEADS_PROJECT',
      properties: { assignedAt: '2026-01-01' },
    };

    this.edges.set(edge1.edgeId, edge1);
  }

  /**
   * Realiza buscas semânticas de nós e vértices no Grafo Institucional do Conhecimento.
   */
  async queryGraph(
    searchQuery?: string,
    nodeType?: KnowledgeNodeType,
  ): Promise<{ nodes: KnowledgeNodeDto[]; edges: KnowledgeEdgeDto[] }> {
    let matchedNodes = Array.from(this.nodes.values());

    if (nodeType) {
      matchedNodes = matchedNodes.filter((n) => n.type === nodeType);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      matchedNodes = matchedNodes.filter((n) => n.label.toLowerCase().includes(q));
    }

    const matchedNodeIds = new Set(matchedNodes.map((n) => n.nodeId));
    const matchedEdges = Array.from(this.edges.values()).filter(
      (e) => matchedNodeIds.has(e.sourceNodeId) || matchedNodeIds.has(e.targetNodeId),
    );

    return { nodes: matchedNodes, edges: matchedEdges };
  }

  /**
   * Adiciona um novo nó ao Grafo Institucional e publica evento.
   */
  async addNode(node: KnowledgeNodeDto): Promise<KnowledgeNodeDto> {
    this.nodes.set(node.nodeId, node);

    await this.eventBus.publish(
      'aura.institutional.knowledgegraph.updated.v1',
      {
        action: 'ADD_NODE',
        nodeId: node.nodeId,
        nodeType: node.type,
      },
      'default',
      { source: 'InstitutionalKnowledgeGraphService' },
    );

    return node;
  }
}
