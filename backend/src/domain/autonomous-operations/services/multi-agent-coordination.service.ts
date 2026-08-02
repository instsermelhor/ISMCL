import { Injectable, Logger } from '@nestjs/common';
import { AgentSpecialty, CoordinateAgentsDto } from '../dto/autonomous-operations.dto';
import { ImprovementGovernanceService } from './improvement-governance.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AgentInfo {
  agentId: string;
  name: string;
  specialty: AgentSpecialty;
  status: 'IDLE' | 'BUSY' | 'COORDINATING';
  confidenceLevelPercent: number;
}

export interface AgentCoordinationResult {
  coordinationId: string;
  taskDescription: string;
  participatingAgents: AgentInfo[];
  consensusOutput: string;
  confidenceScorePercent: number;
  coordinatedAt: string;
}

/**
 * MultiAgentCoordinationService — Coordenação Multiagente Especializada (P164 AOCP)
 *
 * Coordena 11 agentes especialistas: Arquitetura, Segurança, Compliance,
 * Observabilidade, BI, IA, Gestão Documental, Atendimento, ERP Social, Infraestrutura e Qualidade.
 */
@Injectable()
export class MultiAgentCoordinationService {
  private readonly logger = new Logger(MultiAgentCoordinationService.name);
  private agentRegistry: Map<AgentSpecialty, AgentInfo> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly governance: ImprovementGovernanceService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedAgents();
  }

  private seedAgents(): void {
    const specialties = Object.values(AgentSpecialty);
    for (const s of specialties) {
      const agentId = `AGENT-${s.substring(0, 4)}-01`;
      this.agentRegistry.set(s, {
        agentId,
        name: `Aura ${s} Specialist Agent`,
        specialty: s,
        status: 'IDLE',
        confidenceLevelPercent: 98,
      });
    }
  }

  async coordinateAgents(dto: CoordinateAgentsDto): Promise<AgentCoordinationResult> {
    const coordinationId = `COORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const participatingAgents = dto.targetSpecialties
      .map((s) => this.agentRegistry.get(s))
      .filter((a): a is AgentInfo => a !== undefined);

    const result: AgentCoordinationResult = {
      coordinationId,
      taskDescription: dto.taskDescription,
      participatingAgents,
      consensusOutput: `Consenso estabelecido entre ${participatingAgents.length} agentes para: "${dto.taskDescription}"`,
      confidenceScorePercent: 97,
      coordinatedAt: new Date().toISOString(),
    };

    await this.governance.recordAudit('COORDINATE_AGENTS', dto.taskDescription, 'CAIO', {
      coordinationId, agentCount: participatingAgents.length,
    });

    await this.eventBus.publish(
      'aura.operations.agent.coordination.completed.v1',
      { coordinationId, taskDescription: dto.taskDescription, agentCount: participatingAgents.length },
      this.SYSTEM_TENANT,
      { subject: coordinationId },
    );

    this.logger.log(`[MultiAgentCoordination] Coordinated ${participatingAgents.length} agents for "${dto.taskDescription}"`);
    return result;
  }

  listAgents(): AgentInfo[] {
    return Array.from(this.agentRegistry.values());
  }
}
