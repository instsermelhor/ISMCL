import { Test, TestingModule } from '@nestjs/testing';
import { WebRtcNativeConnector, WebRtcSignalingMessage } from './webrtc-native.connector';
import { ProviderType } from '../dto/actg.dto';

describe('WebRtcNativeConnector — Motor de Teleconsulta WebRTC Nativo (GAP-P3-04)', () => {
  let connector: WebRtcNativeConnector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebRtcNativeConnector],
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
    it('deve trocar ofertas, respostas e ICE candidates entre participantes de uma sala', async () => {
      // Cria a sala primeiro via createSession para que o roomId exista no registry
      const session = await connector.createSession(
        'appt-888',
        new Date(),
        new Date(Date.now() + 3600000),
        'Consulta WebRTC',
        'idem-key-888',
      );
      const roomId = session.externalMeetingId; // 'room-appt-888'

      // 1. Médica envia oferta (Offer)
      const offerMsg: WebRtcSignalingMessage = {
        roomId,
        senderId: 'prof-10',
        type: 'offer',
        sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1...',
      };
      await connector.handleSignaling(offerMsg);

      // 2. Beneficiário busca mensagens de sinalização pendentes
      const recipientMsgs = connector.getSignalingMessages(roomId, 'ben-20');
      expect(recipientMsgs.length).toBe(1);
      expect(recipientMsgs[0].senderId).toBe('prof-10');
      expect(recipientMsgs[0].type).toBe('offer');

      // O próprio remetente (prof-10) não deve ver sua própria oferta ao consultar
      const senderMsgs = connector.getSignalingMessages(roomId, 'prof-10');
      expect(senderMsgs.length).toBe(0);

      // 3. Beneficiário envia resposta (Answer)
      const answerMsg: WebRtcSignalingMessage = {
        roomId,
        senderId: 'ben-20',
        recipientId: 'prof-10',
        type: 'answer',
        sdp: 'v=0\r\no=- 67890 2 IN IP4 127.0.0.1...',
      };
      await connector.handleSignaling(answerMsg);

      // Médica consulta e deve receber a resposta
      const profMsgs = connector.getSignalingMessages(roomId, 'prof-10');
      expect(profMsgs.length).toBe(1);
      expect(profMsgs[0].type).toBe('answer');

      // Verifica se status da sala mudou para IN_PROGRESS após offer+answer
      const roomDetails = connector.getRoomDetails(roomId);
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

      const roomDetails = connector.getRoomDetails(roomId);
      expect(roomDetails?.status).toBe('ENDED');

      const msgs = connector.getSignalingMessages(roomId, 'ben-20');
      expect(msgs.length).toBe(0);
    });
  });
});
