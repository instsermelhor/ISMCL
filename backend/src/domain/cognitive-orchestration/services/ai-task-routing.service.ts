import { Injectable, Logger } from '@nestjs/common';
import { AgentDomainRole, TaskPriority } from '../dto/cognitive-orchestration.dto';
import { CognitiveAuditService } from './cognitive-audit.service';
import { EventBusService } from '../../../core/event-bus/event-bus.service';

export interface DomainAgentStatus {
  agentId: string;
  domainRole: AgentDomainRole;
  currentLoad: number; // 0 to 10
  isAvailable: boolean;
  minAuthorizationLevel: number;
}

@Injectable()
export class AITaskRoutingService {
  private readonly logger = new Logger(AITaskRoutingService.name);
  private agentRegistry: Map<AgentDomainRole, DomainAgentStatus[]> = new Map();

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedAgents();
  }

  private seedAgents() {
    const roles = Object.values(AgentDomainRole);
    for (const role of roles) {
      this.agentRegistry.set(role, [
        {
          agentId: `agent-${role.toLowerCase().replace('_', '-')}-v1`,
          domainRole: role,
          currentLoad: Math.floor(Math.random() * 4),
          isAvailable: true,
          minAuthorizationLevel: 1,
        },
      ]);
    }
  }

  selectOptimalAgents(domains: AgentDomainRole[], priority: TaskPriority): DomainAgentStatus[] {
    const selected: DomainAgentStatus[] = [];

    for (const domain of domains) {
      const agents = this.agentRegistry.get(domain) || [];
      const available = agents.filter((a) => a.isAvailable && a.currentLoad < 8);

      if (available.length > 0) {
        // Pick least loaded agent
        available.sort((a, b) => a.currentLoad - b.currentLoad);
        const chosen = available[0];
        chosen.currentLoad += 1;
        selected.push(chosen);
      }
    }

    this.logger.log(`[AITaskRouting] Selected ${selected.length} agents for domains: ${domains.join(', ')} (Priority: ${priority})`);
    
    for (const s of selected) {
      this.eventBus.publish({
        id: `EVT-AGENT-${Date.now()}-${s.agentId}`,
        source: 'aura/cognitive-orchestration/routing',
        type: 'aura.cognitive.agent.selected.v1',
        datacontenttype: 'application/json',
        time: new Date().toISOString(),
        data: { agentId: s.agentId, domainRole: s.domainRole, priority },
      });
    }

    return selected;
  }

  releaseAgentLoad(agentId: string) {
    for (const agents of this.agentRegistry.values()) {
      const agent = agents.find((a) => a.agentId === agentId);
      if (agent && agent.currentLoad > 0) {
        agent.currentLoad -= 1;
        break;
      }
    }
  }

  getAgentPoolStatus(): DomainAgentStatus[] {
    const pool: DomainAgentStatus[] = [];
    for (const agents of this.agentRegistry.values()) {
      pool.push(...agents);
    }
    return pool;
  }
}
