import React, { useState } from 'react';
import { Search, Send, Paperclip, Image as ImageIcon, MoreVertical, CheckCheck } from 'lucide-react';
import { cn } from '../utils';

const contacts = [
  { id: '1', name: 'Coordenação Clínica', role: 'Apoio Administrativo', unread: 2, lastMsg: 'A reunião geral foi remarcada para...', time: '10:30' },
  { id: '2', name: 'Dra. Camila (Psiquiatria)', role: 'Profissional', unread: 0, lastMsg: 'Concordo com a avaliação. Vamos...', time: 'Ontem' },
  { id: '3', name: 'Serviço Social', role: 'Apoio', unread: 0, lastMsg: 'Ok, aguardo o encaminhamento.', time: 'Ontem' },
];

const INITIAL_MESSAGES: Record<string, Array<{ sender: 'them' | 'me', text: string, time: string }>> = {
  '1': [
    { sender: 'them', text: 'Olá Dra. Roberta. A reunião geral de voluntários foi remarcada para amanhã às 14h. Poderá comparecer?', time: '10:30' },
    { sender: 'me', text: 'Olá! Sim, estarei disponível. Obrigada por avisar.', time: '10:32' }
  ],
  '2': [
    { sender: 'them', text: 'Dra. Roberta, você viu o prontuário da paciente Ana Silva?', time: 'Ontem' },
    { sender: 'me', text: 'Sim, acabei de evoluir o caso. Ela está evoluindo bem.', time: 'Ontem' },
    { sender: 'them', text: 'Concordo com a avaliação. Vamos manter a conduta.', time: 'Ontem' }
  ],
  '3': [
    { sender: 'them', text: 'Pode confirmar o encaminhamento da Júlia?', time: 'Ontem' },
    { sender: 'me', text: 'Ainda estou finalizando o relatório, te envio até o fim do dia.', time: 'Ontem' },
    { sender: 'them', text: 'Ok, aguardo o encaminhamento.', time: 'Ontem' }
  ]
};

export function Messages() {
  const [activeContact, setActiveContact] = useState(contacts[0]);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  const activeMessages = messages[activeContact.id] || [];

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg = { 
      sender: 'me' as const, 
      text: inputText, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setMessages(prev => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMsg]
    }));

    // Update last message in contact preview
    const contactIndex = contacts.findIndex(c => c.id === activeContact.id);
    if (contactIndex !== -1) {
      contacts[contactIndex].lastMsg = inputText;
      contacts[contactIndex].time = newMsg.time;
    }
    
    setInputText('');
  };

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
              onClick={() => {
                setActiveContact(contact);
                contact.unread = 0; // Clear unread on click
              }}
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
          {activeMessages.map((msg, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-end gap-2",
                msg.sender === 'me' ? "justify-end" : "justify-start"
              )}
            >
              {msg.sender !== 'me' && <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />}
              <div 
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[70%] shadow-sm text-sm",
                  msg.sender === 'me' 
                    ? "bg-teal-600 text-white rounded-br-sm" 
                    : "bg-white border border-slate-200 rounded-bl-sm text-slate-700"
                )}
              >
                {msg.text}
                <div 
                  className={cn(
                    "text-[10px] mt-1 text-right flex items-center justify-end gap-1",
                    msg.sender === 'me' ? "text-teal-200" : "text-slate-400"
                  )}
                >
                  {msg.time}
                  {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-teal-200" />}
                </div>
              </div>
            </div>
          ))}
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
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Escreva sua mensagem..."
                className="w-full max-h-32 min-h-[44px] bg-transparent border-0 resize-none px-4 py-3 text-sm text-slate-700 focus:ring-0 placeholder:text-slate-400"
              />
            </div>
            
            <button 
              onClick={handleSendMessage}
              className="w-11 h-11 bg-teal-600 text-white rounded-full flex items-center justify-center hover:bg-teal-500 transition-colors shadow-sm mb-0.5 shrink-0"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
