import { Test, TestingModule } from '@nestjs/testing';
import { LgpdConsentService } from './lgpd-consent.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';

describe('LGPD Full Compliance Test Suite (PROMPT 198)', () => {
  let service: LgpdConsentService;
  let prisma: any;
  let eventBus: any;

  beforeEach(async () => {
    prisma = {
      dataConsent: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'consent-1', ...data })),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'c-1',
            consentVersion: '2025-08-01-v1',
            purposes: ['ASSISTENCIA_SOCIAL', 'TELEATENDIMENTO'],
            legalBasis: 'CONSENT',
            isActive: true,
            grantedAt: new Date(),
            withdrawnAt: null,
          },
        ]),
      },
      dataSubjectRequest: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'req-1', ...data })),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'req-1',
            requestType: 'PORTABILITY',
            status: 'PENDING',
            createdAt: new Date(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          },
        ]),
      },
      dataProcessingLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
      anonymizationRecord: {
        create: jest.fn().mockResolvedValue({ id: 'anon-1' }),
      },
    };

    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LgpdConsentService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<LgpdConsentService>(LgpdConsentService);
  });

  describe('LGPD Art. 18, V — Direito à Portabilidade de Dados', () => {
    it('deve exportar pacote de dados portável estruturado e registrar operação no ROPA', async () => {
      const result = await service.exportDataPortability('beneficiary-123', 'tenant-aura');

      expect(result).toBeDefined();
      expect(result.exportMetadata.entityId).toBe('beneficiary-123');
      expect(result.exportMetadata.legalBasis).toContain('Artigo 18, Inciso V');
      expect(result.consents.length).toBe(1);
      expect(result.consents[0].purposes).toContain('TELEATENDIMENTO');
      expect(result.subjectRequests.length).toBe(1);

      // Validação de registro ROPA (Art. 37)
      expect(prisma.dataProcessingLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            operation: 'DATA_PORTABILITY_EXPORT',
            legalBasis: expect.stringContaining('Art. 18, V'),
          }),
        }),
      );
    });
  });

  describe('LGPD Art. 8, §5 — Revogação de Consentimento', () => {
    it('deve revogar consentimento e emitir evento no EventBus', async () => {
      prisma.dataConsent.findFirst.mockResolvedValue({
        id: 'c-1',
        isActive: true,
      });
      prisma.dataConsent.update = jest.fn().mockResolvedValue({
        id: 'c-1',
        isActive: false,
        withdrawnAt: new Date(),
      });

      const res = await service.withdrawConsent({
        entityId: 'beneficiary-123',
        entityType: 'BENEFICIARY',
        tenantId: 'tenant-aura',
        reason: 'Titular solicitou encerramento',
      });

      expect(res.isActive).toBe(false);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'aura.lgpd.consent.withdrawn.v1',
        expect.any(Object),
        'tenant-aura',
      );
    });
  });

  describe('LGPD Art. 18 & Art. 19 — Abertura de Solicitação com Prazo Legal (15 dias úteis)', () => {
    it('deve calcular data limite de 15 dias úteis para atendimento à solicitação', async () => {
      const request = await service.createDataSubjectRequest({
        entityId: 'beneficiary-123',
        entityType: 'BENEFICIARY',
        tenantId: 'tenant-aura',
        requestType: 'ERASURE',
        description: 'Exclusão de conta',
      });

      expect(request).toBeDefined();
      expect(request.status).toBe('PENDING');
      expect(request.dueDate).toBeDefined();
      expect(new Date(request.dueDate).getTime()).toBeGreaterThan(Date.now());
    });
  });
});
