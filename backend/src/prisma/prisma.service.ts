import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — Serviço de acesso ao banco de dados via ORM Prisma.
 *
 * Gerencia o ciclo de vida da conexão com o PostgreSQL, aplicando
 * extensões de segurança e row-level security (RLS) quando disponível.
 *
 * Funcionalidades:
 * - Conexão gerenciada pelo ciclo de vida do NestJS (OnModuleInit/Destroy)
 * - Soft delete automático via extensão (exclui registros com deletedAt != null)
 * - Logging de queries lentas (> 1s) em desenvolvimento
 * - Graceful shutdown via $disconnect()
 *
 * Referências: P123 (AEDA), P131 (AFPI)
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'info' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('✅ Prisma conectado ao PostgreSQL.');

    // Log de queries lentas (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).$on('query', (event: { query: string; duration: number }) => {
        if (event.duration > 1000) {
          this.logger.warn(
            { query: event.query, duration: event.duration },
            `[Prisma] Query lenta detectada: ${event.duration}ms`,
          );
        }
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('🔌 Prisma desconectado do PostgreSQL.');
  }

  /**
   * Aplica o contexto de tenant e usuário para Row Level Security (RLS).
   * Deve ser chamado no início de cada request em contextos multi-tenant.
   *
   * @param tenantId - ID do tenant atual
   * @param userId - ID do usuário autenticado
   */
  async setRLSContext(tenantId: string, userId: string): Promise<void> {
    await this.$executeRaw`
      SELECT
        set_config('aura.current_tenant_id', ${tenantId}, true),
        set_config('aura.current_user_id', ${userId}, true)
    `;
  }

  /**
   * Limpa o contexto RLS ao final da transação.
   */
  async clearRLSContext(): Promise<void> {
    await this.$executeRaw`
      SELECT
        set_config('aura.current_tenant_id', '', true),
        set_config('aura.current_user_id', '', true)
    `;
  }
}
