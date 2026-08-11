import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EventBusService } from '../../events/event-bus.service';
import {
  RequestBreakGlassDto,
  BreakGlassInitiatedEventPayload,
  BreakGlassStatus,
  BreakGlassSessionResponseDto,
} from './dto/break-glass.dto';

// Janela padrão de acesso Break-Glass: 4 horas
const BREAK_GLASS_WINDOW_HOURS = 4;
const BREAK_GLASS_EVENT = 'aura.security.break_glass.initiated.v1';

/**
 * BreakGlassService — Serviço de Acesso Excepcional de Emergência
 *
 * Implementa o fluxo completo de Break-Glass da Plataforma Aura (GAP-P1-04):
 *
 * 1. Um profissional solicita acesso a um beneficiário MCSI Nível 4
 *    com justificativa clínica e tipo de emergência.
 * 2. O sistema cria uma `BreakGlassSession` com status PENDING.
 * 3. Aprova automaticamente (< 30 segundos) se não houver politica de aprovação manual.
 * 4. Publica o evento `aura.security.break_glass.initiated.v1` no EventBus.
 * 5. Registra o acesso imutavelmente no `SecurityAuditLog` com hash chain (GAP-P1-03).
 * 6. A janela expira automaticamente após 4 horas (verificada na extensão Prisma GAP-P1-01).
 *
 * Referências: PRD-AURA-001 (FR-AURA-014), REMEDIATION-AURA-001 (R1-04), GAP-P1-01/03/04
 */
@Injectable()
export class BreakGlassService {
  private readonly logger = new Logger(BreakGlassService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Solicita e concede automaticamente uma sessão Break-Glass.
   *
   * @param professionalId - ID do profissional solicitante (do JWT)
   * @param dto - Dados da solicitação (beneficiário, justificativa, tipo)
   * @param ipAddress - IP da requisição
   * @param userAgent - User-Agent da requisição
   * @param tenantId - ID do tenant (default: 'default')
   * @returns Sessão ativa com janela de expiração
   */
  async requestAccess(
    professionalId: string,
    dto: RequestBreakGlassDto,
    ipAddress: string,
    userAgent: string,
    tenantId = 'default',
  ): Promise<BreakGlassSessionResponseDto> {
    this.logger.warn(
      `[BreakGlass] 🚨 SOLICITAÇÃO DE ACESSO EXCEPCIONAL: professionalId=${professionalId} beneficiaryId=${dto.beneficiaryId} tipo=${dto.emergencyType}`,
    );

    // 1. Verifica se o beneficiário existe
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { id: dto.beneficiaryId },
      select: { id: true, fullName: true },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiário não encontrado.');
    }

    // 2. Verifica se o profissional existe
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      select: { id: true, fullName: true },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    // 3. Verifica se já existe sessão ACTIVE para o mesmo par profissional/beneficiário
    const existingActive = await this.prisma.breakGlassSession.findFirst({
      where: {
        professionalId,
        beneficiaryId: dto.beneficiaryId,
        status: BreakGlassStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingActive) {
      this.logger.warn(
        `[BreakGlass] Sessão já ativa encontrada: ${existingActive.id} — reutilizando`,
      );
      return this.toResponseDto(existingActive);
    }

    // 4. Define janela de expiração (4 horas a partir de agora)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + BREAK_GLASS_WINDOW_HOURS * 60 * 60 * 1000);

    // 5. Cria a sessão Break-Glass no banco
    const session = await this.prisma.breakGlassSession.create({
      data: {
        professionalId,
        professionalName: professional.fullName,
        beneficiaryId: dto.beneficiaryId,
        beneficiaryName: beneficiary.fullName,
        justification: dto.justification,
        emergencyType: dto.emergencyType,
        status: BreakGlassStatus.PENDING,
        ipAddress,
        userAgent,
        tenantId,
        expiresAt,
      },
    });

    // 6. Registra no AuditLog imutável (GAP-P1-03)
    let auditLogId: string | null = null;
    try {
      auditLogId = await this.auditService.log({
        actorId: professionalId,
        actorName: professional.fullName,
        role: 'PROFISSIONAL',
        action: 'BREAK_GLASS_OVERRIDE',
        targetEntity: 'BENEFICIARY',
        targetEntityId: dto.beneficiaryId,
        justification: `[${dto.emergencyType}] ${dto.justification}`,
        ipAddress,
        userAgent,
      });
    } catch (auditError) {
      // Log de auditoria falhou mas não bloqueia o break-glass (será alertado no log)
      this.logger.error(
        `[BreakGlass] FALHA ao gravar AuditLog para sessão ${session.id}: ${(auditError as Error).message}`,
      );
    }

    // 7. Aprova automaticamente e atualiza a sessão
    const approvedSession = await this.prisma.breakGlassSession.update({
      where: { id: session.id },
      data: {
        status: BreakGlassStatus.ACTIVE,
        approvedAt: new Date(),
        auditLogId,
      },
    });

    // 8. Publica o evento CloudEvent no EventBus para notificar gestores
    const eventPayload: BreakGlassInitiatedEventPayload = {
      sessionId: approvedSession.id,
      professionalId,
      professionalName: professional.fullName,
      beneficiaryId: dto.beneficiaryId,
      beneficiaryName: beneficiary.fullName,
      justification: dto.justification,
      emergencyType: dto.emergencyType,
      ipAddress,
      requestedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      tenantId,
    };

    try {
      await this.eventBus.publish(BREAK_GLASS_EVENT, eventPayload, tenantId, {
        subject: dto.beneficiaryId,
        correlationId: approvedSession.id,
      });

      // Atualiza o timestamp de envio da notificação
      await this.prisma.breakGlassSession.update({
        where: { id: approvedSession.id },
        data: { notificationSentAt: new Date() },
      });

      this.logger.warn(
        `[BreakGlass] ✅ Sessão ativa: ${approvedSession.id} | Evento publicado: ${BREAK_GLASS_EVENT}`,
      );
    } catch (eventError) {
      // Falha no evento não reverte o acesso — mas gera alerta crítico no log
      this.logger.error(
        `[BreakGlass] 🔴 FALHA CRÍTICA ao publicar evento break-glass para sessão ${approvedSession.id}: ${(eventError as Error).message}`,
      );
    }

    return this.toResponseDto(approvedSession);
  }

  /**
   * Revoga manualmente uma sessão Break-Glass ativa.
   * Pode ser chamado por GESTOR, ADMINISTRADOR ou DPO.
   *
   * @param sessionId - ID da sessão a revogar
   * @param revokedById - User.id do revogador
   * @param ipAddress - IP da requisição
   * @param userAgent - User-Agent da requisição
   */
  async revokeSession(
    sessionId: string,
    revokedById: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const session = await this.prisma.breakGlassSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Sessão Break-Glass ${sessionId} não encontrada.`);
    }

    if (session.status !== BreakGlassStatus.ACTIVE) {
      throw new BadRequestException(
        `Sessão ${sessionId} não está ativa (status atual: ${session.status}).`,
      );
    }

    await this.prisma.breakGlassSession.update({
      where: { id: sessionId },
      data: {
        status: BreakGlassStatus.REVOKED,
        revokedAt: new Date(),
        revokedById,
      },
    });

    // Auditoria da revogação
    await this.auditService.log({
      actorId: revokedById,
      action: 'BREAK_GLASS_REVOKED',
      targetEntity: 'BREAK_GLASS_SESSION',
      targetEntityId: sessionId,
      justification: `Sessão break-glass revogada manualmente pelo usuário ${revokedById}`,
      ipAddress,
      userAgent,
    });

    await this.eventBus.publish(
      'aura.security.break_glass.revoked.v1',
      { sessionId, revokedById, beneficiaryId: session.beneficiaryId },
      session.tenantId,
      { subject: session.beneficiaryId, correlationId: sessionId },
    );

    this.logger.warn(`[BreakGlass] Sessão ${sessionId} REVOGADA por ${revokedById}`);
  }

  /**
   * Verifica se um profissional possui sessão Break-Glass ativa para um beneficiário.
   * Usado pela extensão Prisma (GAP-P1-01) para liberar acesso MCSI-4.
   */
  async hasActiveSession(professionalId: string, beneficiaryId: string): Promise<boolean> {
    const session = await this.prisma.breakGlassSession.findFirst({
      where: {
        professionalId,
        beneficiaryId,
        status: BreakGlassStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    return session !== null;
  }

  /**
   * Retorna o histórico de sessões Break-Glass de um beneficiário (para auditoria).
   */
  async getSessionHistory(beneficiaryId: string): Promise<BreakGlassSessionResponseDto[]> {
    const sessions = await this.prisma.breakGlassSession.findMany({
      where: { beneficiaryId },
      orderBy: { requestedAt: 'desc' },
    });
    return sessions.map((s) => this.toResponseDto(s));
  }

  /**
   * Expira sessões vencidas em batch (chamado por scheduled task).
   * Retorna a quantidade de sessões expiradas.
   */
  async expireStaleSessions(): Promise<number> {
    const result = await this.prisma.breakGlassSession.updateMany({
      where: {
        status: BreakGlassStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
      data: { status: BreakGlassStatus.EXPIRED },
    });

    if (result.count > 0) {
      this.logger.log(`[BreakGlass] ⏰ ${result.count} sessão(ões) expirada(s) automaticamente.`);
    }

    return result.count;
  }

  private toResponseDto(session: any): BreakGlassSessionResponseDto {
    return {
      sessionId: session.id,
      status: session.status,
      beneficiaryId: session.beneficiaryId,
      professionalId: session.professionalId,
      emergencyType: session.emergencyType,
      justification: session.justification,
      approvedAt: session.approvedAt?.toISOString() ?? null,
      expiresAt: session.expiresAt?.toISOString() ?? null,
      auditLogId: session.auditLogId ?? null,
      notificationSentAt: session.notificationSentAt?.toISOString() ?? null,
    };
  }
}
