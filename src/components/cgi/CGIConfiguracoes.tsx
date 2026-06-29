import React, { useState } from 'react';
import {
  Settings, Palette, Globe, Shield, Bell, Puzzle,
  Save, RotateCcw, ChevronRight, Check, Sun, Moon,
  Building2, Mail, Phone, X, ShieldAlert, Copy, Trash2, Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import {
  ROLE_LABELS, MODULE_LABELS, type AdminRole,
  type PermissionModule, type PermissionAction,
  rolePermissionsMatrix as initialMatrix,
} from '../../data/cgi-mock';

type Section = 'identidade' | 'seguranca' | 'notificacoes' | 'permissoes' | 'integracoes' | 'parametros';

const sections: { id: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'identidade', label: 'Identidade Visual', icon: Palette, desc: 'Logotipo, cores, domínio e informações institucionais' },
  { id: 'seguranca', label: 'Segurança', icon: Shield, desc: 'Políticas de senha, sessão, MFA e controle de acesso' },
  { id: 'notificacoes', label: 'Notificações', icon: Bell, desc: 'Canais, frequência e regras de alerta' },
  { id: 'permissoes', label: 'Perfis e Permissões', icon: Settings, desc: 'Matriz de permissões e criação de perfis personalizados' },
  { id: 'integracoes', label: 'Integrações', icon: Puzzle, desc: 'APIs externas, webhooks e sistemas integrados' },
  { id: 'parametros', label: 'Parâmetros Gerais', icon: Globe, desc: 'Categorias, tipos, protocolos e formulários' },
];

const ACCENT_COLORS = [
  { label: 'Teal', value: '#0d9488' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
];

const AVAILABLE_ACTIONS: { id: PermissionAction; label: string }[] = [
  { id: 'view', label: 'Ver' },
  { id: 'create', label: 'Criar' },
  { id: 'edit', label: 'Editar' },
  { id: 'delete', label: 'Excluir' },
  { id: 'export', label: 'Exportar' },
  { id: 'approve', label: 'Aprovar' },
  { id: 'admin', label: 'Admin' },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-teal-500' : 'bg-slate-200')}>
      <motion.span animate={{ x: checked ? '1.375rem' : '0.125rem' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}

export function CGIConfiguracoes() {
  const [active, setActive] = useState<Section>('identidade');
  const [saved, setSaved] = useState(false);

  // Identidade Settings
  const [orgName, setOrgName] = useState('Instituto Ser Melhor');
  const [orgEmail, setOrgEmail] = useState('contato@institutosermelhor.org');
  const [orgPhone, setOrgPhone] = useState('(11) 3333-4444');
  const [accentColor, setAccentColor] = useState('#0d9488');
  const [darkMode, setDarkMode] = useState(false);

  // Segurança Settings
  const [mfaRequired, setMfaRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [minPasswordLength, setMinPasswordLength] = useState('8');

  // Notificações Settings
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [alertCritical, setAlertCritical] = useState(true);
  const [alertDoc, setAlertDoc] = useState(true);

  // Permissões & Perfis Settings
  const [selectedRole, setSelectedRole] = useState<AdminRole>('coord_clinica');
  const [matrix, setMatrix] = useState<Record<AdminRole, Partial<Record<PermissionModule, PermissionAction[]>>>>(initialMatrix as any);
  const [customRoles, setCustomRoles] = useState<{ id: string; label: string }[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleInherit, setNewRoleInherit] = useState<AdminRole | ''>('');

  // Parâmetros Settings
  const [paramGroups, setParamGroups] = useState([
    { id: 'tipos_atendimento', label: 'Tipos de Atendimento', items: ['Psicológico', 'Social', 'Jurídico', 'Médico', 'Educacional', 'Outro'] },
    { id: 'categorias_projetos', label: 'Categorias de Projetos', items: ['Saúde Mental', 'Vulnerabilidade Social', 'Infância', 'Idoso', 'Mulher', 'Educação'] },
    { id: 'status_beneficiario', label: 'Status de Beneficiário', items: ['Ativo', 'Em Avaliação', 'Inativo', 'Encerrado'] },
    { id: 'protocolos_atendimento', label: 'Protocolos de Atendimento', items: ['Acolhimento', 'Avaliação Inicial', 'Plano Terapêutico', 'Alta Clínica'] },
  ]);
  const [newParamText, setNewParamText] = useState<Record<string, string>>({});

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // Toggle single action in matrix
  const handleTogglePermission = (role: AdminRole, mod: PermissionModule, action: PermissionAction) => {
    setMatrix(prev => {
      const currentRolePerms = prev[role] || {};
      const currentModPerms = currentRolePerms[mod] || [];
      let updatedModPerms: PermissionAction[];

      if (currentModPerms.includes(action)) {
        updatedModPerms = currentModPerms.filter(a => a !== action);
      } else {
        updatedModPerms = [...currentModPerms, action];
      }

      return {
        ...prev,
        [role]: {
          ...currentRolePerms,
          [mod]: updatedModPerms,
        },
      };
    });
  };

  // Create new profile with option to inherit permissions
  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    const newId = newRoleName.trim().toLowerCase().replace(/\s+/g, '_');
    const newLabel = newRoleName.trim();

    setCustomRoles(prev => [...prev, { id: newId, label: newLabel }]);

    // Set permission matrix entry
    setMatrix(prev => {
      const inherited = newRoleInherit ? prev[newRoleInherit] : {};
      return {
        ...prev,
        [newId]: JSON.parse(JSON.stringify(inherited)), // deep copy
      };
    });

    setNewRoleName('');
    setNewRoleInherit('');
    setShowRoleModal(false);
    setSelectedRole(newId as AdminRole);
  };

  // Add parameter item
  const handleAddParam = (groupId: string) => {
    const text = newParamText[groupId]?.trim();
    if (!text) return;

    setParamGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        if (g.items.includes(text)) return g;
        return { ...g, items: [...g.items, text] };
      }
      return g;
    }));

    setNewParamText(prev => ({ ...prev, [groupId]: '' }));
  };

  // Delete parameter item
  const handleDeleteParam = (groupId: string, item: string) => {
    setParamGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, items: g.items.filter(i => i !== item) };
      }
      return g;
    }));
  };

  const activeSection = sections.find(s => s.id === active)!;

  return (
    <div className="space-y-6">
      {/* Role Creation Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowRoleModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900">Novo Perfil de Acesso</h3>
                </div>
                <button onClick={() => setShowRoleModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome do Perfil</label>
                  <input
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    placeholder="Ex: Coordenador Operacional"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Herdar Permissões de (opcional)</label>
                  <select
                    value={newRoleInherit}
                    onChange={e => setNewRoleInherit(e.target.value as AdminRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">Sem herança (em branco)</option>
                    {(Object.entries(ROLE_LABELS) as [AdminRole, string][]).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                    {customRoles.map(cr => (
                      <option key={cr.id} value={cr.id}>{cr.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  onClick={handleCreateRole}
                  disabled={!newRoleName.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  Criar Perfil
                </button>
                <button onClick={() => setShowRoleModal(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-teal-600" />
        <h2 className="text-base font-bold text-slate-900">Configurações do Sistema</h2>
        <span className="ml-2 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Sem alteração de código-fonte</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <nav className="lg:col-span-1 space-y-1">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm',
                  active === s.id
                    ? 'bg-teal-50 text-teal-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 font-medium'
                )}>
                <Icon className={cn('w-4 h-4 shrink-0', active === s.id ? 'text-teal-600' : 'text-slate-400')} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="truncate">{s.label}</p>
                </div>
                {active === s.id && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-teal-500" />}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{activeSection.label}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{activeSection.desc}</p>
            </div>

            {/* ─── Identidade ─── */}
            {active === 'identidade' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Nome da Organização
                    </label>
                    <input value={orgName} onChange={e => setOrgName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> E-mail Institucional
                    </label>
                    <input value={orgEmail} onChange={e => setOrgEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Telefone
                    </label>
                    <input value={orgPhone} onChange={e => setOrgPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Cor de Destaque do Sistema</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {ACCENT_COLORS.map(c => (
                      <button key={c.value} title={c.label} onClick={() => setAccentColor(c.value)}
                        className={cn('w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center',
                          accentColor === c.value && 'ring-2 ring-offset-2 ring-slate-400 scale-110')}
                        style={{ backgroundColor: c.value }}>
                        {accentColor === c.value && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    {darkMode ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <div>
                      <p className="text-sm font-medium text-slate-800">Modo Escuro Global</p>
                      <p className="text-xs text-slate-400">Aplica tema escuro para todos os usuários</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
                </div>
              </div>
            )}

            {/* ─── Segurança ─── */}
            {active === 'seguranca' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Exigir MFA para todos os usuários</p>
                    <p className="text-xs text-slate-400">Autenticação multifator obrigatória no login</p>
                  </div>
                  <ToggleSwitch checked={mfaRequired} onChange={setMfaRequired} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Timeout de Sessão (minutos)</label>
                    <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                      {['15', '30', '60', '120', '240'].map(v => (
                        <option key={v} value={v}>{v} minutos</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Comprimento Mínimo da Senha</label>
                    <select value={minPasswordLength} onChange={e => setMinPasswordLength(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                      {['6', '8', '10', '12', '16'].map(v => (
                        <option key={v} value={v}>{v} caracteres</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <strong>Política recomendada:</strong> Senhas com no mínimo 10 caracteres, MFA habilitado, sessão expirando em 30 minutos.
                </div>
              </div>
            )}

            {/* ─── Notificações ─── */}
            {active === 'notificacoes' && (
              <div className="space-y-4">
                {[
                  { label: 'Notificações por e-mail', sub: 'Enviar alertas e avisos por e-mail', checked: emailNotif, set: setEmailNotif },
                  { label: 'Notificações push', sub: 'Alertas no navegador em tempo real', checked: pushNotif, set: setPushNotif },
                  { label: 'Alertas de eventos críticos', sub: 'CRM vencido, acesso suspeito, beneficiários sem contato', checked: alertCritical, set: setAlertCritical },
                  { label: 'Alertas de documentos', sub: 'Avisar 30, 15 e 7 dias antes do vencimento', checked: alertDoc, set: setAlertDoc },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.sub}</p>
                    </div>
                    <ToggleSwitch checked={item.checked} onChange={item.set} />
                  </div>
                ))}
              </div>
            )}

            {/* ─── Permissões ─── */}
            {active === 'permissoes' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Selecionar Perfil para Editar</label>
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value as AdminRole)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none w-56"
                    >
                      {(Object.entries(ROLE_LABELS) as [AdminRole, string][]).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                      {customRoles.map(cr => (
                        <option key={cr.id} value={cr.id as AdminRole}>{cr.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setShowRoleModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-all self-end sm:self-center"
                  >
                    <Plus className="w-3.5 h-3.5" /> Criar Novo Perfil
                  </button>
                </div>

                {/* Permissions Grid */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-36">Módulo</th>
                          {AVAILABLE_ACTIONS.map(action => (
                            <th key={action.id} className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                              {action.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(Object.entries(MODULE_LABELS) as [PermissionModule, string][]).map(([modKey, modLabel]) => {
                          const rolePerms = matrix[selectedRole] || {};
                          const modPerms = rolePerms[modKey] || [];
                          const isSuperAdmin = selectedRole === 'super_admin';

                          return (
                            <tr key={modKey} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-sm font-semibold text-slate-800">{modLabel}</td>
                              {AVAILABLE_ACTIONS.map(action => {
                                const checked = modPerms.includes(action.id) || isSuperAdmin;
                                return (
                                  <td key={action.id} className="px-3 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={isSuperAdmin}
                                      onChange={() => handleTogglePermission(selectedRole, modKey, action.id)}
                                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedRole === 'super_admin' && (
                  <div className="flex items-start gap-2.5 p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800">
                    <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Perfil Protegido:</strong> O Super Administrador possui permissões de visualização, criação, edição, exclusão, aprovação, exportação e administração irrestritas em todos os módulos por razões de governança e segurança de TI. Estes direitos são imutáveis.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── Integrações ─── */}
            {active === 'integracoes' && (
              <div className="space-y-3">
                {[
                  { name: 'Cadastro Mestre de Beneficiários', status: 'ativo', endpoint: '/api/v1/beneficiarios' },
                  { name: 'Agenda Inteligente', status: 'ativo', endpoint: '/api/v1/agenda' },
                  { name: 'Prontuário Eletrônico', status: 'ativo', endpoint: '/api/v1/prontuario' },
                  { name: 'Gestão de Casos', status: 'ativo', endpoint: '/api/v1/casos' },
                  { name: 'Teleatendimento', status: 'ativo', endpoint: '/api/v1/telehealth' },
                  { name: 'Gestão Financeira', status: 'ativo', endpoint: '/api/v1/financeiro' },
                  { name: 'Portal do Beneficiário', status: 'planejado', endpoint: '/api/v1/portal' },
                  { name: 'API Institucional Pública', status: 'planejado', endpoint: '/api/v1/public' },
                ].map(integ => (
                  <div key={integ.name} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0',
                      integ.status === 'ativo' ? 'bg-emerald-500' : 'bg-slate-300')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{integ.name}</p>
                      <p className="text-xs font-mono text-slate-400">{integ.endpoint}</p>
                    </div>
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full',
                      integ.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {integ.status === 'ativo' ? 'Ativo' : 'Planejado'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Parâmetros ─── */}
            {active === 'parametros' && (
              <div className="space-y-6">
                {paramGroups.map(group => (
                  <div key={group.id} className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{group.label}</p>
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      {group.items.map(item => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 group hover:border-red-200 hover:text-red-600 transition-colors"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => handleDeleteParam(group.id, item)}
                            className="text-slate-400 group-hover:text-red-500 p-0.5 rounded hover:bg-slate-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {group.items.length === 0 && (
                        <span className="text-xs text-slate-400 py-1">Nenhum parâmetro adicionado</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="Adicionar novo..."
                        value={newParamText[group.id] || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setNewParamText(prev => ({ ...prev, [group.id]: val }));
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddParam(group.id);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddParam(group.id)}
                        className="px-3 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-500 transition-all shadow-sm shrink-0"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Save bar */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button onClick={handleSave}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all',
                  saved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-teal-600 text-white hover:bg-teal-500'
                )}>
                {saved ? <><Check className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar Configurações</>}
              </button>
              <button
                onClick={() => {
                  setMatrix(initialMatrix as any);
                  setCustomRoles([]);
                  setParamGroups([
                    { id: 'tipos_atendimento', label: 'Tipos de Atendimento', items: ['Psicológico', 'Social', 'Jurídico', 'Médico', 'Educacional', 'Outro'] },
                    { id: 'categorias_projetos', label: 'Categorias de Projetos', items: ['Saúde Mental', 'Vulnerabilidade Social', 'Infância', 'Idoso', 'Mulher', 'Educação'] },
                    { id: 'status_beneficiario', label: 'Status de Beneficiário', items: ['Ativo', 'Em Avaliação', 'Inativo', 'Encerrado'] },
                    { id: 'protocolos_atendimento', label: 'Protocolos de Atendimento', items: ['Acolhimento', 'Avaliação Inicial', 'Plano Terapêutico', 'Alta Clínica'] },
                  ]);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Restaurar Padrões
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
