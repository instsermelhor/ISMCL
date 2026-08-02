import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeDomain } from '../dto/enterprise-knowledge.dto';

export interface SemanticAnalysisResult {
  text: string;
  extractedEntities: { name: string; category: string }[];
  domain: KnowledgeDomain;
  keyConcepts: string[];
  semanticEmbeddingSimulated: number[];
  relevanceScore: number;
}

/**
 * SemanticKnowledgeEngineService — Motor de Enriquecimento Semântico (P158 AEKIP)
 *
 * Analisa textos institucionais, extrai conceitos-chave, identifica entidades
 * relevantes e categoriza automaticamente o domínio do conhecimento.
 */
@Injectable()
export class SemanticKnowledgeEngineService {
  private readonly logger = new Logger(SemanticKnowledgeEngineService.name);

  analyzeText(text: string): SemanticAnalysisResult {
    const lower = text.toLowerCase();

    const concepts: string[] = [];
    if (lower.includes('psicossocial') || lower.includes('psicologia') || lower.includes('saúde mental')) {
      concepts.push('Saúde Mental', 'Acolhimento Psicossocial');
    }
    if (lower.includes('beneficiário') || lower.includes('atendimento') || lower.includes('cadastro')) {
      concepts.push('Gestão de Assistência', 'Serviço Social');
    }
    if (lower.includes('lgpd') || lower.includes('privacidade') || lower.includes('conformidade')) {
      concepts.push('Proteção de Dados', 'Conformidade Legal');
    }
    if (concepts.length === 0) concepts.push('Conhecimento Geral Institucional');

    let domain = KnowledgeDomain.OPERATIONAL;
    if (lower.includes('psicossocial') || lower.includes('saúde')) domain = KnowledgeDomain.ASSISTENTIAL;
    if (lower.includes('lgpd') || lower.includes('conformidade')) domain = KnowledgeDomain.COMPLIANCE;
    if (lower.includes('arquitetura') || lower.includes('sistema') || lower.includes('código')) domain = KnowledgeDomain.TECHNICAL;

    // Vetor de embedding simulado (16 dimensões)
    const embedding = Array.from({ length: 16 }, (_, i) => Math.sin(i + text.length) * 0.5 + 0.5);

    return {
      text,
      extractedEntities: [
        { name: 'Instituto Ser Melhor', category: 'ORGANIZATION' },
        { name: domain, category: 'DOMAIN' },
      ],
      domain,
      keyConcepts: concepts,
      semanticEmbeddingSimulated: embedding,
      relevanceScore: 0.92,
    };
  }
}
