import { apiClient } from '../shared/lib/api-client';

export interface CreateClinicalNotePayload {
  beneficiaryId: string;
  specialty: 'PSYCHOLOGY' | 'SOCIAL_WORK' | 'MEDICAL' | 'LEGAL' | 'GENERAL';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  isConfidential?: boolean;
}

export interface SignClinicalNotePayload {
  noteId: string;
  digitalSignatureHash?: string;
}

export const ehrService = {
  /**
   * Obtém ou inicializa o Prontuário Eletrônico do Beneficiário.
   */
  async getEhr(beneficiaryId: string) {
    return apiClient.get(`/api/v1/ehr/beneficiary/${beneficiaryId}`);
  },

  /**
   * Registra uma evolução clínica / nota SOAP no prontuário.
   */
  async createClinicalNote(payload: CreateClinicalNotePayload) {
    return apiClient.post('/api/v1/ehr/notes', payload);
  },

  /**
   * Assina digitalmente uma evolução clínica.
   */
  async signClinicalNote(noteId: string, payload?: SignClinicalNotePayload) {
    return apiClient.post(`/api/v1/ehr/notes/${noteId}/sign`, payload ?? {});
  },

  /**
   * Recupera a linha do tempo clínica longitudinal do beneficiário.
   */
  async getClinicalTimeline(beneficiaryId: string) {
    return apiClient.get(`/api/v1/ehr/beneficiary/${beneficiaryId}/timeline`);
  },

  /**
   * Exporta o prontuário no formato internacional HL7 FHIR R4.
   */
  async exportFhirBundle(beneficiaryId: string) {
    return apiClient.get(`/api/v1/ehr/beneficiary/${beneficiaryId}/fhir`);
  },

  /**
   * Executa acesso emergencial de quebra de sigilo (Break-Glass Protocol).
   */
  async breakGlassAccess(beneficiaryId: string, justification: string) {
    return apiClient.post(`/api/v1/ehr/beneficiary/${beneficiaryId}/break-glass`, { justification });
  },
};
