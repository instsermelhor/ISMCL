import { Injectable, Logger } from '@nestjs/common';
import { CreateIncidentDto, IncidentStatus, ResolveIncidentDto, SeverityLevel } from '../dto/unified-operations.dto';
import { SreGovernanceService } from './sre-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface IncidentRecord {
  incidentId: string;
  tenantId: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  affectedService: string;
  status: IncidentStatus;
  assigneeId: string;
  targetSlaMinutes: number;
  openedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  lessonsLearned?: string[];
  resolvedBy?: string;
}

/**
 * IncidentManagementService — Gerenciamento Corporativo de Incidentes (P156 AUOC)
 *
 * Gerencia o ciclo de vida completo de incidentes (P1-Critical a P4-Low):
 * DETECTED → INVESTIGATING → IDENTIFIED → MONITORING → RESOLVED → CLOSED
 *
 * Controla metas de SLA, atribuição a equipes SRE e registro obrigatório de pós-mortem/lições aprendidas.
 */
@Injectable()
export class IncidentManagementService {
  private readonly logger = new Logger(IncidentManagementService.name);
  private incidentRegistry: Map<string, IncidentRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly sreGovernance: SreGovernanceService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedIncident();
  }

  private seedIncident(): void {
    const seed: IncidentRecord = {
      incidentId: 'INC-2026-0001',
      tenantId: 'TENANT-001',
      title: 'Degradação no Roteamento ACOP (P152)',
      description: 'Latência média de roteamento excedeu 2000ms nos últimos 10 minutos',
      severity: SeverityLevel.P1_CRITICAL,
      affectedService: 'cognitive-orchestration',
      status: IncidentStatus.INVESTIGATING,
      assigneeId: 'SRE-LEAD-01',
      targetSlaMinutes: 15,
      openedAt: new Date().toISOString(),
    };
    this.incidentRegistry.set(seed.incidentId, seed);
  }

  async createIncident(dto: CreateIncidentDto): Promise<IncidentRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const incidentId = `INC-${year}-${seq}`;

    const targetSlaMinutes =
      dto.severity === SeverityLevel.P1_CRITICAL ? 15 : dto.severity === SeverityLevel.P2_HIGH ? 60 : 240;

    const record: IncidentRecord = {
      incidentId,
      tenantId: dto.tenantId,
      title: dto.title,
      description: dto.description,
      severity: dto.severity,
      affectedService: dto.affectedService,
      status: IncidentStatus.DETECTED,
      assigneeId: dto.assigneeId ?? 'ON_CALL_SRE',
      targetSlaMinutes,
      openedAt: new Date().toISOString(),
    };

    this.incidentRegistry.set(incidentId, record);

    await this.sreGovernance.recordOperationalAudit('incident-management', 'IncidentOpened', {
      incidentId,
      severity: dto.severity,
      affectedService: dto.affectedService,
    });

    await this.eventBus.publish(
      'aura.operations.incident.detected.v1',
      { incidentId, title: dto.title, severity: dto.severity, affectedService: dto.affectedService },
      dto.tenantId,
      { subject: incidentId },
    );

    this.logger.warn(`[IncidentManagement] Opened Incident: ${incidentId} (${dto.severity} → ${dto.affectedService})`);
    return record;
  }

  async resolveIncident(dto: ResolveIncidentDto): Promise<IncidentRecord> {
    const record = this.incidentRegistry.get(dto.incidentId);
    if (!record) {
      throw new Error(`Incidente não encontrado: ${dto.incidentId}`);
    }

    record.status = IncidentStatus.RESOLVED;
    record.resolutionNotes = dto.resolutionNotes;
    record.lessonsLearned = dto.lessonsLearned;
    record.resolvedBy = dto.resolvedBy;
    record.resolvedAt = new Date().toISOString();

    await this.sreGovernance.recordOperationalAudit('incident-management', 'IncidentResolved', {
      incidentId: dto.incidentId,
      resolvedBy: dto.resolvedBy,
      resolutionNotes: dto.resolutionNotes,
    });

    await this.eventBus.publish(
      'aura.operations.incident.resolved.v1',
      { incidentId: dto.incidentId, resolvedBy: dto.resolvedBy, affectedService: record.affectedService },
      record.tenantId,
      { subject: dto.incidentId },
    );

    this.logger.log(`[IncidentManagement] Resolved Incident: ${dto.incidentId} by ${dto.resolvedBy}`);
    return record;
  }

  getIncident(incidentId: string): IncidentRecord | undefined {
    return this.incidentRegistry.get(incidentId);
  }

  listIncidents(status?: IncidentStatus): IncidentRecord[] {
    const all = Array.from(this.incidentRegistry.values());
    return status ? all.filter((i) => i.status === status) : all;
  }
}
