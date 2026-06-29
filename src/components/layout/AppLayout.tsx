import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
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
  BriefcaseMedical
} from 'lucide-react';
import { cn } from '../../utils';
import { QuickExitButton } from '../QuickExitButton';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Beneficiários', href: '/patients', icon: Users },
  { name: 'Equipe Técnica', href: '/professionals', icon: BriefcaseMedical },
  { name: 'Agenda', href: '/calendar', icon: Calendar },
  { name: 'Prontuários', href: '/records', icon: FileText },
  { name: 'Mensagens', href: '/messages', icon: MessageCircle },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
];

export function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-teal-600 font-semibold tracking-tight">
            <Heart className="w-5 h-5 fill-current" />
            <span>Projeto Aura</span>
          </div>
        </div>

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
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 mb-4">
            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm shrink-0">
              DR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Dra. Roberta</p>
              <p className="text-xs text-slate-500 truncate">Psicóloga Voluntária</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <NavLink to="/settings" className={({ isActive }) => cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors", isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
              <Settings className="w-5 h-5 text-slate-400" />
              Configurações
            </NavLink>
            <NavLink to="/login" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors">
              <LogOut className="w-5 h-5 text-slate-400" />
              Sair
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-slate-50 relative">
        <Outlet />
        <QuickExitButton />
      </main>
    </div>
  );
}
