import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { ContinuityAuditService } from './continuity-audit.service';
import { BusinessContinuityService } from './business-continuity.service';
import { BusinessImpactAnalysisService } from './business-impact-analysis.service';
import { IncidentResponseService } from './incident-response.service';
import { DisasterRecoveryService } from './disaster-recovery.service';
import { CrisisManagementService } from './crisis-management.service';
import { EmergencyCommunicationService } from './emergency-communication.service';
import { RecoveryOrchestrationService } from './recovery-orchestration.service';
import { OperationalResilienceService } from './operational-resilience.service';
import { CrisisDashboardService } from './crisis-dashboard.service';

import {
  CriticalityLevel,
  IncidentSeverity,
  IncidentStatus,
  IncidentCategory,
  CommunicationChannel,
} from '../dto/business-continuity.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

describe('P169 BCORP — Business Continuity, Crisis Management & Operational Resilience', () => {
  let auditSvc: ContinuityAuditService;
  let bcpSvc: BusinessContinuityService;
  let biaSvc: BusinessImpactAnalysisService;
  let incidentSvc: IncidentResponseService;
  let drSvc: DisasterRecoveryService;
  let crisisSvc: CrisisManagementService;
  let commSvc: EmergencyCommunicationService;
  let orchSvc: RecoveryOrchestrationService;
  let resilienceSvc: OperationalResilienceService;
  let dashboardSvc: CrisisDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContinuityAuditService,
        BusinessContinuityService,
        BusinessImpactAnalysisService,
        IncidentResponseService,
        DisasterRecoveryService,
        CrisisManagementService,
        EmergencyCommunicationService,
        RecoveryOrchestrationService,
        OperationalResilienceService,
        CrisisDashboardService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get(ContinuityAuditService);
    bcpSvc = module.get(BusinessContinuityService);
    biaSvc = module.get(BusinessImpactAnalysisService);
    incidentSvc = module.get(IncidentResponseService);
    drSvc = module.get(DisasterRecoveryService);
    crisisSvc = module.get(CrisisManagementService);
    commSvc = module.get(EmergencyCommunicationService);
    orchSvc = module.get(RecoveryOrchestrationService);
    resilienceSvc = module.get(OperationalResilienceService);
    dashboardSvc = module.get(CrisisDashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── ContinuityAuditService ────────────────────────────────────────────────
  describe('ContinuityAuditService', () => {
    it('deve registrar entrada de auditoria com SHA-256 válido', async () => {
      const entry = await auditSvc.recordAudit('BCP_TEST', 'PROC-01', 'CISO', { key: 'val' });
      expect(entry.auditId).toMatch(/^BCORP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
    });

    it('deve filtrar trilha por assunto', async () => {
      await auditSvc.recordAudit('ACTION_A', 'subj-1', 'USER');
      await auditSvc.recordAudit('ACTION_B', 'subj-2', 'USER');
      const trail = auditSvc.getAuditTrail('subj-1');
      expect(trail.every((t) => t.subject === 'subj-1')).toBe(true);
    });
  });

  // ── BusinessContinuityService ─────────────────────────────────────────────
  describe('BusinessContinuityService', () => {
    it('deve registrar processo crítico no BCP mestre', async () => {
      const proc = await bcpSvc.registerCriticalProcess({
        name: 'Triagem de Crise Psicossocial',
        criticality: CriticalityLevel.VITAL,
        rtoHours: 2,
        rpoHours: 1,
        owner: 'Diretora Assistencial',
      });
      expect(proc.processId).toMatch(/^PROC-VITAL-/);
      expect(proc.rtoHours).toBe(2);
    });

    it('deve ativar o plano de continuidade', async () => {
      const plan = await bcpSvc.activatePlan('BCP-ISM-MASTER', 'CISO', 'Ataque cibernético em andamento');
      expect(plan.status).toBe('ACTIVATED');
      expect(plan.activatedBy).toBe('CISO');
    });

    it('deve listar processos que excederam o RTO', async () => {
      await bcpSvc.registerCriticalProcess({
        name: 'Proc Rápido',
        criticality: CriticalityLevel.CRITICAL,
        rtoHours: 1,
        rpoHours: 1,
        owner: 'Leader',
      });
      const exceeded = bcpSvc.getProcessesExceedingRTO(3);
      expect(exceeded.length).toBeGreaterThan(0);
    });
  });

  // ── BusinessImpactAnalysisService ──────────────────────────────────────────
  describe('BusinessImpactAnalysisService', () => {
    it('deve executar BIA e classificar impacto em 8 domínios', async () => {
      const report = await biaSvc.runBIA({
        processName: 'Atendimento presencial',
        outageHours: 12,
      });
      expect(report.reportId).toMatch(/^BIA-/);
      expect(report.domainResults).toHaveLength(8);
      expect(report.overallImpactScore).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ── IncidentResponseService ────────────────────────────────────────────────
  describe('IncidentResponseService', () => {
    it('deve criar incidente P1 e emitir log de emergência', async () => {
      const inc = await incidentSvc.createIncident({
        title: 'Ransomware em DB principal',
        category: IncidentCategory.CYBERSECURITY,
        severity: IncidentSeverity.P1_CRITICAL,
        description: 'Servidores criptografados',
      });
      expect(inc.incidentId).toMatch(/^INC-P1_CRITICAL-/);
      expect(inc.status).toBe(IncidentStatus.DETECTED);
      expect(inc.timeline).toHaveLength(1);
    });

    it('deve avançar status do incidente no ciclo NIST', async () => {
      const inc = await incidentSvc.createIncident({
        title: 'Falha de link',
        category: IncidentCategory.INFRASTRUCTURE,
        severity: IncidentSeverity.P2_HIGH,
        description: 'Link secundário fora',
      });
      const updated = await incidentSvc.advanceStatus(inc.incidentId, IncidentStatus.CONTAINED, 'Link isolado', 'SOC');
      expect(updated.status).toBe(IncidentStatus.CONTAINED);
      expect(updated.containedAt).toBeDefined();
    });
  });

  // ── DisasterRecoveryService ────────────────────────────────────────────────
  describe('DisasterRecoveryService', () => {
    it('deve iniciar recuperação e avançar passos', async () => {
      const dr = await drSvc.initiateRecovery({
        incidentId: 'INC-001',
        scenarioDescription: 'Restauração completa de backup',
      });
      expect(dr.recoveryId).toMatch(/^DR-/);
      expect(dr.steps).toHaveLength(9);

      const step1 = await drSvc.advanceStep(dr.recoveryId, 'ASSESS_DAMAGE', 'DONE', 'DR_TEAM');
      expect(step1.steps.find((s) => s.step === 'ASSESS_DAMAGE')?.status).toBe('DONE');
    });

    it('deve validar integridade e concluir DR com medição de RTO', async () => {
      const dr = await drSvc.initiateRecovery({
        incidentId: 'INC-002',
        scenarioDescription: 'Teste DR',
      });
      await drSvc.validateIntegrity(dr.recoveryId, 'CISO');
      const completed = await drSvc.completeRecovery(dr.recoveryId, 'CTO');
      expect(completed.status).toBe('COMPLETED');
      expect(completed.actualRto).toBeDefined();
    });
  });

  // ── CrisisManagementService ────────────────────────────────────────────────
  describe('CrisisManagementService', () => {
    it('deve declarar crise e registrar decisão com aprovação', async () => {
      const crisis = await crisisSvc.declareCrisis({
        title: 'Crise de vazamento de dados',
        severity: IncidentSeverity.P1_CRITICAL,
        linkedIncidentId: 'INC-003',
      });
      expect(crisis.crisisId).toMatch(/^CRISIS-/);

      const dec = await crisisSvc.recordDecision(crisis.crisisId, 'Isolar redes sociais', 'CISO');
      expect(dec.status).toBe('PENDING_APPROVAL');

      const approved = await crisisSvc.approveDecision(crisis.crisisId, dec.decisionId, 'CEO');
      expect(approved.status).toBe('APPROVED');
    });
  });

  // ── EmergencyCommunicationService ─────────────────────────────────────────
  describe('EmergencyCommunicationService', () => {
    it('deve disparar notificação multicanal e registrar confirmação', async () => {
      const notif = await commSvc.sendNotification({
        crisisId: 'CRISIS-001',
        message: 'Alerta de emergência',
        channels: [CommunicationChannel.EMAIL, CommunicationChannel.SMS],
      });
      expect(notif.notificationId).toMatch(/^EMRG-/);

      await commSvc.recordConfirmation(notif.notificationId, 'CEO', CommunicationChannel.EMAIL);
      const updated = commSvc.getNotification(notif.notificationId);
      expect(updated?.confirmations).toHaveLength(1);
    });
  });

  // ── RecoveryOrchestrationService ──────────────────────────────────────────
  describe('RecoveryOrchestrationService', () => {
    it('deve orquestrar passos e respeitar aprovação humana', async () => {
      const orch = await orchSvc.startOrchestratedRecovery('BCP-001', 'INC-001');
      expect(orch.executionId).toMatch(/^ORCH-/);

      const approved = await orchSvc.approveStep(orch.executionId, 'STEP-1-ACTIVATE-BCP', 'CEO');
      expect(approved.steps.find((s) => s.stepId === 'STEP-1-ACTIVATE-BCP')?.approvedBy).toBe('CEO');
    });
  });

  // ── OperationalResilienceService ──────────────────────────────────────────
  describe('OperationalResilienceService', () => {
    it('deve avaliar a resiliência e calcular score 0-100', async () => {
      const report = await resilienceSvc.assessResilience('TEST');
      expect(report.reportId).toMatch(/^RESIL-/);
      expect(report.resilienceScore).toBeGreaterThanOrEqual(0);
      expect(report.resilienceScore).toBeLessThanOrEqual(100);
    });
  });

  // ── CrisisDashboardService ────────────────────────────────────────────────
  describe('CrisisDashboardService', () => {
    it('deve consolidar visão executiva do Centro de Crises', async () => {
      const dash = await dashboardSvc.getExecutiveDashboard();
      expect(dash.generatedAt).toBeDefined();
      expect(dash.overallStatus).toBeDefined();
      expect(dash.resilienceScore).toBeDefined();
    });
  });
});
