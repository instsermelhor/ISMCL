import { apiClient } from '../shared/lib/api-client';

export interface StartIntakePayload {
  beneficiaryId: string;
  channel: 'IN_PERSON' | 'PHONE' | 'WHATSAPP' | 'PORTAL' | 'REFERRAL';
  chiefComplaint: string;
}

export interface ClassifyTriagePayload {
  intakeSessionId: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  mcsiLevel: number;
  priorityScore: number;
  assignedSpecialty?: string;
  notes?: string;
}

export const intakeService = {
  /**
   * Inicia atendimento de acolhimento e triagem inicial.
   */
  async startIntake(payload: StartIntakePayload) {
    return apiClient.post('/api/v1/intake/start', payload);
  },

  /**
   * Classifica risco e encaminha para fila de espera/atendimento.
   */
  async classifyTriage(payload: ClassifyTriagePayload) {
    return apiClient.post('/api/v1/intake/triage/classify', payload);
  },

  /**
   * Consulta a fila de triagem ativa com priorização inteligente.
   */
  async getTriageQueue() {
    return apiClient.get('/api/v1/intake/triage/queue');
  },

  /**
   * Avalia sinal de crise psicossocial grave (detector de crise).
   */
  async detectCrisis(payload: { textContent: string; beneficiaryId?: string }) {
    return apiClient.post('/api/v1/intake/detect-crisis', payload);
  },
};
