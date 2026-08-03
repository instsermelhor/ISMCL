/**
 * ErrorBoundary.tsx — Prompt 181 (Auditoria Forense e Resiliência)
 *
 * Implementa três níveis de Error Boundary para isolamento granular de falhas:
 *
 * 1. GlobalErrorBoundary   — Proteção global (instalado em main.tsx).
 *                            Captura QUALQUER exceção que escape dos outros boundaries.
 *                            Exibe tela de contingência premium com diagnóstico completo.
 *
 * 2. RouteErrorBoundary    — Instalado individualmente em CADA rota de App.tsx.
 *                            Isola falhas de página sem derrubar o AppLayout.
 *                            Exibe UI inline de erro sem white screen.
 *
 * 3. WidgetErrorBoundary   — Para widgets, cards e componentes isolados do Dashboard.
 *                            Exibe placeholder de erro mínimo preservando o restante da página.
 *
 * Recursos Forenses (Prompt 181 — Etapas 1–9):
 * - Stack trace completo registrado no console com grupo colapsável
 * - Component stack (árvore de componentes) visível na UI em DEV
 * - Persistência diagnóstica em sessionStorage para análise pós-reload
 * - Informações de rota, usuário, sessão, timestamp e user-agent
 * - Auto-retry silencioso (até 2 tentativas) antes de exibir fallback
 * - Hook `onError` opcional para integração com Sentry/Datadog
 */

import React from 'react';

// ================================================================
// TIPOS
// ================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Número máximo de auto-retries silenciosos antes de exibir fallback */
  maxAutoRetries?: number;
  /** Identificador semântico para logs (ex: 'Dashboard', 'PatientRecord') */
  label?: string;
}

// ================================================================
// LOGGER FORENSE INLINE
// Captura contexto máximo sem depender de imports externos
// ================================================================

function buildForensicReport(
  error: Error,
  errorInfo: React.ErrorInfo,
  label: string
): Record<string, unknown> {
  const user = (() => {
    try {
      const raw = localStorage.getItem('iam_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return { id: parsed?.id, name: parsed?.name, role: parsed?.primaryRole };
    } catch {
      return null;
    }
  })();

  return {
    // ── Identificação do Incidente ──────────────────────────────
    incidentId: `aura-err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    boundary: label,

    // ── Erro ───────────────────────────────────────────────────
    errorMessage: error.message,
    errorName: error.name,
    stackTrace: error.stack ?? 'stack não disponível',
    componentStack: errorInfo.componentStack ?? 'componentStack não disponível',

    // ── Contexto da Aplicação ───────────────────────────────────
    route: window.location.pathname + window.location.search,
    user: user ?? 'não autenticado',

    // ── Contexto do Ambiente ────────────────────────────────────
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine,
    screenResolution: `${screen.width}×${screen.height}`,
    viewportSize: `${window.innerWidth}×${window.innerHeight}`,
    referrer: document.referrer || 'direto',
    buildMode: (import.meta as any).env.MODE,
  };
}

function logForensicError(report: Record<string, unknown>, label: string) {
  // ── Console estruturado (visível em todas as ferramentas de dev) ─
  console.group(
    `%c[Aura ErrorBoundary] ⚠️  Exceção capturada — ${label}`,
    'color: #ef4444; font-weight: bold; font-size: 13px;'
  );
  console.error('Mensagem:', report.errorMessage);
  console.error('Stack Trace:\n', report.stackTrace);
  console.info('Component Stack:\n', report.componentStack);
  console.table({
    'Rota': report.route,
    'Usuário': typeof report.user === 'object' && report.user
      ? `${(report.user as {name: string}).name} (${(report.user as {role: string}).role})`
      : 'não autenticado',
    'Horário': report.timestamp,
    'Modo': report.buildMode,
  });
  console.groupEnd();

  // ── Persistência em sessionStorage (sobrevive ao retry mas não ao fechamento) ─
  try {
    const existing = JSON.parse(sessionStorage.getItem('aura_error_log') ?? '[]');
    const updated = [report, ...existing].slice(0, 20); // mantém os 20 mais recentes
    sessionStorage.setItem('aura_error_log', JSON.stringify(updated));
    sessionStorage.setItem('aura_last_error', JSON.stringify(report));
  } catch {
    // sessionStorage indisponível — não bloqueia
  }
}

// ================================================================
// 1. GlobalErrorBoundary
// Instalado no topo da árvore em main.tsx — última linha de defesa.
// ================================================================

export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private autoRetryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const label = this.props.label ?? 'GlobalErrorBoundary';
    const maxRetries = this.props.maxAutoRetries ?? 0; // global não faz auto-retry

    this.setState({ errorInfo });

    // Gera e persiste relatório forense
    const report = buildForensicReport(error, errorInfo, label);
    logForensicError(report, label);

    // Hook externo opcional (Sentry, Datadog, telemetria)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry silencioso (apenas se maxAutoRetries > 0)
    if (this.state.retryCount < maxRetries) {
      const delay = Math.pow(2, this.state.retryCount) * 500; // backoff: 500ms, 1s, 2s…
      this.autoRetryTimer = setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prev.retryCount + 1,
        }));
      }, delay);
    }
  }

  componentWillUnmount() {
    if (this.autoRetryTimer) clearTimeout(this.autoRetryTimer);
  }

  handleManualRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, retryCount: 0 });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    try { sessionStorage.removeItem('aura_last_error'); } catch {}
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isDev = (import.meta as any).env.DEV;
      const { error, errorInfo } = this.state;

      return (
        <div
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #09090e 0%, #0d0f1a 60%, #0a1020 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
            color: '#f1f5f9',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: 600,
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 24,
              padding: '40px 36px',
              textAlign: 'center',
              boxShadow: '0 0 80px rgba(239,68,68,0.06)',
            }}
          >
            {/* Ícone */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 28,
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#fff',
                margin: '0 0 8px',
                letterSpacing: '-0.3px',
              }}
            >
              Ocorreu um erro inesperado
            </h1>

            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px' }}>
              A Plataforma Aura encontrou um problema e não conseguiu renderizar este componente.
              Suas sessões e dados estão seguros.
            </p>

            {/* Rota atual (sempre visível) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8,
                padding: '4px 12px',
                fontSize: 11,
                color: '#fca5a5',
                fontFamily: 'monospace',
                marginBottom: 24,
              }}
            >
              📍 {window.location.pathname}
            </div>

            {/* Botões de ação */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
              <button
                onClick={this.handleManualRetry}
                style={{
                  padding: '10px 22px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                }}
              >
                🔄 Tentar Novamente
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 22px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                }}
              >
                ↺ Recarregar
              </button>
              <button
                onClick={this.handleClearAndReload}
                style={{
                  padding: '10px 22px',
                  borderRadius: 12,
                  background: 'rgba(239,68,68,0.1)',
                  color: '#fca5a5',
                  fontWeight: 700,
                  fontSize: 13,
                  border: '1px solid rgba(239,68,68,0.2)',
                  cursor: 'pointer',
                }}
              >
                🚪 Voltar ao Login
              </button>
            </div>

            {/* Diagnóstico completo em DEV */}
            {isDev && error && (
              <div style={{ textAlign: 'left', marginTop: 8 }}>
                {/* Mensagem de erro */}
                <details
                  style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 8,
                    fontSize: 11,
                    color: '#fca5a5',
                    fontFamily: 'monospace',
                  }}
                  open
                >
                  <summary style={{ cursor: 'pointer', color: '#f87171', fontWeight: 700, marginBottom: 6 }}>
                    🛠 Erro ({error.name})
                  </summary>
                  <strong style={{ color: '#fbbf24' }}>{error.message}</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0', color: '#fca5a5', fontSize: 10, maxHeight: 180, overflow: 'auto' }}>
                    {error.stack}
                  </pre>
                </details>

                {/* Component Stack */}
                {errorInfo?.componentStack && (
                  <details
                    style={{
                      background: 'rgba(99,102,241,0.06)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 8,
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}
                  >
                    <summary style={{ cursor: 'pointer', color: '#a5b4fc', fontWeight: 700, marginBottom: 6 }}>
                      🌲 Árvore de Componentes (Component Stack)
                    </summary>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#c7d2fe', fontSize: 10, maxHeight: 200, overflow: 'auto' }}>
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                {/* Contexto do incidente */}
                <details
                  style={{
                    background: 'rgba(20,184,166,0.06)',
                    border: '1px solid rgba(20,184,166,0.2)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: '#5eead4',
                  }}
                >
                  <summary style={{ cursor: 'pointer', color: '#2dd4bf', fontWeight: 700, marginBottom: 6 }}>
                    📋 Contexto Forense
                  </summary>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 8px', fontSize: 10 }}>
                    <span style={{ color: '#94a3b8' }}>Rota:</span>
                    <span>{window.location.pathname}</span>
                    <span style={{ color: '#94a3b8' }}>Horário:</span>
                    <span>{new Date().toISOString()}</span>
                    <span style={{ color: '#94a3b8' }}>User-Agent:</span>
                    <span style={{ wordBreak: 'break-all' }}>{navigator.userAgent.slice(0, 80)}…</span>
                    <span style={{ color: '#94a3b8' }}>Modo:</span>
                    <span>{(import.meta as any).env.MODE}</span>
                    <span style={{ color: '#94a3b8' }}>sessionStorage:</span>
                    <span>aura_last_error persistido ✓</span>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ================================================================
// 2. RouteErrorBoundary
// Instalado em cada rota individualmente em App.tsx.
// Isola falhas de página sem derrubar o AppLayout.
// ================================================================

export class RouteErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private autoRetryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const label = this.props.label ?? 'RouteErrorBoundary';
    const maxRetries = this.props.maxAutoRetries ?? 2; // rotas tentam 2x antes de mostrar UI de erro

    this.setState({ errorInfo });

    const report = buildForensicReport(error, errorInfo, label);
    logForensicError(report, label);

    if (this.props.onError) this.props.onError(error, errorInfo);

    // Auto-retry com backoff exponencial
    if (this.state.retryCount < maxRetries) {
      const delay = Math.pow(2, this.state.retryCount) * 300; // 300ms, 600ms
      this.autoRetryTimer = setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prev.retryCount + 1,
        }));
      }, delay);
    }
  }

  componentWillUnmount() {
    if (this.autoRetryTimer) clearTimeout(this.autoRetryTimer);
  }

  render() {
    if (this.state.hasError) {
      const isDev = (import.meta as any).env.DEV;
      const { error, errorInfo } = this.state;
      const maxRetries = this.props.maxAutoRetries ?? 2;
      const exhausted = this.state.retryCount >= maxRetries;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 360,
            gap: 16,
            padding: 32,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <span style={{ fontSize: 40 }}>⚠️</span>

          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <p style={{ fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px', fontSize: 15 }}>
              Erro ao carregar este módulo
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
              {isDev
                ? error?.message ?? 'Erro desconhecido'
                : 'Ocorreu um problema ao renderizar este conteúdo. Tente novamente.'}
            </p>

            {/* Rota em DEV */}
            {isDev && (
              <code
                style={{
                  display: 'block',
                  fontSize: 10,
                  color: '#fca5a5',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  marginBottom: 12,
                  fontFamily: 'monospace',
                }}
              >
                📍 {window.location.pathname}
              </code>
            )}
          </div>

          {exhausted && (
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null, retryCount: 0 })}
              style={{
                padding: '9px 22px',
                borderRadius: 10,
                background: 'rgba(99,102,241,0.15)',
                color: '#a5b4fc',
                border: '1px solid rgba(99,102,241,0.3)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              🔄 Tentar novamente
            </button>
          )}

          {/* Component Stack em DEV */}
          {isDev && errorInfo?.componentStack && (
            <details
              style={{
                width: '100%',
                maxWidth: 520,
                textAlign: 'left',
                background: 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 10,
                fontFamily: 'monospace',
                color: '#c7d2fe',
              }}
            >
              <summary style={{ cursor: 'pointer', color: '#a5b4fc', fontWeight: 700, marginBottom: 6 }}>
                🌲 Component Stack
              </summary>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, maxHeight: 160, overflow: 'auto' }}>
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ================================================================
// 3. WidgetErrorBoundary
// Para cards, gráficos e widgets do Dashboard.
// Exibe placeholder mínimo sem interromper o layout.
// ================================================================

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  widgetName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<WidgetErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const label = `WidgetErrorBoundary[${this.props.widgetName ?? 'widget'}]`;
    const report = buildForensicReport(error, errorInfo, label);
    logForensicError(report, label);
    if (this.props.onError) this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 120,
            gap: 8,
            background: 'rgba(239,68,68,0.03)',
            border: '1px dashed rgba(239,68,68,0.2)',
            borderRadius: 12,
            padding: 16,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <p
            style={{
              fontSize: 11,
              color: '#94a3b8',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {this.props.widgetName
              ? `Widget "${this.props.widgetName}" indisponível`
              : 'Componente indisponível'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              fontSize: 10,
              color: '#6366f1',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Retentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
