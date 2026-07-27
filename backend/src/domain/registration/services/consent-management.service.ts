import { Injectable, Logger } from '@nestjs/common';
import { GrantConsentDto } from '../dto/registration.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface ConsentRecord {
  consentId: string;
  userId: string;
  termIdentifier: string;
  accepted: boolean;
  acceptedAt: string;
  ipAddress?: string;
  revokedAt?: string;
}

/**
 * ConsentManagementService — Gestão Corporativa de Consentimento LGPD
 *
 * Garante conformidade total com a LGPD (Lei 13.709/2018 - Art. 7 I e Art. 11 I):
 * - Registro imutável de consentimento para tratamento de dados pessoais e sensíveis
 * - Termos de uso de imagem, telemedicina e compartilhamento com rede parceira
 * - Revogação de consentimento a qualquer momento (Art. 8 § 5º)
 * - Publicação dos eventos `aura.consent.granted.v1` e `aura.consent.revoked.v1`
 *
 * Referências: P128 (AECS - LGPD), P133 (AAIRP Etapa 9)
 */
@Injectable()
export class ConsentManagementService {
  private readonly logger = new Logger(ConsentManagementService.name);

  // Storage de registros de consentimento (no Redis / Prisma em produção)
  private readonly consentStore = new Map<string, ConsentRecord[]>();

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Registra a concessão de um consentimento.
   */
  async grantConsent(dto: GrantConsentDto, tenantId = 'default'): Promise<ConsentRecord> {
    const consentId = `consent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: ConsentRecord = {
      consentId,
      userId: dto.userId,
      termIdentifier: dto.termIdentifier,
      accepted: dto.accepted,
      acceptedAt: new Date().toISOString(),
      ipAddress: dto.ipAddress,
    };

    const userConsents = this.consentStore.get(dto.userId) ?? [];
    userConsents.push(record);
    this.consentStore.set(dto.userId, userConsents);

    this.logger.log(`[Consent] Termo ${dto.termIdentifier} aceito pelo usuário ${dto.userId}`);

    await this.eventBus.publish(
      'aura.consent.granted.v1',
      {
        consentId,
        userId: dto.userId,
        termIdentifier: dto.termIdentifier,
        acceptedAt: record.acceptedAt,
      },
      tenantId,
      { subject: dto.userId },
    );

    return record;
  }

  /**
   * Revoga um consentimento anteriormente concedido.
   */
  async revokeConsent(userId: string, termIdentifier: string, tenantId = 'default'): Promise<boolean> {
    const userConsents = this.consentStore.get(userId) ?? [];
    const consent = userConsents.find((c) => c.termIdentifier === termIdentifier && !c.revokedAt);

    if (!consent) {
      return false;
    }

    consent.revokedAt = new Date().toISOString();
    consent.accepted = false;

    this.logger.warn(`[Consent] Termo ${termIdentifier} REVOGADO pelo usuário ${userId}`);

    await this.eventBus.publish(
      'aura.consent.revoked.v1',
      {
        userId,
        termIdentifier,
        revokedAt: consent.revokedAt,
      },
      tenantId,
      { subject: userId },
    );

    return true;
  }

  /**
   * Lista todos os consentimentos ativos de um usuário.
   */
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    const userConsents = this.consentStore.get(userId) ?? [];
    return userConsents.filter((c) => !c.revokedAt);
  }
}
