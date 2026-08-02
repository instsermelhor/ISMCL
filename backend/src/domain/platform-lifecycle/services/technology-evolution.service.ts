import { Injectable, Logger } from '@nestjs/common';
import { LifecycleAuditService } from './lifecycle-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface TechnologyRoadmapEntry {
  roadmapId: string;
  technologyName: string;
  currentState: string;
  targetState: string;
  roiScore: number;       // 0-100
  riskScore: number;      // 0-100
  estimatedQuarter: string;
  rationale: string;
  generatedAt: string;
}

/**
 * TechnologyEvolutionService — Evolução Tecnológica (P162 EPLM)
 *
 * Avalia novas tecnologias, substitutos, oportunidades de modernização,
 * riscos tecnológicos, ROI e impacto arquitetural; gera o roadmap tecnológico.
 */
@Injectable()
export class TechnologyEvolutionService {
  private readonly logger = new Logger(TechnologyEvolutionService.name);
  private roadmap: Map<string, TechnologyRoadmapEntry> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: LifecycleAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedRoadmap();
  }

  private seedRoadmap(): void {
    const seeds: Omit<TechnologyRoadmapEntry, 'roadmapId' | 'generatedAt'>[] = [
      {
        technologyName: 'Node.js LTS',
        currentState: 'Node.js 20 LTS',
        targetState: 'Node.js 22 LTS',
        roiScore: 78,
        riskScore: 20,
        estimatedQuarter: '2026-Q3',
        rationale: 'Node 22 LTS traz melhorias de performance V8 e API fetch nativa',
      },
      {
        technologyName: 'PostgreSQL',
        currentState: 'PostgreSQL 15.4',
        targetState: 'PostgreSQL 16.x',
        roiScore: 70,
        riskScore: 15,
        estimatedQuarter: '2026-Q4',
        rationale: 'PostgreSQL 16 inclui melhorias de particionamento e paralelismo de queries',
      },
    ];

    for (const entry of seeds) {
      const id = `ROAD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.roadmap.set(id, { roadmapId: id, ...entry, generatedAt: new Date().toISOString() });
    }
  }

  async generateRoadmap(): Promise<TechnologyRoadmapEntry[]> {
    const roadmapId = `ROAD-GEN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await this.audit.record('GENERATE_TECHNOLOGY_ROADMAP', 'PLATFORM', 'CTO', {
      entriesCount: this.roadmap.size,
    });

    await this.eventBus.publish(
      'aura.lifecycle.technology.roadmap.generated.v1',
      { roadmapId, entriesCount: this.roadmap.size },
      this.SYSTEM_TENANT,
      { subject: roadmapId },
    );

    this.logger.log(`[TechnologyEvolution] Roadmap generated → ${this.roadmap.size} entries`);
    return Array.from(this.roadmap.values()).sort((a, b) => b.roiScore - a.roiScore);
  }
}
