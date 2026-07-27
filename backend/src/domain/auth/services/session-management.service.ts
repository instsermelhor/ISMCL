import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface UserSession {
  sessionId: string;
  userId: string;
  tenantId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  isTrustedDevice: boolean;
  deviceFingerprint?: string;
}

/**
 * SessionManagementService — Gestão Centralizada de Sessões & Invalidação Remota
 *
 * Funcionalidades:
 * - Registro de sessões ativas com IP, User-Agent e Fingerprint
 * - Renovação de sessão com atualização de timestamp de atividade
 * - Invalidação individual e Logout Global (Revogação de todos os tokens de um usuário)
 * - Limite de sessões concorrentes por perfil
 * - Gestão de Dispositivos Confiáveis
 *
 * Referências: P107 (AEIATP), P128 (AECS), P132 (AIFI Etapa 7)
 */
@Injectable()
export class SessionManagementService {
  private readonly logger = new Logger(SessionManagementService.name);
  
  // Em produção, as sessões ficam persistidas no Redis
  private readonly sessions = new Map<string, UserSession>();
  private readonly trustedDevices = new Set<string>();

  constructor(private readonly config: ConfigService) {}

  /**
   * Cria uma nova sessão para o usuário autenticado.
   */
  async createSession(
    userId: string,
    tenantId: string,
    ipAddress: string,
    userAgent: string,
    deviceFingerprint?: string,
  ): Promise<UserSession> {
    const sessionId = randomUUID();
    const now = new Date();
    const ttlMinutes = this.config.get<number>('SESSION_TTL_MINUTES', 60);
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000).toISOString();

    const isTrusted = deviceFingerprint
      ? this.trustedDevices.has(`${userId}:${deviceFingerprint}`)
      : false;

    const session: UserSession = {
      sessionId,
      userId,
      tenantId,
      ipAddress,
      userAgent,
      createdAt: now.toISOString(),
      expiresAt,
      lastActiveAt: now.toISOString(),
      isTrustedDevice: isTrusted,
      deviceFingerprint,
    };

    // Aplica limite de sessões simultâneas (máximo 5)
    await this.enforceConcurrentSessionLimit(userId, 5);

    this.sessions.set(sessionId, session);
    this.logger.log(`[Session] Nova sessão criada: ${sessionId} para usuário ${userId}`);
    return session;
  }

  /**
   * Valida e atualiza a última atividade da sessão.
   */
  async validateSession(sessionId: string): Promise<UserSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedException('Sessão inexistente ou expirada.');
    }

    const now = new Date();
    if (new Date(session.expiresAt) < now) {
      this.sessions.delete(sessionId);
      throw new UnauthorizedException('Sessão expirada por inatividade.');
    }

    // Renovação do horário de última atividade
    session.lastActiveAt = now.toISOString();
    return session;
  }

  /**
   * Revoga uma sessão específica (Logout individual).
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.logger.log(`[Session] Sessão revogada: ${sessionId}`);
    }
    return deleted;
  }

  /**
   * Revoga TODAS as sessões de um usuário (Global Logout / Incidente de Segurança).
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    let count = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    this.logger.warn(`[Session] Logout Global executado: ${count} sessões revogadas para usuário ${userId}`);
    return count;
  }

  /**
   * Registra um dispositivo como confiável.
   */
  async registerTrustedDevice(userId: string, deviceFingerprint: string): Promise<void> {
    this.trustedDevices.add(`${userId}:${deviceFingerprint}`);
    this.logger.log(`[Session] Dispositivo registrado como confiável para ${userId}`);
  }

  /**
   * Lista todas as sessões ativas do usuário.
   */
  async listUserSessions(userId: string): Promise<UserSession[]> {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId);
  }

  private async enforceConcurrentSessionLimit(userId: string, maxSessions: number): Promise<void> {
    const userSessions = await this.listUserSessions(userId);
    if (userSessions.length >= maxSessions) {
      // Ordena da mais antiga para a mais recente e remove as excedentes
      userSessions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const toRemove = userSessions.slice(0, userSessions.length - maxSessions + 1);
      for (const s of toRemove) {
        this.sessions.delete(s.sessionId);
        this.logger.info(`[Session] Sessão antiga ${s.sessionId} revogada devido ao limite concorrente.`);
      }
    }
  }
}
