import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export type MemoryCategory =
  | 'STRATEGIC_DECISION'
  | 'ARCHITECTURAL_EVOLUTION'
  | 'PLATFORM_MILESTONE'
  | 'CRITICAL_INCIDENT'
  | 'APPROVED_RECOMMENDATION'
  | 'BEST_PRACTICE'
  | 'GOVERNANCE_CHARTER';

export interface MemoryRecord {
  memoryId: string;
  title: string;
  category: MemoryCategory;
  description: string;
  context: string;
  impact: string;
  keyActors: string[];
  associatedArtifacts: string[];
  recordedBy: string;
  occurredAt: string;
  recordedAt: string;
  sha256Signature: string;
}

/**
 * InstitutionalMemoryService — P170 EKG
 *
 * Registra permanentemente a Memória Institucional do Instituto Ser Melhor.
 * Preserva decisões estratégicas, evoluções da plataforma Aura, alterações
 * arquiteturais, marcos históricos, lições aprendidas e incidentes relevantes
 * com navegação cronológica e imutabilidade auditada.
 */
@Injectable()
export class InstitutionalMemoryService {
  private readonly logger = new Logger(InstitutionalMemoryService.name);
  private readonly memoryStore: Map<string, MemoryRecord> = new Map();

  constructor(
    private readonly auditSvc: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async recordMemory(
    title: string,
    category: MemoryCategory,
    description: string,
    context: string,
    impact: string,
    keyActors: string[],
    recordedBy: string,
    occurredAt?: string,
    associatedArtifacts: string[] = [],
  ): Promise<MemoryRecord> {
    const memoryId = `MEM-${category}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const eventTime = occurredAt ?? now;

    const payload = JSON.stringify({ memoryId, title, category, description, keyActors, eventTime });
    const sha256Signature = require('crypto').createHash('sha256').update(payload).digest('hex');

    const record: MemoryRecord = {
      memoryId,
      title,
      category,
      description,
      context,
      impact,
      keyActors,
      associatedArtifacts,
      recordedBy,
      occurredAt: eventTime,
      recordedAt: now,
      sha256Signature,
    };

    this.memoryStore.set(memoryId, record);

    await this.auditSvc.recordAudit('INSTITUTIONAL_MEMORY_RECORDED', memoryId, recordedBy, {
      title,
      category,
      occurredAt: eventTime,
      sha256Signature,
    });

    this.logger.log(`[InstitutionalMemory] Memória registrada: "${title}" (${category}) — ID: ${memoryId}`);
    return record;
  }

  getMemory(memoryId: string): MemoryRecord | undefined {
    return this.memoryStore.get(memoryId);
  }

  getChronologicalTimeline(category?: MemoryCategory, startYear?: number, endYear?: number): MemoryRecord[] {
    let records = Array.from(this.memoryStore.values());
    if (category) records = records.filter((r) => r.category === category);
    if (startYear) records = records.filter((r) => new Date(r.occurredAt).getFullYear() >= startYear);
    if (endYear) records = records.filter((r) => new Date(r.occurredAt).getFullYear() <= endYear);

    // Ordenação cronológica crescente
    return records.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }

  getMemoriesByActor(actorName: string): MemoryRecord[] {
    return Array.from(this.memoryStore.values()).filter((r) =>
      r.keyActors.some((actor) => actor.toLowerCase().includes(actorName.toLowerCase())),
    );
  }
}
