import { Injectable, Logger } from '@nestjs/common';
import {
  CreateRuleDto,
  RuleConditionDto,
  RuleOperator,
  RuleAction,
} from '../dto/workflow.dto';
import { randomUUID } from 'crypto';

export interface BusinessRule {
  ruleId: string;
  name: string;
  description: string;
  category: string;
  priority: number;
  conditions: RuleConditionDto[];
  action: RuleAction;
  actionParams?: Record<string, unknown>;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  action?: RuleAction;
  actionParams?: Record<string, unknown>;
  evaluatedAt: string;
}

export interface DecisionResult {
  evaluationId: string;
  context: Record<string, unknown>;
  matchedRules: RuleEvaluationResult[];
  dominantAction?: RuleAction;
  dominantParams?: Record<string, unknown>;
  evaluatedAt: string;
}

/**
 * RulesEngineService — Motor Corporativo de Regras de Negócio Parametrizáveis
 *
 * Funcionalidades:
 * - Criação/versionamento de regras configuráveis pelo SUPER_ADMIN (sem alteração de código)
 * - Avaliação de condições compostas (AND) com operadores: EQUALS, GT, LT, CONTAINS, IN...
 * - Ações configuráveis: ALLOW, DENY, ROUTE, NOTIFY, CREATE_TASK, ESCALATE, etc.
 * - Prioridade de avaliação (menor número = maior prioridade)
 * - Registra toda decisão para auditoria completa
 * - Pré-carrega regras clínicas padrão da Plataforma Aura
 *
 * Princípio: "Nenhuma regra de negócio deverá permanecer fixa no código quando puder ser parametrizada."
 * Referências: P110 AEWBPM, P112 AEDIP, P139 AEWRP Etapas 3, 4
 */
@Injectable()
export class RulesEngineService {
  private readonly logger = new Logger(RulesEngineService.name);
  private readonly rules = new Map<string, BusinessRule>();
  private readonly auditLog: DecisionResult[] = [];

  constructor() {
    this.seedDefaultRules();
  }

  // ── Regras Padrão ICP-Aura ──────────────────────────────────────────────

  private seedDefaultRules(): void {
    const defaults: Array<Omit<CreateRuleDto, 'isActive'>> = [
      {
        name: 'Triagem de Alto Risco Clínico',
        description: 'Beneficiário com risco ≥70 dispara abertura automática de caso clínico com prioridade CRITICAL.',
        category: 'CLINICAL',
        priority: 1,
        conditions: [{ attribute: 'beneficiary.riskScore', operator: RuleOperator.GREATER_THAN, value: 70 }],
        action: RuleAction.SET_PRIORITY,
        actionParams: { priority: 'CRITICAL', openCase: true },
      },
      {
        name: 'Encaminhamento Psiquiátrico por CID',
        description: 'CID-10 F2x ou F3x aciona encaminhamento automático para psiquiatria.',
        category: 'CLINICAL',
        priority: 2,
        conditions: [{ attribute: 'intake.icdCode', operator: RuleOperator.CONTAINS, value: 'F' }],
        action: RuleAction.ROUTE,
        actionParams: { destination: 'PSYCHIATRY', notifyCoordinator: true },
      },
      {
        name: 'Alerta de Vulnerabilidade Social',
        description: 'Vulnerabilidade social ≥4 gera notificação ao assistente social.',
        category: 'SOCIAL',
        priority: 3,
        conditions: [{ attribute: 'beneficiary.socialVulnerabilityScore', operator: RuleOperator.GREATER_THAN, value: 4 }],
        action: RuleAction.NOTIFY,
        actionParams: { role: 'SOCIAL_WORKER', priority: 'HIGH', message: 'Beneficiário com alta vulnerabilidade social identificado.' },
      },
      {
        name: 'Escalonamento por SLA Excedido',
        description: 'Tarefa sem conclusão em 48h aciona escalonamento para coordenador.',
        category: 'ADMINISTRATIVE',
        priority: 4,
        conditions: [{ attribute: 'task.overdueHours', operator: RuleOperator.GREATER_THAN, value: 48 }],
        action: RuleAction.ESCALATE,
        actionParams: { escalateTo: 'COORDINATOR', message: 'Tarefa excedeu SLA de 48h.' },
      },
      {
        name: 'Emissão Automática de Plano Terapêutico',
        description: 'Após 3 sessões concluídas, emitir plano terapêutico automaticamente.',
        category: 'CLINICAL',
        priority: 5,
        conditions: [{ attribute: 'case.completedSessions', operator: RuleOperator.GREATER_THAN, value: 2 }],
        action: RuleAction.EMIT_DOCUMENT,
        actionParams: { documentType: 'THERAPEUTIC_PLAN', template: 'DEFAULT_THERAPEUTIC_PLAN' },
      },
    ];

    for (const d of defaults) {
      const ruleId = randomUUID();
      const now = new Date().toISOString();
      this.rules.set(ruleId, {
        ruleId,
        ...d,
        isActive: true,
        version: 1,
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      });
    }

    this.logger.log(`[RulesEngine] ${this.rules.size} regras padrão carregadas (parametrizáveis pelo SUPER_ADMIN).`);
  }

  // ── CRUD de Regras ─────────────────────────────────────────────────────

  async createRule(dto: CreateRuleDto, createdBy: string): Promise<BusinessRule> {
    const ruleId = randomUUID();
    const now = new Date().toISOString();
    const rule: BusinessRule = {
      ruleId,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      conditions: dto.conditions,
      action: dto.action,
      actionParams: dto.actionParams,
      isActive: dto.isActive ?? true,
      version: 1,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.rules.set(ruleId, rule);
    this.logger.log(`[RulesEngine] ✅ Regra criada: "${dto.name}" (${dto.category}) por ${createdBy}`);
    return rule;
  }

  listRules(): BusinessRule[] {
    return [...this.rules.values()].sort((a, b) => a.priority - b.priority);
  }

  // ── Avaliação de Regras ────────────────────────────────────────────────

  /**
   * Avalia todas as regras ativas contra o contexto fornecido.
   * Retorna a decisão dominante (regra de maior prioridade que fez match).
   */
  async evaluate(context: Record<string, unknown>): Promise<DecisionResult> {
    const evaluationId = randomUUID();
    const evaluatedAt = new Date().toISOString();
    const matchedRules: RuleEvaluationResult[] = [];

    const activeRules = [...this.rules.values()]
      .filter((r) => r.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of activeRules) {
      const matched = this.evaluateConditions(rule.conditions, context);
      if (matched) {
        matchedRules.push({
          ruleId: rule.ruleId,
          ruleName: rule.name,
          matched: true,
          action: rule.action,
          actionParams: rule.actionParams,
          evaluatedAt,
        });
        this.logger.log(`[RulesEngine] 🎯 Regra "${rule.name}" (P${rule.priority}) MATCHED — Ação: ${rule.action}`);
      }
    }

    const dominant = matchedRules[0]; // Maior prioridade (menor índice)
    const result: DecisionResult = {
      evaluationId,
      context,
      matchedRules,
      dominantAction: dominant?.action,
      dominantParams: dominant?.actionParams,
      evaluatedAt,
    };

    this.auditLog.push(result);
    return result;
  }

  private evaluateConditions(conditions: RuleConditionDto[], context: Record<string, unknown>): boolean {
    return conditions.every((cond) => {
      const actual = this.getNestedValue(context, cond.attribute);
      return this.compare(actual, cond.operator, cond.value);
    });
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
      return undefined;
    }, obj);
  }

  private compare(actual: unknown, operator: RuleOperator, expected: unknown): boolean {
    switch (operator) {
      case RuleOperator.EQUALS: return actual === expected;
      case RuleOperator.NOT_EQUALS: return actual !== expected;
      case RuleOperator.GREATER_THAN: return Number(actual) > Number(expected);
      case RuleOperator.LESS_THAN: return Number(actual) < Number(expected);
      case RuleOperator.CONTAINS:
        return typeof actual === 'string' && actual.includes(String(expected));
      case RuleOperator.IN:
        return Array.isArray(expected) && expected.includes(actual);
      case RuleOperator.NOT_IN:
        return Array.isArray(expected) && !expected.includes(actual);
      case RuleOperator.IS_EMPTY:
        return actual === null || actual === undefined || actual === '';
      default: return false;
    }
  }

  getAuditLog(): DecisionResult[] {
    return [...this.auditLog].reverse();
  }
}
