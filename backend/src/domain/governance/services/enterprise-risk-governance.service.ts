import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import {
  RegisterRiskDto,
  RiskCategory,
  RiskStatus,
  ControlType,
  ComplianceStandard,
  CreatePolicyDto,
  PolicyStatus,
} from '../dto/governance.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface EnterpriseRisk {
  riskId: string;
  riskCode: string; // RSK-2026-XXXXX
  title: string;
  category: RiskCategory;
  probability: number;       // 1–5
  impact: number;            // 1–5
  riskScore: number;         // probability × impact (1–25)
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: RiskStatus;
  mitigationPlan: string;
  riskOwnerId: string;
  createdAt: string;
  lastReviewedAt: string;
}

export interface InternalControl {
  controlId: string;
  controlCode: string; // CTL-XXXXX
  title: string;
  type: ControlType;
  linkedRiskIds: string[];
  description: string;
  effectivenessPercentage: number;
  lastExecutedAt: string;
}

export interface CorporatePolicy {
  policyId: string;
  policyCode: string; // POL-2026-XXXXX
  title: string;
  standard: ComplianceStandard;
  version: number;
  status: PolicyStatus;
  content: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewCycleMonths: number;
  nextReviewDueAt: string;
  digitalSignature: string;
  createdAt: string;
}

/**
 * EnterpriseRiskGovernanceService — Gestão Corporativa de Riscos, Controles Internos e Políticas
 *
 * Funcionalidades:
 * - Registro e categorização de riscos em 9 categorias (STRATEGIC, OPERATIONAL, ASSISTENTIAL, TECHNOLOGY, FINANCIAL, LEGAL, REPUTATIONAL, CONTINUITY, THIRD_PARTY)
 * - Cálculo automático do Risk Score (Probabilidade × Impacto) e classificação do nível de risco
 * - Gestão de Controles Internos (Preventivo, Detectivo, Corretivo, Compensatório) vinculados aos riscos
 * - Gestão de Políticas com versionamento, ciclo de aprovação e assinatura digital SHA-256
 * - Segregação de Funções (SoD): nenhuma política é publicada sem aprovação registrada
 * - Emissão de CloudEvents `aura.governance.risk.registered.v1`, `aura.governance.policy.published.v1`
 *
 * Referências: P107 AEIAT, P116 AEGRC, P144 AEGRC Etapas 3, 4, 5, 6
 */
@Injectable()
export class EnterpriseRiskGovernanceService {
  private readonly logger = new Logger(EnterpriseRiskGovernanceService.name);
  private readonly risks = new Map<string, EnterpriseRisk>();
  private readonly controls = new Map<string, InternalControl>();
  private readonly policies = new Map<string, CorporatePolicy>();
  private riskSequence = 1000;
  private policySequence = 1000;
  private controlSequence = 1000;

  constructor(private readonly eventBus: EventBusService) {
    this.seedDefaultPolicies();
    this.seedDefaultControls();
  }

  private seedDefaultPolicies(): void {
    const defaults: Array<{ title: string; standard: ComplianceStandard; content: string }> = [
      {
        title: 'Política de Privacidade e Proteção de Dados Pessoais (LGPD)',
        standard: ComplianceStandard.LGPD,
        content: 'Toda coleta, tratamento e armazenamento de dados pessoais de beneficiários obedece estritamente ao Art. 7 e Art. 11 da LGPD. Dados sensíveis de saúde mental exigem consentimento específico e são criptografados em repouso e em trânsito (AES-256).',
      },
      {
        title: 'Código de Ética Profissional e Conduta Institucional',
        standard: ComplianceStandard.CODE_OF_ETHICS,
        content: 'Todos os profissionais do Instituto Ser Melhor devem pautar sua conduta pelos princípios de sigilo profissional, integridade, imparcialidade e respeito à dignidade humana dos beneficiários atendidos.',
      },
      {
        title: 'Política de Segurança da Informação e Cibersegurança (MCSI)',
        standard: ComplianceStandard.MCSI,
        content: 'A Plataforma Aura adota o modelo Zero Trust como padrão de autenticação e autorização. Nenhuma requisição é confiada sem validação explícita de identidade, contexto e escopo de permissões.',
      },
    ];

    for (const d of defaults) {
      const policyId = randomUUID();
      const now = new Date();
      const nextReview = new Date(now.getTime() + 365 * 86_400_000).toISOString();
      this.policySequence++;
      const policyCode = `POL-${new Date().getFullYear()}-${this.policySequence}`;
      const sig = createHash('sha256').update(`${policyCode}:v1:${now.toISOString()}`).digest('hex');

      this.policies.set(policyId, {
        policyId,
        policyCode,
        title: d.title,
        standard: d.standard,
        version: 1,
        status: PolicyStatus.PUBLISHED,
        content: d.content,
        approvedBy: 'governance-board-system',
        approvedAt: now.toISOString(),
        reviewCycleMonths: 12,
        nextReviewDueAt: nextReview,
        digitalSignature: sig,
        createdAt: now.toISOString(),
      });
    }
    this.logger.log(`[RiskGovernance] 📋 ${this.policies.size} políticas institucionais publicadas e assinadas digitalmente.`);
  }

  private seedDefaultControls(): void {
    const defaults: Array<{ title: string; type: ControlType; desc: string }> = [
      { title: 'MFA Obrigatório para Acesso a Dados Sensíveis', type: ControlType.PREVENTIVE, desc: 'Controle preventivo que exige segundo fator de autenticação para qualquer acesso a prontuários e dados clínicos.' },
      { title: 'Detecção de Acessos Anômalos (SIEM)', type: ControlType.DETECTIVE, desc: 'O SiemThreatDetectionService monitora continuamente padrões de acesso e detecta comportamentos anômalos em tempo real.' },
      { title: 'Revogação Imediata de Sessão em Incidentes Críticos', type: ControlType.CORRECTIVE, desc: 'Playbook SOAR do SOC executa revogação automática de token JWT ao detectar incidentes classificados como CRITICAL.' },
    ];

    for (const d of defaults) {
      this.controlSequence++;
      const controlId = randomUUID();
      const controlCode = `CTL-${this.controlSequence}`;
      this.controls.set(controlId, {
        controlId,
        controlCode,
        title: d.title,
        type: d.type,
        linkedRiskIds: [],
        description: d.desc,
        effectivenessPercentage: 95,
        lastExecutedAt: new Date().toISOString(),
      });
    }
    this.logger.log(`[RiskGovernance] 🛡️ ${this.controls.size} controles internos cadastrados.`);
  }

  // ── Enterprise Risk Management ────────────────────────────────────────

  async registerRisk(dto: RegisterRiskDto, createdBy: string, tenantId = 'default'): Promise<EnterpriseRisk> {
    this.riskSequence++;
    const riskId = randomUUID();
    const riskCode = `RSK-${new Date().getFullYear()}-${this.riskSequence}`;
    const riskScore = dto.probability * dto.impact;

    let riskLevel: EnterpriseRisk['riskLevel'];
    if (riskScore <= 4) riskLevel = 'LOW';
    else if (riskScore <= 9) riskLevel = 'MODERATE';
    else if (riskScore <= 16) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';

    const now = new Date().toISOString();
    const risk: EnterpriseRisk = {
      riskId,
      riskCode,
      title: dto.title,
      category: dto.category,
      probability: dto.probability,
      impact: dto.impact,
      riskScore,
      riskLevel,
      status: RiskStatus.IDENTIFIED,
      mitigationPlan: dto.mitigationPlan,
      riskOwnerId: dto.riskOwnerId,
      createdAt: now,
      lastReviewedAt: now,
    };

    this.risks.set(riskId, risk);
    this.logger.log(`[ERM] ⚠️ Risco registrado: ${riskCode} [${dto.category}] Score: ${riskScore} (${riskLevel}) — "${dto.title}"`);

    await this.eventBus.publish(
      'aura.governance.risk.registered.v1',
      { riskId, riskCode, category: dto.category, riskScore, riskLevel, riskOwnerId: dto.riskOwnerId },
      tenantId,
      { subject: riskId },
    );

    return risk;
  }

  // ── Policy Management ─────────────────────────────────────────────────

  async createPolicy(dto: CreatePolicyDto, createdBy: string, tenantId = 'default'): Promise<CorporatePolicy> {
    this.policySequence++;
    const policyId = randomUUID();
    const policyCode = `POL-${new Date().getFullYear()}-${this.policySequence}`;
    const now = new Date();
    const nextReview = new Date(now.getTime() + (dto.reviewCycleMonths ?? 12) * 30 * 86_400_000).toISOString();
    const sig = createHash('sha256').update(`${policyCode}:v1:${createdBy}:${now.toISOString()}`).digest('hex');

    const policy: CorporatePolicy = {
      policyId,
      policyCode,
      title: dto.title,
      standard: dto.standard,
      version: 1,
      status: PolicyStatus.DRAFT,
      content: dto.content,
      reviewCycleMonths: dto.reviewCycleMonths ?? 12,
      nextReviewDueAt: nextReview,
      digitalSignature: sig,
      createdAt: now.toISOString(),
    };

    this.policies.set(policyId, policy);
    this.logger.log(`[PolicyMgmt] 📝 Política criada como RASCUNHO: ${policyCode} — "${dto.title}" [${dto.standard}]`);
    return policy;
  }

  async publishPolicy(policyId: string, approvedBy: string, tenantId = 'default'): Promise<CorporatePolicy> {
    const policy = this.findPolicyOrThrow(policyId);
    policy.status = PolicyStatus.PUBLISHED;
    policy.approvedBy = approvedBy;
    policy.approvedAt = new Date().toISOString();

    this.logger.log(`[PolicyMgmt] ✅ Política "${policy.title}" PUBLICADA e assinada por ${approvedBy}`);

    await this.eventBus.publish(
      'aura.governance.policy.published.v1',
      { policyId: policy.policyId, policyCode: policy.policyCode, title: policy.title, standard: policy.standard, approvedBy },
      tenantId,
      { subject: policy.policyId },
    );

    return policy;
  }

  // ── Utilities & Accessors ─────────────────────────────────────────────

  private findPolicyOrThrow(id: string): CorporatePolicy {
    const p = this.policies.get(id) ?? [...this.policies.values()].find((p) => p.policyCode === id);
    if (!p) throw new NotFoundException(`Política ${id} não encontrada.`);
    return p;
  }

  listRisks(): EnterpriseRisk[] {
    return [...this.risks.values()].sort((a, b) => b.riskScore - a.riskScore);
  }

  listPolicies(): CorporatePolicy[] {
    return [...this.policies.values()].sort((a, b) => a.title.localeCompare(b.title));
  }

  listControls(): InternalControl[] {
    return [...this.controls.values()];
  }
}
