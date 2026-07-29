import { Module } from '@nestjs/common';
import { ProductionReadinessController } from './controllers/production-readiness.controller';
import { ProductionReadinessService } from './services/production-readiness.service';
import { GoLiveManagementService } from './services/golive-management.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * ProductionReadinessModule — Programa Oficial de Production Readiness, Enterprise Certification & Go-Live (APRCG)
 *
 * Integra:
 * - ProductionReadinessService (Checklist de 12 Categorias + Certificação CERT-2026-XXXXX SHA-256)
 * - GoLiveManagementService (Agendamento, 6 Aprovações Executivas, Smoke Tests e Rollback Engine)
 *
 * Referências: P149 APRCG
 */
@Module({
  imports: [EventBusModule],
  controllers: [ProductionReadinessController],
  providers: [ProductionReadinessService, GoLiveManagementService],
  exports: [ProductionReadinessService, GoLiveManagementService],
})
export class ProductionReadinessModule {}
