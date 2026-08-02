import { Injectable, Logger } from '@nestjs/common';
import { LessonsLearnedService } from './lessons-learned.service';
import { KnowledgeAuditService } from './knowledge-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface CompetencyRecord {
  competencyId: string;
  name: string;
  category: 'TECHNICAL' | 'BEHAVIORAL' | 'MANAGERIAL' | 'COMPLIANCE';
  developedByCount: number;
  lastUpdated: string;
}

export interface OrganizationalLearningReport {
  reportId: string;
  totalLessonsLearned: number;
  appliedLessonsCount: number;
  applicationRate: number; // 0–100%
  competenciesTracked: number;
  learningIndex: number; // 0–100
  recommendations: string[];
  generatedAt: string;
}

/**
 * OrganizationalLearningService — P170 EKG
 *
 * Gestão do Aprendizado Organizacional.
 * Acompanha o desenvolvimento de competências, taxa de aplicação de lições aprendidas,
 * treinamentos concluídos e calcula o Índice de Aprendizado Organizacional do ISM.
 */
@Injectable()
export class OrganizationalLearningService {
  private readonly logger = new Logger(OrganizationalLearningService.name);
  private readonly competencies: Map<string, CompetencyRecord> = new Map();

  constructor(
    private readonly lessonsSvc: LessonsLearnedService,
    private readonly auditSvc: KnowledgeAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerCompetency(name: string, category: CompetencyRecord['category'], registeredBy = 'SYSTEM'): Promise<CompetencyRecord> {
    const competencyId = `COMP-${Date.now().toString(36).toUpperCase()}`;
    const comp: CompetencyRecord = {
      competencyId,
      name,
      category,
      developedByCount: 1,
      lastUpdated: new Date().toISOString(),
    };

    this.competencies.set(competencyId, comp);
    await this.auditSvc.recordAudit('COMPETENCY_REGISTERED', competencyId, registeredBy, { name, category });
    this.logger.log(`[OrganizationalLearning] Competência "${name}" registrada.`);
    return comp;
  }

  async generateLearningReport(generatedBy = 'SYSTEM'): Promise<OrganizationalLearningReport> {
    const allLessons = this.lessonsSvc.listLessons();
    const appliedLessons = allLessons.filter((l) => l.isApplied);

    const total = allLessons.length;
    const applied = appliedLessons.length;
    const applicationRate = total > 0 ? Math.round((applied / total) * 100) : 100;

    // Índice de Aprendizado (0-100)
    const learningIndex = Math.min(100, Math.round(applicationRate * 0.7 + (this.competencies.size * 5)));

    const recommendations: string[] = [];
    if (applicationRate < 50) {
      recommendations.push('Taxa de aplicação de lições aprendidas abaixo de 50%. Promover workshop de incorporação nos processos.');
    }
    if (this.competencies.size < 3) {
      recommendations.push('Mapear mais competências corporativas no catálogo institucional.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Aprendizado organizacional em bom ritmo. Manter alinhamento com a Universidade Corporativa.');
    }

    const reportId = `LEARN-REP-${Date.now().toString(36).toUpperCase()}`;
    const report: OrganizationalLearningReport = {
      reportId,
      totalLessonsLearned: total,
      appliedLessonsCount: applied,
      applicationRate,
      competenciesTracked: this.competencies.size,
      learningIndex,
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    await this.auditSvc.recordAudit('ORGANIZATIONAL_LEARNING_EVALUATED', reportId, generatedBy, {
      learningIndex,
      applicationRate,
    });

    await this.eventBus.publish(
      'aura.ekg.organizational.learning.updated.v1',
      { reportId, learningIndex, applicationRate },
      'EKG',
      { subject: reportId },
    );

    this.logger.log(`[OrganizationalLearning] Relatório gerado — Índice de Aprendizado: ${learningIndex}/100.`);
    return report;
  }

  listCompetencies(): CompetencyRecord[] {
    return Array.from(this.competencies.values());
  }
}
