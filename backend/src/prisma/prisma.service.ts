import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { securityExtension } from './extensions/security.extension';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly prisma: PrismaClient;
  public readonly client: any;

  constructor() {
    this.prisma = new PrismaClient();
    this.client = this.prisma.$extends(securityExtension);

    // Retorna um Proxy para delegar dinamicamente todas as chamadas de propriedades
    // para o cliente estendido com segurança (RLS/Mascaramento)
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) {
          return (target as any)[prop];
        }
        return (target.client as any)[prop];
      }
    });
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
