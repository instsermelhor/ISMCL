import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EhrCryptoService {
  private readonly logger = new Logger(EhrCryptoService.name);
  private readonly masterKey: Buffer;
  private readonly PREFIX = 'enc:gcm:v1:';

  constructor() {
    const rawKey = process.env.EHR_ENCRYPTION_KEY || process.env.MCSI_MASTER_KEY;
    if (rawKey) {
      if (rawKey.length === 64) {
        this.masterKey = Buffer.from(rawKey, 'hex');
      } else {
        try {
          this.masterKey = Buffer.from(rawKey, 'base64');
        } catch {
          this.masterKey = crypto.scryptSync(rawKey, 'aura-ehr-salt', 32);
        }
      }
      if (this.masterKey.length !== 32) {
        this.masterKey = crypto.scryptSync(rawKey, 'aura-ehr-salt', 32);
      }
    } else {
      this.masterKey = crypto.scryptSync('AuraEhrMasterDefaultEncryptionKeySeed', 'aura-ehr-salt', 32);
    }
  }

  /**
   * Criptografa um texto claro utilizando AES-256-GCM
   * Retorna string formatada: `enc:gcm:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>`
   */
  encrypt(plaintext: string | null | undefined): string | null {
    if (!plaintext) return null;
    if (plaintext.startsWith(this.PREFIX)) {
      return plaintext; // Já está criptografado
    }

    try {
      const iv = crypto.randomBytes(12); // IV de 12 bytes para AES-256-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag().toString('hex');
      return `${this.PREFIX}${iv.toString('hex')}:${tag}:${encrypted}`;
    } catch (err: any) {
      this.logger.error(`Erro ao criptografar campo clínico: ${err.message}`);
      throw new InternalServerErrorException('Falha no motor criptográfico do Prontuário Eletrônico.');
    }
  }

  /**
   * Descriptografa um texto cifrado formatado com a chave master
   */
  decrypt(cipherPayload: string | null | undefined): string | null {
    if (!cipherPayload) return null;
    if (!cipherPayload.startsWith(this.PREFIX)) {
      return cipherPayload; // Texto legível antigo ou não criptografado
    }

    try {
      const payloadWithoutPrefix = cipherPayload.substring(this.PREFIX.length);
      const parts = payloadWithoutPrefix.split(':');
      if (parts.length !== 3) {
        return cipherPayload;
      }

      const [ivHex, tagHex, ciphertextHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err: any) {
      this.logger.error(`Erro ao descriptografar campo clínico: ${err.message}`);
      return '[DADO CLÍNICO PROTEGIDO — FALHA DE DECRIPTOGRAFIA]';
    }
  }

  /**
   * Criptografa múltiplos campos de um objeto
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
   * Descriptografa múltiplos campos de um objeto
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
}
