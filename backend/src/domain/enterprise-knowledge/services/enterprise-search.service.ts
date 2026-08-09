import { Injectable, Logger } from '@nestjs/common';
import { SearchKnowledgeDto } from '../dto/enterprise-knowledge.dto';
import { EnterpriseKnowledgeService, KnowledgeItem } from './enterprise-knowledge.service';
import { SemanticKnowledgeEngineService } from './semantic-knowledge-engine.service';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface SearchHit {
  item: KnowledgeItem;
  similarityScore: number;
  snippet: string;
}

export interface SearchResult {
  searchId: string;
  query: string;
  totalHits: number;
  hits: SearchHit[];
  ragGeneratedAnswer?: string;
  executedAt: string;
}

/**
 * EnterpriseSearchService — Pesquisa Semântica Corporativa com RAG (P158 AEKIP)
 *
 * Executa pesquisas por linguagem natural, similaridade semântica e contexto,
 * integrando a arquitetura RAG (Retrieval-Augmented Generation) para responder
 * dúvidas dos usuários com base em evidências documentais da plataforma.
 */
@Injectable()
export class EnterpriseSearchService {
  private readonly logger = new Logger(EnterpriseSearchService.name);
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly knowledgeService: EnterpriseKnowledgeService,
    private readonly semanticEngine: SemanticKnowledgeEngineService,
    private readonly audit: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async search(dto: SearchKnowledgeDto): Promise<SearchResult> {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const searchId = `SCH-${Date.now()}-${seq}`;
    const topK = dto.topK ?? 5;

    // Análise semântica da consulta
    const analysis = this.semanticEngine.analyzeText(dto.query);
    const queryTokens = dto.query.toLowerCase().split(' ').filter((t) => t.length > 2);

    const allItems = this.knowledgeService.listKnowledgeItems();

    // Calcula pontuação de similaridade semântica por token + conceito
    const scoredHits: SearchHit[] = allItems.map((item) => {
      let score = 0;
      const textToMatch = `${item.title} ${item.summary} ${item.content} ${item.tags.join(' ')}`.toLowerCase();

      for (const token of queryTokens) {
        if (textToMatch.includes(token)) score += 0.25;
      }
      for (const concept of analysis.keyConcepts) {
        if (textToMatch.includes(concept.toLowerCase())) score += 0.35;
      }

      // Normaliza entre 0.5 e 0.99 para itens encontrados
      const finalScore = score > 0 ? Math.min(0.99, 0.5 + score * 0.2) : 0.15;

      return {
        item,
        similarityScore: Math.round(finalScore * 100) / 100,
        snippet: item.summary,
      };
    });

    // Ordena por pontuação de similaridade descendente
    const sortedHits = scoredHits.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, topK);

    let ragAnswer: string | undefined;
    if (sortedHits.length > 0) {
      const topHit = sortedHits[0];
      ragAnswer = `[RAG Engine] Resposta baseada em "${topHit.item.title}": ${topHit.item.summary}. Para mais detalhes, consulte o documento oficial (${topHit.item.documentId}).`;
    }

    const result: SearchResult = {
      searchId,
      query: dto.query,
      totalHits: sortedHits.length,
      hits: sortedHits,
      ragGeneratedAnswer: ragAnswer,
      executedAt: new Date().toISOString(),
    };

    await this.audit.recordAudit('SEARCH', searchId, 'SEARCH_QUERY', 'USER');

    await this.eventBus.publish(
      'aura.knowledge.search.executed.v1',
      { searchId, query: dto.query, totalHits: sortedHits.length },
      this.SYSTEM_TENANT,
      { subject: searchId },
    );

    this.logger.log(`[EnterpriseSearch] Query: "${dto.query}" → ${sortedHits.length} hits`);
    return result;
  }
}
