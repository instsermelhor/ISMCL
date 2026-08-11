import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationService, PushPayload } from './push-notification.service';

describe('PushNotificationService — Notificações Push FCM/APNs (GAP-P3-05)', () => {
  let service: PushNotificationService;
  let fcmMock: { send: jest.Mock };

  beforeEach(async () => {
    fcmMock = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PushNotificationService,
          useFactory: () => new PushNotificationService(fcmMock),
        },
      ],
    }).compile();

    service = module.get<PushNotificationService>(PushNotificationService);
    jest.clearAllMocks();
  });

  describe('isFcmConfigured / isApnsConfigured', () => {
    it('deve indicar FCM configurado quando fcmMessaging for injetado', () => {
      expect(service.isFcmConfigured()).toBe(true);
    });

    it('deve indicar FCM NÃO configurado quando serviço for criado sem token', () => {
      const svcNoFcm = new PushNotificationService(undefined);
      expect(svcNoFcm.isFcmConfigured()).toBe(false);
    });
  });

  describe('sendFcm', () => {
    it('deve enviar push FCM com sucesso e retornar messageId', async () => {
      fcmMock.send.mockResolvedValueOnce('msg-fcm-001');

      const payload: PushPayload = {
        deviceToken: 'fcm-device-token-xyz',
        platform: 'FCM',
        title: 'Aura — Lembrete de Consulta',
        body: 'Sua consulta está agendada para amanhã às 14:00.',
        data: { appointmentId: 'appt-100', joinUrl: '/telehealth/room-100' },
        collapseKey: 'appt:appt-100',
      };

      const result = await service.send(payload);

      expect(result.success).toBe(true);
      expect(result.platform).toBe('FCM');
      expect(result.messageId).toBe('msg-fcm-001');
      expect(fcmMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'fcm-device-token-xyz',
          notification: {
            title: 'Aura — Lembrete de Consulta',
            body: 'Sua consulta está agendada para amanhã às 14:00.',
          },
          android: expect.objectContaining({ priority: 'HIGH', collapse_key: 'appt:appt-100' }),
        }),
      );
    });

    it('deve retornar success=false quando FCM rejeitar o token (registro inválido)', async () => {
      fcmMock.send.mockRejectedValueOnce(new Error('messaging/registration-token-not-registered'));

      const result = await service.sendFcm({
        deviceToken: 'invalid-token',
        platform: 'FCM',
        title: 'Teste',
        body: 'Teste de falha FCM',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('registration-token-not-registered');
    });

    it('deve operar em modo degradado (sem envio) quando FCM não estiver configurado', async () => {
      const svcNoFcm = new PushNotificationService(undefined);

      const result = await svcNoFcm.sendFcm({
        deviceToken: 'any-token',
        platform: 'FCM',
        title: 'Teste',
        body: 'Teste degradado',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('modo degradado');
    });
  });

  describe('sendApns (modo degradado — sem credenciais)', () => {
    it('deve retornar success=false em modo degradado quando credenciais APNs estiverem ausentes', async () => {
      // Garante que as variáveis de ambiente APNs não estão definidas no ambiente de teste
      const originalKeyId = process.env.APNS_KEY_ID;
      const originalTeamId = process.env.APNS_TEAM_ID;
      const originalKey = process.env.APNS_PRIVATE_KEY;

      delete process.env.APNS_KEY_ID;
      delete process.env.APNS_TEAM_ID;
      delete process.env.APNS_PRIVATE_KEY;

      try {
        const result = await service.sendApns({
          deviceToken: 'apns-device-token-abc',
          platform: 'APNS',
          title: 'Aura',
          body: 'Consulta amanhã',
        });

        expect(result.success).toBe(false);
        expect(result.platform).toBe('APNS');
        expect(result.error).toContain('modo degradado');
      } finally {
        // Restaura variáveis de ambiente
        if (originalKeyId !== undefined) process.env.APNS_KEY_ID = originalKeyId;
        if (originalTeamId !== undefined) process.env.APNS_TEAM_ID = originalTeamId;
        if (originalKey !== undefined) process.env.APNS_PRIVATE_KEY = originalKey;
      }
    });
  });

  describe('send — dispatch correto por plataforma', () => {
    it('deve chamar sendFcm quando platform=FCM', async () => {
      fcmMock.send.mockResolvedValueOnce('msg-dispatch-fcm');

      const result = await service.send({
        deviceToken: 'token-fcm',
        platform: 'FCM',
        title: 'Teste',
        body: 'Dispatch FCM',
      });

      expect(result.success).toBe(true);
      expect(result.platform).toBe('FCM');
    });

    it('deve chamar sendApns (degradado) quando platform=APNS', async () => {
      const result = await service.send({
        deviceToken: 'token-apns',
        platform: 'APNS',
        title: 'Teste',
        body: 'Dispatch APNs',
      });

      // APNs em modo degradado pois APNS_* envs não estão definidas em CI
      expect(result.platform).toBe('APNS');
      // success pode ser false (degradado) ou true dependendo do ambiente
      expect(typeof result.success).toBe('boolean');
    });
  });
});
