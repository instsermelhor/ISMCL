import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  ACUContextValue, Course, Competency, LearningPath, Enrollment, Certificate, Assessment, ACUAuditEntry
} from '../types/acu';

const INITIAL_COMPETENCIES: Competency[] = [
  { id: 'cmp-1', code: 'CMP-INST-01', name: 'Código de Ética e Conduta Institucional', description: 'Domínio das diretrizes éticas e conduta no atendimento a populações vulneráveis.', type: 'mandatory', level: 5, targetRoles: ['Todos'] },
  { id: 'cmp-2', code: 'CMP-TEC-01', name: 'Atendimento Clínico e Escuta Ativa', description: 'Capacidade técnica de realizar acolhimento psicossocial qualificado e escuta empática.', type: 'technical', level: 4, targetRoles: ['Psicólogo', 'Assistente Social'] },
  { id: 'cmp-3', code: 'CMP-TEC-02', name: 'Gestão de Crises e Riscos Assistenciais', description: 'Protocolos de intervenção em ideação suicida e situações de violência relacional.', type: 'technical', level: 5, targetRoles: ['Psicólogo', 'Psiquiatra'] },
  { id: 'cmp-4', code: 'CMP-BEH-01', name: 'Comunicação Não-Violenta (CNV)', description: 'Habilidade comportamental de mediação de conflitos e empatia nas interações.', type: 'behavioral', level: 4, targetRoles: ['Todos'] },
];

const INITIAL_COURSES: Course[] = [
  {
    id: 'crs-1',
    code: 'CRS-2025-01',
    title: 'Capacitação Obrigatória em LGPD e Privacidade no Atendimento',
    description: 'Treinamento sobre a Lei Geral de Proteção de Dados com foco no manuseio seguro de dados sensíveis de assistidos.',
    workloadHours: 12,
    format: 'online_ead',
    status: 'published',
    isMandatory: true,
    requiredCompetencies: ['cmp-1'],
    developedCompetencies: ['cmp-1'],
    modules: [
      { id: 'm1', title: 'Módulo 1: Princípios da LGPD no Terceiro Setor', description: 'Conceitos fundamentais', durationMinutes: 120, contentType: 'video', contentUrl: '/video/lgpd_m1.mp4' },
      { id: 'm2', title: 'Módulo 2: Manuseio de Prontuários e Dados Sensíveis', description: 'Procedimentos operacionais', durationMinutes: 180, contentType: 'scorm_xapi', contentUrl: '/scorm/lgpd_m2.zip' },
    ],
    passingGradePercent: 80,
    instructorName: 'Dra. Ana Lúcia Souza (DPO)',
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z'
  },
  {
    id: 'crs-2',
    code: 'CRS-2025-02',
    title: 'Protocolos do Programa PIARAVE — Acolhimento e Proteção',
    description: 'Formação especializada em acolhimento a vítimas de violência relacional e vulnerabilidade social.',
    workloadHours: 24,
    format: 'hybrid',
    status: 'published',
    isMandatory: false,
    requiredCompetencies: ['cmp-2'],
    developedCompetencies: ['cmp-2', 'cmp-3'],
    modules: [
      { id: 'm1', title: 'Módulo 1: Identificação de Sinais de Vulnerabilidade', description: 'Avaliação inicial', durationMinutes: 240, contentType: 'video', contentUrl: '/video/piarave_m1.mp4' },
      { id: 'm2', title: 'Módulo 2: Simulação de Atendimento Clínico', description: 'Laboratório virtual', durationMinutes: 300, contentType: 'simulator', contentUrl: '/sim/piarave_m2' },
    ],
    passingGradePercent: 75,
    instructorName: 'Dra. Roberta Santos',
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-02-01T10:00:00Z'
  }
];

const INITIAL_PATHS: LearningPath[] = [
  { id: 'pth-1', code: 'PTH-VOL-01', title: 'Trilha de Integração para Voluntários', targetRole: 'Voluntário', description: 'Capacitação inicial obrigatória cobrindo Código de Ética, LGPD e acolhimento empático.', courseIds: ['crs-1'], isAdaptive: true, aiRecommendationReason: 'Recomendado automaticamente para novos voluntários cadastrados no IAM.' },
  { id: 'pth-2', code: 'PTH-TEC-01', title: 'Trilha de Especialização Assistencial', targetRole: 'Psicólogo', description: 'Desenvolvimento técnico avançado em psicologia social e gestão de riscos assistenciais.', courseIds: ['crs-1', 'crs-2'], isAdaptive: true, aiRecommendationReason: 'Baseado na matriz de competências da equipe técnica.' }
];

const INITIAL_ENROLLMENTS: Enrollment[] = [
  { id: 'enr-1', courseId: 'crs-1', userId: 'usr-101', userName: 'Ana Silva Santos', userRole: 'Voluntário', enrolledAt: '2025-03-01T10:00:00Z', progressPercent: 100, status: 'completed', grade: 92, completedAt: '2025-03-15T16:00:00Z' },
  { id: 'enr-2', courseId: 'crs-2', userId: 'usr-102', userName: 'Dr. Carlos Mendes', userRole: 'Psicólogo', enrolledAt: '2025-03-10T11:00:00Z', progressPercent: 45, status: 'active' }
];

const INITIAL_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    certificateNumber: 'CERT-2025-99812',
    userId: 'usr-101',
    userName: 'Ana Silva Santos',
    courseTitle: 'Capacitação Obrigatória em LGPD e Privacidade no Atendimento',
    workloadHours: 12,
    issuedAt: '2025-03-15T16:00:00Z',
    expiresAt: '2026-03-15T16:00:00Z',
    qrCodeValidationUrl: 'https://ism.org.br/validar?cert=CERT-2025-99812',
    digitalSignatureHash: 'sig_acu_9b2c83a17e08927163a87123549e0018',
    isValid: true
  }
];

const ACUContext = createContext<ACUContextValue | null>(null);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function ACUProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>(() => loadStorage('acu_courses', INITIAL_COURSES));
  const [competencies, setCompetencies] = useState<Competency[]>(() => loadStorage('acu_competencies', INITIAL_COMPETENCIES));
  const [learningPaths] = useState<LearningPath[]>(INITIAL_PATHS);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => loadStorage('acu_enrollments', INITIAL_ENROLLMENTS));
  const [certificates, setCertificates] = useState<Certificate[]>(() => loadStorage('acu_certificates', INITIAL_CERTIFICATES));
  const [assessments] = useState<Assessment[]>([]);
  const [auditLog, setAuditLog] = useState<ACUAuditEntry[]>(() => loadStorage('acu_audit_log', []));

  useEffect(() => { localStorage.setItem('acu_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('acu_competencies', JSON.stringify(competencies)); }, [competencies]);
  useEffect(() => { localStorage.setItem('acu_enrollments', JSON.stringify(enrollments)); }, [enrollments]);
  useEffect(() => { localStorage.setItem('acu_certificates', JSON.stringify(certificates)); }, [certificates]);
  useEffect(() => { localStorage.setItem('acu_audit_log', JSON.stringify(auditLog)); }, [auditLog]);

  const addAudit = useCallback((action: ACUAuditEntry['action'], description: string, actor: string) => {
    const entry: ACUAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      description,
      hash: Math.random().toString(36).substring(2, 10),
    };
    setAuditLog(prev => [entry, ...prev]);
    window.dispatchEvent(new CustomEvent('acu:event', { detail: entry }));
  }, []);

  const addCourse = useCallback((course: Omit<Course, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => {
    const id = `crs-${Date.now()}`;
    const code = `CRS-${new Date().getFullYear()}-${String(courses.length + 1).padStart(2, '0')}`;
    const newCourse: Course = {
      ...course,
      id,
      code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCourses(prev => [newCourse, ...prev]);
    addAudit('CourseCreated', `Novo curso '${newCourse.title}' cadastrado na Universidade Corporativa`, 'Coordenador Pedagógico');
  }, [courses.length, addAudit]);

  const enrollUser = useCallback((courseId: string, userId: string, userName: string, userRole: string) => {
    const enrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      courseId,
      userId,
      userName,
      userRole,
      enrolledAt: new Date().toISOString(),
      progressPercent: 0,
      status: 'active',
    };
    setEnrollments(prev => [...prev, enrollment]);
    addAudit('EnrollmentCompleted', `Usuário ${userName} matriculado no curso ${courseId}`, userName);
  }, [addAudit]);

  const updateProgress = useCallback((enrollmentId: string, newProgressPercent: number, grade?: number) => {
    setEnrollments(prev => prev.map(enr => {
      if (enr.id !== enrollmentId) return enr;
      const completed = newProgressPercent >= 100;
      const status: Enrollment['status'] = completed ? 'completed' : 'active';
      const updated = {
        ...enr,
        progressPercent: newProgressPercent,
        grade: grade ?? enr.grade,
        status,
        completedAt: completed ? new Date().toISOString() : enr.completedAt,
      };
      if (completed) {
        addAudit('TrainingCompleted', `Capacitação concluída por ${enr.userName}`, enr.userName);
      }
      return updated;
    }));
  }, [addAudit]);

  const issueCertificate = useCallback((enrollmentId: string): Certificate => {
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    const course = courses.find(c => c.id === enrollment?.courseId);

    const certNum = `CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      certificateNumber: certNum,
      userId: enrollment?.userId || 'usr-100',
      userName: enrollment?.userName || 'Aluno Institucional',
      courseTitle: course?.title || 'Curso de Capacitação Institucional',
      workloadHours: course?.workloadHours || 10,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      qrCodeValidationUrl: `https://ism.org.br/validar?cert=${certNum}`,
      digitalSignatureHash: Math.random().toString(36).substring(2, 20),
      isValid: true,
    };

    setCertificates(prev => [newCert, ...prev]);
    addAudit('CertificateIssued', `Certificado ${certNum} emitido com QR Code de verificação para ${newCert.userName}`, 'Sistema ACU');
    return newCert;
  }, [enrollments, courses, addAudit]);

  const addCompetency = useCallback((comp: Omit<Competency, 'id' | 'code'>) => {
    const newComp: Competency = {
      ...comp,
      id: `cmp-${Date.now()}`,
      code: `CMP-${comp.type.substring(0, 3).toUpperCase()}-${String(competencies.length + 1).padStart(2, '0')}`,
    };
    setCompetencies(prev => [...prev, newComp]);
    addAudit('CompetencyUpdated', `Nova competência '${newComp.name}' cadastrada no sistema`, 'RH / CKO');
  }, [competencies.length, addAudit]);

  const value = useMemo<ACUContextValue>(() => ({
    courses,
    competencies,
    learningPaths,
    enrollments,
    certificates,
    assessments,
    auditLog,
    addCourse,
    enrollUser,
    updateProgress,
    issueCertificate,
    addCompetency,
  }), [courses, competencies, learningPaths, enrollments, certificates, assessments, auditLog, addCourse, enrollUser, updateProgress, issueCertificate, addCompetency]);

  return <ACUContext.Provider value={value}>{children}</ACUContext.Provider>;
}

export function useACU() {
  const context = useContext(ACUContext);
  if (!context) throw new Error('useACU must be used within ACUProvider');
  return context;
}
