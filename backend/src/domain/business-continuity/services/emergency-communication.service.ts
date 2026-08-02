import { Injectable, Logger } from '@nestjs/common';
import {
  SendEmergencyNotificationDto,
  CommunicationChannel,
  IncidentSeverity,
} from '../dto/business-continuity.dto';
import { ContinuityAuditService } from './continuity-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface EmergencyNotification {
  notificationId: string;
  crisisId: string;
  message: string;
  channels: CommunicationChannel[];
  recipients: string[];
  priority: IncidentSeverity;
  sentAt: string;
  deliveryStatus: Record<CommunicationChannel, 'SENT' | 'DELIVERED' | 'FAILED'>;
  confirmations: Array<{ recipient: string; confirmedAt: string; channel: CommunicationChannel }>;
  sentBy: string;
}

/**
 * EmergencyCommunicationService — P169 BCORP
 *
 * Comunicação de emergência multicanal: e-mail, SMS, WhatsApp Business,
 * push, portal administrativo e painéis executivos.
 * Controla confirmação de recebimento e rastreabilidade por canal.
 */
@Injectable()
export class EmergencyCommunicationService {
  private readonly logger = new Logger(EmergencyCommunicationService.name);
  private readonly notifications: Map<string, EmergencyNotification> = new Map();

  /** Destinatários padrão por canal se não especificado */
  private readonly DEFAULT_RECIPIENTS: Record<CommunicationChannel, string[]> = {
    [CommunicationChannel.EMAIL]: ['diretoria@sermelhor.org.br', 'ti@sermelhor.org.br'],
    [CommunicationChannel.SMS]: ['+5511999000001'],
    [CommunicationChannel.WHATSAPP]: ['+5511999000002'],
    [CommunicationChannel.PUSH]: ['all_staff'],
    [CommunicationChannel.PORTAL]: ['admin_users'],
    [CommunicationChannel.EXECUTIVE_PANEL]: ['board_members'],
  };

  constructor(
    private readonly auditSvc: ContinuityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async sendNotification(dto: SendEmergencyNotificationDto, sentBy = 'SYSTEM'): Promise<EmergencyNotification> {
    const notificationId = `EMRG-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const recipients = dto.recipients ?? dto.channels.flatMap((c) => this.DEFAULT_RECIPIENTS[c]);
    const deliveryStatus: Record<CommunicationChannel, 'SENT' | 'DELIVERED' | 'FAILED'> = {} as any;

    for (const channel of dto.channels) {
      deliveryStatus[channel] = await this.dispatchToChannel(channel, dto.message, dto.priority ?? IncidentSeverity.P2_HIGH);
    }

    const notification: EmergencyNotification = {
      notificationId,
      crisisId: dto.crisisId,
      message: dto.message,
      channels: dto.channels,
      recipients,
      priority: dto.priority ?? IncidentSeverity.P2_HIGH,
      sentAt: now,
      deliveryStatus,
      confirmations: [],
      sentBy,
    };

    this.notifications.set(notificationId, notification);

    await this.auditSvc.recordAudit('EMERGENCY_NOTIFICATION_SENT', notificationId, sentBy, {
      crisisId: dto.crisisId,
      channels: dto.channels,
      recipientCount: recipients.length,
      priority: dto.priority,
    });

    await this.eventBus.publish(
      'aura.bcorp.emergency.communication.sent.v1',
      { notificationId, crisisId: dto.crisisId, channels: dto.channels, priority: dto.priority },
      'BCORP',
      { subject: notificationId },
    );

    this.logger.log(
      `[EmergencyCommunication] Notificação "${notificationId}" enviada via [${dto.channels.join(', ')}] — ${recipients.length} destinatários.`,
    );
    return notification;
  }

  async recordConfirmation(notificationId: string, recipient: string, channel: CommunicationChannel): Promise<void> {
    const notification = this.getOrThrow(notificationId);
    notification.deliveryStatus[channel] = 'DELIVERED';
    notification.confirmations.push({ recipient, confirmedAt: new Date().toISOString(), channel });

    await this.auditSvc.recordAudit('NOTIFICATION_CONFIRMED', notificationId, recipient, { channel });
    this.logger.log(`[EmergencyCommunication] Confirmação recebida: "${notificationId}" por ${recipient} via ${channel}.`);
  }

  getNotification(notificationId: string): EmergencyNotification | undefined {
    return this.notifications.get(notificationId);
  }

  listNotifications(crisisId?: string): EmergencyNotification[] {
    const all = Array.from(this.notifications.values());
    return crisisId ? all.filter((n) => n.crisisId === crisisId) : all;
  }

  getDeliveryStats(notificationId: string): Record<string, number> {
    const n = this.getOrThrow(notificationId);
    const stats: Record<string, number> = { SENT: 0, DELIVERED: 0, FAILED: 0 };
    for (const status of Object.values(n.deliveryStatus)) stats[status]++;
    return stats;
  }

  private async dispatchToChannel(
    channel: CommunicationChannel,
    message: string,
    priority: IncidentSeverity,
  ): Promise<'SENT' | 'DELIVERED' | 'FAILED'> {
    // Simula envio multicanal — em produção integraria provedores reais
    this.logger.debug(`[EmergencyCommunication] Enviando via ${channel} (${priority}): ${message.substring(0, 50)}...`);
    return 'SENT';
  }

  private getOrThrow(notificationId: string): EmergencyNotification {
    const n = this.notifications.get(notificationId);
    if (!n) throw new Error(`Notificação "${notificationId}" não encontrada.`);
    return n;
  }
}
