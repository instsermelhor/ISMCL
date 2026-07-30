// =============================================================================
// ACU-LMS — Aura Corporate University, Learning Management & Competency Platform
// Tipos e Interfaces TypeScript — Prompt 146
// =============================================================================

export type CourseFormat = 'online_ead' | 'hybrid' | 'presential';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CompetencyType = 'technical' | 'behavioral' | 'institutional' | 'mandatory';

export interface Competency {
  id: string;
  code: string; // e.g. CMP-TEC-01
  name: string;
  description: string;
  type: CompetencyType;
  level: 1 | 2 | 3 | 4 | 5; // Nível de proficiência
  targetRoles: string[]; // e.g. ['Psychologist', 'SocialWorker', 'Manager']
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  contentType: 'video' | 'document' | 'quiz' | 'scorm_xapi' | 'simulator';
  contentUrl: string;
}

export interface Course {
  id: string;
  code: string; // e.g. CRS-2025-01
  title: string;
  description: string;
  workloadHours: number;
  format: CourseFormat;
  status: CourseStatus;
  isMandatory: boolean;
  requiredCompetencies: string[]; // Competency IDs
  developedCompetencies: string[]; // Competency IDs
  modules: CourseModule[];
  passingGradePercent: number; // e.g. 70
  instructorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPath {
  id: string;
  code: string; // e.g. PTH-VOL-01
  title: string;
  targetRole: string; // e.g. 'Voluntário', 'Psicólogo', 'Gestor'
  description: string;
  courseIds: string[];
  isAdaptive: boolean;
  aiRecommendationReason?: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userRole: string;
  enrolledAt: string;
  progressPercent: number; // 0-100
  status: 'active' | 'completed' | 'failed' | 'dropped';
  grade?: number;
  completedAt?: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string; // e.g. CERT-2025-78901
  userId: string;
  userName: string;
  courseTitle: string;
  workloadHours: number;
  issuedAt: string;
  expiresAt?: string;
  qrCodeValidationUrl: string;
  digitalSignatureHash: string;
  isValid: boolean;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  minGradePercent: number;
  questions: AssessmentQuestion[];
}

export type ACUEventType =
  | 'CourseCreated'
  | 'EnrollmentCompleted'
  | 'LearningPathAssigned'
  | 'AssessmentFinished'
  | 'CertificateIssued'
  | 'CompetencyUpdated'
  | 'TrainingCompleted'
  | 'LearningRecommendationGenerated'
  | 'MentorAssigned'
  | 'AcademicAuditExecuted';

export interface ACUAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: ACUEventType;
  description: string;
  hash: string;
}

export interface ACUContextValue {
  courses: Course[];
  competencies: Competency[];
  learningPaths: LearningPath[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  assessments: Assessment[];
  auditLog: ACUAuditEntry[];

  // Actions
  addCourse: (course: Omit<Course, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => void;
  enrollUser: (courseId: string, userId: string, userName: string, userRole: string) => void;
  updateProgress: (enrollmentId: string, newProgressPercent: number, grade?: number) => void;
  issueCertificate: (enrollmentId: string) => Certificate;
  addCompetency: (comp: Omit<Competency, 'id' | 'code'>) => void;
}
