import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateCourseDto,
  EnrollUserDto,
  CourseCategory,
  CourseModality,
  EnrollmentStatus,
} from '../dto/corporate-university.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface CourseRecord {
  courseId: string;
  courseCode: string; // CRS-2026-XXXXX
  title: string;
  description: string;
  category: CourseCategory;
  modality: CourseModality;
  workloadHours: number;
  passingGrade: number;
  targetCompetencies: string[];
  version: number;
  createdAt: string;
}

export interface EnrollmentRecord {
  enrollmentId: string;
  courseId: string;
  courseCode: string;
  userId: string;
  status: EnrollmentStatus;
  progressPercentage: number;
  gradeAchieved?: number;
  enrolledAt: string;
  completedAt?: string;
}

export interface LearningPath {
  pathId: string;
  roleTarget: string; // ex: 'PSYCHOLOGIST', 'VOLUNTEER', 'ADMIN'
  title: string;
  courseIds: string[];
  mandatoryCount: number;
}

/**
 * CorporateUniversityService — LMS, Catálogo de Cursos, Matrículas e Trilhas de Aprendizagem
 *
 * Funcionalidades:
 * - Catálogo de Cursos Corporativos com códigos auditáveis (`CRS-2026-XXXXX`) e EAD/Híbrido/Presencial
 * - LMS Engine: Matrículas automáticas/manuais, acompanhamento de frequência e progresso (0-100%)
 * - Gestão de Trilhas de Aprendizagem Adaptativas por papel institucional (Psicólogos, Voluntários, Gestores)
 * - Emissão de CloudEvents `aura.lms.course.created.v1` e `aura.lms.enrollment.completed.v1`
 *
 * Referências: P146 ACU-LMS Etapas 2, 3, 4, 5
 */
@Injectable()
export class CorporateUniversityService {
  private readonly logger = new Logger(CorporateUniversityService.name);
  private readonly courses = new Map<string, CourseRecord>();
  private readonly enrollments = new Map<string, EnrollmentRecord>();
  private readonly learningPaths: LearningPath[] = [];
  private courseSequence = 1000;

  constructor(private readonly eventBus: EventBusService) {
    this.seedDefaultCourses();
  }

  private seedDefaultCourses(): void {
    const defaults: Array<{ title: string; category: CourseCategory; modality: CourseModality; workload: number; competencies: string[] }> = [
      {
        title: 'Formação Institucional em Acolhimento e Escuta Qualificada',
        category: CourseCategory.INSTITUTIONAL,
        modality: CourseModality.ONLINE,
        workload: 20,
        competencies: ['Acolhimento Humano', 'Escuta Empática', 'Protocolo ISMCL'],
      },
      {
        title: 'Conformidade LGPD e Proteção de Prontuários Eletrônicos (Capacitação Obrigatória)',
        category: CourseCategory.MANDATORY,
        modality: CourseModality.ONLINE,
        workload: 10,
        competencies: ['LGPD na Saúde', 'Segurança da Informação', 'Zero Trust'],
      },
      {
        title: 'Práticas Clínicas de Gestão de Crise e Encaminhamento de Urgência',
        category: CourseCategory.CLINICAL,
        modality: CourseModality.HYBRID,
        workload: 30,
        competencies: ['Gestão de Crise', 'Psicologia Clínico-Hospitalar', 'Triage Risk'],
      },
    ];

    for (const d of defaults) {
      const courseId = randomUUID();
      const now = new Date();
      this.courseSequence++;
      const courseCode = `CRS-${now.getFullYear()}-${this.courseSequence}`;

      this.courses.set(courseId, {
        courseId,
        courseCode,
        title: d.title,
        description: `Capacitação oficial do Instituto Ser Melhor em ${d.title}.`,
        category: d.category,
        modality: d.modality,
        workloadHours: d.workload,
        passingGrade: 70,
        targetCompetencies: d.competencies,
        version: 1,
        createdAt: now.toISOString(),
      });
    }

    this.logger.log(`[CorporateUniversity] 🎓 Catálogo inicializado com ${this.courses.size} cursos corporativos.`);
  }

  // ── Course & LMS Operations ───────────────────────────────────────────

  async createCourse(dto: CreateCourseDto, tenantId = 'default'): Promise<CourseRecord> {
    this.courseSequence++;
    const courseId = randomUUID();
    const now = new Date();
    const courseCode = `CRS-${now.getFullYear()}-${this.courseSequence}`;

    const course: CourseRecord = {
      courseId,
      courseCode,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      modality: dto.modality,
      workloadHours: dto.workloadHours,
      passingGrade: dto.passingGrade ?? 70,
      targetCompetencies: dto.targetCompetencies ?? [],
      version: 1,
      createdAt: now.toISOString(),
    };

    this.courses.set(courseId, course);
    this.logger.log(`[LMS] 📘 Curso cadastrado: ${courseCode} [${dto.category}] — "${dto.title}" (${dto.workloadHours}h)`);

    await this.eventBus.publish(
      'aura.lms.course.created.v1',
      { courseId, courseCode, title: dto.title, category: dto.category, modality: dto.modality },
      tenantId,
      { subject: courseId },
    );

    return course;
  }

  async enrollUser(dto: EnrollUserDto, tenantId = 'default'): Promise<EnrollmentRecord> {
    const course = this.findCourseOrThrow(dto.courseId);
    const enrollmentId = randomUUID();
    const now = new Date().toISOString();

    const enrollment: EnrollmentRecord = {
      enrollmentId,
      courseId: course.courseId,
      courseCode: course.courseCode,
      userId: dto.userId,
      status: EnrollmentStatus.ENROLLED,
      progressPercentage: 0,
      enrolledAt: now,
    };

    this.enrollments.set(enrollmentId, enrollment);
    this.logger.log(`[LMS] ✍️ Usuário ${dto.userId} matriculado no curso ${course.courseCode}`);

    await this.eventBus.publish(
      'aura.lms.user.enrolled.v1',
      { enrollmentId, courseId: course.courseId, courseCode: course.courseCode, userId: dto.userId },
      tenantId,
      { subject: enrollmentId },
    );

    return enrollment;
  }

  async updateProgress(enrollmentId: string, progressPercentage: number, tenantId = 'default'): Promise<EnrollmentRecord> {
    const enrollment = this.findEnrollmentOrThrow(enrollmentId);
    enrollment.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
    if (enrollment.progressPercentage > 0 && enrollment.status === EnrollmentStatus.ENROLLED) {
      enrollment.status = EnrollmentStatus.IN_PROGRESS;
    }

    if (enrollment.progressPercentage === 100) {
      enrollment.status = EnrollmentStatus.COMPLETED;
      enrollment.completedAt = new Date().toISOString();

      await this.eventBus.publish(
        'aura.lms.enrollment.completed.v1',
        { enrollmentId, courseId: enrollment.courseId, userId: enrollment.userId },
        tenantId,
        { subject: enrollmentId },
      );
    }

    return enrollment;
  }

  // ── Accessors & Utilities ─────────────────────────────────────────────

  findCourseOrThrow(id: string): CourseRecord {
    const course = this.courses.get(id) ?? [...this.courses.values()].find((c) => c.courseCode === id);
    if (!course) throw new NotFoundException(`Curso ${id} não encontrado no catálogo.`);
    return course;
  }

  findEnrollmentOrThrow(id: string): EnrollmentRecord {
    const e = this.enrollments.get(id);
    if (!e) throw new NotFoundException(`Matrícula ${id} não encontrada.`);
    return e;
  }

  listCourses(): CourseRecord[] {
    return [...this.courses.values()].sort((a, b) => a.title.localeCompare(b.title));
  }

  listEnrollments(userId?: string): EnrollmentRecord[] {
    const all = [...this.enrollments.values()];
    return userId ? all.filter((e) => e.userId === userId) : all;
  }
}
