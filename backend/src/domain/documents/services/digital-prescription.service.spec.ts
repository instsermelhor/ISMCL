import { DigitalPrescriptionService } from './digital-prescription.service';
import { TrustServicesEngine } from '../engines/trust-services.engine';
import { TemplateManagementService } from './template-management.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  DocumentType,
  DocumentSensitivity,
  SignatureMode,
} from '../dto/documents.dto';

describe('DigitalPrescriptionService', () => {
  let service: DigitalPrescriptionService;
  let eventBusMock: Partial<EventBusService>;
  let trustServices: TrustServicesEngine;
  let templateMgr: TemplateManagementService;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    trustServices = new TrustServicesEngine();
    templateMgr = new TemplateManagementService();
    service = new DigitalPrescriptionService(trustServices, templateMgr, eventBusMock as EventBusService);
  });

  it('should issue a prescription with DOC-YYYY-XXXXX code', async () => {
    const doc = await service.issue(
      {
        beneficiaryId: 'benef-001',
        type: DocumentType.PRESCRIPTION,
        title: 'Receita de Sertralina',
        sensitivity: DocumentSensitivity.RESTRICTED,
        signatureMode: SignatureMode.SEQUENTIAL,
        icdCode: 'F32.1',
        items: [{ name: 'Sertralina', dosage: '50mg', instructions: '1 comp/dia pela manhã', quantity: '30 comp' }],
      },
      'prof-001',
      'Dr. Roberto Alves (Psiquiatra)',
      'PSYCHIATRIST',
    );

    expect(doc.documentCode).toMatch(/^DOC-\d{4}-\d{5}$/);
    expect(doc.status).toBe('PENDING_SIGNATURE');
    expect(doc.contentHash).toHaveLength(64); // SHA-256 hex
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.documents.issued.v1',
      expect.objectContaining({ documentId: doc.documentId }),
      'default',
      expect.anything(),
    );
  });

  it('should sign a document and issue TSA timestamp when fully signed', async () => {
    const doc = await service.issue(
      {
        beneficiaryId: 'benef-002',
        type: DocumentType.MEDICAL_CERTIFICATE,
        title: 'Atestado de Acompanhamento',
        sensitivity: DocumentSensitivity.CONFIDENTIAL,
        signatureMode: SignatureMode.SEQUENTIAL,
      },
      'prof-002',
      'Dra. Ana Lima (Psicóloga)',
      'PSYCHOLOGIST',
    );

    const signed = await service.sign(
      { documentId: doc.documentId, signatureToken: 'TOKEN_PROF_002_RSA' },
      'prof-002',
      'Dra. Ana Lima (Psicóloga)',
      'PSYCHOLOGIST',
    );

    expect(signed.status).toBe('SIGNED');
    expect(signed.signatures).toHaveLength(1);
    expect(signed.signatures[0].signatureHash).toHaveLength(64);
    expect(signed.timestampToken).toBeDefined();
    expect(signed.timestampToken?.issuerAuthority).toContain('Aura-TSA');
  });

  it('should prevent signing by non-authorized signatory', async () => {
    const doc = await service.issue(
      {
        beneficiaryId: 'benef-003',
        type: DocumentType.REFERRAL,
        title: 'Encaminhamento para Psiquiatria',
        sensitivity: DocumentSensitivity.CONFIDENTIAL,
        signatureMode: SignatureMode.SEQUENTIAL,
      },
      'prof-003',
      'Dra. Carla Neves (Assistente Social)',
      'SOCIAL_WORKER',
    );

    await expect(
      service.sign(
        { documentId: doc.documentId, signatureToken: 'TOKEN_UNAUTHORIZED' },
        'prof-intruder',
        'Intruso',
        'UNKNOWN',
      ),
    ).rejects.toThrow('não está na lista de signatários');
  });

  it('should verify integrity of an unmodified document', async () => {
    const doc = await service.issue(
      {
        beneficiaryId: 'benef-004',
        type: DocumentType.PSYCHOLOGICAL_REPORT,
        title: 'Parecer Psicológico',
        sensitivity: DocumentSensitivity.HIGHLY_SENSITIVE,
        signatureMode: SignatureMode.SEQUENTIAL,
        content: 'Paciente apresenta evolução satisfatória...',
      },
      'prof-004',
      'Dr. Lucas Ferreira (Psicólogo)',
      'PSYCHOLOGIST',
    );

    const report = await service.validate(doc.documentId);
    expect(report.isValid).toBe(true);
    expect(report.details).toContain('íntegro');
  });
});
