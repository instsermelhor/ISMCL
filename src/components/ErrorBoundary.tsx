import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * GlobalErrorBoundary — Prompt 180 (ETAPA 6)
 *
 * Captura qualquer exceção de renderização React antes que cause
 * tela branca (White Screen of Death). Exibe uma interface de
 * fallback premium com botão de retry e detalhes técnicos em
 * modo de desenvolvimento.
 *
 * Princípios aplicados:
 * - Zero tolerância a White Screen
 * - Logs estruturados para observabilidade
 * - UX de contingência com retry automático
 * - Security by Design (ocultar detalhes em produção)
 */
export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log estruturado para observabilidade
    console.error('[Aura ErrorBoundary] Exceção capturada:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Hook externo opcional (telemetria, Sentry, Datadog, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado pelo parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;

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
              maxWidth: 520,
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 24,
              padding: '40px 36px',
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(239,68,68,0.08)',
            }}
          >
            {/* Ícone de alerta */}
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
                margin: '0 auto 24px',
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

            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 28px' }}>
              A Plataforma Aura encontrou um problema e não conseguiu renderizar este componente.
              Suas sessões e dados estão seguros. Tente novamente ou recarregue a página.
            </p>

            {/* Botões de ação */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: isDev ? 24 : 0 }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '10px 24px',
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
                  padding: '10px 24px',
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
            </div>

            {/* Detalhes técnicos — apenas em desenvolvimento */}
            {isDev && this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontSize: 11,
                  color: '#ef4444',
                  fontFamily: 'monospace',
                  maxHeight: 200,
                  overflow: 'auto',
                  marginTop: 16,
                }}
              >
                <summary style={{ cursor: 'pointer', color: '#f87171', fontWeight: 700, marginBottom: 8 }}>
                  🛠️ Detalhes técnicos (DEV)
                </summary>
                <strong>{this.state.error.message}</strong>
                <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0', color: '#fca5a5', fontSize: 10 }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * RouteErrorBoundary — Versão leve para envolver rotas individuais.
 * Exibe mensagem inline sem bloquear o layout principal.
 */
export class RouteErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[Aura RouteErrorBoundary]', error.message, errorInfo.componentStack);
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
            minHeight: 320,
            gap: 16,
            color: '#94a3b8',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <span style={{ fontSize: 40 }}>⚠️</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px', fontSize: 15 }}>
              Erro ao carregar este módulo
            </p>
            <p style={{ fontSize: 12, margin: 0 }}>
              {import.meta.env.DEV ? this.state.error?.message : 'Tente recarregar a página.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              background: 'rgba(99,102,241,0.15)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.3)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            🔄 Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
