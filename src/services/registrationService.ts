import { apiClient } from '../shared/lib/api-client';

export interface StartRegistrationPayload {
  targetProfile: 'BENEFICIARY' | 'PROFISSIONAL' | 'VOLUNTEER' | 'DONOR' | 'PARTNER';
  documentCpf?: string;
  email?: string;
  phone?: string;
}

export interface SubmitRegistrationPayload {
  sessionId: string;
  formData: Record<string, unknown>;
  consentLgpd: boolean;
}

export const registrationService = {
  /**
   * Inicia sessão de cadastro adaptativo e recupera formulário dinâmico.
   */
  async startRegistration(payload: StartRegistrationPayload) {
    return apiClient.post('/api/v1/registration/start', payload);
  },

  /**
   * Submete os dados preenchidos do cadastro adaptativo.
   */
  async submitRegistration(payload: SubmitRegistrationPayload) {
    return apiClient.post('/api/v1/registration/submit', payload);
  },

  /**
   * Avalia elegibilidade prévia para programa assistencial.
   */
  async evaluateEligibility(payload: { cpf?: string; income?: number; householdSize?: number; locationZip?: string }) {
    return apiClient.post('/api/v1/registration/evaluate-eligibility', payload);
  },

  /**
   * Classifica nível de risco social/psicossocial do cadastrando.
   */
  async classifyRisk(payload: { registrationSessionId: string; indicators: string[] }) {
    return apiClient.post('/api/v1/registration/classify-risk', payload);
  },
};
