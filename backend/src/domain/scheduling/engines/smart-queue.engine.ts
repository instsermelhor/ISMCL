import { Injectable, Logger } from '@nestjs/common';
import { QueuePriority } from '../dto/scheduling.dto';

export interface QueueEntry {
  entryId: string;
  beneficiaryId: string;
  caseId?: string;
  priority: QueuePriority;
  riskScore: number;
  vulnerabilityScore: number;
  waitingSince: string;
  slaDeadline: string;  // Data-limite de atendimento conforme SLA da prioridade
  professionalId?: string;
  specialtyRequired: string;
}

const PRIORITY_SLA_HOURS: Record<QueuePriority, number> = {
  [QueuePriority.CRITICAL]: 0.5,    // 30 minutos
  [QueuePriority.EMERGENCY]: 2,
  [QueuePriority.URGENT]: 24,
  [QueuePriority.HIGH]: 48,
  [QueuePriority.ROUTINE]: 120,
};

/**
 * SmartQueueEngine — Motor de Fila Inteligente com Priorização Automatizada
 *
 * Determina a prioridade de atendimento de cada beneficiário levando em conta:
 * - Classificação de risco assistencial (herdada do Prompt 133 AAIRP)
 * - Urgência e gravidade clínica (CrisisDetectionEngine — Prompt 134 AIWSP)
 * - Vulnerabilidade social e familiar
 * - Tempo de espera já acumulado (penalidade crescente)
 * - Protocolos institucionais e regras do Workflow Engine
 *
 * Referências: P107 (AEIATP), P110 (AEWBPM), P134 AIWSP, P137 AISTCOP Etapa 4
 */
@Injectable()
export class SmartQueueEngine {
  private readonly logger = new Logger(SmartQueueEngine.name);

  // Fila por especialidade
  private readonly queues = new Map<string, QueueEntry[]>();

  /**
   * Calcula a prioridade da fila com base nos indicadores assistenciais.
   */
  calculatePriority(riskScore: number, vulnerabilityScore: number): QueuePriority {
    const composite = riskScore * 0.6 + vulnerabilityScore * 0.4;

    if (composite >= 85) return QueuePriority.CRITICAL;
    if (composite >= 70) return QueuePriority.EMERGENCY;
    if (composite >= 50) return QueuePriority.URGENT;
    if (composite >= 30) return QueuePriority.HIGH;
    return QueuePriority.ROUTINE;
  }

  /**
   * Adiciona beneficiário à fila de espera da especialidade.
   */
  enqueue(entry: Omit<QueueEntry, 'slaDeadline'>): QueueEntry {
    const slaHours = PRIORITY_SLA_HOURS[entry.priority];
    const slaDeadline = new Date(Date.now() + slaHours * 3_600_000).toISOString();
    const full: QueueEntry = { ...entry, slaDeadline };

    const specialtyQueue = this.queues.get(entry.specialtyRequired) ?? [];
    specialtyQueue.push(full);

    // Reordena a fila por prioridade (CRITICAL primeiro) e depois por tempo de espera
    const priorityOrder: Record<QueuePriority, number> = {
      [QueuePriority.CRITICAL]: 0,
      [QueuePriority.EMERGENCY]: 1,
      [QueuePriority.URGENT]: 2,
      [QueuePriority.HIGH]: 3,
      [QueuePriority.ROUTINE]: 4,
    };
    specialtyQueue.sort((a, b) => {
      const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (diff !== 0) return diff;
      return new Date(a.waitingSince).getTime() - new Date(b.waitingSince).getTime();
    });

    this.queues.set(entry.specialtyRequired, specialtyQueue);

    this.logger.log(
      `[SmartQueue] Beneficiário ${entry.beneficiaryId} enfileirado na especialidade "${entry.specialtyRequired}" com prioridade ${entry.priority}. SLA: ${slaDeadline}`,
    );

    return full;
  }

  /**
   * Retorna os próximos N beneficiários da fila de uma especialidade.
   */
  peek(specialty: string, limit = 10): QueueEntry[] {
    return (this.queues.get(specialty) ?? []).slice(0, limit);
  }

  /**
   * Remove o próximo beneficiário da fila (após agendamento).
   */
  dequeue(specialty: string): QueueEntry | undefined {
    const specialtyQueue = this.queues.get(specialty);
    if (!specialtyQueue?.length) return undefined;
    const next = specialtyQueue.shift();
    this.logger.log(`[SmartQueue] Beneficiário ${next?.beneficiaryId} retirado da fila de "${specialty}"`);
    return next;
  }
}
