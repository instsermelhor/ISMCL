import { EnterpriseRiskGovernanceService } from './enterprise-risk-governance.service';
import { StrategicPlanningGrcService } from './strategic-planning-grc.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  RiskCategory,
  RiskStatus,
  ComplianceStandard,
  PolicyStatus,
  OkrStatus,
} from '../dto/governance.dto';

describe('EnterpriseRiskGovernanceService', () => {
  let service: EnterpriseRiskGovernanceService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new EnterpriseRiskGovernanceService(eventBusMock as EventBusService);
  });

  it('should have pre-seeded published institutional policies', () => {
    const policies = service.listPolicies();
    expect(policies.length).toBeGreaterThanOrEqual(3);
    const lgpdPolicy = policies.find((p) => p.standard === ComplianceStandard.LGPD);
    expect(lgpdPolicy).toBeDefined();
    expect(lgpdPolicy?.status).toBe(PolicyStatus.PUBLISHED);
    expect(lgpdPolicy?.digitalSignature).toHaveLength(64); // SHA-256 hex
  });

  it('should register a CRITICAL risk with automatic score calculation', async () => {
    const risk = await service.registerRisk({
      title: 'Vazamento de Dados de Prontuários de Beneficiários',
      category: RiskCategory.TECHNOLOGY,
      probability: 4,
      impact: 5,
      mitigationPlan: 'Implementar criptografia AES-256 e monitoramento SIEM de acesso massivo.',
      riskOwnerId: 'user-ciso-001',
    }, 'user-admin-001');

    expect(risk.riskCode).toMatch(/^RSK-\d{4}-\d{4,5}$/);
    expect(risk.riskScore).toBe(20);           // 4 × 5
    expect(risk.riskLevel).toBe('CRITICAL');   // > 16
    expect(risk.status).toBe(RiskStatus.IDENTIFIED);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.governance.risk.registered.v1',
      expect.objectContaining({ riskLevel: 'CRITICAL', riskScore: 20 }),
      'default',
      expect.anything(),
    );
  });

  it('should create a DRAFT policy and publish it with SoD approval', async () => {
    const policy = await service.createPolicy({
      title: 'Política de Gestão de Acesso Privilegiado',
      standard: ComplianceStandard.MCSI,
      content: 'Controle de acesso privilegiado baseado em Least Privilege e Zero Trust.',
    }, 'user-admin-001');

    expect(policy.status).toBe(PolicyStatus.DRAFT);
    expect(policy.approvedBy).toBeUndefined();

    const published = await service.publishPolicy(policy.policyId, 'user-super-admin-001');
    expect(published.status).toBe(PolicyStatus.PUBLISHED);
    expect(published.approvedBy).toBe('user-super-admin-001');
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.governance.policy.published.v1',
      expect.objectContaining({ standard: ComplianceStandard.MCSI }),
      'default',
      expect.anything(),
    );
  });

  it('should list pre-seeded internal controls', () => {
    const controls = service.listControls();
    expect(controls.length).toBeGreaterThanOrEqual(3);
    const preventive = controls.find((c) => c.type === 'PREVENTIVE');
    expect(preventive).toBeDefined();
  });
});

describe('StrategicPlanningGrcService', () => {
  let service: StrategicPlanningGrcService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new StrategicPlanningGrcService(eventBusMock as EventBusService);
  });

  it('should register an OKR with key results and publish event', async () => {
    const okr = await service.registerOkr({
      objective: 'Atingir 90% de satisfação dos beneficiários com os atendimentos',
      keyResults: [
        'NPS >= 70 no trimestre',
        'Taxa de retorno >= 85%',
        'Tempo médio de espera <= 7 dias',
      ],
      cycle: '2026-Q3',
      ownerId: 'user-coordinator-001',
    });

    expect(okr.okrCode).toContain('OKR-2026-Q3');
    expect(okr.keyResults.length).toBe(3);
    expect(okr.overallStatus).toBe(OkrStatus.ON_TRACK);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.governance.okr.registered.v1',
      expect.objectContaining({ objective: expect.stringContaining('satisfação') }),
      'default',
      expect.anything(),
    );
  });

  it('should record committee decision with digital signature and workflow task', async () => {
    const decision = await service.recordCommitteeDecision({
      committeeName: 'Comitê de Segurança e Privacidade',
      agenda: 'Revisão do Plano de Resposta a Incidentes LGPD 2026',
      decision: 'Aprovado o Plano de Resposta a Incidentes com revisão semestral.',
      actionPlan: 'Comunicar equipes e atualizar procedimentos operacionais em 30 dias.',
    }, 'user-super-admin-001');

    expect(decision.decisionCode).toMatch(/^DEC-\d{4}-\d{4,5}$/);
    expect(decision.digitalSignature).toHaveLength(64); // SHA-256
    expect(decision.workflowTaskId).toBeDefined();
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.governance.committee.decision.v1',
      expect.objectContaining({ committeeName: 'Comitê de Segurança e Privacidade' }),
      'default',
      expect.anything(),
    );
  });
});
