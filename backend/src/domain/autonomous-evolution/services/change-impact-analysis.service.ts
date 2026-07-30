import { Injectable, Logger } from '@nestjs/common';
import { CalculateChangeImpactDto, EvolutionType, ImpactDimension, ImpactLevel } from '../dto/autonomous-evolution.dto';
import { ContinuousEvolutionAuditService } from './continuous-evolution-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ImpactMatrixCell {
  dimension: ImpactDimension;
  impactLevel: ImpactLevel;
  description: string;
  mitigationStrategy: string;
  riskScore: number; // 0.0 to 1.0
}

export interface ChangeImpactAnalysisResult {
  impactAnalysisId: string;
  changeId: string;
  changeDescription: string;
  changeType: EvolutionType;
  overallImpactLevel: ImpactLevel;
  overallRiskScore: number;
  impactMatrix: ImpactMatrixCell[];
  isBlocked: boolean;
  blockReason?: string;
  evaluatedAt: string;
}

/**
 * ChangeImpactAnalysisService — Análise Multidimensional de Impacto (P153 AAEE)
 *
 * Avalia previamente todas as 10 dimensões de impacto antes de qualquer aprovação:
 * 1. Arquitetura (Clean Architecture / DDD)
 * 2. Segurança (Zero Trust / DevSecOps)
 * 3. LGPD (Privacidade / Consentimento)
 * 4. Integrações (APIs / Webhooks)
 * 5. Workflows (SLA / Tarefas)
 * 6. Banco de Dados (Schemas / Migrations)
 * 7. Inteligência Artificial (Modelos / Agentes)
 * 8. Documentação (C4 / ADRs / OpenAPI / AsyncAPI)
 * 9. Treinamento (Universidade Corporativa)
 * 10. Indicadores Estratégicos (KPIs / BI)
 */
@Injectable()
export class ChangeImpactAnalysisService {
  private readonly logger = new Logger(ChangeImpactAnalysisService.name);
  private impactRegistry: Map<string, ChangeImpactAnalysisResult> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly auditService: ContinuousEvolutionAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async calculateImpact(dto: CalculateChangeImpactDto): Promise<ChangeImpactAnalysisResult> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const impactAnalysisId = `CHG-IMP-${year}-${seq}`;

    // Avalia as 10 dimensões obrigatoriamente
    const impactMatrix: ImpactMatrixCell[] = [
      {
        dimension: ImpactDimension.ARCHITECTURE,
        impactLevel: dto.changeType === EvolutionType.ARCHITECTURE ? ImpactLevel.HIGH : ImpactLevel.LOW,
        description: `Impacto nos módulos afetados: ${dto.affectedModules.join(', ')}`,
        mitigationStrategy: 'Validar aderência ao Digital Twin e Clean Architecture no Architecture Governance Office.',
        riskScore: dto.changeType === EvolutionType.ARCHITECTURE ? 0.65 : 0.15,
      },
      {
        dimension: ImpactDimension.SECURITY,
        impactLevel: ImpactLevel.MEDIUM,
        description: 'Verificação de regras Zero Trust, segregação de papéis (RBAC/ABAC) e criptografia.',
        mitigationStrategy: 'Executar pipeline DevSecOps SAST/DAST e auditoria CISO antes da implantação.',
        riskScore: 0.30,
      },
      {
        dimension: ImpactDimension.LGPD,
        impactLevel: ImpactLevel.LOW,
        description: 'Análise de dados pessoais/sensíveis e retenção de registros.',
        mitigationStrategy: 'Garantir minimização de dados e hashing em logs de auditoria.',
        riskScore: 0.10,
      },
      {
        dimension: ImpactDimension.INTEGRATIONS,
        impactLevel: dto.affectedModules.length > 2 ? ImpactLevel.HIGH : ImpactLevel.MEDIUM,
        description: `Avaliação de breaking changes nos endpoints REST/GraphQL dos ${dto.affectedModules.length} módulos.`,
        mitigationStrategy: 'Manter versionamento de API v1 e backward-compatibility.',
        riskScore: dto.affectedModules.length * 0.15,
      },
      {
        dimension: ImpactDimension.WORKFLOWS,
        impactLevel: ImpactLevel.MEDIUM,
        description: 'Impacto nas filas de execução e regras do motor de processos (Engine P110).',
        mitigationStrategy: 'Simular execução em ambiente de homologação antes de ativar novos parâmetros.',
        riskScore: 0.25,
      },
      {
        dimension: ImpactDimension.DATABASE,
        impactLevel: dto.technicalDetails?.schemaChanges ? ImpactLevel.HIGH : ImpactLevel.LOW,
        description: dto.technicalDetails?.schemaChanges
          ? 'Alteração de modelo de dados requer migração de schema Prisma.'
          : 'Sem alterações de tabela ou migrations destrutivas.',
        mitigationStrategy: 'Executar migration com rollback plan testado.',
        riskScore: dto.technicalDetails?.schemaChanges ? 0.70 : 0.05,
      },
      {
        dimension: ImpactDimension.ARTIFICIAL_INTELLIGENCE,
        impactLevel: dto.changeType === EvolutionType.AI_MODEL ? ImpactLevel.HIGH : ImpactLevel.LOW,
        description: 'Avaliação de impacto no roteamento e precisão dos 14 agentes especializados.',
        mitigationStrategy: 'Validar drift score e manter aprovação de modelo em STAGING antes de PRODUCTION.',
        riskScore: dto.changeType === EvolutionType.AI_MODEL ? 0.50 : 0.10,
      },
      {
        dimension: ImpactDimension.DOCUMENTATION,
        impactLevel: ImpactLevel.MEDIUM,
        description: 'Necessidade de atualizar OpenAPI, AsyncAPI, ADRs e diagramas C4.',
        mitigationStrategy: 'Geração automática de documentação durante a fase de validação.',
        riskScore: 0.20,
      },
      {
        dimension: ImpactDimension.TRAINING,
        impactLevel: ImpactLevel.LOW,
        description: 'Avaliação de necessidade de atualização na Universidade Corporativa.',
        mitigationStrategy: 'Publicar nota de lançamento e atualizar trilha EAD caso haja mudança de fluxo.',
        riskScore: 0.10,
      },
      {
        dimension: ImpactDimension.STRATEGIC_KPIS,
        impactLevel: ImpactLevel.LOW,
        description: 'Monitoramento do impacto nos indicadores operacionais e assistenciais pós-implantação.',
        mitigationStrategy: 'Acompanhar telemetria e dashboard de BI nos primeiros 30 dias.',
        riskScore: 0.10,
      },
    ];

    const totalRisk = impactMatrix.reduce((sum, c) => sum + c.riskScore, 0) / impactMatrix.length;
    const overallRiskScore = Math.round(totalRisk * 100) / 100;
    const overallImpactLevel =
      overallRiskScore > 0.6 ? ImpactLevel.CRITICAL : overallRiskScore > 0.4 ? ImpactLevel.HIGH : ImpactLevel.MEDIUM;

    const result: ChangeImpactAnalysisResult = {
      impactAnalysisId,
      changeId: dto.changeId,
      changeDescription: dto.changeDescription,
      changeType: dto.changeType,
      overallImpactLevel,
      overallRiskScore,
      impactMatrix,
      isBlocked: overallRiskScore > 0.8,
      blockReason: overallRiskScore > 0.8 ? 'Risco multidimensional excessivo (> 0.80). Exige reestruturação do plano.' : undefined,
      evaluatedAt: new Date().toISOString(),
    };

    this.impactRegistry.set(impactAnalysisId, result);

    await this.auditService.recordEvolutionAudit({
      componentName: 'change-impact-analysis',
      actionName: 'ImpactCalculated',
      details: { impactAnalysisId, changeId: dto.changeId, overallImpactLevel, overallRiskScore, isBlocked: result.isBlocked },
    });

    await this.eventBus.publish(
      'aura.evolution.change_impact.calculated.v1',
      {
        impactAnalysisId,
        changeId: dto.changeId,
        overallImpactLevel,
        overallRiskScore,
        isBlocked: result.isBlocked,
      },
      this.SYSTEM_TENANT,
      { subject: impactAnalysisId },
    );

    this.logger.log(`[ChangeImpactAnalysis] Evaluated: ${impactAnalysisId} → Level: ${overallImpactLevel} (Score: ${overallRiskScore})`);
    return result;
  }

  getImpactMatrix(impactAnalysisId: string): ChangeImpactAnalysisResult | undefined {
    return this.impactRegistry.get(impactAnalysisId);
  }
}
