import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum ComplianceFramework {
  LGPD = 'LGPD',
  PRIVACY_BY_DESIGN = 'PRIVACY_BY_DESIGN',
  SECURITY_BY_DESIGN = 'SECURITY_BY_DESIGN',
  ZERO_TRUST = 'ZERO_TRUST',
  INTERNAL_POLICIES = 'INTERNAL_POLICIES',
  SEGREGATION_OF_DUTIES = 'SEGREGATION_OF_DUTIES',
  ENTERPRISE_ARCHITECTURE = 'ENTERPRISE_ARCHITECTURE',
}

export enum RiskCategory {
  STRATEGIC = 'STRATEGIC',
  OPERATIONAL = 'OPERATIONAL',
  TECHNOLOGICAL = 'TECHNOLOGICAL',
  REGULATORY = 'REGULATORY',
  FINANCIAL = 'FINANCIAL',
  REPUTATIONAL = 'REPUTATIONAL',
  ASSISTENTIAL = 'ASSISTENTIAL',
}

export enum RiskSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum PolicyStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  UNDER_REVISION = 'UNDER_REVISION',
  VIOLATED = 'VIOLATED',
  DEPRECATED = 'DEPRECATED',
}

export enum AuditScope {
  SYSTEM_WIDE = 'SYSTEM_WIDE',
  DATA_PRIVACY = 'DATA_PRIVACY',
  SECURITY_ACCESS = 'SECURITY_ACCESS',
  WORKFLOW_PROCESS = 'WORKFLOW_PROCESS',
  AI_MODEL_GOVERNANCE = 'AI_MODEL_GOVERNANCE',
}

export enum ComplianceLevel {
  FULLY_COMPLIANT = 'FULLY_COMPLIANT',   // 100%
  SUBSTANTIALLY_COMPLIANT = 'SUBSTANTIALLY_COMPLIANT', // 85-99%
  PARTIALLY_COMPLIANT = 'PARTIALLY_COMPLIANT', // 60-84%
  NON_COMPLIANT = 'NON_COMPLIANT',       // <60%
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class RunComplianceCheckDto {
  @ApiProperty({ enum: ComplianceFramework, example: ComplianceFramework.LGPD })
  @IsEnum(ComplianceFramework)
  framework: ComplianceFramework;

  @ApiPropertyOptional({ example: 'enterprise-knowledge' })
  @IsOptional()
  @IsString()
  targetModule?: string;

  @ApiPropertyOptional({ example: { checkDataMinimization: true } })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class ValidatePolicyDto {
  @ApiProperty({ example: 'POL-LGPD-2026-001' })
  @IsString()
  policyId: string;

  @ApiProperty({ example: 'Política de Retenção e Descarte de Dados de Beneficiários' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Estipula prazo máximo de retenção de 5 anos após encerramento do atendimento' })
  @IsString()
  contentSummary: string;

  @ApiPropertyOptional({ example: ['LGPD', 'PRIVACY_BY_DESIGN'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  frameworks?: string[];
}

export class RecordComplianceEvidenceDto {
  @ApiProperty({ enum: ComplianceFramework, example: ComplianceFramework.ZERO_TRUST })
  @IsEnum(ComplianceFramework)
  framework: ComplianceFramework;

  @ApiProperty({ example: 'Certificado de Auditoria de Criptografia SHA-256 e TLS 1.3' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Evidência de criptografia ponta a ponta em todos os microsserviços' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: { verifiedBy: 'CISO-01', checksum: 'abc123sha256' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AssessEnterpriseRiskDto {
  @ApiProperty({ enum: RiskCategory, example: RiskCategory.TECHNOLOGICAL })
  @IsEnum(RiskCategory)
  category: RiskCategory;

  @ApiProperty({ example: 'Risco de Latência em EventBus Kafka durante Picos' })
  @IsString()
  riskName: string;

  @ApiProperty({ enum: RiskSeverity, example: RiskSeverity.MEDIUM })
  @IsEnum(RiskSeverity)
  severity: RiskSeverity;

  @ApiPropertyOptional({ example: 'Implementação de autoscaling de brokers e redundância de partições' })
  @IsOptional()
  @IsString()
  mitigationStrategy?: string;
}

export class GenerateGovernanceRecommendationDto {
  @ApiProperty({ example: 'Reforço de Autenticação Multifator para Acesso Executivo' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Identificada necessidade de MFA mandatório para acesso ao Centro de Comando' })
  @IsString()
  rationale: string;

  @ApiPropertyOptional({ example: 'HIGH' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'CISO' })
  @IsOptional()
  @IsString()
  suggestedOwner?: string;
}
