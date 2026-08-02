import { Injectable, Logger } from '@nestjs/common';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { WhiteLabelService } from './white-label.service';
import { FederationGovernanceService } from './federation-governance.service';
import { TenantIsolationService } from './tenant-isolation.service';
import { TenantLicensingService } from './tenant-licensing.service';
import { FederationAuditService } from './federation-audit.service';

export interface FMIPDashboard {
  generatedAt: string;
  platform: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    decommissionedTenants: number;
    provisioningTenants: number;
  };
  federation: {
    totalLinks: number;
    activeLinks: number;
    pendingApproval: number;
    revokedLinks: number;
  };
  whiteLabelConfigs: number;
  licensing: {
    totalLicenses: number;
    activeLicenses: number;
    suspendedLicenses: number;
  };
  isolation: {
    averageScore: number;
    criticalTenants: number;
  };
  recentAuditEvents: number;
  maintainerTenantStatus: string;
}

/**
 * FMIPDashboardService — P167 FMIP
 *
 * Consolida visibilidade executiva de toda a plataforma federada:
 * tenants, federações, licenças, configurações white-label e scores de isolamento.
 */
@Injectable()
export class FMIPDashboardService {
  private readonly logger = new Logger(FMIPDashboardService.name);

  constructor(
    private readonly tenantSvc: TenantProvisioningService,
    private readonly whiteLabelSvc: WhiteLabelService,
    private readonly federationSvc: FederationGovernanceService,
    private readonly isolationSvc: TenantIsolationService,
    private readonly licensingSvc: TenantLicensingService,
    private readonly auditSvc: FederationAuditService,
  ) {}

  getDashboard(): FMIPDashboard {
    const tenants = this.tenantSvc.listTenants();
    const federations = this.federationSvc.listFederations();
    const licenses = this.licensingSvc.listLicenses();
    const isolationReports = this.isolationSvc.listReports();
    const auditTrail = this.auditSvc.getAuditTrail();
    const wlConfigs = this.whiteLabelSvc.listConfigs();

    const maintainer = this.tenantSvc.getTenant('ser-melhor');

    const criticalTenants = isolationReports.filter((r) => r.isolationScore < 60).length;

    const dashboard: FMIPDashboard = {
      generatedAt: new Date().toISOString(),
      platform: {
        totalTenants: tenants.length,
        activeTenants: tenants.filter((t) => t.status === 'ACTIVE').length,
        suspendedTenants: tenants.filter((t) => t.status === 'SUSPENDED').length,
        decommissionedTenants: tenants.filter((t) => t.status === 'DECOMMISSIONED').length,
        provisioningTenants: tenants.filter((t) => t.status === 'PROVISIONING').length,
      },
      federation: {
        totalLinks: federations.length,
        activeLinks: federations.filter((f) => f.status === 'ACTIVE').length,
        pendingApproval: federations.filter((f) => f.status === 'PENDING_APPROVAL').length,
        revokedLinks: federations.filter((f) => f.status === 'REVOKED').length,
      },
      whiteLabelConfigs: wlConfigs.length,
      licensing: {
        totalLicenses: licenses.length,
        activeLicenses: licenses.filter((l) => l.status === 'ACTIVE').length,
        suspendedLicenses: licenses.filter((l) => l.status === 'SUSPENDED').length,
      },
      isolation: {
        averageScore: this.isolationSvc.getAggregateIsolationScore(),
        criticalTenants,
      },
      recentAuditEvents: auditTrail.length,
      maintainerTenantStatus: maintainer?.status ?? 'UNKNOWN',
    };

    this.logger.log(
      `[FMIPDashboard] Gerado — ${dashboard.platform.totalTenants} tenants, ${dashboard.federation.activeLinks} federações ativas.`,
    );
    return dashboard;
  }
}
