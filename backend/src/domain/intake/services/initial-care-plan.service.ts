import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateCarePlanDto, ReferralSpecialty } from '../dto/intake.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface InitialCarePlan {
  planId: string;
  caseId: string;
  goals: string[];
  specialties: ReferralSpecialty[];
  recommendedFrequency: string;
  immediateActions: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * InitialCarePlanService — Geração do Plano Inicial de Atendimento Multidisciplinar
 *
 * Constrói a proposta assistencial inicial com metas de curto e médio prazo,
 * frequências de consulta recomendadas e ações imediatas.
 *
 * Referências: P110 (AEWBPM), P134 (AIWSP Etapa 9)
 */
@Injectable()
export class InitialCarePlanService {
  private readonly logger = new Logger(InitialCarePlanService.name);

  // Storage de planos de atendimento
  private readonly plans = new Map<string, InitialCarePlan>();

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Cria o Plano Inicial de Atendimento para o caso assistencial.
   */
  async createCarePlan(dto: CreateCarePlanDto, tenantId = 'default'): Promise<InitialCarePlan> {
    const planId = randomUUID();
    const now = new Date().toISOString();

    const plan: InitialCarePlan = {
      planId,
      caseId: dto.caseId,
      goals: dto.goals,
      specialties: dto.specialties,
      recommendedFrequency: dto.recommendedFrequency,
      immediateActions: [
        'Agendar primeira consulta de acolhimento especializado',
        'Validar documentação necessária com o serviço social',
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.plans.set(planId, plan);

    this.logger.log(`[CarePlan] Plano de Atendimento ${planId} criado para o caso ${dto.caseId}`);

    await this.eventBus.publish(
      'aura.intake.careplan.created.v1',
      {
        planId,
        caseId: dto.caseId,
        goalsCount: dto.goals.length,
        specialties: dto.specialties,
      },
      tenantId,
      { subject: dto.caseId },
    );

    return plan;
  }

  /**
   * Busca o plano de atendimento pelo ID do caso.
   */
  async getCarePlanByCaseId(caseId: string): Promise<InitialCarePlan | undefined> {
    return Array.from(this.plans.values()).find((p) => p.caseId === caseId);
  }
}
