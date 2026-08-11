import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';

export enum CaseAlertType {
  NO_VISIT_PROLONGED = 'NO_VISIT_PROLONGED',
  META_OVERDUE = 'META_OVERDUE',
  REFERRAL_NO_RETURN = 'REFERRAL_NO_RETURN',
  PIC_REVISION_OVERDUE = 'PIC_REVISION_OVERDUE',
  PENDING_DOCUMENT = 'PENDING_DOCUMENT',
}

export enum CaseAlertSeverity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum CaseAlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
}

export interface GeneratedAlertSummary {
  noVisitAlerts: number;
  metaOverdueAlerts: number;
  referralNoReturnAlerts: number;
  picRevisionOverdueAlerts: number;
  totalAlertsGenerated: number;
}

/**
 * CaseAlertSchedulerService — Scheduler de Monitoramento Automático de Casos Críticos
 *
 * Job executado diariamente às 09:00 (via Cron) para varrer casos ativos e identificar:
 * 1. NO_VISIT_PROLONGED: Casos sem evolução clínica ou atendimento há mais de 15 dias.
 * 2. META_OVERDUE: Metas do Plano Individual de Cuidado (PIC) com data-alvo vencida.
 * 3. REFERRAL_NO_RETURN: Encaminhamentos sem resultado/retorno há mais de 30 dias.
 * 4. PIC_REVISION_OVERDUE: Planos Individuais de Cuidado sem revisão/atualização há mais de 60 dias.
 *
 * Referências: PRD-AURA-001 (FR-AURA-023), REMEDIATION-AURA-001 (R2-05), GAP-P2-05
 */
@Injectable()
export class CaseAlertSchedulerService {
  private readonly logger = new Logger(CaseAlertSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Cron Job diário executado às 09:00.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM, { name: 'case-alerts-daily-check' })
  async handleDailyCron(): Promise<void> {
    this.logger.log('⏰ [CaseAlertScheduler] Iniciando verificação diária de alertas de casos (09:00)...');
    try {
      const summary = await this.checkAndGenerateAlerts();
      this.logger.log(
        `✅ [CaseAlertScheduler] Verificação concluída. ${summary.totalAlertsGenerated} novos alertas criados. ` +
          `(Sem movimentação: ${summary.noVisitAlerts}, Metas vencidas: ${summary.metaOverdueAlerts}, ` +
          `Encaminhamentos: ${summary.referralNoReturnAlerts}, Revisão PIC: ${summary.picRevisionOverdueAlerts})`,
      );
    } catch (error: any) {
      this.logger.error(`❌ [CaseAlertScheduler] Erro durante verificação de alertas: ${error.message}`, error.stack);
    }
  }

  /**
   * Executa a varredura completa de todas as 4 regras de alertas.
   */
  async checkAndGenerateAlerts(tenantId = 'default'): Promise<GeneratedAlertSummary> {
    const now = new Date();

    const noVisitCount = await this.checkNoVisitProlonged(now, tenantId);
    const metaOverdueCount = await this.checkMetaOverdue(now, tenantId);
    const referralCount = await this.checkReferralNoReturn(now, tenantId);
    const picRevisionCount = await this.checkPicRevisionOverdue(now, tenantId);

    const totalAlertsGenerated = noVisitCount + metaOverdueCount + referralCount + picRevisionCount;

    return {
      noVisitAlerts: noVisitCount,
      metaOverdueAlerts: metaOverdueCount,
      referralNoReturnAlerts: referralCount,
      picRevisionOverdueAlerts: picRevisionCount,
      totalAlertsGenerated,
    };
  }

  /**
   * Regra 1: Casos ativos sem evoluções ou atendimentos há > 15 dias.
   */
  private async checkNoVisitProlonged(now: Date, tenantId: string): Promise<number> {
    const thresholdDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    let count = 0;

    const activeCases = await this.prisma.case.findMany({
      where: { status: 'ACTIVE' },
      include: {
        beneficiary: {
          include: {
            evolutions: {
              orderBy: { clinicalDate: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    for (const caseRecord of activeCases) {
      const lastEvolution = caseRecord.beneficiary?.evolutions?.[0];
      const lastActivityDate = lastEvolution?.clinicalDate ?? caseRecord.createdAt;

      if (new Date(lastActivityDate) < thresholdDate) {
        const existingAlert = await this.prisma.caseAlert.findFirst({
          where: {
            caseId: caseRecord.id,
            type: CaseAlertType.NO_VISIT_PROLONGED,
            status: CaseAlertStatus.ACTIVE,
          },
        });

        if (!existingAlert) {
          const daysInactive = Math.floor(
            (now.getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24),
          );

          const alert = await this.prisma.caseAlert.create({
            data: {
              caseId: caseRecord.id,
              type: CaseAlertType.NO_VISIT_PROLONGED,
              severity: CaseAlertSeverity.HIGH,
              status: CaseAlertStatus.ACTIVE,
              message: `Caso sem evolução clínica registrada há ${daysInactive} dias (última atividade: ${new Date(lastActivityDate).toLocaleDateString('pt-BR')}).`,
            },
          });

          await this.publishAlertEvent(alert.id, caseRecord.id, alert.type, alert.message, tenantId);
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Regra 2: Metas (PicGoal) com targetDate < hoje e status PENDING ou IN_PROGRESS.
   */
  private async checkMetaOverdue(now: Date, tenantId: string): Promise<number> {
    let count = 0;

    const overdueGoals = await this.prisma.picGoal.findMany({
      where: {
        targetDate: { lt: now },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: {
        pic: {
          select: { caseId: true },
        },
      },
    });

    for (const goal of overdueGoals) {
      const caseId = goal.pic.caseId;

      const existingAlert = await this.prisma.caseAlert.findFirst({
        where: {
          caseId,
          type: CaseAlertType.META_OVERDUE,
          status: CaseAlertStatus.ACTIVE,
          message: { contains: goal.id },
        },
      });

      if (!existingAlert) {
        const alert = await this.prisma.caseAlert.create({
          data: {
            caseId,
            type: CaseAlertType.META_OVERDUE,
            severity: CaseAlertSeverity.HIGH,
            status: CaseAlertStatus.ACTIVE,
            message: `Meta do PIC vencida (ID: ${goal.id}): "${goal.description}" — prazo era ${new Date(goal.targetDate).toLocaleDateString('pt-BR')}.`,
          },
        });

        await this.publishAlertEvent(alert.id, caseId, alert.type, alert.message, tenantId);
        count++;
      }
    }

    return count;
  }

  /**
   * Regra 3: Referral com status PENDING há > 30 dias sem resultado.
   */
  private async checkReferralNoReturn(now: Date, tenantId: string): Promise<number> {
    const thresholdDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let count = 0;

    const pendingReferrals = await this.prisma.referral.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: thresholdDate },
        result: null,
      },
    });

    for (const referral of pendingReferrals) {
      const existingAlert = await this.prisma.caseAlert.findFirst({
        where: {
          caseId: referral.caseId,
          type: CaseAlertType.REFERRAL_NO_RETURN,
          status: CaseAlertStatus.ACTIVE,
          message: { contains: referral.id },
        },
      });

      if (!existingAlert) {
        const alert = await this.prisma.caseAlert.create({
          data: {
            caseId: referral.caseId,
            type: CaseAlertType.REFERRAL_NO_RETURN,
            severity: CaseAlertSeverity.MEDIUM,
            status: CaseAlertStatus.ACTIVE,
            message: `Encaminhamento (ID: ${referral.id}) para "${referral.destination}" sem retorno há mais de 30 dias.`,
          },
        });

        await this.publishAlertEvent(alert.id, referral.caseId, alert.type, alert.message, tenantId);
        count++;
      }
    }

    return count;
  }

  /**
   * Regra 4: IndividualCarePlan (PIC) ativo sem revisão há > 60 dias.
   */
  private async checkPicRevisionOverdue(now: Date, tenantId: string): Promise<number> {
    const thresholdDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    let count = 0;

    const activePics = await this.prisma.individualCarePlan.findMany({
      where: {
        status: 'ACTIVE',
        updatedAt: { lt: thresholdDate },
      },
    });

    for (const pic of activePics) {
      const existingAlert = await this.prisma.caseAlert.findFirst({
        where: {
          caseId: pic.caseId,
          type: CaseAlertType.PIC_REVISION_OVERDUE,
          status: CaseAlertStatus.ACTIVE,
        },
      });

      if (!existingAlert) {
        const alert = await this.prisma.caseAlert.create({
          data: {
            caseId: pic.caseId,
            type: CaseAlertType.PIC_REVISION_OVERDUE,
            severity: CaseAlertSeverity.MEDIUM,
            status: CaseAlertStatus.ACTIVE,
            message: `Plano Individual de Cuidado (PIC v${pic.version}) sem revisão há mais de 60 dias (última atualização: ${new Date(pic.updatedAt).toLocaleDateString('pt-BR')}).`,
          },
        });

        await this.publishAlertEvent(alert.id, pic.caseId, alert.type, alert.message, tenantId);
        count++;
      }
    }

    return count;
  }

  /**
   * Marca um alerta como resolvido.
   */
  async resolveAlert(alertId: string): Promise<any> {
    return this.prisma.caseAlert.update({
      where: { id: alertId },
      data: {
        status: CaseAlertStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Lista alertas ativos por caso.
   */
  async getActiveAlertsForCase(caseId: string): Promise<any[]> {
    return this.prisma.caseAlert.findMany({
      where: {
        caseId,
        status: CaseAlertStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async publishAlertEvent(
    alertId: string,
    caseId: string,
    type: string,
    message: string,
    tenantId: string,
  ): Promise<void> {
    await this.eventBus.publish(
      'aura.case.alert.generated.v1',
      { alertId, caseId, type, message },
      tenantId,
      { subject: caseId },
    );
  }
}
