import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject, IsBoolean } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum AutomationStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DEPRECATED = 'DEPRECATED',
}

export enum AutomationDomain {
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  SOCIAL_ASSISTANCE = 'SOCIAL_ASSISTANCE',
  FINANCIAL = 'FINANCIAL',
  DOCUMENTS = 'DOCUMENTS',
  HUMAN_RESOURCES = 'HUMAN_RESOURCES',
  VOLUNTEERING = 'VOLUNTEERING',
  COMPLIANCE = 'COMPLIANCE',
  AUDIT = 'AUDIT',
}

export enum RpaTaskStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

export enum AgentType {
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  FINANCIAL = 'FINANCIAL',
  DOCUMENT = 'DOCUMENT',
  COMPLIANCE = 'COMPLIANCE',
  ATTENDANCE = 'ATTENDANCE',
  AUDIT = 'AUDIT',
  COMMUNICATION = 'COMMUNICATION',
  CASE_MANAGEMENT = 'CASE_MANAGEMENT',
  ANALYTICAL = 'ANALYTICAL',
}

export enum DecisionOutcome {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED_HUMAN = 'ESCALATED_HUMAN',
  CONDITIONAL = 'CONDITIONAL',
  DEFERRED = 'DEFERRED',
}

export enum HumanLoopAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REVIEW = 'REVIEW',
  DELEGATE = 'DELEGATE',
  INTERRUPT = 'INTERRUPT',
  REPROCESS = 'REPROCESS',
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class CreateAutomationDto {
  @ApiProperty({ example: 'AUTO-ONBOARDING-VOLUNTEER' })
  @IsString()
  automationId: string;

  @ApiProperty({ example: 'Onboarding Automático de Voluntários' })
  @IsString()
  name: string;

  @ApiProperty({ enum: AutomationDomain, example: AutomationDomain.VOLUNTEERING })
  @IsEnum(AutomationDomain)
  domain: AutomationDomain;

  @ApiProperty({ example: 'Automatiza o processo completo de cadastro, triagem e integração de voluntários.' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: ['NotificationService', 'VolunteerModule'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  integratedServices?: string[];

  @ApiProperty({ example: 'Gerente de Voluntariado' })
  @IsString()
  owner: string;
}

export class ExecuteRpaTaskDto {
  @ApiProperty({ example: 'RPA-GENERATE-SOCIAL-REPORTS' })
  @IsString()
  taskId: string;

  @ApiProperty({ example: 'Geração Automática de Relatórios Sociais Mensais' })
  @IsString()
  taskName: string;

  @ApiProperty({ example: 'ReportBot-v3.2' })
  @IsString()
  robotName: string;

  @ApiProperty({ enum: AutomationDomain, example: AutomationDomain.SOCIAL_ASSISTANCE })
  @IsEnum(AutomationDomain)
  domain: AutomationDomain;

  @ApiPropertyOptional({ example: { month: '2026-07', format: 'PDF' } })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class ActivateAutonomousAgentDto {
  @ApiProperty({ enum: AgentType, example: AgentType.COMPLIANCE })
  @IsEnum(AgentType)
  agentType: AgentType;

  @ApiProperty({ example: 'Verificação semanal de conformidade LGPD de todos os domínios' })
  @IsString()
  mission: string;

  @ApiPropertyOptional({ example: { contextual_memory: false, max_actions: 20 } })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, any>;
}

export class AutomateDecisionDto {
  @ApiProperty({ example: 'DECISION-BENEFIT-ELIGIBILITY-001' })
  @IsString()
  decisionId: string;

  @ApiProperty({ example: 'Elegibilidade para Benefício de Cesta Básica' })
  @IsString()
  decisionName: string;

  @ApiProperty({ example: { monthlyIncome: 850, householdSize: 5, activeRegistration: true } })
  @IsObject()
  contextData: Record<string, any>;

  @ApiPropertyOptional({ example: 'RULE-BENEFIT-ELIGIBILITY-V2' })
  @IsOptional()
  @IsString()
  ruleSetId?: string;
}

export class HumanLoopResolutionDto {
  @ApiProperty({ example: 'LOOP-BENEFIT-ELIGIBILITY-EDGE-CASE-007' })
  @IsString()
  loopId: string;

  @ApiProperty({ enum: HumanLoopAction, example: HumanLoopAction.APPROVE })
  @IsEnum(HumanLoopAction)
  action: HumanLoopAction;

  @ApiProperty({ example: 'Assistente Social Dra. Carla Mendes' })
  @IsString()
  reviewerName: string;

  @ApiPropertyOptional({ example: 'Caso especial aprovado após visita domiciliar.' })
  @IsOptional()
  @IsString()
  justification?: string;
}
