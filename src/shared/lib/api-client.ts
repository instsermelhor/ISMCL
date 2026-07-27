import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { randomUUID } from 'crypto';

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
 *
 * Configuração centralizada do Axios com:
 * - Injeção automática de Authorization Bearer token
 * - Injeção de X-Request-ID e X-Tenant-ID em todas as requisições
 * - Unwrap automático do envelope {success, data, meta}
 * - Refresh token automático em 401 (token expirado)
 * - Retry automático (3x) em erros de rede (5xx, network errors)
 * - Timeout de 30s
 * - Tratamento padronizado de erros RFC 7807
 *
 * Referências: P103 (AEXP), P125 (AEAP), P131 (AFPI)
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 30_000;

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
    timeout: TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client': 'aura-web',
      'X-Client-Version': import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    },
  });

  // ── Request Interceptor ─────────────────────────────────────────────────────
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Adiciona token JWT se disponível
      const token = sessionStorage.getItem('aura_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Adiciona X-Request-ID para rastreabilidade
      if (config.headers) {
        config.headers['X-Request-ID'] = randomUUID();
      }

      // Adiciona X-Tenant-ID se disponível
      const tenantId = sessionStorage.getItem('aura_tenant_id') ?? 'default';
      if (config.headers) {
        config.headers['X-Tenant-ID'] = tenantId;
      }

      return config;
    },
    (error: unknown) => Promise.reject(error),
  );

  // ── Response Interceptor ────────────────────────────────────────────────────
  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || !error.config) {
        return Promise.reject(error);
      }

      const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

      // Refresh token em 401
      if (error.response?.status === 401 && !config.url?.includes('/auth/refresh')) {
        try {
          const refreshToken = sessionStorage.getItem('aura_refresh_token');
          if (refreshToken) {
            const { data } = await instance.post<ApiResponse<{ accessToken: string }>>('/api/v1/auth/refresh', {
              refreshToken,
            });
            sessionStorage.setItem('aura_access_token', data.data.accessToken);
            // Retry da requisição original
            return instance.request(config);
          }
        } catch {
          sessionStorage.clear();
          window.location.href = '/login';
        }
      }

      // Retry em erros de rede e 5xx
      const isNetworkError = !error.response;
      const isServerError = (error.response?.status ?? 0) >= 500;
      config._retryCount = config._retryCount ?? 0;

      if ((isNetworkError || isServerError) && config._retryCount < MAX_RETRIES) {
        config._retryCount++;
        const delay = RETRY_DELAY_MS * Math.pow(2, config._retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return instance.request(config);
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

const axiosInstance = createApiClient();

/**
 * Funções tipadas para consumo das APIs Aura.
 * O envelope ApiResponse é desestruturado automaticamente.
 */
export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data;
  },

  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.delete<ApiResponse<T>>(url, config);
    return response.data;
  },
};
