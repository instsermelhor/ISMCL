import { Module } from '@nestjs/common';
import { AnalyticsController } from './controllers/analytics.controller';
import { KpiEngineService } from './services/kpi-engine.service';
import { DataWarehouseService } from './services/data-warehouse.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import { DataGovernanceService } from './services/data-governance.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * AnalyticsModule — Plataforma Corporativa de Business Intelligence, Analytics e Decision Intelligence (AEBI-DI)
 *
 * Integra:
 * - KpiEngineService (KPI Engine: cálculo e tendência dinâmica de indicadores)
 * - DataWarehouseService (Star Schema DW + 9 Data Marts especializados)
 * - PredictiveAnalyticsService (IA Explicável — XAI para risco de abandono e demanda)
 * - DataGovernanceService (Catálogo de dados, linhagem e pontuação de qualidade)
 *
 * Referências: P108 AEDP, P113 AEABI, P140 AEBI-DI
 */
@Module({
  imports: [EventBusModule],
  controllers: [AnalyticsController],
  providers: [
    KpiEngineService,
    DataWarehouseService,
    PredictiveAnalyticsService,
    DataGovernanceService,
  ],
  exports: [
    KpiEngineService,
    DataWarehouseService,
    PredictiveAnalyticsService,
    DataGovernanceService,
  ],
})
export class AnalyticsModule {}
