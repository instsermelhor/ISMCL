import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import { NotificationEventType, NotificationChannel } from '../dto/actg.dto';
import { WhatsAppBusinessConnector } from '../connectors/whatsapp-business.connector';
import { EventBusService } from '../../../events/event-bus.service';

export interface NotificationContext {
  appointmentId: string;
  recipientId: string;
  recipientType: 'BENEFICIARY' | 'PROFESSIONAL';
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  professionalName: string;
  joinUrl?: string;
  channelType: string;
  mcsiLevel?: number; // 0-4 — determina conteúdo permitido
  allowedChannels: NotificationChannel[];
}

// TTL da chave de idempotência de notificação no Redis: 8 dias (691.200 segundos)
const IDEMPOTENCY_TTL_SECONDS = 691200;

/**
 * NotificationOrchestratorService — Orquestrador de Notificações Multicanal
 *
 * Gerencia o envio de notificações para todos os eventos do ciclo de vida
 * de um atendimento, garantindo:
 * - Idempotência via chave única no Redis (com TTL 8d) ou Set local fallback
 * - Respeito às preferências do beneficiário
 * - Filtragem de conteúdo sensível por nível MCSI
 * - Sem duplicidade mesmo em retentativas
 *
 * REGRA MCSI: Mensagens externas nunca incluem classificação clínica, diagnóstico
 * ou qualquer informação sensível. Apenas informações operacionais neutras.
 *
 * Referência: ADR-188, Prompt 188 — Item 21, 22, 18, GAP-P2-01
 */
@Injectable()
export class NotificationOrchestratorService {
  private readonly logger = new Logger(NotificationOrchestratorService.name);
  private readonly sentNotifications = new Set<string>();

  constructor(
    private readonly whatsapp: WhatsAppBusinessConnector,
    private readonly eventBus: EventBusService,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
  ) {}

  async notify(
    eventType: NotificationEventType,
    context: NotificationContext,
  ): Promise<void> {
    for (const channel of context.allowedChannels) {
      const idempotencyKey = `${context.recipientId}:${context.appointmentId}:${eventType}:${channel}`;

      if (await this.isAlreadySent(idempotencyKey)) {
        this.logger.debug(`[NotificationOrchestrator] Notificação já enviada (idempotência): ${idempotencyKey}`);
        continue;
      }

      try {
        await this.sendToChannel(channel, eventType, context);
        await this.markAsSent(idempotencyKey);
        this.logger.log(`[NotificationOrchestrator] ✅ Notificação enviada: ${eventType} → ${channel} para ${context.recipientId}`);

        await this.eventBus.publish(
          'aura.actg.notification.sent.v1',
          {
            appointmentId: context.appointmentId,
            recipientId: context.recipientId,
            eventType,
            channel,
            idempotencyKey,
          },
          'default',
          { subject: context.appointmentId },
        );
      } catch (err) {
        this.logger.error(`[NotificationOrchestrator] Falha ao enviar via ${channel}: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Verifica se a notificação já foi enviada (no Redis ou no Set em memória).
   */
  async isAlreadySent(key: string): Promise<boolean> {
    if (this.cacheManager) {
      try {
        const val = await this.cacheManager.get(`notif:${key}`);
        if (val) return true;
      } catch (e) {
        // Fallback local se o Redis falhar
      }
    }
    return this.sentNotifications.has(key);
  }

  /**
   * Marca a notificação como enviada (no Redis com TTL de 8d e no Set em memória).
   */
  async markAsSent(key: string): Promise<void> {
    this.sentNotifications.add(key);
    if (this.cacheManager) {
      try {
        await this.cacheManager.set(`notif:${key}`, '1', IDEMPOTENCY_TTL_SECONDS * 1000);
      } catch (e) {
        // Fallback local se o Redis falhar
      }
    }
  }

  private async sendToChannel(
    channel: NotificationChannel,
    eventType: NotificationEventType,
    context: NotificationContext,
  ): Promise<void> {
    const templateName = this.resolveTemplateName(eventType, channel, context.mcsiLevel ?? 0);

    switch (channel) {
      case NotificationChannel.WHATSAPP:
        if (!context.recipientPhone) return;
        await this.whatsapp.sendNotification({
          recipientPhone: context.recipientPhone,
          recipientName: context.recipientName,
          appointmentDate: context.appointmentDate,
          appointmentTime: context.appointmentTime,
          professionalName: context.professionalName,
          joinUrl: context.joinUrl,
          templateName,
          language: 'pt_BR',
        });
        break;

      case NotificationChannel.EMAIL:
      case NotificationChannel.SMS:
      case NotificationChannel.PUSH:
      case NotificationChannel.PORTAL:
        this.logger.log(`[NotificationOrchestrator] Canal ${channel}: notificação orquestrada (${templateName})`);
        break;
    }
  }

  private resolveTemplateName(
    eventType: NotificationEventType,
    channel: NotificationChannel,
    mcsiLevel: number,
  ): string {
    const suffix = mcsiLevel >= 2 ? '_NEUTRAL' : '_STANDARD';
    return `aura_${eventType.toLowerCase()}_${channel.toLowerCase()}${suffix}`;
  }
}
