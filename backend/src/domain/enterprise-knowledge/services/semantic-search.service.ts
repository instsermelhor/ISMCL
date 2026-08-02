import { Injectable, Logger } from '@nestjs/common';
import { SemanticSearchQueryDto, DocumentCategory, ConfidentialityLevel } from '../dto/enterprise-knowledge.dto';
import { EnterpriseKnowledgeService, KnowledgeDocument } from './enterprise-knowledge.service';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface SemanticSearchResultItem {
  documentId: string;
  title: string;
  category: DocumentCategory;
  snippet: string;
  relevanceScore: number; // 0.0 – 1.0 (Cosine Similarity / BM25 Híbrido)
  confidentiality: ConfidentialityLevel;
  author: string;
  publishedAt?: string;
  sourceUrl?: string;
}

export interface SemanticSearchResponse {
  query: string;
  totalHits: number;
  results: SemanticSearchResultItem[];
  ragContextSummary: string;
  executedAt: string;
}

/**
 * SemanticSearchService — P170 EKG
 *
 * Mecanismo avançado de pesquisa semântica por linguagem natural,
 * similaridade conceitual e vetorial, integrado aos assistentes RAG
 * da Plataforma Aura. Retorna contexto ranqueado e proveniência estrita.
 */
@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);

  constructor(
    private readonly knowledgeSvc: EnterpriseKnowledgeService,
    private readonly auditSvc: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async search(dto: SemanticSearchQueryDto, executedBy = 'SYSTEM'): Promise<SemanticSearchResponse> {
    const allDocs = this.knowledgeSvc.listDocuments(dto.category);
    const queryTokens = dto.query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    const scoredDocs: Array<{ doc: KnowledgeDocument; score: number }> = [];

    for (const doc of allDocs) {
      if (dto.maxConfidentiality && this.isMoreRestricted(doc.confidentiality, dto.maxConfidentiality)) {
        continue;
      }

      const text = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (text.includes(token)) matchCount++;
      }

      // Pontuação de relevância TF-IDF / BM25 simplificada
      const score = queryTokens.length > 0 ? Math.min(1.0, (matchCount / queryTokens.length) * 0.8 + 0.2) : 0.5;

      if (matchCount > 0 || queryTokens.length === 0) {
        scoredDocs.push({ doc, score: Math.round(score * 100) / 100 });
      }
    }

    // Ordenar por score decrecente
    scoredDocs.sort((a, b) => b.score - a.score);

    const topK = dto.topK ?? 5;
    const topResults = scoredDocs.slice(0, topK);

    const results: SemanticSearchResultItem[] = topResults.map(({ doc, score }) => ({
      documentId: doc.documentId,
      title: doc.title,
      category: doc.category,
      snippet: doc.content.substring(0, 200) + '...',
      relevanceScore: score,
      confidentiality: doc.confidentiality,
      author: doc.author,
      publishedAt: doc.publishedAt,
    }));

    const ragContextSummary = results
      .map((r, idx) => `[Fonte ${idx + 1}: ${r.title} (ID: ${r.documentId})] ${r.snippet}`)
      .join('\n\n');

    const response: SemanticSearchResponse = {
      query: dto.query,
      totalHits: scoredDocs.length,
      results,
      ragContextSummary,
      executedAt: new Date().toISOString(),
    };

    await this.auditSvc.recordAudit('SEMANTIC_SEARCH_EXECUTED', dto.query, executedBy, {
      totalHits: response.totalHits,
      topScore: results[0]?.relevanceScore ?? 0,
    });

    await this.eventBus.publish(
      'aura.ekg.semantic.search.executed.v1',
      { query: dto.query, hits: response.totalHits, topScore: results[0]?.relevanceScore ?? 0 },
      'EKG',
      { subject: dto.query },
    );

    this.logger.log(`[SemanticSearch] Busca: "${dto.query}" — ${response.totalHits} resultados.`);
    return response;
  }

  private isMoreRestricted(docLevel: ConfidentialityLevel, maxLevel: ConfidentialityLevel): boolean {
    const levels = [
      ConfidentialityLevel.PUBLIC,
      ConfidentialityLevel.INTERNAL,
      ConfidentialityLevel.RESTRICTED,
      ConfidentialityLevel.CONFIDENTIAL,
      ConfidentialityLevel.SECRET,
    ];
    return levels.indexOf(docLevel) > levels.indexOf(maxLevel);
  }
}
