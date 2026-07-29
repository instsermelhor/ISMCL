import { RulesEngineService } from './rules-engine.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { TaskManagementService } from './task-management.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  RuleOperator,
  RuleAction,
  TaskPriority,
} from '../dto/workflow.dto';

describe('RulesEngineService', () => {
  let service: RulesEngineService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new RulesEngineService();
  });

  it('should have 5 default rules pre-loaded', () => {
    const rules = service.listRules();
    expect(rules.length).toBeGreaterThanOrEqual(5);
    expect(rules.every((r) => r.isActive)).toBe(true);
  });

  it('should create a custom rule without code change', async () => {
    const rule = await service.createRule(
      {
        name: 'Regra Personalizada de Teste',
        description: 'Regra de teste do SUPER_ADMIN',
        category: 'TEST',
        priority: 10,
        conditions: [{ attribute: 'test.value', operator: RuleOperator.EQUALS, value: 42 }],
        action: RuleAction.NOTIFY,
        actionParams: { message: 'Valor atingido' },
        isActive: true,
      },
      'super-admin-001',
    );

    expect(rule.ruleId).toBeDefined();
    expect(rule.version).toBe(1);
    expect(rule.createdBy).toBe('super-admin-001');
  });

  it('should evaluate rules and return correct matched action for high-risk beneficiary', async () => {
    const result = await service.evaluate({
      beneficiary: { riskScore: 85 },
    });

    expect(result.matchedRules.length).toBeGreaterThan(0);
    expect(result.dominantAction).toBeDefined();
    const riskRule = result.matchedRules.find((r) => r.ruleName.includes('Risco'));
    expect(riskRule).toBeDefined();
  });

  it('should NOT match risk rule for low-risk beneficiary', async () => {
    const result = await service.evaluate({
      beneficiary: { riskScore: 30 },
    });

    const riskRule = result.matchedRules.find((r) => r.ruleName.includes('Alto Risco'));
    expect(riskRule).toBeUndefined();
  });

  it('should record all evaluations in the audit log', async () => {
    await service.evaluate({ beneficiary: { riskScore: 90 } });
    await service.evaluate({ beneficiary: { riskScore: 20 } });
    const log = service.getAuditLog();
    expect(log.length).toBeGreaterThanOrEqual(2);
  });
});

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new WorkflowEngineService(eventBusMock as EventBusService);
  });

  it('should have 3 default BPMN 2.0 workflows pre-loaded', () => {
    const defs = service.listDefinitions();
    expect(defs.length).toBeGreaterThanOrEqual(3);
    expect(defs.some((d) => d.name.includes('Triagem'))).toBe(true);
    expect(defs.some((d) => d.name.includes('Clínico'))).toBe(true);
    expect(defs.some((d) => d.name.includes('Documental'))).toBe(true);
  });

  it('should start a workflow instance and publish WorkflowStarted event', async () => {
    const defs = service.listDefinitions();
    const triagem = defs.find((d) => d.name.includes('Triagem'))!;

    const instance = await service.start(
      { workflowId: triagem.workflowId, entityId: 'benef-001', context: { riskScore: 85 } },
      'coord-001',
    );

    expect(instance.instanceId).toBeDefined();
    expect(instance.workflowName).toContain('Triagem');
    expect(instance.status).toMatch(/RUNNING|COMPLETED/);
    expect(instance.slaDeadline).toBeDefined();
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.workflow.started.v1',
      expect.objectContaining({ workflowId: triagem.workflowId }),
      'default',
      expect.anything(),
    );
  });
});

describe('TaskManagementService', () => {
  let service: TaskManagementService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new TaskManagementService(eventBusMock as EventBusService);
  });

  it('should create a task and emit TaskCreated event', async () => {
    const task = await service.create(
      {
        title: 'Revisar Prontuário',
        description: 'Revisar prontuário do beneficiário antes da sessão.',
        priority: TaskPriority.HIGH,
        assigneeId: 'prof-001',
        dueAt: new Date(Date.now() + 86_400_000).toISOString(),
      },
      'coord-001',
    );

    expect(task.taskId).toBeDefined();
    expect(task.status).toBe('PENDING');
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.workflow.task.created.v1',
      expect.objectContaining({ taskId: task.taskId }),
      'default',
      expect.anything(),
    );
  });

  it('should detect overdue tasks and emit SLA exceeded event', async () => {
    const pastDue = new Date(Date.now() - 3_600_000).toISOString(); // 1h atrás
    await service.create(
      {
        title: 'Tarefa Vencida',
        description: 'Esta tarefa está vencida.',
        priority: TaskPriority.CRITICAL,
        assigneeId: 'prof-002',
        dueAt: pastDue,
      },
      'system',
    );

    const alerts = await service.checkSla();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].overdueHours).toBeGreaterThanOrEqual(1);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.workflow.sla.exceeded.v1',
      expect.objectContaining({ overdueHours: expect.any(Number) }),
      'default',
      expect.anything(),
    );
  });
});
