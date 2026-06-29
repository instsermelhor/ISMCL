// =========================================================================
// PROJETO AURA - DESIGN SYSTEM (AURA UI)
// =========================================================================
// Este componente foca em acessibilidade e estado emocional (Panic Button),
// conforme as especificações UX/UI.

import React, { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

interface QuickExitButtonProps {
  escapeUrl?: string;
}

/**
 * QUICK EXIT BUTTON (Botão de Pânico / Saída Rápida)
 * 
 * Componente essencial para o 'Projeto Mulheres' ou vítimas em vulnerabilidade.
 * Fica fixo flutuando na tela. Ao clicar (ou pressionar a tecla ESC 3 vezes),
 * substitui a URL atual no histórico do navegador (replace) para evitar
 * que o agressor utilize o botão "Voltar".
 */
export const QuickExitButton: React.FC<QuickExitButtonProps> = ({ 
  escapeUrl = 'https://www.google.com.br' 
}) => {
  
  const handleQuickExit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    window.location.replace(escapeUrl);
  };

  // Escuta tecla ESC pressionada múltiplas vezes
  useEffect(() => {
    let escCount = 0;
    let timer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        escCount++;
        clearTimeout(timer);
        
        if (escCount >= 3) {
          handleQuickExit();
        }

        timer = setTimeout(() => { escCount = 0; }, 2000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, []);

  return (
    <button
      onClick={handleQuickExit}
      title="Saída Rápida - Fecha esta tela imediatamente (Atalho: ESC 3x)"
      aria-label="Botão de Saída Rápida. Fecha a aplicação por segurança."
      className="
        fixed bottom-6 right-6 z-[9999]
        flex items-center gap-2 px-4 py-3
        bg-rose-600 hover:bg-rose-700 text-white font-medium
        rounded-full shadow-lg transition-all
        focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300
        group
      "
    >
      <ShieldAlert className="w-5 h-5 animate-pulse group-hover:animate-none" />
      <span className="hidden sm:inline-block">Saída Rápida</span>
    </button>
  );
};
