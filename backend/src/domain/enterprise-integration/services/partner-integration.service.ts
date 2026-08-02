import { Injectable, Logger } from '@nestjs/common';
import { PartnerType, RegisterPartnerDto } from '../dto/enterprise-integration.dto';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface PartnerRecord {
  partnerId: string;
  partnerName: string;
  partnerType: PartnerType;
  contactEmail: string;
  isCredentialed: boolean;
  slaTargetPercent: number;
  maxRequestsPerMinute: number;
  registeredAt: string;
}

/**
 * PartnerIntegrationService — Gestão de Parceiros Institucionais (P166 EIIP)
 *
 * Gerencia o cadastro, credenciamento, contratos, escopos, SLAs e isolamento
 * lógico de parceiros governamentais, saúde, bancários e ONGs.
 */
@Injectable()
export class PartnerIntegrationService {
  private readonly logger = new Logger(PartnerIntegrationService.name);
  private partnerStore: Map<string, PartnerRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedPartners();
  }

  private seedPartners(): void {
    const seed: PartnerRecord = {
      partnerId: 'PARTNER-MDS-01',
      partnerName: 'Ministério do Desenvolvimento Social (MDS)',
      partnerType: PartnerType.GOVERNMENTAL,
      contactEmail: 'suporte@mds.gov.br',
      isCredentialed: true,
      slaTargetPercent: 99.9,
      maxRequestsPerMinute: 1000,
      registeredAt: new Date().toISOString(),
    };
    this.partnerStore.set(seed.partnerId, seed);
  }

  async registerPartner(dto: RegisterPartnerDto): Promise<PartnerRecord> {
    const partnerId = `PARTNER-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const record: PartnerRecord = {
      partnerId,
      partnerName: dto.partnerName,
      partnerType: dto.partnerType,
      contactEmail: dto.contactEmail,
      isCredentialed: true,
      slaTargetPercent: dto.slaPolicy?.targetSlaPercent ?? 99.5,
      maxRequestsPerMinute: dto.slaPolicy?.maxRequestsPerMinute ?? 500,
      registeredAt: new Date().toISOString(),
    };

    this.partnerStore.set(partnerId, record);

    await this.auditService.recordAudit('REGISTER_PARTNER', dto.partnerName, 'CInO', {
      partnerId, partnerType: dto.partnerType,
    });

    await this.eventBus.publish(
      'aura.integration.external.partner.registered.v1',
      { partnerId, partnerName: dto.partnerName, partnerType: dto.partnerType },
      this.SYSTEM_TENANT,
      { subject: partnerId },
    );

    this.logger.log(`[PartnerIntegration] Registered partner ${partnerId} ("${dto.partnerName}")`);
    return record;
  }

  listPartners(): PartnerRecord[] {
    return Array.from(this.partnerStore.values());
  }
}
