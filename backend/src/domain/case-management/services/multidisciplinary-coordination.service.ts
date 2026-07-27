import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AssignMultidisciplinaryTeamDto } from '../dto/case-management.dto';
import { CaseTimelineService } from './case-timeline.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface MultidisciplinaryTeam {
  caseId: string;
  leadProfessionalId: string;
  teamMemberIds: string[];
  assignedAt: string;
}

/**
 * MultidisciplinaryCoordinationService — Coordenação de Equipes Multidisciplinares
 *
 * Articula a atuação conjunta de Médicos, Psicólogos, Assistentes Sociais e Coordenadores Técnicos:
 * - Atribuição de responsável técnico principal do caso
 * - Vinculação da equipe multiprofissional
 * - Registro de reuniões de alinhamento e pareceres
 * - Emissão do evento `aura.case.assigned.v1`
 *
 * Referências: P110 (AEWBPM), P135 (AECMP Etapa 4)
 */
@Injectable()
export class MultidisciplinaryCoordinationService {
  private readonly logger = new Logger(MultidisciplinaryCoordinationService.name);

  // Storage de equipes associadas a casos
  private readonly teams = new Map<string, MultidisciplinaryTeam>();

  constructor(
    private readonly timelineService: CaseTimelineService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Designa a equipe multidisciplinar responsável pelo caso.
   */
  async assignTeam(dto: AssignMultidisciplinaryTeamDto, tenantId = 'default'): Promise<MultidisciplinaryTeam> {
    const team: MultidisciplinaryTeam = {
      caseId: dto.caseId,
      leadProfessionalId: dto.leadProfessionalId,
      teamMemberIds: dto.teamMemberIds ?? [],
      assignedAt: new Date().toISOString(),
    };

    this.teams.set(dto.caseId, team);

    this.logger.log(
      `[Multidisciplinary] Equipe atribuída ao caso ${dto.caseId}: Lead=${dto.leadProfessionalId}, Membros=${team.teamMemberIds.length}`,
    );

    await this.timelineService.addEntry(
      dto.caseId,
      'TEAM_ASSIGNED',
      'Equipe Multidisciplinar Atribuída',
      `Profissional responsável: ${dto.leadProfessionalId}. Membros adicionais: ${team.teamMemberIds.length}.`,
    );

    await this.eventBus.publish(
      'aura.case.assigned.v1',
      {
        caseId: dto.caseId,
        leadProfessionalId: dto.leadProfessionalId,
        teamMemberIds: team.teamMemberIds,
      },
      tenantId,
      { subject: dto.caseId },
    );

    return team;
  }

  /**
   * Retorna a equipe vinculada ao caso.
   */
  async getTeamForCase(caseId: string): Promise<MultidisciplinaryTeam> {
    const team = this.teams.get(caseId);
    if (!team) {
      throw new NotFoundException(`Equipe não encontrada para o caso ${caseId}.`);
    }
    return team;
  }
}
