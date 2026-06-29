import { Injectable, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { EncryptionService } from '../../shared/services/encryption.service.ts'; // Gerencia AWS KMS AES-256
import { CryptoUtils } from '../../shared/utils/crypto.utils.ts';
import { AuditLogService } from '../../shared/services/audit-log.service.ts';

/**
 * SERVIÇO CLINICO: GESTÃO DE EVOLUÇÕES E PRONTUÁRIOS (EMR)
 * Responsável pelas lógicas de negócio vitais do prontuário: Criptografia, 
 * Sigilo Multidisciplinar e Imutabilidade (CFM/CRP compliance).
 */
@Injectable()
export class EmrEvolutionService {
  constructor(
    @Inject('db') private readonly db: any, // Injeção hipotética do repositório/ORM (Prisma/TypeORM)
    @Inject('EncryptionService') private readonly encryption: EncryptionService,
    @Inject('AuditLogService') private readonly audit: AuditLogService
  ) {}

  /**
   * Salva um Rascunho (Auto-save) da evolução de forma transparente, criptografando o conteúdo.
   */
  async saveDraft(caseId: string, professionalId: string, beneficiaryId: string, plainTextContent: string) {
    // 1. Validação de Vínculo: O Profissional pertence a este caso?
    await this.verifyProfessionalCaseAccess(caseId, professionalId);

    // 2. Criptografia em Nível de Aplicação (Nenhum texto claro vai para o Banco)
    const encryptedContent = await this.encryption.encrypt(plainTextContent, { 
      contextId: beneficiaryId 
    });

    // 3. Salva ou atualiza a tabela clinicalEvolution com status 'DRAFT'
    const draft = await this.db.clinicalEvolution.upsert({
      where: { caseId_professionalId_status: { caseId, professionalId, status: 'DRAFT' } },
      update: { contentEncrypted: encryptedContent, updatedAt: new Date() },
      create: {
        caseId,
        beneficiaryId,
        professionalId,
        contentEncrypted: encryptedContent,
        status: 'DRAFT',
        clinicalDate: new Date(),
        visibility: 'PRIVATE_TO_AUTHOR', // Sigilo por padrão
      }
    });

    return { id: draft.id, status: 'DRAFT' };
  }

  /**
   * Assina e Tranca a Evolução. Torna-a imutável.
   */
  async signAndLockEvolution(evolutionId: string, professionalId: string, plainTextContent: string) {
    const evolution = await this.db.clinicalEvolution.findById(evolutionId);

    if (evolution.status !== 'DRAFT') {
      throw new BadRequestException('Apenas evoluções em rascunho podem ser assinadas.');
    }
    if (evolution.professionalId !== professionalId) {
      throw new ForbiddenException('Apenas o autor pode assinar esta evolução.');
    }

    // 1. Criptografa conteúdo final
    const encryptedContent = await this.encryption.encrypt(plainTextContent, { 
      contextId: evolution.beneficiaryId 
    });

    // 2. Gera Hash Criptográfico para integridade (Imutabilidade estrutural)
    const integrityHash = CryptoUtils.generateSHA256Hash(encryptedContent + evolutionId + new Date().toISOString());

    // 3. Atualiza status e assina
    const lockedEvolution = await this.db.clinicalEvolution.update({
      where: { id: evolutionId },
      data: {
        contentEncrypted: encryptedContent,
        status: 'SIGNED',
        digitalSignatureHash: integrityHash,
        signedAt: new Date()
      }
    });

    // 4. Trilha de Auditoria Estrita
    await this.audit.logStrict({
      actorId: professionalId,
      portalOrigin: 'CLINIC',
      actionType: 'SIGN_MEDICAL_RECORD',
      targetEntity: 'MEDICAL_RECORD',
      targetEntityId: evolutionId
    });

    return lockedEvolution;
  }

  /**
   * Verifica se o profissional tem acesso de leitura/escrita no Caso
   */
  private async verifyProfessionalCaseAccess(caseId: string, professionalId: string) {
    const caseLink = await this.db.caseProfessional.findUnique({
      where: { caseId_professionalId: { caseId, professionalId } }
    });
    if (!caseLink) {
      throw new ForbiddenException('Violação de Sigilo: Profissional não vinculado ao caso.');
    }
    return true;
  }
}
