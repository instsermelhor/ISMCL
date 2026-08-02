import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { ContinuityAuditService } from './services/continuity-audit.service';
import { BusinessContinuityService } from './services/business-continuity.service';
import { BusinessImpactAnalysisService } from './services/business-impact-analysis.service';
import { IncidentResponseService } from './services/incident-response.service';
import { DisasterRecoveryService } from './services/disaster-recovery.service';
import { CrisisManagementService } from './services/crisis-management.service';
import { EmergencyCommunicationService } from './services/emergency-communication.service';
import { RecoveryOrchestrationService } from './services/recovery-orchestration.service';
import { OperationalResilienceService } from './services/operational-resilience.service';
import { CrisisDashboardService } from './services/crisis-dashboard.service';

// Controller
import { BusinessContinuityController } from './controllers/business-continuity.controller';

/**
 * BusinessContinuityModule — P169 BCORP (Fase XIX)
 *
 * Plataforma Corporativa de Continuidade de Negócios, Gestão de Crises
 * e Resiliência Operacional (BCORP).
 * Conecta o Plano de Continuidade (BCP), Análise de Impacto (BIA),
 * Resposta a Incidentes (NIST SP 800-61), Recuperação de Desastres (DR),
 * Centro de Gestão de Crises, Comunicação Multicanal de Emergência,
 * Orquestração de Workflows, Monitoramento de Resiliência e Auditoria Imutável.
 *
 * Componentes:
 * - ContinuityAuditService          — Auditoria imutável SHA-256
 * - BusinessContinuityService       — Plano de Continuidade, RTO/RPO e processos críticos
 * - BusinessImpactAnalysisService   — BIA com classificação em 8 domínios de impacto
 * - IncidentResponseService         — Ciclo de vida de incidentes NIST
 * - DisasterRecoveryService         — DR com 9 passos, integridade, failover/failback e RTO
 * - CrisisManagementService         — Centro de Crises, comitê e decisões com aprovação
 * - EmergencyCommunicationService   — Disparo multicanal (Email/SMS/WhatsApp/Push/Portal)
 * - RecoveryOrchestrationService    — Workflows automatizados com aprovação humana
 * - OperationalResilienceService   — Score de resiliência e detecção de SPOFs
 * - CrisisDashboardService          — Dashboard executivo do Centro de Crises
 */
@Module({
  imports: [EventBusModule],
  providers: [
    ContinuityAuditService,
    BusinessContinuityService,
    BusinessImpactAnalysisService,
    IncidentResponseService,
    DisasterRecoveryService,
    CrisisManagementService,
    EmergencyCommunicationService,
    RecoveryOrchestrationService,
    OperationalResilienceService,
    CrisisDashboardService,
  ],
  controllers: [BusinessContinuityController],
  exports: [
    ContinuityAuditService,
    BusinessContinuityService,
    BusinessImpactAnalysisService,
    IncidentResponseService,
    DisasterRecoveryService,
    CrisisManagementService,
    EmergencyCommunicationService,
    RecoveryOrchestrationService,
    OperationalResilienceService,
    CrisisDashboardService,
  ],
})
export class BusinessContinuityModule {}
