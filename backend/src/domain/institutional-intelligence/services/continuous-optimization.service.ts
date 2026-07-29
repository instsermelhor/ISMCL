import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../events/event-bus.service';
import {
  ContinuousOptimizationActionDto,
  ImpactLevel,
} from '../dto/institutional-intelligence.dto';

@Injectable()
export class ContinuousOptimizationService {
  private readonly logger = new Logger(ContinuousOptimizationService.name);
  private readonly actionPlansCatalog: Map<string, ContinuousOptimizationActionDto> = new Map();

  constructor(private readonly eventBus: EventBusService) {
    this.seedInitialOptimizations();
  }

  private seedInitialOptimizations(): void {
    const opt1: ContinuousOptimizationActionDto = {
      actionId: 'OPT-2026-001',
      title: 'Automação da Triagem do Acolhimento Social via OCR + NLP',
      identifiedBottleneck: 'Fila de triagem presencial acumulando 45 minutos em horários de pico.',
      proposedAction: 'Implantar pré-acolhimento digital assíncrono com extração automática de documentos.',
      expectedROI: 'Redução de 75% no tempo de espera presencial.',
      priorityLevel: ImpactLevel.CRITICAL,
    };

    const opt2: ContinuousOptimizationActionDto = {
      actionId: 'OPT-2026-002',
      title: 'Otimização da Alocação de Salas de Teleconsulta',
      identifiedBottleneck: 'Ocupação de salas virtuais ociosas em 32% dos horários agendados.',
      proposedAction: 'Reagendamento dinâmico automático 2 horas antes de faltas confirmadas.',
      expectedROI: 'Incremento de 18% no aproveitamento de horários assistenciais.',
      priorityLevel: ImpactLevel.HIGH,
    };

    this.actionPlansCatalog.set(opt1.actionId, opt1);
    this.actionPlansCatalog.set(opt2.actionId, opt2);
  }

  /**
   * Identifica gargalos e gera um novo plano de ação de otimização contínua.
   */
  async generateOptimizationPlan(
    dto: ContinuousOptimizationActionDto,
  ): Promise<ContinuousOptimizationActionDto> {
    this.actionPlansCatalog.set(dto.actionId, dto);
    this.logger.log(`Plano de Otimização Contínua [${dto.actionId}] gerado.`);

    await this.eventBus.publish(
      'aura.institutional.optimization.suggested.v1',
      {
        actionId: dto.actionId,
        title: dto.title,
        priorityLevel: dto.priorityLevel,
      },
      'default',
      { source: 'ContinuousOptimizationService' },
    );

    return dto;
  }

  /**
   * Inicia a execução de uma melhoria contínua e envia alerta de execução.
   */
  async startImprovement(actionId: string): Promise<ContinuousOptimizationActionDto> {
    const plan = this.actionPlansCatalog.get(actionId);
    if (!plan) {
      throw new Error(`Plano de otimização [${actionId}] não encontrado.`);
    }

    await this.eventBus.publish(
      'aura.institutional.improvement.started.v1',
      {
        actionId: plan.actionId,
        startedAt: new Date().toISOString(),
      },
      'default',
      { source: 'ContinuousOptimizationService' },
    );

    return plan;
  }

  /**
   * Lista todos os planos de otimização contínua.
   */
  async listOptimizationPlans(): Promise<ContinuousOptimizationActionDto[]> {
    return Array.from(this.actionPlansCatalog.values());
  }
}
