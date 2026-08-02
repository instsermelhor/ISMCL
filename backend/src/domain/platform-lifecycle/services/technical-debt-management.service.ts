import { Injectable, Logger } from '@nestjs/common';
import {
  RegisterTechnicalDebtDto,
  TechnicalDebtCategory,
  TechnicalDebtSeverity,
} from '../dto/platform-lifecycle.dto';
import { LifecycleAuditService } from './lifecycle-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface TechnicalDebtRecord {
  debtId: string;
  category: TechnicalDebtCategory;
  severity: TechnicalDebtSeverity;
  description: string;
  affectedComponent: string;
  estimatedEffortHours: number;
  priorityScore: number; // 1-100
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  registeredAt: string;
}

/**
 * TechnicalDebtManagementService — Gestão da Dívida Técnica (P162 EPLM)
 *
 * Identifica, classifica e prioriza dívida técnica (código legado, duplicações,
 * dependências obsoletas, antipadrões, vulnerabilidades, docs e testes insuficientes).
 */
@Injectable()
export class TechnicalDebtManagementService {
  private readonly logger = new Logger(TechnicalDebtManagementService.name);
  private debtRegistry: Map<string, TechnicalDebtRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: LifecycleAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedDebt();
  }

  private seedDebt(): void {
    const seeds: RegisterTechnicalDebtDto[] = [
      {
        category: TechnicalDebtCategory.OBSOLETE_DEPENDENCY,
        severity: TechnicalDebtSeverity.MEDIUM,
        description: 'class-validator@0.13 usa API descontinuada — atualizar para 0.14',
        affectedComponent: 'shared',
        estimatedEffortHours: 4,
      },
      {
        category: TechnicalDebtCategory.INSUFFICIENT_TESTS,
        severity: TechnicalDebtSeverity.LOW,
        description: 'Módulo de agendamento com cobertura de testes abaixo de 90%',
        affectedComponent: 'scheduling',
        estimatedEffortHours: 12,
      },
    ];

    for (const dto of seeds) {
      const id = `DEBT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.debtRegistry.set(id, {
        debtId: id,
        category: dto.category,
        severity: dto.severity,
        description: dto.description,
        affectedComponent: dto.affectedComponent ?? 'PLATFORM',
        estimatedEffortHours: dto.estimatedEffortHours ?? 8,
        priorityScore: dto.severity === TechnicalDebtSeverity.CRITICAL ? 90 : dto.severity === TechnicalDebtSeverity.HIGH ? 70 : 40,
        status: 'OPEN',
        registeredAt: new Date().toISOString(),
      });
    }
  }

  async registerDebt(dto: RegisterTechnicalDebtDto): Promise<TechnicalDebtRecord> {
    const debtId = `DEBT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const priorityScore =
      dto.severity === TechnicalDebtSeverity.CRITICAL ? 95 :
      dto.severity === TechnicalDebtSeverity.HIGH ? 75 :
      dto.severity === TechnicalDebtSeverity.MEDIUM ? 50 : 25;

    const record: TechnicalDebtRecord = {
      debtId,
      category: dto.category,
      severity: dto.severity,
      description: dto.description,
      affectedComponent: dto.affectedComponent ?? 'PLATFORM',
      estimatedEffortHours: dto.estimatedEffortHours ?? 8,
      priorityScore,
      status: 'OPEN',
      registeredAt: new Date().toISOString(),
    };

    this.debtRegistry.set(debtId, record);

    await this.audit.record('REGISTER_TECHNICAL_DEBT', record.affectedComponent, 'CTO', {
      debtId, severity: dto.severity, category: dto.category,
    });

    await this.eventBus.publish(
      'aura.lifecycle.technical.debt.detected.v1',
      { debtId, severity: dto.severity, category: dto.category, priorityScore },
      this.SYSTEM_TENANT,
      { subject: debtId },
    );

    this.logger.log(`[TechnicalDebt] Registered: ${debtId} (${dto.severity} / Priority: ${priorityScore})`);
    return record;
  }

  listDebt(severity?: TechnicalDebtSeverity, category?: TechnicalDebtCategory): TechnicalDebtRecord[] {
    return Array.from(this.debtRegistry.values())
      .filter((d) => (!severity || d.severity === severity) && (!category || d.category === category))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
