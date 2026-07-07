// ============================================================
// bankingService.ts — Camada de Abstração para APIs Bancárias
// Instituto Ser Melhor | Plataforma Aura
// ============================================================
// Para ativar integração real com um banco:
//   1. Configure as credenciais em Settings > Integrações
//   2. Substitua o stub da função correspondente pela chamada fetch() real
//   3. Configure o webhook no painel do banco para notificações de pagamento
// ============================================================

// ─── Interfaces Compartilhadas ───────────────────────────────

export interface BankCredentials {
  bankId: BankId;
  clientId: string;
  clientSecret: string;
  pixKey?: string;
  /** Certificado mTLS em base64 (exigido por BB, Itaú, Bradesco) */
  tlsCert?: string;
  /** Ambiente: 'sandbox' para homologação, 'production' para produção */
  environment: 'sandbox' | 'production';
}

export type BankId =
  | 'efi'        // Efí Bank (ex-Gerencianet) — mais popular para OSC/MEI
  | 'sicredi'    // Sicredi — cooperativa
  | 'bb'         // Banco do Brasil
  | 'itau'       // Itaú
  | 'bradesco'   // Bradesco
  | 'caixa'      // Caixa Econômica Federal
  | 'santander'  // Santander
  | 'inter'      // Banco Inter
  | 'nubank'     // Nubank
  | 'stripe'     // Stripe (internacional, BRL)
  | 'paypal'     // PayPal (USD/BRL)
  | 'wise';      // Wise (remessas internacionais)

export interface BankAccount {
  bankId: BankId;
  bankName: string;
  accountNumber: string;
  agency?: string;
  pixKey?: string;
  balance: number;
  currency: 'BRL' | 'USD' | 'EUR';
  lastSync: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING';
}

export interface PixCharge {
  txid: string;
  status: 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP';
  valor: { original: string };
  chave: string;
  solicitacaoPagador?: string;
  devedor?: { nome: string; cpf?: string; cnpj?: string };
  pixCopiaECola: string;
  qrCode?: string;
  calendario: { criacao: string; expiracao?: number };
  pix?: Array<{ endToEndId: string; txid: string; valor: string; horario: string; infoPagador?: string }>;
}

export interface BankStatement {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  balance: number;
  source: BankId;
}

// ─── OAuth2 Token Helpers ────────────────────────────────────

/**
 * Obtém token OAuth2 para o banco especificado.
 * @production Substitua a URL pelo endpoint real do banco.
 */
export async function getBankOAuthToken(creds: BankCredentials): Promise<string> {
  const OAUTH_URLS: Record<BankId, { sandbox: string; production: string }> = {
    efi: {
      sandbox: 'https://pix-h.api.efipay.com.br/oauth/token',
      production: 'https://pix.api.efipay.com.br/oauth/token',
    },
    sicredi: {
      sandbox: 'https://api-h.sicredi.com.br/auth/openapi/token',
      production: 'https://api.sicredi.com.br/auth/openapi/token',
    },
    bb: {
      sandbox: 'https://oauth.sandbox.bb.com.br/oauth/token',
      production: 'https://oauth.bb.com.br/oauth/token',
    },
    itau: {
      sandbox: 'https://sts.itau.com.br/api/oauth/token', // Sandbox Itaú
      production: 'https://sts.itau.com.br/api/oauth/token',
    },
    bradesco: {
      sandbox: 'https://proxy.api.prebanco.com.br/auth/server/v1.1/token',
      production: 'https://proxy.api.bradesco.com.br/auth/server/v1.1/token',
    },
    caixa: {
      sandbox: 'https://sandbox.caixa.gov.br/oauth/token',
      production: 'https://api.caixa.gov.br/oauth/token',
    },
    santander: {
      sandbox: 'https://trust-open.api.santander.com.br/auth/oauth/v2/token',
      production: 'https://trust-open.api.santander.com.br/auth/oauth/v2/token',
    },
    inter: {
      sandbox: 'https://cdpj-sandbox.partners.uatinter.co/oauth/v2/token',
      production: 'https://cdpj.partners.inter.co/oauth/v2/token',
    },
    nubank: {
      sandbox: 'https://prod-s0-webapp.nubank.com.br/api/login',
      production: 'https://prod-s0-webapp.nubank.com.br/api/login',
    },
    stripe: {
      sandbox: 'https://api.stripe.com/v1/tokens', // Stripe usa API Keys, não OAuth
      production: 'https://api.stripe.com/v1/tokens',
    },
    paypal: {
      sandbox: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      production: 'https://api-m.paypal.com/v1/oauth2/token',
    },
    wise: {
      sandbox: 'https://api.sandbox.transferwise.tech/oauth/token',
      production: 'https://api.transferwise.com/oauth/token',
    },
  };

  const urls = OAUTH_URLS[creds.bankId];
  const tokenUrl = urls[creds.environment];

  // STUB → Substitua pelo fetch real com mTLS para BB/Itaú/Bradesco
  console.info(`[bankingService] OAuth2 token request → ${tokenUrl}`);
  // Exemplo de chamada real (descomentar em produção):
  // const response = await fetch(tokenUrl, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Basic ${btoa(`${creds.clientId}:${creds.clientSecret}`)}`,
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //   },
  //   body: 'grant_type=client_credentials&scope=cob.write cob.read cobv.write cobv.read pix.read webhook.write',
  // });
  // const data = await response.json();
  // return data.access_token;
  return `stub_token_${creds.bankId}_${Date.now()}`;
}

// ─── PIX API ─────────────────────────────────────────────────

/**
 * Cria uma cobrança PIX dinâmica (com txid, prazo e devedor opcional).
 * @production API Efí: POST /v2/cob/{txid}
 * @production API BB: PUT /pix/v2/cob/{txid}
 * @production API Itaú: POST /itau-ep9-api-pix-recebimento-v1/v1/cob
 */
export async function createPixCharge(
  creds: BankCredentials,
  params: {
    valor: string;
    solicitacaoPagador?: string;
    devedor?: { nome: string; cpf?: string; cnpj?: string };
    expiracao?: number; // segundos
  }
): Promise<PixCharge> {
  const txid = `ISM${Date.now()}`.substring(0, 35);
  // STUB
  return {
    txid,
    status: 'ATIVA',
    valor: { original: params.valor },
    chave: creds.pixKey ?? '',
    solicitacaoPagador: params.solicitacaoPagador,
    devedor: params.devedor,
    pixCopiaECola: `00020101021226${txid}`, // placeholder
    calendario: { criacao: new Date().toISOString(), expiracao: params.expiracao ?? 3600 },
  };
}

/**
 * Consulta status de uma cobrança PIX.
 * @production API Efí: GET /v2/cob/{txid}
 */
export async function getPixCharge(creds: BankCredentials, txid: string): Promise<PixCharge | null> {
  console.info(`[bankingService] GET /pix/cob/${txid} → ${creds.bankId}`);
  return null; // STUB
}

/**
 * Lista PIX recebidos (webhook ou polling).
 * @production API Efí: GET /v2/pix?inicio=...&fim=...
 * @production API BB: GET /pix/v2/pix?inicio=...&fim=...
 */
export async function listReceivedPix(
  creds: BankCredentials,
  _inicio: string,
  _fim: string
): Promise<PixCharge[]> {
  console.info(`[bankingService] GET /pix → ${creds.bankId}`);
  return []; // STUB
}

// ─── Open Banking / Extrato ───────────────────────────────────

/**
 * Consulta saldo da conta.
 * @production OpenFinance BR: GET /accounts/v3/{accountId}/balances
 * @production Efí: GET /v1/extrato/{inicio}/{fim}
 */
export async function getAccountBalance(creds: BankCredentials): Promise<number> {
  console.info(`[bankingService] GET balance → ${creds.bankId}`);
  return 0; // STUB
}

/**
 * Importa extrato bancário (OFX/JSON).
 * @production OpenFinance BR: GET /accounts/v3/{accountId}/transactions
 * @production Retorna lista de transações para conciliação automática.
 */
export async function getAccountStatement(
  creds: BankCredentials,
  _inicio: string,
  _fim: string
): Promise<BankStatement[]> {
  console.info(`[bankingService] GET statement → ${creds.bankId}`);
  return []; // STUB
}

// ─── Stripe / Internacional ───────────────────────────────────

/**
 * Cria Payment Intent no Stripe (para doações internacionais).
 * @production POST https://api.stripe.com/v1/payment_intents
 * @docs https://stripe.com/docs/api/payment_intents/create
 */
export async function createStripePaymentIntent(
  secretKey: string,
  amountCents: number,
  currency: 'brl' | 'usd' | 'eur',
  description: string
): Promise<{ clientSecret: string; id: string }> {
  console.info(`[bankingService] Stripe PaymentIntent ${amountCents} ${currency}`);
  // Exemplo real (descomentar em produção):
  // const resp = await fetch('https://api.stripe.com/v1/payment_intents', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${secretKey}`,
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //   },
  //   body: new URLSearchParams({ amount: String(amountCents), currency, description }),
  // });
  // return resp.json();
  return { clientSecret: 'pi_stub_secret', id: `pi_${Date.now()}` };
}

// ─── Banco de dados local de integrações ─────────────────────

const STORAGE_KEY = 'banking_integrations';

export function loadBankIntegrations(): Partial<BankCredentials>[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveBankIntegration(integration: Partial<BankCredentials>): void {
  const list = loadBankIntegrations();
  const idx = list.findIndex(i => i.bankId === integration.bankId);
  if (idx >= 0) list[idx] = integration;
  else list.push(integration);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function removeBankIntegration(bankId: BankId): void {
  const list = loadBankIntegrations().filter(i => i.bankId !== bankId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
