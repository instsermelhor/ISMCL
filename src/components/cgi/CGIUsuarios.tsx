import React, { useState } from 'react';
import {
  Search, Plus, ShieldCheck, ShieldX, KeyRound, Smartphone,
  Clock, CheckCircle2, AlertTriangle, UserCog, ChevronRight,
  Users, Edit3, X, Save, Eye, EyeOff, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import {
  systemUsers, ROLE_LABELS, teams,
  userSessions, type SystemUser, type AdminRole,
} from '../../data/cgi-mock';

const statusConfig: Record<SystemUser['status'], { label: string; color: string; icon: React.ElementType }> = {
  ativo: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  suspenso: { label: 'Suspenso', color: 'bg-red-100 text-red-700', icon: ShieldX },
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
};

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// ─── User Modal (Create/Edit) ─────────────────────────────────
function UserModal({ user, onClose }: { user: SystemUser | null; onClose: () => void }) {
  const isNew = !user;
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<AdminRole>(user?.role ?? 'secretaria');
  const [team, setTeam] = useState(user?.team ?? '');
  const [mfa, setMfa] = useState(user?.mfa ?? false);
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">{isNew ? 'Novo Usuário' : 'Editar Usuário'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome Completo</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: Dra. Maria Silva"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">E-mail</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                placeholder="usuario@institutosermelhor.org"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Perfil de Acesso</label>
              <select value={role} onChange={e => setRole(e.target.value as AdminRole)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                {(Object.entries(ROLE_LABELS) as [AdminRole, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Equipe</label>
              <select value={team} onChange={e => setTeam(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                <option value="">Sem equipe</option>
                <option value="Clínica">Clínica</option>
                <option value="Social">Social</option>
                <option value="Gestão">Gestão</option>
                <option value="Jurídico">Jurídico</option>
              </select>
            </div>
            {isNew && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Senha Inicial</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} placeholder="Mín. 10 caracteres"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none pr-10" />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MFA */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-600" />
              <div>
                <p className="text-sm font-medium text-slate-800">Solicitar Ativação de MFA</p>
                <p className="text-xs text-slate-400">Solicita ao usuário para habilitar o MFA no sistema</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMfa(v => !v)}
              className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', mfa ? 'bg-teal-500' : 'bg-slate-200')}
            >
              <motion.span animate={{ x: mfa ? '1.375rem' : '0.125rem' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="inline-block h-4 w-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
          <button onClick={handleSave}
            className={cn('flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all',
              saved ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500')}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> {isNew ? 'Criar Usuário' : 'Salvar Alterações'}</>}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Teams Panel ──────────────────────────────────────────────
function TeamsPanel() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipes</span>
        <button className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700">
          <Plus className="w-3.5 h-3.5" /> Nova Equipe
        </button>
      </div>
      <div className="divide-y divide-slate-50">
        {teams.map(t => (
          <div key={t.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: t.color + '20', border: `1.5px solid ${t.color}40` }}>
              <Users className="w-4 h-4" style={{ color: t.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-400">{t.description}</p>
              <p className="text-xs text-slate-400 mt-0.5">Líder: {t.lead} · {t.memberCount} membro(s)</p>
            </div>
            <div className="flex flex-wrap gap-1 justify-end max-w-32">
              {t.modules.slice(0, 2).map(m => (
                <span key={m} className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">{m}</span>
              ))}
              {t.modules.length > 2 && (
                <span className="text-xs text-slate-400">+{t.modules.length - 2}</span>
              )}
            </div>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sessions Panel ────────────────────────────────────────────
function SessionsPanel() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sessões Recentes</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-600 font-medium">2 ativas agora</span>
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {userSessions.map(s => (
          <div key={s.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
            <div className={cn('w-2.5 h-2.5 rounded-full shrink-0',
              s.status === 'active' ? 'bg-emerald-500' : s.status === 'expired' ? 'bg-amber-400' : 'bg-slate-300')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{s.userName}</p>
              <p className="text-xs text-slate-400">{s.device} · {s.ip}</p>
              <p className="text-xs text-slate-400">
                Entrada: {formatTimestamp(s.loginAt)}
                {s.duration && ` · Duração: ${s.duration}`}
              </p>
            </div>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
              s.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                s.status === 'expired' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
              {s.status === 'active' ? 'Ativa' : s.status === 'expired' ? 'Expirada' : 'Encerrada'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function CGIUsuarios() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<SystemUser | null>(null);
  const [modalUser, setModalUser] = useState<SystemUser | null | 'new'>(undefined as any);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'equipes' | 'sessoes'>('usuarios');

  const filtered = systemUsers.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpis = [
    { label: 'Total', value: systemUsers.length, color: 'text-slate-900' },
    { label: 'Ativos', value: systemUsers.filter(u => u.status === 'ativo').length, color: 'text-emerald-600' },
    { label: 'Suspensos', value: systemUsers.filter(u => u.status === 'suspenso').length, color: 'text-red-600' },
    { label: 'Com MFA', value: systemUsers.filter(u => u.mfa).length, color: 'text-teal-600' },
  ];

  return (
    <>
      {/* Modal */}
      <AnimatePresence>
        {modalUser !== undefined && (
          <UserModal
            user={modalUser === 'new' ? null : modalUser}
            onClose={() => setModalUser(undefined as any)}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">{k.label}</p>
              <p className={cn('text-2xl font-bold', k.color)}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* MFA info banner */}
        {systemUsers.filter(u => !u.mfa && u.status === 'ativo').length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-teal-100 bg-teal-50/50">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <p className="text-sm text-teal-800">
              A autenticação multifator (MFA) é opcional. Você pode solicitar a ativação para os usuários no cadastro.
            </p>
          </div>
        )}

        {/* Tab nav */}
        <div className="flex gap-2">
          {[
            { id: 'usuarios', label: 'Usuários' },
            { id: 'equipes', label: 'Equipes' },
            { id: 'sessoes', label: 'Sessões' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === t.id ? 'bg-teal-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'equipes' && <TeamsPanel />}
        {activeTab === 'sessoes' && <SessionsPanel />}

        {activeTab === 'usuarios' && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 shadow-sm outline-none" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm">
                <option value="all">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="suspenso">Suspenso</option>
                <option value="pendente">Pendente</option>
              </select>
              <button
                onClick={() => setModalUser('new')}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Novo Usuário
              </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{filtered.length} usuário(s)</span>
              </div>
              <div className="divide-y divide-slate-50">
                {filtered.map((u, i) => {
                  const cfg = statusConfig[u.status];
                  const StatusIcon = cfg.icon;
                  const isSelected = selected?.id === u.id;
                  const riskColor = (u.riskScore ?? 0) >= 70 ? 'text-red-600 bg-red-50' : (u.riskScore ?? 0) >= 30 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';

                  return (
                    <React.Fragment key={u.id}>
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        onClick={() => setSelected(isSelected ? null : u)}
                        className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                          {u.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                            {u.team && (
                              <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">{u.team}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{u.email} · {ROLE_LABELS[u.role]}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Risk score */}
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full hidden sm:flex items-center gap-1', riskColor)}>
                            Risco: {u.riskScore}
                          </span>
                          {u.mfa ? (
                            <span title="MFA ativo" className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                              <Smartphone className="w-3 h-3" />MFA
                            </span>
                          ) : (
                            <span title="Sem MFA" className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              <Smartphone className="w-3 h-3" />Sem MFA
                            </span>
                          )}
                          <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', cfg.color)}>
                            <StatusIcon className="w-3.5 h-3.5" />{cfg.label}
                          </span>
                          <ChevronRight className={cn('w-4 h-4 text-slate-300 transition-transform', isSelected && 'rotate-90')} />
                        </div>
                      </motion.div>
                      {isSelected && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                            {[
                              { label: 'Perfil', value: ROLE_LABELS[u.role] },
                              { label: 'Último Login', value: formatTimestamp(u.lastLogin) },
                              { label: 'Cadastro em', value: u.createdAt },
                              { label: 'Sessões no mês', value: `${u.sessionsThisMonth ?? 0}` },
                            ].map(f => (
                              <div key={f.label}>
                                <p className="text-xs text-slate-400">{f.label}</p>
                                <p className="text-sm font-medium text-slate-800 mt-0.5">{f.value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mb-4">
                            <p className="text-xs text-slate-400 mb-1.5">Permissões</p>
                            <div className="flex flex-wrap gap-1.5">
                              {u.permissions.map(p => (
                                <span key={p} className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">{p}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => setModalUser(u)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-500 transition-colors">
                              <UserCog className="w-3.5 h-3.5" /> Editar Perfil
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                              <KeyRound className="w-3.5 h-3.5" /> Resetar Senha
                            </button>
                            {!u.mfa && (
                              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-200 text-teal-700 text-xs font-medium rounded-lg hover:bg-teal-50 transition-colors">
                                <Smartphone className="w-3.5 h-3.5" /> Solicitar MFA
                              </button>
                            )}
                            {u.status === 'ativo' ? (
                              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
                                <ShieldX className="w-3.5 h-3.5" /> Suspender
                              </button>
                            ) : u.status === 'suspenso' ? (
                              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-500 transition-colors">
                                <ShieldCheck className="w-3.5 h-3.5" /> Reativar
                              </button>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </React.Fragment>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="px-5 py-12 text-center text-slate-400 text-sm">Nenhum usuário encontrado.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
