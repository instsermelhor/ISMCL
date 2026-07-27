import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRoleDto } from '../dto/auth.dto';
import { EventBusService } from '../../../events/event-bus.service';

/**
 * RolePermissionService — Gestão de Cargos, Permissões e Escopos (RBAC / ABAC)
 *
 * Funcionalidades:
 * - Cadastro de Roles personalizadas
 * - Atribuição de permissões granulares
 * - Atribuição e revogação de papéis a usuários
 * - Publicação de eventos `aura.identity.role.assigned.v1`
 *
 * Referências: P107 (AEIATP), P132 (AIFI Etapa 9)
 */
@Injectable()
export class RolePermissionService {
  private readonly logger = new Logger(RolePermissionService.name);

  // Armazenamento de roles e permissões em memória para dev/fallback
  private readonly customRoles = new Map<string, CreateRoleDto>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Cria uma nova Role customizada na plataforma.
   */
  async createRole(dto: CreateRoleDto) {
    if (this.customRoles.has(dto.name)) {
      throw new ConflictException(`Role com o nome ${dto.name} já existe.`);
    }

    this.customRoles.set(dto.name, dto);
    this.logger.log(`[Role] Nova role criada: ${dto.name} com ${dto.permissions.length} permissões`);
    return dto;
  }

  /**
   * Lista todas as Roles disponíveis no sistema.
   */
  async listRoles() {
    return Array.from(this.customRoles.values());
  }

  /**
   * Atribui uma Role a um usuário.
   */
  async assignRoleToUser(userId: string, roleName: string, tenantId = 'default') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário ${userId} não encontrado.`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: roleName },
    });

    this.logger.log(`[Role] Role ${roleName} atribuída ao usuário ${userId}`);

    await this.eventBus.publish(
      'aura.identity.role.assigned.v1',
      { userId, role: roleName },
      tenantId,
      { subject: userId },
    );

    return updatedUser;
  }
}
