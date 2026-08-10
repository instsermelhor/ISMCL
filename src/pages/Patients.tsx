import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserPlus, AlertTriangle, Users, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { patientsService, type BeneficiaryRecord } from '../services/patientsService';

export function Patients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patientsList, setPatientsList] = useState<BeneficiaryRecord[]>(() => patientsService.getAll());

  useEffect(() => {
    const unsub = patientsService.subscribe(() => {
      setPatientsList(patientsService.getAll());
    });
    return unsub;
  }, []);

  const filteredPatients = patientsList.filter((patient) => {
    const q = searchTerm.toLowerCase();
    const name = patient.name || '';
    const prof = patient.assignedProfessionalName || '';
    const cpf = patient.cpf || '';
    const cat = patient.category || '';
    return name.toLowerCase().includes(q) || prof.toLowerCase().includes(q) || cpf.includes(q) || cat.toLowerCase().includes(q);
  });

  const getRiskBadge = (vulnerability: BeneficiaryRecord['vulnerabilityLevel']) => {
    switch (vulnerability) {
      case 'critica':
      case 'alta':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200"><AlertTriangle className="w-3 h-3" /> Alta Vulnerabilidade</span>;
      case 'media':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"><ShieldAlert className="w-3 h-3" /> Vulnerabilidade Média</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Vulnerabilidade Baixa</span>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Beneficiários e Prontuários</h1>
            <p className="text-slate-500 mt-1">Gestão de acolhimentos e acompanhamento multidisciplinar.</p>
          </div>

          <button
            onClick={() => navigate('/patients/new')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
          >
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
              placeholder="Buscar por nome, CPF ou programa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 shadow-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm shrink-0">
            <Filter className="w-4 h-4" />
            Filtros Avançados
          </button>
        </div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => navigate(`/patients/${patient.id}`)}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-teal-500 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base">
                      {patient.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 leading-snug">{patient.name}</h3>
                      <p className="text-xs text-slate-500">{patient.cpf ? `CPF: ${patient.cpf}` : 'Sem CPF'}</p>
                    </div>
                  </div>
                  {getRiskBadge(patient.vulnerabilityLevel)}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl">
                  <p><strong>Programa:</strong> {patient.category || 'Geral'}</p>
                  <p><strong>Responsável:</strong> {patient.assignedProfessionalName || 'A definir'}</p>
                  <p><strong>Origem:</strong> {patient.intakeSource || 'Direto'}</p>
                  {patient.notes && <p className="text-slate-500 truncate"><strong>Obs:</strong> {patient.notes}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400">
                  Evoluções: <strong>{patient.evolutions?.length || 0}</strong>
                </span>
                <span className="text-teal-700 font-semibold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Abrir Prontuário
                </span>
              </div>
            </div>
          ))}
          {filteredPatients.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600 text-base">Nenhum beneficiário encontrado</p>
              <p className="text-xs mt-1">Utilize o botão "Novo Cadastro" ou realize um acolhimento no portal público.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
