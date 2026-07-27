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

/**
 * FhirAdapter — Camada de Interoperabilidade Padrão Internacional HL7 FHIR R4
 *
 * Converte os dados internos do Prontuário Eletrônico Integrado Aura nos formatos
 * normatizados HL7 FHIR R4 (Fast Healthcare Interoperability Resources) para
 * integração com a Rede Nacional de Dados em Saúde (RNDS/SUS) e parceiros.
 *
 * Referências: P125 (AEAP), P136 (AIEHSR Etapa 9)
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
}
