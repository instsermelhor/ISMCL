import { Test, TestingModule } from '@nestjs/testing';
import {
  CaseAlertSchedulerService,
  CaseAlertType,
  CaseAlertSeverity,
  CaseAlertStatus,
} from './case-alert-scheduler.service';

const mockPrisma = {
  case: {
    findMany: jest.fn(),
  },
  caseAlert: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  picGoal: {
    findMany: jest.fn(),
  },
  referral: {
    findMany: jest.fn(),
  },
  individualCarePlan: {
    findMany: jest.fn(),
  },
};

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('CaseAlertSchedulerService', () => {
  let service: CaseAlertSchedulerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaseAlertSchedulerService,
        { provide: 'PrismaService', useValue: mockPrisma },
        { provide: 'EventBusService', useValue: mockEventBus },
      ],
    })
      .overrideProvider(CaseAlertSchedulerService)
      .useFactory({
        factory: () => new (CaseAlertSchedulerService as any)(mockPrisma, mockEventBus),
      })
      .compile();

    service = module.get<CaseAlertSchedulerService>(CaseAlertSchedulerService);
  });

  describe('checkAndGenerateAlerts()', () => {
    it('deve gerar alerta NO_VISIT_PROLONGED para caso sem evolução há mais de 15 dias', async () => {
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

      mockPrisma.case.findMany.mockResolvedValue([
        {
          id: 'case-001',
          status: 'ACTIVE',
          createdAt: twentyDaysAgo,
          beneficiary: {
            evolutions: [{ id: 'evo-1', clinicalDate: twentyDaysAgo }],
          },
        },
      ]);
      mockPrisma.picGoal.findMany.mockResolvedValue([]);
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.individualCarePlan.findMany.mockResolvedValue([]);

      mockPrisma.caseAlert.findFirst.mockResolvedValue(null);
      mockPrisma.caseAlert.create.mockResolvedValue({
        id: 'alert-001',
        caseId: 'case-001',
        type: CaseAlertType.NO_VISIT_PROLONGED,
        status: CaseAlertStatus.ACTIVE,
        message: 'Caso sem evolução há 20 dias',
      });

      const summary = await service.checkAndGenerateAlerts('tenant-1');

      expect(summary.noVisitAlerts).toBe(1);
      expect(summary.totalAlertsGenerated).toBe(1);
      expect(mockPrisma.caseAlert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            caseId: 'case-001',
            type: CaseAlertType.NO_VISIT_PROLONGED,
            severity: CaseAlertSeverity.HIGH,
          }),
        }),
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.case.alert.generated.v1',
        expect.objectContaining({ alertId: 'alert-001', caseId: 'case-001' }),
        'tenant-1',
        expect.any(Object),
      );
    });

    it('não deve duplicar alerta de NO_VISIT_PROLONGED se já existir um ativo', async () => {
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

      mockPrisma.case.findMany.mockResolvedValue([
        {
          id: 'case-002',
          status: 'ACTIVE',
          createdAt: twentyDaysAgo,
          beneficiary: { evolutions: [] },
        },
      ]);
      mockPrisma.picGoal.findMany.mockResolvedValue([]);
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.individualCarePlan.findMany.mockResolvedValue([]);

      // Já existe um alerta ativo
      mockPrisma.caseAlert.findFirst.mockResolvedValue({
        id: 'alert-existente',
        caseId: 'case-002',
        type: CaseAlertType.NO_VISIT_PROLONGED,
        status: CaseAlertStatus.ACTIVE,
      });

      const summary = await service.checkAndGenerateAlerts('tenant-1');
      expect(summary.noVisitAlerts).toBe(0);
      expect(mockPrisma.caseAlert.create).not.toHaveBeenCalled();
    });

    it('deve gerar alerta META_OVERDUE para metas com targetDate vencido', async () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      mockPrisma.case.findMany.mockResolvedValue([]);
      mockPrisma.picGoal.findMany.mockResolvedValue([
        {
          id: 'goal-001',
          description: 'Aumentar autonomia social',
          targetDate: pastDate,
          status: 'IN_PROGRESS',
          pic: { caseId: 'case-003' },
        },
      ]);
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.individualCarePlan.findMany.mockResolvedValue([]);

      mockPrisma.caseAlert.findFirst.mockResolvedValue(null);
      mockPrisma.caseAlert.create.mockResolvedValue({
        id: 'alert-meta',
        caseId: 'case-003',
        type: CaseAlertType.META_OVERDUE,
        status: CaseAlertStatus.ACTIVE,
      });

      const summary = await service.checkAndGenerateAlerts();
      expect(summary.metaOverdueAlerts).toBe(1);
      expect(mockPrisma.caseAlert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            caseId: 'case-003',
            type: CaseAlertType.META_OVERDUE,
          }),
        }),
      );
    });

    it('deve gerar alerta REFERRAL_NO_RETURN para encaminhamento sem retorno há mais de 30 dias', async () => {
      mockPrisma.case.findMany.mockResolvedValue([]);
      mockPrisma.picGoal.findMany.mockResolvedValue([]);
      mockPrisma.referral.findMany.mockResolvedValue([
        {
          id: 'ref-001',
          caseId: 'case-004',
          destination: 'CRAS Norte',
          status: 'PENDING',
          result: null,
          createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        },
      ]);
      mockPrisma.individualCarePlan.findMany.mockResolvedValue([]);

      mockPrisma.caseAlert.findFirst.mockResolvedValue(null);
      mockPrisma.caseAlert.create.mockResolvedValue({
        id: 'alert-ref',
        caseId: 'case-004',
        type: CaseAlertType.REFERRAL_NO_RETURN,
        status: CaseAlertStatus.ACTIVE,
      });

      const summary = await service.checkAndGenerateAlerts();
      expect(summary.referralNoReturnAlerts).toBe(1);
    });

    it('deve gerar alerta PIC_REVISION_OVERDUE para PIC sem atualização há mais de 60 dias', async () => {
      mockPrisma.case.findMany.mockResolvedValue([]);
      mockPrisma.picGoal.findMany.mockResolvedValue([]);
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.individualCarePlan.findMany.mockResolvedValue([
        {
          id: 'pic-001',
          caseId: 'case-005',
          version: 2,
          status: 'ACTIVE',
          updatedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
        },
      ]);

      mockPrisma.caseAlert.findFirst.mockResolvedValue(null);
      mockPrisma.caseAlert.create.mockResolvedValue({
        id: 'alert-pic',
        caseId: 'case-005',
        type: CaseAlertType.PIC_REVISION_OVERDUE,
        status: CaseAlertStatus.ACTIVE,
      });

      const summary = await service.checkAndGenerateAlerts();
      expect(summary.picRevisionOverdueAlerts).toBe(1);
    });
  });

  describe('resolveAlert() / getActiveAlertsForCase()', () => {
    it('deve marcar um alerta como RESOLVED', async () => {
      mockPrisma.caseAlert.update.mockResolvedValue({
        id: 'alert-123',
        status: CaseAlertStatus.RESOLVED,
        resolvedAt: new Date(),
      });

      const resolved = await service.resolveAlert('alert-123');
      expect(resolved.status).toBe(CaseAlertStatus.RESOLVED);
      expect(mockPrisma.caseAlert.update).toHaveBeenCalledWith({
        where: { id: 'alert-123' },
        data: expect.objectContaining({ status: CaseAlertStatus.RESOLVED }),
      });
    });

    it('deve buscar alertas ativos de um caso', async () => {
      mockPrisma.caseAlert.findMany.mockResolvedValue([
        { id: 'a1', caseId: 'case-100', status: CaseAlertStatus.ACTIVE },
      ]);

      const alerts = await service.getActiveAlertsForCase('case-100');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('a1');
    });
  });
});
