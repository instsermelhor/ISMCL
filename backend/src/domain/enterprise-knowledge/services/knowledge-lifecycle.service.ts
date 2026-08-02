import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeStatus } from '../dto/enterprise-knowledge.dto';
import { EnterpriseKnowledgeService, KnowledgeDocument } from './enterprise-knowledge.service';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface LifecycleTransition {
  documentId: string;
  fromStatus: KnowledgeStatus;
  toStatus: KnowledgeStatus;
  transitionedBy: string;
  timestamp: string;
  notes: string;
}

/**
 * KnowledgeLifecycleService — P170 EKG
 *
 * Gerencia o ciclo de vida documental:
 * DRAFT → IN_REVIEW → APPROVED → PUBLISHED → ARCHIVED → DEPRECATED.
 * Garante que nenhum conteúdo seja publicado sem fluxo formal de aprovação.
 */
@Injectable()
export class KnowledgeLifecycleService {
  private readonly logger = new Logger(KnowledgeLifecycleService.name);
  private readonly transitions: LifecycleTransition[] = [];

  constructor(
    private readonly knowledgeSvc: EnterpriseKnowledgeService,
    private readonly auditSvc: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async submitForReview(documentId: string, submittedBy: string, notes = ''): Promise<KnowledgeDocument> {
    return this.transitionStatus(documentId, KnowledgeStatus.IN_REVIEW, submittedBy, notes);
  }

  async approveDocument(documentId: string, approvedBy: string, notes = ''): Promise<KnowledgeDocument> {
    const doc = await this.transitionStatus(documentId, KnowledgeStatus.APPROVED, approvedBy, notes);
    doc.approvedBy = approvedBy;
    doc.approvedAt = new Date().toISOString();

    await this.eventBus.publish(
      'aura.ekg.knowledge.approved.v1',
      { documentId, approvedBy, approvedAt: doc.approvedAt },
      'EKG',
      { subject: documentId },
    );

    return doc;
  }

  async publishDocument(documentId: string, publishedBy: string, notes = ''): Promise<KnowledgeDocument> {
    const doc = this.knowledgeSvc.getDocument(documentId);
    if (!doc) throw new Error(`Documento "${documentId}" não encontrado.`);
    if (doc.status !== KnowledgeStatus.APPROVED) {
      throw new Error(`Publicação negada: Documento "${documentId}" deve estar no status APPROVED (atual: ${doc.status}).`);
    }

    const updated = await this.transitionStatus(documentId, KnowledgeStatus.PUBLISHED, publishedBy, notes);
    updated.publishedAt = new Date().toISOString();
    return updated;
  }

  async deprecateDocument(documentId: string, deprecatedBy: string, reason: string): Promise<KnowledgeDocument> {
    return this.transitionStatus(documentId, KnowledgeStatus.DEPRECATED, deprecatedBy, reason);
  }

  getTransitionHistory(documentId: string): LifecycleTransition[] {
    return this.transitions.filter((t) => t.documentId === documentId);
  }

  private async transitionStatus(
    documentId: string,
    targetStatus: KnowledgeStatus,
    performedBy: string,
    notes: string,
  ): Promise<KnowledgeDocument> {
    const doc = this.knowledgeSvc.getDocument(documentId);
    if (!doc) throw new Error(`Documento "${documentId}" não encontrado.`);

    const fromStatus = doc.status;
    doc.status = targetStatus;
    doc.updatedAt = new Date().toISOString();

    const transition: LifecycleTransition = {
      documentId,
      fromStatus,
      toStatus: targetStatus,
      transitionedBy: performedBy,
      timestamp: doc.updatedAt,
      notes,
    };

    this.transitions.push(transition);

    await this.auditSvc.recordAudit('LIFECYCLE_TRANSITION', documentId, performedBy, {
      fromStatus,
      toStatus: targetStatus,
      notes,
    });

    this.logger.log(`[KnowledgeLifecycle] Documento "${documentId}": ${fromStatus} → ${targetStatus}`);
    return doc;
  }
}
