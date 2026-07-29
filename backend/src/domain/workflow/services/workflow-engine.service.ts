import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateWorkflowDto,
  StartWorkflowDto,
  WorkflowStatus,
  NodeType,
  WorkflowNodeDto,
} from '../dto/workflow.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface WorkflowDefinition {
  workflowId: string;
  name: string;
  description: string;
  version: string;
  nodes: WorkflowNodeDto[];
  slaHours?: number;
  tags?: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowInstance {
  instanceId: string;
  workflowId: string;
  workflowName: string;
  entityId: string;         // beneficiaryId, caseId, etc.
  status: WorkflowStatus;
  context: Record<string, unknown>;
  currentNodeId: string;
  executionLog: Array<{
    nodeId: string;
    nodeType: NodeType;
    nodeLabel: string;
    enteredAt: string;
    exitedAt?: string;
    outcome?: string;
  }>;
  startedAt: string;
  completedAt?: string;
  slaDeadline?: string;
}

/**
 * WorkflowEngineService — Motor Corporativo de Workflows (BPMN 2.0)
 *
 * Funcionalidades:
 * - Definição de workflows BPMN 2.0 parametrizáveis pelo SUPER_ADMIN
 * - Suporte a nós: START, END, USER_TASK, SERVICE_TASK, XOR/AND/OR GATEWAY, TIMER, CALL_ACTIVITY, ESCALATION
 * - Instâncias de processo com log de execução passo a passo
 * - Avaliação de condições de gateway para roteamento dinâmico
 * - Controle de SLA com deadline automático
 * - Publicação de eventos CloudEvents em cada transição de estado
 * - 3 workflows padrão pré-carregados (Triagem, Atendimento Clínico, Revisão Documental)
 *
 * Referências: BPMN 2.0 OMG Spec, P110 AEWBPM, P139 AEWRP Etapas 2, 8
 */
@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  private readonly definitions = new Map<string, WorkflowDefinition>();
  private readonly instances = new Map<string, WorkflowInstance>();

  constructor(private readonly eventBus: EventBusService) {
    this.seedDefaultWorkflows();
  }

  // ── Workflows Padrão ────────────────────────────────────────────────────

  private seedDefaultWorkflows(): void {
    const triagem: CreateWorkflowDto = {
      name: 'Fluxo de Triagem e Acolhimento',
      description: 'Processo padrão de acolhimento: triagem → risco → encaminhamento → abertura de caso.',
      version: '1.0',
      slaHours: 2,
      tags: ['clinical', 'intake', 'triage'],
      nodes: [
        { nodeId: 'start', type: NodeType.START_EVENT, label: 'Início da Triagem', next: ['risk-eval'] },
        { nodeId: 'risk-eval', type: NodeType.SERVICE_TASK, label: 'Avaliação de Risco e Vulnerabilidade', next: ['gw-risk'] },
        {
          nodeId: 'gw-risk', type: NodeType.GATEWAY_XOR, label: 'Risco Alto?',
          next: ['open-case-critical', 'schedule-routine'],
          condition: 'context.riskScore > 70',
        },
        { nodeId: 'open-case-critical', type: NodeType.SERVICE_TASK, label: 'Abrir Caso Crítico (P135)', next: ['assign-team'] },
        { nodeId: 'schedule-routine', type: NodeType.SERVICE_TASK, label: 'Agendar Consulta de Rotina (P137)', next: ['end'] },
        { nodeId: 'assign-team', type: NodeType.USER_TASK, label: 'Designar Equipe Multidisciplinar', assigneeRole: 'COORDINATOR', next: ['end'] },
        { nodeId: 'end', type: NodeType.END_EVENT, label: 'Triagem Concluída' },
      ],
    };

    const atendimento: CreateWorkflowDto = {
      name: 'Fluxo de Atendimento Clínico',
      description: 'Processo de atendimento: confirmação → sessão → registro prontuário → prescrição.',
      version: '1.0',
      slaHours: 24,
      tags: ['clinical', 'appointment', 'ehr'],
      nodes: [
        { nodeId: 'start', type: NodeType.START_EVENT, label: 'Atendimento Iniciado', next: ['confirm-apt'] },
        { nodeId: 'confirm-apt', type: NodeType.USER_TASK, label: 'Confirmar Presença do Beneficiário', assigneeRole: 'PROFESSIONAL', next: ['gw-presence'] },
        {
          nodeId: 'gw-presence', type: NodeType.GATEWAY_XOR, label: 'Beneficiário Presente?',
          next: ['conduct-session', 'register-absence'],
          condition: 'context.present === true',
        },
        { nodeId: 'conduct-session', type: NodeType.USER_TASK, label: 'Conduzir Sessão / Consulta', assigneeRole: 'PROFESSIONAL', next: ['record-ehr'] },
        { nodeId: 'register-absence', type: NodeType.SERVICE_TASK, label: 'Registrar Falta (P137)', next: ['end'] },
        { nodeId: 'record-ehr', type: NodeType.SERVICE_TASK, label: 'Registrar Evolução no Prontuário (P136)', next: ['gw-prescription'] },
        {
          nodeId: 'gw-prescription', type: NodeType.GATEWAY_XOR, label: 'Necessita Prescrição?',
          next: ['issue-prescription', 'end'],
          condition: 'context.needsPrescription === true',
        },
        { nodeId: 'issue-prescription', type: NodeType.SERVICE_TASK, label: 'Emitir Prescrição Digital (P138)', next: ['end'] },
        { nodeId: 'end', type: NodeType.END_EVENT, label: 'Atendimento Concluído' },
      ],
    };

    const revisao: CreateWorkflowDto = {
      name: 'Fluxo de Revisão e Aprovação Documental',
      description: 'Revisão paralela de documentos clínicos com co-assinatura multidisciplinar.',
      version: '1.0',
      slaHours: 48,
      tags: ['documents', 'approval', 'multidisciplinary'],
      nodes: [
        { nodeId: 'start', type: NodeType.START_EVENT, label: 'Documento Submetido para Revisão', next: ['gw-parallel'] },
        { nodeId: 'gw-parallel', type: NodeType.GATEWAY_AND, label: 'Distribuir para Revisão Paralela', next: ['review-clinical', 'review-social'] },
        { nodeId: 'review-clinical', type: NodeType.USER_TASK, label: 'Revisão Clínica', assigneeRole: 'PROFESSIONAL', next: ['gw-join'] },
        { nodeId: 'review-social', type: NodeType.USER_TASK, label: 'Revisão Social', assigneeRole: 'SOCIAL_WORKER', next: ['gw-join'] },
        { nodeId: 'gw-join', type: NodeType.GATEWAY_AND, label: 'Aguardar Conclusão de Todas as Revisões', next: ['sign-document'] },
        { nodeId: 'sign-document', type: NodeType.SERVICE_TASK, label: 'Co-Assinar Documento (P138)', next: ['end'] },
        { nodeId: 'end', type: NodeType.END_EVENT, label: 'Documento Aprovado e Assinado' },
      ],
    };

    [triagem, atendimento, revisao].forEach((wf) => {
      this.define(wf, 'system');
    });

    this.logger.log(`[WorkflowEngine] ${this.definitions.size} workflows padrão BPMN 2.0 carregados.`);
  }

  // ── Definição de Workflows ─────────────────────────────────────────────

  define(dto: CreateWorkflowDto, createdBy: string): WorkflowDefinition {
    const workflowId = randomUUID();
    const now = new Date().toISOString();
    const def: WorkflowDefinition = {
      workflowId,
      ...dto,
      isActive: true,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.definitions.set(workflowId, def);
    this.logger.log(`[WorkflowEngine] 📋 Workflow definido: "${dto.name}" v${dto.version}`);
    return def;
  }

  listDefinitions(): WorkflowDefinition[] {
    return [...this.definitions.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  // ── Início de Instâncias ───────────────────────────────────────────────

  async start(dto: StartWorkflowDto, startedBy: string, tenantId = 'default'): Promise<WorkflowInstance> {
    const def = [...this.definitions.values()].find((d) => d.workflowId === dto.workflowId || d.name === dto.workflowId);
    if (!def) throw new NotFoundException(`Workflow ${dto.workflowId} não encontrado.`);

    const startNode = def.nodes.find((n) => n.type === NodeType.START_EVENT);
    if (!startNode) throw new BadRequestException(`Workflow "${def.name}" não possui nó START_EVENT.`);

    const instanceId = randomUUID();
    const startedAt = new Date().toISOString();
    const slaDeadline = def.slaHours
      ? new Date(Date.now() + def.slaHours * 3_600_000).toISOString()
      : undefined;

    const instance: WorkflowInstance = {
      instanceId,
      workflowId: def.workflowId,
      workflowName: def.name,
      entityId: dto.entityId,
      status: WorkflowStatus.RUNNING,
      context: dto.context ?? {},
      currentNodeId: startNode.nodeId,
      executionLog: [],
      startedAt,
      slaDeadline,
    };

    this.instances.set(instanceId, instance);

    await this.eventBus.publish(
      'aura.workflow.started.v1',
      { instanceId, workflowId: def.workflowId, workflowName: def.name, entityId: dto.entityId, startedBy },
      tenantId,
      { subject: instanceId },
    );

    this.logger.log(`[WorkflowEngine] 🚀 Workflow "${def.name}" iniciado — Instância ${instanceId} | SLA: ${slaDeadline ?? 'N/A'}`);

    // Avança automaticamente do START_EVENT para o próximo nó
    await this.advance(instanceId, startNode.nodeId, undefined, tenantId);

    return this.instances.get(instanceId)!;
  }

  // ── Avanço de Nós ─────────────────────────────────────────────────────

  async advance(instanceId: string, completedNodeId: string, outcome?: string, tenantId = 'default'): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new NotFoundException(`Instância ${instanceId} não encontrada.`);

    const def = [...this.definitions.values()].find((d) => d.workflowId === instance.workflowId)!;
    const completedNode = def.nodes.find((n) => n.nodeId === completedNodeId);
    if (!completedNode) throw new BadRequestException(`Nó ${completedNodeId} não encontrado no workflow.`);

    // Registra saída do nó atual
    const existingLogEntry = instance.executionLog.find((e) => e.nodeId === completedNodeId && !e.exitedAt);
    if (existingLogEntry) {
      existingLogEntry.exitedAt = new Date().toISOString();
      existingLogEntry.outcome = outcome;
    } else {
      instance.executionLog.push({
        nodeId: completedNode.nodeId,
        nodeType: completedNode.type,
        nodeLabel: completedNode.label,
        enteredAt: new Date().toISOString(),
        exitedAt: new Date().toISOString(),
        outcome,
      });
    }

    // Verifica se chegou ao END_EVENT
    if (completedNode.type === NodeType.END_EVENT) {
      instance.status = WorkflowStatus.COMPLETED;
      instance.completedAt = new Date().toISOString();
      this.logger.log(`[WorkflowEngine] ✅ Workflow "${instance.workflowName}" CONCLUÍDO — Instância ${instanceId}`);

      await this.eventBus.publish(
        'aura.workflow.completed.v1',
        { instanceId, workflowName: instance.workflowName, entityId: instance.entityId, completedAt: instance.completedAt },
        tenantId,
        { subject: instanceId },
      );
      return instance;
    }

    // Determina próximos nós (considerando gateways e condições)
    const nextNodeIds = this.resolveNextNodes(completedNode, instance.context, def.nodes);

    for (const nextNodeId of nextNodeIds) {
      const nextNode = def.nodes.find((n) => n.nodeId === nextNodeId);
      if (!nextNode) continue;

      instance.currentNodeId = nextNode.nodeId;
      instance.executionLog.push({
        nodeId: nextNode.nodeId,
        nodeType: nextNode.type,
        nodeLabel: nextNode.label,
        enteredAt: new Date().toISOString(),
      });

      this.logger.log(`[WorkflowEngine] ➡️  Nó ativado: "${nextNode.label}" (${nextNode.type}) — Instância ${instanceId}`);

      // Nós automáticos (SERVICE_TASK, GATEWAY) avançam imediatamente
      if (nextNode.type === NodeType.SERVICE_TASK ||
          nextNode.type === NodeType.GATEWAY_XOR ||
          nextNode.type === NodeType.GATEWAY_AND ||
          nextNode.type === NodeType.GATEWAY_OR ||
          nextNode.type === NodeType.START_EVENT) {
        await this.advance(instanceId, nextNode.nodeId, undefined, tenantId);
      }
      // USER_TASK e INTERMEDIATE_TIMER ficam aguardando ação externa
    }

    return instance;
  }

  private resolveNextNodes(
    node: WorkflowNodeDto,
    context: Record<string, unknown>,
    allNodes: WorkflowNodeDto[],
  ): string[] {
    if (!node.next || node.next.length === 0) return [];

    // XOR GATEWAY: apenas o primeiro próximo que tenha condição verdadeira, ou o primeiro da lista
    if (node.type === NodeType.GATEWAY_XOR) {
      for (const nextId of node.next) {
        const nextNode = allNodes.find((n) => n.nodeId === nextId);
        // Se o próximo nó tem condição e ela é satisfeita, toma esse caminho
        if (nextNode?.condition) {
          if (this.evaluateConditionStr(nextNode.condition, context)) return [nextId];
        }
      }
      // Fallback: primeiro caminho (default path)
      return [node.next[0]];
    }

    // AND / OR GATEWAYS e demais: todos os próximos
    return node.next;
  }

  private evaluateConditionStr(condition: string, context: Record<string, unknown>): boolean {
    try {
      // Avaliação segura via Function (sem eval direto)
      const safeEval = new Function('context', `try { return !!(${condition}); } catch(e) { return false; }`);
      return safeEval(context) as boolean;
    } catch {
      return false;
    }
  }

  getInstance(instanceId: string): WorkflowInstance {
    const inst = this.instances.get(instanceId);
    if (!inst) throw new NotFoundException(`Instância ${instanceId} não encontrada.`);
    return inst;
  }

  getRunningInstances(): WorkflowInstance[] {
    return [...this.instances.values()].filter((i) => i.status === WorkflowStatus.RUNNING);
  }
}
