import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createHmac } from 'crypto';
import { WebhookProcessorService } from './webhook-processor.service';
import { ProviderRegistryService } from './provider-registry.service';
import { EventBusService } from '../../../events/event-bus.service';

describe('WebhookProcessorService — Processamento Completo de Webhooks (GAP-P3-06)', () => {
  let service: WebhookProcessorService;
  let registryMock: any;
  let eventBusMock: any;
  let configMock: any;
  let cacheMock: any;
  let cacheStore: Map<string, string>;

  const SECRET = 'test-secret-key-12345';
  const payload = { meetingId: 'meet-999', event: 'MEETING_ENDED' };
  const validSignature = `sha256=${createHmac('sha256', SECRET).update(JSON.stringify(payload)).digest('hex')}`;

  const mockProvider = {
    processWebhook: jest.fn().mockResolvedValue({
      eventType: 'MEETING_ENDED',
      externalMeetingId: 'meet-999',
      status: 'ENDED',
    }),
  };

  beforeEach(async () => {
    registryMock = {
      getProvider: jest.fn().mockImplementation((type: string) => {
        if (type === 'GOOGLE_MEET' || type === 'TEAMS' || type === 'WHATSAPP_BUSINESS') return mockProvider;
        return undefined;
      }),
    };

    eventBusMock = {
      publish: jest.fn().mockResolvedValue({ id: 'evt-bus-1' }),
    };

    configMock = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'ACTG_WEBHOOK_SECRET') return SECRET;
        if (key === 'NODE_ENV') return 'test';
        return defaultValue;
      }),
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
        WebhookProcessorService,
        { provide: ProviderRegistryService, useValue: registryMock },
        { provide: EventBusService, useValue: eventBusMock },
        { provide: ConfigService, useValue: configMock },
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<WebhookProcessorService>(WebhookProcessorService);
    jest.clearAllMocks();
    cacheStore.clear();
  });

  describe('Assinatura e Processamento de Webhook com Provedor Registrado', () => {
    it('deve processar webhook válido com sucesso e publicar no EventBus', async () => {
      const result = await service.process('GOOGLE_MEET', payload, validSignature, 'evt-001');

      expect(result.processed).toBe(true);
      expect(result.eventType).toBe('MEETING_ENDED');
      expect(result.externalMeetingId).toBe('meet-999');

      expect(eventBusMock.publish).toHaveBeenCalledWith(
        'aura.actg.webhook.processed.v1',
        expect.objectContaining({
          providerType: 'GOOGLE_MEET',
          externalEventId: 'evt-001',
          eventType: 'MEETING_ENDED',
          externalMeetingId: 'meet-999',
          status: 'ENDED',
        }),
        'default',
        { subject: 'meet-999' },
      );
    });

    it('deve validar assinatura hex pura sem o prefixo sha256=', async () => {
      const plainHexSignature = createHmac('sha256', SECRET).update(JSON.stringify(payload)).digest('hex');

      const result = await service.process('TEAMS', payload, plainHexSignature, 'evt-002');

      expect(result.processed).toBe(true);
    });

    it('deve rejeitar webhook com assinatura inválida', async () => {
      const invalidSignature = 'sha256=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

      const result = await service.process('GOOGLE_MEET', payload, invalidSignature, 'evt-003');

      expect(result.processed).toBe(false);
      expect(result.reason).toBe('INVALID_SIGNATURE');
      expect(eventBusMock.publish).not.toHaveBeenCalled();
    });
  });

  describe('Idempotência de Webhook (Redis & Fallback Local)', () => {
    it('deve bloquear webhook duplicado usando Redis como fonte primária', async () => {
      // Primeira execução
      const result1 = await service.process('GOOGLE_MEET', payload, validSignature, 'evt-dup-100');
      expect(result1.processed).toBe(true);

      // Segunda execução com o mesmo externalEventId
      const result2 = await service.process('GOOGLE_MEET', payload, validSignature, 'evt-dup-100');
      expect(result2.processed).toBe(false);
      expect(result2.reason).toBe('IDEMPOTENT_DUPLICATE');
    });

    it('deve usar fallback local quando Redis estiver indisponível', async () => {
      cacheMock.get.mockRejectedValue(new Error('Redis ECONNREFUSED'));
      cacheMock.set.mockRejectedValue(new Error('Redis ECONNREFUSED'));

      const serviceNoRedis = new WebhookProcessorService(
        registryMock,
        eventBusMock,
        configMock,
        cacheMock,
      );

      // Primeira execução em fallback
      const result1 = await serviceNoRedis.process('GOOGLE_MEET', payload, validSignature, 'evt-fallback-01');
      expect(result1.processed).toBe(true);

      // Segunda execução em fallback (bloqueado pelo Set local)
      const result2 = await serviceNoRedis.process('GOOGLE_MEET', payload, validSignature, 'evt-fallback-01');
      expect(result2.processed).toBe(false);
      expect(result2.reason).toBe('IDEMPOTENT_DUPLICATE');
    });
  });

  describe('Tratamento de Exceções e Provedores Não Suportados', () => {
    it('deve rejeitar webhook para provedor não registrado', async () => {
      const result = await service.process('UNKNOWN_PROVIDER', payload, validSignature, 'evt-unsupported');

      expect(result.processed).toBe(false);
      expect(result.reason).toBe('UNSUPPORTED_PROVIDER');
    });

    it('deve capturar erro lançado pelo provedor ao processar webhook', async () => {
      mockProvider.processWebhook.mockRejectedValueOnce(new Error('Erro de parsing do payload de terceiros'));

      const result = await service.process('GOOGLE_MEET', payload, validSignature, 'evt-err-01');

      expect(result.processed).toBe(false);
      expect(result.reason).toContain('PROVIDER_ERROR: Erro de parsing do payload de terceiros');
    });
  });
});
