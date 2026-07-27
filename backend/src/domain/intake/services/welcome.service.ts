import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StartWelcomeDto, SubmitScreeningDto, DemandOrigin } from '../dto/intake.dto';
import { CrisisDetectionEngine } from '../engines/crisis-detection.engine';
import { PriorityClassificationEngine } from '../engines/priority-classification.engine';
import { ReferralRecommendationEngine } from '../engines/referral-recommendation.engine';
import { CaseOpeningService } from './case-opening.service';
import { InitialCarePlanService } from './initial-care-plan.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface WelcomeSession {
  intakeId: string;
  beneficiaryId: string;
  origin: DemandOrigin;
  initialChiefComplaint: string;
  referralCode?: string;
  status: 'STARTED' | 'SCREENING_COMPLETED' | 'CASE_CREATED' | 'CANCELLED';
  clinicalFactors: string[];
  psychosocialFactors: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * WelcomeService — Orquestrador do Acolhimento, Triagem e Admissão de Casos
 *
 * Gerencia a jornada assistencial inicial:
 * 1. Recepção Digital e Acolhimento Humanizado
 * 2. Triagem Multidisciplinar Adaptativa
 * 3. Detecção Precoce de Crises
 * 4. Classificação de Prioridade e SLA
 * 5. Abertura do Caso Assistencial
 * 6. Encaminhamento Inteligente para Especialidades
 * 7. Geração do Plano Inicial de Atendimento
 *
 * Referências: P110 (AEWBPM), P123 (AEDA), P134 (AIWSP)
 */
@Injectable()
export class WelcomeService {
  private readonly logger = new Logger(WelcomeService.name);

  // Storage de sessões de acolhimento em andamento
  private readonly intakes = new Map<string, WelcomeSession>();

  constructor(
    private readonly crisisEngine: CrisisDetectionEngine,
    private readonly priorityEngine: PriorityClassificationEngine,
    private readonly referralEngine: ReferralRecommendationEngine,
    private readonly caseService: CaseOpeningService,
    private readonly carePlanService: InitialCarePlanService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Registra a recepção e inicia a sessão de acolhimento.
   */
  async startWelcome(dto: StartWelcomeDto, tenantId = 'default') {
    const intakeId = randomUUID();
    const now = new Date().toISOString();

    const session: WelcomeSession = {
      intakeId,
      beneficiaryId: dto.beneficiaryId,
      origin: dto.origin,
      initialChiefComplaint: dto.initialChiefComplaint,
      referralCode: dto.referralCode,
      status: 'STARTED',
      clinicalFactors: [],
      psychosocialFactors: [],
      createdAt: now,
      updatedAt: now,
    };

    this.intakes.set(intakeId, session);

    this.logger.log(`[Welcome] Acolhimento iniciado: ${intakeId} para Beneficiário ${dto.beneficiaryId}`);

    await this.eventBus.publish(
      'aura.intake.welcome.started.v1',
      {
        intakeId,
        beneficiaryId: dto.beneficiaryId,
        origin: dto.origin,
      },
      tenantId,
      { subject: intakeId },
    );

    return {
      intakeId,
      beneficiaryId: dto.beneficiaryId,
      status: session.status,
      startedAt: session.createdAt,
    };
  }

  /**
   * Conclui a triagem multidisciplinar e executa o fluxo inteligente completo.
   */
  async submitScreening(dto: SubmitScreeningDto, tenantId = 'default') {
    const session = this.intakes.get(dto.intakeId);
    if (!session) {
      throw new NotFoundException(`Sessão de acolhimento ${dto.intakeId} não encontrada.`);
    }

    session.clinicalFactors = dto.clinicalFactors;
    session.psychosocialFactors = dto.psychosocialFactors;
    session.status = 'SCREENING_COMPLETED';
    session.updatedAt = new Date().toISOString();

    // 1. Avaliação de Crise
    const allFactors = [...dto.clinicalFactors, ...dto.psychosocialFactors];
    const crisisAnalysis = await this.crisisEngine.evaluate(
      session.intakeId,
      session.initialChiefComplaint,
      allFactors,
      tenantId,
    );

    // 2. Classificação de Prioridade
    const priorityResult = this.priorityEngine.classify(
      crisisAnalysis.hasCrisis,
      crisisAnalysis.hasCrisis ? 30 : 15,
      dto.clinicalFactors.length,
      dto.psychosocialFactors.length,
    );

    // 3. Recomendação de Encaminhamento
    const referrals = this.referralEngine.recommend(
      priorityResult.priority,
      dto.clinicalFactors,
      dto.psychosocialFactors,
      crisisAnalysis.hasCrisis,
    );

    // 4. Abertura do Caso Assistencial
    const specialties = referrals.map((r) => r.specialty);
    const assistentialCase = await this.caseService.openCase(
      session.intakeId,
      session.beneficiaryId,
      priorityResult.priority,
      specialties,
      tenantId,
    );

    // 5. Geração do Plano Inicial de Atendimento
    const carePlan = await this.carePlanService.createCarePlan(
      {
        caseId: assistentialCase.caseId,
        goals: [
          'Acolhimento multidisciplinar de estabilização',
          'Avaliação diagnóstica especializada',
        ],
        specialties,
        recommendedFrequency: priorityResult.priority === 'CRITICAL' ? 'DIARIO' : 'SEMANAL',
      },
      tenantId,
    );

    session.status = 'CASE_CREATED';

    await this.eventBus.publish(
      'aura.intake.screening.completed.v1',
      {
        intakeId: session.intakeId,
        caseId: assistentialCase.caseId,
        priority: priorityResult.priority,
        hasCrisis: crisisAnalysis.hasCrisis,
      },
      tenantId,
      { subject: session.intakeId },
    );

    return {
      intakeId: session.intakeId,
      case: assistentialCase,
      priorityResult,
      crisisAnalysis,
      referrals,
      carePlan,
    };
  }
}
