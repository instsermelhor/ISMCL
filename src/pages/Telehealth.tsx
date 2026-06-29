import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneMissed, 
  MessageSquare,
  ShieldAlert,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { cn } from '../utils';

export function Telehealth() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      
      {/* Video Area */}
      <main className="flex-1 flex flex-col relative">
        
        {/* Header / Security Badge */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-slate-900/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium">Conectado com Ana Silva</span>
            </div>
            <div className="bg-teal-900/40 text-teal-300 backdrop-blur px-3 py-2 rounded-xl flex items-center gap-2 border border-teal-800/50 text-xs font-medium">
              <ShieldAlert className="w-4 h-4" />
              Criptografia de ponta a ponta
            </div>
          </div>
          
          <div className="text-slate-300 font-medium text-sm">
            14:02 / 50:00
          </div>
        </div>

        {/* Main Video (Patient) */}
        <div className="flex-1 w-full h-full bg-slate-800 flex items-center justify-center relative">
           {/* Mock Patient Video Placeholder */}
           <div className="text-slate-600 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center mb-4 border-4 border-slate-600/50">
                <span className="text-4xl font-medium text-slate-400">AS</span>
              </div>
              <p className="text-lg font-medium text-slate-300">Ana Silva Santos</p>
              <p className="text-sm text-slate-500 mt-1">O paciente desativou a câmera temporariamente</p>
           </div>

           {/* Self Video PIP */}
           <motion.div 
             drag
             dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
             className="absolute bottom-24 right-6 w-48 h-64 bg-slate-700 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-600 shadow-black/50"
           >
              {/* Mock Self Video */}
              <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                 {isVideoOff ? (
                   <VideoOff className="w-8 h-8 text-slate-400" />
                 ) : (
                   <span className="text-slate-400 text-sm">Sua câmera</span>
                 )}
              </div>
           </motion.div>
        </div>

        {/* Controls Bar */}
        <div className="h-24 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 px-6 z-10 shrink-0">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              isMuted ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30" : "bg-slate-800 text-white hover:bg-slate-700"
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              isVideoOff ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30" : "bg-slate-800 text-white hover:bg-slate-700"
            )}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-16 h-12 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center transition-colors ml-4 shadow-lg shadow-rose-900/20"
          >
            <PhoneMissed className="w-6 h-6 text-white" />
          </button>

          <div className="w-px h-8 bg-slate-700 mx-2" />

          <button 
            onClick={() => setShowChat(!showChat)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              showChat ? "bg-teal-600 text-white hover:bg-teal-500" : "bg-slate-800 text-white hover:bg-slate-700"
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Side Panel (Chat / Notes) */}
      {showChat && (
        <motion.aside 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          className="bg-white text-slate-900 border-l border-slate-200 flex flex-col shrink-0"
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Rascunho Rápido</h3>
            <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-slate-600">
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-4 bg-slate-50">
            <textarea 
              className="w-full h-full bg-transparent border-0 resize-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400"
              placeholder="Faça suas anotações durante a sessão. Este conteúdo não é salvo automaticamente no prontuário oficial e será perdido ao fechar a chamada, a menos que você o copie."
            />
          </div>
          <div className="p-4 border-t border-slate-100 bg-white">
            <button className="w-full py-2 bg-teal-50 text-teal-700 font-medium text-sm rounded-xl hover:bg-teal-100 transition-colors">
              Copiar anotações
            </button>
          </div>
        </motion.aside>
      )}

    </div>
  );
}
