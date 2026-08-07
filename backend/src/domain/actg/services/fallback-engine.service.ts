import { Injectable, Logger } from '@nestjs/common';
import { ChannelType } from '../dto/actg.dto';
import { ProviderRegistryService } from './provider-registry.service';
import { ProviderHealthService } from './provider-health.service';

export interface FallbackPolicy {
  /** Canal preferencial do beneficiário */
  beneficiaryPreferredChannel?: ChannelType;
  /** Canais alternativos aceitos */
  fallbackChannels: ChannelType[];
  /** Nível MCSI do caso (0-4) — nivéis 3-4 não permitem fallback automático */
  mcsiLevel: number;
  /** Política institucional — se false, fallback automático bloqueado */
  allowAutoFallback: boolean;
  /** Especialidade/tipo de atendimento */
  appointmentType?: string;
}

export interface FallbackResult {
  selectedChannel: ChannelType;
  isFallback: boolean;
  originalChannel: ChannelType;
  reason: string;
}

/**
 * FallbackEngineService — Motor de Fallback Inteligente do ACTG
 *
 * Seleciona o canal de comunicação mais adequado quando o canal primário
 * está indisponível, respeitando:
 * - Preferências do beneficiário
 * - Disponibilidade dos provedores (via ProviderHealthService)
 * - Políticas institucionais
 * - Classificação MCSI do caso (níveis 3-4 nunca têm canal alterado automaticamente)
 *
 * REGRA CRÍTICA: Atendimentos com MCSI nível 3 ou 4 NUNCA terão o canal
 * alterado automaticamente. O sistema registra o incidente e notifica a equipe
 * para decisão manual.
 *
 * Referência: ADR-188, Prompt 188 — Item 14
 */
@Injectable()
export class FallbackEngineService {
  private readonly logger = new Logger(FallbackEngineService.name);

  constructor(
    private readonly providerRegistry: ProviderRegistryService,
    private readonly providerHealth: ProviderHealthService,
  ) {}

  /**
   * Determina o canal mais adequado com base na política de fallback.
   */
  async selectChannel(
    requestedChannel: ChannelType,
    policy: FallbackPolicy,
  ): Promise<FallbackResult> {
    const primaryHealthy = await this.isChannelHealthy(requestedChannel);

    if (primaryHealthy) {
      return {
        selectedChannel: requestedChannel,
        isFallback: false,
        originalChannel: requestedChannel,
        reason: 'Canal primário disponível',
      };
    }

    this.logger.warn(`[Fallback] Canal ${requestedChannel} indisponível — avaliando fallback`);

    if (policy.mcsiLevel >= 3) {
      this.logger.warn(`[Fallback] MCSI Nível ${policy.mcsiLevel} — fallback automático BLOQUEADO. Requer decisão institucional.`);
      return {
        selectedChannel: requestedChannel,
        isFallback: false,
        originalChannel: requestedChannel,
        reason: `Fallback bloqueado: MCSI nível ${policy.mcsiLevel} requer aprovação institucional`,
      };
    }

    if (!policy.allowAutoFallback) {
      this.logger.warn('[Fallback] Política institucional: fallback automático desabilitado');
      return {
        selectedChannel: requestedChannel,
        isFallback: false,
        originalChannel: requestedChannel,
        reason: 'Política institucional: fallback automático desabilitado',
      };
    }

    if (requestedChannel === ChannelType.IN_PERSON || requestedChannel === ChannelType.PHONE) {
      return {
        selectedChannel: requestedChannel,
        isFallback: false,
        originalChannel: requestedChannel,
        reason: 'Canal presencial/telefone não requer fallback de provedor',
      };
    }

    const candidates = [
      ...(policy.beneficiaryPreferredChannel && policy.beneficiaryPreferredChannel !== requestedChannel
        ? [policy.beneficiaryPreferredChannel]
        : []),
      ...policy.fallbackChannels.filter((c) => c !== requestedChannel),
    ];

    for (const candidate of candidates) {
      if (!this.providerRegistry.hasProvider(candidate)) continue;
      const healthy = await this.isChannelHealthy(candidate);
      if (healthy) {
        this.logger.log(`[Fallback] ✅ Canal alternativo selecionado: ${candidate}`);
        return {
          selectedChannel: candidate,
          isFallback: true,
          originalChannel: requestedChannel,
          reason: `Fallback de ${requestedChannel} para ${candidate}`,
        };
      }
    }

    this.logger.error('[Fallback] Todos os canais alternativos indisponíveis');
    return {
      selectedChannel: requestedChannel,
      isFallback: false,
      originalChannel: requestedChannel,
      reason: 'Todos os canais alternativos indisponíveis — incidente registrado',
    };
  }

  private async isChannelHealthy(channel: ChannelType): Promise<boolean> {
    if (
      channel === ChannelType.IN_PERSON ||
      channel === ChannelType.PHONE ||
      channel === ChannelType.HYBRID
    ) {
      return true;
    }

    const provider = this.providerRegistry.getProvider(channel);
    if (!provider) return false;

    try {
      const health = await this.providerHealth.getLastStatus(channel);
      return health?.status === 'ONLINE' || health?.status === 'DEGRADED';
    } catch {
      return false;
    }
  }
}
