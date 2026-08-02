import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { CognitiveOrchestrationModule } from '../cognitive-orchestration/cognitive-orchestration.module';
import { AutonomousEvolutionModule } from '../autonomous-evolution/autonomous-evolution.module';
import { ArchitectureGovernanceModule } from '../architecture-governance/architecture-governance.module';
import { EnterpriseInteroperabilityController } from './controllers/enterprise-interoperability.controller';
import { EnterpriseIntegrationService } from './services/enterprise-integration.service';
import { ApiGatewayManagementService } from './services/api-gateway-management.service';
import { ExternalConnectorService } from './services/external-connector.service';
import { InteroperabilityHubService } from './services/interoperability-hub.service';
import { ConsentManagementService } from './services/consent-management.service';
import { DataExchangeService } from './services/data-exchange.service';
import { PartnerIntegrationService } from './services/partner-integration.service';
import { IntegrationMonitoringService } from './services/integration-monitoring.service';
import { IntegrationGovernanceService } from './services/integration-governance.service';
import { ExternalAuditService } from './services/external-audit.service';

/**
 * EnterpriseInteroperabilityModule — Plataforma Corporativa de Interoperabilidade (P155 AEIDIP)
 *
 * Integra os 10 microsserviços da Fase VI do Projeto Aura:
 * 1. EnterpriseIntegrationService     — Orquestrador End-to-End & Resiliência
 * 2. ApiGatewayManagementService       — API Gateway Corporativo
 * 3. ExternalConnectorService          — Conectores Especializados (SUS, SUAS, ICP-Brasil, etc.)
 * 4. InteroperabilityHubService        — Hub Multi-Protocolo (REST, GraphQL, gRPC, Webhooks, Kafka)
 * 5. ConsentManagementService          — Gestão de Consentimento LGPD
 * 6. DataExchangeService               — Intercâmbio Seguro de Dados
 * 7. PartnerIntegrationService         — Gestão de Parceiros & SLAs
 * 8. IntegrationMonitoringService      — Monitoramento & Alertas em Tempo Real
 * 9. IntegrationGovernanceService      — Governança Automatizada
 * 10. ExternalAuditService             — Trilhas Imutáveis SHA-256
 *
 * Referências: P109 (AEIP), P147 (AEIP), P155 (AEIDIP), ADR-155
 */
@Module({
  imports: [
    EventBusModule,
    CognitiveOrchestrationModule,
    AutonomousEvolutionModule,
    ArchitectureGovernanceModule,
  ],
  controllers: [EnterpriseInteroperabilityController],
  providers: [
    EnterpriseIntegrationService,
    ApiGatewayManagementService,
    ExternalConnectorService,
    InteroperabilityHubService,
    ConsentManagementService,
    DataExchangeService,
    PartnerIntegrationService,
    IntegrationMonitoringService,
    IntegrationGovernanceService,
    ExternalAuditService,
  ],
  exports: [
    EnterpriseIntegrationService,
    ApiGatewayManagementService,
    ExternalConnectorService,
    InteroperabilityHubService,
    ConsentManagementService,
    DataExchangeService,
    PartnerIntegrationService,
    IntegrationMonitoringService,
    IntegrationGovernanceService,
    ExternalAuditService,
  ],
})
export class EnterpriseInteroperabilityModule {}
