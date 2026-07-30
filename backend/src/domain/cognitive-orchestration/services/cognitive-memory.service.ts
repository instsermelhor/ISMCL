import { Injectable, Logger } from '@nestjs/common';
import { StoreMemoryDto } from '../dto/cognitive-orchestration.dto';
import { CognitiveAuditService } from './cognitive-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

// ── INTERFACES ────────────────────────────────────────────────────────────────

export type MemoryCategory =
  | 'DECISION_PATTERN'
  | 'HUMAN_FEEDBACK'
  | 'RECOMMENDATION_OUTCOME'
  | 'INSTITUTIONAL_LEARNING';

export type MemoryType = 'short_term' | 'long_term' | 'working';

export interface CognitiveMemoryRecord {
  memoryId: string;
  tenantId?: string;
  entityId?: string;
  memoryType?: MemoryType;
  category: MemoryCategory;
  key: string;
  content: Record<string, any>;
  importance?: number;
  confidenceWeight: number;
  tags?: string[];
  vectorEmbeddingRef?: string;
  recordedAt: string;
  usageCount: number;
  expiresAt?: string;
}

// ── SERVICE ───────────────────────────────────────────────────────────────────

/**
 * CognitiveMemoryService — Memória Cognitiva Institucional (P152 ACOP)
 *
 * Armazena decisões anteriores, padrões recorrentes, aprendizados,
 * feedbacks humanos e contexto organizacional para aperfeiçoamento contínuo.
 *
 * Referências: P111 (AEAIP), P152 (ACOP), ADR-152
 */
@Injectable()
export class CognitiveMemoryService {
  private readonly logger = new Logger(CognitiveMemoryService.name);
  private memoryStore: Map<string, CognitiveMemoryRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedInitialMemory();
  }

  private seedInitialMemory(): void {
    const defaults: CognitiveMemoryRecord[] = [
      {
        memoryId: 'MEM-2026-0001',
        tenantId: this.SYSTEM_TENANT,
        entityId: 'SYSTEM',
        memoryType: 'long_term',
        category: 'DECISION_PATTERN',
        key: 'HIGH_RISK_CASE_TRIPLE_EVALUATION',
        content: {
          pattern: 'Casos com PHQ-9 > 20 exigem obrigatoriamente Psicologia, Psiquiatria e Serviço Social',
          successRate: 0.96,
          protocolRef: 'CFP-011/2012',
        },
        importance: 0.98,
        confidenceWeight: 0.98,
        tags: ['triagem', 'risco-alto', 'multidisciplinar'],
        recordedAt: new Date().toISOString(),
        usageCount: 42,
      },
      {
        memoryId: 'MEM-2026-0002',
        tenantId: this.SYSTEM_TENANT,
        entityId: 'SYSTEM',
        memoryType: 'long_term',
        category: 'RECOMMENDATION_OUTCOME',
        key: 'TELEHEALTH_SCHEDULING_OPT',
        content: {
          pattern: 'Sessões de teleconsulta agendadas entre 09:00–11:00 possuem 30% menor taxa de absenteísmo',
          successRate: 0.91,
          dataPoints: 1240,
        },
        importance: 0.94,
        confidenceWeight: 0.94,
        tags: ['teleconsulta', 'agendamento', 'otimização'],
        recordedAt: new Date().toISOString(),
        usageCount: 88,
      },
    ];

    for (const record of defaults) {
      this.memoryStore.set(record.memoryId, record);
    }
  }

  // ── Método principal P152 (assinatura do spec) ──────────────────────────────

  /**
   * Armazena uma entrada na memória cognitiva institucional.
   * Compatível com a assinatura do spec P152.
   */
  async storeMemory(dto: StoreMemoryDto): Promise<CognitiveMemoryRecord> {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const year = new Date().getFullYear();
    const memoryId = `MEM-${year}-${seq}`;

    const record: CognitiveMemoryRecord = {
      memoryId,
      tenantId: dto.tenantId,
      entityId: dto.entityId,
      memoryType: dto.memoryType,
      category: this.resolveCategory(dto.memoryType),
      key: dto.key,
      content: dto.content,
      importance: dto.importance ?? 0.8,
      confidenceWeight: dto.importance ?? 0.8,
      tags: dto.tags,
      vectorEmbeddingRef: dto.vectorEmbeddingRef,
      recordedAt: new Date().toISOString(),
      usageCount: 0,
    };

    this.memoryStore.set(memoryId, record);

    await this.eventBus.publish(
      'aura.cognitive.memory.updated.v1',
      { memoryId, key: dto.key, memoryType: dto.memoryType, tenantId: dto.tenantId },
      dto.tenantId,
      { subject: memoryId },
    );

    this.logger.log(`[CognitiveMemory] Stored: ${memoryId} (key: ${dto.key})`);
    return record;
  }

  /**
   * Consulta memórias cognitivas por tenant e entidade.
   * Compatível com a assinatura do spec P152.
   */
  async queryMemory(tenantId: string, entityId?: string): Promise<CognitiveMemoryRecord[]> {
    const results: CognitiveMemoryRecord[] = [];

    for (const record of this.memoryStore.values()) {
      const matchesTenant = record.tenantId === tenantId || record.tenantId === this.SYSTEM_TENANT;
      const matchesEntity = !entityId || record.entityId === entityId;
      if (matchesTenant && matchesEntity) {
        record.usageCount++;
        results.push(record);
      }
    }

    return results;
  }

  // ── Métodos de compatibilidade com implementações anteriores ─────────────────

  /**
   * @deprecated Usar storeMemory() — mantido para backward-compat.
   */
  recordMemory(
    category: MemoryCategory,
    key: string,
    content: Record<string, any>,
    confidenceWeight = 0.9,
  ): CognitiveMemoryRecord {
    const memoryId = `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: CognitiveMemoryRecord = {
      memoryId,
      category,
      key,
      content,
      confidenceWeight,
      recordedAt: new Date().toISOString(),
      usageCount: 1,
    };

    this.memoryStore.set(memoryId, record);
    this.auditService.logAudit('CognitiveMemoryUpdated', 'RecordMemory', { memoryId, key, category });

    this.eventBus
      .publish('aura.cognitive.memory.updated.v1', { memoryId, key, category, confidenceWeight }, this.SYSTEM_TENANT)
      .catch((e) => this.logger.error(e));

    return record;
  }

  /**
   * Busca textual na memória cognitiva.
   */
  searchMemory(searchKey: string): CognitiveMemoryRecord[] {
    const results: CognitiveMemoryRecord[] = [];
    for (const record of this.memoryStore.values()) {
      if (
        record.key.toLowerCase().includes(searchKey.toLowerCase()) ||
        record.category.toLowerCase().includes(searchKey.toLowerCase()) ||
        JSON.stringify(record.content).toLowerCase().includes(searchKey.toLowerCase())
      ) {
        record.usageCount++;
        results.push(record);
      }
    }
    return results;
  }

  getAllMemory(): CognitiveMemoryRecord[] {
    return Array.from(this.memoryStore.values());
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private resolveCategory(memoryType: MemoryType): MemoryCategory {
    const map: Record<MemoryType, MemoryCategory> = {
      short_term: 'DECISION_PATTERN',
      long_term: 'INSTITUTIONAL_LEARNING',
      working: 'RECOMMENDATION_OUTCOME',
    };
    return map[memoryType] ?? 'INSTITUTIONAL_LEARNING';
  }
}
