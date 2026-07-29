import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber } from 'class-validator';

// ── Enumerações de Domínio — Master Architectural Certification ────────────

export enum MaturityLevel {
  LEVEL_1_INITIAL = 'LEVEL_1_INITIAL',
  LEVEL_2_MANAGED = 'LEVEL_2_MANAGED',
  LEVEL_3_DEFINED = 'LEVEL_3_DEFINED',
  LEVEL_4_QUANTITATIVELY_MANAGED = 'LEVEL_4_QUANTITATIVELY_MANAGED',
  LEVEL_5_OPTIMIZING = 'LEVEL_5_OPTIMIZING', // CMMI Nível 5 — Máxima maturidade
}

export enum AuditStatus {
  FULLY_IMPLEMENTED = 'FULLY_IMPLEMENTED',
  PARTIALLY_IMPLEMENTED = 'PARTIALLY_IMPLEMENTED',
  GAP_DETECTED = 'GAP_DETECTED',
  REMEDIATED = 'REMEDIATED',
  CERTIFIED = 'CERTIFIED',
}

export enum MasterCertificationStatus {
  MASTER_CERTIFIED = 'MASTER_CERTIFIED',       // Certificação Máxima da Arquitetura Aura
  PROVISIONAL_CERTIFIED = 'PROVISIONAL_CERTIFIED',
  NON_CONFORMING = 'NON_CONFORMING',
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class RunMasterAuditDto {
  @ApiPropertyOptional({ description: 'Se true, executa remediação automática das lacunas detectadas', default: true })
  @IsOptional()
  autoRemediate?: boolean;
}

export class GenerateBaselineDto {
  @ApiProperty({ description: 'Versão da Baseline Arquitetural (ex: Baseline-v1.0.0-GA)' })
  @IsString()
  baselineVersion: string;

  @ApiPropertyOptional({ description: 'Descrição dos marcos e parâmetros congelados' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class AssessMaturityDto {
  @ApiPropertyOptional({ description: 'Observações do avaliador sobre o nível de maturidade da plataforma' })
  @IsOptional()
  @IsString()
  evaluatorNotes?: string;
}

export class ExecuteRemediationDto {
  @ApiProperty({ description: 'ID da lacuna/gap a remediar' })
  @IsString()
  gapId: string;

  @ApiProperty({ description: 'Ação de remediação aplicada' })
  @IsString()
  remediationAction: string;
}
