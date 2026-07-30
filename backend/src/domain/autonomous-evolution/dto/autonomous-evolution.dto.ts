import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── ENUMS ────────────────────────────────────────────────────────────────────

export enum EvolutionType {
  ARCHITECTURE = 'ARCHITECTURE',
  WORKFLOW = 'WORKFLOW',
  PERFORMANCE = 'PERFORMANCE',
  PROCESS = 'PROCESS',
  GOVERNANCE = 'GOVERNANCE',
  SECURITY = 'SECURITY',
  USER_EXPERIENCE = 'USER_EXPERIENCE',
  AI_MODEL = 'AI_MODEL',
}

export enum ImprovementCategory {
  BOTTLENECK_REDUCTION = 'BOTTLENECK_REDUCTION',
  REDUNDANCY_ELIMINATION = 'REDUNDANCY_ELIMINATION',
  REWORK_MINIMIZATION = 'REWORK_MINIMIZATION',
  RESOURCE_OPTIMIZATION = 'RESOURCE_OPTIMIZATION',
  OPERATIONAL_RISK_MITIGATION = 'OPERATIONAL_RISK_MITIGATION',
  QUALITY_ENHANCEMENT = 'QUALITY_ENHANCEMENT',
}

export enum InnovationPhase {
  PROPOSAL = 'PROPOSAL',
  EVALUATION = 'EVALUATION',
  EXPERIMENTATION = 'EXPERIMENTATION',
  PILOT = 'PILOT',
  ADOPTION = 'ADOPTION',
  CLOSED = 'CLOSED',
}

export enum ImpactDimension {
  ARCHITECTURE = 'ARCHITECTURE',
  SECURITY = 'SECURITY',
  LGPD = 'LGPD',
  INTEGRATIONS = 'INTEGRATIONS',
  WORKFLOWS = 'WORKFLOWS',
  DATABASE = 'DATABASE',
  ARTIFICIAL_INTELLIGENCE = 'ARTIFICIAL_INTELLIGENCE',
  DOCUMENTATION = 'DOCUMENTATION',
  TRAINING = 'TRAINING',
  STRATEGIC_KPIS = 'STRATEGIC_KPIS',
}

export enum ImpactLevel {
  NEGLIGIBLE = 'NEGLIGIBLE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ApprovalStatus {
  SUBMITTED = 'SUBMITTED',
  TECHNICAL_REVIEW = 'TECHNICAL_REVIEW',
  SECURITY_REVIEW = 'SECURITY_REVIEW',
  IMPACT_EVALUATED = 'IMPACT_EVALUATED',
  GOVERNANCE_APPROVED = 'GOVERNANCE_APPROVED',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED',
}

export enum LearningCategory {
  IMPLEMENTED_IMPROVEMENT = 'IMPLEMENTED_IMPROVEMENT',
  LESSON_LEARNED = 'LESSON_LEARNED',
  POST_DEPLOYMENT_FEEDBACK = 'POST_DEPLOYMENT_FEEDBACK',
  ARCHITECTURAL_DECISION = 'ARCHITECTURAL_DECISION',
  INNOVATION_OUTCOME = 'INNOVATION_OUTCOME',
}

export enum StrategicCategory {
  PLATFORM_EXPANSION = 'PLATFORM_EXPANSION',
  NEW_SERVICE = 'NEW_SERVICE',
  TECHNOLOGY_MODERNIZATION = 'TECHNOLOGY_MODERNIZATION',
  OPERATIONAL_EFFICIENCY = 'OPERATIONAL_EFFICIENCY',
  PEOPLE_MANAGEMENT = 'PEOPLE_MANAGEMENT',
  FINANCIAL_SUSTAINABILITY = 'FINANCIAL_SUSTAINABILITY',
  SOCIAL_IMPACT = 'SOCIAL_IMPACT',
}

// ── DTOS — EVOLUTION ENGINE ──────────────────────────────────────────────────

export class DetectEvolutionOpportunitiesDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ example: ['cognitive-orchestration', 'workflow'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetModules?: string[];

  @ApiPropertyOptional({ example: { minConfidenceScore: 0.8 } })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

// ── DTOS — CONTINUOUS IMPROVEMENT ───────────────────────────────────────────

export class CreateImprovementPlanDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ enum: ImprovementCategory, example: ImprovementCategory.BOTTLENECK_REDUCTION })
  @IsEnum(ImprovementCategory)
  category: ImprovementCategory;

  @ApiProperty({ example: 'Redução de Gargalo de Triagem no Acolhimento' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Implementação de pré-triagem paralela com suporte de agente inteligente' })
  @IsString()
  description: string;

  @ApiProperty({ example: ['Fila de triagem com SLA > 45min em 20% dos atendimentos'] })
  @IsArray()
  @IsString({ each: true })
  findings: string[];

  @ApiProperty({ example: ['Adicionar agente de pré-classificação em tempo real'] })
  @IsArray()
  @IsString({ each: true })
  actionItems: string[];

  @ApiProperty({ example: 'Redução de 30% no tempo de fila inicial' })
  @IsString()
  targetKpi: string;

  @ApiPropertyOptional({ example: 'PROF-001' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}

// ── DTOS — ADAPTIVE PROCESS OPTIMIZATION ─────────────────────────────────────

export class ProposeProcessOptimizationDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: 'PROC-INTAKE-001' })
  @IsString()
  processId: string;

  @ApiProperty({ example: 'Ajuste parametrizável do tempo limite de espera em fila' })
  @IsString()
  title: string;

  @ApiProperty({ example: { maxWaitTimeMinutes: 30, concurrencyLimit: 5 } })
  @IsObject()
  proposedParameters: Record<string, any>;

  @ApiProperty({ example: 'Alta concentração de beneficiários em horário de pico (09h-11h)' })
  @IsString()
  rationale: string;
}

// ── DTOS — INNOVATION MANAGEMENT ────────────────────────────────────────────

export class SubmitInnovationProposalDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: 'Piloto de Triagem com Análise de Expressão Vocal (Audio AI)' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Uso de modelo de análise de tom de voz para suporte à triagem psicológica.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Inovação e Tecnologia Clínica' })
  @IsString()
  domainArea: string;

  @ApiProperty({ example: 0.85 })
  @IsNumber()
  @Min(0)
  @Max(1)
  strategicAlignmentScore: number;

  @ApiProperty({ example: 15000.00 })
  @IsNumber()
  estimatedCostBrl: number;

  @ApiPropertyOptional({ example: 'DR-INNOVATION-01' })
  @IsOptional()
  @IsString()
  proposerId?: string;
}

export class EvaluateInnovationDto {
  @ApiProperty({ example: 'INV-2026-0001' })
  @IsString()
  innovationId: string;

  @ApiProperty({ example: 0.92 })
  @IsNumber()
  @Min(0)
  @Max(1)
  impactScore: number;

  @ApiProperty({ example: 0.25 })
  @IsNumber()
  @Min(0)
  @Max(1)
  riskScore: number;

  @ApiProperty({ example: 'Proposta alinhada e com baixo risco técnico.' })
  @IsString()
  evaluationComments: string;

  @ApiProperty({ example: 'EVAL-USER-001' })
  @IsString()
  evaluatorId: string;
}

// ── DTOS — CHANGE IMPACT ANALYSIS ──────────────────────────────────────────

export class CalculateChangeImpactDto {
  @ApiProperty({ example: 'CHG-2026-0001' })
  @IsString()
  changeId: string;

  @ApiProperty({ example: 'Substituição da base vetorial local por cluster PGVector distribuído' })
  @IsString()
  changeDescription: string;

  @ApiProperty({ enum: EvolutionType, example: EvolutionType.ARCHITECTURE })
  @IsEnum(EvolutionType)
  changeType: EvolutionType;

  @ApiProperty({ example: ['cognitive-orchestration', 'institutional-intelligence'] })
  @IsArray()
  @IsString({ each: true })
  affectedModules: string[];

  @ApiPropertyOptional({ example: { schemaChanges: true, APIVersionBump: 'v2' } })
  @IsOptional()
  @IsObject()
  technicalDetails?: Record<string, any>;
}

// ── DTOS — INSTITUTIONAL LEARNING ───────────────────────────────────────────

export class RecordLearningDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ enum: LearningCategory, example: LearningCategory.IMPLEMENTED_IMPROVEMENT })
  @IsEnum(LearningCategory)
  category: LearningCategory;

  @ApiProperty({ example: 'Implementação de Roteamento Dinâmico no ACOP (P152)' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Roteamento por capability score reduziu latência média dos agentes em 35%.' })
  @IsString()
  content: string;

  @ApiProperty({ example: ['Evitar roteamento estático por papel fixo', 'Monitorar carga contínua dos agentes'] })
  @IsArray()
  @IsString({ each: true })
  lessonsLearned: string[];

  @ApiPropertyOptional({ example: ['acop', 'routing', 'performance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// ── DTOS — STRATEGIC RECOMMENDATIONS ─────────────────────────────────────────

export class GenerateStrategicRecommendationDto {
  @ApiProperty({ example: 'TENANT-001' })
  @IsString()
  tenantId: string;

  @ApiProperty({ enum: StrategicCategory, example: StrategicCategory.TECHNOLOGY_MODERNIZATION })
  @IsEnum(StrategicCategory)
  category: StrategicCategory;

  @ApiProperty({ example: 'Expansão do Atendimento via IA Multimodal e Telemedicina Distribuída' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Incorporar suporte a dados biométricos em tempo real na Plataforma Aura.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Aumento de 40% na demanda por acompanhamento domiciliar de casos de alta vulnerabilidade.' })
  @IsString()
  rationale: string;

  @ApiProperty({ example: ['BI Report Q2-2026', 'Pesquisa de Satisfação Institucional', 'SLA SmartQueue'] })
  @IsArray()
  @IsString({ each: true })
  evidences: string[];

  @ApiProperty({ example: 'Ampliação do alcance assistencial para 10.000 novos beneficiários com alta precisão.' })
  @IsString()
  expectedImpact: string;

  @ApiProperty({ example: 45000.00 })
  @IsNumber()
  estimatedCostBrl: number;

  @ApiProperty({ example: ['Risco de sobrecarga de rede em regiões periféricas'] })
  @IsArray()
  @IsString({ each: true })
  identifiedRisks: string[];
}

// ── DTOS — GOVERNANCE APPROVAL ───────────────────────────────────────────────

export class SubmitGovernanceApprovalDto {
  @ApiProperty({ example: 'CHG-2026-0001' })
  @IsString()
  changeId: string;

  @ApiProperty({ example: 'Aprovação de Mudança Arquitetural — Cluster PGVector' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'CHG-IMP-2026-0001' })
  @IsString()
  impactAnalysisId: string;

  @ApiProperty({ example: 'ADR-153' })
  @IsString()
  adrReference: string;

  @ApiPropertyOptional({ example: 'CISO-ADMIN-01' })
  @IsOptional()
  @IsString()
  requesterId?: string;
}

export class ProcessGovernanceApprovalDto {
  @ApiProperty({ example: 'GOV-APP-2026-0001' })
  @IsString()
  approvalId: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({ example: 'CISO-ADMIN-01' })
  @IsString()
  approverId: string;

  @ApiProperty({ example: 'Chief Information Security Officer' })
  @IsString()
  approverRole: string;

  @ApiPropertyOptional({ example: 'Análise de segurança e conformidade LGPD totalmente aprovada.' })
  @IsOptional()
  @IsString()
  comments?: string;
}

// ── DTOS — CONTINUOUS AUDIT ──────────────────────────────────────────────────

export class RecordEvolutionAuditDto {
  @ApiProperty({ example: 'autonomous-evolution-engine' })
  @IsString()
  componentName: string;

  @ApiProperty({ example: 'EVOLUTION_CYCLE_COMPLETED' })
  @IsString()
  actionName: string;

  @ApiProperty({ example: { opportunitiesDetected: 4, plansCreated: 2 } })
  @IsObject()
  details: Record<string, any>;

  @ApiPropertyOptional({ example: 'GOV-USER-001' })
  @IsOptional()
  @IsString()
  humanSupervisorId?: string;
}
