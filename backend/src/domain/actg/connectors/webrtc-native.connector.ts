import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID, createHmac } from 'crypto';
import {
  ICommunicationProvider,
  ProviderSession,
  ProviderSessionUpdate,
  ProviderHealthResult,
} from '../interfaces/provider.interface';
import { ProviderType } from '../dto/actg.dto';

export interface WebRtcSignalingMessage {
  roomId: string;
  senderId: string;
  recipientId?: string;
  type: 'offer' | 'answer' | 'ice-candidate' | 'leave';
  sdp?: string;
  candidate?: Record<string, unknown>;
}

export interface WebRtcRoomState {
  roomId: string;
  appointmentId: string;
  title: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  participants: Map<string, { userId: string; role: string; joinedAt: Date }>;
  iceServers: { urls: string | string[]; credential?: string; username?: string }[];
  createdAt: Date;
}

/** TTL de chave de sala no Redis: 4 horas (14.400s) */
const ROOM_TTL_MS = 14400 * 1000;

/** TTL de chave de sinalização no Redis: 2 horas (7.200s) */
const SIGNAL_TTL_MS = 7200 * 1000;

/**
 * WebRtcNativeConnector — Conector e Motor de Teleconsulta WebRTC Nativo
 *
 * Provedor de teleconsulta próprio (in-house) que não depende de nenhuma API
 * externa (Google Meet, Teams, Zoom, Jitsi). Atua como fallback definitivo
 * quando todos os provedores SaaS terceiros estão fora do ar.
 *
 * Suporta armazenamento de salas e sinalizações em Redis com fallback em memória
 * para suporte a escala horizontal (multi-pod).
 *
 * Referências: REMEDIATION-AURA-001 (R3-04 / GAP-P3-04), ANO-002 (Sprint R4), ADR-188
 */
@Injectable()
export class WebRtcNativeConnector implements ICommunicationProvider {
  readonly providerType = ProviderType.WEBRTC_NATIVE;
  private readonly logger = new Logger(WebRtcNativeConnector.name);

  // Armazenamento em memória local (fallback quando Redis indisponível)
  private readonly rooms = new Map<string, WebRtcRoomState>();
  private readonly signalMailbox = new Map<string, WebRtcSignalingMessage[]>();

  private readonly secretKey = process.env.WEBRTC_SECRET_KEY || 'AuraNativeWebRtcSecretKey2026';

  /**
   * Servidores STUN/TURN padrão para estabelecimento de conexão P2P NAT/Firewall
   */
  private readonly defaultIceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
  ];

  constructor(
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
  ) {}

  async createSession(
    appointmentId: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    title: string,
    idempotencyKey: string,
    organizerEmail?: string,
    attendeeEmails?: string[],
  ): Promise<ProviderSession> {
    this.logger.log(`[WebRtcNative] Criando sala de teleconsulta nativa para agendamento ${appointmentId}`);

    const roomId = `room-${appointmentId}`;
    const token = this.generateRoomToken(roomId, appointmentId);

    // Constrói a URL interna da plataforma sem dependência de terceiros
    const joinUrl = `/telehealth/${roomId}?token=${token}`;
    const hostJoinUrl = `/telehealth/${roomId}?token=${token}&role=HOST`;

    const roomState: WebRtcRoomState = {
      roomId,
      appointmentId,
      title,
      scheduledStart,
      scheduledEnd,
      status: 'WAITING',
      participants: new Map(),
      iceServers: this.defaultIceServers,
      createdAt: new Date(),
    };

    // Salva em memória local
    this.rooms.set(roomId, roomState);

    // Salva no Redis se disponível (ANO-002 multi-pod scaling)
    if (this.cacheManager) {
      try {
        await this.cacheManager.set(`webrtc:room:${roomId}`, JSON.stringify(this.serializeRoom(roomState)), ROOM_TTL_MS);
      } catch (err: any) {
        this.logger.warn(`[WebRtcNative] Falha ao salvar sala no Redis (usando fallback local): ${err.message}`);
      }
    }

    return {
      externalMeetingId: roomId,
      joinUrl,
      hostJoinUrl,
      providerType: this.providerType,
      rawMetadata: {
        roomId,
        appointmentId,
        iceServers: this.defaultIceServers,
        isNativeFallback: true,
      },
    };
  }

  async updateSession(
    externalMeetingId: string,
    update: ProviderSessionUpdate,
  ): Promise<ProviderSession> {
    let room = await this.getRoomDetailsAsync(externalMeetingId);
    if (room) {
      if (update.title) room.title = update.title;
      if (update.scheduledStart) room.scheduledStart = update.scheduledStart;
      if (update.scheduledEnd) room.scheduledEnd = update.scheduledEnd;

      this.rooms.set(externalMeetingId, room);
      if (this.cacheManager) {
        try {
          await this.cacheManager.set(`webrtc:room:${externalMeetingId}`, JSON.stringify(this.serializeRoom(room)), ROOM_TTL_MS);
        } catch {}
      }
    }

    const token = this.generateRoomToken(externalMeetingId, room?.appointmentId ?? externalMeetingId);
    return {
      externalMeetingId,
      joinUrl: `/telehealth/${externalMeetingId}?token=${token}`,
      providerType: this.providerType,
    };
  }

  async cancelSession(externalMeetingId: string, reason?: string): Promise<void> {
    this.logger.log(`[WebRtcNative] Encerrando sala ${externalMeetingId}. Motivo: ${reason ?? 'Solicitado'}`);
    const room = await this.getRoomDetailsAsync(externalMeetingId);
    if (room) {
      room.status = 'ENDED';
      this.rooms.set(externalMeetingId, room);
      if (this.cacheManager) {
        try {
          await this.cacheManager.set(`webrtc:room:${externalMeetingId}`, JSON.stringify(this.serializeRoom(room)), ROOM_TTL_MS);
        } catch {}
      }
    }
    this.signalMailbox.delete(externalMeetingId);
    if (this.cacheManager) {
      try {
        await this.cacheManager.del(`webrtc:signals:${externalMeetingId}`);
      } catch {}
    }
  }

  async checkHealth(): Promise<ProviderHealthResult> {
    // Provedor nativo está sempre ONLINE pois executa dentro do próprio processo da plataforma
    return {
      status: 'ONLINE',
      latencyMs: 1,
      message: 'Motor WebRTC Nativo operando normalmente (Sem dependências externas).',
    };
  }

  // ── Engine de Sinalização WebRTC (Signaling Exchange) ──────────────────────

  /**
   * Processa a troca de sinalização WebRTC (Offer, Answer, ICE Candidates) entre pares.
   */
  async handleSignaling(message: WebRtcSignalingMessage): Promise<void> {
    const { roomId, senderId } = message;
    if (!roomId || !senderId) {
      throw new Error('Sinalização inválida: roomId e senderId são obrigatórios.');
    }

    // 1. Atualiza mailbox local
    let mailbox = this.signalMailbox.get(roomId);
    if (!mailbox) {
      mailbox = [];
      this.signalMailbox.set(roomId, mailbox);
    }
    mailbox.push(message);
    if (mailbox.length > 100) {
      mailbox.shift();
    }

    // 2. Atualiza Redis se disponível (ANO-002 multi-pod)
    if (this.cacheManager) {
      try {
        let redisMailbox: WebRtcSignalingMessage[] = [];
        const raw = await this.cacheManager.get<string>(`webrtc:signals:${roomId}`);
        if (raw) {
          redisMailbox = typeof raw === 'string' ? JSON.parse(raw) : raw;
        }
        redisMailbox.push(message);
        if (redisMailbox.length > 100) {
          redisMailbox.shift();
        }
        await this.cacheManager.set(`webrtc:signals:${roomId}`, JSON.stringify(redisMailbox), SIGNAL_TTL_MS);
      } catch (err: any) {
        this.logger.warn(`[WebRtcNative] Falha ao salvar sinal no Redis: ${err.message}`);
      }
    }

    // Atualiza status da sala para IN_PROGRESS se oferta/resposta enviada
    const room = await this.getRoomDetailsAsync(roomId);
    if (room && room.status === 'WAITING' && (message.type === 'offer' || message.type === 'answer')) {
      room.status = 'IN_PROGRESS';
      this.rooms.set(roomId, room);
      if (this.cacheManager) {
        try {
          await this.cacheManager.set(`webrtc:room:${roomId}`, JSON.stringify(this.serializeRoom(room)), ROOM_TTL_MS);
        } catch {}
      }
    }
  }

  /**
   * Recupera mensagens de sinalização pendentes para um participante (síncrono / local).
   */
  getSignalingMessages(roomId: string, recipientId: string): WebRtcSignalingMessage[] {
    const mailbox = this.signalMailbox.get(roomId);
    if (!mailbox) return [];

    return mailbox.filter(
      (m) => m.senderId !== recipientId && (!m.recipientId || m.recipientId === recipientId),
    );
  }

  /**
   * Recupera mensagens de sinalização pendentes via Redis ou local (assíncrono).
   */
  async getSignalingMessagesAsync(roomId: string, recipientId: string): Promise<WebRtcSignalingMessage[]> {
    if (this.cacheManager) {
      try {
        const raw = await this.cacheManager.get<string>(`webrtc:signals:${roomId}`);
        if (raw) {
          const mailbox: WebRtcSignalingMessage[] = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return mailbox.filter(
            (m) => m.senderId !== recipientId && (!m.recipientId || m.recipientId === recipientId),
          );
        }
      } catch {}
    }
    return this.getSignalingMessages(roomId, recipientId);
  }

  /**
   * Retorna os metadados completos de uma sala WebRTC nativa (síncrono / local).
   */
  getRoomDetails(roomId: string): WebRtcRoomState | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Retorna os metadados completos de uma sala WebRTC nativa via Redis ou local (assíncrono).
   */
  async getRoomDetailsAsync(roomId: string): Promise<WebRtcRoomState | undefined> {
    if (this.cacheManager) {
      try {
        const raw = await this.cacheManager.get<string>(`webrtc:room:${roomId}`);
        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return this.deserializeRoom(parsed);
        }
      } catch {}
    }
    return this.rooms.get(roomId);
  }

  // ── Helpers Privados ───────────────────────────────────────────────────────

  private generateRoomToken(roomId: string, appointmentId: string): string {
    const hmac = createHmac('sha256', this.secretKey);
    hmac.update(`${roomId}:${appointmentId}`);
    return hmac.digest('hex').slice(0, 16);
  }

  private serializeRoom(room: WebRtcRoomState): any {
    return {
      ...room,
      participants: Array.from(room.participants.entries()),
    };
  }

  private deserializeRoom(data: any): WebRtcRoomState {
    return {
      ...data,
      scheduledStart: new Date(data.scheduledStart),
      scheduledEnd: new Date(data.scheduledEnd),
      createdAt: new Date(data.createdAt),
      participants: new Map(data.participants || []),
    };
  }
}
