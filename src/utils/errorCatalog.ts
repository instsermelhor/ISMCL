/**
 * errorCatalog.ts — Prompt 181 (Etapa 13 — Catálogo de Erros)
 *
 * Mapeia erros conhecidos da Plataforma Aura para:
 * - Código único de erro (AUR-XXXX)
 * - Causa raiz documentada
 * - Componente afetado
 * - Ação corretiva recomendada
 * - Severidade operacional
 *
 * Uso: Permite triagem rápida de incidentes em produção
 * sem necessidade de análise manual do stack trace.
 */

// ================================================================
// TIPOS
// ================================================================

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ErrorCategory =
  | 'rendering'
  | 'auth'
  | 'context'
  | 'routing'
  | 'api'
  | 'permission'
  | 'import'
  | 'serialization'
  | 'lazy_loading';

export interface KnownError {
  /** Código único do erro (AUR-XXXX) */
  code: string;
  /** Categoria funcional */
  category: ErrorCategory;
  /** Severidade operacional */
  severity: ErrorSeverity;
  /** Padrão de string que identifica este erro no stack trace ou mensagem */
  matchPatterns: string[];
  /** Componente(s) ou arquivo(s) normalmente responsáveis */
  affectedComponents: string[];
  /** Causa raiz documentada */
  rootCause: string;
  /** Ação corretiva para o desenvolvedor */
  devAction: string;
  /** Mensagem amigável para o usuário final */
  userMessage: string;
  /** Resolvido na auditoria do Prompt 181? */
  resolvedInPrompt181?: boolean;
}

// ================================================================
// CATÁLOGO DE ERROS CONHECIDOS
// ================================================================

export const ERROR_CATALOG: KnownError[] = [
  // ── IMPORT / REFERÊNCIA ───────────────────────────────────────
  {
    code: 'AUR-0001',
    category: 'import',
    severity: 'critical',
    matchPatterns: [
      'CorporateKnowledgeCenter is not defined',
      'ReferenceError: CorporateKnowledgeCenter',
    ],
    affectedComponents: ['App.tsx', 'CorporateKnowledgeCenter.tsx'],
    rootCause:
      'Componente CorporateKnowledgeCenter referenciado na rota /conhecimento-corporativo ' +
      'sem o respectivo import em App.tsx. Causa white screen imediato ao navegar para a rota.',
    devAction:
      'Adicionar: import CorporateKnowledgeCenter from \'./pages/CorporateKnowledgeCenter\' em App.tsx.',
    userMessage:
      'O módulo Centro Corporativo de Conhecimento está temporariamente indisponível.',
    resolvedInPrompt181: true,
  },

  // ── CONTEXT / PROVIDERS ───────────────────────────────────────
  {
    code: 'AUR-0010',
    category: 'context',
    severity: 'critical',
    matchPatterns: [
      'useIAM deve ser usado dentro de <IAMProvider>',
      'useIAM deve ser usado dentro de',
    ],
    affectedComponents: ['IAMContext.tsx', 'main.tsx'],
    rootCause:
      'Hook useIAM() chamado fora da árvore do IAMProvider. ' +
      'Ocorre quando a hierarquia de Providers em main.tsx é alterada incorretamente.',
    devAction:
      'Verificar main.tsx: IAMProvider deve envolver AuthProvider, SecurityProvider e toda a árvore.',
    userMessage: 'Problema de configuração detectado. Recarregue a página.',
    resolvedInPrompt181: false,
  },
  {
    code: 'AUR-0011',
    category: 'context',
    severity: 'high',
    matchPatterns: [
      'useKnowledge deve ser usado dentro de um KnowledgeProvider',
      'useKnowledge deve ser usado dentro de',
    ],
    affectedComponents: ['KnowledgeContext.tsx', 'CorporateKnowledgeCenter.tsx'],
    rootCause:
      'Hook useKnowledge() chamado fora do KnowledgeProvider. ' +
      'Pode ocorrer se KnowledgeProvider for removido de main.tsx.',
    devAction:
      'Verificar main.tsx: KnowledgeProvider deve estar dentro de IAMProvider e antes de AuthProvider.',
    userMessage: 'Centro de Conhecimento indisponível. Tente recarregar.',
    resolvedInPrompt181: false,
  },
  {
    code: 'AUR-0012',
    category: 'context',
    severity: 'high',
    matchPatterns: [
      'useAuth deve ser usado dentro de <AuthProvider>',
    ],
    affectedComponents: ['AuthContext.tsx'],
    rootCause:
      'Hook useAuth() chamado fora do AuthProvider. ' +
      'Componente provavelmente renderizado fora da hierarquia correta.',
    devAction:
      'Verificar se o componente está dentro da árvore correta do router. ' +
      'AuthProvider deve envolver todos os componentes que chamam useAuth().',
    userMessage: 'Sessão não encontrada. Faça login novamente.',
    resolvedInPrompt181: false,
  },

  // ── SEGURANÇA / PERMISSÕES ────────────────────────────────────
  {
    code: 'AUR-0020',
    category: 'permission',
    severity: 'high',
    matchPatterns: ['userRole.*super_admin.*null', 'currentUser.*null.*super_admin'],
    affectedComponents: ['KnowledgeContext.tsx'],
    rootCause:
      'Fallback de userRole para super_admin quando currentUser é null, ' +
      'concedendo acesso máximo a usuários não autenticados no KnowledgeContext.',
    devAction:
      'Substituir fallback por \'beneficiary\' em: ' +
      'const userRole = currentUser?.roles?.[0] ?? \'beneficiary\'',
    userMessage: 'Acesso não autorizado. Faça login para continuar.',
    resolvedInPrompt181: true,
  },

  // ── RENDERIZAÇÃO ──────────────────────────────────────────────
  {
    code: 'AUR-0030',
    category: 'rendering',
    severity: 'high',
    matchPatterns: [
      'Cannot read properties of undefined',
      'Cannot read property',
      'TypeError: Cannot read',
    ],
    affectedComponents: ['Dashboard.tsx', 'PatientRecord.tsx', 'BeneficiaryPortal.tsx'],
    rootCause:
      'Componente tenta acessar propriedade de objeto undefined/null durante a renderização. ' +
      'Normalmente ocorre quando dados de API chegam assíncronos e o componente não aguarda o carregamento.',
    devAction:
      'Adicionar optional chaining (?.) e valores padrão em todas as props críticas. ' +
      'Envolver o componente com RouteErrorBoundary para isolar a falha.',
    userMessage: 'Erro ao carregar os dados deste módulo. Tente novamente.',
    resolvedInPrompt181: false,
  },
  {
    code: 'AUR-0031',
    category: 'rendering',
    severity: 'medium',
    matchPatterns: [
      'motion is not defined',
      'AnimatePresence is not defined',
      'Cannot find module \'motion',
      'Cannot find module \'framer-motion',
    ],
    affectedComponents: ['Dashboard.tsx', 'AdminSupremeDashboard.tsx'],
    rootCause:
      'Biblioteca de animação (motion/react ou framer-motion) não instalada ou ' +
      'import incorreto. Causa ReferenceError na renderização de componentes animados.',
    devAction:
      'Verificar package.json e executar npm install. ' +
      'Confirmar que o import usa \'motion/react\' (não \'framer-motion\') se a versão for >= 11.',
    userMessage: 'Erro de interface. Tente recarregar a página.',
    resolvedInPrompt181: false,
  },

  // ── ROTEAMENTO ────────────────────────────────────────────────
  {
    code: 'AUR-0040',
    category: 'routing',
    severity: 'medium',
    matchPatterns: [
      'No routes matched location',
      'useNavigate() may be used only in the context of a <Router>',
      'useLocation() may be used only in the context of a <Router>',
    ],
    affectedComponents: ['App.tsx', 'ProtectedRoute.tsx'],
    rootCause:
      'Hook de roteamento (useNavigate, useLocation) usado fora do BrowserRouter, ' +
      'ou rota inexistente acessada diretamente. ' +
      'Rota não mapeada redireciona para /login pelo fallback.',
    devAction:
      'Verificar se o componente está dentro de <BrowserRouter>. ' +
      'Confirmar que todas as rotas estão mapeadas em App.tsx.',
    userMessage: 'Página não encontrada. Redirecionando para o login.',
    resolvedInPrompt181: false,
  },

  // ── AUTENTICAÇÃO ──────────────────────────────────────────────
  {
    code: 'AUR-0050',
    category: 'auth',
    severity: 'high',
    matchPatterns: [
      'localStorage is not defined',
      'sessionStorage is not defined',
    ],
    affectedComponents: ['IAMContext.tsx', 'AuthContext.tsx'],
    rootCause:
      'Acesso a localStorage/sessionStorage em ambiente SSR ou com cookies bloqueados. ' +
      'A plataforma é client-side only, então este erro é raro mas possível.',
    devAction:
      'Envolver acessos a localStorage em try/catch com fallback para valores padrão.',
    userMessage: 'Armazenamento local bloqueado. Verifique as configurações do navegador.',
    resolvedInPrompt181: false,
  },
  {
    code: 'AUR-0051',
    category: 'auth',
    severity: 'critical',
    matchPatterns: [
      'iam_user',
      'JSON.parse',
      'SyntaxError: Unexpected token',
    ],
    affectedComponents: ['IAMContext.tsx', 'loadUserFromStorage'],
    rootCause:
      'Dados de usuário corrompidos no localStorage. ' +
      'JSON inválido impede a deserialização do perfil do usuário, ' +
      'causando falha no carregamento da sessão.',
    devAction:
      'Verificar loadUserFromStorage em IAMContext.tsx: ' +
      'já possui try/catch, mas validar se o retorno é sempre null em caso de erro.',
    userMessage: 'Sessão expirada ou corrompida. Faça login novamente.',
    resolvedInPrompt181: false,
  },

  // ── LAZY LOADING ──────────────────────────────────────────────
  {
    code: 'AUR-0060',
    category: 'lazy_loading',
    severity: 'medium',
    matchPatterns: [
      'ChunkLoadError',
      'Loading chunk',
      'Failed to fetch dynamically imported module',
    ],
    affectedComponents: ['App.tsx', 'Vite Bundle'],
    rootCause:
      'Chunk de código não encontrado durante carregamento dinâmico. ' +
      'Pode ocorrer após deploy de nova versão com cache antigo no browser.',
    devAction:
      'Implementar Suspense boundary com retry automático. ' +
      'Instruir usuário a limpar cache do navegador.',
    userMessage: 'Nova versão disponível. Recarregue a página para continuar.',
    resolvedInPrompt181: false,
  },
];

// ================================================================
// FUNÇÕES DE LOOKUP
// ================================================================

/**
 * Busca um erro conhecido pelo stack trace ou mensagem de erro.
 * Retorna o primeiro match encontrado ou null se não reconhecido.
 */
export function findKnownError(errorMessage: string, stack?: string): KnownError | null {
  const haystack = `${errorMessage} ${stack ?? ''}`.toLowerCase();
  return (
    ERROR_CATALOG.find((entry) =>
      entry.matchPatterns.some((pattern) => haystack.includes(pattern.toLowerCase()))
    ) ?? null
  );
}

/**
 * Retorna todos os erros por categoria.
 */
export function getErrorsByCategory(category: ErrorCategory): KnownError[] {
  return ERROR_CATALOG.filter((e) => e.category === category);
}

/**
 * Retorna erros críticos não resolvidos (útil para relatórios de incidente).
 */
export function getUnresolvedCriticalErrors(): KnownError[] {
  return ERROR_CATALOG.filter(
    (e) => e.severity === 'critical' && !e.resolvedInPrompt181
  );
}

/**
 * Formata um KnownError para exibição no console de desenvolvimento.
 */
export function formatKnownErrorForConsole(entry: KnownError): string {
  return [
    `\n╔══════════════════════════════════════════════════`,
    `║  [${entry.code}] ${entry.category.toUpperCase()} — ${entry.severity.toUpperCase()}`,
    `╠══════════════════════════════════════════════════`,
    `║  Causa raiz: ${entry.rootCause}`,
    `║  Componentes: ${entry.affectedComponents.join(', ')}`,
    `║  Ação dev: ${entry.devAction}`,
    `║  Resolvido P181: ${entry.resolvedInPrompt181 ? '✅ SIM' : '🔴 NÃO'}`,
    `╚══════════════════════════════════════════════════`,
  ].join('\n');
}
