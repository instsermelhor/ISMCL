import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class VaultService {
  private readonly masterKey: Buffer;

  constructor() {
    // Carrega a Master Key (KEK) do ambiente ou gera uma temporária para desenvolvimento local
    const rawKey = process.env.MCSI_MASTER_KEY;
    if (rawKey) {
      this.masterKey = Buffer.from(rawKey, 'base64');
      if (this.masterKey.length !== 32) {
        throw new Error('MCSI_MASTER_KEY deve possuir exatamente 32 bytes codificados em base64.');
      }
    } else {
      console.warn(
        'WARNING: MCSI_MASTER_KEY não configurada. Gerando chave temporária em memória para fins de desenvolvimento.'
      );
      // Gera uma chave determinística para desenvolvimento com base em uma semente ou chave estática
      this.masterKey = crypto.scryptSync('AuraSerMelhorDefaultSecurityKeySeed', 'salt', 32);
    }
  }

  /**
   * Criptografa um dado utilizando uma Data Encryption Key (DEK)
   */
  private encryptField(text: string, dek: Buffer): { ciphertext: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12); // IV de 12 bytes recomendado para GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag().toString('hex');
    
    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      tag: tag
    };
  }

  /**
   * Descriptografa um dado utilizando uma Data Encryption Key (DEK)
   */
  private decryptField(ciphertext: string, ivHex: string, tagHex: string, dek: Buffer): string {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Criptografa a DEK com a KEK (Master Key)
   */
  private encryptDEK(dek: Buffer): { encryptedDEK: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    
    let encrypted = cipher.update(dek);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const tag = cipher.getAuthTag().toString('hex');
    
    return {
      encryptedDEK: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag
    };
  }

  /**
   * Descriptografa a DEK utilizando a KEK (Master Key)
   */
  private decryptDEK(encryptedDEKHex: string, ivHex: string, tagHex: string): Buffer {
    const encryptedDEK = Buffer.from(encryptedDEKHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedDEK);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  /**
   * Prepara os dados brutos e gera a estrutura criptografada para inserção no SecureVault
   */
  async encryptVault(fields: Record<string, any>): Promise<{
    encryptedData: Record<string, string>;
    ivMap: Record<string, { iv: string; tag: string }>;
    encryptedDekMeta: string; // Armazenado no keyId do SecureVault
  }> {
    try {
      // 1. Gera uma nova DEK aleatória para este perfil
      const dek = crypto.randomBytes(32);
      
      // 2. Criptografa a DEK com a KEK
      const { encryptedDEK, iv: dekIv, tag: dekTag } = this.encryptDEK(dek);
      // Serializa os metadados da DEK no keyId (formato: encryptedDEK:iv:tag)
      const encryptedDekMeta = `${encryptedDEK}:${dekIv}:${dekTag}`;
      
      const encryptedData: Record<string, string> = {};
      const ivMap: Record<string, { iv: string; tag: string }> = {};
      
      // 3. Criptografa cada campo individualmente
      for (const [key, value] of Object.entries(fields)) {
        if (value === null || value === undefined) continue;
        
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        const { ciphertext, iv, tag } = this.encryptField(stringValue, dek);
        
        encryptedData[key] = ciphertext;
        ivMap[key] = { iv, tag };
      }
      
      return {
        encryptedData,
        ivMap,
        encryptedDekMeta
      };
    } catch (err: any) {
      throw new InternalServerErrorException(`Erro no motor de criptografia (Vault): ${err.message}`);
    }
  }

  /**
   * Descriptografa um registro do SecureVault
   */
  async decryptVault(vaultRecord: {
    encryptedCpf?: string | null;
    encryptedAddress?: string | null;
    encryptedPhone?: string | null;
    encryptedFamilyDetails?: string | null;
    encryptedWorkplace?: string | null;
    encryptedAlternateAddrs?: string | null;
    encryptedCourtDocs?: string | null;
    ivMap: any;
    keyId: string;
  }): Promise<Record<string, any>> {
    try {
      // 1. Recupera e descriptografa a DEK
      const [encryptedDEKHex, dekIvHex, dekTagHex] = vaultRecord.keyId.split(':');
      if (!encryptedDEKHex || !dekIvHex || !dekTagHex) {
        throw new Error('Metadados da chave (DEK) corrompidos ou inválidos no registro.');
      }
      const dek = this.decryptDEK(encryptedDEKHex, dekIvHex, dekTagHex);
      
      const decryptedData: Record<string, any> = {};
      const ivMap = typeof vaultRecord.ivMap === 'string' ? JSON.parse(vaultRecord.ivMap) : vaultRecord.ivMap;
      
      // Mapeamento dos campos do banco para chaves legíveis
      const fieldsMapping: Record<string, string> = {
        encryptedCpf: 'cpf',
        encryptedAddress: 'address',
        encryptedPhone: 'phone',
        encryptedFamilyDetails: 'familyDetails',
        encryptedWorkplace: 'workplace',
        encryptedAlternateAddrs: 'alternateAddresses',
        encryptedCourtDocs: 'courtDocuments'
      };
      
      // 2. Descriptografa cada campo presente
      for (const [dbField, targetKey] of Object.entries(fieldsMapping)) {
        const ciphertext = (vaultRecord as any)[dbField];
        const ivConfig = ivMap[dbField];
        
        if (ciphertext && ivConfig) {
          const rawText = this.decryptField(ciphertext, ivConfig.iv, ivConfig.tag, dek);
          
          // Se for uma string JSON, converte de volta para objeto
          try {
            if (rawText.startsWith('{') || rawText.startsWith('[')) {
              decryptedData[targetKey] = JSON.parse(rawText);
            } else {
              decryptedData[targetKey] = rawText;
            }
          } catch {
            decryptedData[targetKey] = rawText;
          }
        } else {
          decryptedData[targetKey] = null;
        }
      }
      
      return decryptedData;
    } catch (err: any) {
      throw new InternalServerErrorException(`Erro na descriptografia do cofre: ${err.message}`);
    }
  }
}
