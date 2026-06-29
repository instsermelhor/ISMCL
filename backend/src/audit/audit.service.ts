import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AuditService {
  private readonly auditSecret: string;

  constructor(@Inject('db') private readonly db: any) {
    this.auditSecret = process.env.MCSI_AUDIT_SECRET || 'AuraSerMelhorDefaultAuditSecretKey';
  }

  /**
   * Grava um log na base de dados (SecurityAuditLog) e cria o registro de integridade assinado (AuditLogSignature).
   */
  async log(data: {
    actorId: string;
    actorName?: string;
    role?: string;
    action: string; // VIEW_VAULT, BREAK_GLASS, EXPORT, PRINT, etc.
    targetEntity: string; // BENEFICIARY, PRONTUARIO, ETC.
    targetEntityId: string;
    justification?: string | null;
    ipAddress: string;
    userAgent: string;
  }): Promise<string> {
    try {
      // 1. Busca a última assinatura de log para obter o hash anterior
      const lastSignature = await this.db.auditLogSignature.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      
      const previousLogHash = lastSignature
        ? lastSignature.logHash
        : '0000000000000000000000000000000000000000000000000000000000000000';
      
      // 2. Cria o log de auditoria no banco
      const auditLog = await this.db.securityAuditLog.create({
        data: {
          actorId: data.actorId,
          actorName: data.actorName || 'UNKNOWN',
          role: data.role || 'UNKNOWN',
          action: data.action,
          targetEntity: data.targetEntity,
          targetEntityId: data.targetEntityId,
          justification: data.justification || null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        }
      });
      
      // 3. Serializa o conteúdo estruturado do log para hash (garantindo consistência de chaves e campos)
      const logContent = JSON.stringify({
        id: auditLog.id,
        actorId: auditLog.actorId,
        action: auditLog.action,
        targetEntity: auditLog.targetEntity,
        targetEntityId: auditLog.targetEntityId,
        justification: auditLog.justification,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        timestamp: auditLog.timestamp.toISOString(),
        previousLogHash
      });
      
      // 4. Calcula o Hash SHA-256 do log concatenado com o anterior
      const logHash = crypto.createHash('sha256').update(logContent).digest('hex');
      
      // 5. Assina o hash com HMAC-SHA256 usando o segredo de auditoria
      const signature = crypto.createHmac('sha256', this.auditSecret).update(logHash).digest('hex');
      
      // 6. Grava a assinatura no banco para auditoria futura
      await this.db.auditLogSignature.create({
        data: {
          logId: auditLog.id,
          logHash,
          previousLogHash,
          signature
        }
      });
      
      return auditLog.id;
    } catch (err: any) {
      throw new InternalServerErrorException(`Erro ao gravar log de auditoria imutável: ${err.message}`);
    }
  }

  /**
   * Registra um incidente de segurança (tentativa de acesso não autorizado)
   */
  async logSecurityIncident(data: {
    actorId: string;
    type: string;
    targetEntityId: string;
    justification?: string;
  }): Promise<void> {
    await this.log({
      actorId: data.actorId,
      action: data.type,
      targetEntity: 'BENEFICIARY',
      targetEntityId: data.targetEntityId,
      justification: data.justification || 'TENTATIVA DE ACESSO NÃO AUTORIZADO - BLOQUEIO MCSI',
      ipAddress: '0.0.0.0', // Será preenchido com IP da requisição se chamado via middleware
      userAgent: 'SECURITY_ENGINE'
    });
  }

  /**
   * Varre toda a base de logs e valida o encadeamento dos hashes e as assinaturas.
   * Retorna um relatório apontando falha de integridade se houver deleção ou adulteração de logs.
   */
  async verifyChainIntegrity(): Promise<{ isValid: boolean; brokenLogId: string | null; message: string }> {
    try {
      const signatures = await this.db.auditLogSignature.findMany({
        orderBy: { createdAt: 'asc' }
      });
      
      let expectedPreviousHash = '0000000000000000000000000000000000000000000000000000000000000000';
      
      for (const sig of signatures) {
        // A. Valida se o encadeamento aponta para o hash correto do log anterior
        if (sig.previousLogHash !== expectedPreviousHash) {
          return {
            isValid: false,
            brokenLogId: sig.logId,
            message: `Quebra no encadeamento de hashes detectada no log ${sig.logId}. Hash esperado: ${expectedPreviousHash}, Hash registrado: ${sig.previousLogHash}`
          };
        }
        
        // B. Carrega o log de auditoria original correspondente
        const log = await this.db.securityAuditLog.findUnique({
          where: { id: sig.logId }
        });
        
        if (!log) {
          return {
            isValid: false,
            brokenLogId: sig.logId,
            message: `Log original correspondente ao ID ${sig.logId} foi excluído do banco de dados (quebra de integridade).`
          };
        }
        
        // C. Reconstrói o conteúdo estruturado para recalcular o hash
        const logContent = JSON.stringify({
          id: log.id,
          actorId: log.actorId,
          action: log.action,
          targetEntity: log.targetEntity,
          targetEntityId: log.targetEntityId,
          justification: log.justification,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          timestamp: log.timestamp.toISOString(),
          previousLogHash: sig.previousLogHash
        });
        
        const computedHash = crypto.createHash('sha256').update(logContent).digest('hex');
        
        // D. Compara o hash calculado com o hash persistido na assinatura
        if (computedHash !== sig.logHash) {
          return {
            isValid: false,
            brokenLogId: sig.logId,
            message: `Adulteração detectada no log ${sig.logId}. O hash calculado não coincide com o hash gravado.`
          };
        }
        
        // E. Valida se a assinatura digital do hash é autêntica
        const computedSig = crypto.createHmac('sha256', this.auditSecret).update(computedHash).digest('hex');
        if (computedSig !== sig.signature) {
          return {
            isValid: false,
            brokenLogId: sig.logId,
            message: `Assinatura de auditoria inválida para o log ${sig.logId}. Possível tentativa de forjar logs.`
          };
        }
        
        expectedPreviousHash = sig.logHash;
      }
      
      return {
        isValid: true,
        brokenLogId: null,
        message: 'A cadeia de logs de auditoria está 100% íntegra.'
      };
    } catch (err: any) {
      return {
        isValid: false,
        brokenLogId: null,
        message: `Falha técnica durante o teste de integridade da cadeia de logs: ${err.message}`
      };
    }
  }
}
