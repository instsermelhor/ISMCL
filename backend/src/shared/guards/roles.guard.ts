import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { AuraJwtPayload } from './jwt-auth.guard';
import { ROLES_KEY, PERMISSIONS_KEY, AuraRole } from '../decorators/roles.decorator';

/** Hierarquia de roles: quanto menor o índice, maior o privilégio */
const ROLE_HIERARCHY: AuraRole[] = [
  AuraRole.SUPER_USER_UNIVERSAL,
  AuraRole.SUPER_ADMIN,
  AuraRole.ADMIN,
  AuraRole.DIRECTOR,
  AuraRole.COORDINATOR,
  AuraRole.MANAGER,
  AuraRole.PROFESSIONAL,
  AuraRole.INTERN,
  AuraRole.STAFF,
  AuraRole.AUDITOR,
  AuraRole.VOLUNTEER,
  AuraRole.PARTNER,
  AuraRole.LEGAL_GUARDIAN,
  AuraRole.BENEFICIARY,
];

/**
 * RolesGuard — Guard de Autorização RBAC + ABAC
 *
 * Valida se o usuário autenticado possui os roles (@Roles) e/ou
 * permissões (@Permissions) necessários para acessar o endpoint.
 *
 * Modelo hierárquico: um role de nível superior herda todas as
 * permissões dos níveis inferiores. SUPER_USER_UNIVERSAL possui autoridade
 * total e incondicional em todo a plataforma (GLOBAL).
 *
 * Referências: P107 (AEIATP), P116 (AECRGAP), P128 (AECS), P131 (AFPI), P189
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AuraRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sem restrição de role/permission definida — acesso liberado (apenas JWT válido)
    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      FastifyRequest & { user: AuraJwtPayload }
    >();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'Acesso negado. Usuário não autenticado.',
      );
    }

    const userRoles = user.roles ?? user.realm_access?.roles ?? [];
    const userPermissions = user.permissions ?? [];

    // SUPER_USER_UNIVERSAL tem permissão máxima incondicional sobre tudo
    if (userRoles.includes('SUPER_USER_UNIVERSAL') || userRoles.includes('SUPER_USER')) {
      return true;
    }

    // Verificação de roles com hierarquia
    if (requiredRoles?.length) {
      const hasRole = requiredRoles.some((requiredRole) =>
        this.hasRoleOrHigher(userRoles as AuraRole[], requiredRole),
      );

      if (!hasRole) {
        throw new ForbiddenException(
          `Acesso negado. Role(s) necessário(s): ${requiredRoles.join(', ')}.`,
        );
      }
    }

    // Verificação de permissões ABAC
    if (requiredPermissions?.length) {
      const hasAllPermissions = requiredPermissions.every((p) =>
        userPermissions.includes(p),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `Acesso negado. Permissão(ões) insuficiente(s).`,
        );
      }
    }

    return true;
  }

  /**
   * Verifica se o usuário tem um determinado role OU um role de nível superior.
   */
  private hasRoleOrHigher(
    userRoles: AuraRole[],
    requiredRole: AuraRole,
  ): boolean {
    const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
    return userRoles.some((userRole) => {
      const userIndex = ROLE_HIERARCHY.indexOf(userRole as AuraRole);
      return userIndex !== -1 && userIndex <= requiredIndex;
    });
  }
}
