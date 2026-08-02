import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { DigitalTwinCoreService } from './services/digital-twin-core.service';
import { OrganizationalSimulationService } from './services/organizational-simulation.service';
import { StrategicScenarioModelingService } from './services/strategic-scenario-modeling.service';
import { ImpactAnalysisService } from './services/impact-analysis.service';
import { PredictiveSimulationService } from './services/predictive-simulation.service';
import { ResourceOptimizationService } from './services/resource-optimization.service';
import { InstitutionalForecastService } from './services/institutional-forecast.service';
import { TwinSynchronizationService } from './services/twin-synchronization.service';
import { ExecutiveSimulationDashboardService } from './services/executive-simulation-dashboard.service';
import { DigitalTwinGovernanceService } from './services/digital-twin-governance.service';
import { DigitalTwinController } from './controllers/digital-twin.controller';

/**
 * DigitalTwinModule — Fase VIII · Prompt 157 (ADT)
 *
 * Digital Twin Organizacional, Plataforma de Simulação Estratégica e
 * Modelagem Institucional da Plataforma Aura. Composto por 10 microsserviços
 * desacoplados com orientação a eventos (CloudEvents v1.0.3).
 */
@Module({
  imports: [EventBusModule],
  controllers: [DigitalTwinController],
  providers: [
    DigitalTwinGovernanceService,
    DigitalTwinCoreService,
    OrganizationalSimulationService,
    StrategicScenarioModelingService,
    ImpactAnalysisService,
    PredictiveSimulationService,
    ResourceOptimizationService,
    InstitutionalForecastService,
    TwinSynchronizationService,
    ExecutiveSimulationDashboardService,
  ],
  exports: [
    DigitalTwinCoreService,
    OrganizationalSimulationService,
    StrategicScenarioModelingService,
    ImpactAnalysisService,
    PredictiveSimulationService,
    ResourceOptimizationService,
    InstitutionalForecastService,
    TwinSynchronizationService,
    ExecutiveSimulationDashboardService,
    DigitalTwinGovernanceService,
  ],
})
export class DigitalTwinModule {}
