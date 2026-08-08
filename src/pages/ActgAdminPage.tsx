import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, Plug, MessageCircle, Video, Shield, Plus, Eye, EyeOff,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Save, Trash2,
  ChevronDown, ChevronUp, FileText, Bell, Zap, Lock, Globe, Server,
  ToggleLeft, ToggleRight, Copy, ExternalLink, Info, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  adminGetProviders, adminUpdateProvider, adminGetAccounts,
  adminCreateAccount, adminUpdateAccount, adminGetTemplates,
  adminCreateTemplate, adminUpdateTemplate,
  type AdminProvider, type AdminAccount, type AdminTemplate,
} from '../services/actgService';

// ── Helpers ────────────────────────────────────────────────────────────────

const PROVIDER_META: Record<string, { label: string; icon: React.ElementType; gradient: string; color: string }> = {
  GOOGLE_MEET:        { label: 'Google Meet',                 icon: Video,          gradient: 'linear-gradient(135deg,#00897B,#00695C)', color: '#00897B' },
  TEAMS:              { label: 'Microsoft Teams',             icon: Video,          gradient: 'linear-gradient(135deg,#6264A7,#464775)', color: '#6264A7' },
  WHATSAPP_BUSINESS:  { label: 'WhatsApp Business Platform',  icon: MessageCircle,  gradient: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#25D366' },
  WEBRTC_NATIVE:      { label: 'Sala Virtual Aura (WebRTC)',  icon: Shield,         gradient: 'linear-gradient(135deg,#0EA5E9,#0284C7)', color: '#0EA5E9' },
};

const ENV_COLORS: Record<string, string> = {
  PRODUCTION: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  STAGING:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
  SANDBOX:    'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp', EMAIL: 'E-mail', SMS: 'SMS', PUSH: 'Push', PORTAL: 'Portal',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  APPOINTMENT_CREATED:    'Agendamento Criado',
  APPOINTMENT_CONFIRMED:  'Agendamento Confirmado',
  REMINDER_7D:            'Lembrete 7 dias',
  REMINDER_24H:           'Lembrete 24 horas',
  REMINDER_2H:            'Lembrete 2 horas',
  REMINDER_30MIN:         'Lembrete 30 minutos',
  APPOINTMENT_CANCELLED:  'Agendamento Cancelado',
  APPOINTMENT_RESCHEDULED:'Agendamento Reagendado',
  SESSION_STARTED:        'Atendimento Iniciado',
  SESSION_COMPLETED:      'Atendimento Concluído',
  CHANNEL_CHANGED:        'Canal Alterado',
};

const GLASS = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

const GLASS_ELEVATED = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(20px)',
} as const;

function StatusPill({ on, label }: { on: boolean; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${on ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
      {on ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
      {label ?? (on ? 'Ativo' : 'Inativo')}
    </span>
  );
}

function SectionTitle({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)' }}>
        <Icon className="w-5 h-5 text-teal-400" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-white">{label}</h2>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Modals ─────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl rounded-2xl overflow-hidden z-10"
        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, type = 'text', disabled, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:ring-1 focus:ring-teal-500/60'}`}
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function FormSelect({ label, value, onChange, options, hint }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all focus:ring-1 focus:ring-teal-500/60"
        style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder, rows = 4, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-1 focus:ring-teal-500/60 resize-none font-mono"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

// ── Tab: Provedores ────────────────────────────────────────────────────────

function ProvidersTab() {
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    adminGetProviders().then((data) => { setProviders(data); setLoading(false); });
  }, []);

  const toggleEnabled = useCallback(async (prov: AdminProvider) => {
    setSaving(prov.id);
    const updated = await adminUpdateProvider(prov.id, { isEnabled: !prov.isEnabled });
    setProviders((prev) => prev.map((p) => p.id === prov.id ? { ...p, ...updated } : p));
    setSaving(null);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><RefreshCw className="w-6 h-6 text-teal-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
        <Info className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-teal-300">Princípio do ACTG</p>
          <p className="text-xs text-teal-300/70 mt-0.5">O administrador habilita/desabilita provedores. As credenciais (tokens, chaves) são gerenciadas exclusivamente pelo <strong>Vault</strong> — nunca armazenadas aqui.</p>
        </div>
      </div>

      {providers.map((prov) => {
        const meta = PROVIDER_META[prov.type] ?? { label: prov.name, icon: Globe, gradient: 'linear-gradient(135deg,#475569,#334155)', color: '#94a3b8' };
        const Icon = meta.icon;
        const isExpanded = expanded === prov.id;

        return (
          <motion.div
            key={prov.id}
            layout
            className="rounded-2xl overflow-hidden"
            style={GLASS_ELEVATED}
          >
            {/* Header */}
            <div className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: meta.gradient }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">{prov.name}</h3>
                  <StatusPill on={prov.isEnabled} label={prov.isEnabled ? 'Habilitado' : 'Desabilitado'} />
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {prov.supportsVideo && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Video className="w-2.5 h-2.5" /> Vídeo</span>}
                  {prov.supportsChat && <span className="text-[10px] text-slate-400 flex items-center gap-1"><MessageCircle className="w-2.5 h-2.5" /> Notificação</span>}
                  <span className="text-[10px] text-slate-500">{prov.accountsCount} conta{prov.accountsCount !== 1 ? 's' : ''} vinculada{prov.accountsCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleEnabled(prov)}
                  disabled={saving === prov.id}
                  className="p-2 rounded-xl transition-colors hover:bg-white/5 disabled:opacity-50"
                  title={prov.isEnabled ? 'Desabilitar provedor' : 'Habilitar provedor'}
                >
                  {saving === prov.id
                    ? <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
                    : prov.isEnabled
                      ? <ToggleRight className="w-5 h-5 text-teal-400" />
                      : <ToggleLeft className="w-5 h-5 text-slate-500" />
                  }
                </motion.button>
                <button
                  onClick={() => setExpanded(isExpanded ? null : prov.id)}
                  className="p-2 rounded-xl transition-colors hover:bg-white/5 text-slate-400"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Expanded Config */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="p-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Capacidades</p>
                      <div className="space-y-1.5">
                        {[
                          { key: 'supportsVideo', label: 'Vídeo' },
                          { key: 'supportsAudio', label: 'Áudio' },
                          { key: 'supportsChat', label: 'Chat' },
                          { key: 'supportsNotify', label: 'Notificação' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-2">
                            {(prov as any)[key]
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              : <XCircle className="w-3.5 h-3.5 text-slate-600" />
                            }
                            <span className={`text-xs ${(prov as any)[key] ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {prov.configSchema && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Config Schema</p>
                        <pre className="text-[10px] text-slate-400 font-mono rounded-xl p-2.5 overflow-auto" style={{ background: 'rgba(0,0,0,0.3)' }}>
                          {JSON.stringify(prov.configSchema, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  {prov.type === 'WHATSAPP_BUSINESS' && (
                    <div className="mx-5 mb-5 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Limitação Técnica Oficial (Meta)</p>
                      <p className="text-xs text-amber-300/70">O WhatsApp Business Platform funciona exclusivamente como canal de <strong>notificação</strong>. Não é possível criar videochamadas programaticamente via API oficial.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Tab: Contas (Vault) ────────────────────────────────────────────────────

function AccountsTab({ providers }: { providers: AdminProvider[] }) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editModal, setEditModal] = useState<AdminAccount | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // New account form state
  const [newForm, setNewForm] = useState({ providerId: '', name: '', environment: 'PRODUCTION', vaultPath: '', webhookUrl: '', isActive: true });

  useEffect(() => {
    adminGetAccounts().then((data) => { setAccounts(data); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    const account = await adminCreateAccount({ ...newForm, isActive: true });
    setAccounts((prev) => [...prev, account]);
    setShowNewModal(false);
    setNewForm({ providerId: '', name: '', environment: 'PRODUCTION', vaultPath: '', webhookUrl: '', isActive: true });
  };

  const handleToggleActive = async (acc: AdminAccount) => {
    const updated = await adminUpdateAccount(acc.id, { isActive: !acc.isActive });
    setAccounts((prev) => prev.map((a) => a.id === acc.id ? { ...a, ...updated } : a));
    setSaved(acc.id);
    setTimeout(() => setSaved(null), 1500);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    const updated = await adminUpdateAccount(editModal.id, { name: editModal.name, vaultPath: editModal.vaultPath, webhookUrl: editModal.webhookUrl, environment: editModal.environment });
    setAccounts((prev) => prev.map((a) => a.id === updated.id ? { ...a, ...updated } : a));
    setEditModal(null);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><RefreshCw className="w-6 h-6 text-teal-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-4 rounded-2xl flex items-start gap-3 flex-1 mr-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Lock className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-indigo-300/80">
            O campo <strong>Caminho no Vault</strong> aponta para o HashiCorp Vault ou AWS Secrets Manager onde as credenciais reais (tokens, chaves) são armazenadas com segurança. Nenhum segredo é gravado aqui.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}
        >
          <Plus className="w-4 h-4" /> Nova Conta
        </motion.button>
      </div>

      {accounts.map((acc) => {
        const meta = PROVIDER_META[providers.find((p) => p.id === acc.providerId)?.type ?? ''] ?? { label: acc.providerName, icon: Server, gradient: 'linear-gradient(135deg,#475569,#334155)', color: '#94a3b8' };
        const Icon = meta.icon;
        return (
          <motion.div key={acc.id} layout className="rounded-2xl p-5" style={GLASS_ELEVATED}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.gradient }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="text-sm font-bold text-white">{acc.name}</h3>
                  <StatusPill on={acc.isActive} />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${ENV_COLORS[acc.environment] ?? ENV_COLORS.PRODUCTION}`}>
                    {acc.environment}
                  </span>
                  {saved === acc.id && <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Salvo</span>}
                </div>
                <p className="text-xs text-slate-500 mb-3">{acc.providerName}</p>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.25)' }}>
                    <Lock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Vault Path</p>
                      <p className="text-xs text-indigo-300 font-mono truncate">{acc.vaultPath}</p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard?.writeText(acc.vaultPath)}
                      className="text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {acc.webhookUrl && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.25)' }}>
                      <Globe className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Webhook URL</p>
                        <p className="text-xs text-teal-300 font-mono truncate">{acc.webhookUrl}</p>
                      </div>
                      <button
                        onClick={() => window.open(acc.webhookUrl, '_blank')}
                        className="text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditModal({ ...acc })}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Editar conta"
                >
                  <Settings className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleToggleActive(acc)}
                  className="p-2 rounded-xl transition-colors hover:bg-white/5"
                  title={acc.isActive ? 'Desativar' : 'Ativar'}
                >
                  {acc.isActive ? <ToggleRight className="w-4 h-4 text-teal-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* New Account Modal */}
      <AnimatePresence>
        {showNewModal && (
          <Modal open title="Nova Conta de Comunicação" onClose={() => setShowNewModal(false)}>
            <div className="space-y-4">
              <FormSelect
                label="Provedor"
                value={newForm.providerId}
                onChange={(v) => setNewForm((f) => ({ ...f, providerId: v }))}
                options={providers.map((p) => ({ value: p.id, label: p.name }))}
              />
              <FormInput label="Nome da Conta" value={newForm.name} onChange={(v) => setNewForm((f) => ({ ...f, name: v }))} placeholder="Ex: Conta Institucional Google Workspace" />
              <FormSelect
                label="Ambiente"
                value={newForm.environment}
                onChange={(v) => setNewForm((f) => ({ ...f, environment: v }))}
                options={[{ value: 'PRODUCTION', label: 'Production' }, { value: 'STAGING', label: 'Staging' }, { value: 'SANDBOX', label: 'Sandbox' }]}
              />
              <FormInput
                label="Caminho no Vault (Vault Path)"
                value={newForm.vaultPath}
                onChange={(v) => setNewForm((f) => ({ ...f, vaultPath: v }))}
                placeholder="secret/data/aura/prod/nome-credencial"
                hint="Caminho no HashiCorp Vault ou AWS Secrets Manager onde as credenciais estão armazenadas"
              />
              <FormInput
                label="Webhook URL (opcional)"
                value={newForm.webhookUrl}
                onChange={(v) => setNewForm((f) => ({ ...f, webhookUrl: v }))}
                placeholder="https://api.aura.org/api/v1/actg/webhooks/PROVEDOR"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={!newForm.providerId || !newForm.name || !newForm.vaultPath}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}
                >
                  Criar Conta
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Account Modal */}
      <AnimatePresence>
        {editModal && (
          <Modal open title="Editar Conta" onClose={() => setEditModal(null)}>
            <div className="space-y-4">
              <FormInput label="Nome da Conta" value={editModal.name} onChange={(v) => setEditModal((f) => f ? { ...f, name: v } : f)} />
              <FormSelect
                label="Ambiente"
                value={editModal.environment}
                onChange={(v) => setEditModal((f) => f ? { ...f, environment: v } : f)}
                options={[{ value: 'PRODUCTION', label: 'Production' }, { value: 'STAGING', label: 'Staging' }, { value: 'SANDBOX', label: 'Sandbox' }]}
              />
              <FormInput
                label="Caminho no Vault"
                value={editModal.vaultPath}
                onChange={(v) => setEditModal((f) => f ? { ...f, vaultPath: v } : f)}
                hint="Modifique apenas se o caminho no Vault foi alterado"
              />
              <FormInput
                label="Webhook URL"
                value={editModal.webhookUrl ?? ''}
                onChange={(v) => setEditModal((f) => f ? { ...f, webhookUrl: v } : f)}
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                  <span className="flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Salvar</span>
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab: Templates ─────────────────────────────────────────────────────────

function TemplatesTab() {
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editModal, setEditModal] = useState<AdminTemplate | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [newForm, setNewForm] = useState({ name: '', eventType: 'APPOINTMENT_CONFIRMED', channel: 'WHATSAPP', language: 'pt_BR', subject: '', body: '', mcsiMaxLevel: 2, isActive: true });

  useEffect(() => {
    adminGetTemplates().then((data) => { setTemplates(data); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    const tmpl = await adminCreateTemplate({ ...newForm, providerId: undefined });
    setTemplates((prev) => [...prev, tmpl]);
    setShowNewModal(false);
    setNewForm({ name: '', eventType: 'APPOINTMENT_CONFIRMED', channel: 'WHATSAPP', language: 'pt_BR', subject: '', body: '', mcsiMaxLevel: 2, isActive: true });
  };

  const handleToggleActive = async (tmpl: AdminTemplate) => {
    const updated = await adminUpdateTemplate(tmpl.id, { isActive: !tmpl.isActive });
    setTemplates((prev) => prev.map((t) => t.id === tmpl.id ? { ...t, ...updated } : t));
    setSaved(tmpl.id);
    setTimeout(() => setSaved(null), 1500);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    const updated = await adminUpdateTemplate(editModal.id, { name: editModal.name, subject: editModal.subject, body: editModal.body, mcsiMaxLevel: editModal.mcsiMaxLevel });
    setTemplates((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
    setEditModal(null);
  };

  const CHANNEL_COLORS: Record<string, string> = {
    WHATSAPP: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    EMAIL:    'bg-sky-500/15 text-sky-400 border-sky-500/30',
    SMS:      'bg-purple-500/15 text-purple-400 border-purple-500/30',
    PUSH:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
    PORTAL:   'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  const MCSI_COLORS: Record<number, string> = {
    0: 'text-slate-400', 1: 'text-slate-400', 2: 'text-teal-400', 3: 'text-amber-400', 4: 'text-red-400',
  };

  if (loading) return <div className="flex items-center justify-center py-24"><RefreshCw className="w-6 h-6 text-teal-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-4 rounded-2xl flex items-start gap-3 flex-1 mr-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300/80">
            <strong>Regra MCSI:</strong> O campo "Nível MCSI Máx." define o nível máximo de classificação do caso que pode receber este template. Templates com MCSI ≥ 3 devem usar linguagem <strong>100% neutra</strong> — sem referência à natureza do atendimento.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}
        >
          <Plus className="w-4 h-4" /> Novo Template
        </motion.button>
      </div>

      <div className="grid gap-3">
        {templates.map((tmpl) => (
          <motion.div key={tmpl.id} layout className="rounded-2xl" style={GLASS_ELEVATED}>
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.2)' }}>
                  <Bell className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-white">{tmpl.name}</h3>
                    <StatusPill on={tmpl.isActive} />
                    {saved === tmpl.id && <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Salvo</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${CHANNEL_COLORS[tmpl.channel] ?? CHANNEL_COLORS.PORTAL}`}>
                      {CHANNEL_LABELS[tmpl.channel] ?? tmpl.channel}
                    </span>
                    <span className="text-[10px] text-slate-500">{EVENT_TYPE_LABELS[tmpl.eventType] ?? tmpl.eventType}</span>
                    <span className={`text-[10px] font-semibold ${MCSI_COLORS[tmpl.mcsiMaxLevel] ?? 'text-slate-400'}`}>
                      MCSI ≤ {tmpl.mcsiMaxLevel}
                    </span>
                    <span className="text-[10px] text-slate-600">{tmpl.language}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewId(previewId === tmpl.id ? null : tmpl.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                    title="Pré-visualizar"
                  >
                    {previewId === tmpl.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditModal({ ...tmpl })}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                    title="Editar"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(tmpl)}
                    className="p-1.5 rounded-lg transition-colors"
                    title={tmpl.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {tmpl.isActive ? <ToggleRight className="w-4 h-4 text-teal-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {previewId === tmpl.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {tmpl.subject && <p className="text-xs font-semibold text-slate-400 mb-2">Assunto: <span className="text-white">{tmpl.subject}</span></p>}
                      <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{tmpl.body}</pre>
                      <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <Info className="w-3 h-3 text-slate-600" />
                        <p className="text-[10px] text-slate-600">Placeholders disponíveis: {'{name}'}, {'{date}'}, {'{time}'}, {'{professional}'}, {'{link}'}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Template Modal */}
      <AnimatePresence>
        {showNewModal && (
          <Modal open title="Novo Template de Comunicação" onClose={() => setShowNewModal(false)}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <FormInput label="Nome do Template" value={newForm.name} onChange={(v) => setNewForm((f) => ({ ...f, name: v }))} placeholder="Ex: Confirmação de Agendamento (WhatsApp)" />
              <div className="grid grid-cols-2 gap-3">
                <FormSelect label="Canal" value={newForm.channel} onChange={(v) => setNewForm((f) => ({ ...f, channel: v }))} options={Object.entries(CHANNEL_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
                <FormSelect label="Evento Gatilho" value={newForm.eventType} onChange={(v) => setNewForm((f) => ({ ...f, eventType: v }))} options={Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormSelect label="Idioma" value={newForm.language} onChange={(v) => setNewForm((f) => ({ ...f, language: v }))} options={[{ value: 'pt_BR', label: 'Português (BR)' }, { value: 'en_US', label: 'English (US)' }, { value: 'es_ES', label: 'Español' }]} />
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">MCSI Nível Máx.</label>
                  <select value={newForm.mcsiMaxLevel} onChange={(e) => setNewForm((f) => ({ ...f, mcsiMaxLevel: +e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>Nível {n}{n <= 2 ? ' (Padrão)' : n === 3 ? ' (Sensível)' : ' (Crítico)'}</option>)}
                  </select>
                </div>
              </div>
              {newForm.channel === 'EMAIL' && (
                <FormInput label="Assunto (E-mail)" value={newForm.subject} onChange={(v) => setNewForm((f) => ({ ...f, subject: v }))} placeholder="Projeto Aura — Seu Atendimento" />
              )}
              <FormTextarea
                label="Corpo da Mensagem"
                value={newForm.body}
                onChange={(v) => setNewForm((f) => ({ ...f, body: v }))}
                placeholder="Olá {name}, seu atendimento foi agendado para {date} às {time}..."
                rows={5}
                hint="Placeholders: {name}, {date}, {time}, {professional}, {link}"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={!newForm.name || !newForm.body}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}
                >
                  Criar Template
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Template Modal */}
      <AnimatePresence>
        {editModal && (
          <Modal open title="Editar Template" onClose={() => setEditModal(null)}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <FormInput label="Nome" value={editModal.name} onChange={(v) => setEditModal((f) => f ? { ...f, name: v } : f)} />
              {editModal.channel === 'EMAIL' && (
                <FormInput label="Assunto" value={editModal.subject ?? ''} onChange={(v) => setEditModal((f) => f ? { ...f, subject: v } : f)} />
              )}
              <FormTextarea label="Corpo da Mensagem" value={editModal.body} onChange={(v) => setEditModal((f) => f ? { ...f, body: v } : f)} rows={6} hint="Placeholders: {name}, {date}, {time}, {professional}, {link}" />
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">MCSI Nível Máx.</label>
                <select value={editModal.mcsiMaxLevel} onChange={(e) => setEditModal((f) => f ? { ...f, mcsiMaxLevel: +e.target.value } : f)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>Nível {n}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                  <span className="flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Salvar</span>
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Página Principal ───────────────────────────────────────────────────────

const TABS = [
  { id: 'providers', label: 'Provedores', icon: Plug, sub: 'Habilitar / desabilitar canais' },
  { id: 'accounts',  label: 'Contas & Vault', icon: Lock, sub: 'Credenciais vinculadas' },
  { id: 'templates', label: 'Templates', icon: FileText, sub: 'Mensagens de notificação' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ActgAdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('providers');
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    adminGetProviders().then(setProviders);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 60%, #0a1628 100%)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center gap-4 px-6 py-4"
        style={{ background: 'rgba(10,15,30,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/omnichannel')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Central ACTG</span>
        </motion.button>
        <div className="w-px h-5 bg-slate-700" />
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(20,184,166,0.2),rgba(14,165,233,0.2))', border: '1px solid rgba(20,184,166,0.3)' }}>
          <Settings className="w-4 h-4 text-teal-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Configuração ACTG</h1>
          <p className="text-[10px] text-slate-500">Aura Communication & Teleattendance Gateway</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', color: '#2dd4bf' }}>
            <Zap className="w-3 h-3" />
            ADR-188
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-white mb-1">Administração de Canais</h1>
          <p className="text-sm text-slate-400">Configure provedores, credenciais (Vault) e templates de notificação. Nenhum segredo é armazenado aqui — apenas caminhos de referência ao Vault.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 p-1 rounded-2xl" style={GLASS}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.97 }}
              id={`actg-admin-tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              style={activeTab === id ? { background: 'linear-gradient(135deg,rgba(20,184,166,0.2),rgba(14,165,233,0.15))', border: '1px solid rgba(20,184,166,0.25)' } : {}}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Active Tab Description */}
        <div className="mb-6">
          {TABS.map(({ id, label, icon: Icon, sub }) =>
            activeTab === id ? (
              <div key={id}>
                <SectionTitle icon={Icon} label={label} sub={sub} />
              </div>
            ) : null
          )}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'providers' && <ProvidersTab />}
            {activeTab === 'accounts' && <AccountsTab providers={providers} />}
            {activeTab === 'templates' && <TemplatesTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
