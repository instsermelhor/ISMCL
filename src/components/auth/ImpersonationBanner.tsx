import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, LogOut, Eye } from 'lucide-react';
import { useIAM } from '../../contexts/IAMContext';

/**
 * ImpersonationBanner — Componente Global de Aviso de Impersonação Assistida
 *
 * Exibe um banner fixo proeminente no topo de todas as páginas quando
 * o Super Usuário Universal está impersonando a experiência de outro usuário.
 *
 * Referência: Prompt 189 — Item 11
 */
export const ImpersonationBanner: React.FC = () => {
  const { impersonationState, stopImpersonation } = useIAM();

  if (!impersonationState?.isImpersonating) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-4 px-6 py-2.5 shadow-2xl text-xs font-semibold"
        style={{
          background: 'linear-gradient(90deg, #991b1b 0%, #b91c1c 50%, #7f1d1d 100%)',
          borderBottom: '1px solid rgba(254, 202, 202, 0.4)',
          color: '#ffffff',
        }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/30 border border-white/20 uppercase tracking-wider text-[10px] font-bold text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            Impersonação Assistida Ativa
          </div>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-white/80" />
            Visualizando como: <strong className="text-white underline underline-offset-2">{impersonationState.targetUser?.name}</strong> ({impersonationState.targetUser?.primaryRole})
          </span>
          <span className="text-white/70 hidden md:inline">|</span>
          <span className="text-white/80 italic hidden md:inline">
            Motivo: "{impersonationState.reason}"
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => stopImpersonation()}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white font-bold text-xs border border-white/30 transition-all shadow"
        >
          <LogOut className="w-3.5 h-3.5" />
          Encerrar Impersonação
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};
