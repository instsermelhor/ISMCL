import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface RestrictedAreaButtonProps {
  variant?: 'floating' | 'header' | 'inline' | 'banner';
  className?: string;
}

/**
 * RestrictedAreaButton — Botão "Área Restrita" (Prompt 177 — ETAPA 1)
 * Redireciona para a tela de autenticação exclusiva da equipe interna (/admin-login).
 * Prompt 178 — textos revisados: sem referências a "administrativa" ou "administradores".
 */
export function RestrictedAreaButton({ variant = 'header', className = '' }: RestrictedAreaButtonProps) {
  const navigate = useNavigate();

  const handleRestrictedAccess = () => {
    navigate('/admin-login');
  };

  if (variant === 'floating') {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleRestrictedAccess}
        id="btn-area-restrita-floating"
        aria-label="Acessar Área Restrita — Equipe Interna"
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/90 text-amber-400 border border-amber-500/30 text-xs font-semibold shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-amber-300 hover:border-amber-400 transition-all duration-300 group cursor-pointer ${className}`}
      >
        <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
        <span>Área Restrita</span>
      </motion.button>
    );
  }

  if (variant === 'banner') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={handleRestrictedAccess}
        id="btn-area-restrita-banner"
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleRestrictedAccess()}
        aria-label="Acessar Área Restrita — Equipe Interna"
        className={`p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 group ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(124,58,237,0.08) 100%)',
          border: '1px solid rgba(245,158,11,0.25)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Área Restrita</span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Acesso exclusivo para colaboradores do Instituto Ser Melhor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform shrink-0">
          <span>Acessar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleRestrictedAccess}
      id="btn-area-restrita"
      aria-label="Acessar Área Restrita — Equipe Interna"
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-slate-800 hover:text-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 cursor-pointer ${className}`}
    >
      <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
      <span>Área Restrita</span>
    </motion.button>
  );
}
