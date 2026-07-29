import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationChannel } from '../dto/scheduling.dto';
import { EventBusService } from '../../../events/event-bus.service';

export type NotificationType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'REMINDER_24H'
  | 'REMINDER_1H'
  | 'ROOM_READY'
  | 'POST_CARE_INSTRUCTIONS';

export interface NotificationRecord {
  notificationId: string;
  recipientId: string;
  type: NotificationType;
  channel: NotificationChannel;
  message: string;
  sentAt: string;
  delivered: boolean;
}

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  [NotificationChannel.EMAIL]: '📧 E-mail',
  [NotificationChannel.SMS]: '📱 SMS',
  [NotificationChannel.WHATSAPP]: '💬 WhatsApp Business API',
  [NotificationChannel.PUSH]: '🔔 Push Notification',
  [NotificationChannel.PORTAL]: '🏛️ Portal Institucional',
};

/**
 * NotificationService — Serviço Inteligente de Notificações e Lembretes Multicanal
 *
 * Envia automaticamente notificações sobre agendamentos, lembretes, alterações,
 * cancelamentos, convites para teleconsulta e orientações pós-atendimento pelos
 * canais institucionais configurados (WhatsApp Business API, E-mail, Push, SMS, Portal).
 *
 * Referências: P110 (AEWBPM), P137 AISTCOP Etapas 8
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly sentLog: NotificationRecord[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Envia uma notificação para o destinatário em um ou mais canais.
   */
  async send(
    recipientId: string,
    type: NotificationType,
    channels: NotificationChannel[],
    messageBody: string,
    tenantId = 'default',
  ): Promise<NotificationRecord[]> {
    const records: NotificationRecord[] = [];

    for (const channel of channels) {
      const notificationId = randomUUID();
      const sentAt = new Date().toISOString();

      this.logger.log(
        `[Notifications] ${CHANNEL_LABELS[channel]} → ${type} para ${recipientId} | ${messageBody.substring(0, 80)}`,
      );

      const record: NotificationRecord = {
        notificationId,
        recipientId,
        type,
        channel,
        message: messageBody,
        sentAt,
        delivered: true, // Em produção: webhook de entrega do provedor
      };

      this.sentLog.push(record);
      records.push(record);
    }

    await this.eventBus.publish(
      'aura.scheduling.notification.sent.v1',
      { recipientId, type, channels, sentAt: new Date().toISOString() },
      tenantId,
      { subject: recipientId },
    );

    return records;
  }

  /**
   * Envia lembrete de consulta (24h ou 1h de antecedência).
   */
  async sendReminder(
    recipientId: string,
    professionalName: string,
    scheduledAt: string,
    hoursAhead: 24 | 1,
    joinUrl?: string,
    tenantId = 'default',
  ): Promise<void> {
    const type: NotificationType = hoursAhead === 24 ? 'REMINDER_24H' : 'REMINDER_1H';
    const teleMsg = joinUrl ? `\n🔗 Link de acesso: ${joinUrl}` : '';
    const message =
      `⏰ Lembrete Aura: você tem um atendimento com ${professionalName} ` +
      `em ${new Date(scheduledAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.` +
      teleMsg;

    await this.send(recipientId, type, [NotificationChannel.WHATSAPP, NotificationChannel.EMAIL], message, tenantId);
  }

  getSentLog(): NotificationRecord[] {
    return [...this.sentLog];
  }
}
