import { Test, TestingModule } from '@nestjs/testing';
import { NotificationOrchestratorService, NotificationContext } from './notification-orchestrator.service';
import { WhatsAppBusinessConnector } from '../connectors/whatsapp-business.connector';
import { EventBusService } from '../../../events/event-bus.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationEventType, NotificationChannel } from '../dto/actg.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('NotificationOrchestratorService — Idempotência Redis & Multicanal', () => {
  let service: NotificationOrchestratorService;
  let whatsappMock: any;
  let eventBusMock: any;
  let pushMock: any;
  let cacheMock: any;
  let cacheStore: Map<string, string>;

  const mockContext: NotificationContext = {
    appointmentId: 'appt-100',
    recipientId: 'rec-200',
    recipientType: 'BENEFICIARY',
    recipientName: 'Carlos Silva',
    recipientPhone: '51999999999',
    appointmentDate: '12/08/2026',
    appointmentTime: '14:00',
    professionalName: 'Dr. Roberto',
    channelType: 'ONLINE',
    allowedChannels: [NotificationChannel.WHATSAPP, NotificationChannel.EMAIL],
  };

  beforeEach(async () => {
    whatsappMock = {
      sendNotification: jest.fn().mockResolvedValue({ messageId: 'wa-001' }),
    };

    eventBusMock = {
      publish: jest.fn().mockResolvedValue({ id: 'evt-001' }),
    };

    pushMock = {
      send: jest.fn().mockResolvedValue({ success: true, platform: 'FCM', messageId: 'push-mock-001' }),
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
        NotificationOrchestratorService,
        { provide: WhatsAppBusinessConnector, useValue: whatsappMock },
        { provide: EventBusService, useValue: eventBusMock },
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    })
      .overrideProvider(NotificationOrchestratorService)
      .useFactory({
        factory: () =>
          new NotificationOrchestratorService(
            whatsappMock,
            eventBusMock,
            pushMock,
            cacheMock,
          ),
      })
      .compile();

    service = module.get<NotificationOrchestratorService>(NotificationOrchestratorService);
    jest.clearAllMocks();
    cacheStore.clear();
  });

  // ─── Testes originais ────────────────────────────────────────────────────────

  it('deve enviar notificação na primeira chamada e armazenar chave no Redis', async () => {
    await service.notify(NotificationEventType.REMINDER_24H, mockContext);

    expect(whatsappMock.sendNotification).toHaveBeenCalledTimes(1);
    expect(cacheMock.set).toHaveBeenCalled();
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.actg.notification.sent.v1',
      expect.objectContaining({
        appointmentId: 'appt-100',
        recipientId: 'rec-200',
      }),
      'default',
      expect.any(Object),
    );
  });

  it('não deve reenviar notificação duplicada para a mesma chave de idempotência', async () => {
    // Primeira chamada: envia
    await service.notify(NotificationEventType.REMINDER_24H, mockContext);
    expect(whatsappMock.sendNotification).toHaveBeenCalledTimes(1);

    // Segunda chamada idêntica: idempotência deve bloquear
    await service.notify(NotificationEventType.REMINDER_24H, mockContext);
    expect(whatsappMock.sendNotification).toHaveBeenCalledTimes(1); // Continua 1
  });

  it('deve usar fallback para Set local se CacheManager não for injetado', async () => {
    const serviceWithoutCache = new NotificationOrchestratorService(
      whatsappMock,
      eventBusMock,
      undefined,
    );

    await serviceWithoutCache.notify(NotificationEventType.REMINDER_2H, mockContext);
    expect(whatsappMock.sendNotification).toHaveBeenCalledTimes(1);

    // Segunda chamada
    await serviceWithoutCache.notify(NotificationEventType.REMINDER_2H, mockContext);
    expect(whatsappMock.sendNotification).toHaveBeenCalledTimes(1); // Bloqueado pelo Set local
  });

  // ─── GAP-P3-02: Comportamento Redis primário / Fallback limitado ─────────────

  it('GAP-P3-02: markAsSent com Redis disponível NÃO deve popular o fallback local', async () => {
    await service.markAsSent('rec-001:appt-001:REMINDER_24H:WHATSAPP');

    // Redis deve ser chamado
    expect(cacheMock.set).toHaveBeenCalledWith(
      'notif:rec-001:appt-001:REMINDER_24H:WHATSAPP',
      '1',
      691200 * 1000,
    );

    // O fallback local NÃO deve conter a chave (evitar duplo consumo de memória)
    const fallbackHas = await (service as any).localFallback.has(
      'rec-001:appt-001:REMINDER_24H:WHATSAPP',
    );
    expect(fallbackHas).toBe(false);
  });

  it('GAP-P3-02: isAlreadySent deve retornar false quando Redis retorna undefined (chave ausente)', async () => {
    cacheMock.get.mockResolvedValueOnce(undefined);
    const result = await service.isAlreadySent('chave-nao-existente');
    expect(result).toBe(false);
  });

  it('GAP-P3-02: quando Redis falha em get, deve usar fallback local sem lançar exceção', async () => {
    cacheMock.get.mockRejectedValueOnce(new Error('Redis ECONNREFUSED'));

    const serviceWithFallback = new NotificationOrchestratorService(
      whatsappMock,
      eventBusMock,
      cacheMock,
    );

    // Pré-popula o fallback local
    (serviceWithFallback as any).localFallback.add('rec-X:appt-X:REMINDER_7D:EMAIL');

    // Deve consultar o Set local como fallback sem lançar
    const result = await serviceWithFallback.isAlreadySent('rec-X:appt-X:REMINDER_7D:EMAIL');
    expect(result).toBe(true);
  });

  it('GAP-P3-02: quando Redis falha em set, deve registrar no fallback local e não lançar', async () => {
    cacheMock.set.mockRejectedValueOnce(new Error('Redis ECONNREFUSED'));

    const serviceWithFallback = new NotificationOrchestratorService(
      whatsappMock,
      eventBusMock,
      cacheMock,
    );

    // Não deve lançar
    await expect(
      serviceWithFallback.markAsSent('rec-Y:appt-Y:REMINDER_30MIN:PORTAL'),
    ).resolves.not.toThrow();

    // Deve estar no fallback local
    const inFallback = (serviceWithFallback as any).localFallback.has(
      'rec-Y:appt-Y:REMINDER_30MIN:PORTAL',
    );
    expect(inFallback).toBe(true);
  });

  it('GAP-P3-02: fallback local deve respeitar limite máximo (evicção FIFO ao atingir 10.000)', async () => {
    const serviceNoCache = new NotificationOrchestratorService(
      whatsappMock,
      eventBusMock,
      undefined, // Sem Redis — usa apenas fallback local
    );

    const fallback = (serviceNoCache as any).localFallback as Set<string>;

    // Pré-preenche até o limite máximo
    for (let i = 0; i < 10_000; i++) {
      fallback.add(`key-${i}`);
    }
    expect(fallback.size).toBe(10_000);

    // A primeira chave adicionada deve ser a mais antiga
    expect(fallback.has('key-0')).toBe(true);

    // Adicionar mais uma deve evocar evicção da mais antiga
    await serviceNoCache.markAsSent('key-overflow');

    // Tamanho não deve exceder o limite
    expect(fallback.size).toBe(10_000);

    // A chave mais antiga (key-0) deve ter sido removida
    expect(fallback.has('key-0')).toBe(false);

    // A nova chave deve estar presente
    expect(fallback.has('key-overflow')).toBe(true);
  });
});

