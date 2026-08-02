import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeStatus } from '../dto/enterprise-knowledge.dto';
import { EnterpriseKnowledgeService } from './enterprise-knowledge.service';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface WorkflowTransitionResult {
  knowledgeId: string;
  previousStatus: KnowledgeStatus;
  newStatus: KnowledgeStatus;
  transitionedBy: string;
  transitionedAt: string;
  version: number;
}

/**
 * KnowledgeLifecycleService — Ciclo de Vida do Conhecimento (P158 AEKIP)
 *
 * Gerencia as transições formais de estado:
 * DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED → ARCHIVED / DEPRECATED.
 * Garante que alterações passem por aprovação formal e versionamento auditável.
 */
@Injectable()
export class KnowledgeLifecycleService {
  private readonly logger = new Logger(KnowledgeLifecycleService.name);
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly knowledgeService: EnterpriseKnowledgeService,
    private readonly audit: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async submitForReview(knowledgeId: string, requestedBy: string): Promise<WorkflowTransitionResult> {
    const item = this.knowledgeService.getKnowledgeItem(knowledgeId);
    if (!item) throw new Error(`Item não encontrado: ${knowledgeId}`);

    const updated = await this.knowledgeService.updateKnowledgeItem(knowledgeId, {
      status: KnowledgeStatus.UNDER_REVIEW,
      changeReason: 'Enviado para revisão formal',
    });

    await this.audit.recordAudit('SUBMIT_REVIEW', knowledgeId, item.type, requestedBy, {
      previousStatus: item.status,
    });

    return {
      knowledgeId,
      previousStatus: item.status,
      newStatus: KnowledgeStatus.UNDER_REVIEW,
      transitionedBy: requestedBy,
      transitionedAt: new Date().toISOString(),
      version: updated.version,
    };
  }

  async approveKnowledgeItem(knowledgeId: string, approvedBy: string): Promise<WorkflowTransitionResult> {
    const item = this.knowledgeService.getKnowledgeItem(knowledgeId);
    if (!item) throw new Error(`Item não encontrado: ${knowledgeId}`);

    const updated = await this.knowledgeService.updateKnowledgeItem(knowledgeId, {
      status: KnowledgeStatus.APPROVED,
      changeReason: `Aprovado formalmente por ${approvedBy}`,
    });

    await this.audit.recordAudit('APPROVE', knowledgeId, item.type, approvedBy, {});

    await this.eventBus.publish(
      'aura.knowledge.item.approved.v1',
      { knowledgeId, approvedBy, version: updated.version },
      this.SYSTEM_TENANT,
      { subject: knowledgeId },
    );

    return {
      knowledgeId,
      previousStatus: item.status,
      newStatus: KnowledgeStatus.APPROVED,
      transitionedBy: approvedBy,
      transitionedAt: new Date().toISOString(),
      version: updated.version,
    };
  }

  async archiveKnowledgeItem(knowledgeId: string, archivedBy: string): Promise<WorkflowTransitionResult> {
    const item = this.knowledgeService.getKnowledgeItem(knowledgeId);
    if (!item) throw new Error(`Item não encontrado: ${knowledgeId}`);

    const updated = await this.knowledgeService.updateKnowledgeItem(knowledgeId, {
      status: KnowledgeStatus.ARCHIVED,
      changeReason: `Arquivado por ${archivedBy}`,
    });

    await this.audit.recordAudit('ARCHIVE', knowledgeId, item.type, archivedBy, {});

    await this.eventBus.publish(
      'aura.knowledge.item.archived.v1',
      { knowledgeId, archivedBy, version: updated.version },
      this.SYSTEM_TENANT,
      { subject: knowledgeId },
    );

    return {
      knowledgeId,
      previousStatus: item.status,
      newStatus: KnowledgeStatus.ARCHIVED,
      transitionedBy: archivedBy,
      transitionedAt: new Date().toISOString(),
      version: updated.version,
    };
  }
}
