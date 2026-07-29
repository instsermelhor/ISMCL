import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

// ── Enumerações de Domínio — Production Readiness ──────────────────────────

export enum ReadinessStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
}

export enum CertificationVerdict {
  APPROVED = 'APPROVED',                     // Aprovado sem restrições
  APPROVED_WITH_RESTRICTIONS = 'APPROVED_WITH_RESTRICTIONS', // Aprovado com ressalvas
  REJECTED = 'REJECTED',                     // Reprovado — Go-Live bloqueado
}

export enum GoLiveStatus {
  SCHEDULED = 'SCHEDULED',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  ROLLED_BACK = 'ROLLED_BACK',
  CANCELLED = 'CANCELLED',
}

export enum ApprovalAuthority {
  BOARD_OF_DIRECTORS = 'BOARD_OF_DIRECTORS',
  CISO = 'CISO',
  CHIEF_ARCHITECT = 'CHIEF_ARCHITECT',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  OPERATIONS_DIRECTOR = 'OPERATIONS_DIRECTOR',
  AUDIT_COMMITTEE = 'AUDIT_COMMITTEE',
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export class RunReadinessChecklistDto {
  @ApiPropertyOptional({ description: 'Domínio específico para checar (omitir para auditoria completa)' })
  @IsOptional()
  @IsString()
  targetDomain?: string;
}

export class IssueCertificationDto {
  @ApiProperty({ description: 'Domínio a ser certificado (ex: ArchitectureModule)' })
  @IsString()
  domainName: string;

  @ApiProperty({ description: 'Veredicto de certificação', enum: CertificationVerdict })
  @IsEnum(CertificationVerdict)
  verdict: CertificationVerdict;

  @ApiPropertyOptional({ description: 'Observações ou restrições detectadas' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ScheduleGoLiveDto {
  @ApiProperty({ description: 'Nome da versão / Release (ex: Aura v1.0.0-GA)' })
  @IsString()
  releaseName: string;

  @ApiProperty({ description: 'Data e hora planejada do Go-Live (ISO 8601)' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Responsável técnico pelo Go-Live' })
  @IsOptional()
  @IsString()
  releaseManager?: string;
}

export class GrantExecutiveApprovalDto {
  @ApiProperty({ description: 'ID do Go-Live a aprovar formalmente' })
  @IsString()
  goLiveId: string;

  @ApiProperty({ description: 'Autoridade que concede aprovação', enum: ApprovalAuthority })
  @IsEnum(ApprovalAuthority)
  authority: ApprovalAuthority;

  @ApiProperty({ description: 'Nome do aprovador formal' })
  @IsString()
  approverName: string;
}
