// ============================================================
// useInactivityLogout — Hook de Logout Automático por Inatividade
// Instituto Ser Melhor — Plataforma Aura (Prompt 177 — ETAPA 6)
// ============================================================
// Detecta inatividade do usuário e dispara logout automático,
// atendendo ao requisito de expiração de sessão por inatividade.
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { getAdminSessionTimeoutMs } from '../services/SecureCredentialsService';

interface UseInactivityLogoutOptions {
  /** Callback chamado quando a sessão expira por inatividade */
  onTimeout: () => void;
  /** Se false, o hook fica desativado (ex: usuário não autenticado) */
  enabled?: boolean;
  /** Timeout em ms (padrão: lê de VITE_ADMIN_SESSION_TIMEOUT_MINUTES) */
  timeoutMs?: number;
  /** Aviso antes do logout em ms (padrão: 60000 = 1 min antes) */
  warningBeforeMs?: number;
  /** Callback opcional de aviso antes do logout */
  onWarning?: (remainingMs: number) => void;
}

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'focus',
];

export function useInactivityLogout({
  onTimeout,
  enabled = true,
  timeoutMs,
  warningBeforeMs = 60_000,
  onWarning,
}: UseInactivityLogoutOptions) {
  const resolvedTimeout = timeoutMs ?? getAdminSessionTimeoutMs();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    lastActivityRef.current = Date.now();
    clearTimers();

    // Aviso antes do logout
    if (onWarning && resolvedTimeout > warningBeforeMs) {
      warningTimerRef.current = setTimeout(() => {
        onWarning(warningBeforeMs);
      }, resolvedTimeout - warningBeforeMs);
    }

    // Logout por inatividade
    timerRef.current = setTimeout(() => {
      onTimeout();
    }, resolvedTimeout);
  }, [enabled, resolvedTimeout, warningBeforeMs, onWarning, onTimeout, clearTimers]);

  useEffect(() => {
    if (!enabled) return;

    // Inicializa timer
    resetTimer();

    // Registra eventos de atividade
    const handleActivity = () => resetTimer();
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, resetTimer, clearTimers]);

  return {
    /** Tempo decorrido desde a última atividade em ms */
    getIdleTime: () => Date.now() - lastActivityRef.current,
    /** Reset manual do timer */
    resetTimer,
  };
}
