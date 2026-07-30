import { Injectable, Logger } from '@nestjs/common';
import { LearningCategory, RecordLearningDto } from '../dto/autonomous-evolution.dto';
import { ContinuousEvolutionAuditService } from './continuous-evolution-audit.service';
import { EvolutionKnowledgeBaseService } from './evolution-knowledge-base.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface InstitutionalLearningRecord {
  learningId: string;
  tenantId: string;
  category: LearningCategory;
  title: string;
  content: string;
  lessonsLearned: string[];
  tags?: string[];
  knowledgeBaseRef?: string;
  recordedAt: string;
}

/**
 * InstitutionalLearningService — Aprendizagem Institucional Contínua (P153 AAEE)
 *
 * Registra formalmente melhorias implementadas, resultados obtidos, lições aprendidas,
 * feedbacks e indicadores pós-implantação.
 * Sincroniza automaticamente com a Base de Conhecimento Institucional (EvolutionKnowledgeBaseService).
 */
@Injectable()
export class InstitutionalLearningService {
  private readonly logger = new Logger(InstitutionalLearningService.name);
  private learningRegistry: Map<string, InstitutionalLearningRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ContinuousEvolutionAuditService,
    private readonly knowledgeBase: EvolutionKnowledgeBaseService,
    private readonly eventBus: EventBusService,
  ) {}

  async recordLearning(dto: RecordLearningDto): Promise<InstitutionalLearningRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const learningId = `LRN-${year}-${seq}`;

    // Atualiza automaticamente a Base de Conhecimento Evolutiva
    const kbRecord = await this.knowledgeBase.storeKnowledge(
      dto.category,
      `LRN_${learningId}_${dto.title.substring(0, 20).toUpperCase().replace(/\s+/g, '_')}`,
      {
        title: dto.title,
        content: dto.content,
        lessonsLearned: dto.lessonsLearned,
        recordedAt: new Date().toISOString(),
      },
      dto.tags,
    );

    const record: InstitutionalLearningRecord = {
      learningId,
      tenantId: dto.tenantId,
      category: dto.category,
      title: dto.title,
      content: dto.content,
      lessonsLearned: dto.lessonsLearned,
      tags: dto.tags,
      knowledgeBaseRef: kbRecord.knowledgeId,
      recordedAt: new Date().toISOString(),
    };

    this.learningRegistry.set(learningId, record);

    await this.auditService.recordEvolutionAudit({
      componentName: 'institutional-learning',
      actionName: 'LearningRecorded',
      details: { learningId, title: dto.title, category: dto.category, knowledgeBaseRef: kbRecord.knowledgeId },
    });

    await this.eventBus.publish(
      'aura.evolution.learning.updated.v1',
      {
        learningId,
        category: dto.category,
        title: dto.title,
        knowledgeBaseRef: kbRecord.knowledgeId,
      },
      dto.tenantId,
      { subject: learningId },
    );

    this.logger.log(`[InstitutionalLearning] Recorded: ${learningId} → Sync KB: ${kbRecord.knowledgeId}`);
    return record;
  }

  queryLessonsLearned(category?: LearningCategory, tag?: string): InstitutionalLearningRecord[] {
    const all = Array.from(this.learningRegistry.values());
    return all.filter((l) => {
      const matchesCategory = !category || l.category === category;
      const matchesTag = !tag || (l.tags && l.tags.includes(tag));
      return matchesCategory && matchesTag;
    });
  }

  getLearning(learningId: string): InstitutionalLearningRecord | undefined {
    return this.learningRegistry.get(learningId);
  }
}
