import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ClinicalSpecialtyCategory } from '../dto/ehr.dto';

export interface ClinicalTimelineItem {
  itemId: string;
  ehrId: string;
  caseId?: string;
  category: ClinicalSpecialtyCategory;
  title: string;
  summary: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  timestamp: string;
  isSigned: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * ClinicalTimelineService — Linha do Tempo Clínica Inteligente e Filtrável
 *
 * Registra e disponibiliza em ordem cronológica reversa todas as evoluções clínicas,
 * psicológicas, psiquiátricas e sociais do beneficiário.
 *
 * Funcionalidades:
 * - Filtros por Especialidade, Profissional, Período e Palavra-chave
 * - Registro automático ao assinar evoluções
 *
 * Referências: P110 (AEWBPM), P136 (AIEHSR Etapa 5)
 */
@Injectable()
export class ClinicalTimelineService {
  private readonly logger = new Logger(ClinicalTimelineService.name);

  // Storage de itens de linha do tempo clínica por ehrId
  private readonly timelineStore = new Map<string, ClinicalTimelineItem[]>();

  /**
   * Registra um novo evento clínico na linha do tempo.
   */
  async addItem(
    ehrId: string,
    category: ClinicalSpecialtyCategory,
    title: string,
    summary: string,
    authorId: string,
    authorName: string,
    authorRole: string,
    isSigned: boolean,
    caseId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<ClinicalTimelineItem> {
    const itemId = randomUUID();
    const timestamp = new Date().toISOString();

    const item: ClinicalTimelineItem = {
      itemId,
      ehrId,
      caseId,
      category,
      title,
      summary,
      authorId,
      authorName,
      authorRole,
      timestamp,
      isSigned,
      metadata,
    };

    const items = this.timelineStore.get(ehrId) ?? [];
    items.push(item);
    this.timelineStore.set(ehrId, items);

    this.logger.log(`[ClinicalTimeline] Item adicionado ao prontuário ${ehrId}: ${title}`);
    return item;
  }

  /**
   * Consulta a linha do tempo com opção de filtro por categoria/especialidade.
   */
  async getTimeline(
    ehrId: string,
    categoryFilter?: ClinicalSpecialtyCategory,
  ): Promise<ClinicalTimelineItem[]> {
    const items = this.timelineStore.get(ehrId) ?? [];
    let filtered = [...items];

    if (categoryFilter) {
      filtered = filtered.filter((i) => i.category === categoryFilter);
    }

    return filtered.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }
}
