import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IntakePriority, ReferralSpecialty } from '../dto/intake.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface AssistentialCase {
  caseId: string;
  intakeId: string;
  beneficiaryId: string;
  caseNumber: string; // Ex: AURA-2026-00892
  priority: IntakePriority;
  status: 'OPEN' | 'IN_TRIAGE' | 'ACTIVE' | 'ON_HOLD' | 'CLOSED';
  assignedSpecialties: ReferralSpecialty[];
  assignedProfessionalId?: string;
  timeline: Array<{ timestamp: string; title: string; description: string }>;
  openedAt: string;
  updatedAt: string;
}

/**
 * CaseOpeningService — Abertura Oficial e Gestão Inicial do Caso Assistencial
 *
 * Transforma uma triagem concluída em um **Caso Assistencial Estruturado**:
 * - Atribuição de número de caso único imutável (`AURA-YYYY-XXXXX`)
 * - Vínculo com o Beneficiário
 * - Linha do tempo institucional inicial
 * - Emissão do evento CloudEvents `aura.intake.case.created.v1`
 *
 * Referências: P110 (AEWBPM), P123 (AEDA), P134 (AIWSP Etapa 7)
 */
@Injectable()
export class CaseOpeningService {
  private readonly logger = new Logger(CaseOpeningService.name);

  // Storage de casos (no PostgreSQL/Prisma em produção)
  private readonly cases = new Map<string, AssistentialCase>();
  private caseSequence = 1000;

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Abre um novo caso assistencial a partir do acolhimento triado.
   */
  async openCase(
    intakeId: string,
    beneficiaryId: string,
    priority: IntakePriority,
    specialties: ReferralSpecialty[],
    tenantId = 'default',
  ): Promise<AssistentialCase> {
    const caseId = randomUUID();
    const year = new Date().getFullYear();
    this.caseSequence++;
    const caseNumber = `AURA-${year}-${String(this.caseSequence).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const newCase: AssistentialCase = {
      caseId,
      intakeId,
      beneficiaryId,
      caseNumber,
      priority,
      status: 'OPEN',
      assignedSpecialties: specialties,
      timeline: [
        {
          timestamp: now,
          title: 'Abertura do Caso Assistencial',
          description: `Caso ${caseNumber} aberto com prioridade ${priority}. Specialidades: ${specialties.join(', ')}.`,
        },
      ],
      openedAt: now,
      updatedAt: now,
    };

    this.cases.set(caseId, newCase);

    this.logger.log(
      `[CaseOpening] 📁 Caso ${caseNumber} (${caseId}) ABERTO com sucesso! Beneficiário: ${beneficiaryId}`,
    );

    // Emissão do evento institucional CloudEvents
    await this.eventBus.publish(
      'aura.intake.case.created.v1',
      {
        caseId,
        caseNumber,
        beneficiaryId,
        intakeId,
        priority,
        specialties,
      },
      tenantId,
      { subject: caseId },
    );

    return newCase;
  }

  /**
   * Busca um caso pelo ID.
   */
  async getCaseById(caseId: string): Promise<AssistentialCase | undefined> {
    return this.cases.get(caseId);
  }
}
