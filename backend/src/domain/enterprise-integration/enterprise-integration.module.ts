import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

import { IntegrationAuditService } from './services/integration-audit.service';
import { EnterpriseIntegrationService } from './services/enterprise-integration.service';
import { APIGatewayService } from './services/api-gateway.service';
import { APILifecycleService } from './services/api-lifecycle.service';
import { EventMeshService } from './services/event-mesh.service';
import { ServiceMeshService } from './services/service-mesh.service';
import { IntegrationCatalogService } from './services/integration-catalog.service';
import { WebhookManagementService } from './services/webhook-management.service';
import { ExternalConnectorService } from './services/external-connector.service';
import { PartnerIntegrationService } from './services/partner-integration.service';

import { EnterpriseIntegrationController } from './controllers/enterprise-integration.controller';

/**
 * EnterpriseIntegrationModule — P176 EIEMP (Fase XXVI)
 *
 * Plataforma Corporativa de Integração, API Economy e Event Mesh.
 * Transforma a Plataforma Aura em um ecossistema aberto, interoperável e extensível,
 * pronto para integrar sistemas governamentais, parceiros e organizações do terceiro setor.
 *
 * Componentes:
 * - IntegrationAuditService      — Trilha imutável SHA-256
 * - EnterpriseIntegrationService — Health report e visão executiva da plataforma
 * - APIGatewayService            — Gateway corporativo (auth, rate limit, cache, auditoria)
 * - APILifecycleService          — Ciclo de vida de APIs (Draft → Published → Deprecated)
 * - EventMeshService             — Event Mesh para comunicação assíncrona (CloudEvents)
 * - ServiceMeshService           — Descoberta de serviços, mTLS e circuit breakers
 * - IntegrationCatalogService    — Catálogo corporativo com busca avançada
 * - WebhookManagementService     — Gestão de webhooks com retries e histórico
 * - ExternalConnectorService     — Conectores externos (Gov.br, ERP, IA, Saúde)
 * - PartnerIntegrationService    — Portal de Parceiros com sandbox e credenciais
 */
@Module({
  imports: [EventBusModule],
  providers: [
    IntegrationAuditService,
    EnterpriseIntegrationService,
    APIGatewayService,
    APILifecycleService,
    EventMeshService,
    ServiceMeshService,
    IntegrationCatalogService,
    WebhookManagementService,
    ExternalConnectorService,
    PartnerIntegrationService,
  ],
  controllers: [EnterpriseIntegrationController],
  exports: [
    IntegrationAuditService,
    EnterpriseIntegrationService,
    APIGatewayService,
    APILifecycleService,
    EventMeshService,
    ServiceMeshService,
    IntegrationCatalogService,
    WebhookManagementService,
    ExternalConnectorService,
    PartnerIntegrationService,
  ],
})
export class EnterpriseIntegrationModule {}
