import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule — Módulo Global do Prisma Client
 *
 * Exporta o PrismaService como provider global, eliminando a necessidade
 * de importar individualmente em cada módulo de domínio.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
