import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Versões de chave de criptografia suportadas pelo EhrCryptoService.
 * O prefixo do ciphertext embute a versão da chave para retrocompatibilidade
 * e suporte a key rotation sem re-criptografia imediata de dados históricos.
 *
 * Formato v1 (legado): `enc:gcm:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>`
 * Formato v2 (atual):  `enc:gcm:v2:<keyId>:<iv_hex>:<tag_hex>:<ciphertext_hex>`
 *
 * Configuração via variáveis de ambiente:
 *   EHR_ENCRYPTION_KEY          — Chave v1 (legada, hex 64 chars ou base64)
 *   EHR_ENCRYPTION_KEY_v2       — Chave v2 (nova, hex 64 chars ou base64)
 *   EHR_ENCRYPTION_KEY_ACTIVE   — Versão ativa para novos dados (padrão: 'v2' se v2 definida, senão 'v1')
 *
 * Referência: ANO-007, Sprint R4, AURA_ARCHITECTURE_REMEDIATION_PLAN.md
 */

export type KeyVersion = 'v1' | 'v2';

const PREFIX_V1 = 'enc:gcm:v1:';
const PREFIX_V2 = 'enc:gcm:v2:';

@Injectable()
export class EhrCryptoService {
  private readonly logger = new Logger(EhrCryptoService.name);

  /** Mapa de versão → Buffer da chave derivada de 32 bytes */
  private readonly keyMap = new Map<KeyVersion, Buffer>();

  /** Versão ativa para criptografar novos dados */
  private readonly activeVersion: KeyVersion;

  constructor() {
    // ── Carrega chave v1 (legada) ────────────────────────────────────────────
    const rawV1 = process.env.EHR_ENCRYPTION_KEY || process.env.MCSI_MASTER_KEY;
    if (rawV1) {
      this.keyMap.set('v1', this.deriveKey(rawV1, 'v1'));
    } else {
      // Chave default para desenvolvimento — nunca usar em produção
      this.keyMap.set('v1', crypto.scryptSync('AuraEhrMasterDefaultEncryptionKeySeed', 'aura-ehr-salt', 32));
    }

    // ── Carrega chave v2 (nova) ──────────────────────────────────────────────
    const rawV2 = process.env.EHR_ENCRYPTION_KEY_v2;
    if (rawV2) {
      this.keyMap.set('v2', this.deriveKey(rawV2, 'v2'));
    }

    // ── Determina versão ativa ───────────────────────────────────────────────
    const configuredActive = process.env.EHR_ENCRYPTION_KEY_ACTIVE as KeyVersion | undefined;
    if (configuredActive && this.keyMap.has(configuredActive)) {
      this.activeVersion = configuredActive;
    } else if (this.keyMap.has('v2')) {
      this.activeVersion = 'v2';
    } else {
      this.activeVersion = 'v1';
    }

    this.logger.log(
      `[EhrCrypto] Inicializado com ${this.keyMap.size} versão(ões) de chave. Ativa: ${this.activeVersion}`,
    );
  }

  // ── API Pública ─────────────────────────────────────────────────────────────

  /**
   * Criptografa um texto claro com a chave da versão ativa.
   * Retorna string formatada com versão da chave embutida para key rotation.
   */
  encrypt(plaintext: string | null | undefined): string | null {
    if (!plaintext) return null;
    if (plaintext.startsWith(PREFIX_V1) || plaintext.startsWith(PREFIX_V2)) {
      return plaintext; // Já está criptografado — idempotente
    }

    const key = this.keyMap.get(this.activeVersion);
    if (!key) {
      throw new InternalServerErrorException(
        `[EhrCrypto] Chave da versão ativa '${this.activeVersion}' não disponível.`,
      );
    }

    try {
      return this.encryptWithKey(plaintext, key, this.activeVersion);
    } catch (err: any) {
      this.logger.error(`[EhrCrypto] Erro ao criptografar: ${err.message}`);
      throw new InternalServerErrorException('Falha no motor criptográfico do Prontuário Eletrônico.');
    }
  }

  /**
   * Descriptografa um ciphertext detectando automaticamente a versão da chave
   * pelo prefixo embutido. Suporta v1 (legado) e v2 simultaneamente.
   */
  decrypt(cipherPayload: string | null | undefined): string | null {
    if (!cipherPayload) return null;

    try {
      if (cipherPayload.startsWith(PREFIX_V2)) {
        return this.decryptV2(cipherPayload);
      }
      if (cipherPayload.startsWith(PREFIX_V1)) {
        return this.decryptV1(cipherPayload);
      }
      // Texto legível antigo (não criptografado) — retrocompatibilidade
      return cipherPayload;
    } catch (err: any) {
      this.logger.error(`[EhrCrypto] Erro ao descriptografar: ${err.message}`);
      return '[DADO CLÍNICO PROTEGIDO — FALHA DE DECRIPTOGRAFIA]';
    }
  }

  /**
   * Rotaciona a chave de um ciphertext existente para a versão ativa atual.
   * Descriptografa com a chave original e re-criptografa com a chave ativa.
   * Útil para migração gradual de dados históricos.
   *
   * Retorna `null` se o ciphertext já estiver na versão ativa (sem operação necessária).
   */
  rotateKey(currentCiphertext: string | null | undefined): string | null {
    if (!currentCiphertext) return null;

    // Já está na versão ativa — nenhuma rotação necessária
    const activePrefix = this.activeVersion === 'v2' ? PREFIX_V2 : PREFIX_V1;
    if (currentCiphertext.startsWith(activePrefix)) {
      return currentCiphertext;
    }

    const plaintext = this.decrypt(currentCiphertext);
    if (!plaintext || plaintext.startsWith('[DADO CLÍNICO PROTEGIDO')) {
      this.logger.warn('[EhrCrypto] rotateKey: falha ao descriptografar dado existente.');
      return currentCiphertext; // Mantém original em caso de falha
    }

    const rotated = this.encrypt(plaintext);
    this.logger.log(`[EhrCrypto] Chave rotacionada de legado para versão ativa '${this.activeVersion}'.`);
    return rotated;
  }

  /**
   * Retorna a versão da chave ativa para logs e monitoramento.
   */
  getActiveVersion(): KeyVersion {
    return this.activeVersion;
  }

  /**
   * Retorna as versões de chave disponíveis (sem expor as chaves).
   */
  getAvailableVersions(): KeyVersion[] {
    return Array.from(this.keyMap.keys());
  }

  /**
   * Criptografa múltiplos campos de um objeto com a chave ativa.
   */
  encryptFields<T extends Record<string, any>>(data: T, fieldNames: (keyof T)[]): T {
    if (!data) return data;
    const result = { ...data };
    for (const field of fieldNames) {
      if (typeof result[field] === 'string') {
        (result[field] as any) = this.encrypt(result[field] as string);
      }
    }
    return result;
  }

  /**
   * Descriptografa múltiplos campos de um objeto (suporta v1 e v2 misturados).
   */
  decryptFields<T extends Record<string, any>>(data: T, fieldNames: (keyof T)[]): T {
    if (!data) return data;
    const result = { ...data };
    for (const field of fieldNames) {
      if (typeof result[field] === 'string') {
        (result[field] as any) = this.decrypt(result[field] as string);
      }
    }
    return result;
  }

  // ── Helpers Privados ────────────────────────────────────────────────────────

  /**
   * Deriva uma chave de 32 bytes a partir de raw string (hex ou base64).
   */
  private deriveKey(raw: string, version: KeyVersion): Buffer {
    if (raw.length === 64) {
      const key = Buffer.from(raw, 'hex');
      if (key.length === 32) return key;
    }
    try {
      const key = Buffer.from(raw, 'base64');
      if (key.length === 32) return key;
    } catch {}
    // Derivação via scrypt como fallback
    return crypto.scryptSync(raw, `aura-ehr-salt-${version}`, 32);
  }

  /**
   * Criptografa com uma chave específica e versão, retornando o ciphertext formatado.
   * Formato v1: `enc:gcm:v1:<iv_hex>:<tag_hex>:<ct_hex>`
   * Formato v2: `enc:gcm:v2:<keyId>:<iv_hex>:<tag_hex>:<ct_hex>`
   */
  private encryptWithKey(plaintext: string, key: Buffer, version: KeyVersion): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    if (version === 'v2') {
      // v2 embute o keyId no ciphertext para facilitar key rotation multi-versão futura
      return `${PREFIX_V2}${version}:${iv.toString('hex')}:${tag}:${encrypted}`;
    }
    // v1 legado — formato original preservado
    return `${PREFIX_V1}${iv.toString('hex')}:${tag}:${encrypted}`;
  }

  /**
   * Descriptografa formato v1: `enc:gcm:v1:<iv_hex>:<tag_hex>:<ct_hex>`
   */
  private decryptV1(cipherPayload: string): string | null {
    const key = this.keyMap.get('v1');
    if (!key) {
      throw new Error('[EhrCrypto] Chave v1 não disponível para descriptografar dado legado.');
    }

    const payload = cipherPayload.substring(PREFIX_V1.length);
    const parts = payload.split(':');
    if (parts.length !== 3) throw new Error('Formato v1 inválido');

    const [ivHex, tagHex, ctHex] = parts;
    return this.aesGcmDecrypt(key, ivHex, tagHex, ctHex);
  }

  /**
   * Descriptografa formato v2: `enc:gcm:v2:<keyId>:<iv_hex>:<tag_hex>:<ct_hex>`
   */
  private decryptV2(cipherPayload: string): string | null {
    const payload = cipherPayload.substring(PREFIX_V2.length);
    const parts = payload.split(':');
    if (parts.length !== 4) throw new Error('Formato v2 inválido');

    const [keyId, ivHex, tagHex, ctHex] = parts;
    const key = this.keyMap.get(keyId as KeyVersion);
    if (!key) {
      throw new Error(`[EhrCrypto] Chave '${keyId}' não disponível para descriptografar.`);
    }

    return this.aesGcmDecrypt(key, ivHex, tagHex, ctHex);
  }

  /**
   * Operação core AES-256-GCM de descriptografia.
   */
  private aesGcmDecrypt(key: Buffer, ivHex: string, tagHex: string, ctHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ctHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
