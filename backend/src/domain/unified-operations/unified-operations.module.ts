import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { UnifiedOperationsService } from './services/unified-operations.service';
import { EnterpriseObservabilityService } from './services/enterprise-observability.service';
import { AiOpsIntelligenceService } from './services/ai-ops-intelligence.service';
import { IncidentManagementService } from './services/incident-management.service';
import { ServiceHealthMonitoringService } from './services/service-health-monitoring.service';
import { PredictiveFailureAnalysisService } from './services/predictive-failure-analysis.service';
import { BusinessObservabilityService } from './services/business-observability.service';
import { ResilienceManagementService } from './services/resilience-management.service';
import { OperationalAutomationService } from './services/operational-automation.service';
import { SreGovernanceService } from './services/sre-governance.service';
import { UnifiedOperationsController } from './controllers/unified-operations.controller';

/**
 * UnifiedOperationsModule — Fase VII · Prompt 156 (AUOC)
 *
 * Centro Unificado de Operações, Observabilidade, AIOps e Resiliência da Plataforma Aura.
 * Integra 10 microsserviços desacoplados com orientação a eventos (CloudEvents v1.0.3).
 */
@Module({
  imports: [EventBusModule],
  controllers: [UnifiedOperationsController],
  providers: [
    SreGovernanceService,
    EnterpriseObservabilityService,
    AiOpsIntelligenceService,
    IncidentManagementService,
    ServiceHealthMonitoringService,
    PredictiveFailureAnalysisService,
    BusinessObservabilityService,
    ResilienceManagementService,
    OperationalAutomationService,
    UnifiedOperationsService,
  ],
  exports: [
    UnifiedOperationsService,
    EnterpriseObservabilityService,
    AiOpsIntelligenceService,
    IncidentManagementService,
    ServiceHealthMonitoringService,
    PredictiveFailureAnalysisService,
    BusinessObservabilityService,
    ResilienceManagementService,
    OperationalAutomationService,
    SreGovernanceService,
  ],
})
export class UnifiedOperationsModule {}
