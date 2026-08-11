import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EventBusService } from '../../../events/event-bus.service';
import { AuditService } from '../../../audit/audit.service';
import {
  CreateFinancialTransactionDto,
  ApproveFinancialTransactionDto,
  RejectFinancialTransactionDto,
  FinancialTransactionStatus,
  FinancialApprovalCheckResult,
} from '../dto/financial-approval.dto';

// Tabela de limites de alçada por papel corporativo (em BRL R$)
const ROLE_FINANCIAL_LIMITS: Record<string, number> = {
  OPERADOR: 5000.0,
  FINANCEIRO: 5000.0,
  COLABORADOR: 1000.0,
  COORDENADOR: 10000.0,
  GESTOR: 50000.0,
  ADMINISTRADOR: 50000.0,
  ADMIN: 50000.0,
  SUPER_USER_UNIVERSAL: Infinity,
  SUPER_ADMIN: Infinity,
};

// Limite acima do qual é exigida Dupla Aprovação
const DUAL_APPROVAL_THRESHOLD_BRL = 10000.0;

export interface FinancialTransactionRecord {
  id: string;
  description: string;
  amount: number;
  category: string;
  costCenter: string;
  status: FinancialTransactionStatus;
  requestedById: string;
  requestedByName: string;
  approvals: Array<{
    approverId: string;
    approverRole: string;
    approvedAt: string;
    justification?: string;
  }>;
  rejectionReason?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * FinancialApprovalService — Motor de Enforcement Backend de Alçada Financeira
 *
 * Garante que nenhuma transação financeira seja aprovada ou concluída no backend
 * sem alçada compatível com o papel do aprovador, e aplica dupla aprovação
 * obrigatória para transações superiores a R$ 10.000,00.
 *
 * Regras de Alçada (PRD-AURA-001 / REMEDIATION-AURA-001 GAP-P2-03):
 * - FINANCEIRO / OPERADOR: até R$ 5.000,00
 * - COORDENADOR: até R$ 10.000,00
 * - GESTOR / ADMINISTRADOR: até R$ 50.000,00
 * - SUPER_USER_UNIVERSAL / SUPER_ADMIN: ilimitado
 * - Transações > R$ 10.000,00: exigem Dupla Aprovação (2 aprovadores distintos)
 * - Auto-aprovação dupla bloqueada (o mesmo aprovador não pode aprovar 2x)
 *
 * Referência: REMEDIATION-AURA-001 (R2-03), GAP-P2-03
 */
@Injectable()
export class FinancialApprovalService {
  private readonly logger = new Logger(FinancialApprovalService.name);
  private readonly transactionsStore = new Map<string, FinancialTransactionRecord>();

  constructor(
    private readonly eventBus: EventBusService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Avalia se um papel possui alçada suficiente para um determinado valor.
   */
  checkAuthority(
    actorRole: string,
    amount: number,
    currentApprovalsCount = 0,
  ): FinancialApprovalCheckResult {
    const roleNormalized = actorRole.toUpperCase();
    const maxLimitAllowed = ROLE_FINANCIAL_LIMITS[roleNormalized] ?? 0;

    const dualApprovalRequired = amount > DUAL_APPROVAL_THRESHOLD_BRL;
    const requiredApprovalsCount = dualApprovalRequired ? 2 : 1;

    if (amount > maxLimitAllowed) {
      return {
        allowed: false,
        maxLimitAllowed,
        dualApprovalRequired,
        currentApprovalsCount,
        requiredApprovalsCount,
        requiredRole: this.getRecommendedRoleForAmount(amount),
        reason: `Alçada insuficiente. O papel ${roleNormalized} possui limite máximo de R$ ${maxLimitAllowed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, mas a transação é de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      };
    }

    return {
      allowed: true,
      maxLimitAllowed,
      dualApprovalRequired,
      currentApprovalsCount,
      requiredApprovalsCount,
    };
  }

  /**
   * Cria uma solicitação de transação financeira.
   */
  async createTransaction(
    dto: CreateFinancialTransactionDto,
    requestedById: string,
    requestedByName: string,
    tenantId = 'default',
  ): Promise<FinancialTransactionRecord> {
    const id = `tx-${randomUUID()}`;
    const now = new Date().toISOString();

    const record: FinancialTransactionRecord = {
      id,
      description: dto.description,
      amount: dto.amount,
      category: dto.category,
      costCenter: dto.costCenter ?? 'CC-GENERAL',
      status: FinancialTransactionStatus.PENDING,
      requestedById,
      requestedByName,
      approvals: [],
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.transactionsStore.set(id, record);

    this.logger.log(
      `[FinancialApproval] 💰 Nova transação criada: ${id} | Valor: R$ ${dto.amount} | Solicitado por: ${requestedByName}`,
    );

    await this.eventBus.publish(
      'aura.financial.transaction.created.v1',
      {
        transactionId: id,
        amount: dto.amount,
        description: dto.description,
        requestedById,
        tenantId,
      },
      tenantId,
      { subject: id },
    );

    return record;
  }

  /**
   * Aprova uma transação financeira aplicando enforcement de alçada e dupla aprovação no backend.
   */
  async approveTransaction(
    transactionId: string,
    dto: ApproveFinancialTransactionDto,
    actorId: string,
    actorRole: string,
    actorName: string,
    ipAddress = '0.0.0.0',
    userAgent = 'SYSTEM',
  ): Promise<FinancialTransactionRecord> {
    const record = this.transactionsStore.get(transactionId);
    if (!record) {
      throw new NotFoundException(`Transação financeira ${transactionId} não encontrada.`);
    }

    if (
      record.status === FinancialTransactionStatus.COMPLETED ||
      record.status === FinancialTransactionStatus.REJECTED ||
      record.status === FinancialTransactionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Transação ${transactionId} já está finalizada com status ${record.status}.`,
      );
    }

    // 1. Valida se o mesmo aprovador já aprovou anteriormente (bloqueio de dupla aprovação pelo mesmo usuário)
    const alreadyApprovedByActor = record.approvals.some((a) => a.approverId === actorId);
    if (alreadyApprovedByActor) {
      throw new ForbiddenException(
        `Aprovação negada. O usuário ${actorName} (${actorId}) já aprovou esta transação anteriormente. É necessária aprovação de um segundo gestor distinto.`,
      );
    }

    // 2. Valida alçada do papel aprovador contra o valor total da transação
    const check = this.checkAuthority(actorRole, record.amount, record.approvals.length);
    if (!check.allowed) {
      this.logger.warn(
        `[FinancialApproval] ⛔ TENTATIVA DE BYPASS BLOQUEADA: ${actorRole} (${actorId}) tentou aprovar R$ ${record.amount} mas possui limite de R$ ${check.maxLimitAllowed}`,
      );

      // Audit log da tentativa não autorizada
      await this.auditService.log({
        actorId,
        actorName,
        role: actorRole,
        action: 'UNAUTHORIZED_FINANCIAL_APPROVAL_ATTEMPT',
        targetEntity: 'FINANCIAL_TRANSACTION',
        targetEntityId: transactionId,
        justification: `Tentativa de aprovação sem alçada suficiente. Limite: R$ ${check.maxLimitAllowed}, Solicitado: R$ ${record.amount}`,
        ipAddress,
        userAgent,
      });

      throw new ForbiddenException(check.reason);
    }

    // 3. Registra a aprovação
    const now = new Date().toISOString();
    record.approvals.push({
      approverId: actorId,
      approverRole: actorRole.toUpperCase(),
      approvedAt: now,
      justification: dto.justification,
    });

    const dualApprovalRequired = record.amount > DUAL_APPROVAL_THRESHOLD_BRL;

    if (dualApprovalRequired && record.approvals.length < 2) {
      record.status = FinancialTransactionStatus.PENDING_SECOND_APPROVAL;
      record.updatedAt = now;

      this.logger.warn(
        `[FinancialApproval] ⏳ 1ª Aprovação registrada para ${transactionId} por ${actorName} (${actorRole}). Valor R$ ${record.amount} > R$ 10.000 — Aguardando 2ª Aprovação de outro gestor.`,
      );

      await this.eventBus.publish(
        'aura.financial.transaction.partially_approved.v1',
        {
          transactionId,
          approvalsCount: 1,
          requiredApprovalsCount: 2,
          amount: record.amount,
          firstApproverId: actorId,
        },
        record.tenantId,
        { subject: transactionId },
      );
    } else {
      record.status = FinancialTransactionStatus.COMPLETED;
      record.updatedAt = now;

      this.logger.log(
        `[FinancialApproval] ✅ Transação ${transactionId} (R$ ${record.amount}) TOTALMENTE APROVADA E CONCLUÍDA por ${actorName} (${actorRole}).`,
      );

      // Audit log imutável com hash chain (GAP-P1-03)
      await this.auditService.log({
        actorId,
        actorName,
        role: actorRole,
        action: 'FINANCIAL_TRANSACTION_APPROVED',
        targetEntity: 'FINANCIAL_TRANSACTION',
        targetEntityId: transactionId,
        justification: `Transação R$ ${record.amount} aprovada com alçada válida. Aprovadores: ${record.approvals.map((a) => a.approverId).join(', ')}`,
        ipAddress,
        userAgent,
      });

      await this.eventBus.publish(
        'aura.financial.transaction.completed.v1',
        {
          transactionId,
          amount: record.amount,
          approvals: record.approvals,
          status: record.status,
        },
        record.tenantId,
        { subject: transactionId },
      );
    }

    this.transactionsStore.set(transactionId, record);
    return record;
  }

  /**
   * Rejeita uma transação financeira.
   */
  async rejectTransaction(
    transactionId: string,
    dto: RejectFinancialTransactionDto,
    actorId: string,
    actorRole: string,
    actorName: string,
  ): Promise<FinancialTransactionRecord> {
    const record = this.transactionsStore.get(transactionId);
    if (!record) {
      throw new NotFoundException(`Transação financeira ${transactionId} não encontrada.`);
    }

    record.status = FinancialTransactionStatus.REJECTED;
    record.rejectionReason = dto.reason;
    record.updatedAt = new Date().toISOString();

    this.logger.warn(
      `[FinancialApproval] ❌ Transação ${transactionId} REJEITADA por ${actorName} (${actorRole}). Motivo: ${dto.reason}`,
    );

    await this.eventBus.publish(
      'aura.financial.approval.rejected.v1',
      {
        transactionId,
        rejectedById: actorId,
        reason: dto.reason,
      },
      record.tenantId,
      { subject: transactionId },
    );

    this.transactionsStore.set(transactionId, record);
    return record;
  }

  /**
   * Retorna a lista de transações (para consulta/auditoria).
   */
  async listTransactions(): Promise<FinancialTransactionRecord[]> {
    return Array.from(this.transactionsStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Retorna os detalhes de uma transação específica.
   */
  async getTransactionById(transactionId: string): Promise<FinancialTransactionRecord> {
    const record = this.transactionsStore.get(transactionId);
    if (!record) {
      throw new NotFoundException(`Transação ${transactionId} não encontrada.`);
    }
    return record;
  }

  private getRecommendedRoleForAmount(amount: number): string {
    if (amount <= 5000) return 'FINANCEIRO ou OPERADOR';
    if (amount <= 10000) return 'COORDENADOR';
    if (amount <= 50000) return 'GESTOR ou ADMINISTRADOR';
    return 'SUPER_USER_UNIVERSAL ou SUPER_ADMIN';
  }
}
