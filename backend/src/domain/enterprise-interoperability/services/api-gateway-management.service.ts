import { Injectable, Logger } from '@nestjs/common';
import { ApiGatewayRouteDto } from '../dto/enterprise-interoperability.dto';
import { ExternalAuditService } from './external-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ApiGatewayRouteRecord {
  routeId: string;
  path: string;
  method: string;
  targetPartnerCode: string;
  rateLimitPerMinute: number;
  monthlyQuota: number;
  currentMonthlyUsage: number;
  requireMtls: boolean;
  apiVersion: string;
  isHealthy: boolean;
  registeredAt: string;
}

export interface RouteValidationResult {
  allowed: boolean;
  routeId?: string;
  remainingRateLimit: number;
  remainingMonthlyQuota: number;
  rejectReason?: string;
}

/**
 * ApiGatewayManagementService — Gerenciamento do API Gateway Corporativo (P155 AEIDIP)
 *
 * Gerencia autenticação/autorização, rate limiting, quotas por parceiro, versionamento de APIs,
 * exigência de mTLS, cache e roteamento seguro de tráfego externo.
 */
@Injectable()
export class ApiGatewayManagementService {
  private readonly logger = new Logger(ApiGatewayManagementService.name);
  private routeRegistry: Map<string, ApiGatewayRouteRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ExternalAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedGatewayRoutes();
  }

  private seedGatewayRoutes(): void {
    const seeds: ApiGatewayRouteRecord[] = [
      {
        routeId: 'GW-RTE-2026-0001',
        path: '/api/v1/interop/rnds/clinical-summary',
        method: 'GET',
        targetPartnerCode: 'MINISTERIO_DA_SAUDE_SUS',
        rateLimitPerMinute: 120,
        monthlyQuota: 100000,
        currentMonthlyUsage: 1420,
        requireMtls: true,
        apiVersion: 'v1.2',
        isHealthy: true,
        registeredAt: new Date().toISOString(),
      },
      {
        routeId: 'GW-RTE-2026-0002',
        path: '/api/v1/interop/suas/vulnerability',
        method: 'POST',
        targetPartnerCode: 'SUAS_CADUNICO_SOCIAL',
        rateLimitPerMinute: 60,
        monthlyQuota: 50000,
        currentMonthlyUsage: 890,
        requireMtls: false,
        apiVersion: 'v1.0',
        isHealthy: true,
        registeredAt: new Date().toISOString(),
      },
    ];

    for (const r of seeds) {
      this.routeRegistry.set(r.routeId, r);
    }
  }

  async registerRoute(dto: ApiGatewayRouteDto): Promise<ApiGatewayRouteRecord> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const routeId = `GW-RTE-${year}-${seq}`;

    const record: ApiGatewayRouteRecord = {
      routeId,
      path: dto.path,
      method: dto.method.toUpperCase(),
      targetPartnerCode: dto.targetPartnerCode,
      rateLimitPerMinute: dto.rateLimitPerMinute,
      monthlyQuota: dto.monthlyQuota,
      currentMonthlyUsage: 0,
      requireMtls: dto.requireMtls,
      apiVersion: dto.apiVersion ?? 'v1.0',
      isHealthy: true,
      registeredAt: new Date().toISOString(),
    };

    this.routeRegistry.set(routeId, record);

    await this.auditService.recordAudit({
      serviceName: 'api-gateway-management-service',
      actionName: 'RouteRegistered',
      partnerCode: dto.targetPartnerCode,
      details: { routeId, path: dto.path, method: dto.method, rateLimit: dto.rateLimitPerMinute },
    });

    await this.eventBus.publish(
      'aura.interoperability.integration.validated.v1',
      { routeId, path: dto.path, method: dto.method, partnerCode: dto.targetPartnerCode },
      this.SYSTEM_TENANT,
      { subject: routeId },
    );

    this.logger.log(`[ApiGateway] Registered route: ${routeId} (${dto.method} ${dto.path})`);
    return record;
  }

  validateRequest(path: string, method: string, partnerCode: string, isMtlsProvided = false): RouteValidationResult {
    let matchedRoute: ApiGatewayRouteRecord | undefined;

    for (const r of this.routeRegistry.values()) {
      if (r.path === path && r.method === method.toUpperCase() && r.targetPartnerCode === partnerCode) {
        matchedRoute = r;
        break;
      }
    }

    if (!matchedRoute) {
      return { allowed: false, remainingRateLimit: 0, remainingMonthlyQuota: 0, rejectReason: 'Rota não encontrada no API Gateway para este parceiro.' };
    }

    if (matchedRoute.requireMtls && !isMtlsProvided) {
      return { allowed: false, remainingRateLimit: matchedRoute.rateLimitPerMinute, remainingMonthlyQuota: matchedRoute.monthlyQuota - matchedRoute.currentMonthlyUsage, rejectReason: 'Esta rota exige autenticação via certificado mTLS.' };
    }

    if (matchedRoute.currentMonthlyUsage >= matchedRoute.monthlyQuota) {
      return { allowed: false, remainingRateLimit: 0, remainingMonthlyQuota: 0, rejectReason: 'Cota mensal de requisições excedida.' };
    }

    matchedRoute.currentMonthlyUsage += 1;

    return {
      allowed: true,
      routeId: matchedRoute.routeId,
      remainingRateLimit: matchedRoute.rateLimitPerMinute - 1,
      remainingMonthlyQuota: matchedRoute.monthlyQuota - matchedRoute.currentMonthlyUsage,
    };
  }

  listRoutes(): ApiGatewayRouteRecord[] {
    return Array.from(this.routeRegistry.values());
  }

  getRoute(routeId: string): ApiGatewayRouteRecord | undefined {
    return this.routeRegistry.get(routeId);
  }
}
