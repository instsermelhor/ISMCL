import { Injectable, Logger } from '@nestjs/common';
import {
  CreateIncidentDto,
  IncidentSeverity,
  IncidentStatus,
  IncidentCategory,
} from '../dto/business-continuity.dto';
import { ContinuityAuditService } from './continuity-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface IncidentTimelineEntry {
  timestamp: string;
  action: string;
  performedBy: string;
  notes: string;
  status: IncidentStatus;
}

export interface IncidentRecord {
  incidentId: string;
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  detectedBy: string;
  affectedSystems: string[];
  assignedTo?: string;
  timeline: IncidentTimelineEntry[];
  containedAt?: string;
  resolvedAt?: string;
  lessonsLearned?: string;
  detectedAt: string;
  updatedAt: string;
}

/**
 * IncidentResponseService — P169 BCORP
 *
 * Gestão estruturada de incidentes seguindo o ciclo NIST SP 800-61:
 * Detecção → Triagem → Contenção → Erradicação → Recuperação → Lições.
 * Mantém linha do tempo completa e imutavelmente auditada.
 */
@Injectable()
export class IncidentResponseService {
  private readonly logger = new Logger(IncidentResponseService.name);
  private readonly incidents: Map<string, IncidentRecord> = new Map();

  constructor(
    private readonly auditSvc: ContinuityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async createIncident(dto: CreateIncidentDto, detectedBy = 'SYSTEM'): Promise<IncidentRecord> {
    const incidentId = `INC-${dto.severity}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const incident: IncidentRecord = {
      incidentId,
      title: dto.title,
      category: dto.category,
      severity: dto.severity,
      status: IncidentStatus.DETECTED,
      description: dto.description,
      detectedBy: dto.detectedBy ?? detectedBy,
      affectedSystems: dto.affectedSystems ?? [],
      timeline: [{
        timestamp: now,
        action: 'INCIDENT_DETECTED',
        performedBy: dto.detectedBy ?? detectedBy,
        notes: dto.description,
        status: IncidentStatus.DETECTED,
      }],
      detectedAt: now,
      updatedAt: now,
    };

    this.incidents.set(incidentId, incident);

    await this.auditSvc.recordAudit('INCIDENT_DETECTED', incidentId, detectedBy, {
      title: dto.title,
      severity: dto.severity,
      category: dto.category,
      affectedSystems: dto.affectedSystems,
    });

    await this.eventBus.publish(
      'aura.bcorp.incident.detected.v1',
      { incidentId, title: dto.title, severity: dto.severity, category: dto.category },
      'BCORP',
      { subject: incidentId },
    );

    if (dto.severity === IncidentSeverity.P1_CRITICAL) {
      this.logger.error(`[IncidentResponse] 🚨 INCIDENTE P1 CRÍTICO: "${incidentId}" — ${dto.title}`);
    } else {
      this.logger.warn(`[IncidentResponse] Incidente "${incidentId}" detectado (${dto.severity}): ${dto.title}`);
    }

    return incident;
  }

  async advanceStatus(
    incidentId: string,
    newStatus: IncidentStatus,
    notes: string,
    performedBy: string,
  ): Promise<IncidentRecord> {
    const incident = this.getOrThrow(incidentId);
    const now = new Date().toISOString();

    incident.status = newStatus;
    incident.updatedAt = now;

    if (newStatus === IncidentStatus.CONTAINED) incident.containedAt = now;
    if (newStatus === IncidentStatus.RESOLVED) incident.resolvedAt = now;

    incident.timeline.push({
      timestamp: now,
      action: `STATUS_CHANGED_TO_${newStatus}`,
      performedBy,
      notes,
      status: newStatus,
    });

    await this.auditSvc.recordAudit('INCIDENT_STATUS_ADVANCED', incidentId, performedBy, {
      newStatus,
      notes,
    });

    await this.eventBus.publish(
      'aura.bcorp.incident.status.changed.v1',
      { incidentId, newStatus },
      'BCORP',
      { subject: incidentId },
    );

    this.logger.log(`[IncidentResponse] Incidente "${incidentId}" → ${newStatus}`);
    return incident;
  }

  async recordLessonsLearned(incidentId: string, lessons: string, recordedBy: string): Promise<IncidentRecord> {
    const incident = this.getOrThrow(incidentId);
    incident.lessonsLearned = lessons;
    incident.status = IncidentStatus.POST_INCIDENT;
    incident.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('LESSONS_LEARNED_RECORDED', incidentId, recordedBy, { lessons });
    this.logger.log(`[IncidentResponse] Lições aprendidas registradas para "${incidentId}".`);
    return incident;
  }

  getIncident(incidentId: string): IncidentRecord | undefined {
    return this.incidents.get(incidentId);
  }

  listIncidents(severity?: IncidentSeverity, status?: IncidentStatus, category?: IncidentCategory): IncidentRecord[] {
    let incs = Array.from(this.incidents.values());
    if (severity) incs = incs.filter((i) => i.severity === severity);
    if (status) incs = incs.filter((i) => i.status === status);
    if (category) incs = incs.filter((i) => i.category === category);
    return incs.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  }

  getOpenP1Incidents(): IncidentRecord[] {
    return Array.from(this.incidents.values()).filter(
      (i) => i.severity === IncidentSeverity.P1_CRITICAL && i.status !== IncidentStatus.RESOLVED && i.status !== IncidentStatus.POST_INCIDENT,
    );
  }

  private getOrThrow(incidentId: string): IncidentRecord {
    const i = this.incidents.get(incidentId);
    if (!i) throw new Error(`Incidente "${incidentId}" não encontrado.`);
    return i;
  }
}
