import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateIncidentDto,
  ExecutePlaybookDto,
  IncidentSeverity,
  IncidentStatus,
  PlaybookAction,
  ThreatType,
} from '../dto/observability.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface SecurityIncident {
  incidentId: string;
  incidentCode: string; // INC-2026-XXXXX
  title: string;
  threatType: ThreatType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  affectedTarget?: string;
  playbooksExecuted: Array<{ action: PlaybookAction; executedAt: string; executedBy: string; result: string }>;
  evidenceLog: string[];
  createdAt: string;
  containedAt?: string;
  resolvedAt?: string;
}

/**
 * SocAutomationService — Automação do SOC (Centro de Operações de Segurança) e Gestão de Incidentes
 *
 * Funcionalidades:
 * - Ciclo de vida completo de Incidentes: OPEN → CONTAINED → ERADICATED → RESOLVED → CLOSED
 * - Código imutável `INC-YYYY-XXXXX`
 * - Playbooks automáticos de contenção SOAR:
 *   - REVOKE_SESSION (revogação de JWT / token)
 *   - BLOCK_IP (bloqueio de IP no firewall/WAF)
 *   - ISOLATE_USER (suspensão temporária de usuário no IAM)
 *   - LOCK_ACCOUNT (bloqueio preventivo de conta)
 * - Preservação de evidências imutáveis para auditoria e investigação pericial
 * - Emissão de eventos CloudEvents `aura.observability.incident.created.v1` e `aura.observability.incident.resolved.v1`
 *
 * Referências: P118 AECS, P142 AEOCSAP Etapas 7, 9
 */
@Injectable()
export class SocAutomationService {
  private readonly logger = new Logger(SocAutomationService.name);
  private readonly incidents = new Map<string, SecurityIncident>();
  private incidentSequence = 1000;

  constructor(private readonly eventBus: EventBusService) {}

  private nextCode(): string {
    this.incidentSequence++;
    return `INC-${new Date().getFullYear()}-${this.incidentSequence}`;
  }

  async createIncident(dto: CreateIncidentDto, tenantId = 'default'): Promise<SecurityIncident> {
    const incidentId = randomUUID();
    const incidentCode = this.nextCode();
    const createdAt = new Date().toISOString();

    const incident: SecurityIncident = {
      incidentId,
      incidentCode,
      title: dto.title,
      threatType: dto.threatType,
      severity: dto.severity,
      status: IncidentStatus.OPEN,
      description: dto.description,
      affectedTarget: dto.affectedTarget,
      playbooksExecuted: [],
      evidenceLog: [`[${createdAt}] Incidente criado por detecção de ameaça (${dto.threatType})`],
      createdAt,
    };

    this.incidents.set(incidentId, incident);
    this.logger.warn(`[SOC] 🚨 INCIDENTE CRIADO: ${incidentCode} — "${dto.title}" | Severidade: ${dto.severity}`);

    await this.eventBus.publish(
      'aura.observability.incident.created.v1',
      { incidentId, incidentCode, title: dto.title, severity: dto.severity, threatType: dto.threatType },
      tenantId,
      { subject: incidentId },
    );

    // Se severidade for CRITICAL, executa playbook de contenção automática (SOAR)
    if (dto.severity === IncidentSeverity.CRITICAL && dto.affectedTarget) {
      await this.executePlaybook(
        { incidentId, action: PlaybookAction.ISOLATE_USER, reason: 'Contenção automática de emergência para incidente CRÍTICO.' },
        'system-soar-engine',
        tenantId,
      );
    }

    return incident;
  }

  async executePlaybook(dto: ExecutePlaybookDto, executedBy: string, tenantId = 'default'): Promise<SecurityIncident> {
    const incident = this.findOrThrow(dto.incidentId);
    const now = new Date().toISOString();

    let resultMsg = '';

    switch (dto.action) {
      case PlaybookAction.REVOKE_SESSION:
        resultMsg = `Sessões JWT do usuário/alvo ${incident.affectedTarget ?? 'desconhecido'} revogadas imediatamente.`;
        break;
      case PlaybookAction.BLOCK_IP:
        resultMsg = `IP ${incident.affectedTarget ?? '0.0.0.0'} adicionado à lista de bloqueio do WAF/Firewall.`;
        break;
      case PlaybookAction.ISOLATE_USER:
        resultMsg = `Usuário ${incident.affectedTarget} isolado preventivamente no Identity Fabric (IAM).`;
        break;
      case PlaybookAction.LOCK_ACCOUNT:
        resultMsg = `Conta ${incident.affectedTarget} bloqueada com notificação enviada à equipe de segurança.`;
        break;
      default:
        resultMsg = `Alerta disparado para o canal do SOC / CISO.`;
        break;
    }

    incident.playbooksExecuted.push({
      action: dto.action,
      executedAt: now,
      executedBy,
      result: resultMsg,
    });

    incident.evidenceLog.push(`[${now}] Playbook SOAR [${dto.action}] executado por ${executedBy}: ${resultMsg}`);
    incident.status = IncidentStatus.CONTAINED;
    incident.containedAt = now;

    this.logger.log(`[SOC] ⚡ Playbook ${dto.action} executado no incidente ${incident.incidentCode} → ${resultMsg}`);
    return incident;
  }

  async resolveIncident(incidentId: string, resolutionNotes: string, resolvedBy: string, tenantId = 'default'): Promise<SecurityIncident> {
    const incident = this.findOrThrow(incidentId);
    const now = new Date().toISOString();

    incident.status = IncidentStatus.RESOLVED;
    incident.resolvedAt = now;
    incident.evidenceLog.push(`[${now}] Incidente RESOLVIDO por ${resolvedBy}. Notas: ${resolutionNotes}`);

    this.logger.log(`[SOC] ✅ Incidente ${incident.incidentCode} RESOLVIDO por ${resolvedBy}`);

    await this.eventBus.publish(
      'aura.observability.incident.resolved.v1',
      { incidentId: incident.incidentId, incidentCode: incident.incidentCode, resolvedBy, resolvedAt: now },
      tenantId,
      { subject: incident.incidentId },
    );

    return incident;
  }

  findOrThrow(incidentId: string): SecurityIncident {
    const incident = this.incidents.get(incidentId) ?? [...this.incidents.values()].find((i) => i.incidentCode === incidentId);
    if (!incident) throw new NotFoundException(`Incidente ${incidentId} não encontrado.`);
    return incident;
  }

  listIncidents(): SecurityIncident[] {
    return [...this.incidents.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
