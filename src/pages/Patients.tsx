import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserPlus, AlertTriangle } from 'lucide-react';

const DEFAULT_PATIENTS = [
  {
    id: '1',
    name: 'Ana Silva Santos',
    socialName: 'Ana Silva',
    age: 32,
    gender: 'Feminino',
    birthDate: '1994-03-12',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    status: 'Ativo',
    risk: 'high',
    lastSeen: '14/06/2023',
    professional: 'Dra. Roberta',
    phone: '(11) 98765-4321',
    email: 'ana.silva@email.com',
    address: 'Rua das Acácias, 342, Penha, São Paulo - SP, CEP 03700-000',
    emergencyContact: 'Maria (Mãe) - (11) 91234-5678',
    socialProject: 'Acolher Saúde Mental',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    income: 'up_to_1',
    housing: 'rented',
    education: 'Superior Completo',
    occupation: 'Gerente Administrativa',
    familyRenda: '2 a 5 SM'
  },
  {
    id: '2',
    name: 'Marcos Santos Oliveira',
    socialName: 'Marquinhos',
    age: 14,
    gender: 'Masculino',
    birthDate: '2012-08-22',
    cpf: '234.567.890-11',
    rg: '23.456.789-0',
    status: 'Em avaliação',
    risk: 'medium',
    lastSeen: '10/06/2023',
    professional: 'Dr. Carlos',
    phone: '(11) 97777-6666',
    email: 'marcos.santos@email.com',
    address: 'Av. São Miguel, 1200, Penha, São Paulo - SP, CEP 03601-000',
    emergencyContact: 'Julio (Pai) - (11) 92222-3333',
    socialProject: 'Acolher Crianças',
    photoUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150&auto=format&fit=crop&q=80',
    income: '1_to_3',
    housing: 'owned',
    education: 'Fundamental',
    occupation: 'Estudante',
    familyRenda: '1 a 2 SM'
  },
  {
    id: '3',
    name: 'Júlia Costa',
    socialName: '',
    age: 45,
    gender: 'Feminino',
    birthDate: '1981-05-18',
    cpf: '345.678.901-22',
    rg: '34.567.890-1',
    status: 'Ativo',
    risk: 'low',
    lastSeen: '05/06/2023',
    professional: 'Dra. Roberta',
    phone: '(11) 98888-9999',
    email: 'julia.costa@email.com',
    address: 'Rua Itapura, 550, Tatuapé, São Paulo - SP, CEP 03310-000',
    emergencyContact: 'Marcos (Filho) - (11) 93333-4444',
    socialProject: 'Acolher Saúde Mental',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    income: 'more_3',
    housing: 'owned',
    education: 'Superior Completo',
    occupation: 'Analista de Sistemas',
    familyRenda: 'Acima de 5 SM'
  },
  {
    id: 'ben-001',
    name: 'Maria Clara Oliveira',
    socialName: 'Maria Clara',
    age: 36,
    gender: 'Feminino',
    birthDate: '1990-03-15',
    cpf: '111.222.333-44',
    rg: '11.222.333-4',
    status: 'Ativo',
    risk: 'low',
    lastSeen: '28/06/2026',
    professional: 'Dra. Roberta',
    phone: '(11) 99999-8888',
    email: 'maria.clara@email.com',
    address: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP, CEP 01310-100',
    emergencyContact: 'José (Marido) - (11) 98888-7777',
    socialProject: 'Saúde Mental Comunitária',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    income: '1_to_3',
    housing: 'rented',
    education: 'Superior Incompleto',
    occupation: 'Auxiliar Administrativa',
    familyRenda: '1 a 2 SM'
  }
];

export function Patients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patientsList, setPatientsList] = useState(() => {
    const saved = localStorage.getItem('patients_list');
    return saved ? JSON.parse(saved) : DEFAULT_PATIENTS;
  });

  React.useEffect(() => {
    if (!localStorage.getItem('patients_list')) {
      localStorage.setItem('patients_list', JSON.stringify(DEFAULT_PATIENTS));
    }
  }, []);

  const filteredPatients = patientsList.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.professional.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Beneficiários</h1>
            <p className="text-slate-500 mt-1">Gestão de casos e prontuários.</p>
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
              placeholder="Buscar por nome, CPF ou ID do caso..." 
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
                {filteredPatients.map((patient) => (
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
