import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProfessionalService } from './professional.service';
import { ProfessionalStatus, ProfessionalBondType, ProfessionType } from '../dto/professional.dto';

const mockPrisma = {
  professional: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('ProfessionalService', () => {
  let service: ProfessionalService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalService,
        { provide: 'PrismaService', useValue: mockPrisma },
        { provide: 'AuditService', useValue: mockAuditService },
        { provide: 'EventBusService', useValue: mockEventBus },
      ],
    })
      .overrideProvider(ProfessionalService)
      .useFactory({
        factory: () => new (ProfessionalService as any)(mockPrisma, mockAuditService, mockEventBus),
      })
      .compile();

    service = module.get<ProfessionalService>(ProfessionalService);
  });

  describe('search()', () => {
    it('deve retornar lista paginada de profissionais', async () => {
      const mockItems = [
        {
          id: 'prof-001',
          fullName: 'Dr. Roberto Alves',
          socialName: null,
          email: 'roberto@aura.org',
          phone: '11999998888',
          bondType: 'VOLUNTEER',
          status: 'ACTIVE',
          profession: 'PSYCHOLOGIST',
          specialty: 'TCC',
          councilNumber: '12345',
          councilState: 'SP',
          councilStatus: 'ATIVO',
          joinedAt: new Date(),
        },
      ];

      mockPrisma.professional.findMany.mockResolvedValue(mockItems);
      mockPrisma.professional.count.mockResolvedValue(1);

      const result = await service.search({ profession: ProfessionType.PSYCHOLOGIST });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].fullName).toBe('Dr. Roberto Alves');
      expect(result.total).toBe(1);
    });
  });

  describe('findById()', () => {
    it('deve retornar o perfil completo do profissional com availabilities', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof-002',
        fullName: 'Dra. Ana Paula',
        email: 'ana@aura.org',
        bondType: 'EMPLOYEE',
        status: 'ACTIVE',
        profession: 'SOCIAL_WORKER',
        joinedAt: new Date(),
        availabilities: [
          { id: 'av-1', dayOfWeek: 1, startTime: '08:00', endTime: '12:00', isAvailable: true },
        ],
      });

      const result = await service.findById('prof-002');
      expect(result.id).toBe('prof-002');
      expect(result.availabilities).toHaveLength(1);
      expect(result.availabilities?.[0].startTime).toBe('08:00');
    });

    it('deve lançar NotFoundException quando o profissional não for encontrado', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue(null);
      await expect(service.findById('prof-invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('deve atualizar o perfil do profissional e registrar audit log', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof-upd',
        fullName: 'Dr. Carlos',
        email: 'carlos@aura.org',
        bondType: 'VOLUNTEER',
        status: 'ACTIVE',
        joinedAt: new Date(),
        availabilities: [],
      });

      mockPrisma.professional.update.mockResolvedValue({
        id: 'prof-upd',
        fullName: 'Dr. Carlos',
        specialty: 'Terapia Familiar',
        status: 'ACTIVE',
        joinedAt: new Date(),
      });

      const result = await service.update(
        'prof-upd',
        { specialty: 'Terapia Familiar' },
        'user-admin',
        'ADMIN',
      );

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PROFESSIONAL_UPDATED', targetEntityId: 'prof-upd' }),
      );
      expect(mockEventBus.publish).toHaveBeenCalled();
    });
  });

  describe('getAvailability()', () => {
    it('deve retornar os slots de disponibilidade', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof-avail',
        fullName: 'Dr. Lucas',
        email: 'lucas@aura.org',
        bondType: 'VOLUNTEER',
        status: 'ACTIVE',
        joinedAt: new Date(),
        availabilities: [
          { id: 'av-10', dayOfWeek: 2, startTime: '14:00', endTime: '18:00', isAvailable: true },
        ],
      });

      const slots = await service.getAvailability('prof-avail');
      expect(slots).toHaveLength(1);
      expect(slots[0].startTime).toBe('14:00');
    });
  });
});
