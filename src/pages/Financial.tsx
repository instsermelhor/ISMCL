import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils';

const transactions = [
  { id: 1, type: 'income', title: 'Doação Pessoa Física', date: '28 Jun, 2026', amount: 150.00, status: 'completed' },
  { id: 2, type: 'income', title: 'Patrocínio Empresa X', date: '27 Jun, 2026', amount: 5000.00, status: 'completed' },
  { id: 3, type: 'expense', title: 'Licença Software Telessaúde', date: '25 Jun, 2026', amount: 350.00, status: 'completed' },
  { id: 4, type: 'expense', title: 'Materiais de Apoio', date: '24 Jun, 2026', amount: 120.50, status: 'completed' },
  { id: 5, type: 'income', title: 'Edital Cultura Social', date: '20 Jun, 2026', amount: 15000.00, status: 'pending' },
];

export function Financial() {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Financeiro & Transparência</h1>
            <p className="text-slate-500 mt-1">Gestão de doações, patrocínios e custos operacionais.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert('Download do relatório em PDF/CSV gerado pelo Open Finance...')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exportar Relatório
            </button>
            <button 
              onClick={() => alert('Formulário para nova doação / custo operacional...')}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
            >
              <DollarSign className="w-4 h-4" />
              Nova Entrada
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500">Saldo Atual</h3>
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">R$ 42.500,00</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center text-xs font-medium text-teal-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5%
              </span>
              <span className="text-xs text-slate-400">vs. último mês</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500">Doações no Mês</h3>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">R$ 15.150,00</p>
            <div className="flex items-center gap-2 mt-2">
               <span className="text-xs text-slate-400">85 doadores ativos</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500">Custos Operacionais</h3>
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">R$ 4.280,50</p>
            <div className="flex items-center gap-2 mt-2">
               <span className="text-xs text-slate-400">Mantido abaixo do teto orçamentário</span>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-medium text-slate-900">Últimas Movimentações</h3>
            <button className="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.map((transaction, index) => (
              <motion.div 
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    transaction.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {transaction.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">{transaction.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{transaction.date}</span>
                      <span>•</span>
                      <span className={cn(
                        "font-medium",
                        transaction.status === 'completed' ? "text-slate-500" : "text-amber-500"
                      )}>
                        {transaction.status === 'completed' ? 'Efetivado' : 'Pendente'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "font-semibold text-sm",
                  transaction.type === 'income' ? "text-emerald-600" : "text-slate-900"
                )}>
                  {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2).replace('.', ',')}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-center">
            <button className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
              Ver todas as movimentações
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
