import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  QueryRagDto,
  CreateKnowledgeArticleDto,
  KnowledgeCategory,
} from '../dto/ai.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface KnowledgeArticle {
  articleId: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  tags: string[];
  version: number;
  isActive: boolean;
  vectorEmbedding?: number[]; // Vetor sintético para busca de similaridade
  createdAt: string;
}

export interface RagResult {
  query: string;
  retrievedDocuments: Array<{ articleId: string; title: string; category: KnowledgeCategory; snippet: string; relevanceScore: number }>;
  synthesizedAnswer: string;
  sourcesUsed: string[];
  executedAt: string;
}

/**
 * RagKnowledgeService — RAG (Retrieval-Augmented Generation) e Base de Conhecimento
 *
 * Funcionalidades:
 * - Gerenciamento da Base Corporativa de Conhecimento (POPs, Protocolos, Políticas, FAQs)
 * - Banco Vetorial Corporativo com Embeddings e Busca de Similaridade Cosseno
 * - Respostas sintetizadas via RAG com citação OBRIGATÓRIA de fontes de origem
 * - Emissão de eventos CloudEvents `aura.ai.knowledge.retrieved.v1`
 * - Pré-carga de 4 documentos institucionais e clínicos padrão
 *
 * Referências: P115 AEDM, P141 AEAI-KP Etapas 4, 5, 6
 */
@Injectable()
export class RagKnowledgeService {
  private readonly logger = new Logger(RagKnowledgeService.name);
  private readonly articles = new Map<string, KnowledgeArticle>();

  constructor(private readonly eventBus: EventBusService) {
    this.seedDefaultKnowledge();
  }

  // ── Documentos Corporativos Padrão ─────────────────────────────────────

  private seedDefaultKnowledge(): void {
    const defaults: CreateKnowledgeArticleDto[] = [
      {
        title: 'POP-001 — Protocolo de Acolhimento e Triagem de Crise Psicológica',
        category: KnowledgeCategory.SOP_POP,
        content: 'Este Procedimento Operacional Padrão define as etapas para triagem e acolhimento imediato de beneficiários em situação de crise. Etapas: 1) Escuta qualificada sem julgamento; 2) Avaliação de score de risco (CRITICAL se risco > 70); 3) Encaminhamento prioritário para psiquiatria/psicologia em até 30 min.',
        tags: ['triage', 'crisis', 'psychology', 'sop'],
      },
      {
        title: 'POL-002 — Política de Proteção de Dados e Tratamento de Prontuários (LGPD Art. 11)',
        category: KnowledgeCategory.INSTITUTIONAL_POLICY,
        content: 'Esta política estabelece que dados de saúde física e mental tratam-se de dados sensíveis sob o Art. 11 da LGPD. O acesso exige autenticação multifator (MFA), autorização estrita baseada no papel (RBAC/ABAC) e registro em trilha imutável de auditoria.',
        tags: ['lgpd', 'security', 'ehr', 'privacy'],
      },
      {
        title: 'PROT-003 — Protocolo Assistencial de Acompanhamento Multidisciplinar',
        category: KnowledgeCategory.CLINICAL_PROTOCOL,
        content: 'Define a obrigatoriedade de alinhamento quinzenal entre Psicólogo, Psiquiatra e Assistente Social em casos com score de vulnerabilidade social ≥ 3 ou diagnósticos de CID-10 F32/F41.',
        tags: ['multidisciplinary', 'clinical', 'case_management'],
      },
      {
        title: 'FAQ-004 — Agendamento de Teleconsultas e Salas Virtuais no Portal Aura',
        category: KnowledgeCategory.FAQ,
        content: 'Para agendar teleconsultas o beneficiário deve utilizar o Portal Aura ou canal de WhatsApp oficial. As salas virtuais possuem link efêmero com token temporário válido por 60 minutos.',
        tags: ['telehealth', 'faq', 'scheduling'],
      },
    ];

    for (const d of defaults) {
      this.createArticle(d);
    }

    this.logger.log(`[RAG] 📚 Base de Conhecimento inicializada com ${this.articles.size} artigos e POPs indexados.`);
  }

  // ── Gestão de Artigos ──────────────────────────────────────────────────

  createArticle(dto: CreateKnowledgeArticleDto): KnowledgeArticle {
    const articleId = randomUUID();
    const article: KnowledgeArticle = {
      articleId,
      title: dto.title,
      category: dto.category,
      content: dto.content,
      tags: dto.tags ?? [],
      version: 1,
      isActive: true,
      vectorEmbedding: this.generateSyntheticEmbedding(dto.content),
      createdAt: new Date().toISOString(),
    };

    this.articles.set(articleId, article);
    this.logger.log(`[RAG] 📄 Documento indexado: "${dto.title}" (${dto.category})`);
    return article;
  }

  // ── Busca RAG com Citação de Fontes ────────────────────────────────────

  async queryRag(dto: QueryRagDto, tenantId = 'default'): Promise<RagResult> {
    const queryEmbedding = this.generateSyntheticEmbedding(dto.query);
    const topK = dto.topK ?? 3;

    // Rankeamento por similaridade sintética
    const scoredDocs = [...this.articles.values()]
      .filter((a) => a.isActive && (!dto.categories || dto.categories.includes(a.category)))
      .map((doc) => ({
        doc,
        score: this.calculateCosineSimilarity(queryEmbedding, doc.vectorEmbedding ?? []),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const retrievedDocuments = scoredDocs.map(({ doc, score }) => ({
      articleId: doc.articleId,
      title: doc.title,
      category: doc.category,
      snippet: doc.content.substring(0, 180) + '...',
      relevanceScore: Number(score.toFixed(2)),
    }));

    const sourcesUsed = retrievedDocuments.map((d) => d.title);

    const synthesizedAnswer = retrievedDocuments.length > 0
      ? `Com base na documentação institucional da Plataforma Aura (${sourcesUsed[0]}): ${retrievedDocuments[0].snippet}`
      : 'Nenhum documento específico encontrado na base para esta consulta.';

    const result: RagResult = {
      query: dto.query,
      retrievedDocuments,
      synthesizedAnswer,
      sourcesUsed,
      executedAt: new Date().toISOString(),
    };

    await this.eventBus.publish(
      'aura.ai.knowledge.retrieved.v1',
      { query: dto.query, retrievedCount: retrievedDocuments.length, sources: sourcesUsed },
      tenantId,
      { subject: 'rag-query' },
    );

    this.logger.log(`[RAG] 🔍 Consulta RAG: "${dto.query.substring(0, 40)}..." → ${retrievedDocuments.length} fontes recuperadas.`);
    return result;
  }

  // ── Utilitários Vetoriais ─────────────────────────────────────────────

  private generateSyntheticEmbedding(text: string): number[] {
    // Gera vetor de 8 dimensões baseado no hash dos caracteres (para demonstração determinística)
    const vector = new Array(8).fill(0);
    for (let i = 0; i < text.length; i++) {
      vector[i % 8] += text.charCodeAt(i);
    }
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map((val) => Number((val / magnitude).toFixed(4)));
  }

  private calculateCosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length || v1.length === 0) return 0.5;
    let dotProduct = 0;
    for (let i = 0; i < v1.length; i++) dotProduct += v1[i] * v2[i];
    return Math.max(0.1, Math.min(1.0, dotProduct));
  }

  listArticles(): KnowledgeArticle[] {
    return [...this.articles.values()].sort((a, b) => a.title.localeCompare(b.title));
  }
}
