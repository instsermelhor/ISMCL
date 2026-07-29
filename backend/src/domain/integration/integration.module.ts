import { Module } from '@nestjs/common';
import { IntegrationController } from './controllers/integration.controller';
import { IntegrationHubService } from './services/integration-hub.service';
import { ApiWebhookManagementService } from './services/api-webhook-management.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * IntegrationModule — Plataforma Corporativa de Integração, Interoperabilidade e Gerenciamento de APIs (AEIP)
 *
 * Integra:
 * - IntegrationHubService (Hub Central de Integração + Framework de Conectores + Motor de Sincronização + Governança)
 * - ApiWebhookManagementService (API Management APIM + Webhook Platform com HMAC SHA-256 + Métricas)
 *
 * Referências: P109 AEIP, P147 AEIP
 */
@Module({
  imports: [EventBusModule],
  controllers: [IntegrationController],
  providers: [
    IntegrationHubService,
    ApiWebhookManagementService,
  ],
  exports: [
    IntegrationHubService,
    ApiWebhookManagementService,
  ],
})
export class IntegrationModule {}
