/**
 * ProfessionalPortal — Módulo 10
 * Portal do Profissional, Central do Voluntário e Workspace Clínico
 * Instituto Ser Melhor — Projeto Aura
 *
 * Workspace Digital completo para profissionais, equipe técnica e voluntários.
 * Controles de sigilo MCSI, copilotagem clínica IA, evolução e assinaturas.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart, Home, Calendar, FileText, MessageCircle, Bell, Settings,
  Clock, Video, MapPin, CheckCircle2, XCircle, RefreshCw, Download,
  Eye, EyeOff, Send, Plus, Search, AlertTriangle, Shield, ShieldCheck,
  User, Users, Star, GraduationCap, Clipboard, BookOpen, Activity,
  Check, X, Lock, Phone, Mail, FileDown, Award, Sparkles, Bot,
  Sun, Moon, Accessibility, LogOut, Target, Flag, Loader2, Play,
  FileBadge, CheckSquare, Square, CheckCircle, HelpCircle, Layers,
  Signature
} from 'lucide-react';
import { cn } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../contexts/SecurityContext';
import {
  ProfessionalPortalProvider,
  useProfessionalPortal,
  type ClinicalAppointment,
  type ClinicalRecord,
  type ProfessionalDocument,
  type SecureMessageThread,
  type VolunteerHoursEntry,
  type LMSCourse,
  type LibraryItem,
  type AdminRequest,
  type CopilotMessage,
  type CareGoal
} from '../contexts/ProfessionalPortalContext';

// ─── Config Maps ─────────────────────────────────────────────────────────────

const APPOINTMENT_STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmado', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  PENDING:   { label: 'Pendente',   color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  COMPLETED: { label: 'Realizado',  color: 'text-slate-650',   bg: 'bg-slate-100 border-slate-200' },
  CANCELLED: { label: 'Cancelado',  color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
};

const DOCUMENT_TYPE_LABELS = {
  RECEITA: 'Receita Médica',
  ATESTADO: 'Atestado Clínico',
  DECLARACAO: 'Declaração',
  ENCAMINHAMENTO: 'Encaminhamento',
  LAUDO: 'Laudo Técnico',
  RELATORIO: 'Relatório',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatShortDate(dt: string): string {
  return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, description, colorClass, bgClass }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', bgClass)}>
        <Icon className={cn('w-6 h-6', colorClass)} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-850 mt-1">{value}</p>
        {description && <p className="text-xs text-slate-500 mt-1 font-medium">{description}</p>}
      </div>
    </div>
  );
}

// ─── Painel Inicial (Cockpit) ─────────────────────────────────────────────────

function CockpitPanel() {
  const { professional, appointments, documents, hoursList } = useProfessionalPortal();
  const pendingDocs = documents.filter((d) => d.status === 'AWAITING_SIGNATURE');
  const todayAppts = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-650 to-emerald-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg border border-teal-800">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none pr-8">
          <Sparkles className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 space-y-4">
          <div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
              {professional.profession}
            </span>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Olá, {professional.name}!</h2>
            <p className="text-teal-100 text-sm mt-1">Bem-vinda ao seu Workspace Clínico e Central de Atendimento.</p>
          </div>
          <div className="flex flex-wrap gap-6 pt-2 text-xs font-medium text-teal-50">
            <div>
              <span className="text-white font-bold text-sm block">{professional.councilCode || '—'}</span>
              Registro Conselhual
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block" />
            <div>
              <span className="text-white font-bold text-sm block">{professional.stats.hoursDonatedTotal}h</span>
              Total de Horas Doadas
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block" />
            <div>
              <span className="text-white font-bold text-sm block">{professional.stats.activeCases}</span>
              Casos sob Coordenação
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Horas Doadas (Mês)" value={`${professional.stats.hoursDonatedMonth}h`} description="+4h doadas esta semana" colorClass="text-teal-650" bgClass="bg-teal-50" />
        <StatCard icon={Users} label="Casos Ativos" value={professional.stats.activeCases} description="Atendimentos clínicos ativos" colorClass="text-blue-650" bgClass="bg-blue-50" />
        <StatCard icon={CheckCircle2} label="Assiduidade" value={`${professional.stats.attendanceRate}%`} description="Taxa de comparecimento geral" colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <StatCard icon={FileBadge} label="Documentos Assinados" value={professional.stats.documentsSigned} description="Prontuários e declarações" colorClass="text-violet-600" bgClass="bg-violet-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximas Consultas */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-850 flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-teal-650" />
            Agenda Clínico-Social de Hoje
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-150">
              {todayAppts.length === 0 ? (
                <div className="p-8 text-center text-slate-450">Nenhuma consulta pendente hoje.</div>
              ) : (
                todayAppts.map((appt) => (
                  <div key={appt.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                        {appt.time}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-850">{appt.patientName}</h4>
                        <span className="text-xs text-slate-400 font-mono">{appt.patientCode}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-3 text-xs">
                      <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded-full font-medium">
                        {appt.type}
                      </span>
                      {appt.sensitivityLevel >= 3 && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Protegido
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {appt.type === 'ONLINE' ? (
                        <button className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm">
                          <Video className="w-3.5 h-3.5" /> Iniciar Teleconsulta
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">Atendimento Presencial</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pendências / Assinaturas */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-850 flex items-center gap-2 text-lg">
            <Signature className="w-5 h-5 text-violet-600" />
            Pendências de Assinatura
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-3">
            {pendingDocs.length === 0 ? (
              <p className="text-sm text-slate-450 text-center py-6">Nenhum documento pendente de assinatura.</p>
            ) : (
              pendingDocs.map((doc) => (
                <div key={doc.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-450 font-bold uppercase">{DOCUMENT_TYPE_LABELS[doc.type]}</p>
                    <p className="text-sm font-semibold text-slate-850 truncate mt-0.5">{doc.patientName}</p>
                  </div>
                  <button className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors">
                    Assinar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Clínico (Prontuários e Evolução) ──────────────────────────────────

function ClinicalWorkspacePanel() {
  const { records, addEvolution, updateCarePlan, issueDocument } = useProfessionalPortal();
  const [selectedPatId, setSelectedPatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClinicalTab, setActiveClinicalTab] = useState<'evolution' | 'pic' | 'documents'>('evolution');

  // Evolution Form
  const [evoContent, setEvoContent] = useState('');
  const [evoCid, setEvoCid] = useState('');
  const [evoSubmitted, setEvoSubmitted] = useState(false);

  // Document Form
  const [docType, setDocType] = useState<'RECEITA' | 'ATESTADO' | 'DECLARACAO' | 'ENCAMINHAMENTO'>('RECEITA');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docSubmitted, setDocSubmitted] = useState(false);

  // Care Plan Form
  const [newObj, setNewObj] = useState('');
  const [newOri, setNewOri] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');

  const selectedRecord = records.find((r) => r.id === selectedPatId);

  const filteredRecords = useMemo(() => {
    return records.filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [records, searchQuery]);

  const handleAddEvolution = () => {
    if (!selectedPatId || !evoContent.trim()) return;
    addEvolution(selectedPatId, evoContent, evoCid || undefined);
    setEvoSubmitted(true);
    setTimeout(() => {
      setEvoContent('');
      setEvoCid('');
      setEvoSubmitted(false);
    }, 1500);
  };

  const handleIssueDocument = () => {
    if (!selectedPatId || !docTitle.trim() || !docContent.trim()) return;
    issueDocument(selectedPatId, docType, docTitle, docContent);
    setDocSubmitted(true);
    setTimeout(() => {
      setDocTitle('');
      setDocContent('');
      setDocSubmitted(false);
    }, 1500);
  };

  const handleAddObjective = () => {
    if (!selectedRecord || !newObj.trim()) return;
    const updated = {
      ...selectedRecord.carePlan,
      objectives: [...selectedRecord.carePlan.objectives, newObj],
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Dra. Elena Silva',
    };
    updateCarePlan(selectedRecord.id, updated);
    setNewObj('');
  };

  const handleAddOrientation = () => {
    if (!selectedRecord || !newOri.trim()) return;
    const updated = {
      ...selectedRecord.carePlan,
      orientations: [...selectedRecord.carePlan.orientations, newOri],
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Dra. Elena Silva',
    };
    updateCarePlan(selectedRecord.id, updated);
    setNewOri('');
  };

  const handleAddGoal = () => {
    if (!selectedRecord || !newGoalDesc.trim()) return;
    const newGoal: CareGoal = {
      id: `goal-${Date.now()}`,
      description: newGoalDesc,
      status: 'PENDING',
      dueDate: newGoalDate || undefined,
    };
    const updated = {
      ...selectedRecord.carePlan,
      goals: [...selectedRecord.carePlan.goals, newGoal],
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Dra. Elena Silva',
    };
    updateCarePlan(selectedRecord.id, updated);
    setNewGoalDesc('');
    setNewGoalDate('');
  };

  const toggleGoalStatus = (goalId: string) => {
    if (!selectedRecord) return;
    const updatedGoals = selectedRecord.carePlan.goals.map((g) =>
      g.id === goalId
        ? {
            ...g,
            status: (g.status === 'PENDING' ? 'IN_PROGRESS' : g.status === 'IN_PROGRESS' ? 'ACHIEVED' : 'PENDING') as any,
          }
        : g
    );
    updateCarePlan(selectedRecord.id, {
      ...selectedRecord.carePlan,
      goals: updatedGoals,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Dra. Elena Silva',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '580px' }}>
      {/* Lista de Prontuários Autorizados */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="font-bold text-slate-850 flex items-center gap-2 text-lg">
          <Lock className="w-5 h-5 text-teal-600" />
          Prontuários Autorizados
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-350 focus:border-teal-400 bg-white"
          />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
          {filteredRecords.length === 0 ? (
            <p className="p-6 text-center text-slate-400 text-sm">Nenhum prontuário encontrado.</p>
          ) : (
            filteredRecords.map((rec) => {
              const active = rec.id === selectedPatId;
              return (
                <button
                  key={rec.id}
                  onClick={() => setSelectedPatId(rec.id)}
                  className={cn(
                    'w-full text-left p-4 transition-colors flex items-center justify-between gap-3',
                    active ? 'bg-teal-50/70 border-r-4 border-teal-650' : 'hover:bg-slate-50'
                  )}
                >
                  <div>
                    <h4 className="font-bold text-slate-850 text-sm">{rec.name}</h4>
                    <p className="text-xs text-slate-450 font-mono mt-0.5">{rec.code}</p>
                  </div>
                  {rec.sensitivityLevel >= 3 && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                      <ShieldCheck className="w-3 h-3" /> Protegido
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Workspace Clínico do Paciente */}
      <div className="lg:col-span-2">
        {selectedRecord ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full overflow-hidden">
            {/* Header com Info do Paciente */}
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">{selectedRecord.name}</h3>
                  <span className="text-xs text-slate-450 font-mono">({selectedRecord.code})</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Nascimento: {formatShortDate(selectedRecord.birthDate)} · CPF: {selectedRecord.cpf} · Gênero: {selectedRecord.gender}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedRecord.activePrograms.map((p) => (
                    <span key={p} className="bg-teal-50 text-teal-700 border border-teal-150 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              {selectedRecord.isProtected && (
                <div className="bg-amber-50 text-amber-700 border border-amber-200 rounded-xl p-3 text-xs shrink-0 flex items-start gap-2 max-w-[240px]">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Acesso sob Medida MCSI</p>
                    <p className="text-[10px] text-amber-600">Categoria: {selectedRecord.specialCategory}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Menu de Sub-abas */}
            <div className="flex border-b border-slate-200 px-6 gap-6">
              {[
                { id: 'evolution', label: 'Evolução Clínica', icon: Activity },
                { id: 'pic', label: 'Plano Individual (PIC)', icon: Heart },
                { id: 'documents', label: 'Emitir Documento', icon: FileText },
              ].map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setActiveClinicalTab(tb.id as any)}
                  className={cn(
                    'py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5',
                    activeClinicalTab === tb.id ? 'border-teal-650 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}
                >
                  <tb.icon className="w-4 h-4" />
                  {tb.label}
                </button>
              ))}
            </div>

            {/* Corpo das abas */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[500px]">
              {activeClinicalTab === 'evolution' && (
                <div className="space-y-6">
                  {/* Formulário de Nova Evolução */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-600 uppercase">Registrar Nova Evolução Clínica</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-3">
                        <textarea
                          placeholder="Digite aqui as anotações detalhadas da sessão clínica..."
                          rows={3}
                          value={evoContent}
                          onChange={(e) => setEvoContent(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-450 block mb-1">Diagnóstico (CID-10)</label>
                        <input
                          type="text"
                          placeholder="F41.1"
                          value={evoCid}
                          onChange={(e) => setEvoCid(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                        Esta evolução será registrada com hash de auditoria imutável pelo MCSI.
                      </p>
                      <button
                        onClick={handleAddEvolution}
                        disabled={!evoContent.trim()}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        {evoSubmitted ? 'Registrado!' : 'Registrar Evolução'}
                      </button>
                    </div>
                  </div>

                  {/* Histórico de Evoluções */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-450 uppercase">Histórico de Sessões</h4>
                    {selectedRecord.evolutions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">Nenhuma evolução anterior.</p>
                    ) : (
                      selectedRecord.evolutions.map((ev) => (
                        <div key={ev.id} className="p-4 border border-slate-150 rounded-xl space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold text-slate-850">{ev.authorName}</p>
                              <p className="text-[10px] text-slate-400">{ev.authorRole} · {formatDate(ev.date)}</p>
                            </div>
                            {ev.diagnosticsCode && (
                              <span className="bg-blue-50 text-blue-700 border border-blue-150 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                CID: {ev.diagnosticsCode}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{ev.content}</p>
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Hash: {ev.auditHash}</span>
                            <span className="text-teal-600 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Assinado
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeClinicalTab === 'pic' && (
                <div className="space-y-6">
                  {/* Objetivos e Orientações */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-450 uppercase">Objetivos Clínicos</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Adicionar novo objetivo..."
                          value={newObj}
                          onChange={(e) => setNewObj(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                        />
                        <button onClick={handleAddObjective} className="p-2 bg-teal-650 hover:bg-teal-700 text-white rounded-xl">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <ul className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {selectedRecord.carePlan.objectives.length === 0 ? (
                          <li className="text-xs text-slate-400 text-center py-2">Nenhum objetivo listado.</li>
                        ) : (
                          selectedRecord.carePlan.objectives.map((obj, i) => (
                            <li key={i} className="text-xs text-slate-750 flex items-start gap-1.5 py-1">
                              <span className="text-teal-500 font-bold shrink-0">{i+1}.</span> {obj}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-450 uppercase">Orientações Terapêuticas</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Adicionar nova orientação..."
                          value={newOri}
                          onChange={(e) => setNewOri(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                        />
                        <button onClick={handleAddOrientation} className="p-2 bg-teal-650 hover:bg-teal-700 text-white rounded-xl">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <ul className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {selectedRecord.carePlan.orientations.length === 0 ? (
                          <li className="text-xs text-slate-400 text-center py-2">Nenhuma orientação listada.</li>
                        ) : (
                          selectedRecord.carePlan.orientations.map((ori, i) => (
                            <li key={i} className="text-xs text-slate-750 flex items-start gap-1.5 py-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {ori}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Acompanhamento de Metas */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-450 uppercase">Metas do Plano de Cuidado</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Nova meta (ex: Reduzir ansiedade social)..."
                        value={newGoalDesc}
                        onChange={(e) => setNewGoalDesc(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                      />
                      <input
                        type="date"
                        value={newGoalDate}
                        onChange={(e) => setNewGoalDate(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                      />
                      <button onClick={handleAddGoal} className="px-3 py-1.5 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Meta
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedRecord.carePlan.goals.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border">Nenhuma meta ativa.</p>
                      ) : (
                        selectedRecord.carePlan.goals.map((g) => (
                          <div key={g.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-3 text-xs">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{g.description}</p>
                              {g.dueDate && <p className="text-[10px] text-slate-400 mt-0.5">Prazo: {formatShortDate(g.dueDate)}</p>}
                            </div>
                            <button
                              onClick={() => toggleGoalStatus(g.id)}
                              className={cn(
                                'px-2.5 py-1 rounded-lg font-bold border transition-colors shrink-0',
                                g.status === 'PENDING' ? 'bg-slate-105 border-slate-200 text-slate-600' :
                                g.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                'bg-emerald-50 border-emerald-200 text-emerald-700'
                              )}
                            >
                              {g.status === 'PENDING' ? 'Pendente' : g.status === 'IN_PROGRESS' ? 'Em Progresso' : 'Concluída'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeClinicalTab === 'documents' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-450 uppercase">Emissão de Documento Clínico-Social</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">Tipo de Documento</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                      >
                        <option value="RECEITA">Receita Médica</option>
                        <option value="ATESTADO">Atestado Clínico</option>
                        <option value="DECLARACAO">Declaração</option>
                        <option value="ENCAMINHAMENTO">Encaminhamento</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">Título do Documento</label>
                      <input
                        type="text"
                        placeholder="Ex: Atestado de Frequência Semanal"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">Conteúdo/Corpo</label>
                    <textarea
                      placeholder="Redija o texto oficial do documento..."
                      rows={5}
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none bg-white font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Documentos clínicos exigem assinatura eletrônica para serem válidos.
                    </p>
                    <button
                      onClick={handleIssueDocument}
                      disabled={!docTitle.trim() || !docContent.trim()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      {docSubmitted ? 'Emitido com Sucesso!' : 'Emitir e Enviar para Assinatura'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full bg-white rounded-2xl border border-slate-200/60 flex items-center justify-center text-slate-450 p-12 text-center shadow-sm">
            <div>
              <Lock className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-650" />
              <h4 className="font-bold text-slate-700">Workspace Clínico</h4>
              <p className="text-sm mt-1 max-w-sm">Selecione um beneficiário autorizado na barra lateral para acessar o histórico, evoluções e PIC.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Central de Assinaturas Eletrônicas ──────────────────────────────────────────

function SignaturePanel() {
  const { documents, signDocument, signBatch } = useProfessionalPortal();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pinCode, setPinCode] = useState('');
  const [signing, setSigning] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  const pending = useMemo(() => documents.filter((d) => d.status === 'AWAITING_SIGNATURE'), [documents]);
  const completed = useMemo(() => documents.filter((d) => d.status === 'SIGNED'), [documents]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    setSelectedIds((prev) => (prev.length === pending.length ? [] : pending.map((d) => d.id)));
  };

  const handleSignBatch = () => {
    if (selectedIds.length === 0 || pinCode !== '1234') return;
    setSigning(true);
    setTimeout(() => {
      signBatch(selectedIds);
      setSelectedIds([]);
      setPinCode('');
      setSigning(false);
      setSignedSuccess(true);
      setTimeout(() => setSignedSuccess(false), 2000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Signature className="w-6 h-6 text-violet-650" />
          Central de Assinatura Eletrônica
        </h2>
        <span className="text-sm text-slate-550 font-medium">
          {pending.length} documentos pendentes · {completed.length} assinados
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Assinatura em Lote */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Assinatura em Lote</h3>
            <p className="text-xs text-slate-500">Selecione os documentos desejados e insira seu PIN de assinatura profissional.</p>
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">Selecionados ({selectedIds.length})</span>
              <div className="bg-slate-50 border rounded-xl p-3 text-xs font-semibold text-slate-650 max-h-28 overflow-y-auto space-y-1">
                {selectedIds.length === 0 ? (
                  <p className="text-slate-400 text-center font-normal">Nenhum documento selecionado.</p>
                ) : (
                  selectedIds.map((id) => (
                    <div key={id} className="truncate">
                      · {documents.find((d) => d.id === id)?.title}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Código PIN (Senha de Assinatura)</label>
              <input
                type="password"
                placeholder="Insira o PIN (padrão: 1234)"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                disabled={selectedIds.length === 0}
                className="w-full px-3 py-2 border border-slate-205 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
              />
            </div>
            <button
              onClick={handleSignBatch}
              disabled={selectedIds.length === 0 || pinCode !== '1234' || signing}
              className="w-full py-2.5 bg-violet-650 hover:bg-violet-750 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {signing ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" /> Assinando...
                </>
              ) : signedSuccess ? (
                <>
                  <CheckCircle2 className="w-4.5 h-4.5" /> Assinado com Sucesso!
                </>
              ) : (
                <>
                  <Signature className="w-4.5 h-4.5" /> Assinar Documentos
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 flex items-start gap-1 font-medium leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
              Esta assinatura simula chaves criptográficas qualificadas (ICP-Brasil) e confere validade legal.
            </p>
          </div>
        </div>

        {/* Lista de Documentos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Lista de Documentos Clínicos</h3>
              {pending.length > 0 && (
                <button onClick={handleToggleAll} className="text-xs text-violet-600 font-semibold hover:underline">
                  {selectedIds.length === pending.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {pending.length === 0 ? (
                <div className="p-8 text-center text-slate-450 text-sm">Nenhum documento pendente de assinatura eletrônica.</div>
              ) : (
                pending.map((doc) => {
                  const selected = selectedIds.includes(doc.id);
                  return (
                    <div key={doc.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                      <button onClick={() => handleToggleSelect(doc.id)} className="text-slate-400 hover:text-slate-600 mt-1 shrink-0">
                        {selected ? <CheckSquare className="w-5 h-5 text-violet-600" /> : <Square className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-850 text-sm truncate">{doc.title}</p>
                          <span className="bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            {DOCUMENT_TYPE_LABELS[doc.type]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Paciente: {doc.patientName}</p>
                        <p className="text-xs text-slate-400 font-mono mt-2 bg-slate-50 p-2.5 rounded-lg border leading-relaxed line-clamp-2">
                          {doc.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Histórico Recente de Assinados */}
          {completed.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Histórico de Assinaturas Realizadas</h4>
              <div className="space-y-2">
                {completed.map((doc) => (
                  <div key={doc.id} className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{doc.title}</p>
                      <p className="text-slate-500 mt-0.5">Paciente: {doc.patientName} · Assinado em: {doc.signedAt ? new Date(doc.signedAt).toLocaleDateString('pt-BR') : ''}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">Assinatura-Hash: {doc.hash}</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-full font-bold shrink-0">
                      Assinado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Central do Voluntário ───────────────────────────────────────────────────────

function VolunteerCentralPanel() {
  const { hoursList, certificates, logHours } = useProfessionalPortal();
  const [logHoursDate, setLogHoursDate] = useState('');
  const [logHoursVal, setLogHoursVal] = useState('');
  const [logHoursDesc, setLogHoursDesc] = useState('');
  const [logHoursSubmitted, setLogHoursSubmitted] = useState(false);

  const totalHoursApproved = useMemo(() =>
    hoursList.filter((h) => h.status === 'APPROVED').reduce((sum, h) => sum + h.hours, 0),
    [hoursList]
  );

  const handleLogHours = () => {
    if (!logHoursDate || !logHoursVal || !logHoursDesc.trim()) return;
    logHours(logHoursDate, Number(logHoursVal), logHoursDesc);
    setLogHoursSubmitted(true);
    setTimeout(() => {
      setLogHoursDate('');
      setLogHoursVal('');
      setLogHoursDesc('');
      setLogHoursSubmitted(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-teal-650" />
          Central do Voluntário Clínico/Social
        </h2>
        <div className="bg-teal-50 text-teal-700 border border-teal-150 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm">
          <span>Horas Aprovadas: <strong>{totalHoursApproved}h</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lançamento de Horas */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Registrar Atividade de Voluntariado</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Data da Atividade</label>
                <input
                  type="date"
                  value={logHoursDate}
                  onChange={(e) => setLogHoursDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Carga Horária (em horas)</label>
                <input
                  type="number"
                  placeholder="Ex: 4"
                  value={logHoursVal}
                  onChange={(e) => setLogHoursVal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Descrição do Trabalho Realizado</label>
                <textarea
                  placeholder="Ex: Atendimento de 4 pacientes em teleconsulta psicológica..."
                  rows={3}
                  value={logHoursDesc}
                  onChange={(e) => setLogHoursDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none bg-white"
                />
              </div>
            </div>
            <button
              onClick={handleLogHours}
              disabled={!logHoursDate || !logHoursVal || !logHoursDesc.trim()}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            >
              {logHoursSubmitted ? 'Lançamento efetuado!' : 'Enviar para Homologação'}
            </button>
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Todos os lançamentos são revisados pela coordenação clínica administrativa do Instituto antes da homologação.
            </p>
          </div>
        </div>

        {/* Histórico e Certificados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Histórico */}
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b">
              <h3 className="font-bold text-slate-800 text-sm">Histórico de Atuação</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {hoursList.map((entry) => (
                <div key={entry.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-850">{entry.activity}</p>
                    <p className="text-xs text-slate-450">{formatShortDate(entry.date)} · Lançamento: {entry.hours} horas</p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-bold px-2.5 py-1 rounded-full border shrink-0',
                      entry.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' :
                      entry.status === 'PENDING' ? 'bg-amber-50 border-amber-250 text-amber-700' :
                      'bg-red-50 border-red-250 text-red-700'
                    )}
                  >
                    {entry.status === 'APPROVED' ? 'Homologado' : entry.status === 'PENDING' ? 'Em análise' : 'Rejeitado'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Certificados */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-850 text-base">Declarações e Certificados de Voluntariado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="p-4 border rounded-xl flex items-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-teal-650" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-800 text-xs truncate">{cert.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Emissão: {formatShortDate(cert.issuedAt)} · {cert.hours} horas</p>
                  </div>
                  <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-450 hover:text-slate-700">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Biblioteca e Capacitação EAD ────────────────────────────────────────────────

function TrainingLibraryPanel() {
  const { courses, library } = useProfessionalPortal();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacitações EAD */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-850 flex items-center gap-2 text-lg">
            <GraduationCap className="w-5 h-5 text-teal-650" />
            Capacitações Clínico-Sociais (EAD)
          </h3>
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {course.category}
                    </span>
                    <h4 className="font-bold text-slate-850 mt-1.5 text-sm">{course.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Duração: {course.durationHours} horas</p>
                  </div>
                  <span className="text-sm font-extrabold text-teal-650">{course.progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-650" style={{ width: `${course.progress}%` }} />
                </div>
                {course.nextLesson && (
                  <div className="flex items-center justify-between gap-3 pt-2 text-xs">
                    <span className="text-slate-500 truncate">Próximo: <strong>{course.nextLesson}</strong></span>
                    <button className="flex items-center gap-1 text-teal-700 font-bold hover:underline">
                      <Play className="w-3 h-3 fill-current" /> Continuar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Biblioteca Técnica */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-850 flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Biblioteca e Documentos de Protocolo
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-3">
            {library.map((item) => (
              <div key={item.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-450 uppercase">{item.category}</span>
                  <h4 className="font-bold text-slate-800 truncate mt-0.5">{item.title}</h4>
                  <p className="text-slate-400 mt-0.5">Autor: {item.author}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold">{item.size}</span>
                  <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Solicitações Administrativas ──────────────────────────────────────────────────

function RequestsPanel() {
  const { requests, submitRequest } = useProfessionalPortal();
  const [showNew, setShowNew] = useState(false);
  const [cat, setCat] = useState<'FERIAS' | 'LICENCA' | 'SUPORTE' | 'CADASTRO' | 'MATERIAIS' | 'SUGESTAO'>('SUPORTE');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNewRequest = () => {
    if (!title.trim() || !desc.trim()) return;
    submitRequest(cat, title, desc);
    setSubmitted(true);
    setTimeout(() => {
      setShowNew(false);
      setSubmitted(false);
      setTitle('');
      setDesc('');
    }, 1500);
  };

  const statusConfig = {
    ABERTO: { label: 'Aberto', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    EM_ANDAMENTO: { label: 'Em Análise', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    CONCLUIDO: { label: 'Concluído', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    RECUSADO: { label: 'Recusado', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clipboard className="w-6 h-6 text-violet-650" />
          Minhas Solicitações Administrativas
        </h2>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold flex items-center gap-1 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Solicitação
        </button>
      </div>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-center py-12 text-slate-400 bg-white rounded-2xl border">Nenhuma solicitação administrativa aberta.</p>
        ) : (
          requests.map((r) => {
            const sc = statusConfig[r.status];
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="bg-slate-100 text-slate-650 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    {r.category}
                  </span>
                  <h4 className="font-bold text-slate-850 mt-1.5 text-sm">{r.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold">Abertura: {formatShortDate(r.createdAt)}</span>
                  <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', sc.bg, sc.color)}>
                    {sc.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nova Solicitação */}
      <AnimatePresence>
        {showNew && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg">Solicitação Enviada</h3>
                  <p className="text-xs text-slate-450 mt-1">Nossa equipe responderá em breve.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-slate-900 text-lg">Abertura de Solicitação Adm</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Categoria</label>
                      <select
                        value={cat}
                        onChange={(e) => setCat(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                      >
                        <option value="SUPORTE">Suporte Técnico TI</option>
                        <option value="FERIAS">Férias / Ausência Programada</option>
                        <option value="LICENCA">Licença Justificada</option>
                        <option value="MATERIAIS">Aquisição de Materiais Clínicos</option>
                        <option value="CADASTRO">Atualização de Cadastro/Dados</option>
                        <option value="SUGESTAO">Sugestões institucionais</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Título Resumido</label>
                      <input
                        type="text"
                        placeholder="Ex: Aquisição de HTP"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Explicação / Detalhes</label>
                      <textarea
                        placeholder="Forneça os detalhes e justificativas para a equipe de gestão..."
                        rows={3}
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowNew(false)} className="flex-1 py-2 rounded-xl border text-slate-650 text-xs font-bold hover:bg-slate-50">
                      Cancelar
                    </button>
                    <button
                      onClick={handleNewRequest}
                      disabled={!title.trim() || !desc.trim()}
                      className="flex-1 py-2 bg-violet-650 hover:bg-violet-755 text-white rounded-xl text-xs font-bold disabled:opacity-40"
                    >
                      Enviar Solicitação
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Copiloto Clínico IA (Copilot) ────────────────────────────────────────────────

function CopilotPanel() {
  const { copilotMessages, askCopilot, isCopilotTyping } = useProfessionalPortal();
  const [inp, setInp] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages, isCopilotTyping]);

  const handleSend = () => {
    const text = inp.trim();
    if (!text || isCopilotTyping) return;
    setInp('');
    askCopilot(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Copiloto Clínico Inteligente</h2>
          <p className="text-sm text-slate-500">Resumos rápidos de prontuários, estruturas de evolução e auxílio documental clínico.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700">
          <p className="font-bold">Aviso de Isenção Clinica</p>
          <p className="mt-0.5 leading-relaxed">
            O Copiloto IA apoia a produtividade na formatação e localização de informações já registradas no prontuário ou em manuais.
            Ele <strong>nunca substitui a avaliação do profissional de saúde, seu julgamento clínico ou a tomada de decisão técnica</strong>.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm flex flex-col" style={{ height: '440px' }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {copilotMessages.map((m) => (
            <div key={m.id} className={cn('flex gap-3', m.sender === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              {m.sender === 'copilot' ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs shrink-0">
                  ES
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed',
                  m.sender === 'copilot' ? 'bg-slate-100 text-slate-800 rounded-tl-sm' : 'bg-teal-650 text-white rounded-tr-sm'
                )}
              >
                <div className="whitespace-pre-line">{m.content}</div>
                <span className="text-[9px] opacity-60 block mt-1 text-right">
                  {new Date(m.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isCopilotTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shrink-0">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-slate-400"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-slate-50 flex gap-2">
          <input
            type="text"
            placeholder="Ex: Resuma o prontuário da Maria Conceição... / Sugira estrutura de evolução..."
            value={inp}
            onChange={(e) => setInp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
          />
          <button
            onClick={handleSend}
            disabled={!inp.trim() || isCopilotTyping}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
          >
            Perguntar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Principal ──────────────────────────────────────────────────────────

type WorkspaceTab = 'cockpit' | 'records' | 'signatures' | 'volunteer' | 'training' | 'requests' | 'copilot';

const WORKSPACE_TABS = [
  { id: 'cockpit',    label: 'Dashboard',   icon: Home },
  { id: 'records',    label: 'Workspace Clínico', icon: Lock },
  { id: 'signatures', label: 'Assinaturas', icon: Signature },
  { id: 'volunteer',  label: 'Central do Voluntário', icon: Award },
  { id: 'training',   label: 'EAD e Biblioteca', icon: GraduationCap },
  { id: 'requests',   label: 'Solicitações Adm', icon: Clipboard },
  { id: 'copilot',    label: 'Copiloto Clínico IA', icon: Bot },
];

function ProfessionalPortalContent() {
  const { professional } = useProfessionalPortal();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('cockpit');

  // Acessibilidade
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);

  const fontSizeClass = fontSize === 'large' ? 'text-[15px]' : fontSize === 'xlarge' ? 'text-[17px]' : 'text-sm';

  const tabComponents = {
    cockpit: <CockpitPanel />,
    records: <ClinicalWorkspacePanel />,
    signatures: <SignaturePanel />,
    volunteer: <VolunteerCentralPanel />,
    training: <TrainingLibraryPanel />,
    requests: <RequestsPanel />,
    copilot: <CopilotPanel />,
  };

  return (
    <div
      className={cn(
        'flex h-screen overflow-hidden transition-all duration-300 font-sans',
        darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900',
        highContrast && 'contrast-150',
        fontSizeClass
      )}
    >
      {/* Sidebar Workspace */}
      <aside className={cn(
        'w-64 flex flex-col shrink-0 border-r transition-colors duration-300',
        darkMode ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-100'
      )}>
        {/* Logo */}
        <div className={cn('h-16 flex items-center px-6 border-b gap-2 shrink-0', darkMode ? 'border-slate-700' : 'border-slate-100')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-600 leading-none">Aura Workspace</p>
            <p className="text-[10px] text-slate-400 font-medium">Instituto Ser Melhor</p>
          </div>
        </div>

        {/* Info do Profissional Logado */}
        <div className={cn('mx-4 mt-4 p-3 rounded-2xl', darkMode ? 'bg-slate-750' : 'bg-slate-50')}>
          <div className="flex items-center gap-3">
            <img src={professional.avatar} alt="Avatar" className="w-9 h-9 rounded-xl shrink-0 border border-slate-200" />
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-extrabold truncate', darkMode ? 'text-white' : 'text-slate-900')}>{professional.name}</p>
              <p className="text-[10px] text-slate-450 font-bold truncate mt-0.5">{professional.profession}</p>
            </div>
          </div>
        </div>

        {/* Menu Principal */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {WORKSPACE_TABS.map((tb) => {
            const active = activeTab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setActiveTab(tb.id as any)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
                  active
                    ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100/50'
                    : darkMode
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <tb.icon className={cn('w-4.5 h-4.5 shrink-0', active ? 'text-teal-650' : 'text-slate-400')} />
                <span className="flex-1 truncate">{tb.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Config / Acessibilidade */}
        <div className={cn('p-3 border-t space-y-1', darkMode ? 'border-slate-700' : 'border-slate-100')}>
          <button
            onClick={() => setShowAccessibility(!showAccessibility)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            <Accessibility className="w-4 h-4 text-slate-400" />
            Acessibilidade
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className={cn(
          'h-16 flex items-center px-8 border-b shrink-0 transition-colors gap-4',
          darkMode ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-100'
        )}>
          <h2 className="font-extrabold text-base flex-1 text-slate-800">
            {WORKSPACE_TABS.find((t) => t.id === activeTab)?.label}
          </h2>

          {/* Controles de Acessibilidade */}
          <AnimatePresence>
            {showAccessibility && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl border',
                  darkMode ? 'bg-slate-800 border-slate-750' : 'bg-slate-50 border-slate-200'
                )}
              >
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  title={darkMode ? 'Modo claro' : 'Modo escuro'}
                  className="p-1 rounded-lg hover:bg-slate-250 transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                </button>
                <div className="w-px h-4 bg-slate-300" />
                <button
                  onClick={() => setFontSize(fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xlarge' : 'normal')}
                  title="Tamanho da fonte"
                  className="p-1 rounded-lg hover:bg-slate-250 text-xs font-extrabold text-slate-500"
                >
                  A{fontSize === 'large' ? '+' : fontSize === 'xlarge' ? '++' : ''}
                </button>
                <div className="w-px h-4 bg-slate-300" />
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  title="Alto contraste"
                  className={cn('p-1 rounded-lg transition-colors', highContrast ? 'bg-slate-900 text-white' : 'hover:bg-slate-250 text-slate-500')}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status do Profissional */}
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ativo Clínica
          </div>
        </header>

        {/* Conteúdo Dinâmico */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {tabComponents[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Export Principal ────────────────────────────────────────────────────────────

export function ProfessionalPortal() {
  return (
    <ProfessionalPortalProvider>
      <ProfessionalPortalContent />
    </ProfessionalPortalProvider>
  );
}
