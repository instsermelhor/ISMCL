import { Injectable, Logger } from '@nestjs/common';
import { CreateIntegrationDto, IntegrationProtocol, IntegrationStatus, SecurityLevel } from '../dto/enterprise-integration.dto';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface IntegrationRecord {
  integrationId: string;
  integrationName: string;
  partnerId: string;
  protocol: IntegrationProtocol;
  securityLevel: SecurityLevel;
  targetEndpointUrl: string;
  allowedScopes: string[];
  status: IntegrationStatus;
  createdAt: string;
}

/**
 * EnterpriseIntegrationService — Hub Central de Integração (P166 EIIP)
 *
 * Administra conexões seguras com sistemas governamentais, saúde, assistência social,
 * educação, bancos e provedores de identidade.
 */
@Injectable()
export class EnterpriseIntegrationService {
  private readonly logger = new Logger(EnterpriseIntegrationService.name);
  private integrationStore: Map<string, IntegrationRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedIntegrations();
  }

  private seedIntegrations(): void {
    const seed: IntegrationRecord = {
      integrationId: `INT-${Date.now()}-SEED`,
      integrationName: 'Integração Cadastro Único SUAS',
      partnerId: 'PARTNER-MDS-01',
      protocol: IntegrationProtocol.REST,
      securityLevel: SecurityLevel.MTLS_STRICT,
      targetEndpointUrl: 'https://api.cadunico.gov.br/v1/beneficiarios',
      allowedScopes: ['read:beneficiary_status'],
      status: IntegrationStatus.ACTIVE,
      createdAt: new Date().toISOString(),
    };
    this.integrationStore.set(seed.integrationId, seed);
  }

  async createIntegration(dto: CreateIntegrationDto): Promise<IntegrationRecord> {
    const integrationId = `INT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const record: IntegrationRecord = {
      integrationId,
      integrationName: dto.integrationName,
      partnerId: dto.partnerId,
      protocol: dto.protocol,
      securityLevel: dto.securityLevel,
      targetEndpointUrl: dto.targetEndpointUrl ?? 'https://api.external.partner/v1',
      allowedScopes: dto.allowedScopes ?? ['read:basic'],
      status: IntegrationStatus.PROPOSED,
      createdAt: new Date().toISOString(),
    };

    this.integrationStore.set(integrationId, record);

    await this.auditService.recordAudit('CREATE_INTEGRATION', dto.integrationName, 'CInO', {
      integrationId, partnerId: dto.partnerId, protocol: dto.protocol,
    });

    await this.eventBus.publish(
      'aura.integration.created.v1',
      { integrationId, integrationName: dto.integrationName, partnerId: dto.partnerId, protocol: dto.protocol },
      this.SYSTEM_TENANT,
      { subject: integrationId },
    );

    this.logger.log(`[EnterpriseIntegration] Proposed: ${integrationId} ("${dto.integrationName}")`);
    return record;
  }

  listIntegrations(partnerId?: string): IntegrationRecord[] {
    return Array.from(this.integrationStore.values()).filter(
      (i) => !partnerId || i.partnerId === partnerId,
    );
  }
}
