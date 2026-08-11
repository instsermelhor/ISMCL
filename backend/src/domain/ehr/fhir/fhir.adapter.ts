import { Injectable, Logger } from '@nestjs/common';

/** Recursos HL7 FHIR R4 no formato JSON padrão */
export interface FhirPatientResource {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{ system: string; value: string }>;
  name: Array<{ use: 'official'; text: string }>;
  telecom?: Array<{ system: 'phone' | 'email'; value: string }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
}

export interface FhirClinicalImpressionResource {
  resourceType: 'ClinicalImpression';
  id: string;
  status: 'completed' | 'in-progress';
  subject: { reference: string };
  date: string;
  summary: string;
  finding?: Array<{ itemCodeableConcept: { text: string } }>;
}

export interface FhirEncounterResource {
  resourceType: 'Encounter';
  id: string;
  status: 'planned' | 'arrived' | 'in-progress' | 'finished' | 'cancelled';
  class: { system: string; code: string; display: string };
  subject: { reference: string };
  participant?: Array<{ individual: { reference: string; display: string } }>;
  period?: { start: string; end: string };
}

export interface FhirConditionResource {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: { coding: Array<{ system: string; code: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'resolved' }> };
  code: { coding: Array<{ system: string; code: string; display: string }> };
  subject: { reference: string };
  recordedDate?: string;
}

export interface FhirObservationResource {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'amended';
  code: { coding: Array<{ system: string; code: string; display: string }> };
  subject: { reference: string };
  valueQuantity?: { value: number; unit: string };
  effectiveDateTime?: string;
  interpretation?: Array<{ text: string }>;
}

/**
 * FhirAdapter — Camada de Interoperabilidade Padrão Internacional HL7 FHIR R4
 *
 * Converte os dados internos do Prontuário Eletrônico Integrado Aura nos formatos
 * normatizados HL7 FHIR R4 (Fast Healthcare Interoperability Resources) para
 * integração com a Rede Nacional de Dados em Saúde (RNDS/SUS) e parceiros.
 *
 * Suporta Patient, ClinicalImpression, Encounter, Condition e Observation.
 *
 * Referências: P125 (AEAP), P136 (AIEHSR Etapa 9), Pilar 2 Frente 3
 */
@Injectable()
export class FhirAdapter {
  private readonly logger = new Logger(FhirAdapter.name);

  /**
   * Mapeia os dados do Beneficiário para um recurso FHIR Patient.
   */
  toFhirPatient(user: { id: string; name: string; cpf: string; email: string; phone?: string }): FhirPatientResource {
    return {
      resourceType: 'Patient',
      id: user.id,
      identifier: [
        {
          system: 'https://www.gov.br/receitafederal/cpf',
          value: user.cpf,
        },
      ],
      name: [
        {
          use: 'official',
          text: user.name,
        },
      ],
      telecom: [
        { system: 'email', value: user.email },
        ...(user.phone ? [{ system: 'phone' as const, value: user.phone }] : []),
      ],
    };
  }

  /**
   * Mapeia uma Evolução Clínica SOAP para um recurso FHIR ClinicalImpression.
   */
  toFhirClinicalImpression(note: {
    id: string;
    beneficiaryId: string;
    summary: string;
    createdAt: string;
    icdCode?: string;
  }): FhirClinicalImpressionResource {
    return {
      resourceType: 'ClinicalImpression',
      id: note.id,
      status: 'completed',
      subject: {
        reference: `Patient/${note.beneficiaryId}`,
      },
      date: note.createdAt,
      summary: note.summary,
      ...(note.icdCode
        ? {
            finding: [
              {
                itemCodeableConcept: { text: `CID: ${note.icdCode}` },
              },
            ],
          }
        : {}),
    };
  }

  /**
   * Mapeia um agendamento/consulta para um recurso FHIR Encounter.
   */
  toFhirEncounter(appt: {
    id: string;
    beneficiaryId: string;
    professionalId: string;
    professionalName: string;
    modality: 'ONLINE' | 'IN_PERSON' | 'HYBRID';
    status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    scheduledStart: string;
    scheduledEnd: string;
  }): FhirEncounterResource {
    const statusMap: Record<string, FhirEncounterResource['status']> = {
      SCHEDULED: 'planned',
      CONFIRMED: 'arrived',
      COMPLETED: 'finished',
      CANCELLED: 'cancelled',
    };

    return {
      resourceType: 'Encounter',
      id: appt.id,
      status: statusMap[appt.status] || 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: appt.modality === 'ONLINE' ? 'VR' : 'AMB',
        display: appt.modality === 'ONLINE' ? 'Virtual (Teleatendimento)' : 'Ambulatorial Presencial',
      },
      subject: {
        reference: `Patient/${appt.beneficiaryId}`,
      },
      participant: [
        {
          individual: {
            reference: `Practitioner/${appt.professionalId}`,
            display: appt.professionalName,
          },
        },
      ],
      period: {
        start: appt.scheduledStart,
        end: appt.scheduledEnd,
      },
    };
  }

  /**
   * Mapeia um diagnóstico ativo/resolvido para um recurso FHIR Condition.
   */
  toFhirCondition(diag: {
    id: string;
    beneficiaryId: string;
    icdCode: string;
    icdDescription: string;
    status: 'ACTIVE' | 'RESOLVED';
    createdAt: string;
  }): FhirConditionResource {
    return {
      resourceType: 'Condition',
      id: diag.id,
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: diag.status === 'ACTIVE' ? 'active' : 'resolved',
          },
        ],
      },
      code: {
        coding: [
          {
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: diag.icdCode,
            display: diag.icdDescription,
          },
        ],
      },
      subject: {
        reference: `Patient/${diag.beneficiaryId}`,
      },
      recordedDate: diag.createdAt,
    };
  }

  /**
   * Mapeia a aplicação de uma escala clínica (GAD-7, PHQ-9) para um recurso FHIR Observation.
   */
  toFhirObservation(scale: {
    id: string;
    beneficiaryId: string;
    scaleName: 'GAD-7' | 'PHQ-9' | 'BECK';
    score: number;
    interpretation: string;
    appliedAt: string;
  }): FhirObservationResource {
    return {
      resourceType: 'Observation',
      id: scale.id,
      status: 'final',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: scale.scaleName === 'PHQ-9' ? '44261-6' : scale.scaleName === 'GAD-7' ? '69725-0' : 'BECK-001',
            display: `Escala Clínica ${scale.scaleName}`,
          },
        ],
      },
      subject: {
        reference: `Patient/${scale.beneficiaryId}`,
      },
      valueQuantity: {
        value: scale.score,
        unit: 'pontos',
      },
      effectiveDateTime: scale.appliedAt,
      interpretation: [{ text: scale.interpretation }],
    };
  }
}
