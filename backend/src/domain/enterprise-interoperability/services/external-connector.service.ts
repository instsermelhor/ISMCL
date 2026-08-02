import { Injectable, Logger } from '@nestjs/common';
import { ConfigureConnectorDto, ConnectorType, IntegrationSecurityLevel, ProtocolType } from '../dto/enterprise-interoperability.dto';
import { ExternalAuditService } from './external-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ExternalConnectorRecord {
  connectorId: string;
  connectorType: ConnectorType;
  name: string;
  endpointUrl: string;
  protocol: ProtocolType;
  securityLevel: IntegrationSecurityLevel;
  configPayload?: Record<string, any>;
  isConnected: boolean;
  lastHeartbeat: string;
  configuredAt: string;
}

/**
 * ExternalConnectorService — Gerenciador de Conectores Externos (P155 AEIDIP)
 *
 * Provê conectores pré-configurados e parametrizáveis para:
 * - SUS / RNDS / FHIR HL7 R4 (Saúde Pública)
 * - SUAS / CadÚnico (Assistência Social)
 * - Gov.br (Autenticação SSO Cidadão)
 * - ICP-Brasil (Assinatura Eletrônica Qualificada)
 * - Open Banking / Plataformas Financeiras
 * - Provedores de Armazenamento Documental & Comunicação
 */
@Injectable()
export class ExternalConnectorService {
  private readonly logger = new Logger(ExternalConnectorService.name);
  private connectorRegistry: Map<string, ExternalConnectorRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ExternalAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedDefaultConnectors();
  }

  private seedDefaultConnectors(): void {
    const defaults: ExternalConnectorRecord[] = [
      {
        connectorId: 'CON-2026-0001',
        connectorType: ConnectorType.SUS_RNDS,
        name: 'Conector SUS RNDS / FHIR R4',
        endpointUrl: 'https://rnds-api.saude.gov.br/v1',
        protocol: ProtocolType.REST_OPENAPI,
        securityLevel: IntegrationSecurityLevel.MTLS_STRICT,
        configPayload: { fhirVersion: '4.0.1', timeoutMs: 5000 },
        isConnected: true,
        lastHeartbeat: new Date().toISOString(),
        configuredAt: new Date().toISOString(),
      },
      {
        connectorId: 'CON-2026-0002',
        connectorType: ConnectorType.SUAS_CADUNICO,
        name: 'Conector SUAS / CadÚnico Social',
        endpointUrl: 'https://cadunico-api.mds.gov.br/api/v2',
        protocol: ProtocolType.REST_OPENAPI,
        securityLevel: IntegrationSecurityLevel.HIGH_CONFIDENTIALITY,
        configPayload: { timeoutMs: 4000 },
        isConnected: true,
        lastHeartbeat: new Date().toISOString(),
        configuredAt: new Date().toISOString(),
      },
      {
        connectorId: 'CON-2026-0003',
        connectorType: ConnectorType.E_SIGNATURE_ICP_BR,
        name: 'Conector Assinatura ICP-Brasil / ITI',
        endpointUrl: 'https://assinador.iti.gov.br/v1',
        protocol: ProtocolType.REST_OPENAPI,
        securityLevel: IntegrationSecurityLevel.ZERO_TRUST_CRITICAL,
        configPayload: { pkiProvider: 'ICP-Brasil A3/A1' },
        isConnected: true,
        lastHeartbeat: new Date().toISOString(),
        configuredAt: new Date().toISOString(),
      },
    ];

    for (const c of defaults) {
      this.connectorRegistry.set(c.connectorId, c);
    }
  }

  async configureConnector(dto: ConfigureConnectorDto): Promise<ExternalConnectorRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const connectorId = `CON-${year}-${seq}`;

    const record: ExternalConnectorRecord = {
      connectorId,
      connectorType: dto.connectorType,
      name: dto.name,
      endpointUrl: dto.endpointUrl,
      protocol: dto.protocol,
      securityLevel: dto.securityLevel,
      configPayload: dto.configPayload,
      isConnected: true,
      lastHeartbeat: new Date().toISOString(),
      configuredAt: new Date().toISOString(),
    };

    this.connectorRegistry.set(connectorId, record);

    await this.auditService.recordAudit({
      serviceName: 'external-connector-service',
      actionName: 'ConnectorConfigured',
      partnerCode: dto.connectorType,
      details: { connectorId, name: dto.name, endpointUrl: dto.endpointUrl, securityLevel: dto.securityLevel },
    });

    await this.eventBus.publish(
      'aura.interoperability.connection.established.v1',
      { connectorId, connectorType: dto.connectorType, endpointUrl: dto.endpointUrl, securityLevel: dto.securityLevel },
      this.SYSTEM_TENANT,
      { subject: connectorId },
    );

    this.logger.log(`[ExternalConnector] Configured: ${connectorId} (${dto.name})`);
    return record;
  }

  getConnector(connectorId: string): ExternalConnectorRecord | undefined {
    return this.connectorRegistry.get(connectorId);
  }

  getConnectorsByType(type: ConnectorType): ExternalConnectorRecord[] {
    return Array.from(this.connectorRegistry.values()).filter((c) => c.connectorType === type);
  }

  listConnectors(): ExternalConnectorRecord[] {
    return Array.from(this.connectorRegistry.values());
  }
}
