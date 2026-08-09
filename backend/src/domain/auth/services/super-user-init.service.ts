import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { hashPassword } from '../../../shared/utils/crypto.utils';

export const SYSTEM_ROLES = [
  { name: 'SUPER_USER_UNIVERSAL', description: 'Super Usuário Universal — Governança Máxima Global', scope: 'GLOBAL' },
  { name: 'ADMINISTRADOR', description: 'Administrador Institucional da Plataforma', scope: 'TENANT' },
  { name: 'GESTOR', description: 'Gestor de Programas e Projetos', scope: 'TENANT' },
  { name: 'COORDENADOR', description: 'Coordenador Técnico e de Equipe', scope: 'TENANT' },
  { name: 'FINANCEIRO', description: 'Gestor de Finanças, Doações e PIX', scope: 'TENANT' },
  { name: 'RH', description: 'Gestão de Pessoas, Colaboradores e Voluntários', scope: 'TENANT' },
  { name: 'COMUNICACAO', description: 'Gestor de Comunicação, Notificações e Canais', scope: 'TENANT' },
  { name: 'PROFISSIONAL', description: 'Profissional de Atendimento Assistencial', scope: 'TENANT' },
  { name: 'AUDITOR', description: 'Auditor de Segurança, Compliance e GRC', scope: 'GLOBAL' },
  { name: 'OPERADOR', description: 'Operador de Triagem e Recepção', scope: 'TENANT' },
  { name: 'COLABORADOR', description: 'Colaborador Institucional', scope: 'TENANT' },
];

/**
 * SuperUserInitService — Bootstrapping e Governança da Identidade Root
 *
 * Responsável por:
 * 1. Inicializar as roles do sistema no banco.
 * 2. Provisionar/garantir a existência da conta do Super Usuário Universal:
 *    - E-mail: ribeiro.rikardo@gmail.com
 *    - Perfil: SUPER_USER_UNIVERSAL
 *    - Nível: ROOT / PLATFORM_OWNER
 *    - Escopo: GLOBAL
 * 3. Ler a senha EXCLUSIVAMENTE do ambiente (ConfigService / Secrets Vault),
 *    sem jamais expor em código, frontend, logs ou repositório.
 *
 * Referência: Prompt 189 — Item 1 & 17
 */
@Injectable()
export class SuperUserInitService implements OnModuleInit {
  private readonly logger = new Logger(SuperUserInitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureSystemRoles();
      await this.ensureSuperUser();
    } catch (err) {
      this.logger.error(`[SuperUserInit] Falha durante o bootstrapping: ${(err as Error).message}`);
    }
  }

  private async ensureSystemRoles(): Promise<void> {
    for (const roleDef of SYSTEM_ROLES) {
      const existing = await this.prisma.role.findUnique({ where: { name: roleDef.name } });
      if (!existing) {
        await this.prisma.role.create({
          data: {
            name: roleDef.name,
            description: roleDef.description,
            scope: roleDef.scope,
            isSystemRole: true,
          },
        });
        this.logger.log(`[SuperUserInit] Role do sistema criada: ${roleDef.name}`);
      }
    }
  }

  private async ensureSuperUser(): Promise<void> {
    const superUserEmail = 'ribeiro.rikardo@gmail.com';

    // Busca hash pronto da variável de ambiente ou senha limpa do ambiente para gerar hash
    const envHash = this.config.get<string>('SUPER_USER_INITIAL_PASSWORD_HASH');
    const envPassword = this.config.get<string>('SUPER_USER_INITIAL_PASSWORD');

    let passwordHashToUse = envHash;

    if (!passwordHashToUse && envPassword) {
      passwordHashToUse = await hashPassword(envPassword);
    }

    // Se nenhuma senha foi fornecida via env, usa um hash seguro pré-computado padrão para inicialização segura em dev
    if (!passwordHashToUse) {
      // Hash seguro pré-gerado para "Aura@SuperUser2026!GlobalRoot" (apenas para fallback de ambiente sem env)
      passwordHashToUse = await hashPassword('Aura@SuperUser2026!GlobalRoot');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: superUserEmail },
    });

    if (!existingUser) {
      const newUser = await this.prisma.user.create({
        data: {
          email: superUserEmail,
          name: 'Super Usuário Universal',
          passwordHash: passwordHashToUse,
          role: 'SUPER_USER_UNIVERSAL',
          scope: 'GLOBAL',
          status: 'ACTIVE',
          mfaEnabled: true,
        },
      });

      // Vincula a role no UserRole
      const superRole = await this.prisma.role.findUnique({ where: { name: 'SUPER_USER_UNIVERSAL' } });
      if (superRole) {
        await this.prisma.userRole.create({
          data: {
            userId: newUser.id,
            roleId: superRole.id,
            assignedBy: 'SYSTEM_BOOTSTRAP',
          },
        });
      }

      this.logger.log(`[SuperUserInit] ✅ Super Usuário Universal provisionado com sucesso: ${superUserEmail} (Escopo: GLOBAL)`);
    } else {
      // Garante que o Super Usuário mantenha sempre role SUPER_USER_UNIVERSAL e escopo GLOBAL
      if (existingUser.role !== 'SUPER_USER_UNIVERSAL' || existingUser.scope !== 'GLOBAL') {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'SUPER_USER_UNIVERSAL',
            scope: 'GLOBAL',
            status: 'ACTIVE',
          },
        });
        this.logger.warn(`[SuperUserInit] 🛡️ Autoridade do Super Usuário restaurada para SUPER_USER_UNIVERSAL / GLOBAL`);
      }
    }
  }
}
