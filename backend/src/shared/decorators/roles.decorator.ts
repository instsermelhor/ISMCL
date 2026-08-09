import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

/**
 * Hierarquia de roles da Plataforma Aura (do mais ao menos privilegiado).
 * Referência: P107 (AEIATP), P128 (AECS)
 */
export enum AuraRole {
  SUPER_USER_UNIVERSAL = 'SUPER_USER_UNIVERSAL',
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DIRECTOR = 'DIRECTOR',
  COORDINATOR = 'COORDINATOR',
  MANAGER = 'MANAGER',
  PROFESSIONAL = 'PROFESSIONAL',
  INTERN = 'INTERN',
  STAFF = 'STAFF',
  AUDITOR = 'AUDITOR',
  BENEFICIARY = 'BENEFICIARY',
  VOLUNTEER = 'VOLUNTEER',
  LEGAL_GUARDIAN = 'LEGAL_GUARDIAN',
  PARTNER = 'PARTNER',
}

/**
 * @Roles — Decorator para controle de acesso baseado em papéis (RBAC).
 *
 * Uso:
 * ```ts
 * @Roles(AuraRole.PROFESSIONAL, AuraRole.ADMIN)
 * @Get('patients')
 * listPatients() { ... }
 * ```
 */
export const Roles = (...roles: (AuraRole | string)[]) => SetMetadata(ROLES_KEY, roles);

/**
 * @Permissions — Decorator para controle de acesso baseado em permissões (ABAC).
 *
 * Uso:
 * ```ts
 * @Permissions('beneficiary:read', 'clinical:ehr:write')
 * @Post('evolutions')
 * createEvolution() { ... }
 * ```
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
