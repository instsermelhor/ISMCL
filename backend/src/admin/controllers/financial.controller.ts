import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { PortalAccessGuard } from '../../auth/guards/portal-access.guard.ts';
import { FinancialService } from '../services/financial.service.ts';
import { Request } from 'express';

export const RequirePortal = (portal: 'ADMIN' | 'CLINIC') => SetMetadata('portal', portal);

interface CreateTransactionPayload {
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  title: string;
  description?: string;
  amount: number;
  dueDate: string; // ISO String
  categoryId: string;
  projectId?: string;
  donorId?: string;
  campaignId?: string;
  agreementId?: string;
  documentUrl?: string;
  costCenters: { costCenterId: string; percentage: number }[];
}

interface CompleteTransactionPayload {
  paymentDate: string; // ISO String
}

interface ReverseTransactionPayload {
  justification: string;
}

interface ReconcilePayload {
  transactionId: string;
  bankStatementId: string;
  notes?: string;
}

/**
 * ADMIN CONTROLLER - GESTÃO FINANCEIRA E SUSTENTABILIDADE
 * Acessível exclusivamente pelo portal administrativo.
 */
@Controller('admin/financial')
@UseGuards(PortalAccessGuard)
@RequirePortal('ADMIN')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  /**
   * Registra uma nova movimentação financeira (Receita ou Despesa).
   */
  @Post('transaction')
  async createTransaction(@Body() data: CreateTransactionPayload, @Req() req: Request) {
    const actorId = (req as any).user['id'];
    const result = await this.financialService.createTransaction({
      ...data,
      dueDate: new Date(data.dueDate),
      createdById: actorId
    });

    return {
      success: true,
      message: 'Movimentação financeira registrada.',
      ...result
    };
  }

  /**
   * Efetiva o pagamento de uma despesa ou recebimento de receita.
   */
  @Post('transaction/:id/complete')
  async completeTransaction(
    @Param('id') id: string,
    @Body() data: CompleteTransactionPayload,
    @Req() req: Request
  ) {
    const actorId = (req as any).user['id'];
    const transaction = await this.financialService.completeTransaction(
      id,
      actorId,
      new Date(data.paymentDate)
    );

    return {
      success: true,
      message: 'Transação efetivada com sucesso.',
      data: transaction
    };
  }

  /**
   * Aprova uma despesa sob análise de alçada.
   */
  @Post('transaction/:id/approve')
  async approveExpense(@Param('id') id: string, @Req() req: Request) {
    const actorId = (req as any).user['id'];
    const userRole = (req as any).user['role']; // Ex: controladoria, diretoria, admin

    const transaction = await this.financialService.approveExpense(id, actorId, userRole);

    return {
      success: true,
      message: 'Despesa aprovada com sucesso.',
      data: transaction
    };
  }

  /**
   * Realiza o estorno (reversão) de uma transação (RN08).
   */
  @Post('transaction/:id/reverse')
  async reverseTransaction(
    @Param('id') id: string,
    @Body() data: ReverseTransactionPayload,
    @Req() req: Request
  ) {
    const actorId = (req as any).user['id'];
    const result = await this.financialService.reverseTransaction(id, actorId, data.justification);

    return {
      success: true,
      message: 'Lançamento estornado com sucesso (lançamento de ajuste criado).',
      ...result
    };
  }

  /**
   * Concilia um registro com o extrato bancário.
   */
  @Post('reconcile')
  async reconcileBankStatement(@Body() data: ReconcilePayload, @Req() req: Request) {
    const actorId = (req as any).user['id'];
    const reconciliation = await this.financialService.reconcileBankStatement(
      data.transactionId,
      data.bankStatementId,
      actorId,
      data.notes
    );

    return {
      success: true,
      message: 'Conciliação bancária realizada.',
      data: reconciliation
    };
  }

  /**
   * Registra churn do doador por falha de pagamento recorrente (RN05).
   */
  @Post('donor/:id/churn')
  async registerDonorChurn(@Param('id') donorId: string, @Req() req: Request) {
    const actorId = (req as any).user['id'];
    const donor = await this.financialService.handleDonorFailedPayments(donorId, actorId);

    return {
      success: true,
      message: 'Status do doador atualizado para inativo devido a falhas recorrentes.',
      data: donor
    };
  }

  /**
   * Retorna consolidação financeira e saldos (BI e DRE).
   */
  @Get('summary')
  async getSummary(
    @Query('projectId') projectId?: string,
    @Query('costCenterId') costCenterId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const summary = await this.financialService.getFinancialSummary(
      projectId,
      costCenterId,
      start,
      end
    );

    return {
      success: true,
      data: summary
    };
  }
}
