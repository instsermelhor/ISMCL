import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface TimelineEntry {
  entryId: string;
  caseId: string;
  eventType: string; // Ex: 'ENCOUNTER_LOGGED', 'CARE_PLAN_UPDATED', 'GOAL_COMPLETED'
  title: string;
  description: string;
  actorId?: string;
  actorRole?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * CaseTimelineService — Linha do Tempo Longitudinal Inteligente e Imutável
 *
 * Registra cronologicamente e de forma auditável todos os acontecimentos de um Caso Assistencial:
 * - Acolhimentos e admissões
 * - Evoluções clínicas e psicossociais
 * - Alterações de prioridade ou status
 * - Atualizações no Plano de Cuidados
 * - Conclusão de metas assistenciais
 * - Auditorias e encaminhamentos
 *
 * Referências: P110 (AEWBPM), P123 (AEDA), P135 (AECMP Etapa 5)
 */
@Injectable()
export class CaseTimelineService {
  private readonly logger = new Logger(CaseTimelineService.name);

  // Storage de eventos de linha do tempo (Prisma/PostgreSQL em produção)
  private readonly timelineStore = new Map<string, TimelineEntry[]>();

  /**
   * Adiciona um novo registro à linha do tempo do caso.
   */
  async addEntry(
    caseId: string,
    eventType: string,
    title: string,
    description: string,
    actorId?: string,
    actorRole?: string,
    metadata?: Record<string, unknown>,
  ): Promise<TimelineEntry> {
    const entryId = randomUUID();
    const timestamp = new Date().toISOString();

    const entry: TimelineEntry = {
      entryId,
      caseId,
      eventType,
      title,
      description,
      actorId,
      actorRole,
      timestamp,
      metadata,
    };

    const caseEntries = this.timelineStore.get(caseId) ?? [];
    caseEntries.push(entry);
    this.timelineStore.set(caseId, caseEntries);

    this.logger.log(`[CaseTimeline] Evento registrado no caso ${caseId}: ${title} (${eventType})`);
    return entry;
  }

  /**
   * Retorna a linha do tempo completa do caso ordenada da mais recente para a mais antiga.
   */
  async getTimeline(caseId: string): Promise<TimelineEntry[]> {
    const entries = this.timelineStore.get(caseId) ?? [];
    return [...entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }
}
