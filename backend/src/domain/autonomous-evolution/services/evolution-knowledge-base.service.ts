import { Injectable, Logger } from '@nestjs/common';

export interface EvolutionKnowledgeRecord {
  knowledgeId: string;
  category: string;
  key: string;
  content: Record<string, any>;
  version: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * EvolutionKnowledgeBaseService — Base Institucional de Conhecimento Evolutivo (P153 AAEE)
 *
 * Armazena lições aprendidas, histórico de melhorias, indicadores pós-implantação,
 * decisões arquiteturais (ADRs) e resultados obtidos na evolução da plataforma.
 */
@Injectable()
export class EvolutionKnowledgeBaseService {
  private readonly logger = new Logger(EvolutionKnowledgeBaseService.name);
  private knowledgeStore: Map<string, EvolutionKnowledgeRecord> = new Map();

  constructor() {
    this.seedInitialKnowledge();
  }

  private seedInitialKnowledge(): void {
    const seeds: EvolutionKnowledgeRecord[] = [
      {
        knowledgeId: 'EKB-2026-0001',
        category: 'ARCHITECTURAL_DECISION',
        key: 'ADR-152_ACOP_MULTI_AGENT',
        content: {
          title: 'Aura Cognitive Orchestration Platform',
          summary: 'Adotado orquestrador central com 14 agentes especializados por domínio.',
          outcomes: 'Eliminação de decisões isoladas de IA, tempo de resposta 30% menor.',
        },
        version: 1,
        tags: ['adr-152', 'acop', 'multi-agent'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        knowledgeId: 'EKB-2026-0002',
        category: 'LESSON_LEARNED',
        key: 'ROUTING_LOAD_BALANCING_PATTERN',
        content: {
          lesson: 'Agentes especializados devem ter limite dinâmico de concorrencia.',
          recommendation: 'Usar capability matching com peso inversamente proporcional à carga.',
        },
        version: 1,
        tags: ['routing', 'performance'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const record of seeds) {
      this.knowledgeStore.set(record.knowledgeId, record);
    }
  }

  async storeKnowledge(
    category: string,
    key: string,
    content: Record<string, any>,
    tags?: string[],
  ): Promise<EvolutionKnowledgeRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const knowledgeId = `EKB-${year}-${seq}`;

    const record: EvolutionKnowledgeRecord = {
      knowledgeId,
      category,
      key,
      content,
      version: 1,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.knowledgeStore.set(knowledgeId, record);
    this.logger.log(`[EvolutionKB] Stored: ${knowledgeId} (${category} :: ${key})`);
    return record;
  }

  searchKnowledge(query: string, category?: string): EvolutionKnowledgeRecord[] {
    const results: EvolutionKnowledgeRecord[] = [];
    const term = query.toLowerCase();

    for (const record of this.knowledgeStore.values()) {
      if (category && record.category !== category) continue;

      const matchesKey = record.key.toLowerCase().includes(term);
      const matchesCategory = record.category.toLowerCase().includes(term);
      const matchesContent = JSON.stringify(record.content).toLowerCase().includes(term);
      const matchesTags = record.tags?.some((t) => t.toLowerCase().includes(term));

      if (matchesKey || matchesCategory || matchesContent || matchesTags || !query) {
        results.push(record);
      }
    }

    return results;
  }

  getDecisionHistory(): EvolutionKnowledgeRecord[] {
    return this.searchKnowledge('', 'ARCHITECTURAL_DECISION');
  }

  exportKnowledgeCatalog(): EvolutionKnowledgeRecord[] {
    return Array.from(this.knowledgeStore.values());
  }
}
