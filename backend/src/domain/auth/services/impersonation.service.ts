import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';

export interface StartImpersonationDto {
  targetUserId: string;
  reason: string;
}

/**
 * ImpersonationService — Impersonação Administrativa Controlada (Prompt 189 — Item 11)
 *
 * Permite que o Super Usuário Universal visualize a experiência de outro perfil
 * em sessões assistidas de suporte com:
 * - Autorização explícita
 * - Motivo obrigatório
 * - Sessão temporária (máx 30 minutos)
 * - Registro de auditoria imutável (SecurityAuditLog)
 * - Encerramento remoto/automático
 */
@Injectable()
export class ImpersonationService {
  private readonly logger = new Logger(ImpersonationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Inicia uma sessão de impersonação assistida.
   */
  async startImpersonation(
    adminUserId: string,
    adminRole: string,
    dto: StartImpersonationDto,
    ipAddress: string,
  ) {
    if (adminRole !== 'SUPER_USER_UNIVERSAL') {
      throw new ForbiddenException('Apenas o Super Usuário Universal possui permissão para impersonação assistida.');
    }

    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new ForbiddenException('O motivo da impersonação assistida é obrigatório (mínimo 5 caracteres).');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: dto.targetUserId } });
    if (!targetUser) throw new NotFoundException('Usuário alvo não encontrado.');

    if (targetUser.role === 'SUPER_USER_UNIVERSAL') {
      throw new ForbiddenException('Não é permitido impersonar a própria conta do Super Usuário Universal.');
    }

    const token = `imp_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    // Cria registro de impersonação
    const session = await this.prisma.impersonationSession.create({
      data: {
        adminId: adminUserId,
        targetUserId: dto.targetUserId,
        reason: dto.reason,
        token,
        expiresAt,
        status: 'ACTIVE',
      },
    });

    // Emite JWT temporário com flag e metadata de impersonação
    const impersonationPayload = {
      sub: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      roles: [targetUser.role],
      scope: targetUser.scope,
      isImpersonating: true,
      impersonatedBy: adminUserId,
      impersonationReason: dto.reason,
      impersonationToken: token,
    };

    const accessToken = await this.jwtService.signAsync(impersonationPayload, {
      expiresIn: '30m',
    });

    // Registra na auditoria imutável
    await this.prisma.securityAuditLog.create({
      data: {
        eventType: 'IMPERSONATION_STARTED',
        severity: 'HIGH',
        actorId: adminUserId,
        actorRole: adminRole,
        action: 'IMPERSONATE_USER',
        resource: 'USER',
        resourceId: targetUser.id,
        details: {
          targetUserEmail: targetUser.email,
          targetUserRole: targetUser.role,
          reason: dto.reason,
          token,
        },
        ipAddress,
      },
    });

    this.logger.log(`[Impersonation] ⚠️ Super Usuário ${adminUserId} iniciou impersonação de ${targetUser.email} (Motivo: ${dto.reason})`);

    return {
      accessToken,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
      impersonationToken: token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Encerra uma sessão de impersonação assistida.
   */
  async stopImpersonation(token: string, adminUserId: string, ipAddress: string) {
    const session = await this.prisma.impersonationSession.findUnique({ where: { token } });
    if (!session) throw new NotFoundException('Sessão de impersonação não encontrada.');

    await this.prisma.impersonationSession.update({
      where: { id: session.id },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    await this.prisma.securityAuditLog.create({
      data: {
        eventType: 'IMPERSONATION_ENDED',
        severity: 'INFO',
        actorId: adminUserId,
        action: 'EXIT_IMPERSONATION',
        resource: 'USER',
        resourceId: session.targetUserId,
        details: { token },
        ipAddress,
      },
    });

    this.logger.log(`[Impersonation] Sessão de impersonação encerrada para token ${token}`);
    return { status: 'ended' };
  }
}
