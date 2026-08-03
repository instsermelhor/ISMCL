import React, { useState, useEffect, useRef } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, FileText, Download, Filter,
  Calendar, Users, Target, BookOpen, AlertCircle, CheckCircle2,
  XCircle, BarChart2, Plus, ArrowUpRight, Search, FileSpreadsheet,
  RefreshCw, ClipboardCheck, Sparkles, Brain, Check, FileDown, ShieldAlert, X,
  Building2, QrCode, Wifi, WifiOff, ExternalLink, Copy, Landmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../contexts/SecurityContext';
import {
  costCenters, financialCategories, donors, campaigns,
  agreements, transactions as initialTransactions, cashFlowSeries,
  bankStatementItems as initialStatementItems, bankIntegrations as initialBankIntegrations,
  platformProjects, INSTITUTIONAL_PIX, type Transaction, type Donor, type Campaign,
  type Agreement, type BankStatementItem, type BankIntegration, type PixDonation,
} from '../data/financial-mock';
import { generatePixPayload, generateQRDataUrl, requestCentralizedPixCharge } from '../services/pixService';
import { getPixConfig, updatePixConfig, getPixAuditLogs, type PixInstitutionalConfig, type PixAuditLog } from '../services/pixConfigService';

// ─── Helpers ───────────────────────────────────────────────
function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── localStorage helpers ───────────────────────────────────────
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveToStorage<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function Financial() {
  const { user } = useAuth();
  const { logAction } = useSecurity();

  const [tab, setTab] = useState<'cockpit' | 'transacoes' | 'doacoes' | 'convenios' | 'conciliacao' | 'bancario' | 'relatorios'>('cockpit');

  // Core Data States — inicialização híbrida (localStorage > mock seed)
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage('financial_transactions', initialTransactions));
  const [statementItems, setStatementItems] = useState<BankStatementItem[]>(() => loadFromStorage('financial_bank_statement', initialStatementItems));
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDetailsId, setActiveDetailsId] = useState<string | null>(null);

  // Módulo 08 Dynamic States
  const [donorList, setDonorList] = useState<Donor[]>(() => loadFromStorage('financial_donors', donors));
  const [campaignList, setCampaignList] = useState<Campaign[]>(() => loadFromStorage('financial_campaigns', campaigns));
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reversingTxId, setReversingTxId] = useState<string | null>(null);
  const [reversalJustification, setReversalJustification] = useState('');

  // New Donor Form State
  const [newDonorName, setNewDonorName] = useState('');
  const [newDonorEmail, setNewDonorEmail] = useState('');
  const [newDonorPhone, setNewDonorPhone] = useState('');
  const [newDonorDoc, setNewDonorDoc] = useState('');
  const [newDonorType, setNewDonorType] = useState<'INDIVIDUAL' | 'CORPORATE'>('INDIVIDUAL');
  const [newDonorIsRecurring, setNewDonorIsRecurring] = useState(false);
  const [newDonorRecAmount, setNewDonorRecAmount] = useState('');

  // New Campaign Form State
  const [newCampName, setNewCampName] = useState('');
  const [newCampDesc, setNewCampDesc] = useState('');
  const [newCampTarget, setNewCampTarget] = useState('');
  const [newCampStart, setNewCampStart] = useState('');
  const [newCampEnd, setNewCampEnd] = useState('');

  // New Transaction Form State
  const [newTxType, setNewTxType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [newTxTitle, setNewTxTitle] = useState('');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxCategory, setNewTxCategory] = useState(financialCategories[0].name);
  const [newTxProject, setNewTxProject] = useState('Escuta Ativa');
  const [newTxCostCenter, setNewTxCostCenter] = useState(costCenters[0].name);
  const [newTxDueDate, setNewTxDueDate] = useState('');
  const [newTxAnexo, setNewTxAnexo] = useState('');
  const [rateoError, setRateoError] = useState(false);

  // Conciliation States
  const [importedOfx, setImportedOfx] = useState(false);
  const [reconciledCount, setReconciledCount] = useState(0);

  // Report Form State
  const [repPeriod, setRepPeriod] = useState('Junho 2026');
  const [repCostCenter, setRepCostCenter] = useState('all');
  const [repFormat, setRepFormat] = useState('PDF');
  const [repPreview, setRepPreview] = useState(false);

  // Filters State for Transaction List
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');
  const [txStatusFilter, setTxStatusFilter] = useState<'all' | 'PENDING' | 'COMPLETED'>('all');

  // Banking Integration States
  const [bankList, setBankList] = useState<BankIntegration[]>(() => {
    try { const r = localStorage.getItem('banking_integrations_list'); return r ? JSON.parse(r) : initialBankIntegrations; } catch { return initialBankIntegrations; }
  });
  const [pixDonations, setPixDonations] = useState<PixDonation[]>(() => {
    try { const r = localStorage.getItem('financial_pix_donations'); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const [bankConnectModal, setBankConnectModal] = useState<BankIntegration | null>(null);
  const [bankClientId, setBankClientId] = useState('');
  const [bankClientSecret, setBankClientSecret] = useState('');
  const [bankPixKey, setBankPixKey] = useState('');
  const [bankEnv, setBankEnv] = useState<'sandbox' | 'production'>('sandbox');

  // PIX Generator States
  const [pixProject, setPixProject] = useState(platformProjects[0]?.id ?? '');
  const [pixAmount, setPixAmount] = useState('');
  const [pixDesc, setPixDesc] = useState('');
  const [pixQrUrl, setPixQrUrl] = useState('');
  const [pixPayloadStr, setPixPayloadStr] = useState('');
  const [pixGenerating, setPixGenerating] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  // PIX Config State (PROMPT 182)
  const [pixConfigForm, setPixConfigForm] = useState<PixInstitutionalConfig>(() => getPixConfig());
  const [pixAuditLogs, setPixAuditLogs] = useState<PixAuditLog[]>(() => getPixAuditLogs());
  const [pixConfigSavedMessage, setPixConfigSavedMessage] = useState(false);

  function handleSavePixConfig(e: React.FormEvent) {
    e.preventDefault();
    const updated = updatePixConfig(pixConfigForm, {
      id: 'usr-admin-fin',
      name: 'Diretoria Financeira',
      role: 'director',
    });
    setPixConfigForm(updated);
    setPixAuditLogs(getPixAuditLogs());
    setPixConfigSavedMessage(true);
    setTimeout(() => setPixConfigSavedMessage(false), 3000);
  }

  // Sync pix donations from localStorage (updated by public page)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const r = localStorage.getItem('financial_pix_donations');
        if (r) setPixDonations(JSON.parse(r));
        setPixAuditLogs(getPixAuditLogs());
      } catch { /* noop */ }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleConnectBank(e: React.FormEvent) {
    e.preventDefault();
    if (!bankConnectModal) return;
    const updated = bankList.map(b =>
      b.id === bankConnectModal.id
        ? { ...b, status: 'CONNECTED' as const, pixKey: bankPixKey || b.pixKey, lastSync: new Date().toISOString(), environment: bankEnv }
        : b
    );
    setBankList(updated);
    localStorage.setItem('banking_integrations_list', JSON.stringify(updated));
    setBankConnectModal(null);
    setBankClientId(''); setBankClientSecret(''); setBankPixKey('');
    alert('✅ Banco conectado em modo ' + bankEnv + '. Configure o webhook no painel do banco para notificações de pagamento em tempo real.');
  }

  function handleDisconnectBank(bankId: string) {
    const updated = bankList.map(b => b.id === bankId ? { ...b, status: 'DISCONNECTED' as const, lastSync: undefined } : b);
    setBankList(updated);
    localStorage.setItem('banking_integrations_list', JSON.stringify(updated));
  }

  function handleSyncBank(bankId: string) {
    const updated = bankList.map(b => b.id === bankId ? { ...b, lastSync: new Date().toISOString(), balance: Math.round(Math.random() * 50000 + 5000) } : b);
    setBankList(updated);
    localStorage.setItem('banking_integrations_list', JSON.stringify(updated));
    alert('✅ Extrato sincronizado. Os lançamentos foram importados para a Conciliação Bancária.');
  }

  async function handleGeneratePix(e: React.FormEvent) {
    e.preventDefault();
    const proj = platformProjects.find(p => p.id === pixProject);
    if (!proj || !pixAmount) return;
    setPixGenerating(true);
    const amount = parseFloat(pixAmount);

    try {
      const charge = await requestCentralizedPixCharge({
        amount,
        projectId: proj.id,
        projectName: proj.name,
        message: pixDesc,
      });

      setPixPayloadStr(charge.pixCopiaECola);
      setPixQrUrl(charge.qrDataUrl);

      // Save as pending donation
      const donation: PixDonation = {
        id: charge.txid,
        projectId: proj.id,
        projectName: proj.name,
        amount,
        pixPayload: charge.pixCopiaECola,
        txId: charge.txid,
        status: 'PENDING',
        createdAt: charge.createdAt,
      };
      const allDonations = [donation, ...pixDonations];
      setPixDonations(allDonations);
      localStorage.setItem('financial_pix_donations', JSON.stringify(allDonations));
    } catch (err) {
      console.error('Erro ao emitir cobrança PIX:', err);
    } finally {
      setPixGenerating(false);
    }
  }

  function handleCopyPix() {
    navigator.clipboard.writeText(pixPayloadStr).then(() => {
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2500);
    });
  }

  function handleDownloadPixQr() {
    const link = document.createElement('a');
    link.href = pixQrUrl;
    link.download = `qr-pix-${pixProject}-${Date.now()}.png`;
    link.click();
  }

  // AI Summary state
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState(true);

  // Calculate stats
  const totalIncome = transactions.filter(t => t.type === 'INCOME' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const pendingIncome = transactions.filter(t => t.type === 'INCOME' && t.status === 'PENDING').reduce((s, t) => s + t.amount, 0);
  const pendingExpense = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING').reduce((s, t) => s + t.amount, 0);

  // ─── Event Handlers ──────────────────────────────────────────
  function handleExportData() {
    const dataStr = JSON.stringify({ transactions, donorList, campaignList }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!newTxTitle || !newTxAmount || !newTxDueDate) return;

    const parsedAmount = parseFloat(newTxAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    // Check alçada rule (RN04) warning simulator
    if (newTxType === 'EXPENSE' && parsedAmount > 10000) {
      alert(`⚠️ Despesa superior a R$ 10.000,00 exige assinatura conjunta da Diretoria/Presidência para liberação.`);
    } else if (newTxType === 'EXPENSE' && parsedAmount > 1000) {
      alert(`ℹ️ Despesa exige aprovação de um Coordenador Geral ou Controladoria antes de ser efetivada.`);
    }

    const newTx: Transaction = {
      id: `t${Date.now()}`,
      type: newTxType,
      title: newTxTitle,
      amount: parsedAmount,
      status: 'PENDING',
      dueDate: newTxDueDate,
      categoryName: newTxCategory,
      projectName: newTxProject,
      costCenters: [{ name: newTxCostCenter, percentage: 100.0 }],
      documentUrl: newTxAnexo || undefined,
      createdBy: user?.name || 'Financeiro',
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveToStorage('financial_transactions', updated);
    logAction({
      userId: user?.email ?? 'sistema',
      userName: user?.name ?? 'Financeiro',
      action: 'EDIT',
      targetCode: `TX-${newTx.id}`,
      description: `[Financeiro] Nova transação criada: ${newTx.title} (${formatBRL(parsedAmount)}) — ${newTx.type}`,
      ipAddress: '—',
      device: navigator.userAgent.slice(0, 80),
    });
    setShowAddModal(false);
    setNewTxTitle('');
    setNewTxAmount('');
    setNewTxDueDate('');
    setNewTxAnexo('');
  }

  function handleQuickReconcile(statementId: string, txId: string) {
    const updatedStmt = statementItems.map(item => item.id === statementId ? { ...item, reconciled: true } : item);
    const updatedTx = transactions.map(t => t.id === txId ? { ...t, status: 'COMPLETED' as const, paymentDate: new Date().toISOString().split('T')[0] } : t);
    setStatementItems(updatedStmt);
    setTransactions(updatedTx);
    saveToStorage('financial_bank_statement', updatedStmt);
    saveToStorage('financial_transactions', updatedTx);
    setReconciledCount(c => c + 1);
    logAction({
      userId: user?.email ?? 'sistema',
      userName: user?.name ?? 'Financeiro',
      action: 'EDIT',
      targetCode: `CONC-${statementId}`,
      description: `[Financeiro] Conciliação bancária realizada. Extrato ID: ${statementId} conciliado com transação ID: ${txId}`,
      ipAddress: '—',
      device: navigator.userAgent.slice(0, 80),
    });
  }

  function handleAddDonor(e: React.FormEvent) {
    e.preventDefault();
    if (!newDonorName || !newDonorEmail) return;
    const newDonor: Donor = {
      id: `d${Date.now()}`,
      name: newDonorName,
      email: newDonorEmail,
      phone: newDonorPhone || undefined,
      document: newDonorDoc || undefined,
      type: newDonorType,
      status: 'ACTIVE',
      isRecurring: newDonorIsRecurring,
      recurringAmount: newDonorIsRecurring ? parseFloat(newDonorRecAmount) || 0 : undefined,
      joinedAt: new Date().toISOString().split('T')[0],
      totalDonated: 0,
    };
    const updated = [newDonor, ...donorList];
    setDonorList(updated);
    saveToStorage('financial_donors', updated);
    logAction({
      userId: user?.email ?? 'sistema',
      userName: user?.name ?? 'Financeiro',
      action: 'EDIT',
      targetCode: `DONOR-${newDonor.id}`,
      description: `[Financeiro] Novo doador cadastrado: ${newDonor.name} (${newDonor.type})`,
      ipAddress: '—',
      device: navigator.userAgent.slice(0, 80),
    });
    setShowAddDonorModal(false);
    setNewDonorName('');
    setNewDonorEmail('');
    setNewDonorPhone('');
    setNewDonorDoc('');
    setNewDonorIsRecurring(false);
    setNewDonorRecAmount('');
  }

  function handleAddCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!newCampName || !newCampTarget) return;
    const newCamp: Campaign = {
      id: `camp${Date.now()}`,
      name: newCampName,
      description: newCampDesc,
      targetAmount: parseFloat(newCampTarget) || 0,
      raisedAmount: 0,
      startDate: newCampStart || new Date().toISOString().split('T')[0],
      endDate: newCampEnd || new Date().toISOString().split('T')[0],
      status: 'PLANNING',
    };
    const updated = [newCamp, ...campaignList];
    setCampaignList(updated);
    saveToStorage('financial_campaigns', updated);
    setShowAddCampaignModal(false);
    setNewCampName('');
    setNewCampDesc('');
    setNewCampTarget('');
    setNewCampStart('');
    setNewCampEnd('');
  }

  function handleReverseTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!reversingTxId || !reversalJustification) return;
    const original = transactions.find(t => t.id === reversingTxId);
    if (!original) return;

    const reverseTx: Transaction = {
      id: `t-estorno-${Date.now()}`,
      type: original.type === 'INCOME' ? 'EXPENSE' : 'INCOME',
      title: `[ESTORNO] ${original.title}`,
      description: `Estorno de transação. Motivo: ${reversalJustification}`,
      amount: original.amount,
      status: 'COMPLETED',
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: new Date().toISOString().split('T')[0],
      categoryName: original.categoryName,
      projectName: original.projectName,
      costCenters: original.costCenters,
      createdBy: 'Financeiro (Estorno)',
    };

    const updatedTransactions = transactions.map(t => 
      t.id === reversingTxId ? { ...t, status: 'CANCELLED' as const } : t
    );
    const finalTx = [reverseTx, ...updatedTransactions];
    setTransactions(finalTx);
    saveToStorage('financial_transactions', finalTx);
    setShowReverseModal(false);
    setReversingTxId(null);
    setReversalJustification('');
    alert('Lançamento estornado. Transação original cancelada e lançamento de ajuste criado para auditoria (RN08).');
  }

  function handleApproveExpense(txId: string) {
    const updated = transactions.map(t => 
      t.id === txId ? { ...t, status: 'COMPLETED' as const, paymentDate: new Date().toISOString().split('T')[0] } : t
    );
    setTransactions(updated);
    saveToStorage('financial_transactions', updated);
    alert('Despesa aprovada e liberada para pagamento com sucesso (RN04).');
  }

  function handleTriggerChurn(donorId: string) {
    setDonorList(prev => prev.map(d => 
      d.id === donorId ? { ...d, status: 'INACTIVE' as const } : d
    ));
    alert('Churn simulado: Doador inativado por falha de pagamento recorrente (RN05).');
  }

  // ─── Navigation tabs ──────────────────────────────────────────
  const menuItems = [
    { id: 'cockpit', label: 'Cockpit Financeiro', icon: BarChart2 },
    { id: 'transacoes', label: 'Transações (DRE)', icon: DollarSign },
    { id: 'doacoes', label: 'Doações & Campanhas', icon: Users },
    { id: 'convenios', label: 'Convênios & Editais', icon: Target },
    { id: 'conciliacao', label: 'Conciliação Bancária', icon: ClipboardCheck },
    { id: 'bancario', label: '🏦 Bancos & PIX', icon: Landmark },
    { id: 'relatorios', label: 'Relatórios & Prestação', icon: FileSpreadsheet },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ─────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Gestão Financeira & Sustentabilidade
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">Módulo 08</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Controle de receitas, despesas, doadores, editais e prestação de contas com transparência e governança.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setTab('relatorios'); setRepPreview(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Relatório Rápido
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Lançar Movimentação
            </button>
          </div>
        </header>

        {/* ── Top Tabs ────────────────────────────────────────── */}
        <nav className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-1.5 overflow-x-auto shadow-sm">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap',
                  tab === item.id ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* ── Cockpit / BI Tab ─────────────────────────────────── */}
        {tab === 'cockpit' && (
          <div className="space-y-6">
            {/* AI Analysis Summary Bar */}
            {aiAnalysisOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3"
              >
                <Brain className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" /> Resumo Financeiro da IA
                    </p>
                    <button onClick={() => setAiAnalysisOpen(false)} className="text-xs text-indigo-400 hover:text-indigo-600 font-bold">Esconder</button>
                  </div>
                  <p className="text-xs text-indigo-800 leading-relaxed mt-1">
                    <strong>Previsão de Fluxo de Caixa:</strong> Caixa sustentável garantido para os próximos 4 meses. Pico de despesa em Julho com a folha de pagamento de voluntários adicionais de férias. 
                    <strong>Alerta de Retenção:</strong> A doadora recorrente <em>Aline Souza</em> efetuou o PIX pontualmente. A doação recorrente de <em>Sérgio Lopes</em> falhou por 2 meses seguidos, gerando alerta de churn e inativação automática.
                  </p>
                </div>
              </motion.div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-500">Saldo Líquido Realizado</h3>
                    <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatBRL(netBalance)}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" /> +12.5%
                    </span>
                    <span>no período consolidado</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-500">Total Captado (Receitas)</h3>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatBRL(totalIncome)}</p>
                  <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                    <span>Previsto: {formatBRL(totalIncome + pendingIncome)}</span>
                    <span className="font-medium text-blue-600">{donorList.filter(d => d.status === 'ACTIVE').length} doadores ativos</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-500">Despesas Consolidadas</h3>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatBRL(totalExpense)}</p>
                  <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                    <span>A pagar: {formatBRL(pendingExpense)}</span>
                    <span className="text-emerald-600 font-semibold">Sob controle de custo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Flow Forecast (Visual CSS Bars) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Fluxo de Caixa Mensal</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Comparativo Previsto vs. Realizado 2026</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> Receita Real</div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-400" /> Receita Prev</div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Despesa Real</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {cashFlowSeries.map((m, i) => {
                    const maxVal = Math.max(...cashFlowSeries.map(x => Math.max(x.receitaReal, x.receitaPrev, x.despesaReal, x.despesaPrev)));
                    return (
                      <div key={m.mes} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 w-16">{m.mes}</span>
                        <div className="flex-1 flex flex-col gap-1.5">
                          {/* Receita bar */}
                          <div className="flex items-center gap-1">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(m.receitaReal / maxVal) * 100}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-2 bg-teal-500 rounded-full"
                            />
                            {m.receitaReal > 0 && <span className="text-[10px] text-teal-600 font-bold">{Math.round(m.receitaReal / 1000)}k</span>}
                          </div>
                          {/* Despesa bar */}
                          <div className="flex items-center gap-1">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(m.despesaReal / maxVal) * 100}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                              className="h-2 bg-rose-400 rounded-full"
                            />
                            {m.despesaReal > 0 && <span className="text-[10px] text-rose-600 font-bold">{Math.round(m.despesaReal / 1000)}k</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Centro de Custo Allocation */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Rateio por Centro de Custo</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Divisão proporcional das despesas no período</p>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Projeto Escuta Ativa', percentage: 40, amount: totalExpense * 0.40, color: 'bg-teal-500' },
                    { name: 'Projeto Lar Protegido', percentage: 30, amount: totalExpense * 0.30, color: 'bg-blue-500' },
                    { name: 'Administração Central', percentage: 20, amount: totalExpense * 0.20, color: 'bg-indigo-500' },
                    { name: 'Campanha de Inverno 2026', percentage: 10, amount: totalExpense * 0.10, color: 'bg-rose-500' },
                  ].map(cc => (
                    <div key={cc.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{cc.name}</span>
                        <span className="text-slate-500 font-bold">{cc.percentage}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', cc.color)} style={{ width: `${cc.percentage}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 text-right">{formatBRL(cc.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Transações Tab ───────────────────────────────────── */}
        {tab === 'transacoes' && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  placeholder="Buscar transação por título ou descrição..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 shadow-sm outline-none"
                />
              </div>
              <select
                value={txTypeFilter}
                onChange={e => setTxTypeFilter(e.target.value as any)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm"
              >
                <option value="all">Todas as transações</option>
                <option value="INCOME">Receitas (Entradas)</option>
                <option value="EXPENSE">Despesas (Saídas)</option>
              </select>
              <select
                value={txStatusFilter}
                onChange={e => setTxStatusFilter(e.target.value as any)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm"
              >
                <option value="all">Todos os status</option>
                <option value="COMPLETED">Efetivadas</option>
                <option value="PENDING">Pendentes</option>
              </select>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Listagem Geral
                </span>
                <span className="text-xs text-slate-400">Clique para ver o rateio de custos</span>
              </div>
              <div className="divide-y divide-slate-100">
                {transactions
                  .filter(tx => {
                    const matchQ = tx.title.toLowerCase().includes(txSearch.toLowerCase()) || (tx.description && tx.description.toLowerCase().includes(txSearch.toLowerCase()));
                    const matchT = txTypeFilter === 'all' || tx.type === txTypeFilter;
                    const matchS = txStatusFilter === 'all' || tx.status === txStatusFilter;
                    return matchQ && matchT && matchS;
                  })
                  .map(tx => {
                    const isExp = tx.type === 'EXPENSE';
                    const isCompleted = tx.status === 'COMPLETED';
                    const detailOpen = activeDetailsId === tx.id;

                    return (
                      <React.Fragment key={tx.id}>
                        <div
                          onClick={() => setActiveDetailsId(detailOpen ? null : tx.id)}
                          className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                              isExp ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                              {isExp ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{tx.title}</h4>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-500">{tx.categoryName}</span>
                                <span>·</span>
                                <span>Venc: {formatDate(tx.dueDate)}</span>
                                {tx.paymentDate && (
                                  <>
                                    <span>·</span>
                                    <span className="text-emerald-600">Pg: {formatDate(tx.paymentDate)}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={cn("text-sm font-bold", isExp ? "text-slate-800" : "text-emerald-600")}>
                                {isExp ? '-' : '+'} {formatBRL(tx.amount)}
                              </p>
                              <span className={cn(
                                "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 border",
                                isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                              )}>
                                {isCompleted ? 'Efetivada' : 'Pendente'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Rateio and details */}
                        {detailOpen && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="px-5 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <p className="text-slate-400">Criado por</p>
                                <p className="font-semibold text-slate-700 mt-0.5">{tx.createdBy}</p>
                              </div>
                              {tx.donorName && (
                                <div>
                                  <p className="text-slate-400">Doador</p>
                                  <p className="font-semibold text-slate-700 mt-0.5">{tx.donorName}</p>
                                </div>
                              )}
                              {tx.campaignName && (
                                <div>
                                  <p className="text-slate-400">Campanha</p>
                                  <p className="font-semibold text-slate-700 mt-0.5">{tx.campaignName}</p>
                                </div>
                              )}
                              {tx.agreementName && (
                                <div className="col-span-2 sm:col-span-1">
                                  <p className="text-slate-400">Convênio</p>
                                  <p className="font-semibold text-slate-700 mt-0.5">{tx.agreementName}</p>
                                </div>
                              )}
                              {tx.documentUrl && (
                                <div>
                                  <p className="text-slate-400">Anexo Fiscal</p>
                                  <button onClick={() => alert(`Simulando download do arquivo: ${tx.documentUrl}`)}
                                    className="flex items-center gap-1 text-teal-600 font-semibold hover:underline mt-0.5">
                                    <FileText className="w-3.5 h-3.5" /> Ver Nota
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Rateio grid */}
                            <div className="pt-2 border-t border-slate-200">
                              <p className="text-slate-400 font-semibold mb-2">Rateio por Centros de Custo:</p>
                              <div className="flex gap-3 flex-wrap">
                                {tx.costCenters.map(cc => (
                                  <span key={cc.name} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">
                                    {cc.name}: <strong className="text-teal-600">{cc.percentage}%</strong> ({formatBRL(tx.amount * cc.percentage / 100)})
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Governança e Ações de Auditoria */}
                            <div className="pt-3 border-t border-slate-200 flex gap-3">
                              {tx.status === 'PENDING' && tx.type === 'EXPENSE' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleApproveExpense(tx.id); }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" /> Aprovar e Liquidar (RN04)
                                </button>
                              )}
                              {tx.status === 'COMPLETED' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setReversingTxId(tx.id); setShowReverseModal(true); }}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" /> Estornar Lançamento (RN08)
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </React.Fragment>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ── Doações & Campanhas Tab ─────────────────────────── */}
        {tab === 'doacoes' && (
          <div className="space-y-6">
            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Doadores list */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Doadores Cadastrados</h3>
                  <button onClick={() => setShowAddDonorModal(true)} className="text-xs text-teal-600 font-semibold hover:underline">+ Cadastrar Doador</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {donorList.map(d => {
                    const isActive = d.status === 'ACTIVE';
                    return (
                      <div key={d.id} className="py-3.5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{d.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {d.type === 'CORPORATE' ? 'Pessoa Jurídica' : 'Pessoa Física'} · {d.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Total doado: <strong>{formatBRL(d.totalDonated)}</strong></p>
                          <div className="flex flex-col items-end gap-1">
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 border",
                              isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                            )}>
                              {isActive ? 'Ativo' : 'Inativo / Churn'}
                            </span>
                            {isActive && d.isRecurring && (
                              <button
                                onClick={() => handleTriggerChurn(d.id)}
                                className="text-[10px] text-rose-500 hover:text-rose-700 hover:underline font-medium mt-1"
                              >
                                Simular Churn (RN05)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Campanhas list */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Campanhas Institucionais</h3>
                  <button onClick={() => setShowAddCampaignModal(true)} className="text-xs text-teal-600 font-semibold hover:underline">+ Nova Campanha</button>
                </div>
                <div className="space-y-4">
                  {campaignList.map(camp => {
                    const pct = Math.round((camp.raisedAmount / camp.targetAmount) * 100);
                    return (
                      <div key={camp.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{camp.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{camp.description}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-700">
                            {camp.status}
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Meta: {formatBRL(camp.targetAmount)}</span>
                            <span className="font-bold text-slate-700">{formatBRL(camp.raisedAmount)} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-600 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Convênios & Editais Tab ─────────────────────────── */}
        {tab === 'convenios' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agreements Overview */}
              <div className="lg:col-span-2 space-y-4">
                {agreements.map(ag => (
                  <div key={ag.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{ag.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Financiador: <strong>{ag.grantor}</strong> · Código: {ag.code}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-100 text-teal-700 border border-teal-200">
                        {ag.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-3 text-xs">
                      <div>
                        <p className="text-slate-400">Valor Aprovado</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{formatBRL(ag.approvedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Data de Início</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatDate(ag.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Vencimento</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatDate(ag.endDate)}</p>
                      </div>
                    </div>

                    {/* Obligations/Chronogram timeline */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cronograma de Obrigações</p>
                      <div className="divide-y divide-slate-50 pl-4 border-l-2 border-slate-200">
                        {ag.obligations.map(ob => {
                          const isOverdue = ob.status === 'OVERDUE';
                          const isApproved = ob.status === 'APPROVED';
                          return (
                            <div key={ob.id} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-semibold text-slate-800">{ob.title}</p>
                                <p className="text-slate-400">Prazo: {formatDate(ob.dueDate)}</p>
                              </div>
                              <span className={cn(
                                "px-2 py-0.5 rounded font-medium",
                                isApproved ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                isOverdue ? "bg-red-50 text-red-700 border border-red-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                              )}>
                                {ob.status === 'APPROVED' ? 'Aprovado' : ob.status === 'SUBMITTED' ? 'Enviado' : isOverdue ? 'Atrasado' : 'Pendente'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Obligations sidebar alerts */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-800">Alertas de Obrigações</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <p className="font-bold">Repasse Pendente</p>
                    <p className="mt-0.5">O repasse de CMDCA Q2 de R$ 20.000,00 foi compensado com 2 dias de atraso pelo órgão público.</p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                    <p className="font-bold">Prestação de Contas Final</p>
                    <p className="mt-0.5">Prazo de prestação final da Fundação Itaú em 15 dias. Envie o balancete Q3.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Conciliação Bancária Tab ─────────────────────────── */}
        {tab === 'conciliacao' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Conciliação de Extratos Bancários</h3>
                <p className="text-xs text-slate-400 mt-0.5">Faça o upload do extrato de transações (.ofx) e cruze com os registros do sistema.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImportedOfx(true)}
                  disabled={importedOfx}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Importar Arquivo OFX
                </button>
                {importedOfx && (
                  <button onClick={() => { setImportedOfx(false); setReconciledCount(0); }} className="text-xs text-red-500 font-semibold hover:underline">
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {importedOfx ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bank Statement lines */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lançamentos do Extrato</h4>
                  <div className="space-y-3">
                    {statementItems.map(item => {
                      // Suggestion engine matching logic
                      const match = transactions.find(t => t.amount === item.amount && t.status === 'PENDING');
                      return (
                        <div key={item.id} className={cn(
                          "p-4 rounded-xl border flex items-start justify-between gap-3 transition-colors",
                          item.reconciled ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                        )}>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.description}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Data: {formatDate(item.date)} · Ref: {item.id}</p>
                            {match && !item.reconciled && (
                              <div className="mt-2.5 p-2 bg-white border border-teal-100 rounded-lg flex items-center justify-between gap-2">
                                <span className="text-[10px] text-teal-600 font-semibold">Correspondência sugerida: {match.title}</span>
                                <button
                                  onClick={() => handleQuickReconcile(item.id, match.id)}
                                  className="px-2 py-0.5 bg-teal-600 text-white text-[10px] font-bold rounded hover:bg-teal-500"
                                >
                                  Conciliar
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className={cn("text-xs font-bold", item.type === 'CREDIT' ? "text-emerald-600" : "text-rose-600")}>
                              {item.type === 'CREDIT' ? '+' : '-'} {formatBRL(item.amount)}
                            </span>
                            <div className="mt-1">
                              {item.reconciled ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                                  <Check className="w-3 h-3" /> Conciliado
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Pendente</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status summary */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 self-start">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumo da Importação</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-400">Lançamentos Importados</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{statementItems.length}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
                      <p className="text-xs text-emerald-600">Conciliados</p>
                      <p className="text-xl font-bold mt-1">{reconciledCount}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <p className="font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Pendências Encontradas</p>
                    <p className="mt-1">Existem 2 lançamentos no extrato sem transações correspondentes no sistema (ex: tarifas bancárias). Cadastre para poder conciliar.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <ClipboardCheck className="w-16 h-16 opacity-30" />
                <p className="text-sm">Nenhum arquivo de extrato importado.</p>
                <button
                  onClick={() => setImportedOfx(true)}
                  className="text-xs text-teal-600 hover:underline font-semibold"
                >
                  Importar extrato de demonstração
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Integrações Bancárias & PIX Tab ─────────────────────── */}
        {tab === 'bancario' && (
          <div className="space-y-6">

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white border border-indigo-700/30">
              <div className="flex items-center gap-3 mb-2">
                <Landmark className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-bold">Integrações Bancárias & PIX</h2>
              </div>
              <p className="text-indigo-300 text-sm">Gerencie contas bancárias conectadas, gere cobranças PIX e acompanhe doações recebidas. Preparado para integração real com APIs dos principais bancos nacionais e internacionais.</p>
              <div className="flex gap-6 mt-4 pt-4 border-t border-indigo-700/30">
                {[
                  { label: 'Bancos Conectados', val: bankList.filter(b => b.status === 'CONNECTED').length },
                  { label: 'Doações PIX Pendentes', val: pixDonations.filter(d => d.status === 'PENDING').length },
                  { label: 'Total Recebido via PIX', val: 'R$ ' + pixDonations.filter(d => d.status !== 'EXPIRED').reduce((s, d) => s + d.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold text-white">{s.val}</div>
                    <div className="text-indigo-400 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* ─── Painel de Bancos ─────────────────────── */}
              <div className="xl:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-600" />Contas & Bancos Integrados</h3>
                <div className="space-y-3">
                  {bankList.map(bank => (
                    <div key={bank.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-3xl w-10 text-center">{bank.bankLogo}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-900 text-sm">{bank.bankName}</span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                            bank.status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-700' :
                            bank.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            bank.status === 'ERROR' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-500'
                          )}>
                            {bank.status === 'CONNECTED' ? '● Conectado' : bank.status === 'PENDING' ? '● Pendente' : bank.status === 'ERROR' ? '● Erro' : '○ Desconectado'}
                          </span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full',
                            bank.countryCode === 'BR' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                          )}>{bank.countryCode === 'BR' ? '🇧🇷 BR' : bank.countryCode === 'US' ? '🇺🇸 US' : '🌍 INT'}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex gap-3 flex-wrap">
                          <span>{bank.type === 'PIX' ? '⚡ PIX' : bank.type === 'OPEN_BANKING' ? '🔗 Open Banking' : bank.type === 'GATEWAY' ? '💳 Gateway' : '🌐 Internacional'}</span>
                          {bank.status === 'CONNECTED' && bank.balance !== undefined && <span className="text-emerald-600 font-semibold">Saldo: {bank.currency === 'BRL' ? 'R$' : bank.currency === 'USD' ? 'US$' : '€'} {bank.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                          {bank.lastSync && <span>Sync: {new Date(bank.lastSync).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                          {bank.pixKey && <span>Chave PIX: <code className="bg-slate-100 px-1 rounded">{bank.pixKey}</code></span>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {bank.status === 'CONNECTED' ? (
                          <>
                            <button onClick={() => handleSyncBank(bank.id)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
                              <RefreshCw className="w-3.5 h-3.5" />Sincronizar
                            </button>
                            <button onClick={() => handleDisconnectBank(bank.id)} className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl hover:bg-rose-100 transition-colors">
                              <WifiOff className="w-3.5 h-3.5" />Desconectar
                            </button>
                          </>
                        ) : (
                          <button onClick={() => { setBankConnectModal(bank); setBankPixKey(bank.pixKey || ''); }} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-500 transition-colors">
                            <Wifi className="w-3.5 h-3.5" />Conectar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Histório de Doações PIX */}
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pt-2"><QrCode className="w-4 h-4 text-indigo-600" />Doações via PIX Recebidas</h3>
                {pixDonations.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm">Nenhuma doação via PIX registrada ainda. Gere um QR Code ou compartilhe a página pública <a href="/doe" target="_blank" className="text-indigo-600 font-semibold hover:underline">/doe</a>.</div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Programa</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Doador</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Valor</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pixDonations.slice(0, 20).map(d => (
                          <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900 text-xs">{d.projectName}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{d.donorName || '—'}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600 text-sm">R$ {d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                                d.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                                d.status === 'EXPIRED' ? 'bg-slate-100 text-slate-500' :
                                'bg-amber-100 text-amber-700'
                              )}>{d.status === 'CONFIRMED' ? '✅ Confirmado' : d.status === 'EXPIRED' ? 'Expirado' : '⏳ Pendente'}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{new Date(d.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ─── Painel Gerador de PIX ─────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><QrCode className="w-4 h-4 text-indigo-600" />Emissão de Cobrança — Chave PIX</h3>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <form onSubmit={handleGeneratePix} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Programa / Projeto destino *</label>
                      <select value={pixProject} onChange={e => setPixProject(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                        {platformProjects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Valor (R$) *</label>
                      <input type="number" min="1" step="0.01" value={pixAmount} onChange={e => setPixAmount(e.target.value)} placeholder="Ex: 50.00" required
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Descrição (opcional)</label>
                      <input type="text" value={pixDesc} onChange={e => setPixDesc(e.target.value)} placeholder="Ex: Doação campanha inverno"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <button type="submit" disabled={pixGenerating || !pixAmount}
                      className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      <QrCode className="w-4 h-4" />{pixGenerating ? 'Processando...' : '🔑 Chave PIX — Emitir Cobrança'}
                    </button>
                  </form>

                  {pixQrUrl && (
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <div className="flex justify-center">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <img src={pixQrUrl} alt="QR PIX" style={{ width: 180, height: 180, display: 'block' }} />
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <div className="text-xs font-semibold text-slate-500 mb-1">PIX Copia e Cola</div>
                        <div className="text-xs text-indigo-600 font-mono break-all leading-relaxed select-all">{pixPayloadStr}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleCopyPix}
                          className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all',
                            pixCopied ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          )}>
                          <Copy className="w-3.5 h-3.5" />{pixCopied ? 'Copiado!' : 'Copiar'}
                        </button>
                        <button onClick={handleDownloadPixQr}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                          <Download className="w-3.5 h-3.5" />Baixar QR
                        </button>
                      </div>
                      <a href="/doe" target="_blank"
                        className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />Abrir Painel Público de Doações
                      </a>
                    </div>
                  )}
                </div>

                {/* Link para página pública */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                  <div className="text-sm font-bold text-indigo-900 mb-1">🌐 Página Pública de Doações</div>
                  <p className="text-xs text-indigo-700 leading-relaxed mb-3">Compartilhe o link <strong>/doe</strong> para que doadores possam escolher um programa e pagar diretamente via PIX, sem necessidade de login.</p>
                  <a href="/doe" target="_blank" className="flex items-center gap-2 w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-colors justify-center">
                    <ExternalLink className="w-4 h-4" />Acessar /doe
                  </a>
                </div>
              </div>
            </div>

            {/* ─── Configuração Financeira PIX & API Banco Cora SCD (PROMPT 182) ─── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Configuração Financeira PIX — Banco Cora SCD</h3>
                    <p className="text-xs text-slate-500">Módulo exclusivo de governança de arrecadação, credenciais bancárias e conciliação (PROMPT 182).</p>
                  </div>
                </div>
                {pixConfigSavedMessage && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-fade-in">
                    ✓ Configuração salva e auditada com sucesso!
                  </span>
                )}
              </div>

              <form onSubmit={handleSavePixConfig} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Razão Social Oficial *</label>
                  <input type="text" required value={pixConfigForm.razaoSocial} onChange={e => setPixConfigForm({ ...pixConfigForm, razaoSocial: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">CNPJ Institucional / Chave PIX *</label>
                  <input type="text" required value={pixConfigForm.cnpj} onChange={e => setPixConfigForm({ ...pixConfigForm, cnpj: e.target.value, pixKey: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Banco Institucional *</label>
                  <input type="text" required value={pixConfigForm.bankName} onChange={e => setPixConfigForm({ ...pixConfigForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Agência / Conta *</label>
                  <div className="flex gap-2">
                    <input type="text" required value={pixConfigForm.agency} onChange={e => setPixConfigForm({ ...pixConfigForm, agency: e.target.value })} placeholder="Agência"
                      className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                    <input type="text" required value={pixConfigForm.accountNumber} onChange={e => setPixConfigForm({ ...pixConfigForm, accountNumber: e.target.value })} placeholder="Conta"
                      className="w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ambiente da API Cora *</label>
                  <select value={pixConfigForm.environment} onChange={e => setPixConfigForm({ ...pixConfigForm, environment: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="production">🚀 Produção (API Cora Oficial)</option>
                    <option value="sandbox">🧪 Sandbox (Homologação BACEN)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Expiração da Cobrança (Segundos) *</label>
                  <input type="number" required min="60" value={pixConfigForm.defaultExpirationSeconds} onChange={e => setPixConfigForm({ ...pixConfigForm, defaultExpirationSeconds: parseInt(e.target.value, 10) || 3600 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Client ID (API Cora)</label>
                  <input type="text" value={pixConfigForm.clientId} onChange={e => setPixConfigForm({ ...pixConfigForm, clientId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Webhook Endpoint URL</label>
                  <input type="text" value={pixConfigForm.webhookUrl} onChange={e => setPixConfigForm({ ...pixConfigForm, webhookUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" /> Salvar Configuração & Notificar CISO
                  </button>
                </div>
              </form>
            </div>

            {/* ─── Trilha Imutável de Auditoria PIX (PROMPT 182) ─── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-indigo-600" /> Trilha Imutável de Auditoria Financeira PIX
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {pixAuditLogs.length} Registros Auditados
                </span>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Horário</th>
                      <th className="py-2.5 px-3">Evento</th>
                      <th className="py-2.5 px-3">Severidade</th>
                      <th className="py-2.5 px-3">Usuário</th>
                      <th className="py-2.5 px-3">TxID / Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {pixAuditLogs.slice(0, 15).map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{log.eventType}</td>
                        <td className="py-2 px-3">
                          <span className={cn('px-2 py-0.5 rounded-full font-sans text-[10px] font-bold',
                            log.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                            log.severity === 'WARN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          )}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-sans">{log.userName ?? 'Sistema'}</td>
                        <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{log.txId ? `[TxID: ${log.txId}] ` : ''}{JSON.stringify(log.details)}</td>
                      </tr>
                    ))}
                    {pixAuditLogs.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-center text-slate-400 font-sans">Nenhum evento de auditoria PIX registrado ainda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bank Connect Modal */}
            <AnimatePresence>
              {bankConnectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setBankConnectModal(null)}>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                      <span className="text-2xl">{bankConnectModal.bankLogo}</span>
                      <div>
                        <h3 className="font-bold text-slate-900">Conectar {bankConnectModal.bankName}</h3>
                        <p className="text-xs text-slate-500">Configure as credenciais OAuth2 da API do banco</p>
                      </div>
                      <button onClick={() => setBankConnectModal(null)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
                    </div>
                    <form onSubmit={handleConnectBank} className="px-6 py-5 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Client ID (API) *</label>
                        <input type="text" required value={bankClientId} onChange={e => setBankClientId(e.target.value)} placeholder="Obtido no painel do banco"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Client Secret *</label>
                        <input type="password" required value={bankClientSecret} onChange={e => setBankClientSecret(e.target.value)} placeholder="••••••••••••"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      {bankConnectModal.type === 'PIX' && (
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Chave PIX do beneficiário</label>
                          <input type="text" value={bankPixKey} onChange={e => setBankPixKey(e.target.value)} placeholder="CNPJ, email, celular ou aleatória"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Ambiente</label>
                        <select value={bankEnv} onChange={e => setBankEnv(e.target.value as 'sandbox' | 'production')}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                          <option value="sandbox">🧪 Sandbox (Homologação)</option>
                          <option value="production">🚀 Produção</option>
                        </select>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs text-amber-800 leading-relaxed">
                          ⚠️ As credenciais são armazenadas localmente neste dispositivo. Em produção, use um backend seguro com variáveis de ambiente para não expor o Client Secret.
                        </p>
                      </div>
                      <div className="flex gap-3 pt-2 border-t border-slate-100">
                        <button type="button" onClick={() => setBankConnectModal(null)}
                          className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancelar</button>
                        <button type="submit"
                          className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500">Conectar Banco</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* ── Relatórios & Prestação de Contas Tab ────────────────── */}
        {tab === 'relatorios' && (
          <div className="space-y-6">
            {/* Parameter selection */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Exportador de Relatório Financeiro</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Período</label>
                  <select value={repPeriod} onChange={e => setRepPeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none">
                    <option value="Junho 2026">Junho 2026</option>
                    <option value="1º Semestre 2026">1º Semestre 2026</option>
                    <option value="Ano 2025">Ano 2025</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Centro de Custo</label>
                  <select value={repCostCenter} onChange={e => setRepCostCenter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none">
                    <option value="all">Todos os centros de custo</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.name}>{cc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Formato de Saída</label>
                  <select value={repFormat} onChange={e => setRepFormat(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none">
                    <option value="PDF">PDF Assinado Digitalmente</option>
                    <option value="Excel">Planilha Excel (.xlsx)</option>
                    <option value="CSV">Valores Separados por Vírgula (.csv)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setRepPreview(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-500"
                >
                  <FileDown className="w-3.5 h-3.5" /> Gerar Relatório
                </button>
                {repPreview && (
                  <button
                    onClick={() => {
                      alert(`Exportando em formato ${repFormat} para download.`);
                      setRepPreview(false);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"
                  >
                    Download ({repFormat})
                  </button>
                )}
              </div>
            </div>

            {/* Generated preview */}
            {repPreview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Demonstrativo Financeiro</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Instituto Ser Melhor · Referência: {repPeriod}</p>
                    <p className="text-xs text-slate-400">Centro de Custo: {repCostCenter === 'all' ? 'Todos' : repCostCenter}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    Gerado com Sucesso
                  </span>
                </div>

                {/* Balancete preview table */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
                    <span>Categoria</span>
                    <span className="text-right">Valor Consolidado</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { cat: 'Receitas de Doações', val: totalIncome * 0.4 },
                      { cat: 'Repasses e Editais', val: totalIncome * 0.6 },
                      { cat: '(-) Despesas de Pessoal', val: -12500 },
                      { cat: '(-) Despesas Operacionais', val: -3550 },
                      { cat: '(-) Aluguel e Sede', val: -3200 },
                    ].map((row, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="text-slate-700 font-medium">{row.cat}</span>
                        <span className={cn("font-bold", row.val < 0 ? "text-slate-800" : "text-emerald-600")}>
                          {formatBRL(row.val)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-sm font-bold text-slate-900">
                    <span>Resultado do Exercício</span>
                    <span className="text-teal-600">{formatBRL(netBalance)}</span>
                  </div>
                </div>

                {/* Audit and sign */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-400 space-y-1">
                  <p><strong>Hash de Auditoria:</strong> 7c9f8a2e1d03b4a5f6e7c8b9a1b2c3d4e5f6a7b8c9d0</p>
                  <p>Documento imutável assinado digitalmente por <em>Financeiro — Instituto Ser Melhor</em> às {new Date().toLocaleString()}</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

      </div>

      {/* ─── ADD TRANSACTION MODAL ─────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900">Nova Movimentação Financeira</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddTransaction} className="px-6 py-5 space-y-4 overflow-y-auto max-h-[75vh]">
                {/* Type toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewTxType('INCOME')}
                    className={cn('flex-1 py-2 text-xs font-semibold rounded-lg transition-all', newTxType === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500')}
                  >
                    Receita (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTxType('EXPENSE')}
                    className={cn('flex-1 py-2 text-xs font-semibold rounded-lg transition-all', newTxType === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500')}
                  >
                    Despesa (Saída)
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Título do Lançamento *</label>
                  <input
                    type="text"
                    required
                    value={newTxTitle}
                    onChange={e => setNewTxTitle(e.target.value)}
                    placeholder="Ex: Aquisição de Cadeiras Escritório"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newTxAmount}
                      onChange={e => setNewTxAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Vencimento *</label>
                    <input
                      type="date"
                      required
                      value={newTxDueDate}
                      onChange={e => setNewTxDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Categoria</label>
                    <select
                      value={newTxCategory}
                      onChange={e => setNewTxCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-700"
                    >
                      {financialCategories
                        .filter(c => c.type === (newTxType === 'INCOME' ? 'INCOME' : 'EXPENSE'))
                        .map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Centro de Custo Principal</label>
                    <select
                      value={newTxCostCenter}
                      onChange={e => setNewTxCostCenter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-700"
                    >
                      {costCenters.map(cc => (
                        <option key={cc.id} value={cc.name}>{cc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Anexo Fiscal / Comprovante (opcional)</label>
                  <input
                    type="text"
                    value={newTxAnexo}
                    onChange={e => setNewTxAnexo(e.target.value)}
                    placeholder="Ex: nota_fiscal_cadeiras.pdf"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-500 shadow-md"
                  >
                    Lançar Transação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ─── ADD DONOR MODAL ─────────────────────────── */}
        {showAddDonorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddDonorModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900">Novo Doador</h3>
                </div>
                <button onClick={() => setShowAddDonorModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddDonor} className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome Completo / Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={newDonorName}
                    onChange={e => setNewDonorName(e.target.value)}
                    placeholder="Ex: Maria José da Silva"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">E-mail *</label>
                    <input
                      type="email"
                      required
                      value={newDonorEmail}
                      onChange={e => setNewDonorEmail(e.target.value)}
                      placeholder="maria@exemplo.com"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">CPF / CNPJ</label>
                    <input
                      type="text"
                      value={newDonorDoc}
                      onChange={e => setNewDonorDoc(e.target.value)}
                      placeholder="***.***.***-**"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Telefone</label>
                    <input
                      type="text"
                      value={newDonorPhone}
                      onChange={e => setNewDonorPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Tipo de Doador</label>
                    <select
                      value={newDonorType}
                      onChange={e => setNewDonorType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-700"
                    >
                      <option value="INDIVIDUAL">Pessoa Física</option>
                      <option value="CORPORATE">Pessoa Jurídica</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Doador Recorrente?</label>
                    <input
                      type="checkbox"
                      checked={newDonorIsRecurring}
                      onChange={e => setNewDonorIsRecurring(e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                    />
                  </div>
                  {newDonorIsRecurring && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Valor Recorrente Mensal (R$)</label>
                      <input
                        type="number"
                        value={newDonorRecAmount}
                        onChange={e => setNewDonorRecAmount(e.target.value)}
                        placeholder="100,00"
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddDonorModal(false)}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-500 shadow-md"
                  >
                    Cadastrar Doador
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ─── ADD CAMPAIGN MODAL ─────────────────────────── */}
        {showAddCampaignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddCampaignModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900">Nova Campanha Institucional</h3>
                </div>
                <button onClick={() => setShowAddCampaignModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddCampaign} className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome da Campanha *</label>
                  <input
                    type="text"
                    required
                    value={newCampName}
                    onChange={e => setNewCampName(e.target.value)}
                    placeholder="Ex: Campanha de Natal 2026"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Descrição da Campanha</label>
                  <textarea
                    value={newCampDesc}
                    onChange={e => setNewCampDesc(e.target.value)}
                    placeholder="Objetivos, público-alvo e canais de divulgação..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Meta Financeira (R$) *</label>
                  <input
                    type="number"
                    required
                    value={newCampTarget}
                    onChange={e => setNewCampTarget(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Data de Início</label>
                    <input
                      type="date"
                      value={newCampStart}
                      onChange={e => setNewCampStart(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Data de Fim</label>
                    <input
                      type="date"
                      value={newCampEnd}
                      onChange={e => setNewCampEnd(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-700"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCampaignModal(false)}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-500 shadow-md"
                  >
                    Criar Campanha
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ─── REVERSE TRANSACTION (ESTORNO) MODAL ─────────────────────────── */}
        {showReverseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowReverseModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900">Estornar Lançamento (RN08)</h3>
                </div>
                <button onClick={() => setShowReverseModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleReverseTransaction} className="px-6 py-5 space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed">
                  <strong>Atenção:</strong> De acordo com as boas práticas de governança e integridade fiscal, lançamentos efetivados não podem ser deletados. O estorno criará uma contra-partida exata de ajuste e cancelará a transação original para auditoria imutável.
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Justificativa do Estorno *</label>
                  <textarea
                    required
                    value={reversalJustification}
                    onChange={e => setReversalJustification(e.target.value)}
                    placeholder="Descreva o motivo do estorno do lançamento..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none min-h-[100px]"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReverseModal(false)}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-500 shadow-md"
                  >
                    Confirmar Estorno
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
