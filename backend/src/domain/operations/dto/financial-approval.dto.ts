import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FinancialTransactionStatus {
  PENDING = 'PENDING',
  PENDING_SECOND_APPROVAL = 'PENDING_SECOND_APPROVAL',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum FinancialTransactionCategory {
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  SOFTWARE_LICENSE = 'SOFTWARE_LICENSE',
  HARDWARE = 'HARDWARE',
  PROFESSIONAL_SERVICES = 'PROFESSIONAL_SERVICES',
  SOCIAL_PROGRAM_GRANT = 'SOCIAL_PROGRAM_GRANT',
  OPERATIONAL_EXPENSE = 'OPERATIONAL_EXPENSE',
  OTHER = 'OTHER',
}

export class CreateFinancialTransactionDto {
  @ApiProperty({ description: 'Título/Descrição da transação financeira', example: 'Aquisicão de Licenças Cloud K8s' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Valor da transação em BRL (R$)', example: 15000.0 })
  @IsNumber()
  @Min(0.01, { message: 'Valor da transação deve ser maior que R$ 0,00.' })
  amount: number;

  @ApiProperty({ enum: FinancialTransactionCategory, description: 'Categoria do gasto' })
  @IsEnum(FinancialTransactionCategory)
  category: FinancialTransactionCategory;

  @ApiPropertyOptional({ description: 'Centro de custo associado', example: 'CC-OPS-001' })
  @IsOptional()
  @IsString()
  costCenter?: string;
}

export class ApproveFinancialTransactionDto {
  @ApiPropertyOptional({ description: 'Justificativa de aprovação' })
  @IsOptional()
  @IsString()
  justification?: string;
}

export class RejectFinancialTransactionDto {
  @ApiProperty({ description: 'Motivo do rejeito da transação' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export interface FinancialApprovalCheckResult {
  allowed: boolean;
  maxLimitAllowed: number;
  dualApprovalRequired: boolean;
  currentApprovalsCount: number;
  requiredApprovalsCount: number;
  reason?: string;
  requiredRole?: string;
}
