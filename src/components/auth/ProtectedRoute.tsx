import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Protege rotas que exigem autenticação.
 * Redireciona para /login se o usuário não estiver autenticado.
 */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/**
 * Rota pública: redireciona para /dashboard se já autenticado.
 * Usado na rota /login para não mostrar login desnecessariamente.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
