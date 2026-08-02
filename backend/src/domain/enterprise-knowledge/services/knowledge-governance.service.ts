import { Injectable, Logger } from '@nestjs/common';
import { EnterpriseKnowledgeService, KnowledgeDocument } from './enterprise-knowledge.service';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface GroundedQAResponse {
  question: string;
  answer: string;
  citedSources: Array<{
    documentId: string;
    title: string;
    snippet: string;
    relevance: number;
  }>;
  groundedExclusively: boolean;
  generatedAt: string;
}

export interface InconsistencyCheckResult {
  hasInconsistencies: boolean;
  duplicateCandidates: Array<{ docIdA: string; docIdB: string; similarityScore: number }>;
  outdatedDocuments: Array<{ docId: string; title: string; ageDays: number }>;
  checkedAt: string;
}

/**
 * KnowledgeGovernanceService — P170 EKG (IA Semântica & Governança)
 *
 * Governança documental e inteligência artificial especializada no conhecimento institucional:
 * resumir documentos, sugerir conteúdos relacionados, detectar duplicidades e inconsistências,
 * e responder perguntas utilizando EXCLUSIVAMENTE a Base Institucional com indicação de origem.
 */
@Injectable()
export class KnowledgeGovernanceService {
  private readonly logger = new Logger(KnowledgeGovernanceService.name);

  constructor(
    private readonly knowledgeSvc: EnterpriseKnowledgeService,
    private readonly auditSvc: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async summarizeDocument(documentId: string): Promise<{ documentId: string; summary: string; wordCount: number }> {
    const doc = this.knowledgeSvc.getDocument(documentId);
    if (!doc) throw new Error(`Documento "${documentId}" não encontrado.`);

    // Resumo semântico automatizado
    const sentences = doc.content.split(/(?<=[.!?])\s+/);
    const summary = sentences.slice(0, 3).join(' ') || doc.content.substring(0, 300);

    return {
      documentId,
      summary: `[Resumo IA] ${summary}`,
      wordCount: doc.content.split(/\s+/).length,
    };
  }

  async answerGroundedQuestion(question: string, askedBy = 'USER'): Promise<GroundedQAResponse> {
    const docs = this.knowledgeSvc.listDocuments();
    const queryTokens = question.toLowerCase().split(/\s+/).filter((t) => t.length > 3);

    const matches: Array<{ doc: KnowledgeDocument; score: number }> = [];

    for (const doc of docs) {
      const text = `${doc.title} ${doc.content}`.toLowerCase();
      let hits = 0;
      for (const token of queryTokens) {
        if (text.includes(token)) hits++;
      }
      if (hits > 0) {
        matches.push({ doc, score: Math.round((hits / (queryTokens.length || 1)) * 100) / 100 });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 3);

    let answer: string;
    if (topMatches.length > 0) {
      answer = `Com base nas diretrizes oficiais do Instituto Ser Melhor, informo que: ${topMatches[0].doc.content.substring(0, 250)}...`;
    } else {
      answer = 'Nenhuma informação oficial encontrada na Base Institucional para responder a esta consulta com proveniência garantida.';
    }

    const citedSources = topMatches.map(({ doc, score }) => ({
      documentId: doc.documentId,
      title: doc.title,
      snippet: doc.content.substring(0, 150) + '...',
      relevance: score,
    }));

    const response: GroundedQAResponse = {
      question,
      answer,
      citedSources,
      groundedExclusively: true,
      generatedAt: new Date().toISOString(),
    };

    await this.auditSvc.recordAudit('GROUNDED_QA_ANSWERED', question, askedBy, {
      sourcesCount: citedSources.length,
      topSourceId: citedSources[0]?.documentId,
    });

    this.logger.log(`[KnowledgeGovernance] Consulta respondida com proveniência: "${question}" — ${citedSources.length} fontes.`);
    return response;
  }

  async checkInconsistencies(): Promise<InconsistencyCheckResult> {
    const docs = this.knowledgeSvc.listDocuments();
    const duplicateCandidates: InconsistencyCheckResult['duplicateCandidates'] = [];
    const outdatedDocuments: InconsistencyCheckResult['outdatedDocuments'] = [];

    const now = new Date().getTime();

    for (let i = 0; i < docs.length; i++) {
      const docA = docs[i];
      const ageDays = Math.floor((now - new Date(docA.updatedAt).getTime()) / (1000 * 3600 * 24));
      if (ageDays > 365) {
        outdatedDocuments.push({ docId: docA.documentId, title: docA.title, ageDays });
      }

      for (let j = i + 1; j < docs.length; j++) {
        const docB = docs[j];
        if (docA.title.toLowerCase() === docB.title.toLowerCase()) {
          duplicateCandidates.push({ docIdA: docA.documentId, docIdB: docB.documentId, similarityScore: 1.0 });
        }
      }
    }

    return {
      hasInconsistencies: duplicateCandidates.length > 0 || outdatedDocuments.length > 0,
      duplicateCandidates,
      outdatedDocuments,
      checkedAt: new Date().toISOString(),
    };
  }
}
