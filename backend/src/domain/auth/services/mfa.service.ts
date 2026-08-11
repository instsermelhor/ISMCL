import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomBytes, createHmac, createCipheriv, createDecipheriv, scryptSync } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

/**
 * MfaService — Serviço de Múltiplos Fatores de Autenticação (MFA / TOTP)
 *
 * Suporta:
 * - TOTP (Time-based One-Time Password — RFC 6238 / Google Authenticator)
 * - Cifragem AES-256-GCM em repouso do segredo TOTP (`mfaSecret`)
 * - 10 Códigos de Recuperação de Emergência
 * - Ativação, Desativação e Validação em 2 etapas
 *
 * Referências: P107 (AEIATP), P128 (AECS), P132 (AIFI Etapa 6), REMEDIATION-AURA-001 (R2-02)
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cifra o segredo TOTP com AES-256-GCM antes de persistir na tabela User.
   */
  encryptSecret(secret: string): string {
    if (!secret) return '';
    if (secret.startsWith('enc:gcm:v1:')) return secret;

    const masterKey = this.getMasterKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', masterKey, iv);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `enc:gcm:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Descriptografa o segredo TOTP lido da tabela User (com suporte a fallback em texto plano).
   */
  decryptSecret(cipherPayload: string): string {
    if (!cipherPayload) return '';
    if (!cipherPayload.startsWith('enc:gcm:v1:')) return cipherPayload;

    const parts = cipherPayload.split(':');
    if (parts.length !== 6) return cipherPayload;

    const masterKey = this.getMasterKey();
    const iv = Buffer.from(parts[3], 'hex');
    const authTag = Buffer.from(parts[4], 'hex');
    const encryptedText = parts[5];

    const decipher = createDecipheriv('aes-256-gcm', masterKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Gera a configuração de MFA (segredo TOTP + QR Code URI + códigos de recuperação)
   * e salva o segredo cifrado no cadastro do usuário (ainda inativo até o verify).
   */
  async setupMfaForUser(userId: string, userEmail: string): Promise<MfaSetupResponse> {
    const setup = this.generateMfaSetup(userEmail);
    const encryptedSecret = this.encryptSecret(setup.secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: encryptedSecret,
      },
    });

    this.logger.log(`[MFA] Segredo TOTP gerado e cifrado para usuário ${userId}`);
    return setup;
  }

  /**
   * Valida o código TOTP enviado e ativa definitivamente o MFA para o usuário (`mfaEnabled = true`).
   */
  async verifyAndEnableMfa(
    userId: string,
    code: string,
    providedSecret?: string,
  ): Promise<{ valid: boolean; mfaEnabled: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaSecret: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const rawSecret = providedSecret
      ? providedSecret
      : this.decryptSecret(user.mfaSecret ?? '');

    if (!rawSecret) {
      throw new BadRequestException('MFA não configurado. Execute o setup do MFA primeiro.');
    }

    const isValid = this.verifyTotp(rawSecret, code);
    if (!isValid) {
      throw new BadRequestException('Código TOTP de 6 dígitos inválido ou expirado.');
    }

    const encryptedSecret = this.encryptSecret(rawSecret);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: encryptedSecret,
      },
    });

    this.logger.log(`[MFA] ✅ MFA ATIVADO com sucesso para o usuário ${user.email} (${userId})`);
    return { valid: true, mfaEnabled: true };
  }

  /**
   * Desativa o MFA para um usuário mediante confirmação por código TOTP.
   */
  async disableMfaForUser(userId: string, code: string): Promise<{ mfaEnabled: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaSecret: true, email: true },
    });

    if (!user || !user.mfaSecret) {
      return { mfaEnabled: false };
    }

    const rawSecret = this.decryptSecret(user.mfaSecret);
    const isValid = this.verifyTotp(rawSecret, code);

    if (!isValid) {
      throw new UnauthorizedException('Código MFA inválido para confirmação de desativação.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    this.logger.warn(`[MFA] ⚠️ MFA desativado para o usuário ${user.email} (${userId})`);
    return { mfaEnabled: false };
  }

  /**
   * Gera o segredo TOTP (Base32) e QR-Code URI.
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
    if (!secret || !token || !/^\d{6}$/.test(token)) {
      return false;
    }

    const window = 1; // Permite 1 período (30s) de variação de relógio
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
  verifyRecoveryCode(
    recoveryCodes: string[],
    code: string,
  ): { valid: boolean; remainingCodes: string[] } {
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

  private getMasterKey(): Buffer {
    const raw =
      process.env.MFA_ENCRYPTION_KEY ||
      process.env.MCSI_MASTER_KEY ||
      'AuraSerMelhorDefaultMasterKey32B!';
    return scryptSync(raw, 'aura_mfa_salt', 32);
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
