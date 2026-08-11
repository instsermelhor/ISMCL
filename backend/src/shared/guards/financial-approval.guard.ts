import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const FINANCIAL_AMOUNT_KEY = 'financial_amount_limit';

/**
 * Decorador de rota para especificar enforcement de alçada financeira.
 * Ex: @FinancialLimit(10000) ou @FinancialLimit('amount')
 */
export const FinancialLimit = (amountOrField: number | string) =>
  (target: any, key?: string | symbol, descriptor?: any) => {
    Reflector.prototype.get; // ensure import
    SetMetadata(FINANCIAL_AMOUNT_KEY, amountOrField)(target, key, descriptor);
  };

import { SetMetadata } from '@nestjs/common';

const ROLE_MAX_LIMITS: Record<string, number> = {
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

/**
 * FinancialApprovalGuard — Guard NestJS de Validação Declarativa de Alçada
 *
 * Intercepta requisições HTTP e valida se o papel do usuário autenticado no JWT
 * possui alçada limite compatível com o valor da transação contida no body.
 *
 * Referência: REMEDIATION-AURA-001 (R2-03), GAP-P2-03
 */
@Injectable()
export class FinancialApprovalGuard implements CanActivate {
  private readonly logger = new Logger(FinancialApprovalGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const amountOrField = this.reflector.getAllAndOverride<number | string>(
      FINANCIAL_AMOUNT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (amountOrField === undefined) {
      return true; // Sem anotação de limite, permite prosseguir
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const actorRole = (user?.roles?.[0] ?? user?.role ?? 'STAFF').toUpperCase();

    let amount = 0;
    if (typeof amountOrField === 'number') {
      amount = amountOrField;
    } else if (typeof amountOrField === 'string' && request.body) {
      amount = Number(request.body[amountOrField] ?? 0);
    }

    const maxAllowed = ROLE_MAX_LIMITS[actorRole] ?? 0;

    if (amount > maxAllowed) {
      this.logger.warn(
        `[FinancialGuard] ⛔ Bloqueio de alçada para ${user?.sub} (${actorRole}): valor R$ ${amount} > limite R$ ${maxAllowed}`,
      );
      throw new ForbiddenException(
        `Alçada financeira insuficiente. O papel ${actorRole} possui limite máximo de R$ ${maxAllowed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, mas o valor da operação é R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      );
    }

    return true;
  }
}
