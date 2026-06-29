import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { AuditLogService } from '../../shared/services/audit-log.service.ts';

interface CostCenterRateio {
  costCenterId: string;
  percentage: number;
}

interface TransactionInput {
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  title: string;
  description?: string;
  amount: number;
  dueDate: Date;
  categoryId: string;
  projectId?: string;
  donorId?: string;
  campaignId?: string;
  agreementId?: string;
  documentUrl?: string;
  createdById: string;
  costCenters: CostCenterRateio[];
}

@Injectable()
export class FinancialService {
  constructor(
    @Inject('db') private readonly db: any,
    @Inject('AuditLogService') private readonly audit: AuditLogService
  ) {}

  /**
   * Registra uma nova movimentação financeira (Receita ou Despesa).
   * Valida rateio de centro de custo (RN01), anexos obrigatórios (RN03) e limites de aprovação (RN04).
   */
  async createTransaction(data: TransactionInput) {
    // RN01 - Rastreabilidade Obrigatória de Centro de Custo
    if (!data.costCenters || data.costCenters.length === 0) {
      throw new BadRequestException('A vinculação a pelo menos um Centro de Custo é obrigatória.');
    }

    // A soma dos percentuais de rateio deve ser exatamente 100.0%
    const totalPercentage = data.costCenters.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(totalPercentage - 100.0) > 0.01) {
      throw new BadRequestException(`A soma dos percentuais de rateio deve ser exatamente 100%. Encontrado: ${totalPercentage}%`);
    }

    // RN03 - Vinculação Documental Obrigatória para Despesas > R$ 100,00 ou Convênios
    const requiresDoc = (data.type === 'EXPENSE' && data.amount > 100) || data.agreementId;
    if (requiresDoc && !data.documentUrl) {
      throw new BadRequestException('Documento comprobatório (fiscal/recibo) é obrigatório para esta transação.');
    }

    // Determinar status inicial baseado na alçada de aprovação (RN04)
    let status = 'PENDING';
    let approvalMessage = 'Aguardando compensação/pagamento.';

    if (data.type === 'EXPENSE') {
      if (data.amount <= 1000) {
        // Abaixo de R$ 1.000,00: Aprovação automática
        status = 'PENDING'; // Pronto para pagamento
        approvalMessage = 'Aprovação automática para despesa de baixo valor.';
      } else if (data.amount <= 10000) {
        // De R$ 1.000,00 a R$ 10.000,00: Exige aprovação de Controladoria/Coordenador
        status = 'AWAITING_APPROVAL';
        approvalMessage = 'Exige aprovação de um Coordenador ou Controladoria.';
      } else {
        // Acima de R$ 10.000,00: Exige dupla assinatura (Diretoria/Presidência)
        status = 'AWAITING_DOUBLE_APPROVAL';
        approvalMessage = 'Exige assinatura conjunta da Diretoria/Presidência.';
      }
    }

    // Transação de banco para criar movimentação e rateio
    const transaction = await this.db.$transaction(async (prisma: any) => {
      // 1. Criar transação
      const tx = await prisma.transaction.create({
        data: {
          type: data.type,
          title: data.title,
          description: data.description,
          amount: data.amount,
          status,
          dueDate: data.dueDate,
          categoryId: data.categoryId,
          projectId: data.projectId,
          donorId: data.donorId,
          campaignId: data.campaignId,
          agreementId: data.agreementId,
          documentUrl: data.documentUrl,
          createdById: data.createdById,
        }
      });

      // 2. Criar relações de centro de custo
      for (const cc of data.costCenters) {
        await prisma.transactionCostCenter.create({
          data: {
            transactionId: tx.id,
            costCenterId: cc.costCenterId,
            percentage: cc.percentage,
          }
        });
      }

      // Se for receita associada a uma campanha, atualiza o valor captado da campanha
      if (data.type === 'INCOME' && data.campaignId && status === 'COMPLETED') {
        await prisma.campaign.update({
          where: { id: data.campaignId },
          data: { raisedAmount: { increment: data.amount } }
        });
      }

      return tx;
    });

    // Auditoria
    await this.audit.logStrict({
      actorId: data.createdById,
      portalOrigin: 'ADMIN',
      actionType: 'CREATE_TRANSACTION',
      targetEntity: 'TRANSACTION',
      targetEntityId: transaction.id,
      justification: `Criação de transação do tipo ${data.type}. Nota: ${approvalMessage}`
    });

    return {
      success: true,
      transaction,
      approvalMessage
    };
  }

  /**
   * Efetiva/Completa uma transação (ex: pagamento realizado ou receita recebida).
   */
  async completeTransaction(id: string, actorId: string, paymentDate: Date) {
    const tx = await this.db.transaction.findUnique({
      where: { id },
      include: { costCenters: true }
    });

    if (!tx) {
      throw new NotFoundException('Transação não encontrada.');
    }

    if (tx.status === 'COMPLETED') {
      throw new BadRequestException('Esta transação já está efetivada.');
    }

    // Se for despesa, validar se passou pelas alçadas de aprovação necessárias
    if (tx.type === 'EXPENSE' && tx.status !== 'APPROVED' && tx.amount > 1000) {
      throw new BadRequestException(`Esta despesa de ${tx.amount} exige aprovação formal antes do pagamento.`);
    }

    const updatedTx = await this.db.$transaction(async (prisma: any) => {
      const completed = await prisma.transaction.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          paymentDate,
          updatedById: actorId,
        }
      });

      // Se for receita associada a uma campanha, atualiza o valor captado
      if (completed.type === 'INCOME' && completed.campaignId) {
        await prisma.campaign.update({
          where: { id: completed.campaignId },
          data: { raisedAmount: { increment: completed.amount } }
        });
      }

      return completed;
    });

    await this.audit.logStrict({
      actorId,
      portalOrigin: 'ADMIN',
      actionType: 'COMPLETE_TRANSACTION',
      targetEntity: 'TRANSACTION',
      targetEntityId: id,
      justification: 'Efetivação financeira / Registro de pagamento executado.'
    });

    return updatedTx;
  }

  /**
   * Realiza a aprovação de uma despesa de acordo com o cargo do aprovador.
   */
  async approveExpense(id: string, actorId: string, role: string) {
    const tx = await this.db.transaction.findUnique({ where: { id } });
    if (!tx) {
      throw new NotFoundException('Transação não encontrada.');
    }

    if (tx.type !== 'EXPENSE') {
      throw new BadRequestException('Apenas despesas podem ser aprovadas.');
    }

    let nextStatus = tx.status;

    if (tx.status === 'AWAITING_APPROVAL') {
      // Exige perfil de Controladoria ou Coordenação
      if (role !== 'controladoria' && role !== 'admin') {
        throw new BadRequestException('Apenas Controladoria ou Administradores podem aprovar esta despesa.');
      }
      nextStatus = 'APPROVED';
    } else if (tx.status === 'AWAITING_DOUBLE_APPROVAL') {
      // Exige assinatura de Diretoria ou Presidência
      if (role !== 'diretoria' && role !== 'admin') {
        throw new BadRequestException('Esta despesa exige aprovação da Diretoria ou Presidência.');
      }
      // Simula a primeira aprovação. Na realidade de dupla aprovação, poderia ir para "APPROVED_FIRST_SIGN"
      nextStatus = 'APPROVED'; // Simplificado para fins de fluxo principal
    } else {
      throw new BadRequestException(`Transação em status ${tx.status} não requer aprovação.`);
    }

    const approvedTx = await this.db.transaction.update({
      where: { id },
      data: { status: nextStatus, updatedById: actorId }
    });

    await this.audit.logStrict({
      actorId,
      portalOrigin: 'ADMIN',
      actionType: 'APPROVE_EXPENSE',
      targetEntity: 'TRANSACTION',
      targetEntityId: id,
      justification: `Aprovação de despesa pelo perfil ${role}.`
    });

    return approvedTx;
  }

  /**
   * RN08 - Estorno de Transação Efetivada (Imutabilidade de Lançamentos)
   * Em vez de deletar fisicamente, criamos uma contra-partida (transação inversa) de estorno.
   */
  async reverseTransaction(id: string, actorId: string, justification: string) {
    if (!justification) {
      throw new BadRequestException('A justificativa de estorno é obrigatória.');
    }

    const originalTx = await this.db.transaction.findUnique({
      where: { id },
      include: { costCenters: true }
    });

    if (!originalTx) {
      throw new NotFoundException('Transação original não encontrada.');
    }

    if (originalTx.status !== 'COMPLETED') {
      throw new BadRequestException('Apenas transações efetivadas podem ser estornadas.');
    }

    const reversalTx = await this.db.$transaction(async (prisma: any) => {
      // 1. Cancelar/marcar a original como REVERSED/CANCELLED
      await prisma.transaction.update({
        where: { id },
        data: { status: 'CANCELLED', updatedById: actorId }
      });

      // 2. Criar a transação inversa de ajuste (estorno)
      const inverseType = originalTx.type === 'INCOME' ? 'EXPENSE' : 'INCOME';
      const reversal = await prisma.transaction.create({
        data: {
          type: inverseType,
          title: `[ESTORNO] ${originalTx.title}`,
          description: `Estorno referente à transação ID ${originalTx.id}. Motivo: ${justification}`,
          amount: originalTx.amount,
          status: 'COMPLETED',
          dueDate: new Date(),
          paymentDate: new Date(),
          categoryId: originalTx.categoryId,
          projectId: originalTx.projectId,
          donorId: originalTx.donorId,
          campaignId: originalTx.campaignId,
          agreementId: originalTx.agreementId,
          createdById: actorId,
        }
      });

      // 3. Replicar os centros de custo para o estorno
      for (const cc of originalTx.costCenters) {
        await prisma.transactionCostCenter.create({
          data: {
            transactionId: reversal.id,
            costCenterId: cc.costCenterId,
            percentage: cc.percentage,
          }
        });
      }

      // 4. Se a transação original alimentava uma campanha, subtrair/ajustar valor
      if (originalTx.type === 'INCOME' && originalTx.campaignId) {
        await prisma.campaign.update({
          where: { id: originalTx.campaignId },
          data: { raisedAmount: { decrement: originalTx.amount } }
        });
      }

      return reversal;
    });

    await this.audit.logStrict({
      actorId,
      portalOrigin: 'ADMIN',
      actionType: 'REVERSE_TRANSACTION',
      targetEntity: 'TRANSACTION',
      targetEntityId: id,
      justification: `Estorno realizado. Nova transação de ajuste: ${reversalTx.id}. Justificativa: ${justification}`
    });

    return {
      success: true,
      originalTransactionId: id,
      reversalTransactionId: reversalTx.id
    };
  }

  /**
   * RN05 - Processamento de Churn de Doadores Recorrentes.
   * Modifica status do doador para INACTIVE após falhas de pagamento sequenciais.
   */
  async handleDonorFailedPayments(donorId: string, actorId: string) {
    const donor = await this.db.donor.findUnique({ where: { id: donorId } });
    if (!donor) {
      throw new NotFoundException('Doador não encontrado.');
    }

    const updatedDonor = await this.db.donor.update({
      where: { id: donorId },
      data: { status: 'INACTIVE' }
    });

    await this.audit.logStrict({
      actorId,
      portalOrigin: 'SYSTEM',
      actionType: 'DONOR_CHURN',
      targetEntity: 'DONOR',
      targetEntityId: donorId,
      justification: 'Inativação automática por falha de pagamento recorrente por 2 meses consecutivos (Churn).'
    });

    return updatedDonor;
  }

  /**
   * Importa e concilia um extrato bancário (OFX) com transações pendentes no sistema.
   */
  async reconcileBankStatement(transactionId: string, bankStatementId: string, actorId: string, notes?: string) {
    const tx = await this.db.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) {
      throw new NotFoundException('Transação não encontrada no sistema.');
    }

    // Cria conciliação e marca transação como completada
    const reconciliation = await this.db.$transaction(async (prisma: any) => {
      const rec = await prisma.financialReconciliation.create({
        data: {
          transactionId,
          bankStatementId,
          reconciledById: actorId,
          notes,
        }
      });

      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          paymentDate: new Date(),
          updatedById: actorId,
        }
      });

      return rec;
    });

    await this.audit.logStrict({
      actorId,
      portalOrigin: 'ADMIN',
      actionType: 'BANK_RECONCILIATION',
      targetEntity: 'TRANSACTION',
      targetEntityId: transactionId,
      justification: `Conciliação bancária efetuada para extrato Ref: ${bankStatementId}`
    });

    return reconciliation;
  }

  /**
   * Consolida dados para DRE e relatórios gerenciais por Centro de Custo.
   */
  async getFinancialSummary(projectId?: string, costCenterId?: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = { status: 'COMPLETED' };
    if (projectId) whereClause.projectId = projectId;
    if (startDate || endDate) {
      whereClause.paymentDate = {};
      if (startDate) whereClause.paymentDate.gte = startDate;
      if (endDate) whereClause.paymentDate.lte = endDate;
    }

    // Se filtrou por centro de custo, precisamos cruzar TransactionCostCenter
    if (costCenterId) {
      whereClause.costCenters = {
        some: { costCenterId }
      };
    }

    const transactions = await this.db.transaction.findMany({
      where: whereClause,
      include: { category: true, costCenters: { include: { costCenter: true } } }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalInvestment = 0;

    for (const tx of transactions) {
      // Se tiver rateio por centro de custo específico, aplicamos a porcentagem proporcional
      let multiplier = 1.0;
      if (costCenterId) {
        const matchingCc = tx.costCenters.find((cc: any) => cc.costCenterId === costCenterId);
        multiplier = matchingCc ? (matchingCc.percentage / 100) : 0;
      }

      const allocatedAmount = tx.amount * multiplier;

      if (tx.type === 'INCOME') {
        totalIncome += allocatedAmount;
      } else if (tx.type === 'EXPENSE') {
        totalExpense += allocatedAmount;
      } else if (tx.type === 'INVESTMENT') {
        totalInvestment += allocatedAmount;
      }
    }

    return {
      totalIncome,
      totalExpense,
      totalInvestment,
      netBalance: totalIncome - totalExpense - totalInvestment,
      transactionCount: transactions.length
    };
  }
}
