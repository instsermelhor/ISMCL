import { Injectable, Logger } from '@nestjs/common';
import {
  CreateOKRDto,
  UpdateOKRProgressDto,
  OKRStatus,
  OKRLevel,
} from '../dto/enterprise-strategy.dto';
import { StrategyAuditService } from './strategy-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface KeyResult {
  id: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  progress: number; // 0–1
  notes?: string;
}

export interface OKRRecord {
  okrId: string;
  objective: string;
  level: OKRLevel;
  cycle: string;
  owner: string;
  parentOkrId?: string;
  status: OKRStatus;
  keyResults: KeyResult[];
  overallProgress: number; // 0–1
  createdAt: string;
  updatedAt: string;
}

/**
 * OKRManagementService — P168 ESGP
 *
 * Gestão corporativa de OKRs alinhados entre níveis institucional,
 * diretoria, coordenação e equipes. Calcula progresso automaticamente.
 */
@Injectable()
export class OKRManagementService {
  private readonly logger = new Logger(OKRManagementService.name);
  private readonly okrStore: Map<string, OKRRecord> = new Map();

  constructor(
    private readonly auditSvc: StrategyAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async createOKR(dto: CreateOKRDto, createdBy = 'SYSTEM'): Promise<OKRRecord> {
    const okrId = `OKR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const now = new Date().toISOString();

    const keyResults: KeyResult[] = (dto.keyResults ?? []).map((kr, i) => ({
      id: `KR-${okrId}-${i + 1}`,
      description: kr.description,
      target: kr.target,
      current: 0,
      unit: kr.unit,
      progress: 0,
    }));

    const record: OKRRecord = {
      okrId,
      objective: dto.objective,
      level: dto.level,
      cycle: dto.cycle,
      owner: dto.owner,
      parentOkrId: dto.parentOkrId,
      status: OKRStatus.DRAFT,
      keyResults,
      overallProgress: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.okrStore.set(okrId, record);

    await this.auditSvc.recordAudit('OKR_CREATED', okrId, createdBy, {
      objective: dto.objective,
      level: dto.level,
      cycle: dto.cycle,
    });

    await this.eventBus.publish(
      'aura.strategy.objective.created.v1',
      { okrId, objective: dto.objective, level: dto.level, cycle: dto.cycle },
      'ESGP',
      { subject: okrId },
    );

    this.logger.log(`[OKRManagement] OKR "${okrId}" criado: ${dto.objective}`);
    return record;
  }

  async updateProgress(dto: UpdateOKRProgressDto, updatedBy = 'SYSTEM'): Promise<OKRRecord> {
    const okr = this.getOKROrThrow(dto.okrId);
    const kr = okr.keyResults.find((k) => k.id === dto.keyResultId);
    if (!kr) throw new Error(`Key Result "${dto.keyResultId}" não encontrado no OKR "${dto.okrId}".`);

    kr.current = dto.currentValue;
    kr.progress = kr.target > 0 ? Math.min(dto.currentValue / kr.target, 1) : 0;
    kr.notes = dto.notes;

    // Recalcular progresso geral
    okr.overallProgress = okr.keyResults.length
      ? okr.keyResults.reduce((sum, k) => sum + k.progress, 0) / okr.keyResults.length
      : 0;

    // Atualizar status automaticamente
    if (okr.overallProgress >= 1) okr.status = OKRStatus.COMPLETED;
    else if (okr.overallProgress < 0.4 && okr.status === OKRStatus.ACTIVE) okr.status = OKRStatus.AT_RISK;

    okr.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('OKR_UPDATED', dto.okrId, updatedBy, {
      keyResultId: dto.keyResultId,
      currentValue: dto.currentValue,
      overallProgress: okr.overallProgress,
    });

    await this.eventBus.publish(
      'aura.strategy.okr.updated.v1',
      { okrId: dto.okrId, overallProgress: okr.overallProgress, status: okr.status },
      'ESGP',
      { subject: dto.okrId },
    );

    this.logger.log(`[OKRManagement] OKR "${dto.okrId}" progresso: ${(okr.overallProgress * 100).toFixed(1)}%`);
    return okr;
  }

  async activateOKR(okrId: string, activatedBy: string): Promise<OKRRecord> {
    const okr = this.getOKROrThrow(okrId);
    okr.status = OKRStatus.ACTIVE;
    okr.updatedAt = new Date().toISOString();
    await this.auditSvc.recordAudit('OKR_ACTIVATED', okrId, activatedBy, {});
    return okr;
  }

  getOKR(okrId: string): OKRRecord | undefined {
    return this.okrStore.get(okrId);
  }

  listOKRs(level?: OKRLevel, cycle?: string, status?: OKRStatus): OKRRecord[] {
    let okrs = Array.from(this.okrStore.values());
    if (level) okrs = okrs.filter((o) => o.level === level);
    if (cycle) okrs = okrs.filter((o) => o.cycle === cycle);
    if (status) okrs = okrs.filter((o) => o.status === status);
    return okrs;
  }

  getChildOKRs(parentOkrId: string): OKRRecord[] {
    return Array.from(this.okrStore.values()).filter((o) => o.parentOkrId === parentOkrId);
  }

  private getOKROrThrow(okrId: string): OKRRecord {
    const o = this.okrStore.get(okrId);
    if (!o) throw new Error(`OKR "${okrId}" não encontrado.`);
    return o;
  }
}
