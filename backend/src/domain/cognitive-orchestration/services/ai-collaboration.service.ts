import { Injectable, Logger } from '@nestjs/common';
import { AgentDomainRole, AgentMessageDto } from '../dto/cognitive-orchestration.dto';
import { CognitiveAuditService } from './cognitive-audit.service';

export interface MultiAgentConsensusResult {
  taskId: string;
  contributingAgents: string[];
  consensusScore: number; // 0 to 1
  synthesizedAnalysis: string;
  hasConflict: boolean;
  conflictDetails?: string;
}

@Injectable()
export class AICollaborationService {
  private readonly logger = new Logger(AICollaborationService.name);

  constructor(private readonly auditService: CognitiveAuditService) {}

  synthesizeConsensus(taskId: string, agentMessages: AgentMessageDto[]): MultiAgentConsensusResult {
    if (!agentMessages || agentMessages.length === 0) {
      return {
        taskId,
        contributingAgents: [],
        consensusScore: 0,
        synthesizedAnalysis: 'Nenhuma contribuição de agente foi recebida.',
        hasConflict: false,
      };
    }

    const contributingAgents = agentMessages.map((m) => m.agentId);
    const avgConfidence = agentMessages.reduce((sum, m) => sum + m.confidence, 0) / agentMessages.length;

    // Check for conflicts in recommendations
    const uniqueRoles = new Set(agentMessages.map((m) => m.domainRole));
    let hasConflict = false;
    let conflictDetails: string | undefined;

    // Simple conflict detection heuristic: low variance in confidence vs opposing signals
    if (agentMessages.some((m) => m.confidence < 0.6)) {
      hasConflict = true;
      conflictDetails = 'Divergência detectada devido a níveis de confiança reduzidos em análises de domínio específico.';
    }

    const synthesizedAnalysis = agentMessages
      .map((m) => `[${m.domainRole}] (${m.agentId}): ${m.analysis} (Confiança: ${(m.confidence * 100).toFixed(0)}%)`)
      .join('\n\n');

    const result: MultiAgentConsensusResult = {
      taskId,
      contributingAgents,
      consensusScore: Math.round(avgConfidence * 100) / 100,
      synthesizedAnalysis,
      hasConflict,
      conflictDetails,
    };

    this.auditService.logAudit('MultiAgentConsensusSynthesized', 'SynthesizeConsensus', {
      taskId,
      contributingCount: agentMessages.length,
      consensusScore: result.consensusScore,
      hasConflict,
    });

    return result;
  }
}
