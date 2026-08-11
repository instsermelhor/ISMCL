import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { EventBusModule } from '../../events/event-bus.module';
import { WhatsAppBusinessConnector } from './connectors/whatsapp-business.connector';
import { GoogleMeetConnector } from './connectors/google-meet.connector';
import { TeamsConnector } from './connectors/teams.connector';
import { WebRtcNativeConnector } from './connectors/webrtc-native.connector';
import { ProviderRegistryService } from './services/provider-registry.service';
import { ProviderHealthService } from './services/provider-health.service';
import { FallbackEngineService } from './services/fallback-engine.service';
import { NotificationOrchestratorService } from './services/notification-orchestrator.service';
import { PushNotificationService } from './services/push-notification.service';
import { ReminderSchedulerService } from './services/reminder-scheduler.service';
import { WebhookProcessorService } from './services/webhook-processor.service';
import { ACTGGatewayService } from './services/actg-gateway.service';
import { ACTGAdminService } from './services/actg-admin.service';
import { ACTGController } from './controllers/actg.controller';

/**
 * ActgModule — Módulo Raiz do Aura Communication & Teleattendance Gateway
 *
 * Registra todos os conectores de provedores (SaaS + WebRTC Nativo), serviços de orquestração,
 * schedulers de lembretes e controladores do ACTG.
 *
 * Referência: ADR-188, GAP-P2-01, GAP-P3-04, GAP-P3-05
 */
@Module({
  imports: [EventBusModule, CacheModule],
  providers: [
    // Conectores de Provedores
    WhatsAppBusinessConnector,
    GoogleMeetConnector,
    TeamsConnector,
    WebRtcNativeConnector,
    // Serviços Core do ACTG
    ProviderRegistryService,
    ProviderHealthService,
    FallbackEngineService,
    PushNotificationService,
    NotificationOrchestratorService,
    ReminderSchedulerService,
    WebhookProcessorService,
    ACTGGatewayService,
    ACTGAdminService,
  ],
  controllers: [ACTGController],
  exports: [
    ACTGGatewayService,
    ACTGAdminService,
    NotificationOrchestratorService,
    PushNotificationService,
    ReminderSchedulerService,
    ProviderHealthService,
    ProviderRegistryService,
    WebRtcNativeConnector,
  ],
})
export class ActgModule {}


