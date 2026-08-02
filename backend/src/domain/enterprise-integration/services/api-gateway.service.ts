import { Injectable, Logger } from '@nestjs/common';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface GatewayRoute {
  routeId: string;
  apiId: string;
  path: string;
  targetService: string;
  rateLimitRpm: number;
  authRequired: boolean;
  cacheTtlSeconds: number;
  active: boolean;
  createdAt: string;
}

export interface GatewayRequest {
  requestId: string;
  routeId: string;
  method: string;
  path: string;
  clientId: string;
  latencyMs: number;
  statusCode: number;
  timestamp: string;
}

@Injectable()
export class APIGatewayService {
  private readonly logger = new Logger(APIGatewayService.name);
  private readonly routes: Map<string, GatewayRoute> = new Map();
  private readonly requestLog: GatewayRequest[] = [];

  constructor(
    private readonly auditSvc: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerRoute(apiId: string, path: string, targetService: string, rateLimitRpm: number, authRequired: boolean, cacheTtlSeconds: number, registeredBy: string): Promise<GatewayRoute> {
    const routeId = `ROUTE-${apiId}-${Date.now().toString(36).toUpperCase()}`;
    const route: GatewayRoute = { routeId, apiId, path, targetService, rateLimitRpm, authRequired, cacheTtlSeconds, active: true, createdAt: new Date().toISOString() };
    this.routes.set(routeId, route);
    await this.auditSvc.recordAudit('GATEWAY_ROUTE_REGISTERED', routeId, registeredBy, { apiId, path, targetService });
    this.logger.log(`[APIGateway] Rota registrada: ${path} -> ${targetService} (${routeId})`);
    return route;
  }

  async processRequest(routeId: string, method: string, clientId: string): Promise<GatewayRequest> {
    const route = this.routes.get(routeId);
    if (!route || !route.active) throw new Error(`Rota "${routeId}" inativa ou não encontrada.`);
    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`;
    const req: GatewayRequest = { requestId, routeId, method, path: route.path, clientId, latencyMs: Math.floor(Math.random() * 80) + 5, statusCode: 200, timestamp: new Date().toISOString() };
    this.requestLog.push(req);
    await this.auditSvc.recordAudit('GATEWAY_REQUEST_PROCESSED', requestId, clientId, { routeId, method, statusCode: req.statusCode });
    return req;
  }

  getRoute(routeId: string): GatewayRoute | undefined { return this.routes.get(routeId); }
  listRoutes(): GatewayRoute[] { return Array.from(this.routes.values()); }
  getRequestLog(): GatewayRequest[] { return [...this.requestLog]; }
}
