/**
 * forensicLogger.ts — Prompt 181 (Etapa 9 — Observabilidade)
 *
 * Logger forense estruturado para a Plataforma Aura.
 * Registra exceções, eventos de ciclo de vida e falhas de API
 * com rastreabilidade completa: componente, usuário, sessão,
 * rota, timestamp, stack trace e contexto do dispositivo.
 *
 * Design Principles:
 * - Zero dependências externas (puro TypeScript)
 * - Nunca lança exceções (fail-silent para não agravar o incidente)
 * - Persistência em sessionStorage (análise pós-reload sem rede)
 * - Agrupamento semântico no console para fácil triagem
 */

// ================================================================
// TIPOS
// ================================================================

export type LogSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface ForensicLog {
  /** ID único do evento */
  id: string;
  /** Timestamp ISO 8601 */
  timestamp: string;
  /** Severidade do evento */
  severity: LogSeverity;
  /** Componente ou módulo que originou o log */
  source: string;
  /** Mensagem descritiva */
  message: string;
  /** Dados estruturados opcionais */
  details?: Record<string, unknown>;

  // ── Contexto do Usuário ──────────────────────────────────────
  userId?: string;
  userName?: string;
  userRole?: string;

  // ── Contexto da Aplicação ────────────────────────────────────
  route?: string;
  buildMode?: string;

  // ── Contexto Técnico ─────────────────────────────────────────
  stackTrace?: string;
  componentStack?: string;
  userAgent?: string;
}

export interface AuraForensicLogger {
  debug(source: string, message: string, details?: Record<string, unknown>): void;
  info(source: string, message: string, details?: Record<string, unknown>): void;
  warn(source: string, message: string, details?: Record<string, unknown>): void;
  error(source: string, message: string, error?: Error, details?: Record<string, unknown>): void;
  critical(source: string, message: string, error?: Error, details?: Record<string, unknown>): void;
  captureException(source: string, error: Error, componentStack?: string): void;
  getLogs(): ForensicLog[];
  clearLogs(): void;
  exportLogs(): string;
}

// ================================================================
// IMPLEMENTAÇÃO
// ================================================================

const SESSION_KEY = 'aura_forensic_logs';
const MAX_LOGS = 50;

const SEVERITY_STYLES: Record<LogSeverity, string> = {
  debug:    'color: #64748b; font-weight: 400;',
  info:     'color: #22d3ee; font-weight: 600;',
  warning:  'color: #fbbf24; font-weight: 700;',
  error:    'color: #f87171; font-weight: 700;',
  critical: 'color: #ef4444; font-weight: 800; font-size: 14px;',
};

const SEVERITY_EMOJI: Record<LogSeverity, string> = {
  debug:    '🔍',
  info:     'ℹ️',
  warning:  '⚠️',
  error:    '❌',
  critical: '🚨',
};

function getCurrentUser(): { id?: string; name?: string; role?: string } {
  try {
    const raw = localStorage.getItem('iam_user');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      id: parsed?.id,
      name: parsed?.name,
      role: parsed?.primaryRole,
    };
  } catch {
    return {};
  }
}

function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadLogs(): ForensicLog[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: ForensicLog[]): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
  } catch {
    // sessionStorage unavailable or full — silent fail
  }
}

function createLog(
  severity: LogSeverity,
  source: string,
  message: string,
  error?: Error,
  componentStack?: string,
  details?: Record<string, unknown>
): ForensicLog {
  const user = getCurrentUser();
  return {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    severity,
    source,
    message,
    details,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    route: window.location.pathname + window.location.search,
    buildMode: (import.meta as any).env?.MODE ?? 'unknown',
    stackTrace: error?.stack,
    componentStack,
    userAgent: navigator.userAgent,
  };
}

function emitToConsole(log: ForensicLog): void {
  const isDev = (import.meta as any).env?.DEV ?? false;
  if (!isDev && log.severity === 'debug') return; // debug apenas em dev

  const emoji = SEVERITY_EMOJI[log.severity];
  const style = SEVERITY_STYLES[log.severity];
  const prefix = `[Aura Logger] ${emoji} [${log.severity.toUpperCase()}] ${log.source}`;

  if (log.severity === 'critical' || log.severity === 'error') {
    console.group(`%c${prefix}`, style);
    console.error(log.message);
    if (log.stackTrace) console.error('Stack:\n', log.stackTrace);
    if (log.componentStack) console.info('Component Stack:\n', log.componentStack);
    if (log.details) console.info('Detalhes:', log.details);
    console.info('Contexto:', {
      route: log.route,
      user: log.userName ?? 'não autenticado',
      role: log.userRole,
      timestamp: log.timestamp,
    });
    console.groupEnd();
  } else if (log.severity === 'warning') {
    console.warn(`%c${prefix}`, style, log.message, log.details ?? '');
  } else if (log.severity === 'info') {
    console.info(`%c${prefix}`, style, log.message, log.details ?? '');
  } else {
    console.debug(`%c${prefix}`, style, log.message, log.details ?? '');
  }
}

// ================================================================
// INSTÂNCIA SINGLETON
// ================================================================

class ForensicLoggerImpl implements AuraForensicLogger {
  private persist(log: ForensicLog): void {
    try {
      emitToConsole(log);
      const existing = loadLogs();
      saveLogs([log, ...existing]);
    } catch {
      // never throw
    }
  }

  debug(source: string, message: string, details?: Record<string, unknown>): void {
    this.persist(createLog('debug', source, message, undefined, undefined, details));
  }

  info(source: string, message: string, details?: Record<string, unknown>): void {
    this.persist(createLog('info', source, message, undefined, undefined, details));
  }

  warn(source: string, message: string, details?: Record<string, unknown>): void {
    this.persist(createLog('warning', source, message, undefined, undefined, details));
  }

  error(source: string, message: string, error?: Error, details?: Record<string, unknown>): void {
    this.persist(createLog('error', source, message, error, undefined, details));
  }

  critical(source: string, message: string, error?: Error, details?: Record<string, unknown>): void {
    this.persist(createLog('critical', source, message, error, undefined, details));
  }

  captureException(source: string, error: Error, componentStack?: string): void {
    this.persist(createLog('critical', source, error.message, error, componentStack));
  }

  getLogs(): ForensicLog[] {
    return loadLogs();
  }

  clearLogs(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem('aura_last_error');
    } catch {}
  }

  exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
}

/** Instância global do logger forense da Plataforma Aura */
export const forensicLogger: AuraForensicLogger = new ForensicLoggerImpl();

// ================================================================
// LISTENERS GLOBAIS DE PROMISE REJECTION E ERROS NÃO CAPTURADOS
// ================================================================

/**
 * Instala listeners globais para capturar exceções que escapam do React.
 * Deve ser chamado UMA vez em main.tsx ANTES do createRoot.
 */
export function installGlobalErrorListeners(): void {
  // Promessas rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(String(reason));
    forensicLogger.critical(
      'GlobalUnhandledRejection',
      `Promise rejeitada não tratada: ${error.message}`,
      error,
      { promiseReason: String(reason) }
    );
  });

  // Erros de JavaScript fora do React (ex: scripts de terceiros)
  window.addEventListener('error', (event) => {
    forensicLogger.critical(
      'GlobalWindowError',
      `Erro global não capturado: ${event.message}`,
      event.error instanceof Error ? event.error : new Error(event.message),
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });

  forensicLogger.info('ForensicLogger', 'Listeners globais de erro instalados com sucesso.');
}
