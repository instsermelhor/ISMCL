import { Test, TestingModule } from '@nestjs/testing';
import { NotificationOrchestratorService, NotificationContext } from './notification-orchestrator.service';
import { WhatsAppBusinessConnector } from '../connectors/whatsapp-business.connector';
import { EventBusService } from '../../../events/event-bus.service';
import { NotificationEventType, NotificationChannel } from '../dto/actg.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('NotificationOrchestratorService — Idempotência Redis & Multicanal', () => {
  let service: NotificationOrchestratorService;
  let whatsappMock: any;
  let eventBusMock: any;
  let cacheMock: any;

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

    const cacheStore = new Map<string, string>();
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
            cacheMock,
          ),
      })
      .compile();

    service = module.get<NotificationOrchestratorService>(NotificationOrchestratorService);
    jest.clearAllMocks();
  });

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
});
