import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { phasesData } from '../data/phases';

interface PhaseViewProps {
  phaseId: string;
}

export function PhaseView({ phaseId }: PhaseViewProps) {
  const phase = phasesData.find(p => p.id === phaseId);

  if (!phase) return null;

  return (
    <motion.div
      key={phase.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 overflow-y-auto bg-white"
    >
      <div className="max-w-4xl mx-auto px-12 py-16">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
              Fase {phase.number}
            </span>
            <div className="flex items-center gap-2">
              {phase.status === 'completed' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Concluído
                </span>
              )}
              {phase.status === 'in-progress' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Em Andamento
                </span>
              )}
              {phase.status === 'pending' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-sm font-medium">
                  <Circle className="w-4 h-4" />
                  Pendente
                </span>
              )}
            </div>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            {phase.title}
          </h1>
        </header>

        <div className="prose prose-slate prose-headings:font-medium prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-a:text-teal-600 max-w-none">
          <ReactMarkdown>{phase.content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
