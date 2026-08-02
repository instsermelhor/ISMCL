import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';

// ── ENUMS ─────────────────────────────────────────────────────────────────────

export enum ArchitectureDomain {
  BUSINESS = 'BUSINESS',
  APPLICATION = 'APPLICATION',
  DATA = 'DATA',
  TECHNOLOGY = 'TECHNOLOGY',
  SECURITY = 'SECURITY',
  ARTIFICIAL_INTELLIGENCE = 'ARTIFICIAL_INTELLIGENCE',
  INTEGRATION = 'INTEGRATION',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
}

export enum AdrStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  SUPERSEDED = 'SUPERSEDED',
  DEPRECATED = 'DEPRECATED',
}

export enum ArbReviewStatus {
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  APPROVED_WITH_CONDITIONS = 'APPROVED_WITH_CONDITIONS',
  REJECTED = 'REJECTED',
  NEEDS_REVISION = 'NEEDS_REVISION',
}

export enum DriftSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TechnologyStatus {
  HOMOLOGATED = 'HOMOLOGATED',
  ASSESSING = 'ASSESSING',
  DEPRECATED = 'DEPRECATED',
  FORBIDDEN = 'FORBIDDEN',
}

// ── ENTERPRISE ARCHITECTURE DTOs ──────────────────────────────────────────────

export class RegisterArchitectureArtifactDto {
  @ApiProperty({ example: 'Arquitetura de Microsserviços Aura 2.0' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ArchitectureDomain, example: ArchitectureDomain.APPLICATION })
  @IsEnum(ArchitectureDomain)
  domain: ArchitectureDomain;

  @ApiProperty({ example: 'Diagrama C4 Nível 2 — Contêineres do Ecossistema' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'C4_MODEL' })
  @IsString()
  format: string; // e.g. C4_MODEL, UML, ARCHIMATE, OPENAPI, ASYNCAPI

  @ApiProperty({ example: 'Chief Enterprise Architect' })
  @IsString()
  author: string;

  @ApiPropertyOptional({ example: { c4Level: 2, diagramUrl: 'https://docs.sermelhor.org/c4-container.png' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// ── ADR DTOs ──────────────────────────────────────────────────────────────────

export class CreateAdrDto {
  @ApiProperty({ example: 'ADR-044: Adoção do NestJS com EventBus Desacoplado' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Necessidade de criar microsserviços desacoplados e orientados a eventos para a Plataforma Aura.' })
  @IsString()
  context: string;

  @ApiProperty({ example: 'Como estruturar os microsserviços garantindo tipagem forte, alta coesão e baixo acoplamento?' })
  @IsString()
  problemStatement: string;

  @ApiProperty({ example: ['Express.js puro', 'NestJS com TypeScript', 'Fastify desacoplado'] })
  @IsArray()
  @IsString({ each: true })
  alternativesEvaluated: string[];

  @ApiProperty({ example: 'Adotar NestJS com TypeScript e módulo centralizado de EventBus pub/sub.' })
  @IsString()
  decision: string;

  @ApiProperty({ example: 'NestJS fornece injeção de dependência nativa, suporte a decorators OpenAPI/Swagger e modularidade alinhada ao TOGAF.' })
  @IsString()
  justification: string;

  @ApiProperty({ example: ['Necessidade de treinamento em NestJS', 'Padrão uniforme para todos os 44+ módulos'] })
  @IsArray()
  @IsString({ each: true })
  impacts: string[];

  @ApiProperty({ example: 'Eng. Ricardo Ribeiro (CEA)' })
  @IsString()
  author: string;
}

// ── ARB REVIEW DTOs ───────────────────────────────────────────────────────────

export class SubmitSolutionReviewDto {
  @ApiProperty({ example: 'Módulo EAGO — Governança da Arquitetura Corporativa' })
  @IsString()
  solutionName: string;

  @ApiProperty({ example: 'Plataforma para monitoramento de drift, conformidade e governança arquitetural.' })
  @IsString()
  summary: string;

  @ApiProperty({ enum: ArchitectureDomain, example: ArchitectureDomain.APPLICATION })
  @IsEnum(ArchitectureDomain)
  primaryDomain: ArchitectureDomain;

  @ApiProperty({ example: 'Eng. Ricardo Ribeiro' })
  @IsString()
  leadArchitect: string;

  @ApiPropertyOptional({ example: ['TypeScript', 'NestJS', 'AsyncAPI 2.6.0', 'Swagger'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologiesUsed?: string[];
}

export class SubmitArbVoteDto {
  @ApiProperty({ example: 'ARB-REV-001' })
  @IsString()
  reviewId: string;

  @ApiProperty({ example: 'Eng. Ana Souza (CISO)' })
  @IsString()
  voterName: string;

  @ApiProperty({ enum: ArbReviewStatus, example: ArbReviewStatus.APPROVED })
  @IsEnum(ArbReviewStatus)
  vote: ArbReviewStatus;

  @ApiProperty({ example: 'Solução atende integralmente os requisitos de Security by Design e Zero Trust.' })
  @IsString()
  comments: string;
}

// ── EVOLUTION ROADMAP DTOs ───────────────────────────────────────────────────

export class CreateEvolutionPlanDto {
  @ApiProperty({ example: 'Roadmap de Transição para Microsserviços de IA Nativa (2026-2027)' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Migração gradual de inferência síncrona para workers assíncronos baseados em filas.' })
  @IsString()
  description: string;

  @ApiProperty({ example: '2026-Q3' })
  @IsString()
  targetQuarter: string;

  @ApiProperty({ example: ['Platform Core', 'Cognitive Engine'] })
  @IsArray()
  @IsString({ each: true })
  affectedComponents: string[];

  @ApiProperty({ example: 'Eng. Ricardo Ribeiro (CEA)' })
  @IsString()
  owner: string;
}
