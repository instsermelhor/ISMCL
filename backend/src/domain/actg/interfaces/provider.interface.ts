/**
 * ICommunicationProvider — Interface canônica do ACTG
 * Todos os conectores de provedores DEVEM implementar esta interface.
 *
 * Princípio: O provedor é um canal de execução, nunca um sistema de registro.
 * O Aura Appointment ID é sempre a fonte da verdade.
 *
 * Referência: ADR-188, Prompt 188
 */
export interface ProviderSession {
  externalMeetingId: string;
  joinUrl: string;
  hostJoinUrl?: string;
  providerType: string;
  rawMetadata?: Record<string, unknown>;
}

export interface ProviderSessionUpdate {
  scheduledStart?: Date;
  scheduledEnd?: Date;
  title?: string;
}

export interface ProviderNotificationPayload {
  recipientPhone?: string;
  recipientEmail?: string;
  recipientName: string;
  appointmentDate: string;
  appointmentTime: string;
  professionalName: string;
  joinUrl?: string;
  templateName: string;
  language?: string;
}

export interface ProviderHealthResult {
  status: 'ONLINE' | 'DEGRADED' | 'UNAVAILABLE';
  latencyMs: number;
  message?: string;
}

export interface ICommunicationProvider {
  readonly providerType: string;

  /**
   * Cria uma sessão/reunião no provedor externo.
   * @param appointmentId - ID Aura (System of Record)
   * @param idempotencyKey - Chave de idempotência para evitar duplicidade
   */
  createSession(
    appointmentId: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    title: string,
    idempotencyKey: string,
    organizerEmail?: string,
    attendeeEmails?: string[],
  ): Promise<ProviderSession>;

  /**
   * Atualiza uma sessão existente no provedor.
   */
  updateSession(
    externalMeetingId: string,
    update: ProviderSessionUpdate,
  ): Promise<ProviderSession>;

  /**
   * Cancela uma sessão no provedor.
   */
  cancelSession(
    externalMeetingId: string,
    reason?: string,
  ): Promise<void>;

  /**
   * Verifica a saúde/disponibilidade do provedor.
   */
  checkHealth(): Promise<ProviderHealthResult>;

  /**
   * Envia notificação/convite via canal do provedor.
   * Apenas para provedores que suportam notificações (ex: WhatsApp Business).
   */
  sendNotification?(payload: ProviderNotificationPayload): Promise<{ messageId: string }>;

  /**
   * Processa e valida payload de webhook recebido do provedor.
   */
  processWebhook?(
    rawPayload: Record<string, unknown>,
    signature: string,
  ): Promise<{ eventType: string; externalMeetingId?: string; status?: string }>;
}
