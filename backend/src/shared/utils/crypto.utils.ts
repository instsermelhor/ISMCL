import * as crypto from 'crypto';

export class CryptoUtils {
  static generateSHA256Hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
