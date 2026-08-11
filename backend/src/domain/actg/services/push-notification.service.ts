import { Injectable, Logger, Optional } from '@nestjs/common';

/**
 * Payload de push notification seguindo a spec FCM v1 / APNs.
 * Campos de conteúdo respeitam a regra MCSI — títulos e corpos
 * nunca expõem diagnóstico, classificação clínica ou dado sensível.
 */
export interface PushPayload {
  /** Token FCM do dispositivo (Android/Web) ou token APNs (iOS) */
  deviceToken: string;
  /** Plataforma do dispositivo */
  platform: 'FCM' | 'APNS';
  /** Título visível na notificação */
  title: string;
  /** Corpo/mensagem da notificação */
  body: string;
  /** Dados extras para deep linking no app */
  data?: Record<string, string>;
  /** ID da notificação — usado para deduplication e agrupamento no Android */
  collapseKey?: string;
}

export interface PushResult {
  success: boolean;
  platform: 'FCM' | 'APNS';
  messageId?: string;
  error?: string;
}

/**
 * FCM v1 Message shape (simplificado para independência de @firebase/admin em testes)
 */
interface FcmMessage {
  token: string;
  notification: { title: string; body: string };
  data?: Record<string, string>;
  android?: { collapse_key?: string; priority: 'HIGH' | 'NORMAL' };
}

/**
 * PushNotificationService — Conector FCM (Android/Web) e APNs (iOS)
 *
 * Implementa o envio de Push Notifications via dois canais:
 * - FCM v1 API (Firebase Cloud Messaging) para Android e PWA
 * - APNs (Apple Push Notification service) para dispositivos iOS
 *
 * Funciona em modo DEGRADADO quando a SDK ou as credenciais não estão
 * configuradas (variável de ambiente FIREBASE_SERVICE_ACCOUNT ausente),
 * apenas registrando logs de aviso sem derrubar o processo.
 *
 * REGRA MCSI: Títulos e corpos nunca incluem diagnóstico, CID, MCSI level
 * ou qualquer dado clínico — apenas informações operacionais neutras.
 *
 * Referências: REMEDIATION-AURA-001 (R3-05 / GAP-P3-05), PRD-AURA-001
 */
@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  /** Instância do firebase-admin messaging, injetada via factory ou undefined se não configurado */
  private readonly fcmMessaging: any | undefined;

  constructor(
    @Optional() fcmMessagingToken?: any,
  ) {
    this.fcmMessaging = fcmMessagingToken ?? this.tryInitFirebase();
  }

  /**
   * Tenta inicializar o firebase-admin via variável de ambiente FIREBASE_SERVICE_ACCOUNT.
   * Se as credenciais estiverem ausentes, retorna undefined e o serviço opera em modo degradado.
   */
  private tryInitFirebase(): any | undefined {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountEnv) {
      this.logger.warn(
        '[PushNotification] FIREBASE_SERVICE_ACCOUNT não configurado. ' +
          'Push Notifications FCM operarão em modo degradado (log-only).',
      );
      return undefined;
    }

    try {
      // Importação dinâmica para não crashar em build/test sem firebase-admin instalado
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccountEnv)),
        });
      }
      this.logger.log('[PushNotification] Firebase Admin SDK inicializado com sucesso.');
      return admin.messaging();
    } catch (err) {
      this.logger.error(
        `[PushNotification] Falha ao inicializar Firebase Admin SDK: ${(err as Error).message}`,
      );
      return undefined;
    }
  }

  /**
   * Envia uma notificação push para um dispositivo via FCM ou APNs.
   */
  async send(payload: PushPayload): Promise<PushResult> {
    if (payload.platform === 'FCM') {
      return this.sendFcm(payload);
    }
    return this.sendApns(payload);
  }

  /**
   * Envia notificação via FCM v1 API.
   */
  async sendFcm(payload: PushPayload): Promise<PushResult> {
    if (!this.fcmMessaging) {
      this.logger.warn(
        `[PushNotification] FCM em modo degradado — notificação NÃO enviada para token ...${payload.deviceToken.slice(-8)}`,
      );
      return { success: false, platform: 'FCM', error: 'FCM não configurado (modo degradado)' };
    }

    const message: FcmMessage = {
      token: payload.deviceToken,
      notification: { title: payload.title, body: payload.body },
      ...(payload.data ? { data: payload.data } : {}),
      android: {
        priority: 'HIGH',
        ...(payload.collapseKey ? { collapse_key: payload.collapseKey } : {}),
      },
    };

    try {
      const messageId: string = await this.fcmMessaging.send(message);
      this.logger.log(`[PushNotification] ✅ FCM enviado (messageId: ${messageId})`);
      return { success: true, platform: 'FCM', messageId };
    } catch (err) {
      const errMsg = (err as Error).message;
      this.logger.error(`[PushNotification] ❌ Falha FCM: ${errMsg}`);
      return { success: false, platform: 'FCM', error: errMsg };
    }
  }

  /**
   * Envia notificação via APNs (Apple Push Notification service).
   *
   * Integração direta com APNs via HTTP/2 usando token p8 (JWT Bearer).
   * Usa fetch nativo do Node 18+ (sem dependência de sdk).
   */
  async sendApns(payload: PushPayload): Promise<PushResult> {
    const apnsKeyId = process.env.APNS_KEY_ID;
    const apnsTeamId = process.env.APNS_TEAM_ID;
    const apnsPrivateKey = process.env.APNS_PRIVATE_KEY;
    const apnsBundleId = process.env.APNS_BUNDLE_ID ?? 'br.org.sermelhor.aura';
    const apnsEnv = (process.env.APNS_ENV ?? 'sandbox') as 'sandbox' | 'production';

    if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
      this.logger.warn(
        '[PushNotification] APNs em modo degradado — credenciais APNS_* ausentes. Push iOS NÃO enviado.',
      );
      return { success: false, platform: 'APNS', error: 'APNs não configurado (modo degradado)' };
    }

    try {
      const jwtToken = await this.buildApnsJwt(apnsKeyId, apnsTeamId, apnsPrivateKey);
      const host =
        apnsEnv === 'production'
          ? 'https://api.push.apple.com'
          : 'https://api.sandbox.push.apple.com';

      const response = await fetch(`${host}/3/device/${payload.deviceToken}`, {
        method: 'POST',
        headers: {
          authorization: `bearer ${jwtToken}`,
          'apns-topic': apnsBundleId,
          'apns-push-type': 'alert',
          'apns-priority': '10',
          'content-type': 'application/json',
          ...(payload.collapseKey ? { 'apns-collapse-id': payload.collapseKey } : {}),
        },
        body: JSON.stringify({
          aps: {
            alert: { title: payload.title, body: payload.body },
            sound: 'default',
          },
          ...(payload.data ?? {}),
        }),
      });

      if (response.ok) {
        const apnsId = response.headers.get('apns-id') ?? 'unknown';
        this.logger.log(`[PushNotification] ✅ APNs enviado (apns-id: ${apnsId})`);
        return { success: true, platform: 'APNS', messageId: apnsId };
      }

      const errorBody = await response.text();
      this.logger.error(`[PushNotification] ❌ Falha APNs HTTP ${response.status}: ${errorBody}`);
      return { success: false, platform: 'APNS', error: `HTTP ${response.status}: ${errorBody}` };
    } catch (err) {
      const errMsg = (err as Error).message;
      this.logger.error(`[PushNotification] ❌ Falha APNs: ${errMsg}`);
      return { success: false, platform: 'APNS', error: errMsg };
    }
  }

  /**
   * Gera o JWT Bearer para autenticação APNs (Token-Based Authentication — p8 key).
   */
  private async buildApnsJwt(keyId: string, teamId: string, privateKey: string): Promise<string> {
    const { createSign } = await import('crypto');
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({ iss: teamId, iat: now })).toString('base64url');
    const unsigned = `${header}.${payload}`;
    const sign = createSign('SHA256');
    sign.update(unsigned);
    const signature = sign.sign(privateKey, 'base64url');
    return `${unsigned}.${signature}`;
  }

  /**
   * Verifica se o serviço FCM está configurado e funcional.
   */
  isFcmConfigured(): boolean {
    return !!this.fcmMessaging;
  }

  /**
   * Verifica se as credenciais APNs estão disponíveis.
   */
  isApnsConfigured(): boolean {
    return !!(
      process.env.APNS_KEY_ID &&
      process.env.APNS_TEAM_ID &&
      process.env.APNS_PRIVATE_KEY
    );
  }
}
