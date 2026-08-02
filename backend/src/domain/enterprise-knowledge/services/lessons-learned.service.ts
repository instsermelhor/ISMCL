import { Injectable, Logger } from '@nestjs/common';
import { RegisterLessonLearnedDto } from '../dto/enterprise-knowledge.dto';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface LessonLearnedRecord {
  lessonId: string;
  title: string;
  context: string;
  rootCause: string;
  preventiveAction: string;
  targetProcess: string;
  author: string;
  isApplied: boolean;
  appliedAt?: string;
  registeredAt: string;
}

/**
 * LessonsLearnedService — P170 EKG
 *
 * Registro e catalogação de lições aprendidas em projetos, incidentes e auditorias.
 * Mapeia causas raiz, ações preventivas e vincula o aprendizado aos processos organizacionais.
 */
@Injectable()
export class LessonsLearnedService {
  private readonly logger = new Logger(LessonsLearnedService.name);
  private readonly lessons: Map<string, LessonLearnedRecord> = new Map();

  constructor(
    private readonly auditSvc: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerLesson(dto: RegisterLessonLearnedDto): Promise<LessonLearnedRecord> {
    const lessonId = `LESSON-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const lesson: LessonLearnedRecord = {
      lessonId,
      title: dto.title,
      context: dto.context,
      rootCause: dto.rootCause,
      preventiveAction: dto.preventiveAction,
      targetProcess: dto.targetProcess,
      author: dto.author,
      isApplied: false,
      registeredAt: now,
    };

    this.lessons.set(lessonId, lesson);

    await this.auditSvc.recordAudit('LESSON_LEARNED_REGISTERED', lessonId, dto.author, {
      title: dto.title,
      targetProcess: dto.targetProcess,
    });

    await this.eventBus.publish(
      'aura.ekg.lesson.learned.registered.v1',
      { lessonId, title: dto.title, targetProcess: dto.targetProcess, author: dto.author },
      'EKG',
      { subject: lessonId },
    );

    this.logger.log(`[LessonsLearned] Lição aprendida "${lessonId}" registrada: "${dto.title}"`);
    return lesson;
  }

  async markAsApplied(lessonId: string, appliedBy: string): Promise<LessonLearnedRecord> {
    const lesson = this.getOrThrow(lessonId);
    lesson.isApplied = true;
    lesson.appliedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('LESSON_LEARNED_APPLIED', lessonId, appliedBy, {
      targetProcess: lesson.targetProcess,
    });

    this.logger.log(`[LessonsLearned] Lição "${lessonId}" marcada como aplicada ao processo "${lesson.targetProcess}".`);
    return lesson;
  }

  getLesson(lessonId: string): LessonLearnedRecord | undefined {
    return this.lessons.get(lessonId);
  }

  listLessons(targetProcess?: string, onlyApplied?: boolean): LessonLearnedRecord[] {
    let list = Array.from(this.lessons.values());
    if (targetProcess) list = list.filter((l) => l.targetProcess.toLowerCase().includes(targetProcess.toLowerCase()));
    if (onlyApplied !== undefined) list = list.filter((l) => l.isApplied === onlyApplied);
    return list.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  }

  private getOrThrow(lessonId: string): LessonLearnedRecord {
    const l = this.lessons.get(lessonId);
    if (!l) throw new Error(`Lição aprendida "${lessonId}" não encontrada.`);
    return l;
  }
}
