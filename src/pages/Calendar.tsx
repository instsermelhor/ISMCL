import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Video, MapPin, Plus, Filter, Users, Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../contexts/SecurityContext';

// =========================================================================
// MÓDULO 03: AGENDA INTELIGENTE E CENTRAL DE AGENDAMENTOS
// =========================================================================



const MOCK_WAITLIST = [
  { id: 1, name: 'Beatriz Almeida', specialty: 'Psicologia', score: 98, waitTime: '15 dias', urgency: 'URGENT' },
  { id: 2, name: 'João Ferreira', specialty: 'Serviço Social', score: 85, waitTime: '5 dias', urgency: 'HIGH' },
  { id: 3, name: 'Lúcia Mendes', specialty: 'Psiquiatria', score: 70, waitTime: '20 dias', urgency: 'NORMAL' },
];

export function Calendar() {
  const { user } = useAuth();
  const { logAction } = useSecurity();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('minha-agenda');
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // --- CONTROLE DE AGENDAMENTOS INTEGRADOS ---
  const [appointments, setAppointments] = useState<any[]>(() => {
    const saved = localStorage.getItem('appointments_list');
    if (saved) return JSON.parse(saved);

    const initial = [
      { id: '1', time: '09:00', date: '2026-06-28', patientId: '1', patientName: 'Ana Silva Santos', professionalId: '1', professionalName: 'Dra. Elena Silva', type: 'online', duration: '50 min', status: 'completed' },
      { id: '2', time: '10:00', date: '2026-06-28', patientId: '2', patientName: 'Marcos Santos Oliveira', professionalId: '1', professionalName: 'Dra. Elena Silva', type: 'presencial', duration: '50 min', status: 'completed', room: 'Consultório 1' },
      { id: '3', time: '14:00', date: '2026-06-28', patientId: '3', patientName: 'Júlia Costa', professionalId: '1', professionalName: 'Dra. Elena Silva', type: 'online', duration: '50 min', status: 'upcoming' },
    ];
    localStorage.setItem('appointments_list', JSON.stringify(initial));
    return initial;
  });

  // Lista de beneficiários e profissionais para o formulário
  const [patients] = useState<any[]>(() => {
    const saved = localStorage.getItem('patients_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [professionals] = useState<any[]>(() => {
    const saved = localStorage.getItem('professionals_list');
    return saved ? JSON.parse(saved) : [];
  });

  // Formulário de Novo Agendamento
  const [formPatientId, setFormPatientId] = useState('');
  const [formProfId, setFormProfId] = useState('');
  const [formTime, setFormTime] = useState('11:00');
  const [formType, setFormType] = useState<'online' | 'presencial'>('online');
  const [formDate, setFormDate] = useState('2026-06-28');

  const currentDate = '2026-06-28';
  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:30', '16:30'];

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId || !formProfId) {
      alert('Por favor, selecione o beneficiário e o profissional.');
      return;
    }

    const patientObj = patients.find((p: any) => String(p.id) === String(formPatientId));
    const profObj = professionals.find((p: any) => String(p.id) === String(formProfId));

    const newAppt = {
      id: String(Date.now()),
      time: formTime,
      date: formDate,
      patientId: formPatientId,
      patientName: patientObj ? patientObj.name : 'Beneficiário',
      professionalId: formProfId,
      professionalName: profObj ? profObj.name : 'Profissional',
      type: formType,
      duration: '50 min',
      status: 'upcoming',
      room: formType === 'presencial' ? 'Consultório 1' : undefined
    };

    const updated = [...appointments, newAppt];
    setAppointments(updated);
    localStorage.setItem('appointments_list', JSON.stringify(updated));

    // Log de Auditoria MCSI
    logAction({
      userId: user?.email ?? 'sistema',
      userName: user?.name ?? 'Coordenador',
      action: 'EDIT',
      targetCode: `APPT-${newAppt.id}`,
      description: `[Agenda] Criou novo agendamento para beneficiário: ${newAppt.patientName} com ${newAppt.professionalName}`,
      ipAddress: '—',
      device: navigator.userAgent.slice(0, 80),
    });

    setIsCreateModalOpen(false);
    alert('Consulta agendada com sucesso!');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agenda Inteligente</h1>
            <p className="text-sm text-slate-500 mt-1">Coordenação da Operação Diária e Escalonamento.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('minha-agenda')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'minha-agenda' ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Clock className="w-4 h-4" />
            Minha Agenda
          </button>
          <button
            onClick={() => setActiveTab('institucional')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'institucional' ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            Agenda Institucional
          </button>
          <button
            onClick={() => setActiveTab('waitlist')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'waitlist' ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Users className="w-4 h-4" />
            Fila de Espera
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          
          {activeTab === 'minha-agenda' && (
            <motion.div key="minha-agenda" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-slate-900">Hoje</h2>
                  <p className="text-sm text-slate-500">28 de Junho, 2026</p>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {timeSlots.map((slotTime) => {
                    const slot = appointments.find((a: any) => a.time === slotTime && a.date === currentDate);
                    return (
                      <div key={slotTime} className="flex items-stretch hover:bg-slate-50/50 transition-colors group">
                        <div className="w-24 shrink-0 py-4 px-6 flex items-center justify-center border-r border-slate-100">
                          <span className="text-sm font-medium text-slate-500">{slotTime}</span>
                        </div>
                        
                        <div className="flex-1 p-4">
                          {!slot ? (
                            <div className="h-full flex items-center">
                              <button 
                                onClick={() => {
                                  setFormTime(slotTime);
                                  setIsCreateModalOpen(true);
                                }}
                                className="text-sm font-medium text-slate-400 group-hover:text-teal-600 transition-colors flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Horário Disponível
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-100 rounded-xl p-4 shadow-sm gap-4">
                              <div className="flex items-center gap-4">
                                <div className={cn("w-2 h-10 rounded-full", slot.status === 'completed' ? 'bg-slate-300' : 'bg-teal-500')} />
                                <div>
                                  <h4 className={cn("text-base font-semibold", slot.status === 'completed' ? 'text-slate-450 line-through' : 'text-slate-900')}>
                                    {slot.patientName}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      {slot.type === 'online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                                      <span className="capitalize">{slot.type}</span>
                                    </span>
                                    <span>•</span>
                                    <span>{slot.professionalName}</span>
                                    {slot.room && (
                                      <>
                                        <span>•</span>
                                        <span>{slot.room}</span>
                                      </>
                                    )}
                                    <span>•</span>
                                    <span>{slot.duration}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {slot.status === 'upcoming' && (
                                <button
                                  onClick={() => {
                                    if (slot.type === 'online') {
                                      logAction({
                                        userId: user?.email ?? 'sistema',
                                        userName: user?.name ?? 'Profissional',
                                        action: 'VIEW',
                                        targetCode: `TELE-${slot.id}`,
                                        description: `[Teleconsulta] Profissional acessou sala virtual para beneficiário: ${slot.patientName}`,
                                        ipAddress: '—',
                                        device: navigator.userAgent.slice(0, 80),
                                      });
                                      navigate(`/telehealth/${slot.id}`);
                                    } else {
                                      alert(`Consulta presencial confirmada no ${slot.room || 'consultório'}. Dirija-se ao local.`);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-500 transition-colors w-full sm:w-auto text-center shadow-sm"
                                >
                                  {slot.type === 'online' ? (
                                    <><Video className="w-3.5 h-3.5" /> Entrar na Sala</>
                                  ) : (
                                    <><MapPin className="w-3.5 h-3.5" /> Ver Local</>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'institucional' && (
            <motion.div key="institucional" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium text-slate-900">Visão Institucional</h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                Visão Master do calendário estilo FullCalendar será renderizada aqui, mostrando todos os profissionais e salas.
              </p>
            </motion.div>
          )}

          {activeTab === 'waitlist' && (
            <motion.div key="waitlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-400" /> AI Scheduler Assistant
                  </h3>
                  <p className="text-slate-300 mt-2 max-w-lg text-sm leading-relaxed">
                    A Inteligência Artificial identificou <strong className="text-white">3 vagas ociosas</strong> para esta semana geradas por cancelamentos. Deseja realizar o escalonamento automático da fila de espera?
                  </p>
                </div>
                <button 
                  onClick={() => setAiModalOpen(true)}
                  className="relative z-10 whitespace-nowrap px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-medium rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Realizar Match
                </button>
                <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900">Fila Priorizada</h3>
                  <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 border border-slate-200 rounded-md">Total: {MOCK_WAITLIST.length} aguardando</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {MOCK_WAITLIST.map((item) => (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                          item.urgency === 'URGENT' ? "bg-red-100 text-red-700" :
                          item.urgency === 'HIGH' ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        )}>
                          {item.score}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-base">{item.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            <span>{item.specialty}</span>
                            <span>•</span>
                            <span>Aguardando há {item.waitTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         {item.urgency === 'URGENT' && (
                           <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-full">
                             Urgência Máxima
                           </span>
                         )}
                         <button className="px-4 py-2 border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 rounded-xl transition-colors">
                           Alocar Manualmente
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
          
        </AnimatePresence>

      </div>

      {/* AI Match Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" /> AI Scheduler Matches
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Otimização da fila de espera baseada em IA para preencher horários livres de cancelamentos.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-teal-50/50 border border-teal-100/50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Beatriz Almeida</div>
                  <div className="text-xs text-teal-700">Psicologia • Sugerido: Hoje, 11:00 (Vago)</div>
                </div>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-md">Score 98</span>
              </div>
              <div className="p-3 bg-teal-50/50 border border-teal-100/50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">João Ferreira</div>
                  <div className="text-xs text-teal-700">Serviço Social • Sugerido: Hoje, 13:00 (Vago)</div>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">Score 85</span>
              </div>
              <div className="p-3 bg-teal-50/50 border border-teal-100/50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Lúcia Mendes</div>
                  <div className="text-xs text-teal-700">Psiquiatria • Sugerido: Hoje, 16:30 (Vago)</div>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">Score 70</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setAiModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={() => {
                  const matchAppts = [
                    { id: 'match-1', time: '11:00', date: '2026-06-28', patientId: 'match-p1', patientName: 'Beatriz Almeida', professionalId: '1', professionalName: 'Dra. Elena Silva', type: 'online', duration: '50 min', status: 'upcoming' },
                    { id: 'match-2', time: '13:00', date: '2026-06-28', patientId: 'match-p2', patientName: 'João Ferreira', professionalId: '1', professionalName: 'Dra. Elena Silva', type: 'online', duration: '50 min', status: 'upcoming' },
                    { id: 'match-3', time: '16:30', date: '2026-06-28', patientId: 'match-p3', patientName: 'Lúcia Mendes', professionalId: '1', professionalName: 'Dra. Elena Silva', type: 'online', duration: '50 min', status: 'upcoming' }
                  ];
                  const updated = [...appointments, ...matchAppts];
                  setAppointments(updated);
                  localStorage.setItem('appointments_list', JSON.stringify(updated));

                  // Log de Auditoria MCSI
                  matchAppts.forEach(appt => {
                    logAction({
                      userId: user?.email ?? 'sistema',
                      userName: user?.name ?? 'Coordenador',
                      action: 'EDIT',
                      targetCode: `APPT-${appt.id}`,
                      description: `[Agenda-IA] Criou agendamento automatizado via IA para beneficiário: ${appt.patientName}`,
                      ipAddress: '—',
                      device: navigator.userAgent.slice(0, 80),
                    });
                  });

                  alert('Agendamentos automatizados realizados! Notificações enviadas via WhatsApp para confirmação.');
                  setAiModalOpen(false);
                }}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
              >
                Confirmar Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANUAL DE NOVO AGENDAMENTO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Novo Agendamento Clínico</h3>
              <p className="text-sm text-slate-500 mt-2">Selecione o paciente e o profissional para alocação de horário.</p>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Beneficiário (Paciente)</label>
                <select 
                  value={formPatientId} 
                  onChange={(e) => setFormPatientId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="">Selecione um paciente...</option>
                  {patients.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Profissional Voluntário</label>
                <select 
                  value={formProfId} 
                  onChange={(e) => setFormProfId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="">Selecione um profissional...</option>
                  {professionals.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} - {p.profession}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Horário</label>
                  <select 
                    value={formTime} 
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Modalidade</label>
                  <select 
                    value={formType} 
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="online">Vídeo (Online)</option>
                    <option value="presencial">Presencial (Sede)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Data da Consulta</label>
                <input 
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-teal-900/10"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
