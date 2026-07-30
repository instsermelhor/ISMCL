/** Envelope de resposta padrão da API Aura */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  timestamp: string;
  requestId: string;
  message?: string;
}

/** Erro RFC 7807 Problem Details */
export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  requestId?: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * ApiClient — Cliente HTTP corporativo da Plataforma Aura
 * Baseado em Fetch API nativo com suporte a envelopes tipados e headers corporativos.
 */
const BASE_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL ?? 'http://localhost:3001';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = sessionStorage.getItem('aura_access_token');
  const tenantId = sessionStorage.getItem('aura_tenant_id') ?? 'default';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client': 'aura-web',
    'X-Client-Version': '1.0.0',
    'X-Tenant-ID': tenantId,
    'X-Request-ID': typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.clear();
    }
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  return json as ApiResponse<T>;
}

export const apiClient = {
  get: <T>(url: string): Promise<ApiResponse<T>> => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => request<T>(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(url: string): Promise<ApiResponse<T>> => request<T>(url, { method: 'DELETE' }),
};
