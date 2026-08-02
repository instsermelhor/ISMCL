import { Injectable, Logger } from '@nestjs/common';
import { BusinessContinuityService } from './business-continuity.service';
import { IncidentResponseService } from './incident-response.service';
import { DisasterRecoveryService } from './disaster-recovery.service';
import { CrisisManagementService } from './crisis-management.service';
import { EmergencyCommunicationService } from './emergency-communication.service';
import { BusinessImpactAnalysisService } from './business-impact-analysis.service';
import { ContinuityAuditService } from './continuity-audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import { CommunicationChannel, IncidentSeverity } from '../dto/business-continuity.dto';

export type ResilienceRating = 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'AT_RISK' | 'CRITICAL';

export interface SinglePointOfFailure {
  system: string;
  risk: string;
  recommendation: string;
}

export interface ResilienceReport {
  reportId: string;
  generatedAt: string;
  overallRating: ResilienceRating;
  resilienceScore: number; // 0–100
  availability: {
    critical: number;
    high: number;
    incidents24h: number;
    activeRecoveries: number;
  };
  singlePointsOfFailure: SinglePointOfFailure[];
  openCrises: number;
  openP1Incidents: number;
  recommendations: string[];
  auditEventCount: number;
}

/**
 * OperationalResilienceService — P169 BCORP
 *
 * Monitora continuamente a resiliência operacional da plataforma:
 * disponibilidade, redundância, pontos únicos de falha, degradação.
 * Gera recomendações preventivas e índice de resiliência em tempo real.
 */
@Injectable()
export class OperationalResilienceService {
  private readonly logger = new Logger(OperationalResilienceService.name);
  private readonly reports: ResilienceReport[] = [];

  constructor(
    private readonly bcpSvc: BusinessContinuityService,
    private readonly incidentSvc: IncidentResponseService,
    private readonly drSvc: DisasterRecoveryService,
    private readonly crisisSvc: CrisisManagementService,
    private readonly commSvc: EmergencyCommunicationService,
    private readonly biaSvc: BusinessImpactAnalysisService,
    private readonly auditSvc: ContinuityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async assessResilience(assessedBy = 'SYSTEM'): Promise<ResilienceReport> {
    const plan = this.bcpSvc.getDefaultPlan();
    const criticalProcesses = this.bcpSvc.listProcesses('CRITICAL');
    const vitalProcesses = this.bcpSvc.listProcesses('VITAL');

    const openP1 = this.incidentSvc.getOpenP1Incidents();
    const activeCrises = this.crisisSvc.getActiveCrises();
    const activeRecoveries = this.drSvc.listOperations('IN_PROGRESS');

    // Detectar pontos únicos de falha baseado em processos sem redundância marcada
    const spofs: SinglePointOfFailure[] = this.detectSPOFs(plan.processes);

    // Calcular score
    const baseScore = 80;
    const p1Penalty = openP1.length * 10;
    const crisisPenalty = activeCrises.length * 15;
    const recoveryPenalty = activeRecoveries.length * 5;
    const spofPenalty = spofs.length * 3;
    const score = Math.max(0, Math.min(100, baseScore - p1Penalty - crisisPenalty - recoveryPenalty - spofPenalty));

    const recommendations = this.buildRecommendations(openP1.length, activeCrises.length, spofs, score);

    const reportId = `RESIL-${Date.now().toString(36).toUpperCase()}`;
    const report: ResilienceReport = {
      reportId,
      generatedAt: new Date().toISOString(),
      overallRating: this.scoreToRating(score),
      resilienceScore: score,
      availability: {
        critical: criticalProcesses.filter((p) => p.isActivated).length,
        high: vitalProcesses.filter((p) => p.isActivated).length,
        incidents24h: openP1.length,
        activeRecoveries: activeRecoveries.length,
      },
      singlePointsOfFailure: spofs,
      openCrises: activeCrises.length,
      openP1Incidents: openP1.length,
      recommendations,
      auditEventCount: this.auditSvc.getAuditCount(),
    };

    this.reports.push(report);

    await this.auditSvc.recordAudit('RESILIENCE_ASSESSED', reportId, assessedBy, {
      score,
      rating: report.overallRating,
      openP1: openP1.length,
      activeCrises: activeCrises.length,
    });

    await this.eventBus.publish(
      'aura.bcorp.resilience.updated.v1',
      { reportId, resilienceScore: score, overallRating: report.overallRating },
      'BCORP',
      { subject: reportId },
    );

    this.logger.log(`[OperationalResilience] Score: ${score}/100 — ${report.overallRating}`);
    return report;
  }

  getLatestReport(): ResilienceReport | undefined {
    return this.reports[this.reports.length - 1];
  }

  listReports(): ResilienceReport[] {
    return [...this.reports];
  }

  private detectSPOFs(processes: any[]): SinglePointOfFailure[] {
    const spofs: SinglePointOfFailure[] = [];
    for (const proc of processes) {
      if (proc.dependencies.length === 0 && proc.criticality !== 'LOW') {
        spofs.push({
          system: proc.name,
          risk: 'Sem redundância declarada e sem dependências mapeadas',
          recommendation: `Mapear dependências e definir procedimento de failover para "${proc.name}".`,
        });
      }
    }
    return spofs;
  }

  private buildRecommendations(p1Count: number, crisisCount: number, spofs: SinglePointOfFailure[], score: number): string[] {
    const recs: string[] = [];
    if (p1Count > 0) recs.push(`${p1Count} incidente(s) P1 em aberto — acionar equipe de resposta imediatamente.`);
    if (crisisCount > 0) recs.push(`${crisisCount} crise(s) ativa(s) — manter cadência de briefing a cada 2h.`);
    if (spofs.length > 0) recs.push(`${spofs.length} ponto(s) único(s) de falha identificados — priorizar redundância.`);
    if (score < 50) recs.push('Score de resiliência crítico — ativar plano de emergência e revisar arquitetura.');
    if (score >= 80) recs.push('Resiliência operacional em nível satisfatório. Manter testes periódicos de DR.');
    return recs;
  }

  private scoreToRating(score: number): ResilienceRating {
    if (score >= 85) return 'EXCELLENT';
    if (score >= 70) return 'GOOD';
    if (score >= 55) return 'ADEQUATE';
    if (score >= 35) return 'AT_RISK';
    return 'CRITICAL';
  }
}
