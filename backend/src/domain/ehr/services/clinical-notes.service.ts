import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import {
  CreateClinicalNoteDto,
  SignClinicalNoteDto,
  UpdateDraftClinicalNoteDto,
  ClinicalSpecialtyCategory,
  RecordSensitivityClassification,
} from '../dto/ehr.dto';
import { ClinicalTimelineService } from './clinical-timeline.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ClinicalNoteRecord {
  noteId: string;
  ehrId: string;
  caseId: string;
  category: ClinicalSpecialtyCategory;
  sensitivity: RecordSensitivityClassification;
  version: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icdCode?: string;
  authorId: string;
  authorName: string;
  isSigned: boolean;
  digitalSignature?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
  previousVersionId?: string;
}

/**
 * ClinicalNotesService — Gestão de Evoluções Clínicas, Psicológicas, Psiquiátricas e Sociais
 *
 * Funcionalidades:
 * - Editor estruturado no padrão SOAP (Subjetivo, Objetivo, Avaliação, Plano)
 * - Assinatura Eletrônica Digital com hash SHA-256
 * - Bloqueio imutável pós-assinatura (nenhum dado médico assinado pode ser alterado)
 * - Retificação via versionamento (gera nova versão apontando para a anterior)
 * - Publicação de evento CloudEvents `aura.ehr.note.signed.v1`
 *
 * Referências: P107 (AEIATP), P123 (AEDA), P136 (AIEHSR Etapa 4)
 */
import { Optional, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../prisma/prisma.service';
import { EhrCryptoService } from './ehr-crypto.service';

/** TTL dos rascunhos no Redis: 24 horas (86.400 segundos) */
const DRAFT_TTL_MS = 86400 * 1000;

@Injectable()
export class ClinicalNotesService {
  private readonly logger = new Logger(ClinicalNotesService.name);

  // Storage de evoluções médicas/sociais em memória (fallback local)
  private readonly notesStore = new Map<string, ClinicalNoteRecord>();

  constructor(
    private readonly timelineService: ClinicalTimelineService,
    private readonly eventBus: EventBusService,
    @Optional() private readonly cryptoService?: EhrCryptoService,
    @Optional() private readonly prisma?: PrismaService,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
  ) {}

  /**
   * Cria um rascunho de evolução clínica.
   */
  async createNote(
    dto: CreateClinicalNoteDto,
    authorId: string,
    authorName: string,
    authorRole: string,
    tenantId = 'default',
  ): Promise<ClinicalNoteRecord> {
    const noteId = randomUUID();
    const now = new Date().toISOString();

    const note: ClinicalNoteRecord = {
      noteId,
      ehrId: dto.ehrId,
      caseId: dto.caseId,
      category: dto.category,
      sensitivity: dto.sensitivity,
      version: 1,
      subjective: dto.soapNote.subjective,
      objective: dto.soapNote.objective,
      assessment: dto.soapNote.assessment,
      plan: dto.soapNote.plan,
      icdCode: dto.icdCode,
      authorId,
      authorName,
      isSigned: false,
      createdAt: now,
      updatedAt: now,
    };

    this.notesStore.set(noteId, note);

    if (this.cacheManager) {
      try {
        await this.cacheManager.set(`draft:note:${noteId}`, JSON.stringify(note), DRAFT_TTL_MS);
      } catch (err) {
        this.logger.warn(`[ClinicalNotes Redis] Falha ao salvar rascunho no Redis: ${(err as Error).message}`);
      }
    }

    this.logger.log(
      `[ClinicalNotes] Rascunho de evolução criado: ${noteId} (${dto.category}) por ${authorName}`,
    );

    return note;
  }

  /**
   * Atualiza/Salva rascunho de evolução clínica (Autosave Backend - GAP-P3-07 / ANO-001).
   * Impede alteração se a evolução já se encontrar assinada eletronicamente.
   */
  async saveDraft(
    noteId: string,
    dto: UpdateDraftClinicalNoteDto,
    authorId: string,
    tenantId = 'default',
  ): Promise<ClinicalNoteRecord> {
    const note = await this.getNoteById(noteId);

    if (note.isSigned) {
      throw new BadRequestException('Evoluções clínicas assinadas e bloqueadas não podem ser alteradas em rascunho.');
    }

    if (dto.soapNote) {
      if (dto.soapNote.subjective !== undefined) note.subjective = dto.soapNote.subjective;
      if (dto.soapNote.objective !== undefined) note.objective = dto.soapNote.objective;
      if (dto.soapNote.assessment !== undefined) note.assessment = dto.soapNote.assessment;
      if (dto.soapNote.plan !== undefined) note.plan = dto.soapNote.plan;
    }

    if (dto.icdCode !== undefined) {
      note.icdCode = dto.icdCode;
    }

    note.updatedAt = new Date().toISOString();
    this.notesStore.set(noteId, note);

    if (this.cacheManager) {
      try {
        await this.cacheManager.set(`draft:note:${noteId}`, JSON.stringify(note), DRAFT_TTL_MS);
      } catch (err) {
        this.logger.warn(`[ClinicalNotes Redis] Falha ao atualizar rascunho no Redis: ${(err as Error).message}`);
      }
    }

    if (this.prisma) {
      try {
        const encryptedContent = this.cryptoService?.encrypt(note.subjective) || note.subjective;
        const encryptedSummary = this.cryptoService?.encrypt(note.assessment) || note.assessment;

        await this.prisma.clinicalEvolution.update({
          where: { id: noteId },
          data: {
            contentEncrypted: encryptedContent,
            summary: encryptedSummary,
            status: 'DRAFT',
            updatedAt: new Date(note.updatedAt),
          },
        });
      } catch (err) {
        this.logger.warn(`[ClinicalNotes DB] Fallback autosave em memória: ${(err as Error).message}`);
      }
    }

    this.logger.log(`[ClinicalNotes] 💾 Autosave rascunho de evolução atualizado: ${noteId}`);
    return note;
  }

  /**
   * Assina eletronicamente a evolução clínica com bloqueio imutável.
   */
  async signNote(
    dto: SignClinicalNoteDto,
    authorId: string,
    authorName: string,
    authorRole: string,
    tenantId = 'default',
  ): Promise<ClinicalNoteRecord> {
    const note = await this.getNoteById(dto.noteId);

    if (note.isSigned) {
      throw new BadRequestException('Esta evolução clínica já se encontra assinada e bloqueada.');
    }

    const now = new Date().toISOString();

    // Gera o hash SHA-256 imutável do conteúdo
    const contentToSign = `${note.noteId}:${note.ehrId}:${note.subjective}:${note.assessment}:${dto.digitalSignature}:${now}`;
    const hashSignature = createHash('sha256').update(contentToSign).digest('hex');

    note.isSigned = true;
    note.digitalSignature = hashSignature;
    note.signedAt = now;
    note.updatedAt = now;

    this.notesStore.set(note.noteId, note);

    // Remove do Redis o rascunho pois agora a evolução está assinada e bloqueada
    if (this.cacheManager) {
      try {
        await this.cacheManager.del(`draft:note:${dto.noteId}`);
      } catch {}
    }

    this.logger.log(
      `[ClinicalNotes] 🔒 Evolução ${note.noteId} ASSINADA ELETRONICAMENTE e bloqueada! Hash: ${hashSignature}`,
    );

    // Adiciona na Linha do Tempo Clínica
    await this.timelineService.addItem(
      note.ehrId,
      note.category,
      `Evolução ${note.category} Assinada`,
      `Parecer: ${note.assessment.substring(0, 100)}...`,
      authorId,
      authorName,
      authorRole,
      true,
      note.caseId,
      { noteId: note.noteId, signatureHash: hashSignature },
    );

    // Persiste na tabela ClinicalEvolution do PostgreSQL se Prisma disponível
    if (this.prisma) {
      try {
        const encryptedContent = this.cryptoService?.encrypt(note.subjective) || note.subjective;
        const encryptedSummary = this.cryptoService?.encrypt(note.assessment) || note.assessment;

        await this.prisma.clinicalEvolution.create({
          data: {
            id: note.noteId,
            caseId: note.caseId || 'case-default-001',
            beneficiaryId: note.ehrId,
            professionalId: authorId,
            clinicalDate: new Date(now),
            durationMinutes: 50,
            modality: 'ONLINE',
            contentEncrypted: encryptedContent,
            summary: encryptedSummary,
            formatType: 'SOAP',
            status: 'SIGNED',
            digitalSignatureHash: hashSignature,
            signedAt: new Date(now),
          },
        });
      } catch (err) {
        this.logger.warn(`[ClinicalNotes DB] Fallback in-memory (Prisma offline: ${(err as Error).message})`);
      }
    }

    // Emite o evento institucional CloudEvents
    await this.eventBus.publish(
      'aura.ehr.note.signed.v1',
      {
        noteId: note.noteId,
        ehrId: note.ehrId,
        caseId: note.caseId,
        category: note.category,
        authorId,
        signatureHash: hashSignature,
      },
      tenantId,
      { subject: note.ehrId },
    );

    return note;
  }

  /**
   * Busca uma evolução pelo ID (DB → Redis → Memory).
   */
  async getNoteById(noteId: string): Promise<ClinicalNoteRecord> {
    if (this.prisma) {
      try {
        const dbRecord = await this.prisma.clinicalEvolution.findUnique({
          where: { id: noteId },
        });

        if (dbRecord) {
          const decryptedContent = this.cryptoService?.decrypt(dbRecord.contentEncrypted) || dbRecord.contentEncrypted;
          const decryptedSummary = this.cryptoService?.decrypt(dbRecord.summary) || dbRecord.summary;

          return {
            noteId: dbRecord.id,
            ehrId: dbRecord.beneficiaryId,
            caseId: dbRecord.caseId,
            category: ClinicalSpecialtyCategory.PSYCHOLOGY,
            sensitivity: RecordSensitivityClassification.HIGHLY_SENSITIVE,
            version: 1,
            subjective: decryptedContent,
            objective: '',
            assessment: decryptedSummary || '',
            plan: '',
            authorId: dbRecord.professionalId,
            authorName: 'Profissional Responsável',
            isSigned: dbRecord.status === 'SIGNED',
            digitalSignature: dbRecord.digitalSignatureHash || undefined,
            signedAt: dbRecord.signedAt ? dbRecord.signedAt.toISOString() : undefined,
            createdAt: dbRecord.createdAt.toISOString(),
            updatedAt: dbRecord.updatedAt.toISOString(),
          };
        }
      } catch {
        // Se falhar a busca no banco, recorre ao Redis / memória
      }
    }

    // 2. Busca no Redis (ANO-001)
    if (this.cacheManager) {
      try {
        const raw = await this.cacheManager.get<string>(`draft:note:${noteId}`);
        if (raw) {
          const note: ClinicalNoteRecord = typeof raw === 'string' ? JSON.parse(raw) : raw;
          this.notesStore.set(noteId, note);
          return note;
        }
      } catch {}
    }

    // 3. Fallback em memória local
    const note = this.notesStore.get(noteId);
    if (!note) {
      throw new NotFoundException(`Evolução clínica ${noteId} não encontrada.`);
    }
    return note;
  }
}
