// ============================================================
// MOCK DATA — GESTÃO FINANCEIRA E CAPTAÇÃO DE RECURSOS (GFCR)
// Instituto Ser Melhor — Projeto Aura
// ============================================================

export type FinancialType = 'INCOME' | 'EXPENSE' | 'INVESTMENT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

// ─── CENTROS DE CUSTO ────────────────────────────────────────
export interface CostCenter {
  id: string;
  name: string;
  code: string;
  type: 'PROJECT' | 'PROGRAM' | 'DEPARTMENT' | 'CAMPAIGN' | 'CONVENIO' | 'UNIT';
  status: 'ACTIVE' | 'INACTIVE';
}

export const costCenters: CostCenter[] = [
  { id: 'cc1', name: 'Projeto Escuta Ativa', code: 'CC-101', type: 'PROJECT', status: 'ACTIVE' },
  { id: 'cc2', name: 'Projeto Lar Protegido', code: 'CC-102', type: 'PROJECT', status: 'ACTIVE' },
  { id: 'cc3', name: 'Projeto Envelhecer Bem', code: 'CC-103', type: 'PROJECT', status: 'ACTIVE' },
  { id: 'cc4', name: 'Projeto Cuidar+', code: 'CC-104', type: 'PROJECT', status: 'ACTIVE' },
  { id: 'cc5', name: 'Administração Central', code: 'CC-901', type: 'DEPARTMENT', status: 'ACTIVE' },
  { id: 'cc6', name: 'Campanha de Inverno 2026', code: 'CC-501', type: 'CAMPAIGN', status: 'ACTIVE' },
  { id: 'cc7', name: 'Convênio Municipal CMDCA', code: 'CC-701', type: 'CONVENIO', status: 'ACTIVE' },
];

// ─── PLANO DE CONTAS (CATEGORIAS FINANCEIRAS) ───────────────
export interface FinancialCategory {
  id: string;
  name: string;
  type: FinancialType;
  parentName?: string;
}

export const financialCategories: FinancialCategory[] = [
  // Receitas
  { id: 'cat1', name: 'Doações Pessoa Física (PF)', type: 'INCOME' },
  { id: 'cat2', name: 'Patrocínios Corporativos (PJ)', type: 'INCOME' },
  { id: 'cat3', name: 'Repasses Governamentais / Convênios', type: 'INCOME' },
  { id: 'cat4', name: 'Editais e Fundações', type: 'INCOME' },
  { id: 'cat5', name: 'Receitas de Eventos Beneficentes', type: 'INCOME' },
  // Despesas
  { id: 'cat6', name: 'Folha de Pagamento', type: 'EXPENSE' },
  { id: 'cat7', name: 'Serviços de Terceiros / Autônomos', type: 'EXPENSE' },
  { id: 'cat8', name: 'Aluguel e IPTU', type: 'EXPENSE' },
  { id: 'cat9', name: 'Serviços de Utilidade (Água/Luz/Tel)', type: 'EXPENSE' },
  { id: 'cat10', name: 'Materiais de Consumo e Escritório', type: 'EXPENSE' },
  { id: 'cat11', name: 'Tecnologia & Software (SaaS)', type: 'EXPENSE' },
  { id: 'cat12', name: 'Tributos e Encargos', type: 'EXPENSE' },
  // Investimentos
  { id: 'cat13', name: 'Reforma de Instalações', type: 'INVESTMENT' },
  { id: 'cat14', name: 'Aquisição de Equipamentos e TI', type: 'INVESTMENT' },
];

// ─── DOADORES ───────────────────────────────────────────────
export interface Donor {
  id: string;
  name: string;
  document?: string;
  email: string;
  phone?: string;
  type: 'INDIVIDUAL' | 'CORPORATE';
  status: 'ACTIVE' | 'INACTIVE';
  isRecurring: boolean;
  recurringAmount?: number;
  joinedAt: string;
  totalDonated: number;
}

export const donors: Donor[] = [
  { id: 'd1', name: 'Aline Souza Mendes', document: '***.452.128-**', email: 'aline.mendes@gmail.com', phone: '(11) 98765-1234', type: 'INDIVIDUAL', status: 'ACTIVE', isRecurring: true, recurringAmount: 150.0, joinedAt: '2025-01-10', totalDonated: 2700.0 },
  { id: 'd2', name: 'Carlos Alberto Viana', document: '***.781.398-**', email: 'carlos.viana@outlook.com', phone: '(11) 97654-2345', type: 'INDIVIDUAL', status: 'ACTIVE', isRecurring: true, recurringAmount: 50.0, joinedAt: '2025-06-15', totalDonated: 650.0 },
  { id: 'd3', name: 'Empresa Alpha Tech Ltda', document: '12.345.678/0001-90', email: 'contato@alphatech.com.br', phone: '(11) 3344-5566', type: 'CORPORATE', status: 'ACTIVE', isRecurring: false, joinedAt: '2026-02-01', totalDonated: 12000.0 },
  { id: 'd4', name: 'Beatriz Martins Costa', document: '***.212.988-**', email: 'beatriz.costa@hotmail.com', phone: '(11) 96543-3456', type: 'INDIVIDUAL', status: 'ACTIVE', isRecurring: true, recurringAmount: 100.0, joinedAt: '2024-11-20', totalDonated: 2000.0 },
  { id: 'd5', name: 'Banco Itaú Social', document: '60.701.190/0001-04', email: 'parcerias@itau.com.br', type: 'CORPORATE', status: 'ACTIVE', isRecurring: false, joinedAt: '2025-08-01', totalDonated: 50000.0 },
  { id: 'd6', name: 'Sérgio Fernando Lopes', document: '***.490.878-**', email: 'sergio.lopes@gmail.com', phone: '(11) 95432-4567', type: 'INDIVIDUAL', status: 'INACTIVE', isRecurring: true, recurringAmount: 80.0, joinedAt: '2025-03-01', totalDonated: 640.0 }, // Inativo por falha de cobrança
];

// ─── CAMPANHAS DE ARRECADAÇÃO ───────────────────────────────
export interface Campaign {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  startDate: string;
  endDate: string;
  status: 'PLANNING' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED';
}

export const campaigns: Campaign[] = [
  { id: 'camp1', name: 'Campanha de Inverno 2026', description: 'Arrecadação de cobertores, agasalhos e fundos para apoio a moradores de rua.', targetAmount: 15000, raisedAmount: 12340.5, startDate: '2026-05-01', endDate: '2026-07-15', status: 'ACTIVE' },
  { id: 'camp2', name: 'Reforma do Espaço Acolher', description: 'Reforma da sede administrativa e salas de atendimento clínico.', targetAmount: 45000, raisedAmount: 46800.0, startDate: '2025-10-01', endDate: '2026-02-28', status: 'COMPLETED' },
  { id: 'camp3', name: 'Apoio Saúde Mental no Trabalho', description: 'Edição especial de palestras e orientação em empresas parceiras.', targetAmount: 8000, raisedAmount: 1500.0, startDate: '2026-06-01', endDate: '2026-08-31', status: 'ACTIVE' },
];

// ─── CONVÊNIOS E EDITAIS ────────────────────────────────────
export interface Agreement {
  id: string;
  name: string;
  code: string;
  grantor: string;
  approvedAmount: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'AUDITING' | 'SUSPENDED';
  obligations: {
    id: string;
    title: string;
    dueDate: string;
    status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'OVERDUE';
    description?: string;
  }[];
}

export const agreements: Agreement[] = [
  {
    id: 'ag1',
    name: 'Termo de Fomento CMDCA nº 04/2026',
    code: 'CONV-2026-04',
    grantor: 'Secretaria Municipal de Assistência Social',
    approvedAmount: 80000.0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
    obligations: [
      { id: 'ob1', title: 'Prestação de Contas 1º Quadrimestre', dueDate: '2026-05-15', status: 'APPROVED', description: 'Relatório físico-financeiro consolidado de Jan a Abr.' },
      { id: 'ob2', title: 'Relatório de Atendimento 2º Quadrimestre', dueDate: '2026-09-15', status: 'PENDING', description: 'Lista de beneficiários atendidos no projeto Lar Protegido.' },
      { id: 'ob3', title: 'Prestação de Contas Final', dueDate: '2027-01-30', status: 'PENDING' },
    ],
  },
  {
    id: 'ag2',
    name: 'Edital de Inovação Social Fundação Itaú',
    code: 'EDITAL-2025-09',
    grantor: 'Fundação Itaú de Amparo Social',
    approvedAmount: 50000.0,
    startDate: '2025-08-01',
    endDate: '2026-07-31',
    status: 'ACTIVE',
    obligations: [
      { id: 'ob4', title: 'Relatório de Impacto Metodológico', dueDate: '2026-04-10', status: 'APPROVED' },
      { id: 'ob5', title: 'Prestação de Contas de Encerramento', dueDate: '2026-08-15', status: 'PENDING', description: 'Prestação de contas financeira final do edital.' },
    ],
  },
];

// ─── TRANSAÇÕES ──────────────────────────────────────────────
export interface Transaction {
  id: string;
  type: FinancialType;
  title: string;
  description?: string;
  amount: number;
  status: TransactionStatus;
  dueDate: string;
  paymentDate?: string;
  categoryName: string;
  projectName?: string;
  costCenters: { name: string; percentage: number }[];
  donorName?: string;
  campaignName?: string;
  agreementName?: string;
  documentUrl?: string;
  createdBy: string;
}

export const transactions: Transaction[] = [
  {
    id: 't1',
    type: 'INCOME',
    title: 'Doação Recorrente — Aline Souza',
    amount: 150.0,
    status: 'COMPLETED',
    dueDate: '2026-06-25',
    paymentDate: '2026-06-25',
    categoryName: 'Doações Pessoa Física (PF)',
    projectName: 'Escuta Ativa',
    costCenters: [{ name: 'Projeto Escuta Ativa', percentage: 100.0 }],
    donorName: 'Aline Souza Mendes',
    documentUrl: 'recibo_doacao_aline_202606.pdf',
    createdBy: 'Financeiro',
  },
  {
    id: 't2',
    type: 'INCOME',
    title: 'Repasse Fomento CMDCA — Q2',
    amount: 20000.0,
    status: 'COMPLETED',
    dueDate: '2026-06-20',
    paymentDate: '2026-06-22',
    categoryName: 'Repasses Governamentais / Convênios',
    projectName: 'Lar Protegido',
    costCenters: [{ name: 'Convênio Municipal CMDCA', percentage: 100.0 }],
    agreementName: 'Termo de Fomento CMDCA nº 04/2026',
    documentUrl: 'ordem_pagamento_cmdca_q2.pdf',
    createdBy: 'Financeiro',
  },
  {
    id: 't3',
    type: 'EXPENSE',
    title: 'Honorários Profissionais — Psicólogos Junho',
    amount: 12500.0,
    status: 'COMPLETED',
    dueDate: '2026-06-30',
    paymentDate: '2026-06-28',
    categoryName: 'Folha de Pagamento',
    projectName: 'Escuta Ativa',
    costCenters: [
      { name: 'Projeto Escuta Ativa', percentage: 60.0 },
      { name: 'Projeto Lar Protegido', percentage: 40.0 },
    ],
    documentUrl: 'recibo_pagamento_psicologos_202606.pdf',
    createdBy: 'Controladoria',
  },
  {
    id: 't4',
    type: 'EXPENSE',
    title: 'Aluguel do Espaço de Atendimento',
    amount: 3200.0,
    status: 'COMPLETED',
    dueDate: '2026-06-10',
    paymentDate: '2026-06-10',
    categoryName: 'Aluguel e IPTU',
    costCenters: [{ name: 'Administração Central', percentage: 100.0 }],
    documentUrl: 'recibo_aluguel_jun2026.pdf',
    createdBy: 'Financeiro',
  },
  {
    id: 't5',
    type: 'EXPENSE',
    title: 'Licenças Zoom / Teleatendimento',
    amount: 350.0,
    status: 'COMPLETED',
    dueDate: '2026-06-05',
    paymentDate: '2026-06-05',
    categoryName: 'Tecnologia & Software (SaaS)',
    projectName: 'Escuta Ativa',
    costCenters: [{ name: 'Projeto Escuta Ativa', percentage: 100.0 }],
    documentUrl: 'nota_fiscal_zoom_202606.pdf',
    createdBy: 'Financeiro',
  },
  {
    id: 't6',
    type: 'INCOME',
    title: 'Apoio Campanha de Inverno — Alpha Tech',
    amount: 5000.0,
    status: 'COMPLETED',
    dueDate: '2026-06-18',
    paymentDate: '2026-06-18',
    categoryName: 'Patrocínios Corporativos (PJ)',
    costCenters: [{ name: 'Campanha de Inverno 2026', percentage: 100.0 }],
    donorName: 'Empresa Alpha Tech Ltda',
    campaignName: 'Campanha de Inverno 2026',
    documentUrl: 'comprovante_itau_alphatech_5000.pdf',
    createdBy: 'Captação de Recursos',
  },
  {
    id: 't7',
    type: 'EXPENSE',
    title: 'Materiais de Divulgação Campanha',
    amount: 680.0,
    status: 'COMPLETED',
    dueDate: '2026-06-02',
    paymentDate: '2026-06-02',
    categoryName: 'Materiais de Consumo e Escritório',
    costCenters: [{ name: 'Campanha de Inverno 2026', percentage: 100.0 }],
    campaignName: 'Campanha de Inverno 2026',
    documentUrl: 'nota_fiscal_grafica_express.pdf',
    createdBy: 'Financeiro',
  },
  {
    id: 't8',
    type: 'EXPENSE',
    title: 'Serviço de Manutenção Elétrica Sede',
    amount: 1450.0,
    status: 'PENDING',
    dueDate: '2026-07-05',
    categoryName: 'Serviços de Terceiros / Autônomos',
    costCenters: [{ name: 'Administração Central', percentage: 100.0 }],
    documentUrl: 'orcamento_eletricista_julho.pdf',
    createdBy: 'Financeiro',
  },
  {
    id: 't9',
    type: 'INCOME',
    title: 'Doação Recorrente — Carlos Alberto',
    amount: 50.0,
    status: 'PENDING',
    dueDate: '2026-07-15',
    categoryName: 'Doações Pessoa Física (PF)',
    costCenters: [{ name: 'Administração Central', percentage: 100.0 }],
    donorName: 'Carlos Alberto Viana',
    createdBy: 'Financeiro',
  },
];

// ─── FLUXO DE CAIXA PREVISTO VS REALIZADO (SÉRIE HISTÓRICA) ────
export const cashFlowSeries = [
  { mes: 'Jan/26', receitaPrev: 35000, receitaReal: 33450, despesaPrev: 28000, despesaReal: 27950 },
  { mes: 'Fev/26', receitaPrev: 30000, receitaReal: 31200, despesaPrev: 29000, despesaReal: 29800 },
  { mes: 'Mar/26', receitaPrev: 40000, receitaReal: 38900, despesaPrev: 34000, despesaReal: 34500 },
  { mes: 'Abr/26', receitaPrev: 65000, receitaReal: 67100, despesaPrev: 35000, despesaReal: 34200 },
  { mes: 'Mai/26', receitaPrev: 35000, receitaReal: 38200, despesaPrev: 38000, despesaReal: 37900 },
  { mes: 'Jun/26', receitaPrev: 50000, receitaReal: 48340, despesaPrev: 42000, despesaReal: 41810 },
  { mes: 'Jul/26 (Proj)', receitaPrev: 38000, receitaReal: 0, despesaPrev: 33000, despesaReal: 0 },
];

// ─── EXTRATO BANCÁRIO FICTÍCIO (PARA CONCILIAÇÃO BANCÁRIA) ─────
export interface BankStatementItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  reconciled: boolean;
}

export const bankStatementItems: BankStatementItem[] = [
  { id: 'bstd1', date: '2026-06-25', description: 'PIX RECEBIDO - ALINE SOUZA MENDES', amount: 150.0, type: 'CREDIT', reconciled: false },
  { id: 'bstd2', date: '2026-06-22', description: 'CREDITO REPASSE GOV PREF MUNICIPAL', amount: 20000.0, type: 'CREDIT', reconciled: false },
  { id: 'bstd3', date: '2026-06-28', description: 'DEBITO PAGAMENTO LOTE SALARIAL DDA', amount: 12500.0, type: 'DEBIT', reconciled: false },
  { id: 'bstd4', date: '2026-06-10', description: 'DEBITO PAGTO ALUGUEL IMOBILIARIA SÃO PAULO', amount: 3200.0, type: 'DEBIT', reconciled: false },
  { id: 'bstd5', date: '2026-06-05', description: 'COMPRA ONLINE ZOOM.US INTERNACIONAL', amount: 350.0, type: 'DEBIT', reconciled: false },
  { id: 'bstd6', date: '2026-06-18', description: 'PIX RECEBIDO - ALPHA TECH LTDA', amount: 5000.0, type: 'CREDIT', reconciled: false },
  { id: 'bstd7', date: '2026-06-15', description: 'TARIFA BANCARIA CESTA PJ', amount: 89.9, type: 'DEBIT', reconciled: false }, // Sem transação cadastrada
  { id: 'bstd8', date: '2026-06-29', description: 'PIX RECEBIDO - MARIA CLARA LUZ', amount: 250.0, type: 'CREDIT', reconciled: false }, // Sem transação cadastrada
];
