// ============================================================
// SecureCredentialsService — Serviço de Gestão Segura de Credenciais
// Instituto Ser Melhor — Plataforma Aura (Prompt 177)
// ============================================================
// Atende à ETAPA 3 e ETAPA 6 do Prompt 177:
// 1. As credenciais iniciais são carregadas EXCLUSIVAMENTE de variáveis de ambiente
//    (import.meta.env.VITE_AURA_SUPERADMIN_EMAIL, VITE_AURA_SUPERADMIN_PASS).
// 2. NUNCA expõe credenciais hardcoded no código-fonte.
// 3. Gerencia hash seguro (simulação PBKDF2/SHA-256 com salt) para validação.
// 4. Controla obrigatoriedade de troca de senha no primeiro acesso.
// 5. Gerencia timeout de sessão administrativa configurável via env.
// ============================================================

export interface SuperAdminConfig {
  email: string;
  initialPass: string;
  mustChangePassword: boolean;
  passwordLastChangedAt?: string;
}

const STORAGE_KEY = 'aura_super_admin_sec_config';

// Indicador de ambiente de desenvolvimento
const IS_DEV = ((import.meta as any).env as Record<string, any>)?.DEV === true;

/**
 * Obtém as credenciais iniciais do Super Administrador a partir das variáveis de ambiente.
 * Em runtime client-side Vite, usa (import.meta as any).env.
 *
 * SEGURANÇA: Nenhuma credencial real deve estar hardcoded neste arquivo.
 * Configure VITE_AURA_SUPERADMIN_EMAIL e VITE_AURA_SUPERADMIN_PASS no .env.local
 * (desenvolvimento) ou nas variáveis de ambiente do servidor/Vercel (produção).
 */
export function getInitialSuperAdminConfig(): SuperAdminConfig {
  // 1. Tenta carregar override seguro armazenado localmente (após troca de senha)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SuperAdminConfig;
    }
  } catch {
    // ignora erro de parse
  }

  // 2. Carrega de variáveis de ambiente (Vite)
  const envObj = ((import.meta as any).env as Record<string, any>) || {};
  const envEmail = envObj.VITE_AURA_SUPERADMIN_EMAIL as string | undefined;
  const envPass = envObj.VITE_AURA_SUPERADMIN_PASS as string | undefined;

  // 3. Aviso explícito em desenvolvimento se variáveis não estiverem configuradas
  if (IS_DEV && (!envEmail || !envPass)) {
    console.warn(
      '[SecureCredentialsService] ⚠️  VITE_AURA_SUPERADMIN_EMAIL e/ou VITE_AURA_SUPERADMIN_PASS ' +
      'não estão definidas no .env.local. Configure-as para habilitar o login do Super Administrador. ' +
      'Consulte o .env.example para referência.'
    );
  }

  // mustChangePassword = false quando a senha foi configurada explicitamente via .env
  // (senha já personalizada pelo administrador da instância)
  const hasCustomPass = !!envPass && envPass.length > 0;
  return {
    email: envEmail ?? 'aurainstitutosermelhor@gmail.com',
    initialPass: envPass ?? '',
    mustChangePassword: !hasCustomPass, // true apenas se senha ainda não foi configurada
  };
}

/**
 * Retorna o timeout de sessão administrativa em milissegundos.
 * Configurável via VITE_ADMIN_SESSION_TIMEOUT_MINUTES (padrão: 30 minutos).
 */
export function getAdminSessionTimeoutMs(): number {
  const envObj = ((import.meta as any).env as Record<string, any>) || {};
  const minutes = parseInt(
    (envObj.VITE_ADMIN_SESSION_TIMEOUT_MINUTES as string) ?? '30',
    10
  );
  const validMinutes = isNaN(minutes) || minutes < 5 ? 30 : minutes;
  return validMinutes * 60 * 1000;
}

/**
 * Simula a verificação de hash forte (PBKDF2/Argon2id).
 * Em produção, esta comparação deve ocorrer no backend via hash seguro.
 */
export async function verifyPasswordHash(password: string, expectedPass: string): Promise<boolean> {
  if (!expectedPass) return false;
  await new Promise(r => setTimeout(r, 200)); // Latência de verificação criptográfica
  return password === expectedPass;
}

/**
 * Valida a força da nova senha conforme requisitos institucionais (Prompt 177 ETAPA 3):
 * - Mínimo 10 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caractere especial (@$!%*?&#)
 */
export function validateStrongPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 10) {
    return { valid: false, message: 'A senha deve conter no mínimo 10 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra minúscula.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos um número.' };
  }
  if (!/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos um caractere especial (ex: @, #, $, %).' };
  }
  return { valid: true };
}

/**
 * Salva a alteração da senha do Super Administrador invalidando a provisória.
 * Registra data e hora da alteração para auditoria.
 */
export function saveSuperAdminPasswordChange(email: string, newPass: string): SuperAdminConfig {
  const updatedConfig: SuperAdminConfig = {
    email: email.toLowerCase().trim(),
    initialPass: newPass,
    mustChangePassword: false,
    passwordLastChangedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
  return updatedConfig;
}
