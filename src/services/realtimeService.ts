export interface RealtimeEvent<T = unknown> {
  eventType: string;
  specversion: string;
  time: string;
  tenantId: string;
  payload: T;
}

type EventListenerCallback<T = any> = (event: RealtimeEvent<T>) => void;

class RealtimeService {
  private eventSource: EventSource | null = null;
  private listeners = new Map<string, Set<EventListenerCallback>>();
  private isConnected = false;
  private reconnectTimeout: any = null;

  /**
   * Inicializa a conexão SSE em tempo real com o backend NestJS.
   */
  public connect(baseUrl = 'http://localhost:3001') {
    if (this.eventSource || this.isConnected) return;

    try {
      const streamUrl = `${baseUrl}/api/realtime/stream`;
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        console.info('[RealtimeService] ⚡ Conexão SSE em tempo real estabelecida com sucesso');
      };

      this.eventSource.onmessage = (messageEvent) => {
        try {
          const parsedData = JSON.parse(messageEvent.data) as RealtimeEvent;
          this.emitEvent(parsedData.eventType, parsedData);
          // Notifica inscritos em wildcard ou tipo geral
          this.emitEvent('*', parsedData);
        } catch {
          // ignora erro de parse
        }
      };

      this.eventSource.onerror = () => {
        console.warn('[RealtimeService] ⚠️ Conexão SSE interrompida. Reconectando em 5s...');
        this.disconnect();
        this.reconnectTimeout = setTimeout(() => this.connect(baseUrl), 5000);
      };
    } catch (err) {
      console.error('[RealtimeService] Erro ao conectar SSE:', err);
    }
  }

  /**
   * Inscreve um callback para ser notificado de eventos específicos (e.g. `aura.intake.triage.created.v1`).
   */
  public subscribe<T = any>(eventType: string, callback: EventListenerCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Retorna função de unsubscribe
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
      }
    };
  }

  /**
   * Dispara um evento para todos os ouvintes inscritos.
   */
  private emitEvent(eventType: string, event: RealtimeEvent) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[RealtimeService] Erro no listener do evento ${eventType}:`, err);
        }
      });
    }
  }

  /**
   * Encerra a conexão SSE.
   */
  public disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }
}

export const realtimeService = new RealtimeService();
