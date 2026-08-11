import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationOrchestratorService, NotificationContext } from './notification-orchestrator.service';
import { NotificationEventType, NotificationChannel } from '../dto/actg.dto';

export interface ReminderProcessingResult {
  processedCount: number;
  remindersSent: {
    appointmentId: string;
    eventType: NotificationEventType;
    recipientId: string;
  }[];
}

/**
 * ReminderSchedulerService — Scheduler de Lembretes Automáticos ACTG
 *
 * Executa periodicamente via Cron para buscar agendamentos em janelas de tempo
 * configuradas e disparar notificações de lembrete via NotificationOrchestratorService.
 *
 * Janelas de disparo:
 * - 7 dias antes (REMINDER_7D)
 * - 24 horas antes (REMINDER_24H)
 * - 2 horas antes (REMINDER_2H)
 * - 30 minutos antes (REMINDER_30MIN)
 *
 * A idempotência é garantida pelo NotificationOrchestratorService (Redis TTL 8d).
 *
 * Referências: ADR-188, PRD-AURA-001 (FR-AURA-030), REMEDIATION-AURA-001 (R2-01)
 */
@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationOrchestrator: NotificationOrchestratorService,
  ) {}

  /**
   * Cron Job executado a cada hora para processar todas as janelas de lembrete.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyReminders(): Promise<void> {
    this.logger.log('[ReminderScheduler] ⏰ Iniciando verificação de lembretes automáticos ACTG...');
    try {
      const result = await this.processRemindersWindow();
      this.logger.log(
        `[ReminderScheduler] ✅ Verificação concluída. ${result.processedCount} lembrete(s) processado(s).`,
      );
    } catch (err) {
      this.logger.error(
        `[ReminderScheduler] 🔴 Erro ao processar lembretes: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Processa todas as 4 janelas de lembrete e dispara as notificações devidas.
   * Pode ser chamado diretamente por controladores ou testes.
   */
  async processRemindersWindow(now: Date = new Date()): Promise<ReminderProcessingResult> {
    const windows = [
      {
        eventType: NotificationEventType.REMINDER_7D,
        startMs: 168 * 60 * 60 * 1000,      // 7 dias
        endMs: (168 + 1) * 60 * 60 * 1000,  // 7 dias + 1 hora
      },
      {
        eventType: NotificationEventType.REMINDER_24H,
        startMs: 24 * 60 * 60 * 1000,       // 24 horas
        endMs: 25 * 60 * 60 * 1000,         // 25 horas
      },
      {
        eventType: NotificationEventType.REMINDER_2H,
        startMs: 2 * 60 * 60 * 1000,        // 2 horas
        endMs: 3 * 60 * 60 * 1000,          // 3 horas
      },
      {
        eventType: NotificationEventType.REMINDER_30MIN,
        startMs: 30 * 60 * 1000,            // 30 minutos
        endMs: 60 * 60 * 1000,              // 60 minutos
      },
    ];

    const sentList: { appointmentId: string; eventType: NotificationEventType; recipientId: string }[] = [];

    for (const w of windows) {
      const windowStart = new Date(now.getTime() + w.startMs);
      const windowEnd = new Date(now.getTime() + w.endMs);

      // Busca agendamentos ativos na janela de tempo
      const appointments = await this.prisma.appointment.findMany({
        where: {
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          scheduledStart: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
        include: {
          beneficiary: true,
          professional: true,
        },
      });

      for (const appt of appointments) {
        if (!appt.beneficiaryId || !appt.beneficiary) continue;

        const appointmentDate = appt.scheduledStart.toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        });
        const appointmentTime = appt.scheduledStart.toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
        });

        const context: NotificationContext = {
          appointmentId: appt.id,
          recipientId: appt.beneficiary.id,
          recipientType: 'BENEFICIARY',
          recipientName: appt.beneficiary.fullName,
          recipientPhone: (appt.beneficiary as any).phone ?? undefined,
          recipientEmail: (appt.beneficiary as any).email ?? undefined,
          appointmentDate,
          appointmentTime,
          professionalName: appt.professional?.fullName ?? 'Profissional Aura',
          joinUrl: appt.meetingLink ?? undefined,
          channelType: appt.channelType ?? 'ONLINE',
          mcsiLevel: 0,
          allowedChannels: [
            NotificationChannel.WHATSAPP,
            NotificationChannel.EMAIL,
            NotificationChannel.PORTAL,
          ],
        };

        await this.notificationOrchestrator.notify(w.eventType, context);
        sentList.push({
          appointmentId: appt.id,
          eventType: w.eventType,
          recipientId: appt.beneficiary.id,
        });
      }
    }

    return {
      processedCount: sentList.length,
      remindersSent: sentList,
    };
  }
}
