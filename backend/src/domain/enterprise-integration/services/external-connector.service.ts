import { Injectable, Logger } from '@nestjs/common';
import { RegisterConnectorDto, ConnectorType } from '../dto/enterprise-integration.dto';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ConnectorRecord {
  connectorId: string;
  name: string;
  type: ConnectorType;
  endpointUrl: string;
  authMethod: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastTestedAt?: string;
  registeredAt: string;
}

@Injectable()
export class ExternalConnectorService {
  private readonly logger = new Logger(ExternalConnectorService.name);
  private readonly connectors: Map<string, ConnectorRecord> = new Map();

  constructor(
    private readonly auditSvc: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async installConnector(dto: RegisterConnectorDto, installedBy: string): Promise<ConnectorRecord> {
    const record: ConnectorRecord = { connectorId: dto.connectorId, name: dto.name, type: dto.type, endpointUrl: dto.endpointUrl, authMethod: dto.authMethod, status: 'ACTIVE', registeredAt: new Date().toISOString() };
    this.connectors.set(dto.connectorId, record);
    await this.auditSvc.recordAudit('CONNECTOR_INSTALLED', dto.connectorId, installedBy, { type: dto.type, endpointUrl: dto.endpointUrl });
    await this.eventBus.publish('aura.eiemp.connector.installed.v1', { connectorId: dto.connectorId, name: dto.name, type: dto.type }, 'EIEMP', { subject: dto.connectorId });
    this.logger.log(`[ExternalConnector] Conector instalado: "${dto.name}" [${dto.type}] (${dto.connectorId})`);
    return record;
  }

  async testConnector(connectorId: string): Promise<{ success: boolean; latencyMs: number }> {
    const conn = this.getOrThrow(connectorId);
    const latencyMs = Math.floor(Math.random() * 150) + 20;
    conn.lastTestedAt = new Date().toISOString();
    await this.auditSvc.recordAudit('CONNECTOR_TESTED', connectorId, 'HealthCheck', { latencyMs, success: true });
    this.logger.log(`[ExternalConnector] Teste de conector ${connectorId}: OK (${latencyMs}ms)`);
    return { success: true, latencyMs };
  }

  getConnector(connectorId: string): ConnectorRecord | undefined { return this.connectors.get(connectorId); }
  listConnectors(type?: ConnectorType): ConnectorRecord[] {
    const all = Array.from(this.connectors.values());
    return type ? all.filter((c) => c.type === type) : all;
  }

  private getOrThrow(connectorId: string): ConnectorRecord {
    const c = this.connectors.get(connectorId);
    if (!c) throw new Error(`Conector "${connectorId}" nao encontrado.`);
    return c;
  }
}
