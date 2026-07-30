import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { AgentType, CognitiveLevel, RecordAuditLogDto } from '../dto/cognitive-orchestration.dto';

// ── INTERFACES ────────────────────────────────────────────────────────────────

export interface CognitiveAuditEntry {
  auditId: string;
  logId: string; // alias, formato COG-AUD-YYYY-XXXXXX
  timestamp: string;
  eventType: string;
  taskId?: string;
  agentId?: string;
  agentType?: AgentType;
  cognitiveLevel?: CognitiveLevel;
  actionName?: string;
  action: string;
  details: Record<string, any>;
  immutableSignature: string; // sha256Signature alias
  sha256Signature: string;
  humanSupervisorId?: string;
  humanReviewerId?: string;
  humanInTheLoopRequired?: boolean;
  humanApproved?: boolean;
  confidenceScore?: number;
  explanationSummary?: string;
  latencyMs?: number;
  tokensUsed?: number;
}

// ── SERVICE ───────────────────────────────────────────────────────────────────

/**
 * CognitiveAuditService — Trilha de Auditoria Cognitiva Imutável (P152 ACOP)
 *
 * Registra e assina criptograficamente toda decisão tomada por agentes de IA,
 * garantindo rastreabilidade, explicabilidade (XAI) e conformidade com LGPD.
 *
 * Referências: P128 (Cibersegurança), P152 (ACOP), ADR-152
 */
@Injectable()
export class CognitiveAuditService {
  private readonly logger = new Logger(CognitiveAuditService.name);
  private auditTrail: CognitiveAuditEntry[] = [];
  private readonly YEAR = new Date().getFullYear();

  // ── Método principal P152 (assinatura do spec) ──────────────────────────────

  /**
   * Registra uma entrada de auditoria cognitiva com nível de detalhe XAI.
   * Compatível com a assinatura do spec P152.
   */
  async recordAuditLog(dto: RecordAuditLogDto): Promise<CognitiveAuditEntry> {
    const timestamp = new Date().toISOString();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const auditId = `AUD-COG-${Date.now()}-${seq}`;
    const logId = `COG-AUD-${this.YEAR}-${seq}`;

    const payload = JSON.stringify({
      logId,
      timestamp,
      agentId: dto.agentId,
      agentType: dto.agentType,
      cognitiveLevel: dto.cognitiveLevel,
      actionName: dto.actionName,
      inputPayloadHash: dto.inputPayloadHash,
      outputResponseHash: dto.outputResponseHash,
      confidenceScore: dto.confidenceScore,
      humanInTheLoopRequired: dto.humanInTheLoopRequired,
    });

    const sha256Signature = crypto.createHash('sha256').update(payload).digest('hex');

    const entry: CognitiveAuditEntry = {
      auditId,
      logId,
      timestamp,
      eventType: 'CognitiveAuditRecorded',
      agentId: dto.agentId,
      agentType: dto.agentType,
      cognitiveLevel: dto.cognitiveLevel,
      actionName: dto.actionName,
      action: dto.actionName,
      details: {
        inputPayloadHash: dto.inputPayloadHash,
        outputResponseHash: dto.outputResponseHash,
        explanationSummary: dto.explanationSummary,
        latencyMs: dto.latencyMs,
        tokensUsed: dto.tokensUsed,
      },
      immutableSignature: sha256Signature,
      sha256Signature,
      humanSupervisorId: dto.humanReviewerId,
      humanReviewerId: dto.humanReviewerId,
      humanInTheLoopRequired: dto.humanInTheLoopRequired,
      humanApproved: dto.humanApproved,
      confidenceScore: dto.confidenceScore,
      explanationSummary: dto.explanationSummary,
      latencyMs: dto.latencyMs,
      tokensUsed: dto.tokensUsed,
    };

    this.auditTrail.push(entry);
    this.logger.log(
      `[CognitiveAudit] ${dto.agentType}::${dto.actionName} (sig: ${sha256Signature.substring(0, 12)}...)`,
    );
    return entry;
  }

  /**
   * Consulta o log de auditoria, opcionalmente filtrado por agentId.
   * Compatível com a assinatura do spec P152 e do controller.
   */
  async getAuditLogs(agentId?: string): Promise<CognitiveAuditEntry[]> {
    if (agentId) {
      return this.auditTrail.filter((a) => a.agentId === agentId);
    }
    return [...this.auditTrail];
  }

  // ── Métodos de compatibilidade com implementações anteriores ─────────────────

  /**
   * @deprecated Usar recordAuditLog() — mantido para backward-compat.
   */
  logAudit(
    eventType: string,
    action: string,
    details: Record<string, any>,
    taskId?: string,
    agentId?: string,
    humanSupervisorId?: string,
  ): CognitiveAuditEntry {
    const timestamp = new Date().toISOString();
    const seq = Math.random().toString(36).substring(2, 7);
    const auditId = `AUD-COG-${Date.now()}-${seq}`;
    const logId = `COG-AUD-${this.YEAR}-${seq.toUpperCase()}`;
    const payload = JSON.stringify({ auditId, timestamp, eventType, taskId, agentId, action, details });
    const sha256Signature = crypto.createHash('sha256').update(payload).digest('hex');

    const entry: CognitiveAuditEntry = {
      auditId,
      logId,
      timestamp,
      eventType,
      taskId,
      agentId,
      action,
      details,
      immutableSignature: sha256Signature,
      sha256Signature,
      humanSupervisorId,
    };

    this.auditTrail.push(entry);
    this.logger.log(`[CognitiveAudit] ${eventType} - ${action} (Signature: ${sha256Signature.substring(0, 12)}...)`);
    return entry;
  }

  /**
   * @deprecated Usar getAuditLogs() — mantido para backward-compat.
   */
  getAuditTrail(taskId?: string): CognitiveAuditEntry[] {
    if (taskId) {
      return this.auditTrail.filter((a) => a.taskId === taskId);
    }
    return [...this.auditTrail];
  }
}
