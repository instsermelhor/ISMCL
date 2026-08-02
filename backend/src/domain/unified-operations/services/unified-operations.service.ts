import { Injectable, Logger } from '@nestjs/common';
import { ServiceHealthMonitoringService } from './service-health-monitoring.service';
import { IncidentManagementService, IncidentRecord } from './incident-management.service';
import { AiOpsIntelligenceService, AnomalyDetectionResult } from './ai-ops-intelligence.service';
import { SreGovernanceService, SloEvaluationResult } from './sre-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface UnifiedOperationalDashboard {
  dashboardId: string;
  generatedAt: string;
  overallHealthStatus: 'GREEN' | 'YELLOW' | 'RED';
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  openIncidents: number;
  criticalIncidents: number;
  activeAnomalies: number;
  lastSloEvaluations: SloEvaluationResult[];
  topOpenIncidents: IncidentRecord[];
  recentAnomalies: AnomalyDetectionResult[];
  summary: string;
}

/**
 * UnifiedOperationsService — Centro Unificado de Operações (P156 AUOC)
 *
 * Consolida em um único painel operacional os dados de saúde de todos os microsserviços,
 * incidentes ativos, anomalias detectadas e avaliações de SLO. É o ponto de entrada
 * para o Centro Unificado de Operações (Unified Operations Center) da Plataforma Aura.
 */
@Injectable()
export class UnifiedOperationsService {
  private readonly logger = new Logger(UnifiedOperationsService.name);
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly healthMonitoring: ServiceHealthMonitoringService,
    private readonly incidentManagement: IncidentManagementService,
    private readonly aiOpsIntelligence: AiOpsIntelligenceService,
    private readonly sreGovernance: SreGovernanceService,
    private readonly eventBus: EventBusService,
  ) {}

  async getOperationalDashboard(): Promise<UnifiedOperationalDashboard> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dashboardId = `DASH-OPS-${year}-${seq}`;

    // Agrega saúde dos serviços
    const allHealth = this.healthMonitoring.getAllHealthStatus();
    const healthyServices = allHealth.filter((h) => h.status === 'HEALTHY').length;
    const degradedServices = allHealth.filter((h) => h.status === 'DEGRADED').length;
    const unhealthyServices = allHealth.filter((h) => h.status === 'UNHEALTHY').length;

    // Incidentes abertos
    const openIncidents = this.incidentManagement.listIncidents().filter(
      (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED',
    );
    const criticalIncidents = openIncidents.filter((i) => i.severity === 'P1_CRITICAL').length;

    // Anomalias ativas
    const recentAnomalies = this.aiOpsIntelligence.listAnomalies().slice(-5);

    // SLOs de serviços principais
    const sloResults = await Promise.all([
      this.sreGovernance.evaluateSlo({ serviceName: 'cognitive-orchestration', targetAvailabilityPercentage: 99.9, targetLatencyMs: 300 }),
      this.sreGovernance.evaluateSlo({ serviceName: 'enterprise-interoperability', targetAvailabilityPercentage: 99.9, targetLatencyMs: 500 }),
    ]);

    const overallHealthStatus = unhealthyServices > 0 ? 'RED' : degradedServices > 0 ? 'YELLOW' : 'GREEN';

    const dashboard: UnifiedOperationalDashboard = {
      dashboardId,
      generatedAt: new Date().toISOString(),
      overallHealthStatus,
      totalServices: allHealth.length,
      healthyServices,
      degradedServices,
      unhealthyServices,
      openIncidents: openIncidents.length,
      criticalIncidents,
      activeAnomalies: recentAnomalies.filter((a) => a.anomalyDetected).length,
      lastSloEvaluations: sloResults,
      topOpenIncidents: openIncidents.slice(0, 5),
      recentAnomalies,
      summary: `Estado geral: ${overallHealthStatus} — ${healthyServices}/${allHealth.length} serviços saudáveis, ${openIncidents.length} incidentes abertos, ${criticalIncidents} críticos.`,
    };

    await this.eventBus.publish(
      'aura.operations.health.updated.v1',
      { dashboardId, overallHealthStatus, openIncidents: openIncidents.length, criticalIncidents },
      this.SYSTEM_TENANT,
      { subject: dashboardId },
    );

    this.logger.log(`[UnifiedOperations] Dashboard ${dashboardId} generated → Health: ${overallHealthStatus}`);
    return dashboard;
  }
}
