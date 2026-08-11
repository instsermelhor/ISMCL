import { FhirAdapter } from './fhir.adapter';

describe('FhirAdapter — Interoperabilidade HL7 FHIR R4 (Pilar 2)', () => {
  let adapter: FhirAdapter;

  beforeEach(() => {
    adapter = new FhirAdapter();
  });

  it('deve converter dados do beneficiário em recurso FHIR Patient', () => {
    const patient = adapter.toFhirPatient({
      id: 'ben-001',
      name: 'Maria da Silva',
      cpf: '123.456.789-00',
      email: 'maria@email.com',
      phone: '51999998888',
    });

    expect(patient.resourceType).toBe('Patient');
    expect(patient.id).toBe('ben-001');
    expect(patient.identifier[0].value).toBe('123.456.789-00');
    expect(patient.name[0].text).toBe('Maria da Silva');
    expect(patient.telecom?.length).toBe(2);
  });

  it('deve converter evolução SOAP em recurso FHIR ClinicalImpression', () => {
    const impression = adapter.toFhirClinicalImpression({
      id: 'note-001',
      beneficiaryId: 'ben-001',
      summary: 'Paciente em evolução positiva',
      createdAt: '2026-08-11T12:00:00Z',
      icdCode: 'F41.1',
    });

    expect(impression.resourceType).toBe('ClinicalImpression');
    expect(impression.id).toBe('note-001');
    expect(impression.subject.reference).toBe('Patient/ben-001');
    expect(impression.finding?.[0].itemCodeableConcept.text).toBe('CID: F41.1');
  });

  it('deve converter atendimento em recurso FHIR Encounter', () => {
    const encounter = adapter.toFhirEncounter({
      id: 'appt-100',
      beneficiaryId: 'ben-001',
      professionalId: 'prof-001',
      professionalName: 'Dra. Ana',
      modality: 'ONLINE',
      status: 'COMPLETED',
      scheduledStart: '2026-08-11T14:00:00Z',
      scheduledEnd: '2026-08-11T15:00:00Z',
    });

    expect(encounter.resourceType).toBe('Encounter');
    expect(encounter.status).toBe('finished');
    expect(encounter.class.code).toBe('VR');
    expect(encounter.subject.reference).toBe('Patient/ben-001');
    expect(encounter.participant?.[0].individual.reference).toBe('Practitioner/prof-001');
  });

  it('deve converter diagnóstico em recurso FHIR Condition', () => {
    const condition = adapter.toFhirCondition({
      id: 'diag-001',
      beneficiaryId: 'ben-001',
      icdCode: 'F32.1',
      icdDescription: 'Episódio Depressivo Moderado',
      status: 'ACTIVE',
      createdAt: '2026-08-11T10:00:00Z',
    });

    expect(condition.resourceType).toBe('Condition');
    expect(condition.clinicalStatus.coding[0].code).toBe('active');
    expect(condition.code.coding[0].code).toBe('F32.1');
    expect(condition.subject.reference).toBe('Patient/ben-001');
  });

  it('deve converter aplicação de escala GAD-7 em recurso FHIR Observation', () => {
    const observation = adapter.toFhirObservation({
      id: 'obs-001',
      beneficiaryId: 'ben-001',
      scaleName: 'GAD-7',
      score: 14,
      interpretation: 'Ansiedade Moderada a Grave',
      appliedAt: '2026-08-11T11:00:00Z',
    });

    expect(observation.resourceType).toBe('Observation');
    expect(observation.status).toBe('final');
    expect(observation.code.coding[0].code).toBe('69725-0');
    expect(observation.valueQuantity?.value).toBe(14);
    expect(observation.interpretation?.[0].text).toBe('Ansiedade Moderada a Grave');
  });
});
