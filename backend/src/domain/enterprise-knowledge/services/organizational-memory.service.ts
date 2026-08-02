import { Injectable, Logger } from '@nestjs/common';
import { RecordOrganizationalMemoryDto, MemoryEventType } from '../dto/enterprise-knowledge.dto';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface OrganizationalMemoryEntry {
  memoryId: string;
  eventType: MemoryEventType;
  title: string;
  description: string;
  recordedBy: string;
  metadata: Record<string, any>;
  recordedAt: string;
}

/**
 * OrganizationalMemoryService — Memória Organizacional (P158 AEKIP)
 *
 * Registra automaticamente todos os eventos relevantes da instituição:
 * decisões, melhorias, incidentes resolvidos, lições aprendidas, auditorias,
 * projetos concluídos e revisões operacionais — preservando o conhecimento
 * histórico e permitindo rastrear a evolução institucional.
 */
@Injectable()
export class OrganizationalMemoryService {
  private readonly logger = new Logger(OrganizationalMemoryService.name);
  private memoryStore: OrganizationalMemoryEntry[] = [];
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedMemoryEntries();
  }

  private seedMemoryEntries(): void {
    const seeds = [
      { eventType: MemoryEventType.ARCHITECTURAL_CHANGE, title: 'Implantação do AUOC — P156', description: 'Centro Unificado de Operações implementado com AIOps, SRE e Chaos Engineering', recordedBy: 'SYSTEM_SEED', metadata: { phase: 'VII', prompt: 156 } },
      { eventType: MemoryEventType.ARCHITECTURAL_CHANGE, title: 'Implantação do ADT — P157', description: 'Digital Twin Organizacional implementado com simulações estratégicas e cenários', recordedBy: 'SYSTEM_SEED', metadata: { phase: 'VIII', prompt: 157 } },
      { eventType: MemoryEventType.LESSON_LEARNED, title: 'Kafka Consumer Groups por Domínio', description: 'A configuração de consumer groups independentes por domínio DDD elimina colisões de offset', recordedBy: 'SRE-LEAD-01', metadata: { relatedModule: 'event-bus' } },
    ];

    for (const s of seeds) {
      this.memoryStore.push({
        memoryId: `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        ...s,
        recordedAt: new Date().toISOString(),
      });
    }
  }

  async recordMemory(dto: RecordOrganizationalMemoryDto): Promise<OrganizationalMemoryEntry> {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const memoryId = `MEM-${Date.now()}-${seq}`;

    const entry: OrganizationalMemoryEntry = {
      memoryId,
      eventType: dto.eventType,
      title: dto.title,
      description: dto.description,
      recordedBy: dto.recordedBy ?? 'SYSTEM',
      metadata: dto.metadata ?? {},
      recordedAt: new Date().toISOString(),
    };

    this.memoryStore.push(entry);

    await this.audit.recordAudit('RECORD_MEMORY', memoryId, dto.eventType, dto.recordedBy ?? 'SYSTEM', {
      title: dto.title,
    });

    await this.eventBus.publish(
      'aura.knowledge.memory.updated.v1',
      { memoryId, eventType: dto.eventType, title: dto.title },
      this.SYSTEM_TENANT,
      { subject: memoryId },
    );

    this.logger.log(`[OrganizationalMemory] Recorded: ${memoryId} (${dto.eventType})`);
    return entry;
  }

  queryMemory(eventType?: MemoryEventType, keyword?: string): OrganizationalMemoryEntry[] {
    return this.memoryStore.filter(
      (e) =>
        (!eventType || e.eventType === eventType) &&
        (!keyword || e.title.toLowerCase().includes(keyword.toLowerCase()) || e.description.toLowerCase().includes(keyword.toLowerCase())),
    );
  }

  getAllMemory(): OrganizationalMemoryEntry[] {
    return [...this.memoryStore];
  }
}
