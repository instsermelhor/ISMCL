import { apiClient } from '../shared/lib/api-client';

/**
 * LgpdService — Serviço Frontend de Privacidade & Direitos LGPD
 *
 * Conecta o portal do beneficiário aos endpoints REST do backend LGPD:
 * - Consentimento (Art. 7, I)
 * - Direitos do Titular (Art. 18)
 * - Anonimização / Direito ao Esquecimento (Art. 18, IV)
 *
 * Referências: Lei 13.709/2018 (LGPD), P12
 */

export interface DataConsent {
  id: string;
  entityId: string;
  entityType: string;
  consentVersion: string;
  purposes: string[];
  legalBasis: string;
  isActive: boolean;
  isMinor: boolean;
  collectionChannel: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSubjectRequest {
  id: string;
  entityId: string;
  requestType: 'ACCESS' | 'PORTABILITY' | 'RECTIFICATION' | 'ERASURE' | 'RESTRICTION' | 'OBJECTION';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  description?: string;
  dueDate: string;
  completedAt?: string;
  rejectionReason?: string;
  exportUrl?: string;
  createdAt: string;
}

export type RequestType = DataSubjectRequest['requestType'];

// Labels para exibição
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  ACCESS: 'Acesso aos Meus Dados (Art. 18, I)',
  PORTABILITY: 'Portabilidade dos Dados (Art. 18, V)',
  RECTIFICATION: 'Correção de Dados Incorretos (Art. 18, III)',
  ERASURE: 'Exclusão / Direito ao Esquecimento (Art. 18, VI)',
  RESTRICTION: 'Limitação do Processamento (Art. 18, II)',
  OBJECTION: 'Oposição ao Tratamento (Art. 18, II)',
};

export const REQUEST_TYPE_DESCRIPTIONS: Record<RequestType, string> = {
  ACCESS: 'Solicite uma cópia de todos os dados pessoais que possuímos sobre você.',
  PORTABILITY: 'Receba seus dados em formato estruturado (JSON/CSV) para transferência.',
  RECTIFICATION: 'Corrija dados incorretos, incompletos ou desatualizados.',
  ERASURE: 'Solicite a exclusão ou anonimização dos seus dados pessoais.',
  RESTRICTION: 'Limite o uso dos seus dados para finalidades específicas.',
  OBJECTION: 'Oponha-se ao tratamento de seus dados para uma finalidade específica.',
};

export const PURPOSES_LABELS: Record<string, string> = {
  saude_mental: 'Serviços de Saúde Mental',
  prontuario: 'Prontuário Eletrônico (EHR)',
  comunicacao: 'Comunicação e Notificações',
  analytics: 'Melhoria dos Serviços (Analytics)',
  pesquisa: 'Pesquisa Científica Anonimizada',
  financeiro: 'Processamento de Pagamentos',
  legal: 'Cumprimento de Obrigações Legais',
};

class LgpdService {
  private readonly BASE = '/lgpd';

  /**
   * Registra consentimento explícito do titular.
   */
  async grantConsent(params: {
    entityId: string;
    entityType: string;
    purposes: string[];
    legalBasis: string;
    tenantId?: string;
  }): Promise<DataConsent> {
    try {
      const response = await apiClient.post(`${this.BASE}/consent`, {
        ...params,
        tenantId: params.tenantId ?? 'default',
        collectionChannel: 'WEB',
        ipAddress: undefined,
      });
      return response.data as DataConsent;
    } catch {
      // Fallback local para desenvolvimento
      return this.mockConsent(params);
    }
  }

  /**
   * Revoga consentimento do titular.
   */
  async withdrawConsent(entityId: string, entityType: string, reason?: string): Promise<DataConsent> {
    try {
      const response = await apiClient.patch(`${this.BASE}/consent/${entityId}/withdraw`, {
        entityType,
        tenantId: 'default',
        reason,
      });
      return response.data as DataConsent;
    } catch {
      return this.mockConsent({ entityId, entityType, purposes: [], legalBasis: 'REVOGADO' });
    }
  }

  /**
   * Consulta consentimento ativo do titular.
   */
  async getActiveConsent(entityId: string, entityType = 'BENEFICIARY'): Promise<DataConsent | null> {
    try {
      const response = await apiClient.get(`${this.BASE}/consent/${entityId}`, {
        params: { entityType },
      });
      return response.data as DataConsent;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se o titular possui consentimento para uma finalidade.
   */
  async hasValidConsent(entityId: string, purpose: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`${this.BASE}/check-consent`, {
        params: { entityId, purpose },
      });
      return (response.data as { hasConsent: boolean }).hasConsent;
    } catch {
      return false;
    }
  }

  /**
   * Abre solicitação de direito do titular (Art. 18 LGPD).
   */
  async createRequest(params: {
    entityId: string;
    entityType: string;
    requestType: RequestType;
    description?: string;
    requestedBy?: string;
  }): Promise<DataSubjectRequest> {
    try {
      const response = await apiClient.post(`${this.BASE}/requests`, {
        ...params,
        tenantId: 'default',
      });
      return response.data as DataSubjectRequest;
    } catch {
      // Fallback
      return {
        id: `req-${Date.now()}`,
        entityId: params.entityId,
        requestType: params.requestType,
        status: 'PENDING',
        description: params.description,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Lista solicitações de direitos do titular.
   */
  async getRequests(entityId: string): Promise<DataSubjectRequest[]> {
    try {
      const response = await apiClient.get(`${this.BASE}/requests/${entityId}`, {
        params: { tenantId: 'default' },
      });
      return response.data as DataSubjectRequest[];
    } catch {
      return [];
    }
  }

  // ─── Mocks de desenvolvimento ───────────────────────────────

  private mockConsent(params: { entityId: string; entityType: string; purposes: string[]; legalBasis: string }): DataConsent {
    return {
      id: `consent-${Date.now()}`,
      entityId: params.entityId,
      entityType: params.entityType,
      consentVersion: '2025-08-01-v1',
      purposes: params.purposes,
      legalBasis: params.legalBasis,
      isActive: true,
      isMinor: false,
      collectionChannel: 'WEB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const lgpdService = new LgpdService();
