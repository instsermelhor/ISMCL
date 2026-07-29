import { CorporateUniversityService } from './corporate-university.service';
import { AssessmentCertificationService } from './assessment-certification.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  CourseCategory,
  CourseModality,
  EnrollmentStatus,
} from '../dto/corporate-university.dto';

describe('CorporateUniversityService', () => {
  let service: CorporateUniversityService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new CorporateUniversityService(eventBusMock as EventBusService);
  });

  it('should have pre-seeded institutional courses', () => {
    const courses = service.listCourses();
    expect(courses.length).toBeGreaterThanOrEqual(3);
    const mandatory = courses.find((c) => c.category === CourseCategory.MANDATORY);
    expect(mandatory).toBeDefined();
    expect(mandatory?.workloadHours).toBe(10);
  });

  it('should create a course and issue CloudEvent', async () => {
    const course = await service.createCourse({
      title: 'Boas Práticas de Atendimento Multidisciplinar',
      description: 'Curso de alinhamento para assistentes sociais e psicólogos.',
      category: CourseCategory.TECHNICAL,
      modality: CourseModality.ONLINE,
      workloadHours: 15,
    });

    expect(course.courseId).toBeDefined();
    expect(course.courseCode).toMatch(/^CRS-\d{4}-\d{4,5}$/);
    expect(course.passingGrade).toBe(70);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.lms.course.created.v1',
      expect.objectContaining({ title: expect.stringContaining('Multidisciplinar') }),
      'default',
      expect.anything(),
    );
  });

  it('should enroll user and update progress to COMPLETED at 100%', async () => {
    const courses = service.listCourses();
    const targetCourse = courses[0];

    const enrollment = await service.enrollUser({
      courseId: targetCourse.courseId,
      userId: 'user-student-001',
    });

    expect(enrollment.status).toBe(EnrollmentStatus.ENROLLED);
    expect(enrollment.progressPercentage).toBe(0);

    const updated = await service.updateProgress(enrollment.enrollmentId, 100);
    expect(updated.status).toBe(EnrollmentStatus.COMPLETED);
    expect(updated.completedAt).toBeDefined();
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.lms.enrollment.completed.v1',
      expect.objectContaining({ enrollmentId: enrollment.enrollmentId }),
      'default',
      expect.anything(),
    );
  });
});

describe('AssessmentCertificationService', () => {
  let lmsService: CorporateUniversityService;
  let certService: AssessmentCertificationService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    lmsService = new CorporateUniversityService(eventBusMock as EventBusService);
    certService = new AssessmentCertificationService(lmsService, eventBusMock as EventBusService);
  });

  it('should submit assessment and complete course upon passing', async () => {
    const courses = lmsService.listCourses();
    const course = courses[0];

    // Enroll user first
    await lmsService.enrollUser({ courseId: course.courseId, userId: 'user-student-002' });

    // Submit assessment
    const result = await certService.submitAssessment({
      courseId: course.courseId,
      assessmentId: [...(certService as any).assessments.keys()][0],
      answersPayload: JSON.stringify({ q1: 'A', q2: 'B' }),
    }, 'user-student-002');

    expect(result.passed).toBe(true);
    expect(result.scoreAchieved).toBeGreaterThanOrEqual(70);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.lms.assessment.finished.v1',
      expect.objectContaining({ passed: true }),
      'default',
      expect.anything(),
    );
  });

  it('should issue digital certificate with SHA-256 signature and QR Code payload', async () => {
    const courses = lmsService.listCourses();
    const course = courses[0];

    const enrollment = await lmsService.enrollUser({ courseId: course.courseId, userId: 'user-student-003' });
    await lmsService.updateProgress(enrollment.enrollmentId, 100);

    const cert = await certService.issueCertificate({ enrollmentId: enrollment.enrollmentId });
    expect(cert.certificateCode).toMatch(/^CERT-\d{4}-\d{4,5}$/);
    expect(cert.digitalSignature).toHaveLength(64); // SHA-256
    expect(cert.verificationUrl).toContain(cert.certificateCode);

    const verified = certService.verifyCertificate(cert.certificateCode);
    expect(verified.userId).toBe('user-student-003');
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.lms.certificate.issued.v1',
      expect.objectContaining({ certificateCode: cert.certificateCode }),
      'default',
      expect.anything(),
    );
  });
});
