import { Injectable, Logger } from '@nestjs/common';
import {
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  DocumentCategory,
  KnowledgeStatus,
  ConfidentialityLevel,
  PreservationPolicyType,
} from '../dto/enterprise-knowledge.dto';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface DocumentVersion {
  versionNumber: number;
  content: string;
  updatedBy: string;
  changeSummary: string;
  timestamp: string;
  sha256Hash: string;
}

export interface KnowledgeDocument {
  documentId: string;
  title: string;
  summary: string;
  category: DocumentCategory;
  content: string;
  author: string;
  status: KnowledgeStatus;
  confidentiality: ConfidentialityLevel;
  tags: string[];
  relevantDomains: string[];
  preservationPolicy: PreservationPolicyType;
  version: number;
  versionHistory: DocumentVersion[];
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeItem = KnowledgeDocument;

/**
 * EnterpriseKnowledgeService — P170 EKG
 *
 * Repositório corporativo unificado do patrimônio intelectual do Instituto Ser Melhor.
 * Armazena documentos, POPs, políticas, normas, manuais, processos, decisões, atas,
 * pesquisas, protocolos e conteúdos educacionais com metadados estruturados e versionamento.
 */
@Injectable()
export class EnterpriseKnowledgeService {
  private readonly logger = new Logger(EnterpriseKnowledgeService.name);
  private readonly documents: Map<string, KnowledgeDocument> = new Map();

  constructor(
    private readonly auditSvc: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async createDocument(dto: CreateKnowledgeDocumentDto, author = 'SYSTEM'): Promise<KnowledgeDocument> {
    const documentId = `DOC-${dto.category}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const sha256Hash = require('crypto').createHash('sha256').update(dto.content).digest('hex');

    const initialVersion: DocumentVersion = {
      versionNumber: 1,
      content: dto.content,
      updatedBy: dto.author ?? dto.authorId ?? author,
      changeSummary: 'Criação inicial do documento',
      timestamp: now,
      sha256Hash,
    };

    const doc: KnowledgeDocument = {
      documentId,
      title: dto.title,
      summary: dto.summary || dto.title,
      category: dto.category,
      content: dto.content,
      author: dto.author ?? dto.authorId ?? author,
      status: KnowledgeStatus.DRAFT,
      confidentiality: dto.confidentiality ?? ConfidentialityLevel.INTERNAL,
      tags: dto.tags ?? [],
      relevantDomains: dto.relevantDomains ?? [],
      preservationPolicy: dto.preservationPolicy ?? PreservationPolicyType.PERMANENT_HISTORICAL,
      version: 1,
      versionHistory: [initialVersion],
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(documentId, doc);

    await this.auditSvc.recordAudit('KNOWLEDGE_CREATED', documentId, author, {
      title: dto.title,
      category: dto.category,
      confidentiality: doc.confidentiality,
    });

    await this.eventBus.publish(
      'aura.ekg.knowledge.created.v1',
      { documentId, title: dto.title, category: dto.category, author: doc.author },
      'EKG',
      { subject: documentId },
    );

    this.logger.log(`[EnterpriseKnowledge] Documento "${documentId}" criado: "${dto.title}" (${dto.category})`);
    return doc;
  }

  async updateDocument(documentId: string, dto: UpdateKnowledgeDocumentDto): Promise<KnowledgeDocument> {
    const doc = this.getOrThrow(documentId);
    const now = new Date().toISOString();

    if (dto.content) doc.content = dto.content;
    if (dto.tags) doc.tags = Array.from(new Set([...doc.tags, ...dto.tags]));

    doc.version += 1;
    doc.updatedAt = now;

    const sha256Hash = require('crypto').createHash('sha256').update(doc.content).digest('hex');
    const updatedBy = dto.updatedBy ?? 'SYSTEM';
    doc.versionHistory.push({
      versionNumber: doc.version,
      content: doc.content,
      updatedBy,
      changeSummary: dto.changeSummary ?? 'Atualização documental',
      timestamp: now,
      sha256Hash,
    });

    await this.auditSvc.recordAudit('KNOWLEDGE_UPDATED', documentId, updatedBy, {
      newVersion: doc.version,
      changeSummary: dto.changeSummary,
    });

    await this.eventBus.publish(
      'aura.ekg.knowledge.updated.v1',
      { documentId, version: doc.version, updatedBy },
      'EKG',
      { subject: documentId },
    );

    this.logger.log(`[EnterpriseKnowledge] Documento "${documentId}" atualizado para v${doc.version}.`);
    return doc;
  }

  getDocument(documentId: string): KnowledgeDocument | undefined {
    return this.documents.get(documentId);
  }

  listDocuments(category?: DocumentCategory, status?: KnowledgeStatus, tag?: string): KnowledgeDocument[] {
    let docs = Array.from(this.documents.values());
    if (category) docs = docs.filter((d) => d.category === category);
    if (status) docs = docs.filter((d) => d.status === status);
    if (tag) docs = docs.filter((d) => d.tags.includes(tag));
    return docs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  listKnowledgeItems(category?: DocumentCategory, status?: KnowledgeStatus, tag?: string): KnowledgeItem[] {
    return this.listDocuments(category, status, tag);
  }

  private getOrThrow(documentId: string): KnowledgeDocument {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Documento "${documentId}" não encontrado.`);
    return doc;
  }
}
