import { Injectable, Logger } from '@nestjs/common';
import {
  DeclareCrisisDto,
  CrisisStatus,
  IncidentSeverity,
} from '../dto/business-continuity.dto';
import { ContinuityAuditService } from './continuity-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface CrisisDecision {
  decisionId: string;
  description: string;
  decidedBy: string;
  decidedAt: string;
  approvedBy?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface CrisisRecord {
  crisisId: string;
  title: string;
  severity: IncidentSeverity;
  status: CrisisStatus;
  linkedIncidentId: string;
  crisisCommittee: string[];
  initialStatement: string;
  decisions: CrisisDecision[];
  actionLog: Array<{ action: string; performedBy: string; timestamp: string; notes: string }>;
  declaredAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * CrisisManagementService — P169 BCORP
 *
 * Centro Corporativo de Gestão de Crises.
 * Coordena comitês de crise, registra decisões auditáveis,
 * controla aprovações e mantém rastreabilidade completa.
 * Toda ação permanece auditada e com cadeia de aprovação.
 */
@Injectable()
export class CrisisManagementService {
  private readonly logger = new Logger(CrisisManagementService.name);
  private readonly crises: Map<string, CrisisRecord> = new Map();

  constructor(
    private readonly auditSvc: ContinuityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async declareCrisis(dto: DeclareCrisisDto, declaredBy = 'SYSTEM'): Promise<CrisisRecord> {
    const crisisId = `CRISIS-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const crisis: CrisisRecord = {
      crisisId,
      title: dto.title,
      severity: dto.severity,
      status: CrisisStatus.DECLARED,
      linkedIncidentId: dto.linkedIncidentId,
      crisisCommittee: dto.crisisCommittee ?? ['CEO', 'CTO', 'CISO', 'COO'],
      initialStatement: dto.initialStatement ?? '',
      decisions: [],
      actionLog: [{
        action: 'CRISIS_DECLARED',
        performedBy: declaredBy,
        timestamp: now,
        notes: dto.initialStatement ?? 'Crise declarada.',
      }],
      declaredAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.crises.set(crisisId, crisis);

    await this.auditSvc.recordAudit('CRISIS_DECLARED', crisisId, declaredBy, {
      title: dto.title,
      severity: dto.severity,
      linkedIncidentId: dto.linkedIncidentId,
      committee: dto.crisisCommittee,
    });

    await this.eventBus.publish(
      'aura.bcorp.crisis.declared.v1',
      { crisisId, title: dto.title, severity: dto.severity, linkedIncidentId: dto.linkedIncidentId },
      'BCORP',
      { subject: crisisId },
    );

    this.logger.error(`[CrisisManagement] 🚨 CRISE DECLARADA: "${crisisId}" — ${dto.title} (${dto.severity})`);
    return crisis;
  }

  async recordDecision(crisisId: string, description: string, decidedBy: string): Promise<CrisisDecision> {
    const crisis = this.getOrThrow(crisisId);
    const decisionId = `DEC-${crisisId}-${Date.now().toString(36).toUpperCase()}`;
    const decision: CrisisDecision = {
      decisionId,
      description,
      decidedBy,
      decidedAt: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
    };

    crisis.decisions.push(decision);
    crisis.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('CRISIS_DECISION_RECORDED', crisisId, decidedBy, { decisionId, description });
    this.logger.log(`[CrisisManagement] Decisão "${decisionId}" registrada na crise "${crisisId}".`);
    return decision;
  }

  async approveDecision(crisisId: string, decisionId: string, approvedBy: string): Promise<CrisisDecision> {
    const crisis = this.getOrThrow(crisisId);
    const decision = crisis.decisions.find((d) => d.decisionId === decisionId);
    if (!decision) throw new Error(`Decisão "${decisionId}" não encontrada na crise "${crisisId}".`);

    decision.approvedBy = approvedBy;
    decision.status = 'APPROVED';
    crisis.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('CRISIS_DECISION_APPROVED', crisisId, approvedBy, { decisionId });
    this.logger.log(`[CrisisManagement] Decisão "${decisionId}" aprovada por ${approvedBy}.`);
    return decision;
  }

  async activateCrisis(crisisId: string, activatedBy: string): Promise<CrisisRecord> {
    const crisis = this.getOrThrow(crisisId);
    crisis.status = CrisisStatus.ACTIVE;
    crisis.updatedAt = new Date().toISOString();
    crisis.actionLog.push({ action: 'CRISIS_ACTIVATED', performedBy: activatedBy, timestamp: crisis.updatedAt, notes: 'Crise em gestão ativa.' });

    await this.auditSvc.recordAudit('CRISIS_ACTIVATED', crisisId, activatedBy, {});
    return crisis;
  }

  async resolveCrisis(crisisId: string, resolvedBy: string, summary: string): Promise<CrisisRecord> {
    const crisis = this.getOrThrow(crisisId);
    const now = new Date().toISOString();
    crisis.status = CrisisStatus.RESOLVED;
    crisis.resolvedAt = now;
    crisis.updatedAt = now;
    crisis.actionLog.push({ action: 'CRISIS_RESOLVED', performedBy: resolvedBy, timestamp: now, notes: summary });

    await this.auditSvc.recordAudit('CRISIS_RESOLVED', crisisId, resolvedBy, { summary });
    await this.eventBus.publish('aura.bcorp.crisis.resolved.v1', { crisisId, resolvedBy }, 'BCORP', { subject: crisisId });
    this.logger.log(`[CrisisManagement] ✅ Crise "${crisisId}" resolvida por ${resolvedBy}.`);
    return crisis;
  }

  getCrisis(crisisId: string): CrisisRecord | undefined {
    return this.crises.get(crisisId);
  }

  listCrises(status?: CrisisStatus): CrisisRecord[] {
    const all = Array.from(this.crises.values());
    return status ? all.filter((c) => c.status === status) : all;
  }

  getActiveCrises(): CrisisRecord[] {
    return Array.from(this.crises.values()).filter(
      (c) => c.status === CrisisStatus.DECLARED || c.status === CrisisStatus.ACTIVE,
    );
  }

  private getOrThrow(crisisId: string): CrisisRecord {
    const c = this.crises.get(crisisId);
    if (!c) throw new Error(`Crise "${crisisId}" não encontrada.`);
    return c;
  }
}
