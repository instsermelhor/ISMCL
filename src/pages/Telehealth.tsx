import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneMissed, 
  ShieldAlert,
  AlertTriangle,
  Clock,
  FileText,
  Save,
  Lock,
  ChevronLeft
} from 'lucide-react';
import { cn } from '../utils';

// =========================================================================
// MÓDULO CLÍNICO - VISUALIZAÇÃO SPLIT (TELECONSULTA + EMR SIDE-BY-SIDE)
// =========================================================================

export function Telehealth() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // EMR State
  const [evolutionText, setEvolutionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save simulation
  useEffect(() => {
    if (!evolutionText) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1500);
    return () => clearTimeout(timer);
  }, [evolutionText]);

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans">
      
      {/* 1. SIDEBAR ESQUERDA (20%) - DADOS DO PACIENTE */}
      <aside className="w-1/5 min-w-[280px] bg-white border-r border-stone-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-stone-100 flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500"
            title="Voltar ao Painel"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold text-stone-800">Sessão Clínica</h2>
            <p className="text-xs text-stone-500 font-mono">ID: {id?.substring(0, 8) || 'CASE-123'}</p>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Patient Card */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-2xl font-bold mb-3 shadow-inner">
              AS
            </div>
            <h3 className="text-lg font-semibold text-stone-900">Ana Silva Santos</h3>
            <p className="text-sm text-stone-500">28 anos • Feminino</p>
          </div>

          {/* Risco / Alertas (Trauma-Informed) */}
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-800">Alerta de Vulnerabilidade</h4>
                <p className="text-xs text-rose-700 mt-1">Histórico de violência doméstica (Protocolo Mulheres ativado).</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-amber-800 mb-2">Hipótese Diagnóstica</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">CID-11: 6B40</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">TEPT</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. CENTRO ESQUERDA (40%) - VÍDEO WEBRTC */}
      <main className="w-2/5 bg-slate-900 flex flex-col relative shadow-2xl z-20">
        
        {/* Top Bar Video */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-gradient-to-b from-slate-900/90 to-transparent z-10">
          <div className="flex items-center gap-2 bg-teal-900/40 text-teal-300 backdrop-blur-md px-3 py-1.5 rounded-lg border border-teal-800/50 text-xs font-medium">
            <ShieldAlert className="w-4 h-4" />
            E2EE Criptografado
          </div>
          <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-mono">
            <Clock className="w-4 h-4 text-slate-400" />
            14:02
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Mock Paciente */}
          <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center mb-4 border-4 border-slate-600/50 shadow-lg">
              <span className="text-4xl font-medium text-slate-400">AS</span>
            </div>
            <p className="text-lg font-medium text-slate-300">Ana Silva</p>
            <p className="text-sm text-slate-500 mt-2">Conexão Estável (Ping: 45ms)</p>
          </div>

          {/* Self View (PIP) */}
          <motion.div 
            drag
            dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
            className="absolute bottom-24 right-6 w-32 h-48 bg-slate-700 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-600/50 cursor-grab active:cursor-grabbing"
          >
             <div className="w-full h-full flex items-center justify-center bg-slate-800">
               {isVideoOff ? (
                 <VideoOff className="w-6 h-6 text-slate-400" />
               ) : (
                 <span className="text-xs text-slate-400">Sua Câmera</span>
               )}
             </div>
          </motion.div>
        </div>

        {/* Video Controls */}
        <div className="h-20 bg-slate-900/95 border-t border-slate-800 flex items-center justify-center gap-4 px-6 shrink-0 pb-safe">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              isMuted ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              isVideoOff ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            )}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => {
              if (confirm("Encerrar a videochamada?")) {
                navigate('/dashboard');
              }
            }}
            className="w-16 h-12 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center transition-colors ml-4 shadow-lg shadow-rose-900/20"
          >
            <PhoneMissed className="w-6 h-6 text-white" />
          </button>
        </div>
      </main>

      {/* 3. CENTRO DIREITA (40%) - EMR EDITOR DE EVOLUÇÃO */}
      <section className="w-2/5 bg-white flex flex-col border-l border-stone-200 z-10">
        
        {/* Editor Header */}
        <header className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">Evolução Clínica</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-medium px-2 py-0.5 bg-stone-200 text-stone-700 rounded-full">Rascunho</span>
                <span className="text-xs text-stone-500 flex items-center gap-1">
                  {isSaving ? (
                    <><Save className="w-3 h-3 animate-pulse" /> Salvando...</>
                  ) : lastSaved ? (
                    `Salvo às ${lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                  ) : (
                    'Não salvo'
                  )}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Editor Body (Focus Mode) */}
        <div className="flex-1 p-8 bg-white overflow-y-auto">
          <textarea
            value={evolutionText}
            onChange={(e) => setEvolutionText(e.target.value)}
            placeholder="Relate os pontos principais da sessão. Ex: Paciente apresenta melhora no quadro ansioso, relata ter conseguido dormir melhor na última semana..."
            className="w-full h-full min-h-[500px] resize-none border-0 focus:ring-0 text-stone-700 placeholder:text-stone-300 text-lg leading-relaxed font-sans bg-transparent"
          />
        </div>

        {/* Editor Footer (Actions) */}
        <footer className="p-6 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
          <div className="text-xs text-stone-500 max-w-[200px] leading-tight">
            Seu texto é salvo automaticamente a cada alteração.
          </div>
          <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm shadow-teal-900/10 transition-all focus:outline-none focus:ring-4 focus:ring-teal-500/20">
            <Lock className="w-4 h-4" />
            Assinar e Trancar
          </button>
        </footer>
      </section>

    </div>
  );
}

