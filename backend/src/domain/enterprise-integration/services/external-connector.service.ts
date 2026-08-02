import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProtocol } from '../dto/enterprise-integration.dto';
import { IntegrationAuditService } from './integration-audit.service';

export interface ExternalConnectorInfo {
  connectorId: string;
  protocol: IntegrationProtocol;
  description: string;
  supportsAsync: boolean;
  supportsMutualTls: boolean;
  isOperational: boolean;
}

/**
 * ExternalConnectorService — Conectores Padronizados (P166 EIIP)
 *
 * Fornece conectores reutilizáveis para protocolos REST, GraphQL, gRPC, Webhooks,
 * AsyncAPI Kafka, SAML 2.0 e OAuth 2.1 com suporte mTLS.
 */
@Injectable()
export class ExternalConnectorService {
  private readonly logger = new Logger(ExternalConnectorService.name);
  private connectorMap: Map<IntegrationProtocol, ExternalConnectorInfo> = new Map();

  constructor(private readonly auditService: IntegrationAuditService) {
    this.seedConnectors();
  }

  private seedConnectors(): void {
    const protocols = Object.values(IntegrationProtocol);
    for (const p of protocols) {
      this.connectorMap.set(p, {
        connectorId: `CONN-${p}-01`,
        protocol: p,
        description: `Conector institucional padronizado para ${p}`,
        supportsAsync: p === IntegrationProtocol.WEBHOOK || p === IntegrationProtocol.EVENT_DRIVEN_KAFKA,
        supportsMutualTls: true,
        isOperational: true,
      });
    }
  }

  getConnector(protocol: IntegrationProtocol): ExternalConnectorInfo | undefined {
    return this.connectorMap.get(protocol);
  }

  listConnectors(): ExternalConnectorInfo[] {
    return Array.from(this.connectorMap.values());
  }
}
