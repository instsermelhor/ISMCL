import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { WhatsAppBusinessConnector } from './connectors/whatsapp-business.connector';
import { GoogleMeetConnector } from './connectors/google-meet.connector';
import { TeamsConnector } from './connectors/teams.connector';
import { ProviderRegistryService } from './services/provider-registry.service';
import { ProviderHealthService } from './services/provider-health.service';
import { FallbackEngineService } from './services/fallback-engine.service';
import { NotificationOrchestratorService } from './services/notification-orchestrator.service';
import { WebhookProcessorService } from './services/webhook-processor.service';
import { ACTGGatewayService } from './services/actg-gateway.service';
import { ACTGController } from './controllers/actg.controller';

/**
 * ActgModule — Módulo Raiz do Aura Communication & Teleattendance Gateway
 *
 * Registra todos os conectores de provedores, serviços de orquestração
 * e controladores do ACTG.
 *
 * Princípio: Provedores externos são plugáveis via ProviderRegistryService.
 * Novos provedores (Zoom, Webex, Jitsi) são adicionados registrando um
 * novo conector que implementa ICommunicationProvider — sem alterar
 * o ACTGGatewayService (Open/Closed Principle).
 *
 * Referência: ADR-188
 */
@Module({
  imports: [EventBusModule],
  providers: [
    // Conectores de Provedores
    WhatsAppBusinessConnector,
    GoogleMeetConnector,
    TeamsConnector,
    // Serviços Core do ACTG
    ProviderRegistryService,
    ProviderHealthService,
    FallbackEngineService,
    NotificationOrchestratorService,
    WebhookProcessorService,
    ACTGGatewayService,
  ],
  controllers: [ACTGController],
  exports: [
    ACTGGatewayService,
    NotificationOrchestratorService,
    ProviderHealthService,
    ProviderRegistryService,
  ],
})
export class ActgModule {}
