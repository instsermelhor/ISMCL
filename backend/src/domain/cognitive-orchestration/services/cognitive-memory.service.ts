import { Injectable, Logger } from '@nestjs/common';
import { CognitiveAuditService } from './cognitive-audit.service';
import { EventBusService } from '../../../core/event-bus/event-bus.service';

export interface CognitiveMemoryRecord {
  memoryId: string;
  category: 'DECISION_PATTERN' | 'HUMAN_FEEDBACK' | 'RECOMMENDATION_OUTCOME' | 'INSTITUTIONAL_LEARNING';
  key: string;
  content: Record<string, any>;
  confidenceWeight: number;
  recordedAt: string;
  usageCount: number;
}

@Injectable()
export class CognitiveMemoryService {
  private readonly logger = new Logger(CognitiveMemoryService.name);
  private memoryStore: Map<string, CognitiveMemoryRecord> = new Map();

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedInitialMemory();
  }

  private seedInitialMemory() {
    const defaultRecords: CognitiveMemoryRecord[] = [
      {
        memoryId: 'MEM-001',
        category: 'DECISION_PATTERN',
        key: 'HIGH_RISK_CASE_TRIPLE_EVALUATION',
        content: {
          pattern: 'Casos com PHQ-9 > 20 exigem obrigatoriamente Psicologia, Psiquiatria e Serviço Social',
          successRate: 0.96,
        },
        confidenceWeight: 0.98,
        recordedAt: new Date().toISOString(),
        usageCount: 42,
      },
      {
        memoryId: 'MEM-002',
        category: 'RECOMMENDATION_OUTCOME',
        key: 'TELEHEALTH_SCHEDULING_OPT',
        content: {
          pattern: 'Sessões de teleconsulta agendadas entre 09:00 e 11:00 possuem 30% menor taxa de absenteísmo',
          successRate: 0.91,
        },
        confidenceWeight: 0.94,
        recordedAt: new Date().toISOString(),
        usageCount: 88,
      },
    ];

    for (const record of defaultRecords) {
      this.memoryStore.set(record.memoryId, record);
    }
  }

  recordMemory(
    category: CognitiveMemoryRecord['category'],
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

    this.eventBus.publish({
      id: memoryId,
      source: 'aura/cognitive-orchestration/memory',
      type: 'aura.cognitive.memory.updated.v1',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { memoryId, key, category, confidenceWeight },
    });

    return record;
  }

  searchMemory(searchKey: string): CognitiveMemoryRecord[] {
    const results: CognitiveMemoryRecord[] = [];
    for (const record of this.memoryStore.values()) {
      if (record.key.toLowerCase().includes(searchKey.toLowerCase()) || record.category.toLowerCase().includes(searchKey.toLowerCase())) {
        record.usageCount++;
        results.push(record);
      }
    }
    return results;
  }

  getAllMemory(): CognitiveMemoryRecord[] {
    return Array.from(this.memoryStore.values());
  }
}
