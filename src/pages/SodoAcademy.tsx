// ============================================================
// SODO — ACADEMIA CORPORATIVA DIGITAL
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import React, { useState } from 'react';
import { useSodo } from '../contexts/SodoContext';
import type { Course, LearningTrail, UserCertificate } from '../types/sodo';

const PROFILE_LABELS: Record<string, string> = {
  super_admin: 'Super Administrador', admin: 'Administrador', diretor: 'Diretor',
  coordenador: 'Coordenador', psicologo: 'Psicólogo', psiquiatra: 'Psiquiatra',
  assistente_social: 'Assistente Social', advogado: 'Advogado', pedagogo: 'Pedagogo',
  voluntario: 'Voluntário', administrativo: 'Administrativo', financeiro: 'Financeiro',
  tecnologia: 'TI', beneficiario: 'Beneficiário', responsavel_legal: 'Resp. Legal',
  auditor: 'Auditor', consultor: 'Consultor', parceiro: 'Parceiro',
};

export default function SodoAcademy() {
  const { trails, courses, certificates, biMetrics, enrollCourse, completeCourse, selectCourse, selectedCourse } = useSodo();
  const [activeTab, setActiveTab] = useState<'trilhas' | 'cursos' | 'certificados' | 'bi'>('trilhas');
  const [selectedTrail, setSelectedTrail] = useState<LearningTrail | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [simulatingExam, setSimulatingExam] = useState(false);
  const [examScore, setExamScore] = useState<number | null>(null);

  function handleStartCourse(course: Course) {
    enrollCourse(course.id);
    setViewingCourse({ ...course, status: 'em_andamento' });
  }

  function handleFinishExam(courseId: string) {
    const score = Math.round(68 + Math.random() * 30);
    setExamScore(score);
    completeCourse(courseId, score);
    setTimeout(() => { setSimulatingExam(false); setViewingCourse(null); setExamScore(null); }, 4000);
  }

  // ─── Course Viewer ────────────────────────────────────────
  if (viewingCourse) {
    const allLessons = viewingCourse.modules.flatMap(m => m.lessons);
    const completedLessons = allLessons.filter(l => l.completed).length;
    const progress = Math.round((completedLessons / allLessons.length) * 100);
    return (
      <div>
        <button onClick={() => { setViewingCourse(null); setSimulatingExam(false); setExamScore(null); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, marginBottom: 20, fontSize: 14 }}>← Voltar à Academia</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #0f172a)', borderRadius: 16, padding: '28px 32px', marginBottom: 20, border: '1px solid rgba(99,102,241,0.2)' }}>
              {viewingCourse.isMandatory && <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginBottom: 8, background: 'rgba(245,158,11,0.1)', display: 'inline-block', padding: '3px 10px', borderRadius: 20 }}>OBRIGATÓRIO</div>}
              <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 8px' }}>{viewingCourse.title}</h1>
              <p style={{ color: '#94a3b8', margin: '0 0 16px', fontSize: 14 }}>{viewingCourse.description}</p>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#64748b' }}>
                <span>⏱ {viewingCourse.workloadHours}h</span>
                <span>🎯 Aprovação: {viewingCourse.passingScore}%</span>
                <span>📜 Validade: {viewingCourse.certificateValidityMonths} meses</span>
                <span>👤 {viewingCourse.instructor}</span>
              </div>
              {/* Progress */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                  <span>Progresso</span><span>{progress}%</span>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 6, height: 8 }}>
                  <div style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 6, height: '100%', width: `${progress}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>

            {!simulatingExam ? (
              viewingCourse.modules.map((mod, mi) => (
                <div key={mod.id} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '1px solid rgba(99,102,241,0.1)' }}>
                  <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Módulo {mod.order}</div>
                  <h3 style={{ color: '#e2e8f0', margin: '0 0 14px', fontSize: 16 }}>{mod.title}</h3>
                  {mod.lessons.map((lesson, li) => (
                    <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: li < mod.lessons.length - 1 ? '1px solid rgba(99,102,241,0.08)' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: lesson.completed ? '#22c55e22' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: `1px solid ${lesson.completed ? '#22c55e44' : 'rgba(99,102,241,0.2)'}` }}>
                        {lesson.completed ? '✓' : lesson.contentType === 'video' ? '▶' : lesson.contentType === 'avaliacao' ? '📝' : lesson.contentType === 'exercicio' ? '💡' : lesson.contentType === 'estudo_caso' ? '📂' : '📄'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: lesson.completed ? '#94a3b8' : '#e2e8f0', fontSize: 14 }}>{lesson.title}</div>
                        <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>{lesson.durationMinutes} min · {lesson.contentType}</div>
                      </div>
                      {lesson.contentType === 'avaliacao' && !lesson.completed && (
                        <button onClick={() => setSimulatingExam(true)} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Iniciar Prova</button>
                      )}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div style={{ background: 'rgba(15,23,42,0.8)', borderRadius: 16, padding: '40px', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
                {examScore === null ? (
                  <>
                    <div style={{ fontSize: 36, marginBottom: 16 }}>📝</div>
                    <h2 style={{ color: '#e2e8f0', marginBottom: 8 }}>Simulação de Avaliação</h2>
                    <p style={{ color: '#64748b', marginBottom: 24 }}>Esta é uma simulação da prova final do curso. Na versão completa, serão exibidas questões de múltipla escolha, estudos de caso e situações práticas.</p>
                    <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 13 }}>Nota mínima para aprovação: <b style={{ color: '#f59e0b' }}>{viewingCourse.passingScore}%</b></p>
                    <button onClick={() => handleFinishExam(viewingCourse.id)} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 12, padding: '14px 32px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Iniciar Avaliação</button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>{examScore >= viewingCourse.passingScore ? '🎉' : '😔'}</div>
                    <h2 style={{ color: examScore >= viewingCourse.passingScore ? '#22c55e' : '#ef4444', marginBottom: 8 }}>
                      {examScore >= viewingCourse.passingScore ? 'Aprovado!' : 'Não Aprovado'}
                    </h2>
                    <p style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', margin: '0 0 8px' }}>{examScore}%</p>
                    <p style={{ color: '#64748b' }}>{examScore >= viewingCourse.passingScore ? '🏆 Seu certificado foi emitido automaticamente!' : `Nota mínima: ${viewingCourse.passingScore}%. Revise o conteúdo e tente novamente.`}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: 18, border: '1px solid rgba(99,102,241,0.1)' }}>
              <h3 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, marginTop: 0 }}>Público-alvo</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {viewingCourse.targetProfiles.map(p => (
                  <span key={p} style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>{PROFILE_LABELS[p] || p}</span>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: 18, border: '1px solid rgba(99,102,241,0.1)' }}>
              <h3 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, marginTop: 0 }}>Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {viewingCourse.tags.map(t => <span key={t} style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>{t}</span>)}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: 18, border: '1px solid rgba(34,197,94,0.15)' }}>
              <h3 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 0 }}>Engajamento</h3>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 18 }}>{viewingCourse.completionRate}%</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>Taxa de conclusão</div>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, marginTop: 10 }}>{viewingCourse.enrolledCount}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>Matrículas realizadas</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #0f172a 100%)', borderRadius: 20, padding: '32px 40px', marginBottom: 28, border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>SODO · Academia Corporativa</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>🎓 Academia Corporativa Digital</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Trilhas de aprendizagem personalizadas, cursos certificados e simulações práticas para todos os perfis institucionais.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {[{ id: 'trilhas', label: '🗺️ Trilhas' }, { id: 'cursos', label: '📚 Catálogo' }, { id: 'certificados', label: '🏆 Certificados' }, { id: 'bi', label: '📊 BI' }].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id as typeof activeTab); setSelectedTrail(null); }}
            style={{ background: activeTab === t.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent', border: 'none', borderRadius: 10, padding: '8px 18px', color: activeTab === t.id ? '#fff' : '#94a3b8', fontWeight: activeTab === t.id ? 700 : 500, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Trilhas */}
      {activeTab === 'trilhas' && !selectedTrail && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {trails.map(t => {
            const trailCourses = courses.filter(c => t.courseIds.includes(c.id));
            return (
              <div key={t.id} onClick={() => setSelectedTrail(t)} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '22px 24px', border: '1px solid rgba(99,102,241,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${t.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: `1px solid ${t.color}44` }}>{t.icon}</div>
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{t.title}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{t.totalWorkloadHours}h · {t.courseIds.length} cursos</div>
                  </div>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>{t.description}</p>
                <div style={{ background: `${t.color}15`, borderRadius: 8, height: 6, marginBottom: 8 }}>
                  <div style={{ background: t.color, borderRadius: 8, height: '100%', width: `${t.progressPercent || 0}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                  <span>{t.progressPercent || 0}% concluído</span>
                  <span>{t.mandatoryCourseIds.length} cursos obrigatórios</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'trilhas' && selectedTrail && (
        <div>
          <button onClick={() => setSelectedTrail(null)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, marginBottom: 20, fontSize: 14 }}>← Trilhas</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${selectedTrail.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: `1px solid ${selectedTrail.color}44` }}>{selectedTrail.icon}</div>
            <div>
              <h2 style={{ color: '#e2e8f0', margin: '0 0 4px', fontSize: 22 }}>{selectedTrail.title}</h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>{selectedTrail.objective}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {courses.filter(c => selectedTrail.courseIds.includes(c.id)).map((c, i) => (
              <CourseRow key={c.id} course={c} index={i} isMandatory={selectedTrail.mandatoryCourseIds.includes(c.id)} onStart={() => handleStartCourse(c)} />
            ))}
          </div>
        </div>
      )}

      {/* Catálogo */}
      {activeTab === 'cursos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {courses.map((c, i) => <CourseRow key={c.id} course={c} index={i} isMandatory={c.isMandatory} onStart={() => handleStartCourse(c)} />)}
        </div>
      )}

      {/* Certificados */}
      {activeTab === 'certificados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {certificates.map(cert => <CertificateCard key={cert.id} cert={cert} />)}
          {certificates.length === 0 && <div style={{ textAlign: 'center', color: '#64748b', padding: 60 }}>Nenhum certificado emitido ainda. Complete um curso para obter o seu!</div>}
        </div>
      )}

      {/* BI */}
      {activeTab === 'bi' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Certificados Emitidos', val: biMetrics.totalCertificatesIssued, icon: '🏆', color: '#f59e0b' },
              { label: 'Cursos Concluídos', val: biMetrics.totalCoursesCompleted, icon: '✅', color: '#22c55e' },
              { label: 'Taxa de Aprovação', val: `${biMetrics.averagePassRate}%`, icon: '🎯', color: '#6366f1' },
              { label: 'Cert. este mês', val: biMetrics.certificatesThisMonth, icon: '📜', color: '#0ea5e9' },
              { label: 'Alunos Ativos', val: biMetrics.activeLearnersThisMonth, icon: '👥', color: '#ec4899' },
              { label: 'Dias Médios p/ Conclusão', val: biMetrics.averageCompletionDays, icon: '⏱', color: '#8b5cf6' },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '22px', border: `1px solid ${m.color}22` }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ color: m.color, fontWeight: 800, fontSize: 26 }}>{m.val}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: 20, border: '1px solid rgba(99,102,241,0.1)' }}>
              <h3 style={{ color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 0, marginBottom: 16 }}>📰 Documentos Mais Acessados</h3>
              {biMetrics.mostAccessedArticles.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 2 ? '1px solid rgba(99,102,241,0.08)' : 'none' }}>
                  <div style={{ color: '#e2e8f0', fontSize: 13 }}>#{i + 1} {a.title.substring(0, 35)}...</div>
                  <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 13 }}>{a.viewCount}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: 20, border: '1px solid rgba(99,102,241,0.1)' }}>
              <h3 style={{ color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 0, marginBottom: 16 }}>🎓 Cursos Mais Procurados</h3>
              {biMetrics.mostEnrolledCourses.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 2 ? '1px solid rgba(99,102,241,0.08)' : 'none' }}>
                  <div style={{ color: '#e2e8f0', fontSize: 13 }}>#{i + 1} {c.title.substring(0, 30)}...</div>
                  <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 13 }}>{c.enrolledCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseRow({ course: c, index, isMandatory, onStart }: { course: Course; index: number; isMandatory: boolean; onStart: () => void }) {
  const statusColors: Record<string, string> = { nao_iniciado: '#64748b', em_andamento: '#f59e0b', concluido: '#22c55e' };
  const statusLabels: Record<string, string> = { nao_iniciado: 'Não Iniciado', em_andamento: 'Em Andamento', concluido: 'Concluído' };
  return (
    <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '18px 22px', border: '1px solid rgba(99,102,241,0.1)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{index + 1}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          {isMandatory && <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>OBRIGATÓRIO</span>}
          <span style={{ background: `${statusColors[c.status]}22`, color: statusColors[c.status], padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{statusLabels[c.status]}</span>
        </div>
        <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 4, fontSize: 15 }}>{c.title}</div>
        <div style={{ color: '#64748b', fontSize: 13, marginBottom: 10, lineHeight: 1.4 }}>{c.description.substring(0, 100)}...</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#475569' }}>
          <span>⏱ {c.workloadHours}h</span>
          <span>🎯 {c.passingScore}%</span>
          <span>👥 {c.enrolledCount} matrículas</span>
          <span>✅ {c.completionRate}% concluído</span>
        </div>
      </div>
      <button onClick={onStart} style={{ background: c.status === 'concluido' ? 'rgba(34,197,94,0.1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: c.status === 'concluido' ? '1px solid rgba(34,197,94,0.3)' : 'none', borderRadius: 10, padding: '8px 16px', color: c.status === 'concluido' ? '#22c55e' : '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {c.status === 'concluido' ? '✓ Concluído' : c.status === 'em_andamento' ? 'Continuar' : 'Iniciar'}
      </button>
    </div>
  );
}

function CertificateCard({ cert }: { cert: UserCertificate }) {
  const isExpired = cert.status === 'expirado' || new Date(cert.validUntil) < new Date();
  return (
    <div style={{ background: isExpired ? 'rgba(239,68,68,0.05)' : 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '20px 24px', border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ fontSize: 32 }}>{isExpired ? '⚠️' : '🏆'}</div>
        <div>
          <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{cert.courseTitle}</div>
          <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>👤 {cert.userName} · Nota: <b style={{ color: cert.score >= 80 ? '#22c55e' : '#f59e0b' }}>{cert.score}%</b></div>
          <div style={{ color: '#475569', fontSize: 11 }}>Emitido: {new Date(cert.issuedAt).toLocaleDateString('pt-BR')} · Válido até: {new Date(cert.validUntil).toLocaleDateString('pt-BR')}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: '#6366f1', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{cert.certificateCode}</div>
        <span style={{ background: isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: isExpired ? '#ef4444' : '#22c55e', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
          {isExpired ? 'Expirado' : 'Válido'}
        </span>
      </div>
    </div>
  );
}
