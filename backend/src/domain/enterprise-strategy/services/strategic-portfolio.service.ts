import { Injectable, Logger } from '@nestjs/common';
import {
  CreatePortfolioItemDto,
  PortfolioItemType,
  PortfolioItemStatus,
} from '../dto/enterprise-strategy.dto';
import { StrategyAuditService } from './strategy-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface PortfolioItem {
  itemId: string;
  name: string;
  type: PortfolioItemType;
  description: string;
  linkedOkrId: string;
  status: PortfolioItemStatus;
  budget: number;
  spentBudget: number;
  startDate: string;
  endDate: string;
  sponsor: string;
  priorityScore: number; // 0–100 calculado automaticamente
  linkedKpiIds: string[];
  risks: string[];
  deliverables: string[];
  expectedBenefits: string[];
  progress: number; // 0–1
  createdAt: string;
  updatedAt: string;
}

/**
 * StrategicPortfolioService — P168 ESGP
 *
 * Gestão integrada de portfólio estratégico: programas, projetos e iniciativas.
 * Relaciona OKRs, orçamento, riscos, cronogramas, entregas e benefícios esperados.
 * Suporta priorização automática baseada em critérios institucionais.
 */
@Injectable()
export class StrategicPortfolioService {
  private readonly logger = new Logger(StrategicPortfolioService.name);
  private readonly portfolio: Map<string, PortfolioItem> = new Map();

  constructor(
    private readonly auditSvc: StrategyAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async addItem(dto: CreatePortfolioItemDto, createdBy = 'SYSTEM'): Promise<PortfolioItem> {
    const itemId = `PF-${dto.type}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const item: PortfolioItem = {
      itemId,
      name: dto.name,
      type: dto.type,
      description: dto.description,
      linkedOkrId: dto.linkedOkrId,
      status: PortfolioItemStatus.PLANNED,
      budget: dto.budget ?? 0,
      spentBudget: 0,
      startDate: dto.startDate ?? now,
      endDate: dto.endDate ?? '',
      sponsor: dto.sponsor ?? '',
      priorityScore: this.calculatePriorityScore(dto),
      linkedKpiIds: [],
      risks: [],
      deliverables: [],
      expectedBenefits: [],
      progress: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.portfolio.set(itemId, item);

    await this.auditSvc.recordAudit('PORTFOLIO_ITEM_ADDED', itemId, createdBy, {
      name: dto.name,
      type: dto.type,
      linkedOkrId: dto.linkedOkrId,
      priorityScore: item.priorityScore,
    });

    await this.eventBus.publish(
      'aura.strategy.portfolio.prioritized.v1',
      { itemId, name: dto.name, type: dto.type, priorityScore: item.priorityScore },
      'ESGP',
      { subject: itemId },
    );

    this.logger.log(`[StrategicPortfolio] Item "${itemId}" adicionado — score: ${item.priorityScore}`);
    return item;
  }

  async updateProgress(itemId: string, progress: number, spentBudget: number, updatedBy: string): Promise<PortfolioItem> {
    const item = this.getItemOrThrow(itemId);
    item.progress = Math.min(1, Math.max(0, progress));
    item.spentBudget = spentBudget;

    if (item.progress >= 1) item.status = PortfolioItemStatus.COMPLETED;
    else if (item.status === PortfolioItemStatus.PLANNED && item.progress > 0) item.status = PortfolioItemStatus.IN_PROGRESS;

    item.updatedAt = new Date().toISOString();

    await this.auditSvc.recordAudit('PORTFOLIO_PROGRESS_UPDATED', itemId, updatedBy, { progress, spentBudget });
    return item;
  }

  async reprioritize(): Promise<PortfolioItem[]> {
    const items = Array.from(this.portfolio.values()).filter(
      (i) => i.status !== PortfolioItemStatus.CANCELLED && i.status !== PortfolioItemStatus.COMPLETED,
    );

    // Re-calcular scores e ordenar
    items.sort((a, b) => b.priorityScore - a.priorityScore);

    await this.eventBus.publish(
      'aura.strategy.portfolio.prioritized.v1',
      { reprioritizedAt: new Date().toISOString(), count: items.length },
      'ESGP',
      { subject: 'PORTFOLIO' },
    );

    this.logger.log(`[StrategicPortfolio] Portfólio repriorizado — ${items.length} itens.`);
    return items;
  }

  getPortfolioSummary(): Record<string, any> {
    const items = Array.from(this.portfolio.values());
    const totalBudget = items.reduce((s, i) => s + i.budget, 0);
    const spentBudget = items.reduce((s, i) => s + i.spentBudget, 0);
    return {
      total: items.length,
      byStatus: Object.values(PortfolioItemStatus).reduce((acc, s) => {
        acc[s] = items.filter((i) => i.status === s).length;
        return acc;
      }, {} as Record<string, number>),
      totalBudget,
      spentBudget,
      budgetUtilization: totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0,
    };
  }

  listPortfolio(type?: PortfolioItemType, status?: PortfolioItemStatus): PortfolioItem[] {
    let items = Array.from(this.portfolio.values());
    if (type) items = items.filter((i) => i.type === type);
    if (status) items = items.filter((i) => i.status === status);
    return items.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  getItem(itemId: string): PortfolioItem | undefined {
    return this.portfolio.get(itemId);
  }

  private calculatePriorityScore(dto: CreatePortfolioItemDto): number {
    // Critérios: tipo, alinhamento OKR, budget disponível
    let score = 50;
    if (dto.type === PortfolioItemType.PROGRAM) score += 20;
    else if (dto.type === PortfolioItemType.PROJECT) score += 10;
    if (dto.linkedOkrId) score += 15;
    if (dto.budget && dto.budget < 100000) score += 10; // projetos menores têm mais facilidade de execução
    return Math.min(100, score);
  }

  private getItemOrThrow(itemId: string): PortfolioItem {
    const i = this.portfolio.get(itemId);
    if (!i) throw new Error(`Item de portfólio "${itemId}" não encontrado.`);
    return i;
  }
}
