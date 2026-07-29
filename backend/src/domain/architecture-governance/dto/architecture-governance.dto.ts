import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

// ── Enumerações de Domínio da Governança Arquitetural ────────────────────────

export enum AdrStatus {
  PROPOSED = 'PROPOSED',   // Proposto
  ACCEPTED = 'ACCEPTED',   // Aceito / Homologado
  SUPERSEDED = 'SUPERSEDED', // Obsoleto por nova decisão
  REJECTED = 'REJECTED',   // Rejeitado pelo Conselho Arquitetural
}

export enum ComplianceLevel {
  FULL_COMPLIANCE = 'FULL_COMPLIANCE',     // 100% de Aderência Padrões
  MINOR_VIOLATION = 'MINOR_VIOLATION',     // Violação Leve (Alerta)
  CRITICAL_VIOLATION = 'CRITICAL_VIOLATION', // Violação Crítica (Bloqueante)
}

export enum DebtCategory {
  ARCHITECTURAL = 'ARCHITECTURAL', // Débito Arquitetural (Acoplamento)
  CODE = 'CODE',                   // Débito de Código (Complexidade)
  SECURITY = 'SECURITY',           // Débito de Segurança (Vulnerabilidade)
  TEST = 'TEST',                   // Débito de Testes (Cobertura baixa)
  DOCUMENTATION = 'DOCUMENTATION', // Débito de Documentação
}

export enum DebtSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class CreateAdrDto {
  @ApiProperty({ description: 'Título da Decisão Arquitetural (ADR)' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Contexto e motivação da decisão' })
  @IsString()
  context: string;

  @ApiProperty({ description: 'Decisão adotada' })
  @IsString()
  decision: string;

  @ApiProperty({ description: 'Consequências e impactos' })
  @IsString()
  consequences: string;

  @ApiPropertyOptional({ description: 'Alternativas consideradas' })
  @IsOptional()
  @IsString()
  alternativesEvaluated?: string;

  @ApiPropertyOptional({ description: 'Domínios / Microsserviços afetados' })
  @IsOptional()
  @IsString()
  affectedDomains?: string;
}

export class AssessComplianceDto {
  @ApiProperty({ description: 'Nome do Microsserviço / Módulo a auditar' })
  @IsString()
  moduleName: string;

  @ApiProperty({ description: 'Descrição das regras ou padrões avaliados' })
  @IsString()
  evaluationRules: string;
}

export class RegisterTechnicalDebtDto {
  @ApiProperty({ description: 'Título / Descrição da Dívida Técnica' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Categoria do Débito', enum: DebtCategory })
  @IsEnum(DebtCategory)
  category: DebtCategory;

  @ApiProperty({ description: 'Gravidade do Débito', enum: DebtSeverity })
  @IsEnum(DebtSeverity)
  severity: DebtSeverity;

  @ApiProperty({ description: 'Estimativa de esforço para remediação em horas' })
  @IsNumber()
  @Min(1)
  @Max(1000)
  remediationHours: number;

  @ApiProperty({ description: 'Módulo / Domínio afetado' })
  @IsString()
  affectedModule: string;
}
