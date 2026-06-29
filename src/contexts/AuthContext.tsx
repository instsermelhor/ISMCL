// ============================================================
// AuthContext — Camada de Compatibilidade (bridge para IAMContext)
// Instituto Ser Melhor — Plataforma Integrada
// ============================================================
// Este arquivo mantém retrocompatibilidade com todos os módulos
// existentes que importam useAuth() e AuthProvider.
// Internamente, delega toda a lógica ao IAMContext.
// ============================================================

import React, { createContext, useContext, ReactNode } from 'react';
import { useIAM } from './IAMContext';
import type { InstitutionalRole } from '../types/iam';

// Tipo legado mantido para compatibilidade
export type UserRole = 'admin' | 'ref' | 'volunteer' | null;

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  initials: string;
  subtitle: string;
  // Campos IAM expandidos (opcionais para compatibilidade)
  iamRoles?: InstitutionalRole[];
  iamId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mapeia papéis IAM para papel legado
function mapIAMRoleToLegacy(iamRoles: InstitutionalRole[]): UserRole {
  if (iamRoles.includes('super_admin')) return 'admin';
  if (iamRoles.includes('auditor')) return 'admin';
  if (iamRoles.includes('director') || iamRoles.includes('president') || iamRoles.includes('manager') || iamRoles.includes('coordinator')) return 'admin';
  if (iamRoles.includes('professional') || iamRoles.includes('volunteer_professional')) return 'ref';
  return 'volunteer';
}

function getRoleSubtitle(iamRoles: InstitutionalRole[]): string {
  const labels: Record<InstitutionalRole, string> = {
    beneficiary: 'Portal do Beneficiário',
    legal_guardian: 'Área da Família',
    professional: 'Workspace Clínico',
    volunteer_professional: 'Profissional Voluntário',
    admin_volunteer: 'Voluntário Administrativo',
    admin_collaborator: 'ERP Social',
    coordinator: 'Coordenação',
    manager: 'Gestão',
    director: 'Diretoria',
    president: 'Presidência',
    super_admin: 'Super Administrador',
    auditor: 'Auditoria',
  };
  const primary = iamRoles[0];
  return primary ? labels[primary] : 'Acesso Geral';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const iam = useIAM();

  // Constrói o AuthUser legado a partir do IAMUser
  const user: AuthUser | null = iam.currentUser
    ? {
        email: iam.currentUser.email,
        name: iam.currentUser.name,
        role: mapIAMRoleToLegacy(iam.currentUser.roles),
        initials: iam.currentUser.initials,
        subtitle: getRoleSubtitle(iam.currentUser.roles),
        iamRoles: iam.currentUser.roles,
        iamId: iam.currentUser.id,
      }
    : null;

  const isAuthenticated = iam.isAuthenticated;
  const isAdmin = user?.role === 'admin';

  // Wrapper do login para interface legada (retorna boolean)
  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await iam.login(email, password);
    // Se precisar de MFA, a tela de login IAM gerencia isso
    return result.success;
  };

  const logout = () => iam.logout();

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
