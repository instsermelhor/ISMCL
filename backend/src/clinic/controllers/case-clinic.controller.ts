import { Controller, Post, Get, Body, Param, UseGuards, Req, SetMetadata, Patch } from '@nestjs/common';
import { PortalAccessGuard } from '../../auth/guards/portal-access.guard.ts';
import { CaseCareService } from '../services/case-care.service.ts';
import { Request } from 'express';

export const RequirePortal = (portal: 'ADMIN' | 'CLINIC') => SetMetadata('portal', portal);

interface GoalStatusPayload {
  status: 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED' | 'NOT_ACHIEVED';
}

interface PicPayload {
  generalObjectives: string;
  specificObjectives: string;
  familyCommitments?: string;
  goals: Array<{
    description: string;
    intervention: string;
    indicator: string;
    targetDate: Date;
    status: string;
    responsibleId: string;
  }>;
}

interface MeetingPayload {
  meetingDate: Date;
  agenda: string;
  minutes: string;
  decisions: string;
  pendingTasks: any;
  participants: string[];
}

interface ReferralPayload {
  type: 'INTERNAL' | 'EXTERNAL';
  destination: string;
  reason: string;
}

interface ReferralUpdatePayload {
  status: string;
  result?: string;
}

/**
 * CLINIC CONTROLLER - GESTÃO CLÍNICA E MULTIDISCIPLINAR DE CASOS
 * Acessível por profissionais de saúde mental e assistentes sociais alocados.
 */
@Controller('clinic/cases')
@UseGuards(PortalAccessGuard)
@RequirePortal('CLINIC')
export class CaseClinicController {
  constructor(private readonly caseCareService: CaseCareService) {}

  /**
   * Retorna o PIC ativo de um caso.
   */
  @Get(':id/pic')
  async getActivePic(@Param('id') caseId: string) {
    const pic = await this.caseCareService.getActivePic(caseId);
    return { success: true, data: pic };
  }

  /**
   * Salva ou revisa o PIC do caso.
   */
  @Post(':id/pic')
  async savePic(
    @Param('id') caseId: string,
    @Body() data: PicPayload,
    @Req() req: Request
  ) {
    const professionalId = (req as any).user['id'];
    const pic = await this.caseCareService.savePic(caseId, {
      ...data,
      signedById: professionalId
    });

    return {
      success: true,
      message: 'Plano Individual de Cuidado (PIC) atualizado e versionado.',
      data: pic
    };
  }

  /**
   * Atualiza o status de uma meta específica do PIC.
   */
  @Patch('goals/:goalId')
  async updateGoalStatus(
    @Param('goalId') goalId: string,
    @Body() data: GoalStatusPayload
  ) {
    const goal = await this.caseCareService.updateGoalStatus(goalId, data.status);
    return {
      success: true,
      message: 'Status da meta atualizado com sucesso.',
      data: goal
    };
  }

  /**
   * Retorna o histórico de versões do PIC.
   */
  @Get(':id/pic/history')
  async getPicHistory(@Param('id') caseId: string) {
    const history = await this.caseCareService.getPicHistory(caseId);
    return { success: true, data: history };
  }

  /**
   * Registra uma Reunião Multidisciplinar.
   */
  @Post(':id/meetings')
  async createMeeting(
    @Param('id') caseId: string,
    @Body() data: MeetingPayload
  ) {
    const meeting = await this.caseCareService.createMeeting(caseId, data);
    return {
      success: true,
      message: 'Ata de reunião multidisciplinar registrada com sucesso.',
      data: meeting
    };
  }

  /**
   * Lista as reuniões multidisciplinares de um caso.
   */
  @Get(':id/meetings')
  async getMeetings(@Param('id') caseId: string) {
    const meetings = await this.caseCareService.getMeetings(caseId);
    return { success: true, data: meetings };
  }

  /**
   * Registra um encaminhamento.
   */
  @Post(':id/referrals')
  async createReferral(
    @Param('id') caseId: string,
    @Body() data: ReferralPayload,
    @Req() req: Request
  ) {
    const professionalId = (req as any).user['id'];
    const referral = await this.caseCareService.createReferral(caseId, {
      ...data,
      professionalId
    });

    return {
      success: true,
      message: 'Encaminhamento registrado e emitido.',
      data: referral
    };
  }

  /**
   * Atualiza um encaminhamento.
   */
  @Patch('referrals/:referralId')
  async updateReferral(
    @Param('referralId') referralId: string,
    @Body() data: ReferralUpdatePayload
  ) {
    const referral = await this.caseCareService.updateReferral(referralId, data);
    return {
      success: true,
      message: 'Status do encaminhamento atualizado.',
      data: referral
    };
  }

  /**
   * Lista os encaminhamentos de um caso.
   */
  @Get(':id/referrals')
  async getReferrals(@Param('id') caseId: string) {
    const referrals = await this.caseCareService.getReferrals(caseId);
    return { success: true, data: referrals };
  }

  /**
   * Retorna os alertas de inatividade e pendências ativas do caso.
   */
  @Get(':id/alerts')
  async getAlerts(@Param('id') caseId: string) {
    const alerts = await this.caseCareService.getAlerts(caseId);
    return { success: true, data: alerts };
  }

  /**
   * Retorna a Linha do Tempo Longitudinal consolidada.
   */
  @Get(':id/timeline')
  async getCaseTimeline(@Param('id') caseId: string) {
    const timeline = await this.caseCareService.getCaseTimeline(caseId);
    return { success: true, data: timeline };
  }
}
