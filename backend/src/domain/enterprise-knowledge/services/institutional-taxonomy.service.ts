import { Injectable, Logger } from '@nestjs/common';
import { ConfidentialityLevel, KnowledgeDomain, KnowledgeType } from '../dto/enterprise-knowledge.dto';

export interface TaxonomyCategory {
  categoryId: string;
  name: string;
  domain: KnowledgeDomain;
  parentCategoryId?: string;
  subcategories: string[];
}

export interface ClassificationResult {
  knowledgeId: string;
  domain: KnowledgeDomain;
  type: KnowledgeType;
  confidentialityLevel: ConfidentialityLevel;
  categories: string[];
  criticismLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  validityMonths: number;
}

/**
 * InstitutionalTaxonomyService — Taxonomia Institucional Corporativa (P158 AEKIP)
 *
 * Classifica todo o acervo do conhecimento em uma taxonomia multi-dimensional:
 * área, tema, público, criticidade, confidencialidade, vigência, processo e módulo.
 */
@Injectable()
export class InstitutionalTaxonomyService {
  private readonly logger = new Logger(InstitutionalTaxonomyService.name);
  private taxonomyTree: Map<string, TaxonomyCategory> = new Map();

  constructor() {
    this.seedTaxonomy();
  }

  private seedTaxonomy(): void {
    const categories: TaxonomyCategory[] = [
      { categoryId: 'TAX-ASSIST', name: 'Assistência Social & Psicossocial', domain: KnowledgeDomain.ASSISTENTIAL, subcategories: ['Psicologia', 'Serviço Social', 'Triagem', 'Acolhimento'] },
      { categoryId: 'TAX-OPER', name: 'Operações & Processos', domain: KnowledgeDomain.OPERATIONAL, subcategories: ['Cadastro', 'Atendimento', 'Escala', 'Voluntariado'] },
      { categoryId: 'TAX-GOV', name: 'Governança & Conformidade', domain: KnowledgeDomain.GOVERNANCE, subcategories: ['LGPD', 'Políticas', 'Normas', 'Auditoria'] },
      { categoryId: 'TAX-TECH', name: 'Tecnologia & Arquitetura', domain: KnowledgeDomain.TECHNICAL, subcategories: ['ADRs', 'Microsserviços', 'APIs', 'IA Cognitiva'] },
    ];
    for (const c of categories) {
      this.taxonomyTree.set(c.categoryId, c);
    }
  }

  classifyItem(
    knowledgeId: string,
    domain: KnowledgeDomain,
    type: KnowledgeType,
    confidentiality: ConfidentialityLevel,
  ): ClassificationResult {
    const criticismMap: Record<KnowledgeType, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      [KnowledgeType.POLICY]: 'CRITICAL',
      [KnowledgeType.NORM]: 'HIGH',
      [KnowledgeType.PROTOCOL]: 'HIGH',
      [KnowledgeType.POP]: 'MEDIUM',
      [KnowledgeType.ADR]: 'HIGH',
      [KnowledgeType.DECISION]: 'HIGH',
      [KnowledgeType.DOCUMENT]: 'MEDIUM',
      [KnowledgeType.ARTICLE]: 'LOW',
      [KnowledgeType.RESEARCH]: 'LOW',
      [KnowledgeType.TRAINING]: 'MEDIUM',
      [KnowledgeType.FAQ]: 'LOW',
      [KnowledgeType.LESSON_LEARNED]: 'MEDIUM',
      [KnowledgeType.TEMPLATE]: 'LOW',
      [KnowledgeType.MULTIMEDIA]: 'LOW',
      [KnowledgeType.PERSON]: 'LOW',
      [KnowledgeType.PROJECT]: 'MEDIUM',
      [KnowledgeType.PROGRAM]: 'MEDIUM',
      [KnowledgeType.PROCESS]: 'HIGH',
      [KnowledgeType.INDICATOR]: 'HIGH',
      [KnowledgeType.RISK]: 'HIGH',
      [KnowledgeType.SYSTEM]: 'HIGH',
      [KnowledgeType.EVIDENCE]: 'MEDIUM',
    };

    const validityMap: Record<KnowledgeType, number> = {
      [KnowledgeType.POLICY]: 12,
      [KnowledgeType.NORM]: 12,
      [KnowledgeType.PROTOCOL]: 6,
      [KnowledgeType.POP]: 6,
      [KnowledgeType.ADR]: 24,
      [KnowledgeType.DECISION]: 12,
      [KnowledgeType.DOCUMENT]: 12,
      [KnowledgeType.ARTICLE]: 24,
      [KnowledgeType.RESEARCH]: 24,
      [KnowledgeType.TRAINING]: 12,
      [KnowledgeType.FAQ]: 6,
      [KnowledgeType.LESSON_LEARNED]: 24,
      [KnowledgeType.TEMPLATE]: 12,
      [KnowledgeType.MULTIMEDIA]: 12,
      [KnowledgeType.PERSON]: 24,
      [KnowledgeType.PROJECT]: 24,
      [KnowledgeType.PROGRAM]: 24,
      [KnowledgeType.PROCESS]: 12,
      [KnowledgeType.INDICATOR]: 12,
      [KnowledgeType.RISK]: 6,
      [KnowledgeType.SYSTEM]: 24,
      [KnowledgeType.EVIDENCE]: 24,
    };

    return {
      knowledgeId,
      domain,
      type,
      confidentialityLevel: confidentiality,
      categories: [domain.toLowerCase(), type.toLowerCase()],
      criticismLevel: criticismMap[type] ?? 'MEDIUM',
      validityMonths: validityMap[type] ?? 12,
    };
  }

  getTaxonomyTree(): TaxonomyCategory[] {
    return Array.from(this.taxonomyTree.values());
  }
}
