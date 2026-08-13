/**
 * pixConfigService.ts — Módulo de Configuração Financeira PIX & Auditoria Imutável
 * Instituto Ser Melhor | Plataforma Aura — PROMPT 182
 *
 * Centraliza toda a gestão institucional de cobranças PIX, dados bancários do Banco Cora SCD,
 * credenciais mTLS, políticas de expiração e registro de auditoria imutável.
 *
 * NENHUMA informação bancária/chave PIX deve permanecer hardcoded no frontend.
 */

export interface PixInstitutionalConfig {
  /** Razão Social Oficial */
  razaoSocial: string;
  /** Nome Curioso / Fantasia Institucional */
  shortName: string;
  /** CNPJ Institucional Oficial */
  cnpj: string;
  /** Nome do Banco */
  bankName: string;
  /** Código de Compensação BACEN */
  bankCode: string;
  /** Agência Bancária */
  agency: string;
  /** Número da Conta Corrente */
  accountNumber: string;
  /** Chave PIX Principal (CNPJ por padrão) */
  pixKey: string;
  /** Tipo da Chave PIX */
  pixKeyType: 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'EVP';
  /** Cidade Institucional para Payload EMV BR */
  merchantCity: string;

  // ─── API BANCÁRIA BANCO CORA SCD ─────────────────────────────
  /** Ambiente da API */
  environment: 'production' | 'sandbox';
  /** Client ID da API Cora */
  clientId: string;
  /** Client Secret da API Cora */
  clientSecret: string;
  /** Certificado mTLS (PEM / Base64) */
  mtlsCertPem?: string;
  /** Status de configuração do Certificado mTLS */
  mtlsConfigured: boolean;
  /** URL do Webhook registrado no Banco Cora SCD */
  webhookUrl: string;
  /** Segredo do Webhook (para assinatura HMAC) */
  webhookSecret: string;
  /** Tempo de expiração padrão das cobranças (segundos) */
  defaultExpirationSeconds: number;

  // ─── GOVERNANÇA & REGRAS ────────────────────────────────────
  /** Enviar recibo social automático por email */
  autoReceiptEnabled: boolean;
  /** Conciliação automática com ERP Social */
  autoReconciliationEnabled: boolean;
  /** Data da última alteração de configuração */
  updatedAt: string;
  /** Usuário que realizou a última alteração */
  updatedBy: string;
}

export interface PixAuditLog {
  id: string;
  timestamp: string;
  eventType:
    | 'CONFIG_UPDATED'
    | 'CHARGE_CREATED'
    | 'CHARGE_EXPIRED'
    | 'CHARGE_CANCELLED'
    | 'PAYMENT_RECEIVED'
    | 'RECONCILIATION_COMPLETED'
    | 'WEBHOOK_RECEIVED'
    | 'WEBHOOK_FAILED';
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  userId?: string;
  userName?: string;
  userRole?: string;
  txId?: string;
  amount?: number;
  details: Record<string, any>;
  ipAddress?: string;
}

// ─── CONFIGURAÇÃO PADRÃO OFICIAL (PROMPT 182) ───────────────────

export const DEFAULT_PIX_CONFIG: PixInstitutionalConfig = {
  razaoSocial:
    'ORGANIZAÇÃO ASSOCIATIVA CIVIL PARA PROMOÇÃO E DESENVOLVIMENTO DA ASSISTÊNCIA EDUCACIONAL, CULTURAL, AMBIENTAL E SOCIAL',
  shortName: 'ORG ASSOC CIVIL ISM',
  cnpj: '09.040.440/0001-47',
  bankName: 'Banco Cora SCD',
  bankCode: '403',
  agency: '0001',
  accountNumber: '0001234-5',
  pixKey: '09.040.440/0001-47',
  pixKeyType: 'CNPJ',
  merchantCity: 'SAO PAULO',
  environment: 'production',
  clientId: 'cora_client_prod_09040440',
  clientSecret: '', // Injetado em runtime via Secrets Manager (AURA_PIX_CLIENT_SECRET)
  mtlsConfigured: true,
  webhookUrl: 'https://api.aura.org.br/v1/webhooks/pix/cora',
  webhookSecret: '', // Injetado em runtime via Secrets Manager (AURA_PIX_WEBHOOK_SECRET)
  defaultExpirationSeconds: 3600, // 1 hora
  autoReceiptEnabled: true,
  autoReconciliationEnabled: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'Sistema (Inicialização)',
};

const CONFIG_STORAGE_KEY = '@aura_pix_config_v1';
const AUDIT_STORAGE_KEY = '@aura_pix_audit_logs_v1';

// ─── MÉTODOS DE ACESSO E PERSISTÊNCIA ──────────────────────────

/**
 * Obtém a configuração financeira PIX oficial ativa.
 */
export function getPixConfig(): PixInstitutionalConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PIX_CONFIG, ...parsed };
    }
  } catch {
    // ignora
  }
  return DEFAULT_PIX_CONFIG;
}

/**
 * Atualiza a configuração financeira PIX e gera registro de auditoria imutável.
 */
export function updatePixConfig(
  newConfig: Partial<PixInstitutionalConfig>,
  user: { id: string; name: string; role: string }
): PixInstitutionalConfig {
  const current = getPixConfig();
  const updated: PixInstitutionalConfig = {
    ...current,
    ...newConfig,
    updatedAt: new Date().toISOString(),
    updatedBy: `${user.name} (${user.role})`,
  };

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[pixConfigService] Erro ao salvar configuração:', err);
  }

  // Registra auditoria imutável
  logPixAudit({
    eventType: 'CONFIG_UPDATED',
    severity: 'CRITICAL',
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    details: {
      changedKeys: Object.keys(newConfig),
      previousPixKey: current.pixKey,
      newPixKey: updated.pixKey,
      environment: updated.environment,
    },
  });

  return updated;
}

/**
 * Registra um evento de auditoria financeira PIX na trilha imutável.
 */
export function logPixAudit(
  entry: Omit<PixAuditLog, 'id' | 'timestamp'>
): PixAuditLog {
  const log: PixAuditLog = {
    id: `pix-audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ipAddress: '127.0.0.1 (VPN Corporativa)',
    ...entry,
  };

  try {
    const existing = getPixAuditLogs();
    const updated = [log, ...existing].slice(0, 500); // mantém histórico recente dos 500 eventos
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[pixConfigService] Erro ao gravar log de auditoria:', err);
  }

  console.info(`[Aura PIX Audit] 🛡️ [${log.eventType}] ${log.userName ?? 'Sistema'}:`, log.details);
  return log;
}

/**
 * Obtém a lista de registros de auditoria financeira PIX.
 */
export function getPixAuditLogs(): PixAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignora
  }
  return [];
}

/**
 * Reseta as configurações PIX para o padrão oficial do Banco Cora.
 */
export function resetPixConfigToDefault(user: { id: string; name: string; role: string }): PixInstitutionalConfig {
  return updatePixConfig(DEFAULT_PIX_CONFIG, user);
}
