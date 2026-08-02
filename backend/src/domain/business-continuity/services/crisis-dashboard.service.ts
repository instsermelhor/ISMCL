import { Injectable, Logger } from '@nestjs/common';
import { BusinessContinuityService } from './business-continuity.service';
import { IncidentResponseService } from './incident-response.service';
import { DisasterRecoveryService } from './disaster-recovery.service';
import { CrisisManagementService } from './crisis-management.service';
import { EmergencyCommunicationService } from './emergency-communication.service';
import { OperationalResilienceService } from './operational-resilience.service';
import { ContinuityAuditService } from './continuity-audit.service';

export interface CrisisDashboardOverview {
  generatedAt: string;
  overallStatus: 'NORMAL' | 'ELEVATED' | 'CRISIS_ACTIVE' | 'DISASTER_RECOVERY';
  resilienceScore: number;
  resilienceRating: string;
  activeCrisesCount: number;
  openP1IncidentsCount: number;
  activeBCPPlan: {
    planId: string;
    status: string;
    criticalProcessesCount: number;
    activatedProcessesCount: number;
  };
  disasterRecoverySummary: {
    activeRecoveries: number;
    completedRecoveries: number;
    lastRtoHours?: number;
  };
  emergencyCommunicationSummary: {
    totalNotificationsSent: number;
    lastSentAt?: string;
  };
  auditEventsCount: number;
  recentAuditEvents: Array<{
    auditId: string;
    action: string;
    subject: string;
    timestamp: string;
  }>;
}

/**
 * CrisisDashboardService — P169 BCORP
 *
 * Painel Executivo do Centro de Gestão de Crises.
 * Consolida status operacional, crises ativas, incidentes P1,
 * score de resiliência, estado da recuperação de desastres e auditoria.
 */
@Injectable()
export class CrisisDashboardService {
  private readonly logger = new Logger(CrisisDashboardService.name);

  constructor(
    private readonly bcpSvc: BusinessContinuityService,
    private readonly incidentSvc: IncidentResponseService,
    private readonly drSvc: DisasterRecoveryService,
    private readonly crisisSvc: CrisisManagementService,
    private readonly commSvc: EmergencyCommunicationService,
    private readonly resilienceSvc: OperationalResilienceService,
    private readonly auditSvc: ContinuityAuditService,
  ) {}

  async getExecutiveDashboard(): Promise<CrisisDashboardOverview> {
    const activeCrises = this.crisisSvc.getActiveCrises();
    const openP1 = this.incidentSvc.getOpenP1Incidents();
    const activeDR = this.drSvc.listOperations('IN_PROGRESS');
    const completedDR = this.drSvc.listOperations('COMPLETED');
    const bcpPlan = this.bcpSvc.getDefaultPlan();
    const resilienceReport = await this.resilienceSvc.assessResilience('DASHBOARD');

    let overallStatus: CrisisDashboardOverview['overallStatus'] = 'NORMAL';
    if (activeDR.length > 0) overallStatus = 'DISASTER_RECOVERY';
    else if (activeCrises.length > 0) overallStatus = 'CRISIS_ACTIVE';
    else if (openP1.length > 0) overallStatus = 'ELEVATED';

    const auditTrail = this.auditSvc.getAuditTrail();
    const recentAuditEvents = auditTrail.slice(-5).reverse().map((e) => ({
      auditId: e.auditId,
      action: e.action,
      subject: e.subject,
      timestamp: e.timestamp,
    }));

    const notifications = this.commSvc.listNotifications();
    const lastNotification = notifications[notifications.length - 1];

    const dashboard: CrisisDashboardOverview = {
      generatedAt: new Date().toISOString(),
      overallStatus,
      resilienceScore: resilienceReport.resilienceScore,
      resilienceRating: resilienceReport.overallRating,
      activeCrisesCount: activeCrises.length,
      openP1IncidentsCount: openP1.length,
      activeBCPPlan: {
        planId: bcpPlan.planId,
        status: bcpPlan.status,
        criticalProcessesCount: bcpPlan.processes.length,
        activatedProcessesCount: bcpPlan.processes.filter((p) => p.isActivated).length,
      },
      disasterRecoverySummary: {
        activeRecoveries: activeDR.length,
        completedRecoveries: completedDR.length,
        lastRtoHours: completedDR[completedDR.length - 1]?.actualRto,
      },
      emergencyCommunicationSummary: {
        totalNotificationsSent: notifications.length,
        lastSentAt: lastNotification?.sentAt,
      },
      auditEventsCount: auditTrail.length,
      recentAuditEvents,
    };

    this.logger.log(`[CrisisDashboard] Dashboard executivo gerado — Status: ${overallStatus}`);
    return dashboard;
  }
}
