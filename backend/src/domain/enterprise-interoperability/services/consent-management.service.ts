import { Injectable, Logger } from '@nestjs/common';
import { ConsentStatus, CreateConsentDto, RevokeConsentDto } from '../dto/enterprise-interoperability.dto';
import { ExternalAuditService } from './external-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ConsentRecord {
  consentId: string;
  tenantId: string;
  beneficiaryId: string;
  partnerCode: string;
  purpose: string;
  allowedDataScope: string[];
  status: ConsentStatus;
  validUntil: string;
  legalTermsRef?: string;
  grantedAt: string;
  revokedAt?: string;
  revocationReason?: string;
}

/**
 * ConsentManagementService — Gerenciamento de Consentimento LGPD (P155 AEIDIP)
 *
 * Controla registro, consulta, renovação e revogação de consentimentos para
 * compartilhamento de dados com parceiros externos e órgãos governamentais.
 * Bloqueia qualquer compartilhamento de dados pessoais se o consentimento for inválido/ausente.
 */
@Injectable()
export class ConsentManagementService {
  private readonly logger = new Logger(ConsentManagementService.name);
  private consentStore: Map<string, ConsentRecord> = new Map();

  constructor(
    private readonly auditService: ExternalAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedConsent();
  }

  private seedConsent(): void {
    const seed: ConsentRecord = {
      consentId: 'CNS-2026-0001',
      tenantId: 'TENANT-001',
      beneficiaryId: 'BEN-2026-0001',
      partnerCode: 'MINISTERIO_DA_SAUDE_SUS',
      purpose: 'Compartilhamento de histórico de imunização e consultas no SUS',
      allowedDataScope: ['ehr_summary', 'prescriptions', 'vaccines'],
      status: ConsentStatus.GRANTED,
      validUntil: '2027-12-31T23:59:59Z',
      legalTermsRef: 'TERMO-CONSENT-LGPD-2026-V1',
      grantedAt: new Date().toISOString(),
    };
    this.consentStore.set(seed.consentId, seed);
  }

  async grantConsent(dto: CreateConsentDto): Promise<ConsentRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const consentId = `CNS-${year}-${seq}`;

    const record: ConsentRecord = {
      consentId,
      tenantId: dto.tenantId,
      beneficiaryId: dto.beneficiaryId,
      partnerCode: dto.partnerCode,
      purpose: dto.purpose,
      allowedDataScope: dto.allowedDataScope,
      status: ConsentStatus.GRANTED,
      validUntil: dto.validUntil,
      legalTermsRef: dto.legalTermsRef ?? 'TERMO-LGPD-STANDARD-v1',
      grantedAt: new Date().toISOString(),
    };

    this.consentStore.set(consentId, record);

    await this.auditService.recordAudit({
      serviceName: 'consent-management-service',
      actionName: 'ConsentGranted',
      partnerCode: dto.partnerCode,
      details: { consentId, beneficiaryId: dto.beneficiaryId, scope: dto.allowedDataScope, validUntil: dto.validUntil },
    });

    await this.eventBus.publish(
      'aura.interoperability.consent.granted.v1',
      { consentId, beneficiaryId: dto.beneficiaryId, partnerCode: dto.partnerCode, scope: dto.allowedDataScope },
      dto.tenantId,
      { subject: consentId },
    );

    this.logger.log(`[ConsentManagement] Granted: ${consentId} for ${dto.beneficiaryId} → ${dto.partnerCode}`);
    return record;
  }

  async revokeConsent(dto: RevokeConsentDto): Promise<ConsentRecord> {
    const record = this.consentStore.get(dto.consentId);
    if (!record) {
      throw new Error(`Registro de consentimento não encontrado: ${dto.consentId}`);
    }

    record.status = ConsentStatus.REVOKED;
    record.revokedAt = new Date().toISOString();
    record.revocationReason = dto.revocationReason;

    await this.auditService.recordAudit({
      serviceName: 'consent-management-service',
      actionName: 'ConsentRevoked',
      partnerCode: record.partnerCode,
      details: { consentId: dto.consentId, requestedBy: dto.requestedBy, reason: dto.revocationReason },
    });

    await this.eventBus.publish(
      'aura.interoperability.consent.revoked.v1',
      { consentId: dto.consentId, beneficiaryId: record.beneficiaryId, partnerCode: record.partnerCode, reason: dto.revocationReason },
      record.tenantId,
      { subject: dto.consentId },
    );

    this.logger.log(`[ConsentManagement] Revoked: ${dto.consentId} (Reason: ${dto.revocationReason})`);
    return record;
  }

  validateConsent(beneficiaryId: string, partnerCode: string, requestedScope: string): boolean {
    for (const record of this.consentStore.values()) {
      if (
        record.beneficiaryId === beneficiaryId &&
        record.partnerCode === partnerCode &&
        record.status === ConsentStatus.GRANTED &&
        new Date(record.validUntil) > new Date()
      ) {
        if (record.allowedDataScope.includes(requestedScope) || record.allowedDataScope.includes('*')) {
          return true;
        }
      }
    }
    return false;
  }

  getConsent(consentId: string): ConsentRecord | undefined {
    return this.consentStore.get(consentId);
  }

  listConsents(beneficiaryId?: string): ConsentRecord[] {
    const all = Array.from(this.consentStore.values());
    return beneficiaryId ? all.filter((c) => c.beneficiaryId === beneficiaryId) : all;
  }
}
