import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Enums ─────────────────────────────────────────────────────────────

export enum RiskCategory {
  ASSISTENTIAL = 'ASSISTENTIAL',
  FINANCIAL = 'FINANCIAL',
  OPERATIONAL = 'OPERATIONAL',
  PROFESSIONAL_BURNOUT = 'PROFESSIONAL_BURNOUT',
  BENEFICIARY_DROPOUT = 'BENEFICIARY_DROPOUT',
  COMPLIANCE_LEGAL = 'COMPLIANCE_LEGAL',
  CYBERSECURITY = 'CYBERSECURITY',
}

export enum ImpactLevel {
  NEGLIGIBLE = 'NEGLIGIBLE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RecommendationType {
  CARE_REFERRAL = 'CARE_REFERRAL',
  TRAINING_COURSE = 'TRAINING_COURSE',
  CLINICAL_PROTOCOL = 'CLINICAL_PROTOCOL',
  WORKFLOW_OPTIMIZATION = 'WORKFLOW_OPTIMIZATION',
  POLICY_UPDATE = 'POLICY_UPDATE',
  RESOURCE_REALLOCATION = 'RESOURCE_REALLOCATION',
}

export enum RecommendationStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED',
}

export enum AIModelStatus {
  DRAFT = 'DRAFT',
  TESTING = 'TESTING',
  APPROVED = 'APPROVED',
  DEPRECATED = 'DEPRECATED',
  DISABLED = 'DISABLED',
}

export enum KnowledgeNodeType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  PROJECT = 'PROJECT',
  ATTENDANCE = 'ATTENDANCE',
  DOCUMENT = 'DOCUMENT',
  COMPETENCY = 'COMPETENCY',
  INDICATOR = 'INDICATOR',
  RISK = 'RISK',
  PROCESS = 'PROCESS',
  EVENT = 'EVENT',
}

// ── DTOs ─────────────────────────────────────────────────────────────

export class UnifiedOrganizationalViewDto {
  @ApiProperty({ example: 1250, description: 'Total de beneficiários ativos' })
  activeBeneficiaries!: number;

  @ApiProperty({ example: 45, description: 'Total de profissionais e especialistas' })
  activeProfessionals!: number;

  @ApiProperty({ example: 120, description: 'Total de voluntários alocados' })
  activeVolunteers!: number;

  @ApiProperty({ example: 98.4, description: 'Índice de conformidade LGPD e Auditoria (%)' })
  complianceScorePercent!: number;

  @ApiProperty({ example: 94.2, description: 'Índice de eficiência de workflows (%)' })
  workflowEfficiencyPercent!: number;

  @ApiProperty({ example: 87.5, description: 'Orçamento executado (%)' })
  budgetExecutionPercent!: number;

  @ApiProperty({ example: 4.8, description: 'Nível de satisfação dos beneficiários (0-5)' })
  beneficiarySatisfactionScore!: number;
}

export class ScenarioSimulationDto {
  @ApiProperty({ example: 'SIM-2026-001', description: 'ID da Simulação' })
  simulationId!: string;

  @ApiProperty({ example: 'Aumento de 30% na demanda assistencial', description: 'Título do Cenário' })
  scenarioTitle!: string;

  @ApiProperty({ example: 'Impacto na fila de espera e sobrecarga de profissionais' })
  description!: string;

  @ApiProperty({ example: { demandIncreasePercent: 30, additionalVolunteers: 10 } })
  parameters!: Record<string, any>;

  @ApiProperty({ example: ImpactLevel.HIGH, enum: ImpactLevel })
  predictedImpactLevel!: ImpactLevel;

  @ApiProperty({ example: 'Risco de gargalo na triagem inicial (+45 min de espera)' })
  predictedOutcome!: string;

  @ApiProperty({ example: 0.92, description: 'Nível de confiança da IA (0.00 a 1.00)' })
  confidenceScore!: number;

  @ApiProperty({ example: ['Alocar 5 voluntários na recepção', 'Ativar triagem remota preventiva'] })
  mitigationRecommendations!: string[];
}

export class PredictiveModelQueryDto {
  @ApiProperty({ example: RiskCategory.BENEFICIARY_DROPOUT, enum: RiskCategory })
  @IsEnum(RiskCategory)
  riskCategory!: RiskCategory;

  @ApiPropertyOptional({ example: 'BEN-2026-10495' })
  @IsOptional()
  @IsString()
  targetId?: string;
}

export class PredictiveRiskResultDto {
  @ApiProperty({ example: 'PRD-2026-8821' })
  predictionId!: string;

  @ApiProperty({ example: RiskCategory.BENEFICIARY_DROPOUT, enum: RiskCategory })
  riskCategory!: RiskCategory;

  @ApiProperty({ example: 'BEN-2026-10495' })
  targetId!: string;

  @ApiProperty({ example: 0.85, description: 'Probabilidade de risco (0.00 a 1.00)' })
  riskProbability!: number;

  @ApiProperty({ example: ImpactLevel.HIGH, enum: ImpactLevel })
  impactLevel!: ImpactLevel;

  @ApiProperty({ example: ['Falta nas últimas 2 consultas', 'Mudança de telefone não confirmada'] })
  riskFactors!: string[];

  @ApiProperty({ example: 'Modelo preditivo Random Forest v2.1 treinado com 10k históricos assistenciais' })
  modelExplanability!: string;

  @ApiProperty({ example: 0.94 })
  confidenceScore!: number;
}

export class CreateRecommendationDto {
  @ApiProperty({ example: RecommendationType.CARE_REFERRAL, enum: RecommendationType })
  @IsEnum(RecommendationType)
  type!: RecommendationType;

  @ApiProperty({ example: 'BEN-2026-10495' })
  @IsString()
  targetId!: string;

  @ApiProperty({ example: 'Encaminhamento prioritário para atendimento psicológico individual' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Beneficiário apresentou pontuação PHQ-9 elevada (18/27) no acolhimento.' })
  @IsString()
  justification!: string;

  @ApiProperty({ example: 0.95 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore!: number;
}

export class FeedbackRecommendationDto {
  @ApiProperty({ example: RecommendationStatus.ACCEPTED, enum: RecommendationStatus })
  @IsEnum(RecommendationStatus)
  status!: RecommendationStatus;

  @ApiPropertyOptional({ example: 'Profissional aceitou a recomendação e agendou a sessão.' })
  @IsOptional()
  @IsString()
  feedbackNotes?: string;
}

export class KnowledgeGraphQueryDto {
  @ApiPropertyOptional({ example: 'Dr. Roberto' })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiPropertyOptional({ example: KnowledgeNodeType.PERSON, enum: KnowledgeNodeType })
  @IsOptional()
  @IsEnum(KnowledgeNodeType)
  nodeType?: KnowledgeNodeType;
}

export class KnowledgeNodeDto {
  @ApiProperty({ example: 'NODE-1029' })
  nodeId!: string;

  @ApiProperty({ example: 'Dr. Roberto Silva' })
  label!: string;

  @ApiProperty({ example: KnowledgeNodeType.PERSON, enum: KnowledgeNodeType })
  type!: KnowledgeNodeType;

  @ApiProperty({ example: { role: 'Psiquiatra', CRM: 'SP-192837', specialty: 'Infantojuvenil' } })
  properties!: Record<string, any>;
}

export class KnowledgeEdgeDto {
  @ApiProperty({ example: 'EDGE-5501' })
  edgeId!: string;

  @ApiProperty({ example: 'NODE-1029' })
  sourceNodeId!: string;

  @ApiProperty({ example: 'NODE-8812' })
  targetNodeId!: string;

  @ApiProperty({ example: 'RESPONSIBLE_FOR_CASE' })
  relationType!: string;

  @ApiProperty({ example: { since: '2026-01-15', status: 'ACTIVE' } })
  properties!: Record<string, any>;
}

export class AIModelGovernanceDto {
  @ApiProperty({ example: 'MOD-NLP-RAG-v3' })
  modelId!: string;

  @ApiProperty({ example: 'Aura Health RAG Assistant' })
  modelName!: string;

  @ApiProperty({ example: 'v3.2.0' })
  version!: string;

  @ApiProperty({ example: AIModelStatus.APPROVED, enum: AIModelStatus })
  status!: AIModelStatus;

  @ApiProperty({ example: 0.965, description: 'Acurácia / F1-Score do modelo' })
  f1Score!: number;

  @ApiProperty({ example: 0.012, description: 'Índice de viés / disparate impact (deve ser < 0.05)' })
  biasScore!: number;

  @ApiProperty({ example: 'SHAP / LIME Explicabilidade habilitada' })
  explainabilityFramework!: string;

  @ApiProperty({ example: true, description: 'Homologação por Human-in-the-Loop realizada' })
  humanInTheLoopApproved!: boolean;
}

export class ContinuousOptimizationActionDto {
  @ApiProperty({ example: 'OPT-2026-042' })
  actionId!: string;

  @ApiProperty({ example: 'Redução do tempo médio de espera no Acolhimento Social' })
  title!: string;

  @ApiProperty({ example: 'Gargalo identificado na triagem de documentos manuais.' })
  identifiedBottleneck!: string;

  @ApiProperty({ example: 'Habilitar leitura automatizada de documentos com OCR + IA' })
  proposedAction!: string;

  @ApiProperty({ example: 'Redução de 35 minutos para 8 minutos por atendimento' })
  expectedROI!: string;

  @ApiProperty({ example: ImpactLevel.HIGH, enum: ImpactLevel })
  priorityLevel!: ImpactLevel;
}
