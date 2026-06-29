import React, { useState } from 'react';
import { Search, Send, Paperclip, Image as ImageIcon, MoreVertical, CheckCheck } from 'lucide-react';
import { cn } from '../utils';

const contacts = [
  { id: '1', name: 'Coordenação Clínica', role: 'Apoio Administrativo', unread: 2, lastMsg: 'A reunião geral foi remarcada para...', time: '10:30' },
  { id: '2', name: 'Dra. Camila (Psiquiatria)', role: 'Profissional', unread: 0, lastMsg: 'Concordo com a avaliação. Vamos...', time: 'Ontem' },
  { id: '3', name: 'Serviço Social', role: 'Apoio', unread: 0, lastMsg: 'Ok, aguardo o encaminhamento.', time: 'Ontem' },
];

export function Messages() {
  const [activeContact, setActiveContact] = useState(contacts[0]);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white">
      {/* Sidebar - Contacts */}
      <aside className="w-80 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight mb-4">Mensagens</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Buscar contatos..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={cn(
                "w-full flex items-start gap-3 p-4 border-b border-slate-100 transition-colors text-left",
                activeContact.id === contact.id ? "bg-teal-50/50" : "hover:bg-slate-50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm shrink-0">
                {contact.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-sm font-medium text-slate-900 truncate">{contact.name}</h4>
                  <span className="text-xs text-slate-400">{contact.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{contact.lastMsg}</p>
              </div>
              {contact.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1">
                  {contact.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-slate-50/50 min-w-0">
        {/* Chat Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
              {activeContact.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-slate-900 leading-tight">{activeContact.name}</h3>
              <p className="text-xs text-slate-500">{activeContact.role}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-2">
            <MoreVertical className="w-5 h-5" />
          </button>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[70%] shadow-sm text-sm text-slate-700">
              Olá Dra. Roberta. A reunião geral de voluntários foi remarcada para amanhã às 14h. Poderá comparecer?
              <div className="text-[10px] text-slate-400 mt-1 text-right">10:30</div>
            </div>
          </div>
          
          <div className="flex items-end justify-end gap-2">
            <div className="bg-teal-600 text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[70%] shadow-sm text-sm">
              Olá! Sim, estarei disponível. Obrigada por avisar.
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-teal-200">10:32</span>
                <CheckCheck className="w-3 h-3 text-teal-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors mb-1 shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors mb-1 shrink-0">
              <ImageIcon className="w-5 h-5" />
            </button>
            
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-600 focus-within:border-teal-600 transition-all">
              <textarea 
                rows={1}
                placeholder="Escreva sua mensagem..."
                className="w-full max-h-32 min-h-[44px] bg-transparent border-0 resize-none px-4 py-3 text-sm text-slate-700 focus:ring-0 placeholder:text-slate-400"
              />
            </div>
            
            <button className="w-11 h-11 bg-teal-600 text-white rounded-full flex items-center justify-center hover:bg-teal-500 transition-colors shadow-sm mb-0.5 shrink-0">
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
