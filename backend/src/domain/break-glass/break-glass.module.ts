import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { BreakGlassService } from './break-glass.service';
import { BreakGlassController } from './break-glass.controller';
import { BreakGlassNotificationListener } from './break-glass-notification.listener';
import { BreakGlassExpirationScheduler } from './break-glass-expiration.scheduler';
import { AuditService } from '../../audit/audit.service';

/**
 * BreakGlassModule — Módulo de Acesso Excepcional de Emergência
 *
 * Integra o fluxo completo de Break-Glass (GAP-P1-04):
 * - BreakGlassService: lógica de negócio (solicitar, aprovar, revogar, expirar)
 * - BreakGlassNotificationListener: escuta eventos e notifica gestores em tempo real
 * - BreakGlassExpirationScheduler: expira sessões vencidas a cada 5 minutos
 * - BreakGlassController: REST API
 *
 * Dependências:
 * - PrismaService: acesso ao banco (BreakGlassSession, SecurityAuditLog, User, Notification)
 * - AuditService: log imutável com hash chain (GAP-P1-03)
 * - EventBusModule: publicação de eventos CloudEvents v1.0.3
 *
 * Referências: PRD-AURA-001 (FR-AURA-014), REMEDIATION-AURA-001 (R1-04)
 */
@Module({
  imports: [EventBusModule],
  providers: [
    AuditService,
    BreakGlassService,
    BreakGlassNotificationListener,
    BreakGlassExpirationScheduler,
  ],
  controllers: [BreakGlassController],
  exports: [BreakGlassService],
})
export class BreakGlassModule {}
