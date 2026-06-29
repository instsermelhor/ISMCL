import React, { useState } from 'react';
import {
  LayoutDashboard, Users, BriefcaseMedical, Heart, FolderKanban,
  FileText, UserCog, Shield, Bell, BarChart2, Settings,
  Building2, ChevronRight, Brain,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils';

// Sub-módulos
import { CGIDashboard } from '../components/cgi/CGIDashboard';
import { CGIBeneficiarios } from '../components/cgi/CGIBeneficiarios';
import { CGIProfissionais } from '../components/cgi/CGIProfissionais';
import { CGIVoluntarios } from '../components/cgi/CGIVoluntarios';
import { CGIProjetos } from '../components/cgi/CGIProjetos';
import { CGIDocumentos } from '../components/cgi/CGIDocumentos';
import { CGIUsuarios } from '../components/cgi/CGIUsuarios';
import { CGIAuditoria } from '../components/cgi/CGIAuditoria';
import { CGINotificacoes } from '../components/cgi/CGINotificacoes';
import { CGIBiRelatorios } from '../components/cgi/CGIBiRelatorios';
import { CGIConfiguracoes } from '../components/cgi/CGIConfiguracoes';
import { CGIAIInsights } from '../components/cgi/CGIAIInsights';
import { notifications } from '../data/cgi-mock';

// ─── Tab definitions ──────────────────────────────────────────
type TabId =
  | 'dashboard' | 'ai' | 'beneficiarios' | 'profissionais' | 'voluntarios'
  | 'projetos' | 'documentos' | 'usuarios' | 'auditoria'
  | 'notificacoes' | 'bi' | 'configuracoes';

interface Tab {
  id: TabId;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  badge?: number;
  group: 'principal' | 'gestao' | 'sistema';
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, group: 'principal' },
  { id: 'ai', label: 'AI Insights', shortLabel: 'AI Insights', icon: Brain, group: 'principal' },
  { id: 'beneficiarios', label: 'Beneficiários', icon: Users, group: 'gestao' },
  { id: 'profissionais', label: 'Profissionais', icon: BriefcaseMedical, group: 'gestao' },
  { id: 'voluntarios', label: 'Voluntários', icon: Heart, group: 'gestao' },
  { id: 'projetos', label: 'Projetos Sociais', shortLabel: 'Projetos', icon: FolderKanban, group: 'gestao' },
  { id: 'documentos', label: 'Documentos', icon: FileText, group: 'gestao' },
  { id: 'usuarios', label: 'Usuários', icon: UserCog, group: 'sistema' },
  { id: 'auditoria', label: 'Auditoria', icon: Shield, group: 'sistema' },
  { id: 'notificacoes', label: 'Notificações', shortLabel: 'Notif.', icon: Bell, group: 'sistema' },
  { id: 'bi', label: 'BI & Relatórios', shortLabel: 'BI', icon: BarChart2, group: 'sistema' },
  { id: 'configuracoes', label: 'Configurações', shortLabel: 'Config.', icon: Settings, group: 'sistema' },
];

const tabGroups = [
  { id: 'principal', label: 'Principal' },
  { id: 'gestao', label: 'Gestão Institucional' },
  { id: 'sistema', label: 'Sistema & Governança' },
] as const;

// ─── Breadcrumb ───────────────────────────────────────────────
function Breadcrumb({ tab }: { tab: Tab }) {
  const Icon = tab.icon;
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <Building2 className="w-3.5 h-3.5" />
      <span>CGI</span>
      <ChevronRight className="w-3 h-3" />
      <Icon className="w-3.5 h-3.5 text-teal-500" />
      <span className="font-medium text-slate-600">{tab.label}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function CGI() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const unreadNotif = notifications.filter(n => !n.read).length;

  const tabsWithBadges = tabs.map(t =>
    t.id === 'notificacoes' && unreadNotif > 0 ? { ...t, badge: unreadNotif } : t
  );

  const activeTabDef = tabsWithBadges.find(t => t.id === activeTab)!;

  function renderContent() {
    switch (activeTab) {
      case 'dashboard': return <CGIDashboard />;
      case 'ai': return <CGIAIInsights />;
      case 'beneficiarios': return <CGIBeneficiarios />;
      case 'profissionais': return <CGIProfissionais />;
      case 'voluntarios': return <CGIVoluntarios />;
      case 'projetos': return <CGIProjetos />;
      case 'documentos': return <CGIDocumentos />;
      case 'usuarios': return <CGIUsuarios />;
      case 'auditoria': return <CGIAuditoria />;
      case 'notificacoes': return <CGINotificacoes />;
      case 'bi': return <CGIBiRelatorios />;
      case 'configuracoes': return <CGIConfiguracoes />;
      default: return null;
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* ── Top header ─────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Centro de Gestão Institucional</h1>
              <p className="text-xs text-slate-400 hidden sm:block">ERP Social · Instituto Ser Melhor · Módulo 07</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick notification badge */}
            {unreadNotif > 0 && (
              <button
                onClick={() => setActiveTab('notificacoes')}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5 text-slate-500" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadNotif}
                </span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('configuracoes')}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        <Breadcrumb tab={activeTabDef} />
      </header>

      {/* ── Tab navigation ─────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 shrink-0 overflow-x-auto">
        <div className="flex min-w-max">
          {tabGroups.map((group, gi) => {
            const groupTabs = tabsWithBadges.filter(t => t.group === group.id);
            return (
              <div key={group.id} className={cn('flex', gi > 0 && 'border-l border-slate-200')}>
                {groupTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all whitespace-nowrap',
                        isActive
                          ? 'text-teal-700 bg-teal-50/60'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      )}>
                      <Icon className={cn('w-4 h-4', isActive ? 'text-teal-600' : 'text-slate-400')} />
                      <span className="hidden md:inline">{tab.shortLabel ?? tab.label}</span>
                      {tab.badge && tab.badge > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-red-500 text-white text-xs font-bold px-1">
                          {tab.badge}
                        </span>
                      )}
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="cgi-active-tab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── Content area ───────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}>
            {renderContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
