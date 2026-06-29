import React, { useState } from 'react';
import { Shield, Bell, Lock, User, Palette, Globe, KeyRound } from 'lucide-react';
import { cn } from '../utils';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Meu Perfil', icon: User },
    { id: 'security', name: 'Segurança & Privacidade', icon: Shield },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'preferences', name: 'Preferências', icon: Palette },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Configurações</h1>
          <p className="text-slate-500 mt-1">Gerencie seu perfil, preferências e segurança.</p>
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
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                    activeTab === tab.id
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900"
                  )}
                >
                  <tab.icon className={cn(
                    "w-5 h-5",
                    activeTab === tab.id ? "text-teal-600" : "text-slate-400"
                  )} />
                  {tab.name}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 space-y-6">
            
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-medium text-slate-900 mb-4">Informações Pessoais</h2>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-2xl">
                      DR
                    </div>
                    <div>
                      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm mb-2 block">
                        Alterar Foto
                      </button>
                      <p className="text-xs text-slate-500">JPG, GIF ou PNG. Máximo de 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium leading-6 text-slate-900">Nome Completo</label>
                      <div className="mt-2">
                        <input type="text" name="name" id="name" defaultValue="Dra. Roberta Santos" className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-4" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">Email Institucional</label>
                      <div className="mt-2">
                        <input type="email" name="email" id="email" defaultValue="roberta.santos@institutosermelhor.org" disabled className="block w-full rounded-xl border-0 py-2.5 text-slate-500 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 sm:text-sm sm:leading-6 px-4 cursor-not-allowed" />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Para alterar o email institucional, contate o suporte TI.</p>
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="crp" className="block text-sm font-medium leading-6 text-slate-900">Registro Profissional (CRP)</label>
                      <div className="mt-2">
                        <input type="text" name="crp" id="crp" defaultValue="06/123456" className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-4" />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <label htmlFor="phone" className="block text-sm font-medium leading-6 text-slate-900">Telefone</label>
                      <div className="mt-2">
                        <input type="text" name="phone" id="phone" defaultValue="(11) 98765-4321" className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-4" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <KeyRound className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-medium text-slate-900">Alterar Senha</h2>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Mantenha sua conta segura utilizando senhas fortes e únicas.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Senha Atual</label>
                      <input type="password" placeholder="••••••••" className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm px-4 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Nova Senha</label>
                      <input type="password" placeholder="••••••••" className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm px-4 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Confirmar Nova Senha</label>
                      <input type="password" placeholder="••••••••" className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm px-4 py-2" />
                    </div>
                    <div className="pt-2">
                       <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
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
                    <p className="text-sm text-slate-500">Adicione uma camada extra de segurança à sua conta exigindo mais do que apenas uma senha para fazer login.</p>
                    <button className="ml-4 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shrink-0">
                      Configurar 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-medium text-slate-900 mb-6">Preferências de Notificação</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">Novos Agendamentos</h4>
                      <p className="text-sm text-slate-500">Receba avisos sobre consultas marcadas em sua agenda.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">Cancelamentos</h4>
                      <p className="text-sm text-slate-500">Seja notificado caso o paciente desmarque a sessão.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">Lembretes de Assinatura</h4>
                      <p className="text-sm text-slate-500">Avisos diários sobre evoluções pendentes de assinatura.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
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
                 </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
