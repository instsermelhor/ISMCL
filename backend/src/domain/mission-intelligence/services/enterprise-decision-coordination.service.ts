import { Injectable, Logger } from '@nestjs/common';
import { CoordinateDecisionDto } from '../dto/mission-intelligence.dto';
import { ExecutiveGovernanceAuditService } from './executive-governance-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface CoordinatedDecisionRecord {
  coordinationId: string;
  title: string;
  summary: string;
  evidenceIds: string[];
  coordinatedBy: string;
  status: 'COORDINATED' | 'MONITORING' | 'CLOSED';
  lessonsLearned: string[];
  coordinatedAt: string;
}

/**
 * EnterpriseDecisionCoordinationService — Coordenação Corporativa de Decisões (P160 AEMIAG)
 *
 * Gerencia o ciclo decisório executivo ponta a ponta: necessidade → evidências → simulação →
 * recomendação → aprovação → execução → monitoramento pós-decisão → lições aprendidas.
 */
@Injectable()
export class EnterpriseDecisionCoordinationService {
  private readonly logger = new Logger(EnterpriseDecisionCoordinationService.name);
  private decisionHistory: CoordinatedDecisionRecord[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: ExecutiveGovernanceAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async coordinateDecision(dto: CoordinateDecisionDto): Promise<CoordinatedDecisionRecord> {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const coordinationId = `COORD-${Date.now()}-${seq}`;

    const record: CoordinatedDecisionRecord = {
      coordinationId,
      title: dto.title,
      summary: dto.summary,
      evidenceIds: dto.evidenceIds,
      coordinatedBy: dto.coordinatedBy,
      status: 'COORDINATED',
      lessonsLearned: dto.lessonsLearned ?? ['Acompanhar indicadores de ocupação semanalmente.'],
      coordinatedAt: new Date().toISOString(),
    };

    this.decisionHistory.push(record);

    await this.audit.recordExecutiveAudit('COORDINATE_DECISION', 'CEO', 'enterprise-decision-coordination', {
      coordinationId, title: dto.title, coordinatedBy: dto.coordinatedBy,
    });

    await this.eventBus.publish(
      'aura.mission.decision.coordinated.v1',
      { coordinationId, title: dto.title, coordinatedBy: dto.coordinatedBy },
      this.SYSTEM_TENANT,
      { subject: coordinationId },
    );

    this.logger.log(`[EnterpriseDecisionCoordination] Coordinated: ${coordinationId} — ${dto.title}`);
    return record;
  }

  getDecisionHistory(): CoordinatedDecisionRecord[] {
    return [...this.decisionHistory];
  }
}
