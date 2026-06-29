import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, MapPin, Plus, Filter, Users, Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

// =========================================================================
// MÓDULO 03: AGENDA INTELIGENTE E CENTRAL DE AGENDAMENTOS
// =========================================================================

const MOCK_SCHEDULE = [
  { id: 1, time: '09:00', patient: 'Ana Silva', type: 'online', duration: '50 min', status: 'completed', prof: 'Dra. Elena Silva' },
  { id: 2, time: '10:00', patient: 'Carlos Santos', type: 'presencial', duration: '50 min', status: 'completed', prof: 'Dra. Elena Silva', room: 'Consultório 1' },
  { id: 3, time: '11:00', patient: '-', type: 'empty', duration: '', status: '' },
  { id: 4, time: '13:00', patient: '-', type: 'empty', duration: '', status: '' },
  { id: 5, time: '14:00', patient: 'Júlia Costa', type: 'online', duration: '50 min', status: 'upcoming', prof: 'Dra. Elena Silva' },
  { id: 6, time: '15:30', patient: 'Marcos Oliveira', type: 'online', duration: '50 min', status: 'upcoming', prof: 'Dra. Elena Silva' },
  { id: 7, time: '16:30', patient: '-', type: 'empty', duration: '', status: '' },
];

const MOCK_WAITLIST = [
  { id: 1, name: 'Beatriz Almeida', specialty: 'Psicologia', score: 98, waitTime: '15 dias', urgency: 'URGENT' },
  { id: 2, name: 'João Ferreira', specialty: 'Serviço Social', score: 85, waitTime: '5 dias', urgency: 'HIGH' },
  { id: 3, name: 'Lúcia Mendes', specialty: 'Psiquiatria', score: 70, waitTime: '20 dias', urgency: 'NORMAL' },
];

export function Calendar() {
  const [activeTab, setActiveTab] = useState('minha-agenda');
  const [isAiModalOpen, setAiModalOpen] = useState(false);

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
            <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
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
                  {MOCK_SCHEDULE.map((slot) => (
                    <div key={slot.id} className="flex items-stretch hover:bg-slate-50/50 transition-colors group">
                      <div className="w-24 shrink-0 py-4 px-6 flex items-center justify-center border-r border-slate-100">
                        <span className="text-sm font-medium text-slate-500">{slot.time}</span>
                      </div>
                      
                      <div className="flex-1 p-4">
                        {slot.type === 'empty' ? (
                          <div className="h-full flex items-center">
                            <button className="text-sm font-medium text-slate-400 group-hover:text-teal-600 transition-colors flex items-center gap-2">
                              <Plus className="w-4 h-4" />
                              Horário Disponível
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-100 rounded-xl p-4 shadow-sm gap-4">
                            <div className="flex items-center gap-4">
                              <div className={cn("w-2 h-10 rounded-full", slot.status === 'completed' ? 'bg-slate-300' : 'bg-teal-500')} />
                              <div>
                                <h4 className={cn("text-base font-medium", slot.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900')}>
                                  {slot.patient}
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                                  <span className="flex items-center gap-1.5">
                                    {slot.type === 'online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                                    <span className="capitalize">{slot.type}</span>
                                  </span>
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
                              <button className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors w-full sm:w-auto text-center shadow-sm">
                                Acessar Sala
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
