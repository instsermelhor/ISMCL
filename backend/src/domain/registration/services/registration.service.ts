import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  StartRegistrationDto,
  SubmitRegistrationDto,
  TargetProfileType,
} from '../dto/registration.dto';
import { DynamicFormsEngine } from '../engines/dynamic-forms.engine';
import { AdaptiveQuestionnaireEngine } from '../engines/adaptive-questionnaire.engine';
import { EligibilityEngine } from '../engines/eligibility.engine';
import { RiskClassificationService } from './risk-classification.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface RegistrationSession {
  registrationId: string;
  profileType: TargetProfileType;
  userId?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * RegistrationService — Orquestrador do Cadastro Inteligente Adaptativo
 *
 * Gerencia o ciclo de vida completo do processo de cadastro de beneficiários,
 * profissionais, voluntários e parceiros institucionais.
 *
 * Referências: P110 (AEWBPM), P123 (AEDA), P133 (AAIRP Etapa 2)
 */
@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  // Storage das sessões de cadastro em andamento
  private readonly sessions = new Map<string, RegistrationSession>();

  constructor(
    private readonly dynamicFormsEngine: DynamicFormsEngine,
    private readonly questionnaireEngine: AdaptiveQuestionnaireEngine,
    private readonly eligibilityEngine: EligibilityEngine,
    private readonly riskService: RiskClassificationService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Inicia um novo processo de cadastro adaptativo.
   */
  async startRegistration(dto: StartRegistrationDto, tenantId = 'default') {
    const registrationId = randomUUID();
    const now = new Date().toISOString();

    const session: RegistrationSession = {
      registrationId,
      profileType: dto.profileType,
      userId: dto.userId,
      status: 'IN_PROGRESS',
      answers: dto.initialData ?? {},
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(registrationId, session);

    this.logger.log(
      `[Registration] Novo cadastro iniciado: ${registrationId} (${dto.profileType})`,
    );

    await this.eventBus.publish(
      'aura.registration.started.v1',
      { registrationId, profileType: dto.profileType, userId: dto.userId },
      tenantId,
      { subject: registrationId },
    );

    const formSchema = this.dynamicFormsEngine.getFormSchema(dto.profileType);

    return {
      registrationId,
      profileType: dto.profileType,
      formSchema,
      answers: session.answers,
    };
  }

  /**
   * Envia as respostas das etapas do formulário e calcula o progresso.
   */
  async submitStep(dto: SubmitRegistrationDto, tenantId = 'default') {
    const session = this.sessions.get(dto.registrationId);
    if (!session) {
      throw new NotFoundException(
        `Sessão de cadastro ${dto.registrationId} não encontrada.`,
      );
    }

    session.answers = { ...session.answers, ...dto.formData };
    session.updatedAt = new Date().toISOString();

    // Avalia o questionário adaptativo em tempo real
    const flowResult = this.questionnaireEngine.evaluateFlow(
      session.answers as Record<string, string>,
    );

    this.logger.log(
      `[Registration] Respostas recebidas para ${dto.registrationId}. Progresso: ${flowResult.completionPercentage}%`,
    );

    return {
      registrationId: session.registrationId,
      completionPercentage: flowResult.completionPercentage,
      nextQuestion: flowResult.nextQuestion,
      flaggedVulnerabilities: flowResult.flaggedVulnerabilities,
      isCompleted: flowResult.isCompleted,
    };
  }

  /**
   * Finaliza o processo de cadastro adaptativo e aciona motores de elegibilidade e risco.
   */
  async completeRegistration(registrationId: string, tenantId = 'default') {
    const session = this.sessions.get(registrationId);
    if (!session) {
      throw new NotFoundException(`Cadastro ${registrationId} não encontrado.`);
    }

    session.status = 'COMPLETED';
    session.updatedAt = new Date().toISOString();

    // 1. Avalia Elegibilidade
    const monthlyIncome = Number(session.answers['rendaFamiliar'] ?? 0);
    const familyMembersCount = Number(session.answers['membrosFamilia'] ?? 1);

    const eligibilityResult = this.eligibilityEngine.evaluate({
      registrationId,
      monthlyIncome,
      familyMembersCount,
      location: String(session.answers['municipio'] ?? 'SP - São Paulo'),
    });

    // 2. Classifica Matriz de Risco
    const riskAnalysis = await this.riskService.classifyRisk(
      {
        registrationId,
        clinicalScore: Number(session.answers['scoreClinico'] ?? 20),
        psychosocialScore: Number(session.answers['scorePsicossocial'] ?? 30),
        vulnerabilityScore: Number(session.answers['scoreVulnerabilidade'] ?? 40),
      },
      tenantId,
    );

    // 3. Evento de Conclusão do Cadastro
    await this.eventBus.publish(
      'aura.registration.completed.v1',
      {
        registrationId,
        profileType: session.profileType,
        eligibilityStatus: eligibilityResult.status,
        overallRiskLevel: riskAnalysis.overallRiskLevel,
      },
      tenantId,
      { subject: registrationId },
    );

    this.logger.log(
      `[Registration] Cadastro ${registrationId} CONCLUÍDO com sucesso! Status Elegibilidade: ${eligibilityResult.status}`,
    );

    return {
      registrationId,
      status: session.status,
      eligibilityResult,
      riskAnalysis,
      completedAt: session.updatedAt,
    };
  }
}
