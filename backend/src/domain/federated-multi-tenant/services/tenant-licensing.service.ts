import { Injectable, Logger } from '@nestjs/common';
import { TenantTier } from '../dto/federated-multi-tenant.dto';
import { FederationAuditService } from './federation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export type LicenseType = 'OSC_FREE' | 'FOUNDATION_BASIC' | 'GOVERNMENTAL_PRO' | 'ENTERPRISE_FULL';
export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'PENDING';

export interface TenantLicense {
  licenseId: string;
  tenantId: string;
  licenseType: LicenseType;
  status: LicenseStatus;
  grantedAt: string;
  expiresAt?: string;
  maxBeneficiaries: number;
  maxUsers: number;
  allowedModules: string[];
  commercialTerms: Record<string, any>;
}

/**
 * TenantLicensingService — P167 FMIP
 *
 * Gerencia licenças comerciais e de uso para cada tenant federado,
 * controlando limites operacionais, módulos permitidos e expiração.
 * Instituto Ser Melhor mantém soberania sobre a concessão de licenças.
 */
@Injectable()
export class TenantLicensingService {
  private readonly logger = new Logger(TenantLicensingService.name);
  private readonly licenses: Map<string, TenantLicense> = new Map();

  private readonly TIER_DEFAULTS: Record<TenantTier, Partial<TenantLicense>> = {
    [TenantTier.COMMUNITY_OSC]: {
      licenseType: 'OSC_FREE',
      maxBeneficiaries: 500,
      maxUsers: 10,
      allowedModules: ['beneficiary-management', 'case-management', 'scheduling', 'impact-reporting'],
    },
    [TenantTier.ENTERPRISE_FOUNDATION]: {
      licenseType: 'FOUNDATION_BASIC',
      maxBeneficiaries: 5000,
      maxUsers: 50,
      allowedModules: ['beneficiary-management', 'case-management', 'scheduling', 'ehr', 'analytics', 'impact-reporting', 'documents'],
    },
    [TenantTier.GOVERNMENTAL_PUBLIC]: {
      licenseType: 'GOVERNMENTAL_PRO',
      maxBeneficiaries: 50000,
      maxUsers: 200,
      allowedModules: ['beneficiary-management', 'case-management', 'scheduling', 'ehr', 'analytics', 'impact-reporting', 'documents', 'governance-lite', 'social-erp'],
    },
    [TenantTier.MAINTAINER_INSTITUTE]: {
      licenseType: 'ENTERPRISE_FULL',
      maxBeneficiaries: 999999,
      maxUsers: 999999,
      allowedModules: ['ALL'],
    },
  };

  constructor(
    private readonly auditSvc: FederationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async grantLicense(
    tenantId: string,
    tier: TenantTier,
    grantedBy = 'SYSTEM',
    expiresInDays?: number,
  ): Promise<TenantLicense> {
    const licenseId = `LIC-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    const now = new Date();
    const defaults = this.TIER_DEFAULTS[tier];

    const license: TenantLicense = {
      licenseId,
      tenantId,
      licenseType: defaults.licenseType as LicenseType,
      status: 'ACTIVE',
      grantedAt: now.toISOString(),
      expiresAt: expiresInDays
        ? new Date(now.getTime() + expiresInDays * 86400000).toISOString()
        : undefined,
      maxBeneficiaries: defaults.maxBeneficiaries!,
      maxUsers: defaults.maxUsers!,
      allowedModules: defaults.allowedModules!,
      commercialTerms: { tier, grantedBy },
    };

    this.licenses.set(tenantId, license);

    await this.auditSvc.recordAudit('LICENSE_GRANTED', tenantId, grantedBy, {
      licenseId,
      licenseType: license.licenseType,
      expiresAt: license.expiresAt,
    });

    await this.eventBus.publish(
      'aura.tenant.license.granted.v1',
      { tenantId, licenseId, licenseType: license.licenseType },
      'FMIP',
      { subject: tenantId },
    );

    this.logger.log(`[TenantLicensing] Licença "${licenseId}" concedida ao tenant "${tenantId}" (${license.licenseType}).`);
    return license;
  }

  async revokeLicense(tenantId: string, reason: string, revokedBy: string): Promise<void> {
    const lic = this.licenses.get(tenantId);
    if (!lic) throw new Error(`Nenhuma licença encontrada para tenant "${tenantId}".`);
    lic.status = 'SUSPENDED';

    await this.auditSvc.recordAudit('LICENSE_REVOKED', tenantId, revokedBy, { reason });
    await this.eventBus.publish('aura.tenant.license.revoked.v1', { tenantId, reason }, 'FMIP', { subject: tenantId });
    this.logger.warn(`[TenantLicensing] Licença do tenant "${tenantId}" revogada: ${reason}`);
  }

  getLicense(tenantId: string): TenantLicense | undefined {
    return this.licenses.get(tenantId);
  }

  listLicenses(): TenantLicense[] {
    return Array.from(this.licenses.values());
  }

  isModuleAllowed(tenantId: string, module: string): boolean {
    const lic = this.licenses.get(tenantId);
    if (!lic || lic.status !== 'ACTIVE') return false;
    return lic.allowedModules.includes('ALL') || lic.allowedModules.includes(module);
  }
}
