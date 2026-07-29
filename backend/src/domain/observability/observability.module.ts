import { Module } from '@nestjs/common';
import { ObservabilityController } from './controllers/observability.controller';
import { LoggingTelemetryService } from './services/logging-telemetry.service';
import { SiemThreatDetectionService } from './services/siem-threat-detection.service';
import { SocAutomationService } from './services/soc-automation.service';
import { ContinuousAuditService } from './services/continuous-audit.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * ObservabilityModule — Plataforma Corporativa de Observabilidade, Cibersegurança, SIEM, SOC e Auditoria Contínua (AEOCSAP)
 *
 * Integra:
 * - LoggingTelemetryService (Logs Estruturados Assinados Digitalmente + Metrics + Distributed Tracing)
 * - SiemThreatDetectionService (SIEM + Detecção Inteligente de Ameaças)
 * - SocAutomationService (Automação SOAR do SOC + Playbooks + Ciclo de Vida de Incidentes)
 * - ContinuousAuditService (Auditoria Contínua LGPD, MCSI, Zero Trust)
 *
 * Referências: P106 AEDSO, P118 AECS, P142 AEOCSAP
 */
@Module({
  imports: [EventBusModule],
  controllers: [ObservabilityController],
  providers: [
    LoggingTelemetryService,
    SiemThreatDetectionService,
    SocAutomationService,
    ContinuousAuditService,
  ],
  exports: [
    LoggingTelemetryService,
    SiemThreatDetectionService,
    SocAutomationService,
    ContinuousAuditService,
  ],
})
export class ObservabilityModule {}
