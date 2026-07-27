import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RecordSensitivityClassification } from '../dto/ehr.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface ElectronicHealthRecord {
  ehrId: string;
  beneficiaryId: string;
  recordNumber: string; // Ex: PEP-2026-00045
  status: 'ACTIVE' | 'ARCHIVED' | 'RESTRICTED';
  sensitivity: RecordSensitivityClassification;
  createdAt: string;
  updatedAt: string;
}

export interface BreakGlassLog {
  logId: string;
  ehrId: string;
  beneficiaryId: string;
  requestedByUserId: string;
  justification: string;
  accessedAt: string;
  socAlertGenerated: boolean;
}

/**
 * ElectronicHealthRecordService — Prontuário Eletrônico Integrado Longitudinal (EHR / PEP)
 *
 * Repositório central de saúde e assistência social do beneficiário.
 *
 * Funcionalidades:
 * - Atribuição de número imutável de prontuário (`PEP-YYYY-XXXXX`)
 * - Controle de sensibilidade e segregação de informações
 * - **Política Break Glass (Acesso Emergencial)**: Permite acesso médico em emergências
 *   mediante justificativa obrigatória, gerando alerta automático ao SOC (Security Operations Center)
 *   e emitindo o evento `aura.ehr.breakglass.used.v1`.
 *
 * Referências: P107 (AEIATP), P128 (AECS - Zero Trust), P136 (AIEHSR Etapas 2 e 12)
 */
@Injectable()
export class ElectronicHealthRecordService {
  private readonly logger = new Logger(ElectronicHealthRecordService.name);

  // Storage de Prontuários e Logs Break Glass
  private readonly ehrStore = new Map<string, ElectronicHealthRecord>();
  private readonly breakGlassLogs: BreakGlassLog[] = [];
  private sequenceNumber = 100;

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Cria ou obtém o Prontuário Eletrônico Integrado do Beneficiário.
   */
  async getOrCreateEhr(beneficiaryId: string, tenantId = 'default'): Promise<ElectronicHealthRecord> {
    for (const record of this.ehrStore.values()) {
      if (record.beneficiaryId === beneficiaryId) {
        return record;
      }
    }

    const ehrId = randomUUID();
    const year = new Date().getFullYear();
    this.sequenceNumber++;
    const recordNumber = `PEP-${year}-${String(this.sequenceNumber).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const newRecord: ElectronicHealthRecord = {
      ehrId,
      beneficiaryId,
      recordNumber,
      status: 'ACTIVE',
      sensitivity: RecordSensitivityClassification.STANDARD,
      createdAt: now,
      updatedAt: now,
    };

    this.ehrStore.set(ehrId, newRecord);

    this.logger.log(`[EHR] 🏥 Prontuário Eletrônico Integrado Criado: ${recordNumber} (${ehrId})`);

    await this.eventBus.publish(
      'aura.ehr.created.v1',
      { ehrId, beneficiaryId, recordNumber },
      tenantId,
      { subject: ehrId },
    );

    return newRecord;
  }

  /**
   * Executa o acesso emergencial Break Glass ao Prontuário.
   */
  async executeBreakGlass(
    ehrId: string,
    userId: string,
    justification: string,
    tenantId = 'default',
  ): Promise<BreakGlassLog> {
    const ehr = this.ehrStore.get(ehrId);
    if (!ehr) {
      throw new NotFoundException(`Prontuário Eletrônico ${ehrId} não encontrado.`);
    }

    if (!justification || justification.trim().length < 10) {
      throw new ForbiddenException(
        'Justificativa clínica/legal de no mínimo 10 caracteres é obrigatória para o acesso emergencial Break Glass.',
      );
    }

    const logId = randomUUID();
    const accessedAt = new Date().toISOString();

    const log: BreakGlassLog = {
      logId,
      ehrId,
      beneficiaryId: ehr.beneficiaryId,
      requestedByUserId: userId,
      justification,
      accessedAt,
      socAlertGenerated: true,
    };

    this.breakGlassLogs.push(log);

    this.logger.error(
      `[EHR] 🚨 BREAK GLASS EXECUTADO por usuário ${userId} no Prontuário ${ehr.recordNumber}! Motivo: "${justification}"`,
    );

    // Notificação imediata ao SOC via EventBus
    await this.eventBus.publish(
      'aura.ehr.breakglass.used.v1',
      {
        logId,
        ehrId,
        recordNumber: ehr.recordNumber,
        requestedByUserId: userId,
        justification,
        accessedAt,
      },
      tenantId,
      { subject: ehrId },
    );

    return log;
  }
}
