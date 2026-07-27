import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { Public } from '../shared/decorators/public.decorator';

/**
 * HealthController — Endpoints de Saúde da Plataforma Aura
 *
 * Implementa os três padrões de health check para Kubernetes:
 * - GET /health       → Liveness Probe (está vivo?)
 * - GET /health/ready → Readiness Probe (pronto para tráfego?)
 * - GET /health/startup → Startup Probe (inicializou corretamente?)
 *
 * Referências: P117 (AEOSMRP), P127 (AECP), P131 (AFPI)
 */
@ApiTags('Health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Liveness Probe — Verifica se o processo está vivo.
   * Kubernetes reinicia o pod se este endpoint falhar.
   * Verificações: memória heap e memória RSS.
   */
  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness Probe',
    description: 'Verifica se o serviço está vivo (Kubernetes liveness probe).',
  })
  @ApiResponse({ status: 200, description: 'Serviço operacional' })
  @ApiResponse({ status: 503, description: 'Serviço degradado' })
  liveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),  // 512 MB
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),   // 1 GB
    ]);
  }

  /**
   * Readiness Probe — Verifica se o serviço está pronto para receber tráfego.
   * Kubernetes remove o pod do load balancer se este endpoint falhar.
   * Verificações: banco de dados, memória e disco.
   */
  @Get('ready')
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness Probe',
    description: 'Verifica se o serviço está pronto para tráfego (Kubernetes readiness probe).',
  })
  readiness() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk_storage', {
          thresholdPercent: 0.90,
          path: '/',
        }),
    ]);
  }

  /**
   * Startup Probe — Verifica se a aplicação inicializou corretamente.
   * Kubernetes aguarda este endpoint antes de iniciar liveness/readiness.
   */
  @Get('startup')
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Startup Probe' })
  startup() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
