import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNumberString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum BeneficiaryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

// ── DTOs de Query ─────────────────────────────────────────────────────────────

/**
 * Filtros de busca paginada de beneficiários.
 * Apenas ADMIN+ pode filtrar por mcsiLevel.
 */
export class BeneficiarySearchDto {
  @ApiPropertyOptional({ description: 'Nome parcial do beneficiário (busca insensível a maiúsculas)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'CPF do beneficiário (exato ou parcial, sem máscara)', example: '12345678' })
  @IsOptional()
  @IsNumberString()
  @MaxLength(11)
  cpf?: string;

  @ApiPropertyOptional({ enum: BeneficiaryStatus, description: 'Filtrar por status do beneficiário' })
  @IsOptional()
  @IsEnum(BeneficiaryStatus)
  status?: BeneficiaryStatus;

  @ApiPropertyOptional({ description: 'Nível MCSI (0–4) — somente ADMIN e superior', minimum: 0, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  @Type(() => Number)
  mcsiLevel?: number;

  @ApiPropertyOptional({ description: 'Página (1-indexed)', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

// ── DTOs de Update ────────────────────────────────────────────────────────────

/**
 * Campos editáveis do Beneficiary pós-cadastro.
 * Campos sensíveis (CPF, endereço, docs judiciais) residem no SecureVault
 * e são gerenciados pelo módulo de segurança, não aqui.
 */
export class UpdateBeneficiaryDto {
  @ApiPropertyOptional({ description: 'Nome completo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ enum: BeneficiaryStatus, description: 'Status do beneficiário' })
  @IsOptional()
  @IsEnum(BeneficiaryStatus)
  status?: BeneficiaryStatus;
}

// ── Interfaces de Resposta ───────────────────────────────────────────────────

/**
 * Payload de resposta base do beneficiário.
 * O campo `mcsiLevel` só é incluído para usuários com acesso administrativo.
 */
export interface BeneficiaryResponsePayload {
  id: string;
  fullName: string;
  documentCpf: string | null;
  status: string;
  mcsiLevel?: number;
  specialCategory?: string;
  internalCode?: string;
  createdAt: string;
}

/**
 * Item de linha do tempo — agrega eventos multidimensionais do beneficiário.
 */
export interface TimelineEventDto {
  type: 'CASE' | 'APPOINTMENT' | 'EVOLUTION' | 'DIAGNOSIS' | 'ALERT';
  id: string;
  title: string;
  description?: string;
  occurredAt: string;
  createdBy?: string;
}
