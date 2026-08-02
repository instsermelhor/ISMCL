import { Injectable, Logger } from '@nestjs/common';
import {
  EstablishFederationDto,
  FederationTrustLevel,
} from '../dto/federated-multi-tenant.dto';
import { FederationAuditService } from './federation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export type FederationStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface FederationLink {
  federationId: string;
  sourceTenantId: string;
  targetTenantId: string;
  trustLevel: FederationTrustLevel;
  status: FederationStatus;
  agreementDetails: string;
  establishedAt: string;
  expiresAt?: string;
  lastReviewedAt: string;
  dataFlowPolicy: Record<string, any>;
}

/**
 * FederationGovernanceService — P167 FMIP
 *
 * Gerencia as relações de federação entre tenants:
 * estabelecimento, revisão, revogação e monitoramento de vínculos.
 * Toda troca de dados só é permitida se um link de federação ativo existir.
 */
@Injectable()
export class FederationGovernanceService {
  private readonly logger = new Logger(FederationGovernanceService.name);
  private readonly federationLinks: Map<string, FederationLink> = new Map();

  constructor(
    private readonly auditSvc: FederationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async establishFederation(dto: EstablishFederationDto, requestedBy = 'SYSTEM'): Promise<FederationLink> {
    const federationId = `FED-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    const now = new Date().toISOString();

    const dataFlowPolicy = this.buildDataFlowPolicy(dto.trustLevel);

    const link: FederationLink = {
      federationId,
      sourceTenantId: dto.sourceTenantId,
      targetTenantId: dto.targetTenantId,
      trustLevel: dto.trustLevel,
      status: 'PENDING_APPROVAL',
      agreementDetails: dto.agreementDetails ?? '',
      establishedAt: now,
      lastReviewedAt: now,
      dataFlowPolicy,
    };

    this.federationLinks.set(federationId, link);

    await this.auditSvc.recordAudit('FEDERATION_ESTABLISHED', dto.sourceTenantId, requestedBy, {
      federationId,
      targetTenantId: dto.targetTenantId,
      trustLevel: dto.trustLevel,
    });

    await this.eventBus.publish(
      'aura.federation.established.pending.v1',
      { federationId, sourceTenantId: dto.sourceTenantId, targetTenantId: dto.targetTenantId },
      'FMIP',
      { subject: federationId },
    );

    this.logger.log(
      `[FederationGovernance] Federação "${federationId}" criada entre "${dto.sourceTenantId}" e "${dto.targetTenantId}" (${dto.trustLevel}).`,
    );
    return link;
  }

  async approveFederation(federationId: string, approvedBy: string): Promise<FederationLink> {
    const link = this.getLinkOrThrow(federationId);
    link.status = 'ACTIVE';
    link.lastReviewedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('FEDERATION_APPROVED', link.sourceTenantId, approvedBy, { federationId });
    await this.eventBus.publish('aura.federation.approved.v1', { federationId }, 'FMIP', { subject: federationId });
    this.logger.log(`[FederationGovernance] Federação "${federationId}" aprovada.`);
    return link;
  }

  async revokeFederation(federationId: string, reason: string, revokedBy: string): Promise<FederationLink> {
    const link = this.getLinkOrThrow(federationId);
    link.status = 'REVOKED';
    link.lastReviewedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('FEDERATION_REVOKED', link.sourceTenantId, revokedBy, { federationId, reason });
    await this.eventBus.publish('aura.federation.revoked.v1', { federationId, reason }, 'FMIP', { subject: federationId });
    this.logger.warn(`[FederationGovernance] Federação "${federationId}" revogada: ${reason}`);
    return link;
  }

  getFederation(federationId: string): FederationLink | undefined {
    return this.federationLinks.get(federationId);
  }

  listFederations(tenantId?: string): FederationLink[] {
    const links = Array.from(this.federationLinks.values());
    if (!tenantId) return links;
    return links.filter((l) => l.sourceTenantId === tenantId || l.targetTenantId === tenantId);
  }

  isDataFlowPermitted(sourceTenantId: string, targetTenantId: string, dataCategory: string): boolean {
    const active = Array.from(this.federationLinks.values()).find(
      (l) =>
        l.status === 'ACTIVE' &&
        ((l.sourceTenantId === sourceTenantId && l.targetTenantId === targetTenantId) ||
          (l.sourceTenantId === targetTenantId && l.targetTenantId === sourceTenantId)),
    );
    if (!active) return false;
    const allowedCategories: string[] = active.dataFlowPolicy['allowedCategories'] ?? [];
    return allowedCategories.includes(dataCategory) || allowedCategories.includes('ALL');
  }

  private buildDataFlowPolicy(trustLevel: FederationTrustLevel): Record<string, any> {
    const policies: Record<FederationTrustLevel, Record<string, any>> = {
      [FederationTrustLevel.NONE]: { allowedCategories: [], requiresConsent: true },
      [FederationTrustLevel.LIMITED_REFERRAL_ONLY]: {
        allowedCategories: ['REFERRAL_METADATA', 'ANONYMIZED_NEED'],
        requiresConsent: true,
        lgpdBasis: 'LEGITIMATE_INTEREST',
      },
      [FederationTrustLevel.FULL_DATA_SHARING]: {
        allowedCategories: ['ALL'],
        requiresConsent: true,
        requiresDataProcessingAgreement: true,
        lgpdBasis: 'CONTRACT',
      },
      [FederationTrustLevel.CUSTOM_POLICY]: {
        allowedCategories: [],
        requiresConsent: true,
        customPolicyRequired: true,
      },
    };
    return policies[trustLevel] ?? { allowedCategories: [] };
  }

  private getLinkOrThrow(federationId: string): FederationLink {
    const l = this.federationLinks.get(federationId);
    if (!l) throw new Error(`Federação "${federationId}" não encontrada.`);
    return l;
  }
}
