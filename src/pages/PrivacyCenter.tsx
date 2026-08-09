import React, { useState, useEffect } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, Lock, FileText,
  Download, Trash2, Eye, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, ChevronRight, Info, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import {
  lgpdService,
  type DataConsent,
  type DataSubjectRequest,
  type RequestType,
  REQUEST_TYPE_LABELS,
  REQUEST_TYPE_DESCRIPTIONS,
  PURPOSES_LABELS,
} from '../services/lgpdService';

const STATUS_CONFIG = {
  PENDING:     { label: 'Pendente',    color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  icon: Clock },
  IN_PROGRESS: { label: 'Em Análise', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: RefreshCw },
  COMPLETED:   { label: 'Concluído',  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  REJECTED:    { label: 'Recusado',   color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    icon: X },
  CANCELLED:   { label: 'Cancelado',  color: 'text-stone-500',  bg: 'bg-stone-50',  border: 'border-stone-200',  icon: X },
};

const REQUEST_ICONS: Record<RequestType, React.FC<{ className?: string }>> = {
  ACCESS:       Eye,
  PORTABILITY:  Download,
  RECTIFICATION: FileText,
  ERASURE:      Trash2,
  RESTRICTION:  Lock,
  OBJECTION:    ShieldAlert,
};

export default function PrivacyCenter() {
  const { user } = useAuth();

  const [consent, setConsent] = useState<DataConsent | null>(null);
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'consent' | 'rights' | 'history'>('consent');

  const [selectedPurposes, setSelectedPurposes] = useState<string[]>(
    Object.keys(PURPOSES_LABELS).filter((p) => p !== 'analytics' && p !== 'pesquisa')
  );
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestType>('ACCESS');
  const [requestDescription, setRequestDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const entityId = user?.id ?? 'anonymous';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [activeConsent, allRequests] = await Promise.all([
        lgpdService.getActiveConsent(entityId, 'BENEFICIARY'),
        lgpdService.getRequests(entityId),
      ]);
      setConsent(activeConsent);
      if (activeConsent?.purposes) {
        setSelectedPurposes(activeConsent.purposes as string[]);
      }
      setRequests(allRequests);
      setLoading(false);
    }
    loadData();
  }, [entityId]);

  const handleGrantConsent = async () => {
    setSubmitting(true);
    try {
      const result = await lgpdService.grantConsent({
        entityId,
        entityType: 'BENEFICIARY',
        purposes: selectedPurposes,
        legalBasis: 'CONSENTIMENTO',
        tenantId: 'default',
      });
      setConsent(result);
      setSuccessMsg('Consentimento registrado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Tem certeza que deseja revogar seu consentimento? Isso pode interromper o acesso a alguns serviços.')) return;
    setSubmitting(true);
    try {
      await lgpdService.withdrawConsent(entityId, 'BENEFICIARY', 'Revogação voluntária pelo titular');
      setConsent(null);
      setSuccessMsg('Consentimento revogado. Você pode concedê-lo novamente a qualquer momento.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequest = async () => {
    setSubmitting(true);
    try {
      const req = await lgpdService.createRequest({
        entityId,
        entityType: 'BENEFICIARY',
        requestType: selectedRequest,
        description: requestDescription,
        requestedBy: entityId,
      });
      setRequests((prev) => [req, ...prev]);
      setShowRequestModal(false);
      setRequestDescription('');
      setSuccessMsg(`Solicitação de ${REQUEST_TYPE_LABELS[selectedRequest].split(' ')[0]} criada! Prazo: 15 dias úteis.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePurpose = (purpose: string) => {
    const mandatory = ['legal', 'saude_mental', 'prontuario'];
    if (mandatory.includes(purpose)) return; // Não pode desmarcar finalidades obrigatórias
    setSelectedPurposes((prev) =>
      prev.includes(purpose) ? prev.filter((p) => p !== purpose) : [...prev, purpose]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-indigo-300 text-sm">Carregando seu painel de privacidade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-indigo-600/30 rounded-2xl flex items-center justify-center border border-indigo-500/40">
            <Shield className="w-7 h-7 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Central de Privacidade</h1>
            <p className="text-indigo-300 text-sm mt-0.5">
              Gerencie seus dados pessoais conforme a Lei Geral de Proteção de Dados — Lei 13.709/2018
            </p>
          </div>
          {consent?.isActive && (
            <span className="ml-auto flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> Consentimento Ativo
            </span>
          )}
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-4 py-3 flex items-center gap-3 text-emerald-300 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-8 border border-white/10">
          {[
            { id: 'consent', label: 'Consentimento', icon: ShieldCheck },
            { id: 'rights', label: 'Meus Direitos', icon: FileText },
            { id: 'history', label: 'Histórico', icon: Clock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as typeof tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-indigo-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Consentimento ── */}
        {tab === 'consent' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-1">Finalidades do Tratamento de Dados</h2>
              <p className="text-indigo-300 text-sm mb-6">
                Selecione quais finalidades você autoriza. As marcadas com{' '}
                <span className="text-amber-400">⚠</span> são obrigatórias para o funcionamento do serviço.
              </p>
              <div className="space-y-3">
                {Object.entries(PURPOSES_LABELS).map(([key, label]) => {
                  const mandatory = ['legal', 'saude_mental', 'prontuario'].includes(key);
                  const checked = selectedPurposes.includes(key);
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'bg-indigo-600/20 border-indigo-500/50'
                          : 'bg-white/3 border-white/10 hover:border-white/20'
                      } ${mandatory ? 'opacity-80 cursor-default' : ''}`}
                      onClick={() => togglePurpose(key)}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked ? 'bg-indigo-500 border-indigo-400' : 'border-white/30'
                      }`}>
                        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-white">{label}</span>
                        {mandatory && <span className="ml-2 text-xs text-amber-400">⚠ Obrigatório</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                id="btn-grant-consent"
                onClick={handleGrantConsent}
                disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {consent?.isActive ? 'Atualizar Consentimento' : 'Conceder Consentimento'}
              </button>
              {consent?.isActive && (
                <button
                  id="btn-withdraw-consent"
                  onClick={handleWithdraw}
                  disabled={submitting}
                  className="px-5 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 font-medium rounded-xl transition-colors text-sm"
                >
                  Revogar
                </button>
              )}
            </div>

            <div className="bg-white/3 border border-white/10 rounded-xl p-4 flex gap-3 text-xs text-indigo-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
              <p>
                Você pode alterar ou revogar seu consentimento a qualquer momento, gratuitamente.
                A revogação não afeta tratamentos realizados anteriormente com base em consentimento válido.
                Base legal: <strong className="text-indigo-200">LGPD Art. 8, §5</strong>
              </p>
            </div>
          </div>
        )}

        {/* ── Tab: Meus Direitos ── */}
        {tab === 'rights' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Exercer um Direito (LGPD Art. 18)</h2>
              <button
                id="btn-new-request"
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <FileText className="w-4 h-4" /> Nova Solicitação
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.entries(REQUEST_TYPE_LABELS) as [RequestType, string][]).map(([type, label]) => {
                const Icon = REQUEST_ICONS[type];
                return (
                  <button
                    key={type}
                    id={`btn-request-${type.toLowerCase()}`}
                    onClick={() => { setSelectedRequest(type); setShowRequestModal(true); }}
                    className="flex items-start gap-3 p-4 bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/50 rounded-xl text-left transition-all group"
                  >
                    <Icon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">{label.split('(')[0].trim()}</p>
                      <p className="text-xs text-indigo-400 mt-0.5">{REQUEST_TYPE_DESCRIPTIONS[type]}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-indigo-300 ml-auto shrink-0 mt-0.5" />
                  </button>
                );
              })}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                O prazo legal para resposta é de <strong>15 dias úteis</strong> a partir do recebimento da solicitação.
                Em casos complexos, o prazo pode ser estendido por mais 15 dias com justificativa. (LGPD Art. 19)
              </p>
            </div>
          </div>
        )}

        {/* ── Tab: Histórico ── */}
        {tab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Histórico de Solicitações</h2>
            {requests.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                <Clock className="w-10 h-10 text-indigo-400/40 mx-auto mb-3" />
                <p className="text-indigo-300 text-sm">Você ainda não possui solicitações registradas.</p>
              </div>
            ) : (
              requests.map((req) => {
                const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING;
                const StatusIcon = statusCfg.icon;
                const Icon = REQUEST_ICONS[req.requestType];
                return (
                  <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{REQUEST_TYPE_LABELS[req.requestType]}</p>
                      <p className="text-xs text-indigo-400 mt-0.5">
                        Aberta em {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                        {' · '}Prazo: {new Date(req.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusCfg.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal: Nova Solicitação */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowRequestModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Nova Solicitação de Direito</h3>
                <button onClick={() => setShowRequestModal(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-indigo-300 mb-1.5">Tipo de Solicitação</label>
                  <select
                    id="select-request-type"
                    value={selectedRequest}
                    onChange={(e) => setSelectedRequest(e.target.value as RequestType)}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {(Object.entries(REQUEST_TYPE_LABELS) as [RequestType, string][]).map(([type, label]) => (
                      <option key={type} value={type} className="bg-slate-900">{label}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-300">
                  {REQUEST_TYPE_DESCRIPTIONS[selectedRequest]}
                </div>

                <div>
                  <label className="block text-xs font-medium text-indigo-300 mb-1.5">
                    Detalhes (opcional)
                  </label>
                  <textarea
                    id="textarea-request-description"
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    placeholder="Descreva sua solicitação com mais detalhes..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                  />
                </div>

                <div className="text-xs text-indigo-400 flex gap-2">
                  <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Prazo legal de resposta: <strong className="text-indigo-200">15 dias úteis</strong>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-2.5 border border-white/15 text-white/60 hover:text-white rounded-xl text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-submit-request"
                    onClick={handleCreateRequest}
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    Enviar Solicitação
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
