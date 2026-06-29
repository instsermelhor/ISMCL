import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserPlus, AlertTriangle } from 'lucide-react';

const patients = [
  { id: '1', name: 'Ana Silva Santos', age: 32, status: 'Ativo', risk: 'high', lastSeen: '14/06/2023', professional: 'Dra. Roberta' },
  { id: '2', name: 'Marcos Santos Oliveira', age: 14, status: 'Em avaliação', risk: 'medium', lastSeen: '10/06/2023', professional: 'Dr. Carlos' },
  { id: '3', name: 'Júlia Costa', age: 45, status: 'Ativo', risk: 'low', lastSeen: '05/06/2023', professional: 'Dra. Roberta' },
];

export function Patients() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Beneficiários</h1>
            <p className="text-slate-500 mt-1">Gestão de casos e prontuários.</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
            <UserPlus className="w-4 h-4" />
            Novo Cadastro
          </button>
        </header>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Buscar por nome, CPF ou ID do caso..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 shadow-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm shrink-0">
            <Filter className="w-4 h-4" />
            Filtros Avançados
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nome do Beneficiário</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Vulnerabilidade</th>
                  <th className="px-6 py-4">Último Atendimento</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{patient.name}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{patient.age} anos • {patient.professional}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {patient.risk === 'high' && (
                        <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Risco Alto
                        </span>
                      )}
                      {patient.risk === 'medium' && (
                        <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Risco Médio
                        </span>
                      )}
                      {patient.risk === 'low' && (
                        <span className="text-slate-500 text-xs font-medium">
                          Monitoramento
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {patient.lastSeen}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="text-teal-600 font-medium hover:text-teal-700"
                      >
                        Abrir Prontuário
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
