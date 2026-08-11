import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';
import { securityContextStorage, UserSecurityContext } from '../prisma/extensions/security-context';

const rawDb = new PrismaClient();

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  /**
   * Intercepta a requisição HTTP e injeta o contexto de segurança imutável.
   */
  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Tenta obter o usuário do req.user (injetado por AuthGuards) ou via Bearer token
    let user = (req as any).user;

    if (!user) {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jose.decodeJwt(token);
          if (decoded && (decoded.sub || (decoded as any).id)) {
            const roles = (decoded.roles as string[]) || (decoded.realm_access?.roles as string[]) || [];
            user = {
              id: decoded.sub || (decoded as any).id,
              role: (decoded as any).role || roles[0] || 'VOLUNTEER',
              roles,
            };
          }
        } catch {
          // Token inválido ou ilegível
        }
      }
    }

    const userId = user?.id || 'anonymous';
    const role = (user?.role || (user?.roles && user.roles[0]) || 'ANONYMOUS').toUpperCase();

    // 2. Mapeamento de Papéis para Níveis Máximos de Sensibilidade Padrão (RBAC)
    let sensitivityLevel = 0;
    if (role === 'VOLUNTEER' || role === 'CLINICIAN' || role === 'PROFISSIONAL' || role === 'OPERADOR' || role === 'COLABORADOR') {
      sensitivityLevel = 1;
    } else if (role === 'COORDINATOR' || role === 'COORDENADOR' || role === 'FINANCEIRO') {
      sensitivityLevel = 2;
    } else if (role === 'ADMIN' || role === 'ADMINISTRADOR') {
      sensitivityLevel = 3;
    } else if (role === 'DPO' || role === 'DIRECTOR' || role === 'GESTOR' || role === 'SUPER_USER_UNIVERSAL' || role === 'SUPER_USER') {
      sensitivityLevel = 4;
    }

    // 3. Extrai atributos de ambiente para validação ABAC
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '0.0.0.0';
    const userAgent = (req.headers['user-agent'] as string) || 'UNKNOWN_DEVICE';

    // 4. Carrega sessões ativas de Break-Glass (Acesso Excepcional) para este usuário
    const activeBreakGlassSessions: Record<string, { expiresAt: string }> = {};
    if (userId !== 'anonymous') {
      const now = new Date();
      try {
        const activeRequests = await rawDb.accessRequest.findMany({
          where: {
            requesterId: userId,
            status: 'APPROVED',
            expiresAt: { gt: now }
          },
          select: {
            expiresAt: true,
            profile: {
              select: {
                beneficiaryId: true
              }
            }
          }
        });

        for (const reqObj of activeRequests) {
          if (reqObj.profile && reqObj.profile.beneficiaryId) {
            activeBreakGlassSessions[reqObj.profile.beneficiaryId] = {
              expiresAt: reqObj.expiresAt?.toISOString() ?? new Date().toISOString()
            };
          }
        }
      } catch {
        // Ignora falhas de conexão de banco no middleware durante bootstrapping
      }
    }

    // 5. Instancia o contexto de segurança do request
    const context: UserSecurityContext = {
      userId,
      role,
      sensitivityLevel,
      ipAddress,
      userAgent,
      activeBreakGlassSessions
    };

    // 6. Vincula e executa a requisição dentro do escopo do AsyncLocalStorage
    securityContextStorage.run(context, () => {
      (req as any).securityContext = context;
      next();
    });
  }
}
