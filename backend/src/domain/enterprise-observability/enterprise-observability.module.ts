import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { ObservabilityAuditService } from './services/observability-audit.service';
import { EnterpriseObservabilityService } from './services/enterprise-observability.service';
import { TelemetryService } from './services/telemetry.service';
import { DistributedTracingService } from './services/distributed-tracing.service';
import { MetricsService } from './services/metrics.service';
import { LoggingService } from './services/logging.service';
import { ReliabilityEngineeringService } from './services/reliability-engineering.service';
import { SLOManagementService } from './services/slo-management.service';
import { ChaosEngineeringService } from './services/chaos-engineering.service';
import { AutonomousOperationsService } from './services/autonomous-operations.service';

// Controller
import { EnterpriseObservabilityController } from './controllers/enterprise-observability.controller';

/**
 * EnterpriseObservabilityModule — P173 EORP (Fase XXIII)
 *
 * Plataforma Corporativa de Observabilidade, Engenharia de Confiabilidade (SRE)
 * e Operações Autônomas (EORP).
 * Conecta Observabilidade Unificada (100% dos componentes), Telemetria OpenTelemetry,
 * Distributed Tracing end-to-end, Métricas OpenMetrics/Prometheus, Centralização de Logs (LGPD),
 * Engenharia de Confiabilidade SRE, SLOs/Error Budgets, Chaos Engineering Controlado,
 * AIOps com Ações Autônomas Auditadas e Trilha Imutável SHA-256.
 *
 * Componentes:
 * - ObservabilityAuditService        — Trilha imutável SHA-256
 * - EnterpriseObservabilityService   — Visão unificada da saúde do ecossistema
 * - TelemetryService                 — Coleta OpenTelemetry padronizada
 * - DistributedTracingService        — Rastreamento distribuído por traceId
 * - MetricsService                   — Séries temporais e percentis (p50, p95, p99)
 * - LoggingService                   — Centralização de logs e mascaramento LGPD
 * - ReliabilityEngineeringService   — Reliability Score (0-100), MTTR e MTBF
 * - SLOManagementService            — Indicadores SLI, alvos SLO e Error Budgets
 * - ChaosEngineeringService          — Experimentos controlados de resiliência
 * - AutonomousOperationsService      — AIOps: anomalias e ações corretivas autônomas
 */
@Module({
  imports: [EventBusModule],
  providers: [
    ObservabilityAuditService,
    EnterpriseObservabilityService,
    TelemetryService,
    DistributedTracingService,
    MetricsService,
    LoggingService,
    ReliabilityEngineeringService,
    SLOManagementService,
    ChaosEngineeringService,
    AutonomousOperationsService,
  ],
  controllers: [EnterpriseObservabilityController],
  exports: [
    ObservabilityAuditService,
    EnterpriseObservabilityService,
    TelemetryService,
    DistributedTracingService,
    MetricsService,
    LoggingService,
    ReliabilityEngineeringService,
    SLOManagementService,
    ChaosEngineeringService,
    AutonomousOperationsService,
  ],
})
export class EnterpriseObservabilityModule {}
