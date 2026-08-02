import { Injectable, Logger } from '@nestjs/common';
import { EnterpriseKnowledgeService, KnowledgeItem } from './enterprise-knowledge.service';
import { KnowledgeAuditService } from './knowledge-audit.service';

export interface GovernanceAlert {
  alertId: string;
  knowledgeId: string;
  itemTitle: string;
  alertType: 'EXPIRED' | 'PENDING_REVIEW' | 'NO_OWNER' | 'UNCATEGORIZED';
  description: string;
  createdAt: string;
}

/**
 * KnowledgeGovernanceService — Governança do Conhecimento (P158 AEKIP)
 *
 * Monitora e garante a qualidade do patrimônio de conhecimento:
 * identificando conteúdos vencidos, sem proprietário responsável, pendentes de
 * revisão formal e emitindo alertas operacionais de conformidade.
 */
@Injectable()
export class KnowledgeGovernanceService {
  private readonly logger = new Logger(KnowledgeGovernanceService.name);

  constructor(
    private readonly knowledgeService: EnterpriseKnowledgeService,
    private readonly audit: KnowledgeAuditService,
  ) {}

  checkGovernanceAlerts(): GovernanceAlert[] {
    const items = this.knowledgeService.listKnowledgeItems();
    const alerts: GovernanceAlert[] = [];

    const now = new Date().getTime();
    const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

    for (const item of items) {
      const updatedTime = new Date(item.updatedAt).getTime();
      const ageMs = now - updatedTime;

      if (ageMs > SIX_MONTHS_MS) {
        alerts.push({
          alertId: `ALT-EXP-${item.knowledgeId}`,
          knowledgeId: item.knowledgeId,
          itemTitle: item.title,
          alertType: 'EXPIRED',
          description: `Item "${item.title}" não é revisado há mais de 6 meses.`,
          createdAt: new Date().toISOString(),
        });
      }

      if (!item.owner || item.owner === 'UNKNOWN') {
        alerts.push({
          alertId: `ALT-OWN-${item.knowledgeId}`,
          knowledgeId: item.knowledgeId,
          itemTitle: item.title,
          alertType: 'NO_OWNER',
          description: `Item "${item.title}" não possui proprietário responsável associado.`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return alerts;
  }
}
