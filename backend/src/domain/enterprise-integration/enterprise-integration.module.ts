import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { IntegrationAuditService } from './services/integration-audit.service';
import { EnterpriseIntegrationService } from './services/enterprise-integration.service';
import { APIGatewayService } from './services/api-gateway.service';
import { ExternalConnectorService } from './services/external-connector.service';
import { InteroperabilityService } from './services/interoperability.service';
import { EventExchangeService } from './services/event-exchange.service';
import { PartnerIntegrationService } from './services/partner-integration.service';
import { IntegrationGovernanceService } from './services/integration-governance.service';
import { IntegrationMonitoringService } from './services/integration-monitoring.service';
import { IntegrationSecurityService } from './services/integration-security.service';

// Controller
import { EnterpriseIntegrationController } from './controllers/enterprise-integration.controller';

/**
 * EnterpriseIntegrationModule — Prompt 166 (EIIP)
 *
 * Enterprise Integration, Interoperability & Digital Ecosystem Platform
 * (Fase XVI — Instituto Ser Melhor).
 *
 * Hub central de integração corporativa, API Gateway, barramento de eventos,
 * gestão de parceiros, interoperabilidade e mTLS.
 *
 * Integra-se com: SocialImpactModule (P165), AutonomousOperationsModule (P164),
 * EnterpriseReadinessModule (P163), GovernanceComplianceModule (P161).
 */
@Module({
  imports: [EventBusModule],
  controllers: [EnterpriseIntegrationController],
  providers: [
    IntegrationAuditService,
    EnterpriseIntegrationService,
    APIGatewayService,
    ExternalConnectorService,
    InteroperabilityService,
    EventExchangeService,
    PartnerIntegrationService,
    IntegrationGovernanceService,
    IntegrationMonitoringService,
    IntegrationSecurityService,
  ],
  exports: [
    IntegrationAuditService,
    EnterpriseIntegrationService,
    APIGatewayService,
    PartnerIntegrationService,
    IntegrationGovernanceService,
  ],
})
export class EnterpriseIntegrationModule {}
