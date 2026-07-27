import {
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDto } from '../dto/auth.dto';
import { verifyPassword } from '../../../shared/utils/crypto.utils';
import { SessionManagementService } from './session-management.service';
import { MfaService } from './mfa.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * AuthenticationService — Núcleo de Autenticação OAuth 2.1 / OIDC
 *
 * Funcionalidades:
 * - Autenticação por E-mail + Senha
 * - Verificação adaptativa de MFA
 * - Geração de JWT Access Token e Refresh Token
 * - Renovação de tokens (Refresh Token Flow)
 * - Emissão de eventos `aura.auth.login.succeeded.v1` e `aura.auth.login.failed.v1`
 *
 * Referências: P107 (AEIATP), P128 (AECS), P132 (AIFI Etapa 3)
 */
@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sessionService: SessionManagementService,
    private readonly mfaService: MfaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Executa o fluxo de Login do usuário.
   */
  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent: string,
    tenantId = 'default',
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Proteção contra enumeração de usuários (mesma mensagem para e-mail/senha incorretos)
    if (!user) {
      await this.publishLoginFailed(dto.email, 'Usuário não encontrado', ipAddress, tenantId);
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    if (user.status !== 'ACTIVE') {
      await this.publishLoginFailed(dto.email, 'Conta inativa/bloqueada', ipAddress, tenantId);
      throw new ForbiddenException('Conta de usuário inativa ou bloqueada.');
    }

    // Verificação da Senha
    const passwordValid = await verifyPassword(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.publishLoginFailed(dto.email, 'Senha incorreta', ipAddress, tenantId);
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    // Verificação MFA se habilitado na conta
    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        return {
          mfaRequired: true,
          message: 'Código de autenticação em dois fatores (MFA) é obrigatório.',
        };
      }

      const isMfaValid = this.mfaService.verifyTotp(user.mfaSecret ?? '', dto.mfaCode);
      if (!isMfaValid) {
        await this.publishLoginFailed(dto.email, 'Código MFA inválido', ipAddress, tenantId);
        throw new UnauthorizedException('Código MFA inválido ou expirado.');
      }
    }

    // Criação da Sessão Ativa
    const session = await this.sessionService.createSession(
      user.id,
      tenantId,
      ipAddress,
      userAgent,
      dto.deviceFingerprint,
    );

    // Geração dos Tokens JWT
    const tokens = await this.generateTokens(user, session.sessionId, tenantId);

    // Evento de Sucesso
    await this.eventBus.publish(
      'aura.auth.login.succeeded.v1',
      {
        userId: user.id,
        email: user.email,
        sessionId: session.sessionId,
        ipAddress,
      },
      tenantId,
      { subject: user.id },
    );

    this.logger.log(`[Auth] Login bem-sucedido para ${user.email} (Session: ${session.sessionId})`);

    return {
      mfaRequired: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Renova os tokens utilizando o Refresh Token.
   */
  async refreshToken(refreshToken: string, tenantId = 'default'): Promise<AuthTokens> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Refresh token inválido ou conta inativa.');
      }

      // Valida se a sessão ainda está ativa
      await this.sessionService.validateSession(payload.sessionId);

      return this.generateTokens(user, payload.sessionId, tenantId);
    } catch {
      throw new UnauthorizedException('Refresh token expirado ou inválido.');
    }
  }

  private async generateTokens(
    user: { id: string; email: string; name: string; role: string },
    sessionId: string,
    tenantId: string,
  ): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      tenantId,
      roles: [user.role],
      sessionId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.config.get<string>('JWT_EXPIRY', '15m'),
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, sessionId },
      { expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRY', '7d') },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos em segundos
      tokenType: 'Bearer',
    };
  }

  private async publishLoginFailed(
    email: string,
    reason: string,
    ipAddress: string,
    tenantId: string,
  ): Promise<void> {
    this.logger.warn(`[Auth] Falha no login para ${email}. Motivo: ${reason}`);
    await this.eventBus.publish(
      'aura.auth.login.failed.v1',
      { email, reason, ipAddress },
      tenantId,
    );
  }
}
