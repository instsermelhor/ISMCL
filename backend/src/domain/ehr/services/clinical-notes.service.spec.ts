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
});
