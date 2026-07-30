import { Injectable, Logger } from '@nestjs/common';
import { AgentDomainRole, AgentMessageDto, InitiateCollaborationDto } from '../dto/cognitive-orchestration.dto';
import { CognitiveAuditService } from './cognitive-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

// ── INTERFACES ────────────────────────────────────────────────────────────────

export interface MultiAgentConsensusResult {
  taskId: string;
  contributingAgents: string[];
  consensusScore: number; // 0 to 1
  synthesizedAnalysis: string;
  hasConflict: boolean;
  conflictDetails?: string;
}

export interface CollaborationSession {
  sessionId: string;
  topic: string;
  participants: Array<{ agentId: string; role: string }>;
  contextPayload?: Record<string, any>;
  roundsCompleted: number;
  consensusScore: number;
  collaborationSummary: string;
  conflictsResolved: number;
  status: 'ACTIVE' | 'CONSENSUS_REACHED' | 'ESCALATED' | 'CLOSED';
  initiatedAt: string;
  closedAt?: string;
}

// ── SERVICE ───────────────────────────────────────────────────────────────────

/**
 * AICollaborationService — Colaboração Entre Agentes (P152 ACOP)
 *
 * Facilita sessões de colaboração multidisciplinar, síntese de consenso
 * e resolução de conflitos entre análises de agentes especializados.
 *
 * Referências: P111 (AEAIP), P152 (ACOP), ADR-152
 */
@Injectable()
export class AICollaborationService {
  private readonly logger = new Logger(AICollaborationService.name);
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: CognitiveAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  // ── Método principal P152 (assinatura do spec) ──────────────────────────────

  /**
   * Inicia uma sessão de colaboração multi-agente.
   * Compatível com a assinatura do spec P152.
   */
  async initiateCollaborationSession(dto: InitiateCollaborationDto): Promise<CollaborationSession> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sessionId = `COL-${year}-${seq}`;

    // Simula múltiplas rodadas de colaboração
    const roundsCompleted = 2 + Math.floor(Math.random() * 3);
    const consensusScore = 0.82 + Math.random() * 0.16;
    const conflictsResolved = Math.floor(Math.random() * 2);

    const summaryLines = dto.participants.map(
      (p) => `[${p.role}] (${p.agentId}): Contribuição especializada integrada com ${(consensusScore * 100).toFixed(0)}% de convergência.`,
    );

    const session: CollaborationSession = {
      sessionId,
      topic: dto.topic,
      participants: dto.participants,
      contextPayload: dto.contextPayload,
      roundsCompleted,
      consensusScore: Math.round(consensusScore * 100) / 100,
      collaborationSummary: summaryLines.join('\n'),
      conflictsResolved,
      status: consensusScore >= 0.85 ? 'CONSENSUS_REACHED' : 'ESCALATED',
      initiatedAt: new Date().toISOString(),
    };

    this.activeSessions.set(sessionId, session);

    await this.eventBus.publish(
      'aura.cognitive.collaboration.session_started.v1',
      { sessionId, topic: dto.topic, participantCount: dto.participants.length },
      this.SYSTEM_TENANT,
      { subject: sessionId },
    );

    this.auditService.logAudit('CollaborationSessionInitiated', 'InitiateCollaborationSession', {
      sessionId,
      topic: dto.topic,
      participants: dto.participants.map((p) => p.agentId),
      consensusScore: session.consensusScore,
    });

    this.logger.log(`[AICollaboration] Session started: ${sessionId} — ${dto.participants.length} participants, score: ${session.consensusScore}`);
    return session;
  }

  /**
   * Sintetiza consenso a partir de mensagens de múltiplos agentes.
   * @deprecated Usar initiateCollaborationSession() — mantido para backward-compat.
   */
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

    let hasConflict = false;
    let conflictDetails: string | undefined;

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

  getSession(sessionId: string): CollaborationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.activeSessions.values());
  }
}
