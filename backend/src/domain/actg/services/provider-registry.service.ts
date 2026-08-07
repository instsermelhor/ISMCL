import { Injectable, Logger } from '@nestjs/common';
import { ICommunicationProvider } from '../interfaces/provider.interface';
import { WhatsAppBusinessConnector } from '../connectors/whatsapp-business.connector';
import { GoogleMeetConnector } from '../connectors/google-meet.connector';
import { TeamsConnector } from '../connectors/teams.connector';
import { ChannelType } from '../dto/actg.dto';

/**
 * ProviderRegistryService — Registro dinâmico de provedores de comunicação
 *
 * Centraliza o mapeamento entre ChannelType e connector concreto.
 * Permite adicionar novos provedores (Zoom, Webex, Jitsi) sem alterar
 * a lógica do ACTGGatewayService (Open/Closed Principle).
 *
 * Referência: ADR-188
 */
@Injectable()
export class ProviderRegistryService {
  private readonly logger = new Logger(ProviderRegistryService.name);
  private readonly registry = new Map<string, ICommunicationProvider>();

  constructor(
    private readonly whatsapp: WhatsAppBusinessConnector,
    private readonly googleMeet: GoogleMeetConnector,
    private readonly teams: TeamsConnector,
  ) {
    this.register(ChannelType.WHATSAPP_BUSINESS, whatsapp);
    this.register(ChannelType.GOOGLE_MEET, googleMeet);
    this.register(ChannelType.TEAMS, teams);
    this.logger.log(`[ProviderRegistry] ${this.registry.size} provedores registrados`);
  }

  register(channelType: string, provider: ICommunicationProvider): void {
    this.registry.set(channelType, provider);
    this.logger.log(`[ProviderRegistry] Provedor registrado: ${channelType}`);
  }

  getProvider(channelType: string): ICommunicationProvider | undefined {
    return this.registry.get(channelType);
  }

  getProviderOrThrow(channelType: string): ICommunicationProvider {
    const provider = this.registry.get(channelType);
    if (!provider) {
      throw new Error(`Provedor não registrado para canal: ${channelType}`);
    }
    return provider;
  }

  listProviders(): string[] {
    return [...this.registry.keys()];
  }

  hasProvider(channelType: string): boolean {
    return this.registry.has(channelType);
  }
}
