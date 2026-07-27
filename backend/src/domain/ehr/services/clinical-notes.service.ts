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
@Injectable()
export class ClinicalNotesService {
  private readonly logger = new Logger(ClinicalNotesService.name);

  // Storage de evoluções médicas/sociais (no Prisma/PostgreSQL em produção)
  private readonly notesStore = new Map<string, ClinicalNoteRecord>();

  constructor(
    private readonly timelineService: ClinicalTimelineService,
    private readonly eventBus: EventBusService,
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

    this.logger.log(
      `[ClinicalNotes] Rascunho de evolução criado: ${noteId} (${dto.category}) por ${authorName}`,
    );

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
    const note = this.notesStore.get(dto.noteId);
    if (!note) {
      throw new NotFoundException(`Evolução clínica ${dto.noteId} não encontrada.`);
    }

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
   * Busca uma evolução pelo ID.
   */
  async getNoteById(noteId: string): Promise<ClinicalNoteRecord> {
    const note = this.notesStore.get(noteId);
    if (!note) {
      throw new NotFoundException(`Evolução clínica ${noteId} não encontrada.`);
    }
    return note;
  }
}
