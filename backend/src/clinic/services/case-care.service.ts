import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';

@Injectable()
export class CaseCareService {
  constructor(
    @Inject('db') private readonly db: any
  ) {}

  /**
   * Obtém o PIC ativo de um caso.
   */
  async getActivePic(caseId: string) {
    return await this.db.individualCarePlan.findFirst({
      where: { caseId, status: 'ACTIVE' },
      include: { goals: { include: { responsible: true } }, signedBy: true }
    });
  }

  /**
   * Cria ou atualiza o PIC, salvando uma versão histórica se já houver um anterior.
   */
  async savePic(caseId: string, data: {
    generalObjectives: string;
    specificObjectives: string;
    familyCommitments?: string;
    signedById: string;
    goals: Array<{
      description: string;
      intervention: string;
      indicator: string;
      targetDate: Date;
      status: string;
      responsibleId: string;
    }>;
  }) {
    const existingPic = await this.db.individualCarePlan.findFirst({
      where: { caseId, status: 'ACTIVE' },
      include: { goals: true }
    });

    return await this.db.$transaction(async (prisma: any) => {
      // Se existe, cria uma versão de backup histórica
      if (existingPic) {
        await prisma.picVersion.create({
          data: {
            picId: existingPic.id,
            version: existingPic.version,
            changedById: data.signedById,
            changeSummary: 'Atualização do plano de cuidado',
            contentSnapshot: existingPic // Salva o snapshot JSON completo
          }
        });

        // Desativa o PIC atual para dar lugar ao novo
        await prisma.individualCarePlan.update({
          where: { id: existingPic.id },
          data: { status: 'REVISED' }
        });
      }

      const nextVersion = existingPic ? existingPic.version + 1 : 1;

      // Cria o novo PIC ativo
      const newPic = await prisma.individualCarePlan.create({
        data: {
          caseId,
          generalObjectives: data.generalObjectives,
          specificObjectives: data.specificObjectives,
          familyCommitments: data.familyCommitments,
          status: 'ACTIVE',
          version: nextVersion,
          signedById: data.signedById,
          signedAt: new Date(),
          goals: {
            create: data.goals.map(g => ({
              description: g.description,
              intervention: g.intervention,
              indicator: g.indicator,
              targetDate: new Date(g.targetDate),
              status: g.status || 'PENDING',
              responsibleId: g.responsibleId
            }))
          }
        },
        include: { goals: true }
      });

      return newPic;
    });
  }

  /**
   * Altera o status de uma meta do PIC.
   */
  async updateGoalStatus(goalId: string, status: 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED' | 'NOT_ACHIEVED') {
    const goal = await this.db.picGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Meta não encontrada.');

    return await this.db.picGoal.update({
      where: { id: goalId },
      data: { status }
    });
  }

  /**
   * Retorna o histórico de versões do PIC para um caso.
   */
  async getPicHistory(caseId: string) {
    return await this.db.picVersion.findMany({
      where: { pic: { caseId } },
      orderBy: { version: 'desc' },
      include: { changedBy: true }
    });
  }

  /**
   * Registra uma nova Reunião Multidisciplinar.
   */
  async createMeeting(caseId: string, data: {
    meetingDate: Date;
    agenda: string;
    minutes: string;
    decisions: string;
    pendingTasks: any;
    participants: string[]; // Array de IDs de profissionais
  }) {
    return await this.db.$transaction(async (prisma: any) => {
      const meeting = await prisma.caseMeeting.create({
        data: {
          caseId,
          meetingDate: new Date(data.meetingDate),
          agenda: data.agenda,
          minutes: data.minutes,
          decisions: data.decisions,
          pendingTasks: data.pendingTasks
        }
      });

      // Cria os participantes
      await Promise.all(
        data.participants.map((profId: string) =>
          prisma.caseMeetingParticipant.create({
            data: {
              meetingId: meeting.id,
              professionalId: profId,
              role: 'TECHNICAL_ADVISOR',
              attended: true
            }
          })
        )
      );

      return meeting;
    });
  }

  /**
   * Retorna as reuniões multidisciplinares de um caso.
   */
  async getMeetings(caseId: string) {
    return await this.db.caseMeeting.findMany({
      where: { caseId },
      include: { participants: { include: { professional: true } } },
      orderBy: { meetingDate: 'desc' }
    });
  }

  /**
   * Cria um encaminhamento técnico (interno ou externo).
   */
  async createReferral(caseId: string, data: {
    professionalId: string;
    type: 'INTERNAL' | 'EXTERNAL';
    destination: string;
    reason: string;
  }) {
    return await this.db.referral.create({
      data: {
        caseId,
        professionalId: data.professionalId,
        type: data.type,
        destination: data.destination,
        reason: data.reason,
        status: 'PENDING'
      }
    });
  }

  /**
   * Atualiza o status/retorno de um encaminhamento.
   */
  async updateReferral(referralId: string, data: {
    status: string;
    result?: string;
  }) {
    return await this.db.referral.update({
      where: { id: referralId },
      data: {
        status: data.status,
        result: data.result,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Retorna os encaminhamentos de um caso.
   */
  async getReferrals(caseId: string) {
    return await this.db.referral.findMany({
      where: { caseId },
      include: { professional: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Retorna os alertas de um caso.
   */
  async getAlerts(caseId: string) {
    return await this.db.caseAlert.findMany({
      where: { caseId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Compila a Linha do Tempo Longitudinal consolidando todos os eventos do caso.
   */
  async getCaseTimeline(caseId: string) {
    const appointments = await this.db.appointment.findMany({
      where: { beneficiary: { cases: { some: { id: caseId } } } },
      include: { professional: true }
    });

    const evolutions = await this.db.clinicalEvolution.findMany({
      where: { caseId },
      include: { professional: true }
    });

    const documents = await this.db.clinicalDocument.findMany({
      where: { caseId },
      include: { professional: true }
    });

    const meetings = await this.db.caseMeeting.findMany({
      where: { caseId }
    });

    const referrals = await this.db.referral.findMany({
      where: { caseId },
      include: { professional: true }
    });

    const picChanges = await this.db.picVersion.findMany({
      where: { pic: { caseId } },
      include: { changedBy: true }
    });

    // Mapeia todos para um formato comum de evento
    const events: any[] = [];

    appointments.forEach((a: any) => {
      events.push({
        id: a.id,
        type: 'APPOINTMENT',
        date: a.scheduledStart,
        title: `Consulta Agendada (${a.type})`,
        description: `Profissional: ${a.professional.fullName}. Status: ${a.status}`,
        metadata: { status: a.status }
      });
    });

    evolutions.forEach((e: any) => {
      events.push({
        id: e.id,
        type: 'EVOLUTION',
        date: e.clinicalDate,
        title: `Evolução Registrada`,
        description: e.summary || `Sessão clínica de ${e.durationMinutes} min. Modalidade: ${e.modality}`,
        metadata: { visibility: e.visibility, professional: e.professional.fullName }
      });
    });

    documents.forEach((d: any) => {
      events.push({
        id: d.id,
        type: 'DOCUMENT',
        date: d.createdAt,
        title: `Documento Emitido: ${d.title}`,
        description: `Tipo: ${d.type}. Status: ${d.status}`,
        metadata: { type: d.type }
      });
    });

    meetings.forEach((m: any) => {
      events.push({
        id: m.id,
        type: 'MEETING',
        date: m.meetingDate,
        title: 'Reunião Multidisciplinar',
        description: `Pauta: ${m.agenda}`,
        metadata: { decisions: m.decisions }
      });
    });

    referrals.forEach((r: any) => {
      events.push({
        id: r.id,
        type: 'REFERRAL',
        date: r.createdAt,
        title: `Encaminhamento (${r.type})`,
        description: `Destino: ${r.destination}. Motivo: ${r.reason}`,
        metadata: { status: r.status, result: r.result }
      });
    });

    picChanges.forEach((p: any) => {
      events.push({
        id: p.id,
        type: 'PIC_UPDATE',
        date: p.createdAt,
        title: `PIC Atualizado - Versão v${p.version}`,
        description: `Alterado por: ${p.changedBy.fullName}. Resumo: ${p.changeSummary}`,
        metadata: { version: p.version }
      });
    });

    // Ordena de forma decrescente por data
    events.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());

    return events;
  }
}
