import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { WebRtcNativeConnector, WebRtcSignalingMessage } from './webrtc-native.connector';
import { ProviderType } from '../dto/actg.dto';

describe('WebRtcNativeConnector — Motor de Teleconsulta WebRTC Nativo (GAP-P3-04 / ANO-002)', () => {
  let connector: WebRtcNativeConnector;
  let cacheMock: any;
  let cacheStore: Map<string, string>;

  beforeEach(async () => {
    cacheStore = new Map<string, string>();
    cacheMock = {
      get: jest.fn().mockImplementation((key: string) => Promise.resolve(cacheStore.get(key))),
      set: jest.fn().mockImplementation((key: string, val: string) => {
        cacheStore.set(key, val);
        return Promise.resolve();
      }),
      del: jest.fn().mockImplementation((key: string) => {
        cacheStore.delete(key);
        return Promise.resolve();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebRtcNativeConnector,
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    }).compile();

    connector = module.get<WebRtcNativeConnector>(WebRtcNativeConnector);
  });

  describe('createSession', () => {
    it('deve criar sala de teleconsulta nativa e retornar URL de join interna sem dependências externas', async () => {
      const now = new Date();
      const end = new Date(now.getTime() + 3600000);

      const session = await connector.createSession(
        'appt-777',
        now,
        end,
        'Consulta Psicológica Aura',
        'idem-key-01',
        'dr.pedro@aura.org',
        ['beneficiario@aura.org'],
      );

      expect(session).toBeDefined();
      expect(session.externalMeetingId).toBe('room-appt-777');
      expect(session.providerType).toBe(ProviderType.WEBRTC_NATIVE);
      expect(session.joinUrl).toContain('/telehealth/room-appt-777');
      expect(session.rawMetadata?.isNativeFallback).toBe(true);
      expect(session.rawMetadata?.iceServers).toBeDefined();
      expect(cacheMock.set).toHaveBeenCalledWith(
        'webrtc:room:room-appt-777',
        expect.any(String),
        14400 * 1000,
      );
    });
  });

  describe('checkHealth', () => {
    it('deve retornar status ONLINE pois executa no próprio processo da aplicação', async () => {
      const health = await connector.checkHealth();
      expect(health.status).toBe('ONLINE');
      expect(health.latencyMs).toBeLessThanOrEqual(5);
      expect(health.message).toContain('Sem dependências externas');
    });
  });

  describe('handleSignaling & getSignalingMessages', () => {
    it('deve trocar ofertas, respostas e ICE candidates entre participantes de uma sala com suporte Redis (ANO-002)', async () => {
      const session = await connector.createSession(
        'appt-888',
        new Date(),
        new Date(Date.now() + 3600000),
        'Consulta WebRTC',
        'idem-key-888',
      );
      const roomId = session.externalMeetingId;

      const offerMsg: WebRtcSignalingMessage = {
        roomId,
        senderId: 'prof-10',
        type: 'offer',
        sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1...',
      };
      await connector.handleSignaling(offerMsg);

      const recipientMsgs = await connector.getSignalingMessagesAsync(roomId, 'ben-20');
      expect(recipientMsgs.length).toBe(1);
      expect(recipientMsgs[0].senderId).toBe('prof-10');
      expect(recipientMsgs[0].type).toBe('offer');

      const answerMsg: WebRtcSignalingMessage = {
        roomId,
        senderId: 'ben-20',
        recipientId: 'prof-10',
        type: 'answer',
        sdp: 'v=0\r\no=- 67890 2 IN IP4 127.0.0.1...',
      };
      await connector.handleSignaling(answerMsg);

      const profMsgs = await connector.getSignalingMessagesAsync(roomId, 'prof-10');
      expect(profMsgs.length).toBe(1);
      expect(profMsgs[0].type).toBe('answer');

      const roomDetails = await connector.getRoomDetailsAsync(roomId);
      expect(roomDetails?.status).toBe('IN_PROGRESS');
    });
  });

  describe('cancelSession', () => {
    it('deve encerrar a sala e limpar mailbox de sinalizações', async () => {
      const roomId = 'room-appt-999';
      await connector.createSession(
        'appt-999',
        new Date(),
        new Date(),
        'Sessão Teste',
        'idem-key-99',
      );

      await connector.handleSignaling({
        roomId,
        senderId: 'prof-10',
        type: 'offer',
        sdp: 'dummy-sdp',
      });

      await connector.cancelSession(roomId, 'Atendimento concluído pelo profissional');

      const roomDetails = await connector.getRoomDetailsAsync(roomId);
      expect(roomDetails?.status).toBe('ENDED');

      const msgs = await connector.getSignalingMessagesAsync(roomId, 'ben-20');
      expect(msgs.length).toBe(0);
    });
  });
});
