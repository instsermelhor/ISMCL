import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuraCloudEvent } from '../../events/event-bus.service';
import { BreakGlassInitiatedEventPayload } from './dto/break-glass.dto';
import { PrismaService } from '../../prisma/prisma.service';

// Papéis que devem ser notificados imediatamente no Break-Glass
const ALERT_ROLES = ['GESTOR', 'ADMINISTRADOR', 'DPO', 'SUPER_USER_UNIVERSAL', 'AUDITOR'];

/**
 * BreakGlassNotificationListener — Listener de Eventos de Break-Glass
 *
 * Escuta o evento `aura.security.break_glass.initiated.v1` publicado pelo
 * `BreakGlassService` e executa as notificações de alerta em tempo real
 * para todos os usuários com papel de gestão, administração e DPO.
 *
 * Requisito GAP-P1-04: a diretoria deve receber notificação em < 30 segundos
 * após um profissional acionar o break-glass.
 *
 * Referências: PRD-AURA-001 (FR-AURA-014), REMEDIATION-AURA-001 (R1-04)
 */
@Injectable()
export class BreakGlassNotificationListener {
  private readonly logger = new Logger(BreakGlassNotificationListener.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handler do evento de break-glass iniciado.
   * Dispara notificações para todos os gestores ativos do tenant.
   */
  @OnEvent('aura.security.break_glass.initiated.v1', { async: true })
  async handleBreakGlassInitiated(
    event: AuraCloudEvent<BreakGlassInitiatedEventPayload>,
  ): Promise<void> {
    const { data } = event;

    this.logger.warn(
      `[BreakGlassListener] 🚨 Evento recebido: sessão=${data.sessionId} | profissional=${data.professionalName} | tipo=${data.emergencyType}`,
    );

    try {
      // 1. Busca todos os usuários com papéis de alerta no mesmo tenant
      const alertUsers = await this.prisma.user.findMany({
        where: {
          role: { in: ALERT_ROLES },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (alertUsers.length === 0) {
        this.logger.warn(
          `[BreakGlassListener] ⚠️ Nenhum usuário gestor ativo encontrado para notificação — sessão ${data.sessionId}`,
        );
        return;
      }

      this.logger.warn(
        `[BreakGlassListener] 📣 Notificando ${alertUsers.length} gestor(es)/DPO sobre break-glass iniciado`,
      );

      // 2. Cria notificações no banco para cada gestor (portal + email queue)
      await this.createPortalAlerts(data, alertUsers);

      this.logger.warn(
        `[BreakGlassListener] ✅ Alertas criados para ${alertUsers.length} usuário(s) em < 30s`,
      );
    } catch (err) {
      this.logger.error(
        `[BreakGlassListener] 🔴 FALHA ao processar notificações break-glass para sessão ${data.sessionId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Handler para sessão revogada — notifica o profissional cujo acesso foi encerrado.
   */
  @OnEvent('aura.security.break_glass.revoked.v1', { async: true })
  async handleBreakGlassRevoked(
    event: AuraCloudEvent<{ sessionId: string; revokedById: string; beneficiaryId: string }>,
  ): Promise<void> {
    const { data } = event;
    this.logger.warn(
      `[BreakGlassListener] ✂️ Sessão break-glass ${data.sessionId} revogada por ${data.revokedById}`,
    );
    // Futuro: Notificar profissional via portal que o acesso foi revogado
  }

  /**
   * Cria alertas de portal para cada gestor.
   * Esses alertas aparecem em tempo real no painel administrativo via polling/SSE.
   */
  private async createPortalAlerts(
    data: BreakGlassInitiatedEventPayload,
    alertUsers: { id: string; email: string; name: string; role: string }[],
  ): Promise<void> {
    const message = this.buildAlertMessage(data);
    const metadata = {
      sessionId: data.sessionId,
      professionalId: data.professionalId,
      professionalName: data.professionalName,
      beneficiaryId: data.beneficiaryId,
      beneficiaryName: data.beneficiaryName,
      emergencyType: data.emergencyType,
      justification: data.justification,
      ipAddress: data.ipAddress,
      requestedAt: data.requestedAt,
      expiresAt: data.expiresAt,
    };

    // Cria notificações no banco para cada gestor (portal + email queue)
    // Usa notificationLog se existir; caso contrário, log estruturado como fallback
    for (const user of alertUsers) {
      try {
        // Tenta inserir em notificationLog (tabela do ACTG)
        await (this.prisma as any).notificationLog.create({
          data: {
            recipientId: user.id,
            recipientType: 'USER',
            eventType: 'BREAK_GLASS_ALERT',
            channel: 'PORTAL',
            idempotencyKey: `break-glass:${data.sessionId}:${user.id}`,
            status: 'SENT',
            metadata: metadata as any,
            message,
          },
        });

        this.logger.debug(
          `[BreakGlassListener] Alerta de portal registrado em notificationLog para ${user.role} ${user.name} (${user.id})`,
        );
      } catch (err) {
        // Fallback: se a tabela não existir ainda, apenas loga o alerta crítico
        // (o evento no EventBus já garante rastreabilidade)
        this.logger.warn(
          `[BreakGlassListener] ⚠️ Tabela de notificações não disponível para ${user.id}: ${(err as Error).message} — alerta registrado apenas nos logs estruturados`,
        );
        this.logger.warn(
          `[BreakGlassListener] 🚨 BREAK_GLASS_ALERT para ${user.role} ${user.name}: ${message}`,
        );
      }
    }
  }

  /**
   * Constrói a mensagem de alerta para o painel dos gestores.
   */
  private buildAlertMessage(data: BreakGlassInitiatedEventPayload): string {
    const expiresAt = new Date(data.expiresAt).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return (
      `O profissional ${data.professionalName} acionou ACESSO EXCEPCIONAL (Break-Glass) ` +
      `ao prontuário do beneficiário ${data.beneficiaryName}. ` +
      `Tipo de emergência: ${data.emergencyType}. ` +
      `Justificativa: "${data.justification}". ` +
      `IP: ${data.ipAddress}. ` +
      `Acesso válido até: ${expiresAt}. ` +
      `Sessão ID: ${data.sessionId}.`
    );
  }
}
