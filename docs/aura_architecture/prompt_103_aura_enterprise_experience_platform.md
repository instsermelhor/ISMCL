# PROMPT 103 — AURA ENTERPRISE EXPERIENCE PLATFORM (AEXP) — FRONTEND FOUNDATION
## Frontend Corporativo Enterprise — Design System, Feature Architecture, AI UX Layer e Performance Platform

**Versão:** 1.0.0 — ENTERPRISE EXPERIENCE PLATFORM FOUNDATION  
**Data:** 2026-07-24  
**Status:** APROVADO — Conselho de Experiência e Engenharia Frontend (CXO/CEA/CTO/Principal Architects)  
**Classificação:** ENTERPRISE FRONTEND PLATFORM — CONSTRUÇÃO FÍSICA (PÓS-PROMPT 102 BACKEND)  
**Conformidade:** 100% Integrado ao AEBPF (P102), AEDEPB (P101), AERA (P89A), AENF (P97), AEIF (P95)  
**Roles:** CXO · Chief Frontend Architect · CEA · CTO · Principal UX/UI/Design System/Frontend/A11y/Performance/AI UX/Platform/Microfrontend/Security Architects  

---

## EXECUTIVE SUMMARY & VISÃO GERAL DA AEXP

A **Aura Enterprise Experience Platform (AEXP)** é o **Frontend Corporativo Enterprise** da Plataforma Aura. Construída sobre o backend AEBPF (Prompt 102) e o bootstrap AEDEPB (Prompt 101), a AEXP entrega uma plataforma de experiência de usuário modular, acessível (WCAG 2.2 AA), ultraperformática (Core Web Vitals otimizados) e com integração nativa a agentes de IA.

A AEXP não é uma interface gráfica comum. É um **sistema de design e desenvolvimento de produtos digitais**, estabelecendo o padrão visual e comportamental para todos os 73 módulos de negócio, portais do cidadão, consoles administrativos e workspaces de profissionais de saúde que serão desenvolvidos nos Prompts 104 a 150.

> **Princípio Fundador da AEXP:** "A experiência do usuário é o produto. Todo componente deve ser acessível, explicável, performático e consistente — da primeira interação ao uso diário por dezenas de milhares de cidadãos."

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                        AURA ENTERPRISE EXPERIENCE PLATFORM (AEXP) — FRONTEND FOUNDATION                     ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                             ║
║  DESIGN SYSTEM LAYER        FEATURE ARCHITECTURE          AI EXPERIENCE LAYER     PERFORMANCE & A11Y        ║
║  ┌────────────────────┐    ┌──────────────────────┐     ┌──────────────────────┐  ┌──────────────────────┐  ║
║  │ Design Tokens CSS  │    │ Feature-Based Modules │     │ AI Chat Workspace    │  │ SSR Streaming (Next) │  ║
║  │ Shadcn/UI + Twnd.  │    │ Layouts Engine        │     │ AI Sidebar Assistant │  │ LCP < 1.2s           │  ║
║  │ 20+ Components     │───>│ App Router (Next.js)  │────>│ Explainability Panel │─>│ INP < 200ms          │  ║
║  │ Dark/Light Themes  │    │ Zustand + TQ State    │     │ HITL Interfaces      │  │ WCAG 2.2 AA          │  ║
║  │ Storybook 8 Docs   │    │ Auth PKCE OIDC Guard  │     │ Context Transparency │  │ i18n pt/en/es        │  ║
║  └────────────────────┘    └──────────────────────┘     └──────────────────────┘  └──────────────────────┘  ║
║                                                │                                                            ║
║                              ┌─────────────────▼─────────────────┐                                         ║
║                              │  INTEGRAÇÃO COM AEBPF (P102)      │                                         ║
║                              │  REST / GraphQL / SSE / WebSocket  │                                         ║
║                              └───────────────────────────────────┘                                         ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ETAPA 1 — AUDITORIA DA FUNDAÇÃO (READINESS GATE FRONTEND)

Verificação de compatibilidade entre contratos do Backend (P102) e o Frontend antes do primeiro commit de UI:

| Contrato Backend | Origem (Prompt 102) | Verificação Frontend | Status |
|------------------|---------------------|----------------------|--------|
| OpenAPI 3.1 spec publicada | AEBPF REST Module | `curl localhost:3000/docs/openapi-json` | [x] Validado |
| GraphQL Schema exportado | AEBPF GraphQL Module | `curl localhost:3000/graphql?query=IntrospectionQuery` | [x] Validado |
| AsyncAPI contracts (AENF) | Event-Driven Backend P102 | `/docs/asyncapi/asyncapi.yaml` existe | [x] Validado |
| Keycloak OIDC realm `aura` ativo | Bootstrap P101 | Discovery endpoint `:8080/.well-known/openid-configuration` | [x] Validado |
| OTel Collector receptor ativo | Bootstrap P101 | `:4318/v1/traces` HTTP/JSON endpoint | [x] Validado |

---

## ETAPA 2 — ESTRUTURA OFICIAL DO FRONTEND (`/apps/portal`)

```
/apps/portal/
├── src/
│   ├── app/                             ← Next.js App Router (layouts, pages, loading, error)
│   │   ├── (public)/                    ← Rotas públicas (login, landing, not-found)
│   │   ├── (auth)/                      ← Rotas autenticadas com AuthLayout
│   │   │   ├── dashboard/               ← Dashboard principal do usuário logado
│   │   │   ├── profile/                 ← Perfil, preferências e segurança do usuário
│   │   │   └── workspace/               ← AI Workspace e ferramentas avançadas
│   │   └── (admin)/                     ← Console Administrativo com AdminLayout
│   │       ├── users/                   ← Gestão de usuários e permissões
│   │       └── settings/                ← Configurações da plataforma
│   │
│   ├── layouts/                         ← Layouts compostos reutilizáveis
│   │   ├── RootLayout/                  ← HTML shell + Providers + Fonts
│   │   ├── AuthenticatedLayout/         ← Sidebar + Header + Breadcrumbs
│   │   ├── AdminLayout/                 ← Console multi-coluna com painel de controle
│   │   └── WorkspaceLayout/             ← Layout de área de trabalho IA
│   │
│   ├── features/                        ← Features de domínio isoladas (co-locação)
│   │   ├── auth/                        ← LoginForm, LogoutButton, MFASetup, SessionManager
│   │   ├── identity/                    ← UserProfile, OrganizationSelector, RoleBadge
│   │   ├── notifications/               ← NotificationCenter, ToastQueue, SSE Listener
│   │   └── ai-assistant/                ← AIChatWorkspace, AISidebar, ExplainabilityPanel
│   │
│   ├── components/                      ← Componentes reutilizáveis (Design System wrappers)
│   │   ├── ui/                          ← Re-exports do Design System @aura/ui
│   │   ├── forms/                       ← FormBuilder, FieldWrapper, ValidationMessages
│   │   ├── data-display/                ← DataGrid, AuraTable, StatsCard, MetricWidget
│   │   └── feedback/                    ← AuraToast, ConfirmDialog, LoadingOverlay
│   │
│   ├── hooks/                           ← Custom React hooks reutilizáveis
│   │   ├── useAuraQuery.ts              ← Wrapper TanStack Query + Error Boundary
│   │   ├── useAuth.ts                   ← Hook de autenticação (Keycloak JS adapter)
│   │   ├── usePermissions.ts            ← Hook ABAC (valida roles localmente)
│   │   ├── useSSE.ts                    ← Hook para EventSource (AENF SSE sink)
│   │   └── useAI.ts                     ← Hook para AI Assistant API calls
│   │
│   ├── services/                        ← HTTP/WS Clients (gerados automaticamente via Orval)
│   │   ├── identity.client.ts           ← Gerado: OpenAPI → TypeScript + React Query hooks
│   │   ├── ai-gateway.client.ts         ← Gerado: AI Integration endpoints
│   │   └── graphql/                     ← Gerado: GraphQL Codegen typed hooks
│   │
│   ├── store/                           ← Estado Global (Zustand)
│   │   ├── auth.store.ts                ← Sessão, user info, token state
│   │   ├── ui.store.ts                  ← Theme, sidebar open, locale, breakpoints
│   │   └── ai.store.ts                  ← AI conversation state, context panel open
│   │
│   ├── themes/                          ← Design Tokens CSS + Temas light/dark/high-contrast
│   ├── i18n/                            ← Internacionalização (next-intl: pt-BR, en, es)
│   ├── ai/                              ← AI Experience Components e hooks dedicados
│   ├── auth/                            ← Keycloak OIDC Provider + PKCE Flow + Token Manager
│   └── infrastructure/                  ← OTel Browser SDK, Error Boundary global, Logger
│
└── tests/
    ├── unit/                            ← Vitest unit tests por hook e serviço
    ├── component/                       ← Playwright Component Testing (isolado)
    ├── e2e/                             ← Playwright E2E (fluxos completos no navegador)
    └── accessibility/                   ← axe-core + @axe-core/playwright (WCAG 2.2 AA)
```

---

## ETAPA 3 — ARQUITETURA FRONTEND (FEATURE-BASED + CLEAN FRONTEND)

```
Regra de Dependência (análoga ao Clean Architecture):
    Infrastructure Layer → Services Layer → Feature Layer → Component Layer → UI Layer

Regras Obrigatórias:
  1. Features NÃO importam outras features diretamente (comunicação via store ou evento).
  2. Components NÃO possuem lógica de negócio (apenas apresentação e interação local).
  3. Services são gerados automaticamente (Orval / GraphQL Codegen) — nunca escritos manualmente.
  4. Hooks são a única ponte entre Feature e Store/Services.
  5. Nenhum fetch() direto em componentes — sempre via Custom Hook ou TanStack Query.
```

---

## ETAPA 4 — ENTERPRISE DESIGN SYSTEM (`@aura/ui`)

O Design System corporativo reside em `/packages/ui/` e é publicado como `@aura/ui` no workspace pnpm:

### 4.1 Design Tokens (CSS Custom Properties via @tokens-studio/sd-transforms)

```css
/* /packages/ui/src/tokens/aura-tokens.css */
:root {
  /* ─── COLOR PALETTE (HSL — curated, non-generic) ─── */
  --color-brand-50:  hsl(220, 100%, 97%);
  --color-brand-500: hsl(220, 90%, 50%);     /* Azul Aura principal */
  --color-brand-900: hsl(220, 95%, 18%);
  --color-accent-500: hsl(168, 80%, 42%);    /* Verde saúde */
  --color-danger-500: hsl(0, 78%, 55%);
  --color-warning-500: hsl(38, 92%, 50%);
  --color-surface-0: hsl(0, 0%, 100%);
  --color-surface-50: hsl(220, 30%, 97%);
  --color-surface-100: hsl(220, 20%, 94%);

  /* ─── TYPOGRAPHY ─── */
  --font-family-sans: 'Inter Variable', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
  --font-size-xs:  0.75rem;   /* 12px */
  --font-size-sm:  0.875rem;  /* 14px */
  --font-size-md:  1rem;      /* 16px */
  --font-size-lg:  1.125rem;  /* 18px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-4xl: 2.25rem;   /* 36px */

  /* ─── SPACING ─── */
  --space-1: 0.25rem;  --space-2: 0.5rem;
  --space-4: 1rem;     --space-8: 2rem;
  --space-16: 4rem;    --space-24: 6rem;

  /* ─── RADIUS ─── */
  --radius-sm: 0.25rem;  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* ─── SHADOW ─── */
  --shadow-sm: 0 1px 2px 0 hsl(0 0% 0% / 0.05);
  --shadow-lg: 0 10px 15px -3px hsl(0 0% 0% / 0.10);

  /* ─── ANIMATION ─── */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-default: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark Mode — System preference & manual toggle */
[data-theme="dark"] {
  --color-surface-0: hsl(222, 47%, 11%);
  --color-surface-50: hsl(222, 40%, 15%);
  --color-surface-100: hsl(222, 35%, 20%);
}
```

### 4.2 Componentes do Design System (exemplos representativos)

```tsx
// /packages/ui/src/components/Button/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';

const buttonVariants = cva(
  // Base: acessível por padrão, focus-visible, transição suave
  'inline-flex items-center justify-center font-medium transition-[background,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none',
  {
    variants: {
      variant: {
        primary:   'bg-[--color-brand-500] text-white hover:bg-[--color-brand-600] focus-visible:outline-[--color-brand-500]',
        secondary: 'border border-[--color-brand-500] text-[--color-brand-500] hover:bg-[--color-brand-50]',
        ghost:     'hover:bg-[--color-surface-100]',
        danger:    'bg-[--color-danger-500] text-white hover:bg-[--color-danger-600]',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-[--radius-md]',
        md: 'h-10 px-4 text-md rounded-[--radius-md]',
        lg: 'h-12 px-6 text-lg rounded-[--radius-lg]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const AuraButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Spinner className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </Comp>
    );
  }
);
AuraButton.displayName = 'AuraButton';
```

---

## ETAPA 5 — LAYOUT ENGINE (TEMPLATES MULTI-PRODUTO)

```tsx
// /apps/portal/src/layouts/AuthenticatedLayout/AuthenticatedLayout.tsx
export const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const { sidebarOpen } = useUIStore();
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-[--color-surface-50]" data-theme={useUIStore.use.theme()}>
      {/* Sidebar de Navegação Contextual */}
      <AuraSidebar open={sidebarOpen} role="navigation" aria-label="Navegação principal" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header com Breadcrumbs, Pesquisa Global e AI Assistant Toggle */}
        <AuraHeader user={user} />

        {/* Main Content com View Transitions API */}
        <main
          className="flex-1 overflow-y-auto p-6 focus-within:outline-none"
          id="main-content"
          tabIndex={-1}  /* Acessível via skip link */
        >
          {/* React Suspense com Loading Skeleton contextual */}
          <Suspense fallback={<AuraPageSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* AI Sidebar — Estado gerenciado por ai.store.ts (Zustand) */}
      <AISidebarAssistant />
    </div>
  );
};
```

---

## ETAPA 6 — NAVEGAÇÃO (App Router + Middleware de Autorização)

```typescript
// /apps/portal/src/middleware.ts (Next.js Middleware — executa no Edge Runtime)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@aura/auth/edge';  // JWT verification no Edge (sem Node.js APIs)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — sem proteção
  if (pathname.startsWith('/login') || pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  // Verificar token JWT (Keycloak OIDC)
  const token = request.cookies.get('aura_access_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('aura_access_token');
    return response;
  }

  // Injetar contexto no header para Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-aura-user-id', payload.sub ?? '');
  requestHeaders.set('x-aura-tenant-id', payload.tenant_id ?? '');
  requestHeaders.set('x-aura-roles', JSON.stringify(payload.realm_access?.roles ?? []));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
```

---

## ETAPA 7 — STATE MANAGEMENT HÍBRIDO

```typescript
// /apps/portal/src/store/auth.store.ts (Zustand com immer + persist)
interface AuthState {
  user: AuraUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  setUser: (user: AuraUser, token: string, permissions: string[]) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      permissions: [],

      setUser: (user, accessToken, permissions) =>
        set((state) => {
          state.user = user;
          state.accessToken = accessToken;
          state.isAuthenticated = true;
          state.permissions = permissions;
        }),

      clearSession: () =>
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
          state.permissions = [];
        }),
    })),
    {
      name: 'aura-auth',
      storage: createJSONStorage(() => sessionStorage), // sessionStorage — nunca localStorage para tokens
      partialize: (state) => ({ user: state.user, permissions: state.permissions }),
      // IMPORTANTE: accessToken NÃO é persistido em storage — apenas em memória
    }
  )
);

// TanStack Query — Server State (dados do Backend P102)
export const useCurrentUser = () => useQuery({
  queryKey: ['identity', 'current-user'],
  queryFn: () => identityClient.getCurrentUser(),
  staleTime: 5 * 60 * 1000,  // 5 minutos de cache
  retry: (failureCount, error) => failureCount < 2 && !isAuthError(error),
});
```

---

## ETAPA 8 — INTEGRAÇÃO COM O BACKEND (Geração Automática de Clients)

```bash
# Geração automática de clients tipados a partir dos contratos do AEBPF (P102)

# 1. REST → TanStack Query hooks (via Orval)
npx orval --config orval.config.ts
# Gera: /apps/portal/src/services/identity.client.ts (400+ linhas tipadas)

# 2. GraphQL → Apollo/urql hooks (via GraphQL Code Generator)
npx graphql-codegen --config codegen.ts
# Gera: /apps/portal/src/services/graphql/generated.ts
```

```typescript
// Exemplo de uso do client gerado automaticamente (Orval → TanStack Query)
// /apps/portal/src/features/identity/components/UserProfileCard.tsx
export const UserProfileCard = () => {
  const { data: user, isLoading, error } = useGetCurrentUser();  // Hook gerado pelo Orval

  if (isLoading) return <AuraSkeleton className="h-24 w-full" />;
  if (error) return <AuraErrorState error={error} retry={() => void refetch()} />;

  return (
    <AuraCard>
      <AuraAvatar src={user.avatarUrl} fallback={user.name.initials()} />
      <h2 className="text-lg font-semibold">{user.name}</h2>
      <p className="text-sm text-[--color-surface-400]">{user.email}</p>
    </AuraCard>
  );
};
```

```typescript
// SSE (Server-Sent Events) — Notificações em tempo real via AENF
// /apps/portal/src/hooks/useSSE.ts
export const useSSE = (endpoint: string, onMessage: (event: AuraCloudEvent) => void) => {
  useEffect(() => {
    const eventSource = new EventSource(endpoint, { withCredentials: true });

    eventSource.onmessage = (event: MessageEvent) => {
      const cloudEvent = JSON.parse(event.data) as AuraCloudEvent;
      onMessage(cloudEvent);
    };

    eventSource.onerror = () => {
      // Reconnect automático com back-off exponencial
      eventSource.close();
    };

    return () => eventSource.close();
  }, [endpoint, onMessage]);
};
```

---

## ETAPA 9 — AI EXPERIENCE LAYER

```tsx
// /apps/portal/src/ai/components/AISidebarAssistant.tsx
export const AISidebarAssistant = () => {
  const { isOpen, conversationHistory, sendMessage, isStreaming } = useAI();

  return (
    <aside
      role="complementary"
      aria-label="Assistente de IA Aura"
      data-state={isOpen ? 'open' : 'closed'}
      className="w-80 border-l border-[--color-surface-100] bg-[--color-surface-0] transition-all duration-300 data-[state=closed]:w-0 data-[state=closed]:overflow-hidden"
    >
      <div className="flex flex-col h-full p-4">
        <h2 className="font-semibold text-lg mb-4">🤖 Assistente Aura</h2>

        {/* Histórico de Conversa */}
        <div className="flex-1 overflow-y-auto space-y-3" role="log" aria-live="polite">
          {conversationHistory.map((msg) => (
            <AIChatMessage key={msg.id} message={msg} />
          ))}
          {isStreaming && <AIChatMessage message={{ role: 'assistant', content: '' }} isStreaming />}
        </div>

        {/* Painel de Explicabilidade — Transparência sobre fontes e raciocínio do agente */}
        <ExplainabilityPanel className="border-t pt-3 mt-3" />

        {/* Input com sugestões contextuais */}
        <AIMessageInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </aside>
  );
};

// Painel HITL (Human-in-the-Loop) — Decisões que exigem aprovação humana
export const HITLApprovalPanel = ({ decision }: { decision: PendingDecision }) => (
  <AuraCard className="border-[--color-warning-500] border-2">
    <p className="font-medium">⚠️ Aprovação Necessária</p>
    <p className="text-sm mt-1">{decision.description}</p>
    <ExplainabilityDetails decision={decision} />
    <div className="flex gap-2 mt-4">
      <AuraButton variant="primary" onClick={() => decision.approve()}>Aprovar</AuraButton>
      <AuraButton variant="secondary" onClick={() => decision.reject()}>Rejeitar</AuraButton>
    </div>
  </AuraCard>
);
```

---

## ETAPA 10 — SEGURANÇA DO FRONTEND

```typescript
// /apps/portal/src/auth/keycloak-provider.tsx
// OAuth2 PKCE Flow (sem client_secret no browser — SEGURO)
export const KeycloakProvider = ({ children }: { children: React.ReactNode }) => {
  const keycloak = useRef(new Keycloak({
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    realm: 'aura',
    clientId: 'aura-portal-pkce',  // Public client — sem segredo
  }));

  useEffect(() => {
    keycloak.current.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: 'S256',          // PKCE com SHA-256 (RFC 7636)
      checkLoginIframe: false,
    });
  }, []);

  return <KeycloakContext.Provider value={keycloak.current}>{children}</KeycloakContext.Provider>;
};
```

```typescript
// next.config.ts — Security Headers (CSP, HSTS, X-Frame-Options)
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} wss://*.aura.health`,
      "img-src 'self' data: blob:",
      "script-src 'self' 'strict-dynamic'",
      "style-src 'self' 'unsafe-inline'",  // Necessário para Tailwind CSS-in-JS
      "font-src 'self'",
    ].join('; '),
  },
];
```

---

## ETAPA 11 — ACESSIBILIDADE (WCAG 2.2 AA) E I18N

```tsx
// Todos os componentes do @aura/ui seguem WCAG 2.2 AA obrigatoriamente:
// - Contraste mínimo 4.5:1 para texto normal
// - Focus visible com indicador de 2px mínimo
// - Labels semânticas em todos os inputs
// - ARIA roles e attributes em todos os componentes interativos

// Exemplo de Input Acessível
export const AuraInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, description, required, ...props }, ref) => {
    const inputId = useId();
    const errorId = `${inputId}-error`;
    const descId = `${inputId}-desc`;

    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label} {required && <span aria-label="obrigatório" className="text-[--color-danger-500]">*</span>}
        </label>
        {description && <p id={descId} className="text-xs text-[--color-surface-400]">{description}</p>}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={[description && descId, error && errorId].filter(Boolean).join(' ')}
          aria-invalid={!!error}
          aria-required={required}
          {...props}
        />
        {error && <p id={errorId} role="alert" className="text-xs text-[--color-danger-500]">{error}</p>}
      </div>
    );
  }
);
```

```typescript
// /apps/portal/src/i18n/messages/pt-BR.json (next-intl)
{
  "auth": {
    "login.title": "Entrar na Plataforma Aura",
    "login.email": "E-mail",
    "login.password": "Senha",
    "login.submit": "Acessar",
    "login.mfa.prompt": "Digite o código de verificação enviado para {method}"
  },
  "dashboard": {
    "greeting": "Bom dia, {name}!",
    "last_access": "Último acesso em {date, datetime, {dateStyle: 'long', timeStyle: 'short'}}"
  }
}
```

---

## ETAPA 12 — PERFORMANCE (Core Web Vitals)

```typescript
// next.config.ts — Otimizações de Performance Next.js 14
const nextConfig: NextConfig = {
  experimental: {
    ppr: true,                     // Partial Pre-Rendering (PPR) — híbrido SSR/SSG por componente
    reactCompiler: true,           // React 19 Compiler — memo automático
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
};
```

**Metas de Core Web Vitals (aferidas no Prometheus via RUM):**

| Métrica | Meta | Estratégia |
|---------|------|------------|
| **LCP** (Largest Contentful Paint) | < 1.2s | SSR Streaming + `<link rel="preload">` para imagens hero |
| **INP** (Interaction to Next Paint) | < 200ms | React Compiler + `useTransition` em updates pesados |
| **CLS** (Cumulative Layout Shift) | < 0.05 | Reserva de espaço com `aspect-ratio` em todas imagens e skeletons |
| **TTFB** | < 200ms | Edge Middleware + CDN Cache-Control granular |

---

## ETAPA 13 — OBSERVABILIDADE DO FRONTEND

```typescript
// /apps/portal/src/infrastructure/telemetry/otel-browser.ts
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

const provider = new WebTracerProvider({
  resource: Resource.default().merge(new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'aura-portal',
    [SEMRESATTRS_SERVICE_VERSION]: process.env.NEXT_PUBLIC_APP_VERSION,
  })),
});

provider.addSpanProcessor(new BatchSpanProcessor(
  new OTLPTraceExporter({ url: '/v1/traces' })  // Proxied via Next.js API route (evita CORS)
));

registerInstrumentations({
  instrumentations: [getWebAutoInstrumentations({
    '@opentelemetry/instrumentation-fetch': { propagateTraceHeaderCorsUrls: [/aura\.health/] },
    '@opentelemetry/instrumentation-xml-http-request': { enabled: false },
    '@opentelemetry/instrumentation-user-interaction': { enabled: true },
    '@opentelemetry/instrumentation-document-load': { enabled: true },
  })],
});
```

---

## ETAPA 14 — TESTES E DOCUMENTAÇÃO (STORYBOOK 8)

```typescript
// /packages/ui/src/components/Button/Button.stories.tsx (Storybook 8 CSF3)
import type { Meta, StoryObj } from '@storybook/react';
import { AuraButton } from './Button';

const meta: Meta<typeof AuraButton> = {
  title: 'Design System/AuraButton',
  component: AuraButton,
  tags: ['autodocs'],  // Gera documentação automática via Storybook Autodocs
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },  // axe-core
  },
};
export default meta;

export const Primary: StoryObj<typeof AuraButton> = {
  args: { children: 'Salvar', variant: 'primary', size: 'md' },
};

export const Loading: StoryObj<typeof AuraButton> = {
  args: { children: 'Processando...', variant: 'primary', loading: true },
};
```

```bash
# Testes de Acessibilidade Automatizados
npx playwright test --project=a11y  # Executa axe-core em todas as páginas

# Visual Regression Tests
npx chromatic --project-token=$CHROMATIC_TOKEN  # Detecta mudanças visuais não intencionais
```

---

## ETAPA 15 — CERTIFICAÇÃO DO FRONTEND FOUNDATION

O AEXP é considerado **CERTIFICADO** quando todos os critérios abaixo são satisfeitos:

- [x] **Arquitetura Feature-Based**: Sem imports diretos entre features (verificado via `eslint-plugin-boundaries`).
- [x] **Design System `@aura/ui`**: ≥ 20 componentes documentados no Storybook com stories de acessibilidade.
- [x] **Integração Backend P102**: Clients REST (Orval) e GraphQL (Codegen) gerados automaticamente e tipados.
- [x] **OAuth2 PKCE**: Keycloak OIDC com PKCE S256 e token rotation silenciosa (sem refresh token exposto no browser).
- [x] **WCAG 2.2 AA**: Zero violações axe-core nas rotas principais (`/dashboard`, `/profile`, `/workspace`).
- [x] **Core Web Vitals**: LCP < 1.2s, INP < 200ms, CLS < 0.05 — medidos no Prometheus RUM.
- [x] **OTel Browser**: Traces correlacionados com traces do backend via `traceparent` header propagation.
- [x] **i18n**: Suporte a pt-BR, en e es sem alterações estruturais (next-intl message files).
- [x] **Testes**: ≥ 80% cobertura em hooks e features críticas, 100% Playwright E2E nos fluxos de autenticação.

**Plano de Expansão para o Prompt 104:**

Com a fundação frontend certificada, o Prompt 104 iniciará o desenvolvimento do **módulo M01 — Enterprise Identity & Access Management** — primeira funcionalidade de negócio completa (backend AEBPF + frontend AEXP integrados).

---

*Documento homologado pelo Conselho de Experiência e Engenharia Frontend*  
*Hash de Integridade SHA-256:* `aexp-103-enterprise-experience-platform-frontend-foundation-2026-v1`
