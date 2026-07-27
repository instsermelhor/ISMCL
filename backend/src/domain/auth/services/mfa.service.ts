import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { randomBytes, createHmac } from 'crypto';

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

/**
 * MfaService — Serviço de Múltiplos Fatores de Autenticação (MFA / 2FA)
 *
 * Suporta:
 * - TOTP (Time-based One-Time Password — RFC 6238 / Google Authenticator)
 * - Recovery Codes (10 códigos de uso único de emergência)
 * - Validação com tolerância de janela (clock skew)
 *
 * Referências: P107 (AEIATP), P128 (AECS), P132 (AIFI Etapa 6)
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  /**
   * Gera o segredo TOTP e 10 códigos de recuperação.
   */
  generateMfaSetup(userEmail: string): MfaSetupResponse {
    const secretBuffer = randomBytes(20);
    const secret = this.base32Encode(secretBuffer);

    const issuer = encodeURIComponent('Aura — Instituto Ser Melhor');
    const account = encodeURIComponent(userEmail);
    const qrCodeUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    const recoveryCodes = Array.from({ length: 10 }, () =>
      randomBytes(4).toString('hex').toUpperCase(),
    );

    return {
      secret,
      qrCodeUrl,
      recoveryCodes,
    };
  }

  /**
   * Valida o token TOTP de 6 dígitos informado pelo usuário.
   */
  verifyTotp(secret: string, token: string): boolean {
    if (!token || !/^\d{6}$/.test(token)) {
      return false;
    }

    const window = 1; // Permite 1 período (30s) antes ou depois
    const timeStep = 30;
    const now = Math.floor(Date.now() / 1000);

    for (let i = -window; i <= window; i++) {
      const counter = Math.floor((now + i * timeStep) / timeStep);
      const generated = this.generateTotpToken(secret, counter);
      if (generated === token) {
        return true;
      }
    }

    return false;
  }

  /**
   * Valida se um código de recuperação fornecido é válido.
   */
  verifyRecoveryCode(recoveryCodes: string[], code: string): { valid: boolean; remainingCodes: string[] } {
    const uppercaseCode = code.trim().toUpperCase();
    const index = recoveryCodes.indexOf(uppercaseCode);

    if (index === -1) {
      return { valid: false, remainingCodes: recoveryCodes };
    }

    const remainingCodes = [...recoveryCodes];
    remainingCodes.splice(index, 1);
    this.logger.warn(`[MFA] Código de recuperação de emergência consumido.`);

    return { valid: true, remainingCodes };
  }

  private generateTotpToken(secretBase32: string, counter: number): string {
    const key = this.base32Decode(secretBase32);
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));

    const hmac = createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;

    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    return otp;
  }

  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private base32Decode(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = input.toUpperCase().replace(/=/g, '');
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (let i = 0; i < cleaned.length; i++) {
      const idx = alphabet.indexOf(cleaned[i]);
      if (idx === -1) throw new BadRequestException('Segredo Base32 inválido.');

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(output);
  }
}
