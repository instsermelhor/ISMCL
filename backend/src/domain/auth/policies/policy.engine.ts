import { Injectable, Logger } from '@nestjs/common';
import { AuraRole } from '../../../shared/decorators/roles.decorator';

export interface EvaluationSubject {
  id: string;
  tenantId: string;
  roles: AuraRole[];
  permissions: string[];
  department?: string;
  clearanceLevel?: number;
}

export interface EvaluationResource {
  id: string;
  type: string;
  tenantId: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'HIGHLY_SENSITIVE';
  ownerId?: string;
}

export interface AccessContext {
  ipAddress: string;
  userAgent: string;
  isTrustedDevice: boolean;
  requestTime: Date;
  riskScore: number; // 0 (sem risco) a 100 (risco crítico)
  mfaVerified: boolean;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  riskScore: number;
  evaluatedAt: string;
  requiredMfa: boolean;
}

/**
 * PolicyEngine — Motor Centralizado de Avaliação de Políticas Zero Trust
 *
 * Combina RBAC, ABAC e PBAC (Policy-Based Access Control) em um único ponto.
 * Avalia:
 * 1. Pertencimento ao mesmo Tenant (Isolamento de Dados Multi-tenant)
 * 2. Hierarquia de Roles e Lista de Permissões (RBAC/ABAC)
 * 3. Classificação de Sensibilidade da Informação (Need-to-Know)
 * 4. Contexto de Acesso: Risco da Sessão, Dispositivo Confiável, MFA Ativo (Zero Trust)
 *
 * Referências: P107 (AEIATP), P128 (AECS), P132 (AIFI Etapa 5)
 */
@Injectable()
export class PolicyEngine {
  private readonly logger = new Logger(PolicyEngine.name);

  /**
   * Avalia a solicitação de acesso e retorna uma decisão auditável.
   */
  evaluate(
    subject: EvaluationSubject,
    resource: EvaluationResource,
    action: string,
    context: AccessContext,
  ): PolicyDecision {
    const evaluatedAt = new Date().toISOString();

    // 1. Regra Absoluta: Multi-tenant Isolation
    if (subject.tenantId !== resource.tenantId && !subject.roles.includes(AuraRole.SUPER_ADMIN)) {
      this.logger.warn(
        `[PolicyEngine] DENY: Tenant mismatch. Subject Tenant: ${subject.tenantId}, Resource Tenant: ${resource.tenantId}`,
      );
      return {
        allowed: false,
        reason: 'Acesso negado: Isolamento de organização/tenant violado.',
        riskScore: 100,
        evaluatedAt,
        requiredMfa: true,
      };
    }

    // 2. Pontuação de Risco da Sessão
    let calculatedRisk = context.riskScore;
    if (!context.isTrustedDevice) calculatedRisk += 25;
    if (!context.mfaVerified) calculatedRisk += 30;

    // 3. Regra de Recursos Altamente Sensíveis (Prontuário Médico, Dados Financeiros, LGPD Art. 5 II)
    const isSensitiveResource =
      resource.classification === 'RESTRICTED' ||
      resource.classification === 'HIGHLY_SENSITIVE';

    if (isSensitiveResource && !context.mfaVerified) {
      return {
        allowed: false,
        reason: 'Acesso negado: Recurso altamente sensível exige autenticação MFA obrigatória.',
        riskScore: calculatedRisk,
        evaluatedAt,
        requiredMfa: true,
      };
    }

    // 4. Bloqueio por Risco Excessivo (Anomalia/Ataque)
    if (calculatedRisk >= 80) {
      this.logger.warn(
        `[PolicyEngine] DENY: Excessive session risk (${calculatedRisk}) for user ${subject.id}`,
      );
      return {
        allowed: false,
        reason: 'Acesso bloqueado por mecanismo adaptativo de proteção Zero Trust (alto risco).',
        riskScore: calculatedRisk,
        evaluatedAt,
        requiredMfa: true,
      };
    }

    // 5. Avaliação de Permissões Explicitadas (ABAC)
    const requiredPermission = `${resource.type}:${action.toLowerCase()}`;
    const hasExplicitPermission =
      subject.permissions.includes(requiredPermission) ||
      subject.permissions.includes('*') ||
      subject.permissions.includes(`${resource.type}:*`);

    // 6. Avaliação por Role (SUPER_ADMIN / ADMIN)
    const isMasterAdmin =
      subject.roles.includes(AuraRole.SUPER_ADMIN) ||
      subject.roles.includes(AuraRole.ADMIN);

    // 7. Próprio Dono do Recurso (Self Access)
    const isResourceOwner = resource.ownerId === subject.id;

    if (isMasterAdmin || hasExplicitPermission || isResourceOwner) {
      return {
        allowed: true,
        reason: 'Acesso concedido em conformidade com as políticas de autorização.',
        riskScore: calculatedRisk,
        evaluatedAt,
        requiredMfa: isSensitiveResource && !context.mfaVerified,
      };
    }

    this.logger.warn(
      `[PolicyEngine] DENY: Insufficient permissions for user ${subject.id} on ${requiredPermission}`,
    );

    return {
      allowed: false,
      reason: `Acesso negado. Permissão necessária: ${requiredPermission}.`,
      riskScore: calculatedRisk,
      evaluatedAt,
      requiredMfa: false,
    };
  }
}
