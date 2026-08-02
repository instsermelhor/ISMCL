import { Injectable, Logger } from '@nestjs/common';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ServiceRegistration {
  serviceId: string;
  serviceName: string;
  version: string;
  endpoint: string;
  healthEndpoint: string;
  mtlsEnabled: boolean;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  circuitBreakerOpen: boolean;
  registeredAt: string;
}

@Injectable()
export class ServiceMeshService {
  private readonly logger = new Logger(ServiceMeshService.name);
  private readonly services: Map<string, ServiceRegistration> = new Map();

  constructor(
    private readonly auditSvc: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async discoverService(serviceId: string, serviceName: string, version: string, endpoint: string, healthEndpoint: string, mtlsEnabled: boolean): Promise<ServiceRegistration> {
    const reg: ServiceRegistration = { serviceId, serviceName, version, endpoint, healthEndpoint, mtlsEnabled, status: 'UP', circuitBreakerOpen: false, registeredAt: new Date().toISOString() };
    this.services.set(serviceId, reg);
    await this.auditSvc.recordAudit('SERVICE_DISCOVERED', serviceId, 'ServiceMesh', { serviceName, version, endpoint, mtlsEnabled });
    await this.eventBus.publish('aura.eiemp.service.discovered.v1', { serviceId, serviceName, version, endpoint }, 'EIEMP', { subject: serviceId });
    this.logger.log(`[ServiceMesh] Servico descoberto: ${serviceName} v${version} @ ${endpoint} (mTLS: ${mtlsEnabled})`);
    return reg;
  }

  async openCircuitBreaker(serviceId: string, reason: string): Promise<ServiceRegistration> {
    const svc = this.getOrThrow(serviceId);
    svc.circuitBreakerOpen = true;
    svc.status = 'DEGRADED';
    await this.auditSvc.recordAudit('CIRCUIT_BREAKER_OPENED', serviceId, 'ServiceMesh', { reason });
    this.logger.warn(`[ServiceMesh] Circuit Breaker ABERTO: ${svc.serviceName} — ${reason}`);
    return svc;
  }

  async closeCircuitBreaker(serviceId: string): Promise<ServiceRegistration> {
    const svc = this.getOrThrow(serviceId);
    svc.circuitBreakerOpen = false;
    svc.status = 'UP';
    await this.auditSvc.recordAudit('CIRCUIT_BREAKER_CLOSED', serviceId, 'ServiceMesh', {});
    return svc;
  }

  getService(serviceId: string): ServiceRegistration | undefined { return this.services.get(serviceId); }
  listServices(): ServiceRegistration[] { return Array.from(this.services.values()); }

  private getOrThrow(serviceId: string): ServiceRegistration {
    const s = this.services.get(serviceId);
    if (!s) throw new Error(`Servico "${serviceId}" nao encontrado no Service Mesh.`);
    return s;
  }
}
