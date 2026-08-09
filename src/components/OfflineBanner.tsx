import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { offlineStorageService, type SyncStatusSummary } from '../services/offlineStorageService';

/**
 * OfflineBanner — Componente de Status PWA & Conectividade Offline (Fase P13)
 *
 * Exibe um alerta fixo quando o agente de campo está offline ou quando existem
 * triagens/prontuários acumulados no IndexedDB aguardando sincronização.
 */
export default function OfflineBanner() {
  const [summary, setSummary] = useState<SyncStatusSummary>({
    pendingTriagesCount: 0,
    pendingNotesCount: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });
  const [syncing, setSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const refreshSummary = async () => {
    try {
      const data = await offlineStorageService.getSyncSummary();
      setSummary(data);
    } catch {
      // ignora em SSR/dev
    }
  };

  useEffect(() => {
    refreshSummary();

    const handleOnline = () => {
      refreshSummary();
      // Auto-sync ao reconectar
      handleSync();
    };

    const handleOffline = () => refreshSummary();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Registra listener do Service Worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AURA_TRIGGER_SYNC') {
        handleSync();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    const interval = setInterval(refreshSummary, 10_000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      const res = await offlineStorageService.syncAllPendingData();
      await refreshSummary();
      setSuccessMsg(`Sincronizados com sucesso: ${res.syncedTriages} triagens e ${res.syncedNotes} notas!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('[OfflineBanner] Erro ao sincronizar:', err);
    } finally {
      setSyncing(false);
    }
  };

  const totalPending = summary.pendingTriagesCount + summary.pendingNotesCount;

  if (summary.isOnline && totalPending === 0 && !successMsg) {
    return null; // Não renderiza nada se estiver online e sem pendências
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 shadow-lg"
      >
        {!summary.isOnline ? (
          <div className="bg-amber-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium border-b border-amber-500">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
              <span>
                <strong>Modo Offline Ativo:</strong> Você está sem conexão. Seus atendimentos estão sendo salvos com segurança no dispositivo.
              </span>
            </div>
            {totalPending > 0 && (
              <span className="bg-amber-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
                {totalPending} item(ns) pendente(s)
              </span>
            )}
          </div>
        ) : totalPending > 0 ? (
          <div className="bg-indigo-700 text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium border-b border-indigo-600">
            <div className="flex items-center gap-2">
              <CloudUpload className="w-4 h-4 shrink-0" />
              <span>
                Existem <strong>{totalPending} atendimento(s) offline</strong> salvos neste dispositivo aguardando envio.
              </span>
            </div>
            <button
              id="btn-sync-offline-now"
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 bg-white text-indigo-900 px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </button>
          </div>
        ) : successMsg ? (
          <div className="bg-emerald-600 text-white px-4 py-2 flex items-center gap-2 text-xs font-medium border-b border-emerald-500">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
