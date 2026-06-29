import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  User, 
  AlertTriangle, 
  Phone, 
  MapPin, 
  FileText, 
  Lock, 
  Plus, 
  Clock, 
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'evolutions' | 'documents'>('evolutions');
  const [isWriting, setIsWriting] = useState(false);

  // Mock patient data
  const patient = {
    name: 'Ana Silva Santos',
    age: 32,
    gender: 'Feminino',
    status: 'Em acompanhamento',
    vulnerabilities: ['Violência Doméstica', 'Risco Financeiro'],
    phone: '(11) 98765-4321',
    address: 'Zona Leste, São Paulo - SP',
    emergencyContact: 'Maria (Mãe) - (11) 91234-5678'
  };

  const evolutions = [
    {
      id: 1,
      date: new Date(2023, 5, 21, 14, 30),
      professional: 'Dra. Roberta (Psicóloga)',
      content: 'Paciente compareceu à sessão pontualmente. Relata melhora no quadro de ansiedade generalizada nesta última semana. Discutimos estratégias de enfrentamento para momentos de crise. Sugerida manutenção da rotina de autocuidado estabelecida.',
      cid: 'F41.1',
      signed: true
    },
    {
      id: 2,
      date: new Date(2023, 5, 14, 14, 0),
      professional: 'Dra. Roberta (Psicóloga)',
      content: 'Primeira sessão após o encaminhamento do serviço social. Paciente apresenta fala angustiada, sudorese e choro contido ao relatar situação familiar. Acolhimento realizado com foco em segurança imediata.',
      cid: 'F41.1',
      signed: true
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{patient.name}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                {patient.status}
              </span>
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Prontuário Sigiloso</span>
              <span>•</span>
              <span>ID: {id?.padStart(6, '0') || '000124'}</span>
            </div>
          </div>
        </div>
        
        <div>
          <button 
            onClick={() => setIsWriting(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Evolução
          </button>
        </div>
      </header>

      {/* Main Content Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Patient Summary (1/3) */}
        <aside className="w-[400px] border-r border-slate-200 bg-white flex flex-col overflow-y-auto shrink-0">
          <div className="p-6 space-y-8">
            
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">{patient.name}</h3>
                <p className="text-sm text-slate-500">{patient.age} anos • {patient.gender}</p>
              </div>
            </div>

            {/* Vulnerability Badges */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Matriz de Vulnerabilidade
              </h4>
              <div className="flex flex-wrap gap-2">
                {patient.vulnerabilities.map((v, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Contatos e Localização
              </h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                  <Phone className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">{patient.phone}</div>
                    <div className="text-xs text-slate-500">Contato Pessoal</div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Phone className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">{patient.emergencyContact}</div>
                    <div className="text-xs text-slate-500">Contato de Emergência</div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">{patient.address}</div>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Quick Actions / Integration */}
            <div className="pt-4 border-t border-slate-100">
               <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors">
                 Ver Perfil Social Completo
               </button>
            </div>
          </div>
        </aside>

        {/* Right Column: Clinical Timeline (2/3) */}
        <main className="flex-1 bg-slate-50 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-8 px-8">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-8">
              <button 
                onClick={() => setActiveTab('evolutions')}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors mr-8 ${
                  activeTab === 'evolutions' 
                    ? 'border-teal-600 text-teal-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Evoluções Clínicas
              </button>
              <button 
                onClick={() => setActiveTab('documents')}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'documents' 
                    ? 'border-teal-600 text-teal-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Documentos e Anexos
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">3</span>
              </button>
            </div>

            {/* Writer Module (Conditional) */}
            {isWriting && (
              <motion.div 
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                className="bg-white rounded-2xl shadow-sm border border-teal-100 mb-8 overflow-hidden"
              >
                <div className="bg-teal-50/50 px-6 py-3 border-b border-teal-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-800 font-medium text-sm">
                    <FileText className="w-4 h-4" />
                    Nova Evolução Clínica
                  </div>
                  <Lock className="w-4 h-4 text-teal-600/50" />
                </div>
                <div className="p-6">
                  <textarea 
                    className="w-full h-40 resize-none border-0 focus:ring-0 text-slate-700 placeholder:text-slate-400 p-0 sm:text-sm sm:leading-relaxed"
                    placeholder="Descreva o atendimento, impressões e plano de cuidado..."
                    autoFocus
                  />
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="CID (Opcional)" 
                        className="w-32 rounded-lg border-slate-200 text-sm focus:ring-teal-600 focus:border-teal-600"
                      />
                      <button 
                        onClick={() => alert('IA Copilot: Resumo transcrito da Teleconsulta gerado via LLM estruturado em modelo SOAP.')}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        Copiloto IA
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsWriting(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => {
                          alert('Evolução assinada com Certificado Digital (ICP-Brasil) com sucesso!');
                          setIsWriting(false);
                        }}
                        className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 shadow-sm transition-colors"
                      >
                        Assinar e Salvar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'evolutions' ? (
              /* Timeline */
              <div className="space-y-6">
                {evolutions.map((evo) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={evo.id} 
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{evo.professional}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {format(evo.date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      {evo.signed && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Assinado digitalmente
                        </div>
                      )}
                    </div>
                    
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap pl-12">
                      {evo.content}
                    </div>
                    
                    {evo.cid && (
                      <div className="mt-4 pl-12 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          CID-10: {evo.cid}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Documents List */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {[
                  { name: 'Laudo Psicológico - Encaminhamento CREAS.pdf', date: '10/05/2023', size: '1.2 MB' },
                  { name: 'Comprovante de Residência.jpg', date: '12/05/2023', size: '840 KB' },
                  { name: 'Termo de Consentimento Livre e Esclarecido.pdf', date: '14/05/2023', size: '450 KB' }
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{doc.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{doc.date} • {doc.size}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert(`Baixando o arquivo ${doc.name}...`)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
            
            <div className="mt-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Fim do histórico clínico visível para o seu nível de acesso.
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
