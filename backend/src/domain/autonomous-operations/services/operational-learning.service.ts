import { Injectable, Logger } from '@nestjs/common';
import { RecordOperationalLearningDto } from '../dto/autonomous-operations.dto';
import { ImprovementGovernanceService } from './improvement-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface OperationalLearningRecord {
  learningId: string;
  title: string;
  actionTaken: string;
  resultMetrics: string;
  lessonLearned: string;
  recordedAt: string;
}

/**
 * OperationalLearningService — Aprendizagem Operacional (P164 AOCP)
 *
 * Registra decisões, resultados, sucessos, falhas, melhorias implementadas
 * e lições aprendidas antes/depois para aperfeiçoar recomendações futuras da IA.
 */
@Injectable()
export class OperationalLearningService {
  private readonly logger = new Logger(OperationalLearningService.name);
  private learningStore: Map<string, OperationalLearningRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly governance: ImprovementGovernanceService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedLearning();
  }

  private seedLearning(): void {
    const seed: RecordOperationalLearningDto = {
      title: 'Otimização de índice no PostgreSQL para prontuários assistenciais',
      actionTaken: 'Adição de índice composto (beneficiary_id, created_at)',
      resultMetrics: 'Tempo médio de busca caiu de 1.8s para 14ms (melhoria de 99.2%)',
      lessonLearned: 'Índices compostos reduzem o consumo de I/O em queries relacionais frequentes',
    };
    const id = `LEARN-${Date.now()}-SEED`;
    this.learningStore.set(id, {
      learningId: id,
      ...seed,
      recordedAt: new Date().toISOString(),
    });
  }

  async recordLearning(dto: RecordOperationalLearningDto): Promise<OperationalLearningRecord> {
    const learningId = `LEARN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const record: OperationalLearningRecord = {
      learningId,
      title: dto.title,
      actionTaken: dto.actionTaken,
      resultMetrics: dto.resultMetrics,
      lessonLearned: dto.lessonLearned,
      recordedAt: new Date().toISOString(),
    };

    this.learningStore.set(learningId, record);

    await this.governance.recordAudit('RECORD_OPERATIONAL_LEARNING', dto.title, 'CAIO', {
      learningId,
    });

    await this.eventBus.publish(
      'aura.operations.operational.learning.updated.v1',
      { learningId, title: dto.title },
      this.SYSTEM_TENANT,
      { subject: learningId },
    );

    this.logger.log(`[OperationalLearning] Learning ${learningId} recorded: "${dto.title}"`);
    return record;
  }

  listLearnings(): OperationalLearningRecord[] {
    return Array.from(this.learningStore.values());
  }
}
