import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BeneficiaryService } from './beneficiary.service';
import { BeneficiaryStatus } from '../dto/beneficiary.dto';

const mockPrisma = {
  beneficiary: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  case: {
    findMany: jest.fn(),
  },
  appointment: {
    findMany: jest.fn(),
  },
  clinicalEvolution: {
    findMany: jest.fn(),
  },
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('BeneficiaryService', () => {
  let service: BeneficiaryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeneficiaryService,
        { provide: 'PrismaService', useValue: mockPrisma },
        { provide: 'AuditService', useValue: mockAuditService },
        { provide: 'EventBusService', useValue: mockEventBus },
      ],
    })
      .overrideProvider(BeneficiaryService)
      .useFactory({
        factory: () => new (BeneficiaryService as any)(mockPrisma, mockAuditService, mockEventBus),
      })
      .compile();

    service = module.get<BeneficiaryService>(BeneficiaryService);
  });

  describe('hasMcsiLevel4Permission()', () => {
    it('deve retornar true para SUPER_ADMIN e GESTOR', () => {
      expect(service.hasMcsiLevel4Permission('SUPER_ADMIN')).toBe(true);
      expect(service.hasMcsiLevel4Permission('GESTOR')).toBe(true);
      expect(service.hasMcsiLevel4Permission('DPO')).toBe(true);
    });

    it('deve retornar false para STAFF, OPERADOR, COLABORADOR', () => {
      expect(service.hasMcsiLevel4Permission('STAFF')).toBe(false);
      expect(service.hasMcsiLevel4Permission('OPERADOR')).toBe(false);
      expect(service.hasMcsiLevel4Permission('COLABORADOR')).toBe(false);
      expect(service.hasMcsiLevel4Permission(undefined)).toBe(false);
    });
  });

  describe('search()', () => {
    it('deve retornar lista paginada e mascarar CPF para papéis sem permissão MCSI-4', async () => {
      const mockItems = [
        {
          id: 'ben-001',
          fullName: 'Maria Silva',
          documentCpf: '12345678901',
          status: 'ACTIVE',
          createdAt: new Date(),
          protectedProfile: { sensitivityLevel: 2 },
        },
      ];

      mockPrisma.beneficiary.findMany.mockResolvedValue(mockItems);
      mockPrisma.beneficiary.count.mockResolvedValue(1);

      const result = await service.search({}, 'STAFF');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].documentCpf).toBe('123.***.***-01');
      expect(result.total).toBe(1);
    });

    it('deve exibir CPF desmascarado para SUPER_ADMIN', async () => {
      const mockItems = [
        {
          id: 'ben-002',
          fullName: 'João Souza',
          documentCpf: '98765432100',
          status: 'ACTIVE',
          createdAt: new Date(),
          protectedProfile: { sensitivityLevel: 4 },
        },
      ];

      mockPrisma.beneficiary.findMany.mockResolvedValue(mockItems);
      mockPrisma.beneficiary.count.mockResolvedValue(1);

      const result = await service.search({}, 'SUPER_ADMIN');

      expect(result.data[0].documentCpf).toBe('98765432100');
    });
  });

  describe('findById() — GAP-P1-01 (MCSI Nível 4)', () => {
    it('deve lançar NotFoundException (simulando 404) quando beneficiário é MCSI-4 e usuário não tem acesso', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue({
        id: 'ben-mcsi4',
        fullName: 'Testemunha Protegida',
        documentCpf: '00000000000',
        status: 'ACTIVE',
        createdAt: new Date(),
        protectedProfile: { sensitivityLevel: 4, specialCategory: 'TESTEMUNHA' },
      });

      await expect(service.findById('ben-mcsi4', 'STAFF')).rejects.toThrow(NotFoundException);
    });

    it('deve retornar beneficiário MCSI-4 com sucesso para GESTOR', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue({
        id: 'ben-mcsi4',
        fullName: 'Testemunha Protegida',
        documentCpf: '00000000000',
        status: 'ACTIVE',
        createdAt: new Date(),
        protectedProfile: { sensitivityLevel: 4, specialCategory: 'TESTEMUNHA' },
      });

      const result = await service.findById('ben-mcsi4', 'GESTOR');
      expect(result.id).toBe('ben-mcsi4');
      expect(result.mcsiLevel).toBe(4);
    });
  });

  describe('update()', () => {
    it('deve atualizar beneficiário e gerar log de auditoria', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue({
        id: 'ben-upd',
        fullName: 'Nome Antigo',
        status: 'ACTIVE',
        createdAt: new Date(),
        protectedProfile: { sensitivityLevel: 1 },
      });

      mockPrisma.beneficiary.update.mockResolvedValue({
        id: 'ben-upd',
        fullName: 'Nome Novo',
        status: 'ACTIVE',
        createdAt: new Date(),
        protectedProfile: { sensitivityLevel: 1 },
      });

      const result = await service.update(
        'ben-upd',
        { fullName: 'Nome Novo' },
        'user-1',
        'ADMIN',
        'Admin User',
      );

      expect(result.fullName).toBe('Nome Novo');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BENEFICIARY_UPDATED', targetEntityId: 'ben-upd' }),
      );
      expect(mockEventBus.publish).toHaveBeenCalled();
    });
  });

  describe('getTimeline()', () => {
    it('deve agregar eventos de casos, agendamentos e evoluções', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue({
        id: 'ben-time',
        fullName: 'Maria Timeline',
        status: 'ACTIVE',
        createdAt: new Date(),
        protectedProfile: { sensitivityLevel: 0 },
      });

      mockPrisma.case.findMany.mockResolvedValue([
        { id: 'c1', caseNumber: 101, title: 'Atendimento Inicial', createdAt: new Date() },
      ]);
      mockPrisma.appointment.findMany.mockResolvedValue([
        { id: 'a1', scheduledAt: new Date(), status: 'CONFIRMED', appointmentType: 'PSICOLOGIA' },
      ]);
      mockPrisma.clinicalEvolution.findMany.mockResolvedValue([]);

      const timeline = await service.getTimeline('ben-time', 'ADMIN');
      expect(timeline).toHaveLength(2);
      expect(timeline.some((t) => t.type === 'CASE')).toBe(true);
      expect(timeline.some((t) => t.type === 'APPOINTMENT')).toBe(true);
    });
  });
});
