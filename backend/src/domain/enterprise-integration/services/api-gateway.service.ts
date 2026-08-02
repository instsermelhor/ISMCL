import { Injectable, Logger } from '@nestjs/common';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface APIRouteConfig {
  routeId: string;
  path: string;
  targetService: string;
  rateLimitPerMinute: number;
  quotaPerDay: number;
  requiresMtls: boolean;
  activeVersion: string;
  status: 'ACTIVE' | 'DEPRECATED';
}

/**
 * APIGatewayService — API Gateway Corporativo (P166 EIIP)
 *
 * Gerencia rotas corporativas, versionamento, autenticação OAuth 2.1,
 * mTLS, rate limiting, quotas diárias e ciclo de vida de APIs públicas e privadas.
 */
@Injectable()
export class APIGatewayService {
  private readonly logger = new Logger(APIGatewayService.name);
  private routeRegistry: Map<string, APIRouteConfig> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedRoutes();
  }

  private seedRoutes(): void {
    const seeds: APIRouteConfig[] = [
      {
        routeId: 'ROUTE-BENEFICIARIES-V1',
        path: '/api/v1/external/beneficiaries',
        targetService: 'social-assistance',
        rateLimitPerMinute: 600,
        quotaPerDay: 100000,
        requiresMtls: true,
        activeVersion: '1.0.0',
        status: 'ACTIVE',
      },
      {
        routeId: 'ROUTE-HEALTH-IMPACT-V1',
        path: '/api/v1/external/impact',
        targetService: 'social-impact',
        rateLimitPerMinute: 300,
        quotaPerDay: 50000,
        requiresMtls: false,
        activeVersion: '1.0.0',
        status: 'ACTIVE',
      },
    ];

    for (const r of seeds) {
      this.routeRegistry.set(r.routeId, r);
    }
  }

  async releaseAPIVersion(routeId: string, newVersion: string): Promise<APIRouteConfig | null> {
    const route = this.routeRegistry.get(routeId);
    if (!route) return null;

    route.activeVersion = newVersion;
    this.routeRegistry.set(routeId, route);

    await this.auditService.recordAudit('RELEASE_API_VERSION', route.path, 'CInO', {
      routeId, newVersion,
    });

    await this.eventBus.publish(
      'aura.integration.api.version.released.v1',
      { routeId, path: route.path, version: newVersion },
      this.SYSTEM_TENANT,
      { subject: routeId },
    );

    this.logger.log(`[APIGateway] Released version ${newVersion} for route ${route.path}`);
    return route;
  }

  listRoutes(): APIRouteConfig[] {
    return Array.from(this.routeRegistry.values());
  }
}
