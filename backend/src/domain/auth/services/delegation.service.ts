import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CreateUserDto {
  email: string;
  name: string;
  password?: string;
  role: string;
  scope?: string;
}

export interface UpdateUserDto {
  name?: string;
  role?: string;
  scope?: string;
  status?: string;
}

export interface DelegateRoleDto {
  delegateeId: string;
  roleName: string;
  scope?: string;
  reason?: string;
  expiresAt?: string;
}

/**
 * DelegationService — Gestão de Acessos, Delegação de Funções e Anti-Autoescalação
 *
 * Implementa:
 * - Listagem de usuários, papéis e permissões
 * - Criação e edição de usuários
 * - Delegação explícita de funções pelo Super Usuário Universal
 * - Trava de Proteção contra Autoescalação de Privilégios (Item 8)
 *
 * Referência: Prompt 189 — Itens 6, 7 & 8
 */
@Injectable()
export class DelegationService {
  private readonly logger = new Logger(DelegationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todos os usuários cadastrados no sistema.
   */
  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        scope: true,
        status: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista os papéis do sistema.
   */
  async listRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  /**
   * Edita um usuário aplicando regras de anti-autoescalação.
   */
  async updateUser(
    targetUserId: string,
    dto: UpdateUserDto,
    actorRole: string,
    actorUserId: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('Usuário não encontrado');

    // ── REGRA DE OURO: PROTEÇÃO CONTRA AUTOESCALAÇÃO (Item 8) ──────────────
    // 1. Usuários não-super não podem atribuir SUPER_USER_UNIVERSAL
    if (dto.role === 'SUPER_USER_UNIVERSAL' && actorRole !== 'SUPER_USER_UNIVERSAL') {
      throw new ForbiddenException('Apenas o Super Usuário Universal pode conceder o papel SUPER_USER_UNIVERSAL.');
    }

    // 2. Usuários não-super não podem alterar o próprio escopo para GLOBAL
    if (dto.scope === 'GLOBAL' && actorRole !== 'SUPER_USER_UNIVERSAL') {
      throw new ForbiddenException('Apenas o Super Usuário Universal pode alterar o escopo para GLOBAL.');
    }

    // 3. Usuários não-super não podem alterar a conta do Super Usuário Universal
    if (targetUser.role === 'SUPER_USER_UNIVERSAL' && actorRole !== 'SUPER_USER_UNIVERSAL') {
      throw new ForbiddenException('Não é permitido alterar a conta do Super Usuário Universal.');
    }

    // 4. Nenhum usuário comum pode transformar a própria conta em Super Usuário
    if (actorUserId === targetUserId && dto.role === 'SUPER_USER_UNIVERSAL' && actorRole !== 'SUPER_USER_UNIVERSAL') {
      throw new ForbiddenException('Autoescalação de privilégios bloqueada.');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.role && { role: dto.role }),
        ...(dto.scope && { scope: dto.scope }),
        ...(dto.status && { status: dto.status }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        scope: true,
        status: true,
        updatedAt: true,
      },
    });

    this.logger.log(`[Delegation] Usuário ${targetUser.email} atualizado por ${actorUserId} (Role: ${updated.role}, Scope: ${updated.scope})`);
    return updated;
  }

  /**
   * Delega uma função/permissão a um usuário.
   */
  async delegateRole(
    actorUserId: string,
    actorRole: string,
    dto: DelegateRoleDto,
  ) {
    if (actorRole !== 'SUPER_USER_UNIVERSAL' && actorRole !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Apenas Super Usuários ou Administradores podem delegar funções.');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: dto.delegateeId } });
    if (!targetUser) throw new NotFoundException('Usuário destinatário não encontrado.');

    const role = await this.prisma.role.findUnique({ where: { name: dto.roleName } });
    if (!role) throw new NotFoundException(`Função '${dto.roleName}' não cadastrada.`);

    if (dto.roleName === 'SUPER_USER_UNIVERSAL' && actorRole !== 'SUPER_USER_UNIVERSAL') {
      throw new ForbiddenException('Apenas o Super Usuário Universal pode delegar a autoridade máxima.');
    }

    const delegation = await this.prisma.userDelegation.create({
      data: {
        delegatorId: actorUserId,
        delegateeId: dto.delegateeId,
        roleId: role.id,
        scope: dto.scope ?? role.scope,
        status: 'ACTIVE',
        reason: dto.reason,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        delegatee: { select: { id: true, email: true, name: true } },
        role: true,
      },
    });

    this.logger.log(`[Delegation] Função ${dto.roleName} delegada para ${targetUser.email} por ${actorUserId}`);
    return delegation;
  }

  /**
   * Lista todas as delegações ativas.
   */
  async listDelegations() {
    return this.prisma.userDelegation.findMany({
      include: {
        delegator: { select: { id: true, email: true, name: true } },
        delegatee: { select: { id: true, email: true, name: true } },
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
