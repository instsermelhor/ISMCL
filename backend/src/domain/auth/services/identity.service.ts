import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterUserDto } from '../dto/auth.dto';
import { isValidCPF, isValidEmail } from '../../../shared/utils/validators';
import { hashPassword } from '../../../shared/utils/crypto.utils';
import { EventBusService } from '../../../events/event-bus.service';

/**
 * IdentityService — Gestão do Ciclo de Vida da Identidade Digital
 *
 * Responsável por:
 * - Cadastro único institucional de usuários (Beneficiário, Profissional, Admin)
 * - Garantia de Unicidade de CPF e E-mail por Tenant
 * - Atribuição de UUIDv4 imutável
 * - Gestão de Atributos e Organizações
 * - Publicação de Eventos `aura.identity.user.created.v1`
 *
 * Referências: P107 (AEIATP), P123 (AEDA), P132 (AIFI Etapa 2)
 */
@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Registra uma nova identidade institucional no banco de dados.
   */
  async registerUser(dto: RegisterUserDto, tenantId = 'default') {
    // 1. Validações formais
    if (!isValidEmail(dto.email)) {
      throw new BadRequestException('E-mail informado é inválido.');
    }
    if (!isValidCPF(dto.cpf)) {
      throw new BadRequestException('CPF informado é inválido.');
    }

    const cleanCpf = dto.cpf.replace(/\D/g, '');

    // 2. Verifica duplicidades no Prisma
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { cpf: cleanCpf }],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email.toLowerCase()) {
        throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
      }
      throw new ConflictException('Já existe um usuário cadastrado com este CPF.');
    }

    // 3. Hash da senha
    const hashedPassword = await hashPassword(dto.password);

    // 4. Criação no banco
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        cpf: cleanCpf,
        passwordHash: hashedPassword,
        name: dto.fullName,
        phone: dto.phone,
        role: dto.role ?? 'BENEFICIARY',
        status: 'ACTIVE',
        organizationId: dto.organizationId,
      },
    });

    this.logger.log(`[Identity] Nova identidade registrada: ${user.id} (${user.email})`);

    // 5. Publicação do evento institucional CloudEvents
    await this.eventBus.publish(
      'aura.identity.user.created.v1',
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      tenantId,
      { subject: user.id },
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  /**
   * Busca um usuário pelo ID único (UUID).
   */
  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: string;
        name: true;
        email: true;
        cpf: true;
        phone: true;
        role: true;
        status: true;
        mfaEnabled: true;
        organizationId: true;
        createdAt: true;
        updatedAt: true;
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }

    return user;
  }

  /**
   * Desativa uma conta de usuário (Soft Delete / Block).
   */
  async disableUser(userId: string, reason: string, tenantId = 'default') {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'DISABLED' },
    });

    this.logger.warn(`[Identity] Conta desativada: ${userId}. Motivo: ${reason}`);

    await this.eventBus.publish(
      'aura.identity.user.disabled.v1',
      { userId, reason },
      tenantId,
      { subject: userId },
    );

    return user;
  }
}
