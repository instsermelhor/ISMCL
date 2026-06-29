import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'ref' | 'volunteer' | null;

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  initials: string;
  subtitle: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Usuários de teste pré-configurados
const MOCK_USERS: Record<string, { password: string; role: UserRole; name: string; subtitle: string }> = {
  'ism@ism.org': {
    password: 'teste',
    role: 'admin',
    name: 'Administrador Geral',
    subtitle: 'Administrador do Sistema',
  },
  'voluntario@institutosermelhor.org': {
    password: 'senha123',
    role: 'ref',
    name: 'Dra. Roberta Santos',
    subtitle: 'Psicóloga Voluntária',
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function loadUserFromStorage(): AuthUser | null {
  try {
    const email = localStorage.getItem('user_email');
    const name = localStorage.getItem('user_name');
    const role = localStorage.getItem('user_role') as UserRole;
    const subtitle = localStorage.getItem('user_subtitle');

    if (email && name && role) {
      return {
        email,
        name,
        role,
        initials: getInitials(name),
        subtitle: subtitle || '',
      };
    }
  } catch {
    // ignora erros de localStorage
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simula chamada assíncrona (delay de 800ms para UX)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const lowerEmail = email.toLowerCase().trim();
    const found = MOCK_USERS[lowerEmail];

    if (found && found.password === password) {
      const authUser: AuthUser = {
        email: lowerEmail,
        name: found.name,
        role: found.role,
        initials: getInitials(found.name),
        subtitle: found.subtitle,
      };
      // Persiste na localStorage
      localStorage.setItem('user_email', authUser.email);
      localStorage.setItem('user_name', authUser.name);
      localStorage.setItem('user_role', authUser.role ?? '');
      localStorage.setItem('user_subtitle', authUser.subtitle);
      setUser(authUser);
      return true;
    }

    // Fallback: qualquer outro email/senha loga como voluntário genérico
    const fallbackUser: AuthUser = {
      email: lowerEmail || 'visitante@institutosermelhor.org',
      name: 'Usuário Visitante',
      role: 'volunteer',
      initials: 'UV',
      subtitle: 'Acesso Visitante',
    };
    localStorage.setItem('user_email', fallbackUser.email);
    localStorage.setItem('user_name', fallbackUser.name);
    localStorage.setItem('user_role', fallbackUser.role ?? '');
    localStorage.setItem('user_subtitle', fallbackUser.subtitle);
    setUser(fallbackUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_subtitle');
    setUser(null);
  };

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
