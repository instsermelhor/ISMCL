import { AsyncLocalStorage } from 'async_hooks';

export interface UserSecurityContext {
  userId: string;
  role: string;
  sensitivityLevel: number; // Nível máximo que o usuário pode acessar por padrão (0 a 4)
  ipAddress: string;
  userAgent: string;
  activeBreakGlassSessions: Record<string, { expiresAt: string }>; // Mapeamento de beneficiaryId -> expiração
}

// Armazenamento de contexto assíncrono para o request lifecycle
export const securityContextStorage = new AsyncLocalStorage<UserSecurityContext>();
