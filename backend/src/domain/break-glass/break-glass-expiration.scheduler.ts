import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BreakGlassService } from './break-glass.service';

/**
 * BreakGlassExpirationScheduler — Scheduler de Expiração Automática
 *
 * Executa a cada 5 minutos para verificar e expirar automaticamente
 * sessões Break-Glass que ultrapassaram a janela de 4 horas.
 *
 * Em uma implementação mais avançada, isso pode ser substituído por:
 * - Um job Redis com TTL + evento Keyspace Notification
 * - Um job na fila de mensagens (BullMQ/Kafka)
 *
 * Referência: GAP-P1-04, PRD-AURA-001 (FR-AURA-014)
 */
@Injectable()
export class BreakGlassExpirationScheduler {
  private readonly logger = new Logger(BreakGlassExpirationScheduler.name);

  constructor(private readonly breakGlassService: BreakGlassService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiration(): Promise<void> {
    try {
      const count = await this.breakGlassService.expireStaleSessions();
      if (count > 0) {
        this.logger.log(`[BreakGlassScheduler] ${count} sessão(ões) expirada(s).`);
      }
    } catch (err) {
      this.logger.error(
        `[BreakGlassScheduler] Falha ao expirar sessões: ${(err as Error).message}`,
      );
    }
  }
}
