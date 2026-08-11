import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AnonymizationService } from './anonymization.service';

const mockPrisma = {
  dataSubjectRequest: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  anonymizationRecord: {
    create: jest.fn(),
  },
  beneficiary: {
    update: jest.fn(),
  },
  protectedProfile: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  professional: {
    update: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('AnonymizationService', () => {
  let service: AnonymizationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnonymizationService,
        { provide: 'PrismaService', useValue: mockPrisma },
        { provide: 'AuditService', useValue: mockAuditService },
        { provide: 'EventBusService', useValue: mockEventBus },
      ],
    })
      .overrideProvider(AnonymizationService)
      .useFactory({
        factory: () => new (AnonymizationService as any)(mockPrisma, mockAuditService, mockEventBus),
      })
      .compile();

    service = module.get<AnonymizationService>(AnonymizationService);
  });

  describe('processErasureRequest()', () => {
    it('deve anonimizar um BENEFICIARY tokenizando nome e removendo CPF', async () => {
      mockPrisma.dataSubjectRequest.findUnique.mockResolvedValue({
        id: 'req-001',
        entityId: 'ben-12345678',
        entityType: 'BENEFICIARY',
        requestType: 'ERASURE',
        status: 'PENDING',
        evidenceLog: [],
      });

      mockPrisma.beneficiary.update.mockResolvedValue({ id: 'ben-12345678' });
      mockPrisma.protectedProfile.findUnique.mockResolvedValue({ beneficiaryId: 'ben-12345678' });
      mockPrisma.protectedProfile.update.mockResolvedValue({});
      mockPrisma.anonymizationRecord.create.mockResolvedValue({ id: 'anon-rec-1' });
      mockPrisma.dataSubjectRequest.update.mockResolvedValue({});

      const result = await service.processErasureRequest('req-001', 'DPO_ADMIN');

      expect(result.status).toBe('COMPLETED');
      expect(result.entityType).toBe('BENEFICIARY');
      expect(result.fieldsAnonymized).toContain('fullName');
      expect(result.fieldsAnonymized).toContain('documentCpf');

      expect(mockPrisma.beneficiary.update).toHaveBeenCalledWith({
        where: { id: 'ben-12345678' },
        data: expect.objectContaining({
          fullName: 'ANONIMIZADO_ben-1234',
          documentCpf: null,
          status: 'INACTIVE',
        }),
      });

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DATA_SUBJECT_ERASURE_COMPLETED', targetEntityId: 'ben-12345678' }),
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.lgpd.data.anonymized.v1',
        expect.objectContaining({ requestId: 'req-001', entityId: 'ben-12345678' }),
        'default',
        expect.any(Object),
      );
    });

    it('deve anonimizar um PROFESSIONAL tokenizando nome, CPF, e-mail e desativando cadastro', async () => {
      mockPrisma.dataSubjectRequest.findUnique.mockResolvedValue({
        id: 'req-002',
        entityId: 'prof-87654321',
        entityType: 'PROFESSIONAL',
        requestType: 'ERASURE',
        status: 'PENDING',
        evidenceLog: [],
      });

      mockPrisma.professional.update.mockResolvedValue({ id: 'prof-87654321' });
      mockPrisma.anonymizationRecord.create.mockResolvedValue({});
      mockPrisma.dataSubjectRequest.update.mockResolvedValue({});

      const result = await service.processErasureRequest('req-002');

      expect(result.status).toBe('COMPLETED');
      expect(result.entityType).toBe('PROFESSIONAL');

      expect(mockPrisma.professional.update).toHaveBeenCalledWith({
        where: { id: 'prof-87654321' },
        data: expect.objectContaining({
          fullName: 'ANONIMIZADO_prof-876',
          cpf: '000.000.000-00',
          email: 'anon_prof-876@aura.anon',
          status: 'INACTIVE',
        }),
      });
    });

    it('deve anonimizar um USER revogando senhas e segredos MFA', async () => {
      mockPrisma.dataSubjectRequest.findUnique.mockResolvedValue({
        id: 'req-003',
        entityId: 'user-11223344',
        entityType: 'USER',
        requestType: 'ERASURE',
        status: 'PENDING',
        evidenceLog: [],
      });

      mockPrisma.user.update.mockResolvedValue({ id: 'user-11223344' });
      mockPrisma.anonymizationRecord.create.mockResolvedValue({});
      mockPrisma.dataSubjectRequest.update.mockResolvedValue({});

      const result = await service.processErasureRequest('req-003');

      expect(result.status).toBe('COMPLETED');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-11223344' },
        data: expect.objectContaining({
          name: 'ANONIMIZADO_user-112',
          passwordHash: 'REVOKED_ANONYMIZED',
          mfaSecret: null,
          mfaEnabled: false,
          status: 'INACTIVE',
        }),
      });
    });

    it('deve lançar NotFoundException se a solicitação não existir', async () => {
      mockPrisma.dataSubjectRequest.findUnique.mockResolvedValue(null);
      await expect(service.processErasureRequest('req-invalid')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se o tipo de solicitação não for ERASURE', async () => {
      mockPrisma.dataSubjectRequest.findUnique.mockResolvedValue({
        id: 'req-004',
        requestType: 'ACCESS',
        status: 'PENDING',
      });

      await expect(service.processErasureRequest('req-004')).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se a solicitação já estiver COMPLETED', async () => {
      mockPrisma.dataSubjectRequest.findUnique.mockResolvedValue({
        id: 'req-005',
        requestType: 'ERASURE',
        status: 'COMPLETED',
      });

      await expect(service.processErasureRequest('req-005')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkPendingDeadlines()', () => {
    it('deve contar solicitações pendentes e vencidas', async () => {
      const pastDueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const futureDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      mockPrisma.dataSubjectRequest.findMany.mockResolvedValue([
        { id: 'r1', dueDate: pastDueDate, status: 'PENDING' },
        { id: 'r2', dueDate: futureDueDate, status: 'IN_PROGRESS' },
      ]);

      const summary = await service.checkPendingDeadlines('tenant-01');

      expect(summary.pendingCount).toBe(2);
      expect(summary.overdueCount).toBe(1);
    });
  });
});
