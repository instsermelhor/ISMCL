import React from 'react';
import { cn } from '../utils';
import { CheckCircle2, Circle, Clock, CheckCircle } from 'lucide-react';
import { phasesData } from '../data/phases';

interface SidebarProps {
  activePhaseId: string;
  onSelectPhase: (id: string) => void;
}

export function Sidebar({ activePhaseId, onSelectPhase }: SidebarProps) {
  return (
    <aside className="w-80 h-screen bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-8 pb-4">
        <h1 className="text-xl font-medium tracking-tight text-slate-900 mb-1">
          Projeto Aura
        </h1>
        <p className="text-sm text-slate-500 font-medium">by Instituto Ser Melhor</p>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">
          Fases do Projeto
        </div>
        
        {phasesData.map((phase) => {
          const isActive = phase.id === activePhaseId;
          
          return (
            <button
              key={phase.id}
              onClick={() => onSelectPhase(phase.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                isActive 
                  ? "bg-teal-50 text-teal-900 shadow-sm border border-teal-100/50" 
                  : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900"
              )}
            >
              <div className="shrink-0 flex items-center justify-center">
                {phase.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-teal-500" />}
                {phase.status === 'in-progress' && <Clock className="w-5 h-5 text-amber-500" />}
                {phase.status === 'pending' && <Circle className="w-5 h-5 text-slate-300" />}
              </div>
              
              <div className="flex-1 truncate">
                <div className={cn(
                  "text-xs font-medium mb-0.5",
                  isActive ? "text-teal-600" : "text-slate-400"
                )}>
                  Fase {phase.number}
                </div>
                <div className={cn(
                  "text-sm truncate",
                  isActive ? "font-semibold" : "font-medium"
                )}>
                  {phase.title}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
      
      <div className="p-6 mt-auto">
        <div className="bg-slate-100 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500 mb-2">Progresso do Planejamento</div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all duration-1000 ease-out" style={{ width: '90%' }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
