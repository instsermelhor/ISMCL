import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap, BookOpen, Award, Compass, CheckCircle2,
  Users, Plus, Play, Sparkles, QrCode, FileCheck, Layers,
  Clock, Star, ShieldCheck, Zap
} from 'lucide-react';
import { cn } from '../utils';
import { useACU } from '../contexts/ACUContext';
import type { CourseFormat, CompetencyType } from '../types/acu';

const FORMAT_CONFIG: Record<CourseFormat, { label: string; color: string; bg: string }> = {
  online_ead: { label: 'EAD 100% Online', color: 'text-teal-400', bg: 'bg-teal-900/30' },
  hybrid: { label: 'Híbrido', color: 'text-amber-400', bg: 'bg-amber-900/30' },
  presential: { label: 'Presencial', color: 'text-blue-400', bg: 'bg-blue-900/30' },
};

const COMPETENCY_CONFIG: Record<CompetencyType, { label: string; color: string; bg: string }> = {
  technical: { label: 'Técnica', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  behavioral: { label: 'Comportamental', color: 'text-violet-400', bg: 'bg-violet-900/30' },
  institutional: { label: 'Institucional', color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
  mandatory: { label: 'Obrigatória', color: 'text-red-400', bg: 'bg-red-900/30' },
};

export function ACU() {
  const {
    courses, competencies, learningPaths, enrollments, certificates, auditLog,
    addCourse, enrollUser, updateProgress, issueCertificate, addCompetency
  } = useACU();

  const [activeTab, setActiveTab] = useState<'portal' | 'lms' | 'competencies' | 'paths' | 'certificates' | 'mentoring' | 'audit'>('portal');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddCompModal, setShowAddCompModal] = useState(false);

  // Form curso
  const [courseForm, setCourseForm] = useState({
    title: '', description: '', workloadHours: 10, format: 'online_ead' as CourseFormat,
    isMandatory: false, instructorName: '', passingGradePercent: 75
  });

  // Form competência
  const [compForm, setCompForm] = useState({
    name: '', description: '', type: 'technical' as CompetencyType, level: 3 as 1|2|3|4|5, targetRoles: ''
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    addCourse({
      ...courseForm,
      status: 'published',
      requiredCompetencies: [],
      developedCompetencies: [],
      modules: [
        { id: 'm1', title: 'Módulo 1: Introdução ao Conteúdo', description: 'Visão geral do curso', durationMinutes: 120, contentType: 'video', contentUrl: '/video/intro.mp4' }
      ]
    });
    setShowAddCourseModal(false);
    setCourseForm({ title: '', description: '', workloadHours: 10, format: 'online_ead', isMandatory: false, instructorName: '', passingGradePercent: 75 });
  };

  const handleCreateComp = (e: React.FormEvent) => {
    e.preventDefault();
    addCompetency({
      name: compForm.name,
      description: compForm.description,
      type: compForm.type,
      level: compForm.level,
      targetRoles: compForm.targetRoles.split(',').map(r => r.trim()).filter(Boolean),
    });
    setShowAddCompModal(false);
    setCompForm({ name: '', description: '', type: 'technical', level: 3, targetRoles: '' });
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0b1329] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/10 bg-[#111c38]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">ACU-LMS</h1>
              <span className="px-2 py-0.5 rounded text-xs bg-indigo-900/40 text-indigo-400 border border-indigo-500/30 font-semibold">Prompt 146</span>
            </div>
            <p className="text-xs text-slate-400">Aura Corporate University & Competency Development Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddCompModal(true)} className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors">
            + Competência
          </button>
          <button onClick={() => setShowAddCourseModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-900/20">
            <Plus className="w-4 h-4" /> Novo Curso
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="shrink-0 border-b border-white/10 bg-[#111c38]/60 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {[
            { id: 'portal', label: 'Universidade Corporativa', icon: GraduationCap },
            { id: 'lms', label: 'LMS & Minhas Matrículas', icon: BookOpen },
            { id: 'competencies', label: 'Matriz de Competências', icon: Star },
            { id: 'paths', label: 'Trilhas Inteligentes IA', icon: Compass },
            { id: 'certificates', label: 'Certificações Digitais', icon: Award },
            { id: 'mentoring', label: 'Mentorias & Tutoria IA', icon: Sparkles },
            { id: 'audit', label: 'Auditoria Acadêmica', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all shrink-0',
                  isActive ? 'border-indigo-500 text-indigo-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: UNIVERSIDADE CORPORATIVA */}
        {activeTab === 'portal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-indigo-400">{courses.length}</div>
                <div className="text-xs text-slate-400 mt-1">Cursos Disponíveis</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-teal-400">{enrollments.length}</div>
                <div className="text-xs text-slate-400 mt-1">Matrículas Ativas</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">{certificates.length}</div>
                <div className="text-xs text-slate-400 mt-1">Certificados Emitidos</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-amber-400">{competencies.length}</div>
                <div className="text-xs text-slate-400 mt-1">Competências Mapeadas</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map(course => {
                const fmt = FORMAT_CONFIG[course.format];
                return (
                  <div key={course.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">{course.code}</span>
                        <div className="flex gap-2">
                          {course.isMandatory && <span className="px-2 py-0.5 rounded text-xs bg-red-900/30 text-red-400 border border-red-500/30">Obrigatório</span>}
                          <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', fmt.bg, fmt.color)}>{fmt.label}</span>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-white">{course.title}</h3>
                      <p className="text-xs text-slate-300 line-clamp-2">{course.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                        <span>Carga Horária: {course.workloadHours}h</span>
                        <span>Instrutor: {course.instructorName}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => enrollUser(course.id, 'usr-curr', 'Usuário Atual', 'Colaborador')}
                      className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5" /> Matricular-se Agora
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: LMS & MATRÍCULAS */}
        {activeTab === 'lms' && (
          <div className="space-y-4">
            {enrollments.map(enr => {
              const course = courses.find(c => c.id === enr.courseId);
              return (
                <div key={enr.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{course?.title || enr.courseId}</div>
                      <div className="text-xs text-slate-400">Aluno: {enr.userName} ({enr.userRole})</div>
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', enr.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400')}>
                      {enr.status === 'completed' ? 'Concluído' : 'Em Andamento'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Progresso</span>
                      <span>{enr.progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${enr.progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    {enr.progressPercent < 100 && (
                      <button onClick={() => updateProgress(enr.id, Math.min(100, enr.progressPercent + 25), 90)} className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-white hover:bg-white/20">
                        + Avançar Módulo
                      </button>
                    )}
                    {enr.status === 'completed' && (
                      <button onClick={() => issueCertificate(enr.id)} className="px-3 py-1.5 rounded-xl bg-emerald-600/30 border border-emerald-500/30 text-xs text-emerald-300 hover:bg-emerald-600/40 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" /> Emitir Certificado Digital
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: MATRIZ DE COMPETÊNCIAS */}
        {activeTab === 'competencies' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competencies.map(comp => {
                const cfg = COMPETENCY_CONFIG[comp.type];
                return (
                  <div key={comp.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">{comp.code}</span>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', cfg.bg, cfg.color)}>{cfg.label}</span>
                    </div>
                    <div className="text-sm font-semibold text-white">{comp.name}</div>
                    <p className="text-xs text-slate-300">{comp.description}</p>
                    <div className="text-xs text-slate-400 pt-1">
                      Cargos Alvo: {comp.targetRoles.join(', ')} | Proficiência Nível {comp.level}/5
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: TRILHAS INTELIGENTES IA */}
        {activeTab === 'paths' && (
          <div className="space-y-4">
            {learningPaths.map(path => (
              <div key={path.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400">{path.code}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-violet-900/30 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Trilha Adaptativa IA
                  </span>
                </div>
                <div className="text-base font-bold text-white">{path.title}</div>
                <p className="text-xs text-slate-300">{path.description}</p>
                {path.aiRecommendationReason && (
                  <div className="p-3 rounded-xl bg-indigo-900/20 border border-indigo-500/30 text-xs text-indigo-300 font-medium">
                    🤖 Motivo da Recomendação IA: {path.aiRecommendationReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: CERTIFICAÇÕES DIGITAIS */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            {certificates.map(cert => (
              <div key={cert.id} className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-300">{cert.certificateNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Assinado & Válido
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{cert.userName}</div>
                  <div className="text-xs text-slate-300 mt-0.5">{cert.courseTitle} ({cert.workloadHours} horas)</div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
                  <span>Emitido em: {new Date(cert.issuedAt).toLocaleDateString('pt-BR')}</span>
                  <span className="font-mono text-slate-500 truncate max-w-[200px]">Hash: {cert.digitalSignatureHash}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: MENTORIAS & TUTORIA IA */}
        {activeTab === 'mentoring' && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 text-center">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Assistente de Aprendizagem com Inteligência Artificial</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Tutor virtual integrado para tira-dúvidas de conteúdos institucionais, simulação de estudos de caso e recomendação contínua de treinamentos.
            </p>
          </div>
        )}

        {/* TAB 7: AUDITORIA ACADÊMICA */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            {auditLog.length === 0 ? (
              <div className="text-center text-slate-500 py-12 text-sm">Nenhum evento registrado ainda.</div>
            ) : (
              auditLog.map(log => (
                <div key={log.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-indigo-400 mr-2">[{log.action}]</span>
                    <span className="text-slate-300">{log.description}</span>
                  </div>
                  <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Novo Curso */}
      <AnimatePresence>
        {showAddCourseModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#111c38] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-base font-bold text-white">Criar Novo Curso na Universidade</h3>
              <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Título do Curso</label>
                  <input type="text" required value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Descrição</label>
                  <textarea value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Carga Horária (h)</label>
                    <input type="number" value={courseForm.workloadHours} onChange={e => setCourseForm(p => ({ ...p, workloadHours: Number(e.target.value) }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Formato</label>
                    <select value={courseForm.format} onChange={e => setCourseForm(p => ({ ...p, format: e.target.value as CourseFormat }))} className="w-full bg-[#111c38] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500">
                      {Object.entries(FORMAT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Instrutor Responsável</label>
                  <input type="text" value={courseForm.instructorName} onChange={e => setCourseForm(p => ({ ...p, instructorName: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddCourseModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">Publicar Curso</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Nova Competência */}
        {showAddCompModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#111c38] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-base font-bold text-white">Mapear Nova Competência</h3>
              <form onSubmit={handleCreateComp} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nome da Competência</label>
                  <input type="text" required value={compForm.name} onChange={e => setCompForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Descrição</label>
                  <textarea value={compForm.description} onChange={e => setCompForm(p => ({ ...p, description: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Tipo de Competência</label>
                    <select value={compForm.type} onChange={e => setCompForm(p => ({ ...p, type: e.target.value as CompetencyType }))} className="w-full bg-[#111c38] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500">
                      {Object.entries(COMPETENCY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Nível Esperado (1 a 5)</label>
                    <input type="number" min={1} max={5} value={compForm.level} onChange={e => setCompForm(p => ({ ...p, level: Number(e.target.value) as 1|2|3|4|5 }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cargos Alvo (separados por vírgula)</label>
                  <input type="text" value={compForm.targetRoles} onChange={e => setCompForm(p => ({ ...p, targetRoles: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500" placeholder="Psicólogo, Voluntário, Gestor" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddCompModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">Mapear Competência</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
