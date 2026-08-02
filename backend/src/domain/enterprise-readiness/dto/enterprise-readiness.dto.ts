import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum ReadinessDomain {
  ARCHITECTURE = 'ARCHITECTURE',
  SECURITY = 'SECURITY',
  OBSERVABILITY = 'OBSERVABILITY',
  DOCUMENTATION = 'DOCUMENTATION',
  TESTING = 'TESTING',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  INTEGRATIONS = 'INTEGRATIONS',
  DATA_GOVERNANCE = 'DATA_GOVERNANCE',
}

export enum ValidationCategory {
  FUNCTIONAL = 'FUNCTIONAL',
  NONFUNCTIONAL = 'NONFUNCTIONAL',
  COMPLIANCE = 'COMPLIANCE',
  SECURITY = 'SECURITY',
}

export enum CertificationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  CERTIFIED = 'CERTIFIED',
  FAILED = 'FAILED',
  REVOKED = 'REVOKED',
}

export enum ReleaseStatus {
  CANDIDATE = 'CANDIDATE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  BLOCKED = 'BLOCKED',
  DEPLOYED = 'DEPLOYED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export enum ProductionRiskLevel {
  NEGLIGIBLE = 'NEGLIGIBLE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONDITIONAL = 'CONDITIONAL',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class AssessReadinessDto {
  @ApiProperty({ example: 'platform-lifecycle' })
  @IsString()
  moduleName: string;

  @ApiProperty({ example: '1.2.0' })
  @IsString()
  version: string;

  @ApiPropertyOptional({ enum: ReadinessDomain, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ReadinessDomain, { each: true })
  domainsToAssess?: ReadinessDomain[];
}

export class RunFunctionalValidationDto {
  @ApiProperty({ example: 'governance-compliance' })
  @IsString()
  moduleName: string;

  @ApiPropertyOptional({ example: ['LGPD data minimization', 'Zero Trust enforcement'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirementsToValidate?: string[];
}

export class RunNonfunctionalValidationDto {
  @ApiProperty({ example: 'mission-intelligence' })
  @IsString()
  moduleName: string;

  @ApiPropertyOptional({ example: { targetLatencyMs: 200, targetAvailabilityPercent: 99.9 } })
  @IsOptional()
  @IsObject()
  targets?: Record<string, any>;
}

export class CertifyComplianceDto {
  @ApiProperty({ example: 'enterprise-knowledge' })
  @IsString()
  moduleName: string;

  @ApiProperty({ example: '1.0.0' })
  @IsString()
  version: string;

  @ApiPropertyOptional({ example: ['LGPD', 'Privacy by Design', 'Zero Trust'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  frameworks?: string[];
}

export class SubmitReleaseCandidateDto {
  @ApiProperty({ example: 'v1.3.0' })
  @IsString()
  releaseTag: string;

  @ApiProperty({ example: 'feat(P162-EPLM): Platform Lifecycle Management' })
  @IsString()
  commitMessage: string;

  @ApiPropertyOptional({ example: ['ADR-162', 'ADR-161'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedAdrIds?: string[];

  @ApiPropertyOptional({ example: 'CTO' })
  @IsOptional()
  @IsString()
  requestedBy?: string;
}

export class AssessProductionRiskDto {
  @ApiProperty({ example: 'v1.3.0' })
  @IsString()
  releaseTag: string;

  @ApiPropertyOptional({ example: { affectedModules: ['all'], impactOnBeneficiaries: 'NONE' } })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}
