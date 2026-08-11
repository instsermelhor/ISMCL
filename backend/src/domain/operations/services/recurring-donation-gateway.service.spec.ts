import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RecurringDonationGatewayService } from './recurring-donation-gateway.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { AuditService } from '../../../audit/audit.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CreateRecurringDonationDto,
  DonationFrequency,
  DonationPaymentMethod,
  PaymentWebhookPayloadDto,
} from '../dto/recurring-donation.dto';

describe('RecurringDonationGatewayService — Motor de Doações Recorrentes (GAP-P3-03)', () => {
  let service: RecurringDonationGatewayService;
  let prismaMock: any;
  let eventBusMock: any;
  let auditMock: any;
  let cacheMock: any;
  let cacheStore: Map<string, string>;

  const mockCreateDto: CreateRecurringDonationDto = {
    amount: 100.0,
    frequency: DonationFrequency.MONTHLY,
    paymentMethod: DonationPaymentMethod.CREDIT_CARD,
    donorName: 'Ana Oliveira',
    donorEmail: 'ana.oliveira@teste.com',
    donorDocument: '11122233344',
    campaignId: 'camp-saude-infantil',
    cardToken: 'tok_visa_1234',
  };

  beforeEach(async () => {
    prismaMock = {
      donor: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: 'donor-100',
            name: args.data.name,
            email: args.data.email,
            isRecurring: args.data.isRecurring,
          }),
        ),
        update: jest.fn().mockResolvedValue({ id: 'donor-100', isRecurring: true }),
      },
      financialCategory: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cat-donations', name: 'Doação Recorrente' }),
        create: jest.fn().mockResolvedValue({ id: 'cat-donations', name: 'Doação Recorrente' }),
      },
      transaction: {
        create: jest.fn().mockImplementation((args) =>
          Promise.resolve({ id: 'tx-500', ...args.data }),
        ),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({ id: args.where.id, status: args.data.status }),
        ),
      },
      campaign: {
        update: jest.fn().mockResolvedValue({ id: 'camp-saude-infantil', raisedAmount: 100.0 }),
      },
    };

    eventBusMock = {
      publish: jest.fn().mockResolvedValue({ id: 'evt-publish-id' }),
    };

    auditMock = {
      log: jest.fn().mockResolvedValue({ id: 'audit-log-id' }),
    };

    cacheStore = new Map<string, string>();
    cacheMock = {
      get: jest.fn().mockImplementation((key: string) => Promise.resolve(cacheStore.get(key))),
      set: jest.fn().mockImplementation((key: string, val: string) => {
        cacheStore.set(key, val);
        return Promise.resolve();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringDonationGatewayService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EventBusService, useValue: eventBusMock },
        { provide: AuditService, useValue: auditMock },
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<RecurringDonationGatewayService>(RecurringDonationGatewayService);
    jest.clearAllMocks();
    cacheStore.clear();
  });

  describe('createSubscription', () => {
    it('deve criar uma assinatura recorrente, cadastrar doador e registrar auditoria', async () => {
      const sub = await service.createSubscription(mockCreateDto, 'tenant-ismcl');

      expect(sub).toBeDefined();
      expect(sub.id).toBeDefined();
      expect(sub.donorEmail).toBe('ana.oliveira@teste.com');
      expect(sub.amount).toBe(100.0);
      expect(sub.frequency).toBe(DonationFrequency.MONTHLY);
      expect(sub.status).toBe('ACTIVE');

      // Verifica chamada ao EventBus
      expect(eventBusMock.publish).toHaveBeenCalledWith(
        'aura.financial.donation.created.v1',
        expect.objectContaining({
          amount: 100.0,
          frequency: DonationFrequency.MONTHLY,
          paymentMethod: DonationPaymentMethod.CREDIT_CARD,
        }),
        'tenant-ismcl',
      );

      // Verifica Audit Log
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RECURRING_DONATION_CREATED',
          targetEntity: 'FinancialDonation',
        }),
      );
    });

    it('deve reutilizar doador existente se já cadastrado', async () => {
      prismaMock.donor.findFirst.mockResolvedValueOnce({
        id: 'donor-existing-99',
        name: 'Ana Oliveira',
        email: 'ana.oliveira@teste.com',
      });

      const sub = await service.createSubscription(mockCreateDto);

      expect(sub.donorId).toBe('donor-existing-99');
      expect(prismaMock.donor.create).not.toHaveBeenCalled();
      expect(prismaMock.donor.update).toHaveBeenCalledWith({
        where: { id: 'donor-existing-99' },
        data: { isRecurring: true },
      });
    });
  });

  describe('processWebhookEvent', () => {
    it('deve processar webhook de pagamento com sucesso e respeitar idempotência Redis', async () => {
      const webhookPayload: PaymentWebhookPayloadDto = {
        eventId: 'evt_gateway_001',
        eventType: 'payment.succeeded',
        subscriptionId: 'sub_123',
        amount: 100.0,
        status: 'PAID',
      };

      // Primeira execução: processa normalmente
      const res1 = await service.processWebhookEvent(webhookPayload, 'tenant-ismcl');
      expect(res1.processed).toBe(true);
      expect(eventBusMock.publish).toHaveBeenCalledWith(
        'aura.financial.donation.processed.v1',
        expect.objectContaining({ eventId: 'evt_gateway_001' }),
        'tenant-ismcl',
      );

      // Segunda execução idêntica: bloqueado pela idempotência Redis
      const res2 = await service.processWebhookEvent(webhookPayload, 'tenant-ismcl');
      expect(res2.processed).toBe(false);
      expect(res2.message).toContain('duplicado');
    });

    it('deve processar evento de cancelamento de assinatura no gateway', async () => {
      // Cria assinatura prévia
      const sub = await service.createSubscription(mockCreateDto);

      const cancelPayload: PaymentWebhookPayloadDto = {
        eventId: 'evt_cancel_002',
        eventType: 'subscription.cancelled',
        subscriptionId: sub.id,
      };

      const result = await service.processWebhookEvent(cancelPayload);
      expect(result.processed).toBe(true);

      const updatedSubs = await service.listSubscriptions();
      const target = updatedSubs.find((s) => s.id === sub.id);
      expect(target?.status).toBe('CANCELLED');
    });
  });

  describe('cancelSubscription', () => {
    it('deve cancelar uma assinatura ativa com sucesso', async () => {
      const sub = await service.createSubscription(mockCreateDto);

      const cancelled = await service.cancelSubscription(sub.id, { reason: 'Mudança de cartão' });
      expect(cancelled.status).toBe('CANCELLED');

      expect(eventBusMock.publish).toHaveBeenCalledWith(
        'aura.financial.donation.cancelled.v1',
        expect.objectContaining({
          subscriptionId: sub.id,
          reason: 'Mudança de cartão',
        }),
        'default',
      );
    });

    it('deve lançar NotFoundException se a assinatura não existir', async () => {
      await expect(
        service.cancelSubscription('sub-inexistente-999'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException ao tentar cancelar assinatura já cancelada', async () => {
      const sub = await service.createSubscription(mockCreateDto);
      await service.cancelSubscription(sub.id);

      await expect(service.cancelSubscription(sub.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('listSubscriptions', () => {
    it('deve listar todas as assinaturas e permitir filtragem por status', async () => {
      const sub1 = await service.createSubscription(mockCreateDto);
      const sub2 = await service.createSubscription({
        ...mockCreateDto,
        donorEmail: 'outro.doador@teste.com',
      });

      await service.cancelSubscription(sub2.id);

      const all = await service.listSubscriptions();
      expect(all.length).toBe(2);

      const activeOnly = await service.listSubscriptions('ACTIVE');
      expect(activeOnly.length).toBe(1);
      expect(activeOnly[0].id).toBe(sub1.id);

      const cancelledOnly = await service.listSubscriptions('CANCELLED');
      expect(cancelledOnly.length).toBe(1);
      expect(cancelledOnly[0].id).toBe(sub2.id);
    });
  });
});
