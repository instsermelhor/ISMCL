import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

// ── Enumerações de Domínio ─────────────────────────────────────────────────

export enum RiskCategory {
  STRATEGIC = 'STRATEGIC',           // Riscos Estratégicos
  OPERATIONAL = 'OPERATIONAL',       // Riscos Operacionais
  ASSISTENTIAL = 'ASSISTENTIAL',     // Riscos Assistenciais / Clínicos
  TECHNOLOGY = 'TECHNOLOGY',         // Riscos Tecnológicos / Cibersegurança
  FINANCIAL = 'FINANCIAL',           // Riscos Financeiros
  LEGAL = 'LEGAL',                   // Riscos Jurídicos / Regulatórios
  REPUTATIONAL = 'REPUTATIONAL',     // Riscos Reputacionais
  CONTINUITY = 'CONTINUITY',         // Riscos de Continuidade de Negócios
  THIRD_PARTY = 'THIRD_PARTY',       // Riscos de Terceiros / Fornecedores
}

export enum RiskStatus {
  IDENTIFIED = 'IDENTIFIED',
  ASSESSED = 'ASSESSED',
  MITIGATED = 'MITIGATED',
  ACCEPTED = 'ACCEPTED',
  CLOSED = 'CLOSED',
}

export enum ComplianceStandard {
  LGPD = 'LGPD',
  CODE_OF_ETHICS = 'CODE_OF_ETHICS',
  MCSI = 'MCSI',
  INTERNAL_POLICY = 'INTERNAL_POLICY',
  ZERO_TRUST = 'ZERO_TRUST',
  CFP_RESOLUTION = 'CFP_RESOLUTION',  // Conselho Federal de Psicologia
  CFM_RESOLUTION = 'CFM_RESOLUTION',  // Conselho Federal de Medicina
}

export enum PolicyStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
}

export enum ControlType {
  PREVENTIVE = 'PREVENTIVE',   // Impede que o risco ocorra
  DETECTIVE = 'DETECTIVE',     // Identifica quando o risco ocorre
  CORRECTIVE = 'CORRECTIVE',   // Corrige após o risco ocorrer
  COMPENSATORY = 'COMPENSATORY', // Compensação quando controle primário falha
}

export enum OkrStatus {
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  BEHIND = 'BEHIND',
  COMPLETED = 'COMPLETED',
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class RegisterRiskDto {
  @ApiProperty({ description: 'Título / Descrição sumária do risco' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Categoria do risco', enum: RiskCategory })
  @IsEnum(RiskCategory)
  category: RiskCategory;

  @ApiProperty({ description: 'Probabilidade de ocorrência (1=Raro, 5=Quase Certo)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  probability: number;

  @ApiProperty({ description: 'Impacto nos objetivos institucionais (1=Insignificante, 5=Catastrófico)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  impact: number;

  @ApiProperty({ description: 'Plano de resposta e mitigação' })
  @IsString()
  mitigationPlan: string;

  @ApiProperty({ description: 'ID do responsável pelo risco (Risk Owner)' })
  @IsString()
  riskOwnerId: string;
}

export class CreatePolicyDto {
  @ApiProperty({ description: 'Título da política / norma / regulamento' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Padrão de conformidade associado', enum: ComplianceStandard })
  @IsEnum(ComplianceStandard)
  standard: ComplianceStandard;

  @ApiProperty({ description: 'Conteúdo normativo da política' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Periodicidade de revisão em meses (padrão: 12)' })
  @IsOptional()
  @IsNumber()
  reviewCycleMonths?: number;
}

export class RegisterOkrDto {
  @ApiProperty({ description: 'Objetivo estratégico (O do OKR)' })
  @IsString()
  objective: string;

  @ApiProperty({ description: 'Resultados-chave (KRs) mensuráveis' })
  @IsArray()
  @IsString({ each: true })
  keyResults: string[];

  @ApiProperty({ description: 'Ciclo do OKR (ex: 2026-Q3)' })
  @IsString()
  cycle: string;

  @ApiProperty({ description: 'ID do responsável pelo OKR' })
  @IsString()
  ownerId: string;
}

export class RecordCommitteeDecisionDto {
  @ApiProperty({ description: 'Nome / Identificação do comitê' })
  @IsString()
  committeeName: string;

  @ApiProperty({ description: 'Pauta da reunião' })
  @IsString()
  agenda: string;

  @ApiProperty({ description: 'Deliberação / Decisão registrada em ata' })
  @IsString()
  decision: string;

  @ApiPropertyOptional({ description: 'Plano de ação gerado (serão criadas tarefas no Workflow)' })
  @IsOptional()
  @IsString()
  actionPlan?: string;
}
