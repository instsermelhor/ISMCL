import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import { NotificationEventType, NotificationChannel } from '../dto/actg.dto';
import { WhatsAppBusinessConnector } from '../connectors/whatsapp-business.connector';
import { EventBusService } from '../../../events/event-bus.service';
import { PushNotificationService } from './push-notification.service';

export interface NotificationContext {
  appointmentId: string;
  recipientId: string;
  recipientType: 'BENEFICIARY' | 'PROFESSIONAL';
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  /** Token FCM (Android/Web) ou APNs (iOS) do dispositivo do destinatário */
  deviceToken?: string;
  /** Plataforma do dispositivo para push notification */
  devicePlatform?: 'FCM' | 'APNS';
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
 * Limite máximo de entradas no fallback local.
 * Evita crescimento ilimitado de memória quando o Redis está indisponível
 * por períodos prolongados. Ao atingir o limite, entradas mais antigas são
 * descartadas (FIFO) para prevenir OOM.
 */
const MAX_LOCAL_FALLBACK_KEYS = 10_000;

/**
 * NotificationOrchestratorService — Orquestrador de Notificações Multicanal
 *
 * Gerencia o envio de notificações para todos os eventos do ciclo de vida
 * de um atendimento, garantindo:
 * - Idempotência via chave única no Redis (com TTL 8d) — fonte primária
 * - Fallback local em Set limitado (MAX_LOCAL_FALLBACK_KEYS) quando Redis indisponível
 * - Respeito às preferências do beneficiário
 * - Filtragem de conteúdo sensível por nível MCSI
 * - Sem duplicidade mesmo em retentativas e reinicializações (via Redis)
 *
 * REGRA MCSI: Mensagens externas nunca incluem classificação clínica, diagnóstico
 * ou qualquer informação sensível. Apenas informações operacionais neutras.
 *
 * Referência: ADR-188, Prompt 188 — Item 21, 22, 18, GAP-P2-01, GAP-P3-02
 */
@Injectable()
export class NotificationOrchestratorService {
  private readonly logger = new Logger(NotificationOrchestratorService.name);

  /**
   * Fallback local de idempotência — usado APENAS quando o Redis está indisponível.
   * É limitado a MAX_LOCAL_FALLBACK_KEYS entradas para prevenir crescimento ilimitado.
   * NÃO persiste entre reinicializações do processo — use Redis para durabilidade real.
   */
  private readonly localFallback = new Set<string>();

  constructor(
    private readonly whatsapp: WhatsAppBusinessConnector,
    private readonly eventBus: EventBusService,
    private readonly pushService: PushNotificationService,
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
   * Verifica se a notificação já foi enviada.
   *
   * Estratégia: Redis primário → fallback local (somente se Redis falhar).
   */
  async isAlreadySent(key: string): Promise<boolean> {
    if (this.cacheManager) {
      try {
        const val = await this.cacheManager.get(`notif:${key}`);
        if (val !== null && val !== undefined) return true;
        // Redis respondeu e não encontrou a chave — definitivamente não enviado
        return false;
      } catch (e) {
        this.logger.warn(
          `[NotificationOrchestrator] Redis indisponível ao verificar idempotência (${key}). Usando fallback local.`,
        );
      }
    }
    // Fallback: consulta o Set local (somente quando Redis está fora)
    return this.localFallback.has(key);
  }

  /**
   * Marca a notificação como enviada.
   *
   * Estratégia: Redis primário com TTL de 8 dias.
   * Se Redis falhar, registra no fallback local com limite de tamanho.
   */
  async markAsSent(key: string): Promise<void> {
    if (this.cacheManager) {
      try {
        await this.cacheManager.set(`notif:${key}`, '1', IDEMPOTENCY_TTL_SECONDS * 1000);
        // Redis bem-sucedido — NÃO popula o fallback local (evita duplo consumo de memória)
        return;
      } catch (e) {
        this.logger.warn(
          `[NotificationOrchestrator] Redis indisponível ao marcar idempotência (${key}). Usando fallback local.`,
        );
      }
    }
    // Fallback local: limita o tamanho para evitar OOM
    if (this.localFallback.size >= MAX_LOCAL_FALLBACK_KEYS) {
      const oldest = this.localFallback.values().next().value;
      if (oldest) this.localFallback.delete(oldest);
    }
    this.localFallback.add(key);
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
      case NotificationChannel.PORTAL:
        this.logger.log(`[NotificationOrchestrator] Canal ${channel}: notificação orquestrada (${templateName})`);
        break;

      case NotificationChannel.PUSH: {
        if (!context.deviceToken) {
          this.logger.warn(`[NotificationOrchestrator] Canal PUSH: deviceToken ausente para ${context.recipientId}`);
          break;
        }
        const pushResult = await this.pushService.send({
          deviceToken: context.deviceToken,
          platform: context.devicePlatform ?? 'FCM',
          title: 'Aura — Lembrete de Consulta',
          body: `Sua consulta está agendada para ${context.appointmentDate} às ${context.appointmentTime}.`,
          data: {
            appointmentId: context.appointmentId,
            templateName,
            joinUrl: context.joinUrl ?? '',
          },
          collapseKey: `appt:${context.appointmentId}`,
        });
        this.logger.log(
          `[NotificationOrchestrator] PUSH ${pushResult.success ? '✅' : '⚠️ (degradado)'}: ` +
          `messageId=${pushResult.messageId ?? 'N/A'} — ${context.recipientId}`,
        );
        break;
      }
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
