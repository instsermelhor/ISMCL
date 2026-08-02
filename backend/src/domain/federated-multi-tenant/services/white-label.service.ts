import { Injectable, Logger } from '@nestjs/common';
import { ConfigureWhiteLabelDto } from '../dto/federated-multi-tenant.dto';
import { FederationAuditService } from './federation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface WhiteLabelConfig {
  tenantId: string;
  customDomain: string;
  logoUrl: string;
  primaryColorHex: string;
  enabledModules: string[];
  configuredAt: string;
  lastUpdatedAt: string;
}

/**
 * WhiteLabelService — P167 FMIP
 *
 * Gerencia customizações de marca, domínio e módulos habilitados
 * para cada tenant federado, sem vazar identidade do ISM.
 */
@Injectable()
export class WhiteLabelService {
  private readonly logger = new Logger(WhiteLabelService.name);
  private readonly configs: Map<string, WhiteLabelConfig> = new Map();

  /** Módulos permitidos para white-label (subconjunto da plataforma) */
  private readonly PERMITTED_MODULES = [
    'social-erp',
    'beneficiary-management',
    'case-management',
    'scheduling',
    'documents',
    'analytics',
    'impact-reporting',
    'mental-health',
    'ehr',
    'notifications',
    'governance-lite',
  ];

  constructor(
    private readonly auditSvc: FederationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async configure(dto: ConfigureWhiteLabelDto, configuredBy = 'SYSTEM'): Promise<WhiteLabelConfig> {
    const now = new Date().toISOString();

    // Filtrar módulos não permitidos
    const requestedModules = dto.enabledModules ?? this.PERMITTED_MODULES;
    const enabledModules = requestedModules.filter((m) => this.PERMITTED_MODULES.includes(m));
    const rejectedModules = requestedModules.filter((m) => !this.PERMITTED_MODULES.includes(m));

    if (rejectedModules.length) {
      this.logger.warn(
        `[WhiteLabel] Módulos não permitidos rejeitados para "${dto.tenantId}": ${rejectedModules.join(', ')}`,
      );
    }

    const config: WhiteLabelConfig = {
      tenantId: dto.tenantId,
      customDomain: dto.customDomain,
      logoUrl: dto.logoUrl ?? '',
      primaryColorHex: dto.primaryColorHex ?? '#1A365D',
      enabledModules,
      configuredAt: this.configs.has(dto.tenantId) ? this.configs.get(dto.tenantId)!.configuredAt : now,
      lastUpdatedAt: now,
    };

    this.configs.set(dto.tenantId, config);

    await this.auditSvc.recordAudit('WHITE_LABEL_CONFIGURED', dto.tenantId, configuredBy, {
      customDomain: dto.customDomain,
      enabledModules,
      rejectedModules,
    });

    await this.eventBus.publish(
      'aura.tenant.whitelabel.configured.v1',
      { tenantId: dto.tenantId, customDomain: dto.customDomain },
      'FMIP',
      { subject: dto.tenantId },
    );

    this.logger.log(`[WhiteLabel] Configuração white-label aplicada: "${dto.tenantId}" → ${dto.customDomain}`);
    return config;
  }

  getConfig(tenantId: string): WhiteLabelConfig | undefined {
    return this.configs.get(tenantId);
  }

  listConfigs(): WhiteLabelConfig[] {
    return Array.from(this.configs.values());
  }

  getPermittedModules(): string[] {
    return [...this.PERMITTED_MODULES];
  }
}
