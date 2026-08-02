import { Injectable, Logger } from '@nestjs/common';
import {
  RegisterTenantDto,
  TenantStatus,
  TenantTier,
  IsolationStrategy,
} from '../dto/federated-multi-tenant.dto';
import { FederationAuditService } from './federation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface TenantRecord {
  tenantId: string;
  organizationName: string;
  tenantSlug: string;
  tier: TenantTier;
  isolationStrategy: IsolationStrategy;
  status: TenantStatus;
  adminEmail: string;
  provisionedAt: string;
  lastUpdatedAt: string;
  metadata: Record<string, any>;
}

/**
 * TenantProvisioningService — P167 FMIP
 *
 * Responsável pelo ciclo de vida completo dos tenants:
 * registro, ativação, suspensão e descomissionamento.
 * Cada tenant recebe namespace isolado e é auditado imutavelmente.
 */
@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);
  private tenantStore: Map<string, TenantRecord> = new Map();

  constructor(
    private readonly auditSvc: FederationAuditService,
    private readonly eventBus: EventBusService,
  ) {
    // Provisionar o Instituto Ser Melhor como tenant mantenedor
    this.tenantStore.set('ser-melhor', {
      tenantId: 'ser-melhor',
      organizationName: 'Instituto Ser Melhor',
      tenantSlug: 'ser-melhor',
      tier: TenantTier.MAINTAINER_INSTITUTE,
      isolationStrategy: IsolationStrategy.DATABASE_PER_TENANT,
      status: TenantStatus.ACTIVE,
      adminEmail: 'ti@sermelhor.org.br',
      provisionedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      metadata: { maintainer: true, whiteLabel: false },
    });
  }

  async registerTenant(dto: RegisterTenantDto, requestedBy = 'SYSTEM'): Promise<TenantRecord> {
    const tenantId = `${dto.tenantSlug}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const record: TenantRecord = {
      tenantId,
      organizationName: dto.organizationName,
      tenantSlug: dto.tenantSlug,
      tier: dto.tier,
      isolationStrategy: dto.isolationStrategy ?? IsolationStrategy.SCHEMA_PER_TENANT,
      status: TenantStatus.PROVISIONING,
      adminEmail: dto.adminEmail ?? '',
      provisionedAt: now,
      lastUpdatedAt: now,
      metadata: {},
    };

    this.tenantStore.set(tenantId, record);

    await this.auditSvc.recordAudit('TENANT_REGISTERED', tenantId, requestedBy, {
      organizationName: dto.organizationName,
      tier: dto.tier,
      isolationStrategy: record.isolationStrategy,
    });

    await this.eventBus.publish(
      'aura.tenant.provisioning.started.v1',
      { tenantId, organizationName: dto.organizationName, tier: dto.tier },
      'FMIP',
      { subject: tenantId },
    );

    this.logger.log(`[TenantProvisioning] Tenant "${tenantId}" registrado — ${dto.organizationName}`);
    return record;
  }

  async activateTenant(tenantId: string, activatedBy: string): Promise<TenantRecord> {
    const tenant = this.getTenantOrThrow(tenantId);
    tenant.status = TenantStatus.ACTIVE;
    tenant.lastUpdatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('TENANT_ACTIVATED', tenantId, activatedBy, {});
    await this.eventBus.publish('aura.tenant.activated.v1', { tenantId }, 'FMIP', { subject: tenantId });
    this.logger.log(`[TenantProvisioning] Tenant "${tenantId}" ativado.`);
    return tenant;
  }

  async suspendTenant(tenantId: string, reason: string, suspendedBy: string): Promise<TenantRecord> {
    const tenant = this.getTenantOrThrow(tenantId);
    tenant.status = TenantStatus.SUSPENDED;
    tenant.lastUpdatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('TENANT_SUSPENDED', tenantId, suspendedBy, { reason });
    await this.eventBus.publish('aura.tenant.suspended.v1', { tenantId, reason }, 'FMIP', { subject: tenantId });
    this.logger.warn(`[TenantProvisioning] Tenant "${tenantId}" suspenso: ${reason}`);
    return tenant;
  }

  async decommissionTenant(tenantId: string, reason: string, decommissionedBy: string): Promise<TenantRecord> {
    const tenant = this.getTenantOrThrow(tenantId);
    tenant.status = TenantStatus.DECOMMISSIONED;
    tenant.lastUpdatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('TENANT_DECOMMISSIONED', tenantId, decommissionedBy, { reason });
    await this.eventBus.publish('aura.tenant.decommissioned.v1', { tenantId, reason }, 'FMIP', { subject: tenantId });
    this.logger.warn(`[TenantProvisioning] Tenant "${tenantId}" descomissionado.`);
    return tenant;
  }

  getTenant(tenantId: string): TenantRecord | undefined {
    return this.tenantStore.get(tenantId);
  }

  listTenants(statusFilter?: TenantStatus, tierFilter?: TenantTier): TenantRecord[] {
    let tenants = Array.from(this.tenantStore.values());
    if (statusFilter) tenants = tenants.filter((t) => t.status === statusFilter);
    if (tierFilter) tenants = tenants.filter((t) => t.tier === tierFilter);
    return tenants;
  }

  private getTenantOrThrow(tenantId: string): TenantRecord {
    const t = this.tenantStore.get(tenantId);
    if (!t) throw new Error(`Tenant "${tenantId}" não encontrado.`);
    return t;
  }
}
