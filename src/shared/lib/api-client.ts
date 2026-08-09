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
const BASE_URL =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL ?? 'http://localhost:3001';

let authToken: string | null = sessionStorage.getItem('aura_access_token');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = authToken ?? sessionStorage.getItem('aura_access_token');
  const tenantId = sessionStorage.getItem('aura_tenant_id') ?? 'default';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client': 'aura-web',
    'X-Client-Version': '1.0.0',
    'X-Tenant-ID': tenantId,
    'X-Request-ID':
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem('aura_access_token');
        authToken = null;
      }
      const errorJson = await response.json().catch(() => ({}));
      const detail = errorJson.detail || errorJson.message || `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(detail);
    }

    const json = await response.json();
    if (json && typeof json === 'object' && 'data' in json) {
      return json as ApiResponse<T>;
    }
    return {
      success: true,
      data: json as T,
      timestamp: new Date().toISOString(),
      requestId: headers['X-Request-ID'],
    };
  } catch (err) {
    throw err;
  }
}

export const apiClient = {
  setAuthToken: (token: string) => {
    authToken = token;
    sessionStorage.setItem('aura_access_token', token);
  },
  clearAuthToken: () => {
    authToken = null;
    sessionStorage.removeItem('aura_access_token');
  },
  getAuthToken: () => authToken ?? sessionStorage.getItem('aura_access_token'),
  get: <T>(url: string): Promise<ApiResponse<T>> => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    request<T>(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    request<T>(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    request<T>(url, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(url: string): Promise<ApiResponse<T>> => request<T>(url, { method: 'DELETE' }),
};
