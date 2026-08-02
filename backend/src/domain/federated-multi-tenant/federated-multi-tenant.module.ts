import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { FederationAuditService } from './services/federation-audit.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';
import { WhiteLabelService } from './services/white-label.service';
import { FederationGovernanceService } from './services/federation-governance.service';
import { TenantIsolationService } from './services/tenant-isolation.service';
import { TenantLicensingService } from './services/tenant-licensing.service';
import { FMIPDashboardService } from './services/fmip-dashboard.service';

// Controller
import { FederatedMultiTenantController } from './controllers/federated-multi-tenant.controller';

/**
 * FederatedMultiTenantModule — P167 FMIP (Fase XVII)
 *
 * Plataforma federada multi-institucional white-label governada.
 * Permite que outras organizações utilizem a Plataforma Aura de forma
 * isolada, personalizada e controlada — com o Instituto Ser Melhor
 * como organização mantenedora e soberana da tecnologia.
 *
 * Componentes:
 * - FederationAuditService        — Auditoria imutável SHA-256
 * - TenantProvisioningService     — Ciclo de vida dos tenants
 * - WhiteLabelService             — Identidade visual e módulos
 * - FederationGovernanceService   — Vínculos e políticas de dados
 * - TenantIsolationService        — Auditoria de isolamento LGPD
 * - TenantLicensingService        — Licenças e entitlements
 * - FMIPDashboardService          — Dashboard executivo consolidado
 */
@Module({
  imports: [EventBusModule],
  providers: [
    FederationAuditService,
    TenantProvisioningService,
    WhiteLabelService,
    FederationGovernanceService,
    TenantIsolationService,
    TenantLicensingService,
    FMIPDashboardService,
  ],
  controllers: [FederatedMultiTenantController],
  exports: [
    FederationAuditService,
    TenantProvisioningService,
    WhiteLabelService,
    FederationGovernanceService,
    TenantIsolationService,
    TenantLicensingService,
    FMIPDashboardService,
  ],
})
export class FederatedMultiTenantModule {}
