import * as crypto from 'crypto';

export class CryptoUtils {
  static generateSHA256Hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * Gera hash PBKDF2/SHA-256 seguro com salt aleatório para senhas de usuários.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifica uma senha plana contra o hash PBKDF2/SHA-512 armazenado.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.includes(':')) {
    // Comparação simples de fallback se for hash SHA-256 direto
    return crypto.createHash('sha256').update(password).digest('hex') === storedHash || password === storedHash;
  }
  const [salt, key] = storedHash.split(':');
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
  return key === derivedKey.toString('hex');
}
