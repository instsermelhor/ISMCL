import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * PORTAL ACCESS GUARD
 * 
 * Garante o isolamento lógico entre os portais. 
 * Bloqueia um usuário do portal clínico de acessar rotas do portal administrativo e vice-versa,
 * protegendo contra manipulação de tokens (BOLA - Broken Object Level Authorization).
 */
@Injectable()
export class PortalAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPortal = this.reflector.get<string>('portal', context.getHandler());
    
    if (!requiredPortal) {
      return true; // Se a rota não exige um portal específico, passa.
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Usuário decodificado do JWT

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    // Validação estrita de isolamento de portal
    if (user.portal_access !== requiredPortal && user.portal_access !== 'BOTH') {
      throw new ForbiddenException(
        `Acesso Negado. Esta credencial pertence ao portal ${user.portal_access}, 
        mas tentou acessar uma rota restrita do portal ${requiredPortal}.`
      );
    }

    return true;
  }
}
