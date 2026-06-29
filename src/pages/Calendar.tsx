import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, MapPin, Plus } from 'lucide-react';
import { motion } from 'motion/react';

const schedule = [
  { id: 1, time: '09:00', patient: 'Ana Silva', type: 'online', duration: '50 min', status: 'completed' },
  { id: 2, time: '10:00', patient: 'Carlos Santos', type: 'presencial', duration: '50 min', status: 'completed' },
  { id: 3, time: '11:00', patient: '-', type: 'empty', duration: '', status: '' },
  { id: 4, time: '13:00', patient: '-', type: 'empty', duration: '', status: '' },
  { id: 5, time: '14:00', patient: 'Júlia Costa', type: 'online', duration: '50 min', status: 'upcoming' },
  { id: 6, time: '15:30', patient: 'Marcos Oliveira', type: 'online', duration: '50 min', status: 'upcoming' },
  { id: 7, time: '16:30', patient: '-', type: 'empty', duration: '', status: '' },
];

export function Calendar() {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Agenda</h1>
            <p className="text-slate-500 mt-1">Gerencie seus horários e sessões.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
              Hoje
            </button>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-slate-700 border-x border-slate-100">
                28 de Junho, 2026
              </span>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {schedule.map((slot) => (
              <motion.div 
                key={slot.id} 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-stretch hover:bg-slate-50 transition-colors group"
              >
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
                    <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${slot.status === 'completed' ? 'bg-slate-300' : 'bg-teal-500'}`} />
                        <div>
                          <h4 className={`text-base font-medium ${slot.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {slot.patient}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              {slot.type === 'online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                              <span className="capitalize">{slot.type}</span>
                            </span>
                            <span>•</span>
                            <span>{slot.duration}</span>
                          </div>
                        </div>
                      </div>
                      
                      {slot.status === 'upcoming' && (
                        <button className="px-4 py-2 bg-teal-50 text-teal-700 text-sm font-medium rounded-xl hover:bg-teal-100 transition-colors">
                          Detalhes
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
