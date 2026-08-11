import { ClinicalNotesService } from './clinical-notes.service';
import { ClinicalTimelineService } from './clinical-timeline.service';
import { EventBusService } from '../../../events/event-bus.service';
import { ClinicalSpecialtyCategory, RecordSensitivityClassification } from '../dto/ehr.dto';

describe('ClinicalNotesService', () => {
  let service: ClinicalNotesService;
  let timelineMock: Partial<ClinicalTimelineService>;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    timelineMock = {
      addItem: jest.fn().mockResolvedValue({} as any),
    };
    eventBusMock = {
      publish: jest.fn().mockResolvedValue({} as any),
    };

    service = new ClinicalNotesService(
      timelineMock as ClinicalTimelineService,
      eventBusMock as EventBusService,
    );
  });

  it('should create a draft SOAP note and sign it electronically', async () => {
    const draft = await service.createNote(
      {
        ehrId: 'ehr-123',
        caseId: 'case-456',
        category: ClinicalSpecialtyCategory.PSYCHOLOGY,
        sensitivity: RecordSensitivityClassification.RESTRICTED_PSYCHOLOGY,
        soapNote: {
          subjective: 'Paciente relata melhora nos quadros de ansiedade',
          objective: 'Bom contato visual, fala articulada',
          assessment: 'Evolução positiva sob psicoterapia quinzenal',
          plan: 'Manter acompanhamento quinzenal',
        },
      },
      'prof-789',
      'Dra. Ana Paula (Psicóloga)',
      'PSYCHOLOGIST',
      'tenant-a',
    );

    expect(draft.isSigned).toBe(false);
    expect(draft.noteId).toBeDefined();

    const signed = await service.signNote(
      {
        noteId: draft.noteId,
        digitalSignature: 'SIG_KEY_RSA_2048_OK',
      },
      'prof-789',
      'Dra. Ana Paula (Psicóloga)',
      'PSYCHOLOGIST',
      'tenant-a',
    );

    expect(signed.isSigned).toBe(true);
    expect(signed.digitalSignature).toBeDefined();
    expect(signed.signedAt).toBeDefined();

    expect(timelineMock.addItem).toHaveBeenCalledWith(
      'ehr-123',
      ClinicalSpecialtyCategory.PSYCHOLOGY,
      expect.stringContaining('Assinada'),
      expect.anything(),
      'prof-789',
      'Dra. Ana Paula (Psicóloga)',
      'PSYCHOLOGIST',
      true,
      'case-456',
      expect.anything(),
    );

    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.ehr.note.signed.v1',
      expect.objectContaining({ noteId: draft.noteId, ehrId: 'ehr-123' }),
      'tenant-a',
      expect.anything(),
    );
  });

  describe('Autosave Backend de Evoluções Clínicas (GAP-P3-07)', () => {
    it('deve atualizar rascunho de evolução SOAP via saveDraft com sucesso', async () => {
      const draft = await service.createNote(
        {
          ehrId: 'ehr-999',
          caseId: 'case-888',
          category: ClinicalSpecialtyCategory.PSYCHIATRY,
          sensitivity: RecordSensitivityClassification.HIGHLY_SENSITIVE,
          soapNote: {
            subjective: 'Relato inicial',
            objective: 'Exame inicial',
            assessment: 'Avaliação inicial',
            plan: 'Plano inicial',
          },
        },
        'prof-001',
        'Dr. Marcos',
        'PSYCHIATRIST',
      );

      const updated = await service.saveDraft(
        draft.noteId,
        {
          soapNote: {
            subjective: 'Relato atualizado via autosave',
            assessment: 'Avaliação atualizada via autosave',
          },
          icdCode: 'F32.1',
        },
        'prof-001',
      );

      expect(updated.subjective).toBe('Relato atualizado via autosave');
      expect(updated.objective).toBe('Exame inicial'); // Mantido
      expect(updated.assessment).toBe('Avaliação atualizada via autosave');
      expect(updated.plan).toBe('Plano inicial'); // Mantido
      expect(updated.icdCode).toBe('F32.1');
      expect(updated.isSigned).toBe(false);
    });

    it('deve rejeitar saveDraft se a evolução clínica já estiver assinada', async () => {
      const draft = await service.createNote(
        {
          ehrId: 'ehr-777',
          caseId: 'case-777',
          category: ClinicalSpecialtyCategory.PSYCHOLOGY,
          sensitivity: RecordSensitivityClassification.STANDARD,
          soapNote: {
            subjective: 'A',
            objective: 'B',
            assessment: 'C',
            plan: 'D',
          },
        },
        'prof-002',
        'Dra. Helena',
        'PSYCHOLOGIST',
      );

      // Assina a evolução
      await service.signNote(
        { noteId: draft.noteId, digitalSignature: 'HASH_IMUTAVEL' },
        'prof-002',
        'Dra. Helena',
        'PSYCHOLOGIST',
      );

      // Tentativa de alterar a evolução assinada via saveDraft deve falhar
      await expect(
        service.saveDraft(
          draft.noteId,
          { soapNote: { subjective: 'Tentativa de alteração pós-assinatura' } },
          'prof-002',
        ),
      ).rejects.toThrow('Evoluções clínicas assinadas e bloqueadas não podem ser alteradas em rascunho.');
    });

    it('deve lançar NotFoundException se a evolução não existir', async () => {
      await expect(
        service.saveDraft(
          'id-inexistente',
          { soapNote: { subjective: 'Teste' } },
          'prof-001',
        ),
      ).rejects.toThrow('não encontrada');
    });
  });

  describe('Redis Draft Caching (ANO-001)', () => {
    let cacheMock: any;
    let cacheStore: Map<string, string>;
    let serviceWithCache: ClinicalNotesService;

    beforeEach(() => {
      cacheStore = new Map<string, string>();
      cacheMock = {
        get: jest.fn().mockImplementation((key: string) => Promise.resolve(cacheStore.get(key))),
        set: jest.fn().mockImplementation((key: string, val: string) => {
          cacheStore.set(key, val);
          return Promise.resolve();
        }),
        del: jest.fn().mockImplementation((key: string) => {
          cacheStore.delete(key);
          return Promise.resolve();
        }),
      };

      serviceWithCache = new ClinicalNotesService(
        timelineMock as ClinicalTimelineService,
        eventBusMock as EventBusService,
        undefined,
        undefined,
        cacheMock,
      );
    });

    it('deve salvar rascunho no Redis com TTL de 24h ao criar nota', async () => {
      const draft = await serviceWithCache.createNote(
        {
          ehrId: 'ehr-cache-1',
          caseId: 'case-cache-1',
          category: ClinicalSpecialtyCategory.PSYCHOLOGY,
          sensitivity: RecordSensitivityClassification.STANDARD,
          soapNote: {
            subjective: 'Rascunho no Redis',
            objective: 'Objetivo',
            assessment: 'Avaliação',
            plan: 'Plano',
          },
        },
        'prof-cache-1',
        'Dr. Cache',
        'PSYCHOLOGIST',
      );

      expect(cacheMock.set).toHaveBeenCalledWith(
        `draft:note:${draft.noteId}`,
        expect.any(String),
        86400 * 1000,
      );
    });

    it('deve remover chave de rascunho do Redis ao assinar eletronicamente', async () => {
      const draft = await serviceWithCache.createNote(
        {
          ehrId: 'ehr-cache-2',
          caseId: 'case-cache-2',
          category: ClinicalSpecialtyCategory.PSYCHOLOGY,
          sensitivity: RecordSensitivityClassification.STANDARD,
          soapNote: { subjective: 'A', objective: 'B', assessment: 'C', plan: 'D' },
        },
        'prof-cache-1',
        'Dr. Cache',
        'PSYCHOLOGIST',
      );

      await serviceWithCache.signNote(
        { noteId: draft.noteId, digitalSignature: 'SIG_REDIS' },
        'prof-cache-1',
        'Dr. Cache',
        'PSYCHOLOGIST',
      );

      expect(cacheMock.del).toHaveBeenCalledWith(`draft:note:${draft.noteId}`);
    });
  });
});

