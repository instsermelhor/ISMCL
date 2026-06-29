import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { securityContextStorage, UserSecurityContext } from '../prisma/extensions/security-context';

const rawDb = new PrismaClient();

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  /**
   * Intercepta a requisição HTTP e injeta o contexto de segurança imutável.
   */
  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Verifica se há usuário autenticado anexado na requisição (injetado por AuthGuards)
    const user = (req as any).user;
    if (!user) {
      // Se não há usuário logado, prossegue sem injetar contexto estrito
      return next();
    }

    const userId = user.id;
    const role = user.role || 'VOLUNTEER';

    // 2. Mapeamento de Papéis para Níveis Máximos de Sensibilidade Padrão (RBAC)
    let sensitivityLevel = 0;
    if (role === 'VOLUNTEER' || role === 'CLINICIAN') {
      sensitivityLevel = 1;
    } else if (role === 'COORDINATOR') {
      sensitivityLevel = 2;
    } else if (role === 'ADMIN') {
      sensitivityLevel = 3;
    } else if (role === 'DPO' || role === 'DIRECTOR') {
      sensitivityLevel = 4;
    }

    // 3. Extrai atributos de ambiente para validação ABAC
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'UNKNOWN_DEVICE';

    // 4. Carrega sessões ativas de Break-Glass (Acesso Excepcional) para este usuário
    const now = new Date();
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

    const activeBreakGlassSessions: Record<string, { expiresAt: string }> = {};
    for (const reqObj of activeRequests) {
      if (reqObj.profile && reqObj.profile.beneficiaryId) {
        activeBreakGlassSessions[reqObj.profile.beneficiaryId] = {
          expiresAt: reqObj.expiresAt.toISOString()
        };
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
