import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageCircle,
  FileText,
  Settings,
  LogOut,
  Heart,
  DollarSign,
  BriefcaseMedical,
  ShieldCheck,
  Building2,
  ShieldAlert,
  Smile,
  Award,
  Shield,
  ChevronDown,
  ChevronUp,
  Activity,
  GitBranch,
  Monitor,
} from 'lucide-react';
import { cn } from '../../utils';
import { QuickExitButton } from '../QuickExitButton';
import { useAuth } from '../../contexts/AuthContext';
import { useIAM } from '../../contexts/IAMContext';
import { ROLE_LABELS, ROLE_COLORS } from '../../types/iam';
import type { InstitutionalRole } from '../../types/iam';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Beneficiários', href: '/patients', icon: Users },
  { name: 'Equipe Técnica', href: '/professionals', icon: BriefcaseMedical },
  { name: 'Agenda', href: '/calendar', icon: Calendar },
  { name: 'Prontuários', href: '/records', icon: FileText },
  { name: 'Mensagens', href: '/messages', icon: MessageCircle },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
];

const adminNavigation = [
  { name: 'Portal Beneficiário', href: '/portal-beneficiario', icon: Smile },
  { name: 'Portal Profissional', href: '/portal-profissional', icon: Award },
  { name: 'CGI — Gestão', href: '/cgi', icon: Building2 },
  { name: 'MCSI — Segurança', href: '/seguranca', icon: ShieldAlert },
  { name: 'IAM — Identidades', href: '/iam', icon: Shield },
  { name: 'BPM — Processos', href: '/processos', icon: GitBranch },
  { name: 'ARE — Cadastro', href: '/cadastro-adaptativo', icon: Activity },
  { name: 'SATAI — Triagem', href: '/satai', icon: Heart },
  { name: 'PIARAVE — Casos', href: '/piarave', icon: Heart },
  { name: 'Platform Health Center', href: '/auditoria-plataforma', icon: Monitor },
];

function RolePill({ role }: { role: InstitutionalRole }) {
  const colors = ROLE_COLORS[role];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { currentUser, aiSuggestions } = useIAM();
  const navigate = useNavigate();
  const [showRoles, setShowRoles] = useState(false);

  const pendingAI = aiSuggestions.filter(s => s.status === 'pending').length;
  const iamRoles = currentUser?.roles ?? [];
  const hasMultipleRoles = iamRoles.length > 1;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-teal-600 font-semibold tracking-tight">
            <Heart className="w-5 h-5 fill-current" />
            <span>Projeto Aura</span>
          </div>
          {isAdmin && (
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </span>
          )}
        </div>

        {/* Navegação */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
            Menu Principal
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'w-5 h-5 shrink-0 transition-colors',
                        isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                      )}
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Administração */}
          {isAdmin && (
            <>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2 px-2">
                Administração
              </div>
              <nav className="space-y-1">
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'w-5 h-5 shrink-0 transition-colors',
                            isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                          )}
                        />
                        <span className="flex-1">{item.name}</span>
                        {/* Badge de alertas IA no menu IAM */}
                        {item.href === '/iam' && pendingAI > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                            {pendingAI}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </>
          )}
        </div>

        {/* Perfil do usuário */}
        <div className="p-4 border-t border-slate-100">
          {/* Card do usuário */}
          <div className="rounded-xl bg-slate-50 mb-3 overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm shrink-0">
                {user?.initials ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name ?? 'Usuário'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.subtitle ?? ''}
                </p>
              </div>
              {hasMultipleRoles && (
                <button
                  onClick={() => setShowRoles(!showRoles)}
                  className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Ver papéis"
                  aria-expanded={showRoles}
                >
                  {showRoles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Papéis expandidos */}
            {showRoles && hasMultipleRoles && (
              <div className="px-3 pb-3 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2">
                {iamRoles.map(role => (
                  <RolePill key={role} role={role} />
                ))}
              </div>
            )}

            {/* Papel principal (sempre visível) */}
            {!showRoles && iamRoles.length > 0 && (
              <div className="px-3 pb-2">
                <RolePill role={iamRoles[0]} />
                {iamRoles.length > 1 && (
                  <span className="text-xs text-slate-400 ml-1">
                    +{iamRoles.length - 1}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <Settings className="w-5 h-5 text-slate-400" />
              Configurações
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Área de conteúdo principal */}
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-slate-50 relative">
        <Outlet />
        <QuickExitButton />
      </main>
    </div>
  );
}
