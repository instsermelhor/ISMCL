import { Injectable, Logger } from '@nestjs/common';
import { PartnerType, RegisterPartnerDto } from '../dto/enterprise-interoperability.dto';
import { ExternalAuditService } from './external-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface InstitutionalPartnerRecord {
  partnerId: string;
  partnerCode: string;
  name: string;
  partnerType: PartnerType;
  contactEmail: string;
  allowedScopes: string[];
  targetSla: string;
  contractRef?: string;
  apiKeyHash: string;
  mTLSFingerprint?: string;
  isActive: boolean;
  registeredAt: string;
  lastActiveAt?: string;
}

/**
 * PartnerIntegrationService — Gestão de Parceiros Institucionais (P155 AEIDIP)
 *
 * Gerencia credenciais, certificados mTLS, escopos de acesso autorizados,
 * contratos e SLAs de parceiros governamentais, saúde, educação, justiça e redes assistenciais.
 */
@Injectable()
export class PartnerIntegrationService {
  private readonly logger = new Logger(PartnerIntegrationService.name);
  private partnerRegistry: Map<string, InstitutionalPartnerRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ExternalAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedPartners();
  }

  private seedPartners(): void {
    const seeds: InstitutionalPartnerRecord[] = [
      {
        partnerId: 'PTR-2026-0001',
        partnerCode: 'MINISTERIO_DA_SAUDE_SUS',
        name: 'Ministério da Saúde — Rede Nacional de Dados em Saúde (RNDS)',
        partnerType: PartnerType.HEALTHCARE_PROVIDER,
        contactEmail: 'rnds-integrator@saude.gov.br',
        allowedScopes: ['fhir_r4_clinical_notes', 'immunization_records', 'prescriptions'],
        targetSla: '99.9%',
        contractRef: 'CNPJ: 00.394.544/0001-51',
        apiKeyHash: 'hash_sha256_key_sus_rnds_prod_2026',
        mTLSFingerprint: 'SHA256:A1:B2:C3:D4:E5:F6:78:90:12:34',
        isActive: true,
        registeredAt: new Date().toISOString(),
      },
      {
        partnerId: 'PTR-2026-0002',
        partnerCode: 'SUAS_CADUNICO_SOCIAL',
        name: 'Secretaria Nacional de Assistência Social (SUAS / CadÚnico)',
        partnerType: PartnerType.SOCIAL_ASSISTANCE,
        contactEmail: 'suas-integracao@mds.gov.br',
        allowedScopes: ['vulnerability_score', 'social_benefit_eligibility'],
        targetSla: '99.5%',
        contractRef: 'ACORDO-COOP-SUAS-2026',
        apiKeyHash: 'hash_sha256_key_suas_cadunico_2026',
        isActive: true,
        registeredAt: new Date().toISOString(),
      },
    ];

    for (const p of seeds) {
      this.partnerRegistry.set(p.partnerCode, p);
    }
  }

  async registerPartner(dto: RegisterPartnerDto): Promise<InstitutionalPartnerRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const partnerId = `PTR-${year}-${seq}`;

    // Gera chave fictícia e hash SHA-256
    const rawApiKey = `aura_live_${seq}_${Date.now()}`;
    const apiKeyHash = require('crypto').createHash('sha256').update(rawApiKey).digest('hex');

    const record: InstitutionalPartnerRecord = {
      partnerId,
      partnerCode: dto.partnerCode,
      name: dto.name,
      partnerType: dto.partnerType,
      contactEmail: dto.contactEmail,
      allowedScopes: dto.allowedScopes,
      targetSla: dto.targetSla ?? '99.5%',
      contractRef: dto.contractRef,
      apiKeyHash,
      isActive: true,
      registeredAt: new Date().toISOString(),
    };

    this.partnerRegistry.set(dto.partnerCode, record);

    await this.auditService.recordAudit({
      serviceName: 'partner-integration-service',
      actionName: 'PartnerRegistered',
      partnerCode: dto.partnerCode,
      details: { partnerId, name: dto.name, type: dto.partnerType, scopes: dto.allowedScopes },
    });

    await this.eventBus.publish(
      'aura.interoperability.partner.registered.v1',
      { partnerId, partnerCode: dto.partnerCode, name: dto.name, partnerType: dto.partnerType },
      this.SYSTEM_TENANT,
      { subject: partnerId },
    );

    this.logger.log(`[PartnerIntegration] Registered: ${dto.partnerCode} (${dto.name})`);
    return record;
  }

  getPartner(partnerCode: string): InstitutionalPartnerRecord | undefined {
    return this.partnerRegistry.get(partnerCode);
  }

  listPartners(type?: PartnerType): InstitutionalPartnerRecord[] {
    const all = Array.from(this.partnerRegistry.values());
    return type ? all.filter((p) => p.partnerType === type) : all;
  }

  validatePartnerAccess(partnerCode: string, requestedScope: string): boolean {
    const partner = this.partnerRegistry.get(partnerCode);
    if (!partner || !partner.isActive) return false;
    return partner.allowedScopes.includes(requestedScope) || partner.allowedScopes.includes('*');
  }
}
