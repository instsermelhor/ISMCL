import { apiClient } from '../shared/lib/api-client';

export interface CreateDocumentPayload {
  title: string;
  summary: string;
  category: string;
  content: string;
  authorId: string;
  tags?: string[];
  confidentiality?: string;
}

export interface SearchQueryPayload {
  query: string;
  category?: string;
  topK?: number;
}

export const ekgService = {
  /**
   * Cria um novo documento corporativo na base de conhecimento.
   */
  async createDocument(payload: CreateDocumentPayload) {
    return apiClient.post('/api/v1/ekg/documents', payload);
  },

  /**
   * Busca semântica e resposta fundamentada RAG.
   */
  async searchKnowledge(payload: SearchQueryPayload) {
    return apiClient.post('/api/v1/ekg/search', payload);
  },

  /**
   * Registra lição aprendida institucional.
   */
  async registerLessonLearned(payload: { title: string; description: string; author: string; context?: string; rootCause?: string; preventiveAction?: string; targetProcess?: string }) {
    return apiClient.post('/api/v1/ekg/lessons', payload);
  },

  /**
   * Recupera a memória institucional e timeline de decisões estratégicas.
   */
  async getOrganizationalMemory(eventType?: string) {
    const params = eventType ? `?eventType=${encodeURIComponent(eventType)}` : '';
    return apiClient.get(`/api/v1/ekg/memory${params}`);
  },

  /**
   * Registra novo evento de memória organizacional.
   */
  async recordMemory(payload: { title: string; description: string; eventType: string; recordedBy: string }) {
    return apiClient.post('/api/v1/ekg/memory', payload);
  },

  /**
   * Recomendações de conhecimento personalizadas por usuário.
   */
  async getRecommendations(userId: string, limit = 5) {
    return apiClient.get(`/api/v1/ekg/recommendations/${userId}?limit=${limit}`);
  },
};
