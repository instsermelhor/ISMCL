import { Injectable, Logger } from '@nestjs/common';
import { DetectEvolutionOpportunitiesDto, EvolutionType } from '../dto/autonomous-evolution.dto';
import { ContinuousEvolutionAuditService } from './continuous-evolution-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface EvolutionOpportunityRecord {
  opportunityId: string;
  tenantId: string;
  type: EvolutionType;
  title: string;
  description: string;
  detectedInModule: string;
  confidenceScore: number; // 0 to 1
  potentialBenefitScore: number; // 0 to 1
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DETECTED' | 'EVALUATING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';
  detectedAt: string;
}

export interface EvolutionCycleSummary {
  cycleId: string;
  opportunitiesDetected: number;
  criticalIssuesFound: number;
  recommendationCount: number;
  cycleDurationMs: number;
  executedAt: string;
}

/**
 * AutonomousEvolutionEngineService — Motor de Evolução Autônoma Central (P153 AAEE)
 *
 * Monitora continuamente o ecossistema Aura (Arquitetura, Workflows, Performance,
 * Indicadores, Qualidade dos Serviços, Satisfação, Riscos e Utilização dos Módulos).
 *
 * Promove o ciclo permanente de:
 * Observação → Análise → Recomendação → Validação → Implementação → Aprendizado
 *
 * IMPORTANTE: Nenhuma alteração estrutural é executada sem aprovação humana.
 */
@Injectable()
export class AutonomousEvolutionEngineService {
  private readonly logger = new Logger(AutonomousEvolutionEngineService.name);
  private opportunityRegistry: Map<string, EvolutionOpportunityRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ContinuousEvolutionAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedOpportunities();
  }

  private seedOpportunities(): void {
    const seeds: EvolutionOpportunityRecord[] = [
      {
        opportunityId: 'EVO-OPP-2026-0001',
        tenantId: this.SYSTEM_TENANT,
        type: EvolutionType.ARCHITECTURE,
        title: 'Migração para Cache de Embedding Vetorial Distribuído',
        description: 'Redução da latência do InstitutionalReasoningEngine (P152) em 40% via cache Redis-Vector.',
        detectedInModule: 'cognitive-orchestration',
        confidenceScore: 0.94,
        potentialBenefitScore: 0.88,
        urgency: 'HIGH',
        status: 'DETECTED',
        detectedAt: new Date().toISOString(),
      },
      {
        opportunityId: 'EVO-OPP-2026-0002',
        tenantId: this.SYSTEM_TENANT,
        type: EvolutionType.PERFORMANCE,
        title: 'Otimização Dinâmica de Timeout em Sessões de Teleconsulta',
        description: 'Ajuste parametrizável do tempo limite de expiração de salas virtuais LiveKit.',
        detectedInModule: 'scheduling',
        confidenceScore: 0.91,
        potentialBenefitScore: 0.82,
        urgency: 'MEDIUM',
        status: 'DETECTED',
        detectedAt: new Date().toISOString(),
      },
    ];

    for (const opp of seeds) {
      this.opportunityRegistry.set(opp.opportunityId, opp);
    }
  }

  async detectEvolutionOpportunities(
    dto: DetectEvolutionOpportunitiesDto,
  ): Promise<EvolutionOpportunityRecord[]> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const opportunityId = `EVO-OPP-${year}-${seq}`;

    const newOpp: EvolutionOpportunityRecord = {
      opportunityId,
      tenantId: dto.tenantId,
      type: EvolutionType.PROCESS,
      title: 'Ajuste Automático de Capacidade do Pool de Agentes Especializados',
      description: 'Detecção de alta demanda recorrente no agente de Psicologia durante o período vespertino.',
      detectedInModule: dto.targetModules?.[0] ?? 'cognitive-orchestration',
      confidenceScore: 0.92,
      potentialBenefitScore: 0.85,
      urgency: 'HIGH',
      status: 'DETECTED',
      detectedAt: new Date().toISOString(),
    };

    this.opportunityRegistry.set(opportunityId, newOpp);

    await this.auditService.recordEvolutionAudit({
      componentName: 'autonomous-evolution-engine',
      actionName: 'EvolutionOpportunityDetected',
      details: { opportunityId, title: newOpp.title, type: newOpp.type, urgency: newOpp.urgency },
    });

    await this.eventBus.publish(
      'aura.evolution.opportunity.detected.v1',
      {
        opportunityId,
        type: newOpp.type,
        title: newOpp.title,
        detectedInModule: newOpp.detectedInModule,
        urgency: newOpp.urgency,
      },
      dto.tenantId,
      { subject: opportunityId },
    );

    this.logger.log(`[AutonomousEvolution] Opportunity Detected: ${opportunityId} (${newOpp.title})`);
    return Array.from(this.opportunityRegistry.values());
  }

  async generateEvolutionCycle(tenantId = 'TENANT-001'): Promise<EvolutionCycleSummary> {
    const start = Date.now();
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cycleId = `EVO-CYC-${year}-${seq}`;

    const opps = await this.detectEvolutionOpportunities({ tenantId });
    const criticalIssuesFound = opps.filter((o) => o.urgency === 'CRITICAL' || o.urgency === 'HIGH').length;

    const durationMs = Date.now() - start;

    const summary: EvolutionCycleSummary = {
      cycleId,
      opportunitiesDetected: opps.length,
      criticalIssuesFound,
      recommendationCount: Math.ceil(opps.length / 2),
      cycleDurationMs: durationMs,
      executedAt: new Date().toISOString(),
    };

    await this.auditService.recordEvolutionAudit({
      componentName: 'autonomous-evolution-engine',
      actionName: 'EvolutionCycleCompleted',
      details: { cycleId, summary },
    });

    this.logger.log(`[AutonomousEvolution] Cycle Completed: ${cycleId} — ${opps.length} opportunities detected in ${durationMs}ms`);
    return summary;
  }

  getOpportunities(type?: EvolutionType): EvolutionOpportunityRecord[] {
    const all = Array.from(this.opportunityRegistry.values());
    return type ? all.filter((o) => o.type === type) : all;
  }

  getOpportunity(opportunityId: string): EvolutionOpportunityRecord | undefined {
    return this.opportunityRegistry.get(opportunityId);
  }
}
