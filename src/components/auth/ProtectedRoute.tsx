import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useIAM } from '../../contexts/IAMContext';

/**
 * ProtectedRoute — Guarda de rota com suporte a IAM.
 *
 * - Redireciona para /login se o usuário não estiver autenticado.
 * - Suporta redirecionamento inteligente por perfil (futuro).
 * - Compatível com múltiplos papéis (RBAC).
 */
export function ProtectedRoute() {
  const { isAuthenticated } = useIAM();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * PublicRoute — Rota pública que redireciona usuários já autenticados.
 *
 * Ao fazer login, redireciona para o ambiente correto do usuário.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getRedirectPath } = useIAM();

  if (isAuthenticated) {
    const redirectPath = getRedirectPath();
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
