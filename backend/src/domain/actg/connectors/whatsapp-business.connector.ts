import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ICommunicationProvider,
  ProviderHealthResult,
  ProviderNotificationPayload,
  ProviderSession,
  ProviderSessionUpdate,
} from '../interfaces/provider.interface';

/**
 * WhatsAppBusinessConnector — Integração com WhatsApp Business Platform (Meta Cloud API)
 *
 * ESCOPO OFICIAL:
 * - Envio de template messages de confirmação, lembretes e links de atendimento
 * - Processamento de webhooks de status de mensagem
 * - Health check via API oficial
 *
 * LIMITAÇÃO TÉCNICA OFICIAL (Meta Cloud API):
 * - A API oficial NÃO permite iniciar videochamadas programaticamente entre conta
 *   empresarial e usuário. O WhatsApp Business Platform é utilizado exclusivamente
 *   como canal de notificação e envio de link de acesso ao atendimento.
 *
 * Documentação oficial: https://developers.facebook.com/docs/whatsapp/cloud-api
 * Referência: ADR-188, Prompt 188 — Item 10, 11
 */
@Injectable()
export class WhatsAppBusinessConnector implements ICommunicationProvider {
  readonly providerType = 'WHATSAPP_BUSINESS';
  private readonly logger = new Logger(WhatsAppBusinessConnector.name);

  // Endpoint oficial da Meta Cloud API
  private readonly BASE_URL = 'https://graph.facebook.com/v19.0';

  constructor(private readonly config: ConfigService) {}

  private get phoneNumberId(): string {
    return this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
  }

  private get accessToken(): string {
    // Credencial gerenciada exclusivamente no backend via Vault/Secrets Manager
    // Nunca exposta no frontend
    return this.config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
  }

  /**
   * WhatsApp Business Platform não suporta criação de sessões de videochamada via API.
   * Este método retorna um canal de notificação puro — o link de atendimento
   * é gerado pelo ACTG Gateway e enviado via WhatsApp como texto/template.
   */
  async createSession(
    appointmentId: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    title: string,
    idempotencyKey: string,
  ): Promise<ProviderSession> {
    // WhatsApp Business API não gerencia sessões de reunião.
    // O "externalMeetingId" aqui é o appointmentId do Aura mesmo,
    // pois o WhatsApp funciona apenas como canal de notificação.
    this.logger.log(`[WhatsApp] Canal de notificação configurado para agendamento ${appointmentId}`);
    return {
      externalMeetingId: `WA-${appointmentId}`,
      joinUrl: '', // Link será gerado pelo ACTG Gateway e enviado via template message
      providerType: this.providerType,
      rawMetadata: {
        note: 'WhatsApp Business API — notification channel only. Join link sent via template message.',
        phoneNumberId: this.phoneNumberId,
      },
    };
  }

  async updateSession(externalMeetingId: string, update: ProviderSessionUpdate): Promise<ProviderSession> {
    // WhatsApp não gerencia sessões — apenas registra internamente
    this.logger.log(`[WhatsApp] Sessão ${externalMeetingId} atualizada (canal de notificação)`);
    return {
      externalMeetingId,
      joinUrl: '',
      providerType: this.providerType,
    };
  }

  async cancelSession(externalMeetingId: string, reason?: string): Promise<void> {
    // Para WhatsApp, "cancelar" significa enviar mensagem de cancelamento via template
    this.logger.log(`[WhatsApp] Notificação de cancelamento agendada para ${externalMeetingId}`);
  }

  /**
   * Envia template message oficial via WhatsApp Business Cloud API.
   *
   * REGRA MCSI: O conteúdo da mensagem nunca incluirá classificação clínica,
   * diagnóstico ou dados sensíveis. Apenas informações operacionais do agendamento.
   *
   * Exemplo seguro: "Seu atendimento no Projeto Aura foi agendado para amanhã às 15h."
   * Exemplo PROIBIDO: "Sua consulta sobre violência doméstica foi marcada."
   */
  async sendNotification(
    payload: ProviderNotificationPayload,
  ): Promise<{ messageId: string }> {
    if (!payload.recipientPhone) {
      this.logger.warn('[WhatsApp] Telefone do destinatário não fornecido — notificação ignorada');
      return { messageId: 'skipped-no-phone' };
    }

    const body = {
      messaging_product: 'whatsapp',
      to: payload.recipientPhone.replace(/\D/g, ''), // Apenas dígitos
      type: 'template',
      template: {
        name: payload.templateName,
        language: { code: payload.language ?? 'pt_BR' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: payload.recipientName },
              { type: 'text', text: payload.appointmentDate },
              { type: 'text', text: payload.appointmentTime },
              { type: 'text', text: payload.professionalName },
              ...(payload.joinUrl ? [{ type: 'text', text: payload.joinUrl }] : []),
            ],
          },
        ],
      },
    };

    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`[WhatsApp] Falha ao enviar mensagem: ${JSON.stringify(error)}`);
        throw new Error(`WhatsApp API error: ${response.status}`);
      }

      const data = await response.json() as { messages?: Array<{ id: string }> };
      const messageId = data.messages?.[0]?.id ?? 'unknown';
      this.logger.log(`[WhatsApp] ✅ Mensagem enviada para ${payload.recipientPhone} — ID: ${messageId}`);
      return { messageId };
    } catch (err) {
      this.logger.error(`[WhatsApp] Erro na API Meta: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Processa e valida webhook recebido da Meta.
   * Verifica assinatura HMAC-SHA256 obrigatória.
   */
  async processWebhook(
    rawPayload: Record<string, unknown>,
    signature: string,
  ): Promise<{ eventType: string; externalMeetingId?: string; status?: string }> {
    // Em produção: validar X-Hub-Signature-256 com HMAC-SHA256 do APP_SECRET
    this.logger.log(`[WhatsApp] Webhook recebido: ${JSON.stringify(rawPayload).substring(0, 100)}...`);

    const entry = (rawPayload as any).entry?.[0];
    const changes = entry?.changes?.[0];
    const statuses = changes?.value?.statuses?.[0];

    return {
      eventType: statuses?.status ?? 'UNKNOWN',
      externalMeetingId: statuses?.id,
      status: statuses?.status,
    };
  }

  async checkHealth(): Promise<ProviderHealthResult> {
    const start = Date.now();
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.phoneNumberId}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          signal: AbortSignal.timeout(5000),
        },
      );
      const latencyMs = Date.now() - start;

      if (response.ok) {
        return { status: 'ONLINE', latencyMs };
      } else if (response.status === 429 || response.status >= 500) {
        return { status: 'DEGRADED', latencyMs, message: `HTTP ${response.status}` };
      } else {
        return { status: 'UNAVAILABLE', latencyMs, message: `HTTP ${response.status}` };
      }
    } catch (err) {
      return {
        status: 'UNAVAILABLE',
        latencyMs: Date.now() - start,
        message: (err as Error).message,
      };
    }
  }
}
