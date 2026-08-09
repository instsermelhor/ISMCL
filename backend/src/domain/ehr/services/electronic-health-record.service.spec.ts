import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ElectronicHealthRecordService } from './electronic-health-record.service';
import { EventBusService } from '../../../events/event-bus.service';

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('ElectronicHealthRecordService — Prontuário Eletrônico & Break Glass', () => {
  let service: ElectronicHealthRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectronicHealthRecordService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<ElectronicHealthRecordService>(ElectronicHealthRecordService);
    jest.clearAllMocks();
  });

  describe('getOrCreateEhr()', () => {
    it('deve criar um prontuário com número PEP sequencial e emitir evento aura.ehr.created.v1', async () => {
      const ehr = await service.getOrCreateEhr('ben-100', 'tenant-aura');

      expect(ehr.ehrId).toBeDefined();
      expect(ehr.recordNumber).toMatch(/^PEP-\d{4}-\d{5}$/);
      expect(ehr.status).toBe('ACTIVE');

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.ehr.created.v1',
        expect.objectContaining({ beneficiaryId: 'ben-100', recordNumber: ehr.recordNumber }),
        'tenant-aura',
        expect.any(Object),
      );
    });

    it('deve retornar prontuário existente se já criado para o beneficiário', async () => {
      const first = await service.getOrCreateEhr('ben-200');
      const second = await service.getOrCreateEhr('ben-200');

      expect(second.ehrId).toBe(first.ehrId);
      expect(second.recordNumber).toBe(first.recordNumber);
    });
  });

  describe('executeBreakGlass() Protocolo de Acesso Emergencial', () => {
    it('deve registrar acesso Break Glass e alertar o SOC com evento aura.ehr.breakglass.used.v1', async () => {
      const ehr = await service.getOrCreateEhr('ben-300');

      const log = await service.executeBreakGlass(
        ehr.ehrId,
        'medico-urgencia-01',
        'Atendimento de emergência por crise alérgica grave e perda de consciência',
        'tenant-emergencia',
      );

      expect(log.logId).toBeDefined();
      expect(log.socAlertGenerated).toBe(true);
      expect(log.justification).toContain('emergência');

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.ehr.breakglass.used.v1',
        expect.objectContaining({
          ehrId: ehr.ehrId,
          requestedByUserId: 'medico-urgencia-01',
          recordNumber: ehr.recordNumber,
        }),
        'tenant-emergencia',
        expect.any(Object),
      );
    });

    it('deve recusar Break Glass se a justificativa tiver menos de 10 caracteres', async () => {
      const ehr = await service.getOrCreateEhr('ben-400');

      await expect(
        service.executeBreakGlass(ehr.ehrId, 'user-01', 'Curto'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar NotFoundException se o prontuário não existir', async () => {
      await expect(
        service.executeBreakGlass('ehr-inexistente', 'user-01', 'Justificativa longa para teste de erro'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
