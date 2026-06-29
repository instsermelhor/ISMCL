import React, { useState } from 'react';
import {
  Shield,
  Bell,
  Lock,
  User,
  Palette,
  KeyRound,
  ShieldCheck,
  Users,
  Database,
  Activity,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../utils';
import { useAuth } from '../contexts/AuthContext';

type Tab = {
  id: string;
  name: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const allTabs: Tab[] = [
  { id: 'profile', name: 'Meu Perfil', icon: User },
  { id: 'security', name: 'Segurança & Privacidade', icon: Shield },
  { id: 'notifications', name: 'Notificações', icon: Bell },
  { id: 'preferences', name: 'Preferências', icon: Palette },
  { id: 'admin', name: 'Administração', icon: ShieldCheck, adminOnly: true },
];

const mockUsers = [
  { id: '1', name: 'Dra. Roberta Santos', email: 'voluntario@institutosermelhor.org', role: 'Psicóloga Voluntária', status: 'ativo' },
  { id: '2', name: 'Dr. Carlos Mendes', email: 'carlos@institutosermelhor.org', role: 'Psiquiatra', status: 'ativo' },
  { id: '3', name: 'Ana Voluntária', email: 'ana@institutosermelhor.org', role: 'Assistente Social', status: 'inativo' },
];

export function Settings() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [savedProfile, setSavedProfile] = useState(false);

  const tabs = allTabs.filter((t) => !t.adminOnly || isAdmin);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">

        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Configurações</h1>
            <p className="text-slate-500 mt-1">Gerencie seu perfil, preferências e segurança.</p>
          </div>
          {isAdmin && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Acesso Administrativo
            </span>
          )}
        </header>

        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar Tabs */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex flex-col space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                    activeTab === tab.id
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
                  )}
                >
                  <tab.icon
                    className={cn(
                      'w-5 h-5',
                      activeTab === tab.id ? 'text-teal-600' : 'text-slate-400'
                    )}
                  />
                  {tab.name}
                  {tab.adminOnly && (
                    <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-semibold">
                      ADM
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 space-y-6">

            {/* ─── PERFIL ─── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-medium text-slate-900 mb-4">Informações Pessoais</h2>

                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-2xl">
                      {user?.initials ?? 'U'}
                    </div>
                    <div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm mb-2 block"
                      >
                        Alterar Foto
                      </button>
                      <p className="text-xs text-slate-500">JPG, GIF ou PNG. Máximo de 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium leading-6 text-slate-900">
                        Nome Completo
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          defaultValue={user?.name ?? ''}
                          className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-4"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">
                        Email Institucional
                      </label>
                      <div className="mt-2">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          defaultValue={user?.email ?? ''}
                          disabled
                          className="block w-full rounded-xl border-0 py-2.5 text-slate-500 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 sm:text-sm sm:leading-6 px-4 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Para alterar o email institucional, contate o suporte TI.
                      </p>
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="role-label" className="block text-sm font-medium leading-6 text-slate-900">
                        Cargo / Função
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          id="role-label"
                          defaultValue={user?.subtitle ?? ''}
                          disabled
                          className="block w-full rounded-xl border-0 py-2.5 text-slate-500 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 sm:text-sm sm:leading-6 px-4 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="phone" className="block text-sm font-medium leading-6 text-slate-900">
                        Telefone
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          placeholder="(11) 99999-9999"
                          className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-4"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-end gap-3">
                    {savedProfile && (
                      <span className="flex items-center gap-1.5 text-sm text-teal-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Alterações salvas!
                      </span>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ─── SEGURANÇA ─── */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <KeyRound className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-medium text-slate-900">Alterar Senha</h2>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">
                    Mantenha sua conta segura utilizando senhas fortes e únicas.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Senha Atual</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="mt-1 block w-full rounded-xl border border-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm px-4 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Nova Senha</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="mt-1 block w-full rounded-xl border border-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm px-4 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="mt-1 block w-full rounded-xl border border-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm px-4 py-2.5"
                      />
                    </div>
                    <div className="pt-2">
                      <button className="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                        Atualizar Senha
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-medium text-slate-900">Autenticação de Dois Fatores (2FA)</h2>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      Adicione uma camada extra de segurança à sua conta exigindo mais do que apenas uma senha para fazer login.
                    </p>
                    <button className="ml-4 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shrink-0">
                      Configurar 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── NOTIFICAÇÕES ─── */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-medium text-slate-900 mb-6">Preferências de Notificação</h2>
                <div className="space-y-6">
                  {[
                    { label: 'Novos Agendamentos', desc: 'Receba avisos sobre consultas marcadas em sua agenda.' },
                    { label: 'Cancelamentos', desc: 'Seja notificado caso o paciente desmarque a sessão.' },
                    { label: 'Lembretes de Assinatura', desc: 'Avisos diários sobre evoluções pendentes de assinatura.' },
                    { label: 'Alertas de Risco', desc: 'Notificações urgentes sobre casos de alto risco identificados.' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900">{item.label}</h4>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── PREFERÊNCIAS ─── */}
            {activeTab === 'preferences' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-medium text-slate-900 mb-6">Aparência e Localização</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Fuso Horário</label>
                    <select className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-4">
                      <option>Horário de Brasília (UTC-03:00)</option>
                      <option>Horário da Amazônia (UTC-04:00)</option>
                      <option>Horário do Acre (UTC-05:00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Idioma</label>
                    <select className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-4">
                      <option>Português (Brasil)</option>
                      <option>English (US)</option>
                      <option>Español</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ─── ADMINISTRAÇÃO (somente admin) ─── */}
            {activeTab === 'admin' && isAdmin && (
              <div className="space-y-6">

                {/* Aviso de segurança */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Painel Administrativo</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Alterações nesta seção afetam toda a plataforma. Proceda com cautela.
                    </p>
                  </div>
                </div>

                {/* Gestão de usuários */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-teal-600" />
                      <h2 className="text-lg font-medium text-slate-900">Gestão de Usuários</h2>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
                      <Plus className="w-4 h-4" />
                      Novo Usuário
                    </button>
                  </div>

                  <div className="space-y-3">
                    {mockUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                            {u.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email} · {u.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                            u.status === 'ativo'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-600'
                          )}>
                            {u.status}
                          </span>
                          <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status do sistema */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-medium text-slate-900">Status do Sistema</h2>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'API Principal', status: 'online', latency: '12ms' },
                      { name: 'Banco de Dados', status: 'online', latency: '8ms' },
                      { name: 'Módulo Telessaúde', status: 'online', latency: '45ms' },
                      { name: 'Serviço de IA (Gemini)', status: 'online', latency: '230ms' },
                    ].map((service) => (
                      <div key={service.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm font-medium text-slate-800">{service.name}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                          {service.latency}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                      <RefreshCw className="w-4 h-4" />
                      Atualizar Status
                    </button>
                  </div>
                </div>

                {/* Configurações globais */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-medium text-slate-900">Configurações Globais</h2>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Modo de Manutenção', desc: 'Bloqueia o acesso de todos os usuários não-admin.' },
                      { label: 'Auditoria de Acessos', desc: 'Registra logs detalhados de todas as ações na plataforma.' },
                      { label: 'Modo Demonstração', desc: 'Exibe apenas dados fictícios para apresentações.' },
                    ].map((setting) => (
                      <div key={setting.label} className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">{setting.label}</h4>
                          <p className="text-xs text-slate-500">{setting.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Banco de dados */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-medium text-slate-900">Manutenção de Dados</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                      <Database className="w-4 h-4 text-slate-400" />
                      Fazer Backup
                    </button>
                    <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                      <Activity className="w-4 h-4 text-slate-400" />
                      Ver Logs de Auditoria
                    </button>
                    <button className="flex items-center gap-2 px-4 py-3 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors shadow-sm sm:col-span-2">
                      <AlertTriangle className="w-4 h-4" />
                      Limpar Cache do Sistema
                    </button>
                  </div>
                </div>

              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
