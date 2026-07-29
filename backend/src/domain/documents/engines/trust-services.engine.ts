import { Injectable, Logger } from '@nestjs/common';
import { createHash, createHmac } from 'crypto';

export interface TimestampToken {
  tokenId: string;
  documentId: string;
  contentHash: string;       // SHA-256 do conteúdo do documento
  issuedAt: string;          // Carimbo do tempo (RFC 3161 compatible)
  algorithm: 'SHA256';
  issuerAuthority: string;   // Autoridade emissora (Aura TSA)
  verificationCode: string;  // Código de verificação pública HMAC-SHA256
}

export interface IntegrityReport {
  documentId: string;
  isValid: boolean;
  contentHash: string;
  expectedHash: string;
  checkedAt: string;
  details: string;
}

/**
 * TrustServicesEngine — Motor de Serviços de Confiança Digital (TSA / PKI)
 *
 * Implementa:
 * - Carimbo do Tempo (Timestamp Authority — RFC 3161 compatible)
 * - Hash criptográfico SHA-256 de conteúdo de documentos
 * - Verificação de integridade pós-emissão
 * - Geração de código público de verificação (HMAC-SHA256)
 *
 * Em produção: integrar com TSA ICP-Brasil (ITI/Certisign/Serasa)
 *
 * Referências: ICP-Brasil MP 2.200-2/2001, P128 AECS Zero Trust, P138 ADPCDT Etapas 7, 8
 */
@Injectable()
export class TrustServicesEngine {
  private readonly logger = new Logger(TrustServicesEngine.name);
  private readonly TSA_AUTHORITY = 'Aura-TSA-ICP-Compatible-v1';
  private readonly HMAC_SECRET = process.env.TRUST_SERVICES_HMAC_SECRET ?? 'aura-trust-default-key-rotate-in-prod';

  /**
   * Gera o hash SHA-256 do conteúdo do documento.
   */
  generateContentHash(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Emite um Carimbo do Tempo (TSA Token) vinculado ao hash do documento.
   */
  issueTimestamp(documentId: string, contentHash: string): TimestampToken {
    const issuedAt = new Date().toISOString();
    const tokenId = createHash('sha256')
      .update(`${documentId}:${contentHash}:${issuedAt}`)
      .digest('hex')
      .substring(0, 32);

    // Código de verificação pública HMAC-SHA256
    const verificationCode = createHmac('sha256', this.HMAC_SECRET)
      .update(`${tokenId}:${documentId}:${contentHash}:${issuedAt}`)
      .digest('hex');

    const token: TimestampToken = {
      tokenId,
      documentId,
      contentHash,
      issuedAt,
      algorithm: 'SHA256',
      issuerAuthority: this.TSA_AUTHORITY,
      verificationCode,
    };

    this.logger.log(
      `[TrustServices] ⏱️ Carimbo do Tempo emitido para documento ${documentId} | Hash: ${contentHash.substring(0, 16)}...`,
    );

    return token;
  }

  /**
   * Verifica a integridade de um documento comparando o hash atual com o registrado.
   */
  verifyIntegrity(documentId: string, currentContent: string, expectedHash: string): IntegrityReport {
    const currentHash = this.generateContentHash(currentContent);
    const isValid = currentHash === expectedHash;
    const checkedAt = new Date().toISOString();

    this.logger.log(
      `[TrustServices] 🔍 Verificação de integridade do documento ${documentId}: ${isValid ? '✅ ÍNTEGRO' : '❌ ADULTERADO'}`,
    );

    return {
      documentId,
      isValid,
      contentHash: currentHash,
      expectedHash,
      checkedAt,
      details: isValid
        ? 'Documento íntegro: conteúdo corresponde ao hash registrado no momento da emissão.'
        : 'ALERTA: O conteúdo do documento foi alterado após a emissão. Hash não corresponde.',
    };
  }

  /**
   * Verifica um carimbo do tempo usando o código de verificação pública.
   */
  verifyTimestamp(token: TimestampToken): boolean {
    const expectedCode = createHmac('sha256', this.HMAC_SECRET)
      .update(`${token.tokenId}:${token.documentId}:${token.contentHash}:${token.issuedAt}`)
      .digest('hex');

    return expectedCode === token.verificationCode;
  }
}
