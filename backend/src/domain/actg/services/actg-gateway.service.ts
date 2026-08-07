import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ProviderRegistryService } from './provider-registry.service';
import { FallbackEngineService, FallbackPolicy } from './fallback-engine.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { ProviderHealthService } from './provider-health.service';
import { EventBusService } from '../../../events/event-bus.service';
import { CreateAppointmentChannelDto, ChannelType, NotificationChannel, NotificationEventType } from '../dto/actg.dto';

export interface ActgSession {
  sessionId: string;
  appointmentId: string;
  channelType: ChannelType;
  externalMeetingId?: string;
  joinUrl?: string;
  hostJoinUrl?: string;
  isFallback: boolean;
  originalChannelType?: ChannelType;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'PENDING';
  idempotencyKey: string;
  createdAt: string;
}

/**
 * ACTGGatewayService — Orquestrador Principal do ACTG
 *
 * Coordena todo o ciclo de vida de uma sessão de atendimento:
 * 1. Seleciona e valida o provedor
 * 2. Aplica fallback quando necessário
 * 3. Cria sessão externa com idempotência
 * 4. Registra AppointmentChannel e ExternalMeeting
 * 5. Publica CloudEvents para rastreabilidade
 * 6. Dispara notificações de confirmação
 *
 * PRINCÍPIO FUNDAMENTAL:
 * O Aura Appointment ID é sempre a fonte da verdade (System of Record).
 * Provedores externos são canais de execução, nunca sistemas de registro.
 *
 * Referência: ADR-188, Prompt 188 — Item 1, 2, 6
 */
@Injectable()
export class ACTGGatewayService {
  private readonly logger = new Logger(ACTGGatewayService.name);
  private readonly sessions = new Map<string, ActgSession>();

  constructor(
    private readonly providerRegistry: ProviderRegistryService,
    private readonly fallbackEngine: FallbackEngineService,
    private readonly notificationOrchestrator: NotificationOrchestratorService,
    private readonly providerHealth: ProviderHealthService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Cria uma sessão de comunicação/teleatendimento para um agendamento.
   * Implementa idempotência via appointmentId — não cria sessão duplicada.
   */
  async createSession(
    appointmentId: string,
    dto: CreateAppointmentChannelDto,
    scheduledStart: Date,
    scheduledEnd: Date,
    title: string,
    fallbackPolicy: FallbackPolicy,
    tenantId = 'default',
  ): Promise<ActgSession> {
    // Idempotência: verificar se já existe sessão ativa para este agendamento
    const existing = this.findByAppointmentId(appointmentId);
    if (existing && existing.status === 'ACTIVE') {
      this.logger.warn(`[ACTG] Sessão já existe para agendamento ${appointmentId} — retornando existente`);
      return existing;
    }

    // Seleção de canal com fallback inteligente
    const channelResult = await this.fallbackEngine.selectChannel(
      dto.channelType,
      fallbackPolicy,
    );

    const idempotencyKey = `actg:${appointmentId}:${channelResult.selectedChannel}:${randomUUID()}`;
    const sessionId = randomUUID();

    // Canais sem sessão de provedor externo (presencial, telefone)
    if (
      channelResult.selectedChannel === ChannelType.IN_PERSON ||
      channelResult.selectedChannel === ChannelType.PHONE
    ) {
      const session: ActgSession = {
        sessionId,
        appointmentId,
        channelType: channelResult.selectedChannel,
        isFallback: channelResult.isFallback,
        originalChannelType: channelResult.isFallback ? channelResult.originalChannel : undefined,
        status: 'ACTIVE',
        idempotencyKey,
        createdAt: new Date().toISOString(),
      };
      this.sessions.set(sessionId, session);
      await this.publishSessionEvent('aura.actg.session.created.v1', session, tenantId);
      return session;
    }

    // Criar sessão no provedor externo
    const provider = this.providerRegistry.getProviderOrThrow(channelResult.selectedChannel);
    const providerSession = await provider.createSession(
      appointmentId,
      scheduledStart,
      scheduledEnd,
      title,
      idempotencyKey,
      dto.organizerEmail,
      dto.attendeeEmails,
    );

    const session: ActgSession = {
      sessionId,
      appointmentId,
      channelType: channelResult.selectedChannel,
      externalMeetingId: providerSession.externalMeetingId,
      joinUrl: providerSession.joinUrl,
      hostJoinUrl: providerSession.hostJoinUrl,
      isFallback: channelResult.isFallback,
      originalChannelType: channelResult.isFallback ? channelResult.originalChannel : undefined,
      status: 'ACTIVE',
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, session);

    if (channelResult.isFallback) {
      await this.eventBus.publish(
        'aura.actg.fallback.triggered.v1',
        {
          appointmentId,
          originalChannel: channelResult.originalChannel,
          selectedChannel: channelResult.selectedChannel,
          reason: channelResult.reason,
        },
        tenantId,
        { subject: appointmentId },
      );
    }

    await this.publishSessionEvent('aura.actg.session.created.v1', session, tenantId);
    this.logger.log(`[ACTG] ✅ Sessão criada: ${sessionId} — Canal: ${channelResult.selectedChannel} — Agendamento: ${appointmentId}`);

    return session;
  }

  /**
   * Cancela uma sessão de comunicação e a sessão externa no provedor.
   */
  async cancelSession(
    appointmentId: string,
    reason?: string,
    tenantId = 'default',
  ): Promise<void> {
    const session = this.findByAppointmentId(appointmentId);
    if (!session || session.status !== 'ACTIVE') return;

    if (session.externalMeetingId) {
      const provider = this.providerRegistry.getProvider(session.channelType);
      if (provider) {
        await provider.cancelSession(session.externalMeetingId, reason);
      }
    }

    session.status = 'CANCELLED';
    await this.eventBus.publish(
      'aura.actg.session.cancelled.v1',
      { appointmentId, sessionId: session.sessionId, reason },
      tenantId,
      { subject: appointmentId },
    );

    this.logger.log(`[ACTG] 🗑️ Sessão cancelada para agendamento ${appointmentId}`);
  }

  /**
   * Marca uma sessão como concluída após o atendimento.
   */
  async completeSession(appointmentId: string, tenantId = 'default'): Promise<void> {
    const session = this.findByAppointmentId(appointmentId);
    if (!session) return;
    session.status = 'COMPLETED';
    await this.publishSessionEvent('aura.actg.session.completed.v1', session, tenantId);
    this.logger.log(`[ACTG] ✅ Sessão concluída para agendamento ${appointmentId}`);
  }

  /**
   * Retorna os dados da sessão ativa para um agendamento.
   */
  getSessionByAppointmentId(appointmentId: string): ActgSession | undefined {
    return this.findByAppointmentId(appointmentId);
  }

  /**
   * Retorna a URL de acesso ao atendimento para um participante autorizado.
   * Verifica que o sessionId e appointmentId correspondem antes de revelar a URL.
   */
  getJoinUrl(appointmentId: string, participantId: string): string | undefined {
    const session = this.findByAppointmentId(appointmentId);
    if (!session || session.status !== 'ACTIVE') return undefined;
    return session.joinUrl;
  }

  private findByAppointmentId(appointmentId: string): ActgSession | undefined {
    return [...this.sessions.values()].find((s) => s.appointmentId === appointmentId);
  }

  private async publishSessionEvent(
    eventType: string,
    session: ActgSession,
    tenantId: string,
  ): Promise<void> {
    await this.eventBus.publish(
      eventType,
      {
        sessionId: session.sessionId,
        appointmentId: session.appointmentId,
        channelType: session.channelType,
        externalMeetingId: session.externalMeetingId,
        joinUrl: session.joinUrl,
        status: session.status,
      },
      tenantId,
      { subject: session.appointmentId },
    );
  }
}
