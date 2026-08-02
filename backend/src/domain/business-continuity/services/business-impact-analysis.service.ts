import { Injectable, Logger } from '@nestjs/common';
import {
  RunBIADto,
  BiaImpactDomain,
  CriticalityLevel,
} from '../dto/business-continuity.dto';
import { ContinuityAuditService } from './continuity-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface BIADomainResult {
  domain: BiaImpactDomain;
  impactLevel: CriticalityLevel;
  score: number; // 0–100
  description: string;
}

export interface BIAReport {
  reportId: string;
  processName: string;
  outageHours: number;
  domainResults: BIADomainResult[];
  overallImpactScore: number; // 0–100
  overallCriticality: CriticalityLevel;
  estimatedFinancialLoss: number;
  beneficiariesAffected: number;
  recommendations: string[];
  generatedAt: string;
  generatedBy: string;
}

/**
 * BusinessImpactAnalysisService — P169 BCORP
 *
 * Análise de Impacto nos Negócios (BIA) classificando automaticamente
 * impactos assistenciais, operacionais, financeiros, tecnológicos,
 * jurídicos, reputacionais, regulatórios e sociais por duração de interrupção.
 */
@Injectable()
export class BusinessImpactAnalysisService {
  private readonly logger = new Logger(BusinessImpactAnalysisService.name);
  private readonly reports: Map<string, BIAReport> = new Map();

  /** Impacto acumulado por horas de interrupção por domínio */
  private readonly IMPACT_MATRIX: Record<BiaImpactDomain, (hours: number) => number> = {
    [BiaImpactDomain.ASSISTENTIAL]: (h) => Math.min(100, h * 12),   // crítico rapidamente
    [BiaImpactDomain.OPERATIONAL]: (h) => Math.min(100, h * 8),
    [BiaImpactDomain.FINANCIAL]: (h) => Math.min(100, h * 5),
    [BiaImpactDomain.TECHNOLOGICAL]: (h) => Math.min(100, h * 10),
    [BiaImpactDomain.LEGAL]: (h) => Math.min(100, h * 3),
    [BiaImpactDomain.REPUTATIONAL]: (h) => Math.min(100, h * 6),
    [BiaImpactDomain.REGULATORY]: (h) => Math.min(100, h * 4),
    [BiaImpactDomain.SOCIAL]: (h) => Math.min(100, h * 7),
  };

  constructor(
    private readonly auditSvc: ContinuityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async runBIA(dto: RunBIADto, generatedBy = 'SYSTEM'): Promise<BIAReport> {
    const reportId = `BIA-${Date.now().toString(36).toUpperCase()}`;

    const domainResults: BIADomainResult[] = Object.values(BiaImpactDomain).map((domain) => {
      const score = this.IMPACT_MATRIX[domain](dto.outageHours);
      return {
        domain,
        impactLevel: this.scoreToLevel(score),
        score,
        description: this.buildDescription(domain, score, dto.outageHours),
      };
    });

    const overallScore = Math.round(
      domainResults.reduce((s, d) => s + d.score, 0) / domainResults.length,
    );
    const overallCriticality = this.scoreToLevel(overallScore);

    // Estimativas proporcionais à duração
    const estimatedFinancialLoss = dto.outageHours * 1500; // R$ 1.500/hora de interrupção estimado
    const beneficiariesAffected = Math.min(2000, dto.outageHours * 25);

    const recommendations = this.buildRecommendations(domainResults, dto.outageHours);

    const report: BIAReport = {
      reportId,
      processName: dto.processName,
      outageHours: dto.outageHours,
      domainResults,
      overallImpactScore: overallScore,
      overallCriticality,
      estimatedFinancialLoss,
      beneficiariesAffected,
      recommendations,
      generatedAt: new Date().toISOString(),
      generatedBy,
    };

    this.reports.set(reportId, report);

    await this.auditSvc.recordAudit('BIA_COMPLETED', reportId, generatedBy, {
      processName: dto.processName,
      outageHours: dto.outageHours,
      overallScore,
      overallCriticality,
    });

    await this.eventBus.publish(
      'aura.bcorp.bia.calculated.v1',
      { reportId, processName: dto.processName, overallCriticality, overallScore },
      'BCORP',
      { subject: reportId },
    );

    this.logger.log(`[BIA] Relatório "${reportId}" — ${dto.processName} (${dto.outageHours}h): ${overallCriticality} (${overallScore}/100)`);
    return report;
  }

  getReport(reportId: string): BIAReport | undefined {
    return this.reports.get(reportId);
  }

  listReports(): BIAReport[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => b.overallImpactScore - a.overallImpactScore,
    );
  }

  private scoreToLevel(score: number): CriticalityLevel {
    if (score >= 80) return CriticalityLevel.VITAL;
    if (score >= 60) return CriticalityLevel.CRITICAL;
    if (score >= 40) return CriticalityLevel.HIGH;
    if (score >= 20) return CriticalityLevel.MEDIUM;
    return CriticalityLevel.LOW;
  }

  private buildDescription(domain: BiaImpactDomain, score: number, hours: number): string {
    const descriptions: Record<BiaImpactDomain, string> = {
      [BiaImpactDomain.ASSISTENTIAL]: `Impacto nos atendimentos após ${hours}h de interrupção — score: ${score}`,
      [BiaImpactDomain.OPERATIONAL]: `Operações internas comprometidas após ${hours}h — score: ${score}`,
      [BiaImpactDomain.FINANCIAL]: `Perdas financeiras acumuladas em ${hours}h de inatividade — score: ${score}`,
      [BiaImpactDomain.TECHNOLOGICAL]: `Degradação dos sistemas tecnológicos após ${hours}h — score: ${score}`,
      [BiaImpactDomain.LEGAL]: `Exposição jurídica por descumprimento de SLAs após ${hours}h — score: ${score}`,
      [BiaImpactDomain.REPUTATIONAL]: `Dano reputacional com stakeholders após ${hours}h — score: ${score}`,
      [BiaImpactDomain.REGULATORY]: `Risco de não-conformidade regulatória após ${hours}h — score: ${score}`,
      [BiaImpactDomain.SOCIAL]: `Impacto social sobre beneficiários após ${hours}h — score: ${score}`,
    };
    return descriptions[domain];
  }

  private buildRecommendations(results: BIADomainResult[], hours: number): string[] {
    const recs: string[] = [];
    const critical = results.filter((r) => r.impactLevel === CriticalityLevel.VITAL || r.impactLevel === CriticalityLevel.CRITICAL);
    if (critical.length > 0) {
      recs.push(`Ativar imediatamente o Plano de Continuidade para os domínios: ${critical.map((r) => r.domain).join(', ')}.`);
    }
    if (hours > 4) recs.push('Duração superior a 4h: acionar Centro de Gestão de Crises e comunicar stakeholders externos.');
    if (hours > 8) recs.push('Duração superior a 8h: considerar ativação de failover de datacenter e comunicado público.');
    if (hours > 24) recs.push('Duração superior a 24h: declarar situação de emergência institucional e acionar seguro operacional.');
    if (recs.length === 0) recs.push('Impacto dentro do tolerável. Manter monitoramento contínuo e registrar lições aprendidas.');
    return recs;
  }
}
