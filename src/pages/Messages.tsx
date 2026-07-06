import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Send, Paperclip, Image as ImageIcon, MoreVertical,
  CheckCheck, Bell, MessageSquare, User, Users,
  Smartphone, CheckCircle2, Clock, Phone
} from 'lucide-react';
import { cn } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../contexts/SecurityContext';

// =========================================================================
// MÓDULO: MENSAGERIA UNIFICADA & LEMBRETES OMNICHANNEL
// =========================================================================

interface Contact {
  id: string;
  name: string;
  role: string;
  type: 'beneficiary' | 'professional' | 'staff';
  unread: number;
  lastMsg: string;
  time: string;
  phone?: string;
}

interface ChatMessage {
  sender: 'me' | 'them';
  text: string;
  time: string;
  threadId: string;
}

interface NotificationLog {
  id: string;
  channel: 'whatsapp' | 'sms';
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  sentAt: string;
  status: 'enviado' | 'entregue';
}

const STAFF_CONTACTS: Contact[] = [
  { id: 'staff-1', name: 'Coordenação Clínica', role: 'Apoio Administrativo', type: 'staff', unread: 1, lastMsg: 'A reunião geral foi remarcada...', time: '10:30' },
  { id: 'staff-2', name: 'Dra. Camila (Psiquiatria)', role: 'Profissional', type: 'staff', unread: 0, lastMsg: 'Concordo com a avaliação.', time: 'Ontem' },
  { id: 'staff-3', name: 'Serviço Social', role: 'Apoio', type: 'staff', unread: 0, lastMsg: 'Ok, aguardo o encaminhamento.', time: 'Ontem' },
];

const INITIAL_THREAD_MESSAGES: ChatMessage[] = [
  { sender: 'them', text: 'Olá! A reunião de voluntários foi remarcada para amanhã às 14h. Poderá comparecer?', time: '10:30', threadId: 'staff-1' },
  { sender: 'me', text: 'Sim, estarei disponível. Obrigada por avisar!', time: '10:32', threadId: 'staff-1' },
  { sender: 'them', text: 'Você viu o prontuário da paciente Ana Silva?', time: 'Ontem', threadId: 'staff-2' },
  { sender: 'me', text: 'Sim, acabei de evoluir o caso. Ela está evoluindo bem.', time: 'Ontem', threadId: 'staff-2' },
  { sender: 'them', text: 'Concordo com a avaliação. Vamos manter a conduta.', time: 'Ontem', threadId: 'staff-2' },
  { sender: 'them', text: 'Pode confirmar o encaminhamento da Júlia?', time: 'Ontem', threadId: 'staff-3' },
  { sender: 'me', text: 'Estou finalizando o relatório, te envio até o fim do dia.', time: 'Ontem', threadId: 'staff-3' },
  { sender: 'them', text: 'Ok, aguardo o encaminhamento.', time: 'Ontem', threadId: 'staff-3' },
];

export function Messages() {
  const { user } = useAuth();
  const { logAction } = useSecurity();
  const [sidebarTab, setSidebarTab] = useState<'mensagens' | 'lembretes'>('mensagens');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const patients = JSON.parse(localStorage.getItem('patients_list') || '[]');
    const professionals = JSON.parse(localStorage.getItem('professionals_list') || '[]');

    const patientContacts: Contact[] = patients.map((p: any) => ({
      id: `patient-${p.id}`,
      name: p.name,
      role: 'Beneficiário(a)',
      type: 'beneficiary' as const,
      unread: 0,
      lastMsg: 'Iniciar conversa...',
      time: '',
      phone: p.phone || '',
    }));

    const professionalContacts: Contact[] = professionals.map((p: any) => ({
      id: `prof-${p.id}`,
      name: p.name,
      role: p.profession || 'Voluntário(a)',
      type: 'professional' as const,
      unread: 0,
      lastMsg: 'Iniciar conversa...',
      time: '',
      phone: p.phone || '',
    }));

    return [...STAFF_CONTACTS, ...patientContacts, ...professionalContacts];
  });

  const [activeContact, setActiveContact] = useState<Contact>(contacts[0]);

  const [allMessages, setAllMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('messages_list');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('messages_list', JSON.stringify(INITIAL_THREAD_MESSAGES));
    return INITIAL_THREAD_MESSAGES;
  });

  const [notifLog, setNotifLog] = useState<NotificationLog[]>(() => {
    return JSON.parse(localStorage.getItem('notification_log') || '[]');
  });

  const upcomingAppointments = useMemo(() => {
    const saved = localStorage.getItem('appointments_list') || '[]';
    return JSON.parse(saved).filter((a: any) => a.status === 'upcoming');
  }, []);

  const activeMessages = useMemo(
    () => allMessages.filter((m) => m.threadId === activeContact.id),
    [allMessages, activeContact.id]
  );

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      sender: 'me',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      threadId: activeContact.id,
    };
    const updated = [...allMessages, newMsg];
    setAllMessages(updated);
    localStorage.setItem('messages_list', JSON.stringify(updated));
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id ? { ...c, lastMsg: inputText, time: newMsg.time } : c
      )
    );
    // Auditoria MCSI: mensagens para beneficiários são eventos sensíveis
    if (activeContact.type === 'beneficiary') {
      logAction({
        userId: user?.email ?? 'sistema',
        userName: user?.name ?? 'Equipe Técnica',
        action: 'EDIT',
        targetCode: activeContact.id,
        description: `[Mensageria] Mensagem enviada para beneficiário: ${activeContact.name}`,
        ipAddress: '—',
        device: navigator.userAgent.slice(0, 80),
      });
    }
    setInputText('');
  };

  const handleSelectContact = (contact: Contact) => {
    setActiveContact(contact);
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c))
    );
  };

  const handleSendReminder = (appt: any, channel: 'whatsapp' | 'sms') => {
    const log: NotificationLog = {
      id: `notif-${Date.now()}`,
      channel,
      patientName: appt.patientName,
      patientPhone: appt.patientPhone || '(11) 9xxxx-xxxx',
      appointmentDate: appt.date,
      appointmentTime: appt.time,
      sentAt: new Date().toISOString(),
      status: 'enviado',
    };
    const updatedLog = [log, ...notifLog];
    setNotifLog(updatedLog);
    localStorage.setItem('notification_log', JSON.stringify(updatedLog));
    setTimeout(() => {
      setNotifLog((prev) =>
        prev.map((n) => (n.id === log.id ? { ...n, status: 'entregue' } : n))
      );
    }, 2000);
  };

  const getAvatarColor = (type: Contact['type']) => {
    if (type === 'beneficiary') return 'bg-violet-100 text-violet-700';
    if (type === 'professional') return 'bg-teal-100 text-teal-700';
    return 'bg-slate-200 text-slate-600';
  };

  const totalUnread = contacts.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white">
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Mensageria</h2>
            {totalUnread > 0 && (
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setSidebarTab('mensagens')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                sidebarTab === 'mensagens' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Mensagens
            </button>
            <button
              onClick={() => setSidebarTab('lembretes')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                sidebarTab === 'lembretes' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Bell className="w-3.5 h-3.5" />
              Lembretes
            </button>
          </div>
          {sidebarTab === 'mensagens' && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar contatos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarTab === 'mensagens' && (
            <>
              {filteredContacts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Nenhum contato encontrado.</p>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 border-b border-slate-100 transition-colors text-left',
                      activeContact.id === contact.id ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0', getAvatarColor(contact.type))}>
                      {contact.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-sm font-medium text-slate-900 truncate">{contact.name}</h4>
                        <span className="text-xs text-slate-400 shrink-0 ml-1">{contact.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{contact.lastMsg}</p>
                      <span className={cn('text-[10px] font-medium mt-0.5 inline-block',
                        contact.type === 'beneficiary' ? 'text-violet-500' :
                        contact.type === 'professional' ? 'text-teal-600' : 'text-slate-400'
                      )}>
                        {contact.role}
                      </span>
                    </div>
                    {contact.unread > 0 && (
                      <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1">
                        {contact.unread}
                      </div>
                    )}
                  </button>
                ))
              )}
            </>
          )}

          {sidebarTab === 'lembretes' && (
            <div className="p-3 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
                Consultas Pendentes de Lembrete
              </p>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Nenhuma consulta futura encontrada.</p>
                </div>
              ) : (
                upcomingAppointments.map((appt: any) => {
                  const sent = notifLog.find((n) => n.patientName === appt.patientName && n.appointmentDate === appt.date);
                  return (
                    <div key={appt.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{appt.patientName}</p>
                          <p className="text-[10px] text-slate-500">{appt.time} · {appt.date} · {appt.type}</p>
                        </div>
                        {sent ? (
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1',
                            sent.status === 'entregue' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          )}>
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {sent.status === 'entregue' ? 'Entregue' : 'Enviado'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-slate-100 text-slate-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Pendente
                          </span>
                        )}
                      </div>
                      {!sent && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendReminder(appt, 'whatsapp')}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleSendReminder(appt, 'sms')}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg transition-colors"
                          >
                            <Smartphone className="w-3 h-3" />
                            SMS
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {notifLog.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">Log Recente</p>
                  {notifLog.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      {log.channel === 'whatsapp'
                        ? <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        : <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-slate-700 truncate">{log.patientName}</p>
                        <p className="text-[9px] text-slate-400">{log.appointmentDate} {log.appointmentTime}</p>
                      </div>
                      <span className={cn('text-[9px] font-bold shrink-0',
                        log.status === 'entregue' ? 'text-emerald-600' : 'text-amber-600'
                      )}>
                        {log.status === 'entregue' ? 'Entregue' : 'Enviado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE CHAT */}
      <main className="flex-1 flex flex-col bg-slate-50/50 min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm', getAvatarColor(activeContact.type))}>
              {activeContact.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 leading-tight">{activeContact.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                {activeContact.type === 'beneficiary' && <User className="w-3 h-3 text-violet-500" />}
                {activeContact.type === 'professional' && <Users className="w-3 h-3 text-teal-600" />}
                {activeContact.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeContact.phone && (
              <span className="text-xs text-slate-400 hidden sm:block">{activeContact.phone}</span>
            )}
            <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Nenhuma mensagem ainda.</p>
              <p className="text-xs text-slate-400 mt-1">Envie a primeira mensagem para {activeContact.name}.</p>
            </div>
          ) : (
            activeMessages.map((msg, index) => (
              <div
                key={index}
                className={cn('flex items-end gap-2', msg.sender === 'me' ? 'justify-end' : 'justify-start')}
              >
                {msg.sender !== 'me' && (
                  <div className={cn('w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold', getAvatarColor(activeContact.type))}>
                    {activeContact.name.substring(0, 1)}
                  </div>
                )}
                <div className={cn(
                  'rounded-2xl px-4 py-3 max-w-[70%] shadow-sm text-sm',
                  msg.sender === 'me'
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 rounded-bl-sm text-slate-700'
                )}>
                  {msg.text}
                  <div className={cn(
                    'text-[10px] mt-1 text-right flex items-center justify-end gap-1',
                    msg.sender === 'me' ? 'text-teal-200' : 'text-slate-400'
                  )}>
                    {msg.time}
                    {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-teal-200" />}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

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
                placeholder={`Mensagem para ${activeContact.name}...`}
                className="w-full max-h-32 min-h-[44px] bg-transparent border-0 resize-none px-4 py-3 text-sm text-slate-700 focus:ring-0 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="w-11 h-11 bg-teal-600 text-white rounded-full flex items-center justify-center hover:bg-teal-500 transition-colors shadow-sm mb-0.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
