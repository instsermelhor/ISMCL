import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneMissed, 
  ShieldAlert,
  AlertTriangle,
  Clock,
  FileText,
  Save,
  Lock,
  ChevronLeft,
  Sparkles,
  Send,
  Paperclip,
  Activity,
  History,
  Shield,
  Download,
  Plus,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Smile,
  Wifi,
  WifiOff,
  User,
  Settings as SettingsIcon,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '../utils';
import { generateSOAP, generateSummary } from '../services/gemini';

// =========================================================================
// MÓDULO 04: CENTRAL DE ATENDIMENTO DIGITAL E TELECONSULTA
// =========================================================================

interface AuditLog {
  timestamp: string;
  action: string;
  details: string;
  type: 'info' | 'warning' | 'success' | 'security';
}

interface ChatMessage {
  id: string;
  sender: 'professional' | 'patient';
  senderName: string;
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    size: string;
    version: number;
    url: string;
  };
}

interface IssuedDocument {
  id: string;
  type: 'receita' | 'atestado' | 'laudo' | 'encaminhamento';
  title: string;
  content: string;
  professionalName: string;
  licenseNumber: string;
  signatureHash: string;
  issuedAt: string;
  sharedWithPatient: boolean;
}

export function Telehealth() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- CONTROLE DE SIMULAÇÃO DE REGRAS DE NEGÓCIO ---
  const [simulatedRule, setSimulatedRule] = useState<'valid' | 'invalid_time' | 'invalid_professional' | 'invalid_beneficiary' | 'invalid_status'>('valid');
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'poor' | 'disconnected'>('excellent');
  const [isReconnecting, setIsReconnecting] = useState(false);

  // --- ESTADOS DA VIDEOCHAMADA ---
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  // --- ESTADOS DE GRAVAÇÃO COM CONSENTIMENTO (RN03) ---
  const [recordingState, setRecordingState] = useState<'idle' | 'requesting_consent' | 'waiting_patient' | 'recording'>('idle');
  const [recordingType, setRecordingType] = useState<'video_audio' | 'audio_only'>('video_audio');
  const [recordingReason, setRecordingReason] = useState('');
  const [consentProofHash, setConsentProofHash] = useState('');

  // --- ESTADOS DO CHAT SEGURO ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'patient', senderName: 'Ana Silva Santos', text: 'Boa tarde, Dra. Roberta. Já estou pronta para a sessão.', timestamp: '14:00' },
    { id: '2', sender: 'professional', senderName: 'Dra. Roberta', text: 'Boa tarde, Ana. Que bom. Vou iniciar a sala virtual agora.', timestamp: '14:00' }
  ]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- ESTADOS DO PRONTUÁRIO CLÍNICO (EMR) ---
  const [activeTab, setActiveTab] = useState<'evolution' | 'documents' | 'history' | 'audit'>('evolution');
  const [evolutionText, setEvolutionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  
  // --- ESTADOS DO COPILOTO IA (Gemini API) ---
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiActionType, setAiActionType] = useState<'soap' | 'summary' | null>(null);

  // --- ESTADOS DE DOCUMENTOS (RN04) ---
  const [docType, setDocType] = useState<'receita' | 'atestado' | 'laudo' | 'encaminhamento'>('receita');
  const [docText, setDocText] = useState('');
  const [docMetadata, setDocMetadata] = useState({
    professionalName: 'Dra. Roberta de Souza',
    licenseNumber: 'CRP 06/98765-SP',
    validityDays: '30'
  });
  const [issuedDocs, setIssuedDocs] = useState<IssuedDocument[]>([]);
  const [selectedDocForView, setSelectedDocForView] = useState<IssuedDocument | null>(null);

  // --- PAINEL DE AUDITORIA ---
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { timestamp: '13:58:34', action: 'AUTENTICAÇÃO', details: 'Dra. Roberta autenticada com sucesso na rede ISM.', type: 'security' },
    { timestamp: '14:00:01', action: 'ACESSO À SALA', details: 'Dra. Roberta iniciou a sala virtual para o Agendamento ID ' + id, type: 'info' },
    { timestamp: '14:00:03', action: 'ACESSO À SALA', details: 'Beneficiária Ana Silva Santos ingressou na chamada.', type: 'info' },
    { timestamp: '14:00:04', action: 'CRIPTOGRAFIA E2EE', details: 'Canal seguro estabelecido e chaves WebRTC negociadas.', type: 'success' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- ADICIONAR LOG DE AUDITORIA ---
  const addAuditLog = (action: string, details: string, type: 'info' | 'warning' | 'success' | 'security' = 'info') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAuditLogs(prev => [{ timestamp: timeStr, action, details, type }, ...prev]);
  };

  // --- CONTADOR DE TEMPO DA SESSÃO ---
  useEffect(() => {
    if (simulatedRule !== 'valid') return;
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [simulatedRule]);

  // --- AUTO-SAVE DO PRONTUÁRIO (RN05) ---
  useEffect(() => {
    if (!evolutionText || isLocked) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 2000);
    return () => clearTimeout(timer);
  }, [evolutionText, isLocked]);

  // --- SCROLL PARA O FIM DO CHAT ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- FORMATADOR DE TEMPO ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- ENVIAR MENSAGEM ---
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'professional',
      senderName: 'Dra. Roberta',
      text: inputText,
      timestamp: timeStr
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    addAuditLog('CHAT', 'Mensagem enviada no chat seguro.', 'info');
  };

  // --- SIMULAR ENVIAR ARQUIVO PELO CHAT ---
  const simulateFileUpload = (fileName: string) => {
    setIsUploading(true);
    setUploadProgress(0);
    addAuditLog('ARQUIVO_UPLOAD_START', `Iniciando upload de arquivo: ${fileName}`, 'info');

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const newMsg: ChatMessage = {
              id: Date.now().toString(),
              sender: 'professional',
              senderName: 'Dra. Roberta',
              text: `Enviou um arquivo compartilhado.`,
              timestamp: timeStr,
              attachment: {
                name: fileName,
                size: '1.2 MB',
                version: 1,
                url: '#'
              }
            };
            setMessages(prevMsgs => [...prevMsgs, newMsg]);
            addAuditLog('ARQUIVO_UPLOAD_COMPLETED', `Arquivo ${fileName} criptografado e enviado com sucesso.`, 'success');
          }, 500);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  // --- SIMULAÇÃO DE PERDA DE CONEXÃO E RECONEXÃO ---
  const handleNetworkQualityChange = (quality: 'excellent' | 'poor' | 'disconnected') => {
    setNetworkQuality(quality);
    if (quality === 'disconnected') {
      addAuditLog('REDE_DESCONEXAO', 'Perda súbita de conexão de rede detectada.', 'warning');
      setIsReconnecting(true);
      
      // Auto-reconnect simulation after 4 seconds
      setTimeout(() => {
        setNetworkQuality('excellent');
        setIsReconnecting(false);
        addAuditLog('REDE_RECONEXAO', 'Conexão restabelecida via ICE Restart automático.', 'success');
      }, 4000);
    } else if (quality === 'poor') {
      addAuditLog('REDE_ALERTA', 'Qualidade da conexão oscilando (latência elevada).', 'warning');
    } else {
      addAuditLog('REDE_STATUS', 'Conexão excelente restaurada.', 'info');
    }
  };

  // --- SOLICITAR CONSENTIMENTO DE GRAVAÇÃO (RN03) ---
  const handleRequestRecording = () => {
    if (!recordingReason.trim()) {
      alert('Por favor, informe a justificativa clínica/ética para a gravação da consulta.');
      return;
    }
    setRecordingState('waiting_patient');
    addAuditLog('GRAVAÇÃO_SOLICITADA', `Solicitação de gravação (${recordingType === 'video_audio' ? 'Áudio e Vídeo' : 'Apenas Áudio'}) enviada ao beneficiário. Motivo: "${recordingReason}"`, 'security');

    // Simulate patient consenting after 2.5 seconds
    setTimeout(() => {
      const mockHash = 'sha256-' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      setConsentProofHash(mockHash);
      setRecordingState('recording');
      addAuditLog('GRAVAÇÃO_CONSENTIDA', `Gravação autorizada pela beneficiária Ana Silva Santos. Assinatura do consentimento registrada. Hash: ${mockHash}`, 'success');
    }, 2500);
  };

  // --- PARAR GRAVAÇÃO ---
  const handleStopRecording = () => {
    setRecordingState('idle');
    setRecordingReason('');
    addAuditLog('GRAVAÇÃO_ENCERRADA', `Gravação concluída e arquivada sob criptografia de sessão.`, 'info');
  };

  // --- INTEGRAR GEMINI AI PARA SOAP E RESUMO (RN05) ---
  const handleCallAI = async (type: 'soap' | 'summary') => {
    if (!evolutionText.trim()) {
      alert('Escreva algumas notas rascunhadas no editor de evolução para que a IA possa trabalhar.');
      return;
    }
    setIsAiLoading(true);
    setAiActionType(type);
    addAuditLog('IA_SOLICITACAO', `Chamando Copiloto IA para processamento de texto (${type === 'soap' ? 'Estruturação SOAP' : 'Resumo da Sessão'}).`, 'info');

    try {
      if (type === 'soap') {
        const soapText = await generateSOAP(evolutionText);
        setAiSuggestions(soapText);
        addAuditLog('IA_SUCESSO', 'Evolução estruturada no padrão SOAP gerada pela IA.', 'success');
      } else {
        const summaryText = await generateSummary(evolutionText);
        setAiSuggestions(summaryText);
        addAuditLog('IA_SUCESSO', 'Resumo executivo de sessão clínica gerado pela IA.', 'success');
      }
    } catch (e) {
      console.error(e);
      addAuditLog('IA_ERRO', 'Erro de processamento da IA.', 'warning');
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- APLICAR TEXTO DA IA AO EDITOR ---
  const handleApplyAiText = () => {
    if (!aiSuggestions) return;
    setEvolutionText(prev => {
      const separator = prev ? '\n\n---\n\n' : '';
      return prev + separator + aiSuggestions;
    });
    setAiSuggestions(null);
    setAiActionType(null);
    addAuditLog('IA_APLICAR', 'Sugestão do Copiloto IA integrada ao prontuário pelo profissional.', 'info');
  };

  // --- EMISSÃO E ASSINATURA DE DOCUMENTOS (RN04) ---
  const handleIssueDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docText.trim()) {
      alert('Escreva o conteúdo do documento antes de emitir.');
      return;
    }

    // Cryptographic simulated signature
    const signatureHash = 'CRP-SIGN-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString().substring(8);
    const newDoc: IssuedDocument = {
      id: Date.now().toString(),
      type: docType,
      title: docType === 'receita' ? 'Receita Médica' : docType === 'atestado' ? 'Atestado de Comparecimento' : docType === 'laudo' ? 'Laudo Psicológico' : 'Encaminhamento Clínico',
      content: docText,
      professionalName: docMetadata.professionalName,
      licenseNumber: docMetadata.licenseNumber,
      signatureHash,
      issuedAt: new Date().toLocaleString(),
      sharedWithPatient: true
    };

    setIssuedDocs(prev => [newDoc, ...prev]);
    setDocText('');

    // Automatically post in Chat
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const systemMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'professional',
      senderName: 'Sistema',
      text: `Dra. Roberta emitiu o documento [${newDoc.title}.pdf] assinado digitalmente com sucesso. Chave de Validação: ${signatureHash}.`,
      timestamp: timeStr,
      attachment: {
        name: `${newDoc.title.toLowerCase().replace(/ /g, '_')}.pdf`,
        size: '220 KB',
        version: 1,
        url: '#'
      }
    };
    setMessages(prev => [...prev, systemMsg]);
    addAuditLog('DOCUMENTO_EMITIDO', `${newDoc.title} assinado e liberado para o beneficiário. Assinatura: ${signatureHash}`, 'success');
  };

  // --- BAIXAR DOCUMENTO (DOWNLOAD SIMULADO) ---
  const handleDownloadDoc = (doc: IssuedDocument) => {
    addAuditLog('DOCUMENTO_DOWNLOAD', `Download do documento ID ${doc.id} (${doc.title}) realizado.`, 'info');
    
    // Create text file as mock pdf
    const textContent = `
=========================================
      INSTITUTO SER MELHOR - AURA
=========================================
DOCUMENTO CLÍNICO: ${doc.title.toUpperCase()}
DATA DE EMISSÃO: ${doc.issuedAt}
-----------------------------------------
PROFISSIONAL: ${doc.professionalName}
REGISTRO: ${doc.licenseNumber}
-----------------------------------------
BENEFICIÁRIA: Ana Silva Santos
-----------------------------------------
CONTEÚDO:
${doc.content}

-----------------------------------------
ASSINATURA DIGITAL DO PROFISSIONAL:
Validador ICP-Brasil: ${doc.signatureHash}
Este documento foi emitido durante teleconsulta segura.
=========================================
    `;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.toLowerCase().replace(/ /g, '_')}_assinado.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- TRANCAR PRONTUÁRIO (ASSINATURA E FECHAMENTO) ---
  const handleLockEvolution = () => {
    if (!evolutionText.trim()) {
      alert('Não é possível assinar uma evolução vazia.');
      return;
    }
    if (confirm('Atenção: Ao assinar e trancar a evolução clínica, o registro se tornará imutável no prontuário eletrônico. Confirma a assinatura digital?')) {
      setIsLocked(true);
      addAuditLog('PRONTUÁRIO_TRANCADO', 'Evolução clínica assinada digitalmente com sucesso pelo profissional e trancada no prontuário.', 'success');
    }
  };

  // --- REGRAS DE NEGÓCIO: TRATAMENTO DE ERROS DE ACESSO (RN01, RN02) ---
  if (simulatedRule !== 'valid') {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-stone-100 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-stone-800/80 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Header decor */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
          
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 mx-auto border border-rose-500/20">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <h1 className="text-xl font-bold text-center text-stone-100 mb-2">Acesso Negado (RN01/RN02)</h1>
          <p className="text-sm text-stone-400 text-center mb-6 leading-relaxed">
            A política de segurança da Central Digital impediu a inicialização desta sala de Teleconsulta devido a violações de regras.
          </p>

          <div className="bg-stone-900/60 rounded-2xl p-5 border border-stone-800 space-y-4 mb-6">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500">Agendamento ID:</span>
              <span className="font-mono text-stone-300">{id || 'DESCONHECIDO'}</span>
            </div>
            
            <div className="text-sm">
              <span className="font-semibold text-rose-400 block mb-1">Motivo do Bloqueio:</span>
              {simulatedRule === 'invalid_time' && (
                <span className="text-stone-300 leading-relaxed block">
                  Fora da janela de atendimento permitida. A sala só fica disponível entre 30 minutos antes e até 30 minutos após o horário agendado.
                </span>
              )}
              {simulatedRule === 'invalid_professional' && (
                <span className="text-stone-300 leading-relaxed block">
                  Profissional não autorizado. Suas credenciais não batem com o profissional técnico responsável designado para este beneficiário.
                </span>
              )}
              {simulatedRule === 'invalid_beneficiary' && (
                <span className="text-stone-300 leading-relaxed block">
                  Beneficiário não autorizado ou dados incompatíveis. Registro do beneficiário inativo ou com pendências cadastrais.
                </span>
              )}
              {simulatedRule === 'invalid_status' && (
                <span className="text-stone-300 leading-relaxed block">
                  O agendamento correspondente não está mais ativo (status atual: Cancelado ou Concluído).
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => {
                setSimulatedRule('valid');
                addAuditLog('SIMULADOR', 'Validação de segurança redefinida para válida para testes.', 'info');
              }}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-teal-900/20"
            >
              Simular Acesso Válido
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-stone-700 hover:bg-stone-600 text-stone-300 font-medium rounded-xl transition-all"
            >
              Voltar ao Painel
            </button>
          </div>
        </motion.div>

        {/* Audit logs context for debugging */}
        <div className="mt-8 max-w-lg w-full bg-stone-800/40 border border-stone-700/30 rounded-2xl p-5 text-xs text-stone-400 font-mono">
          <div className="font-semibold text-stone-300 mb-2 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-rose-500" />
            LOGS DE SEGURANÇA IMUTÁVEIS (AUDIT TRAIL):
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            <div>[SECURITY ALERT] {new Date().toLocaleTimeString()} - ACESSO REJEITADO - IP 192.168.1.45 - Tentativa de violação: {simulatedRule.toUpperCase()}</div>
            <div>[AUDIT] {new Date().toLocaleTimeString()} - Sessão ID {id} bloqueada por segurança.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans text-stone-800">
      
      {/* ========================================================================= */}
      {/* 1. SIDEBAR ESQUERDA (20% largura) - PAINEL DO BENEFICIÁRIO & ALERTAS */}
      {/* ========================================================================= */}
      <aside className="w-1/5 min-w-[280px] bg-white border-r border-stone-200 flex flex-col shadow-sm z-10">
        <div className="p-5 border-b border-stone-100 flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500"
            title="Voltar ao Painel"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold text-stone-900 leading-tight">Teleconsulta</h2>
            <p className="text-[10px] text-stone-400 font-mono mt-0.5">ID: {id?.substring(0, 8) || 'CASE-123'}</p>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* Beneficiary Profiler Card */}
          <div className="flex flex-col items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold mb-3 shadow-inner relative">
              AS
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Beneficiário Online" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 text-center">Ana Silva Santos</h3>
            <p className="text-xs text-stone-500 mt-0.5">28 anos • CPF: 123.***.***-00</p>
            <span className="mt-2 text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-medium">Cadastrado Ativo</span>
          </div>

          {/* Trauma-Informed Alertas de Risco */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-1">Alertas e Diretrizes</h4>
            
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-semibold text-rose-800">Alerta de Vulnerabilidade</h5>
                <p className="text-[11px] text-rose-700 mt-0.5 leading-normal">
                  Histórico de violência doméstica física/psicológica. Protocolo Mulheres ativado. Priorize tom de voz acolhedor e seguro.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <h5 className="text-xs font-semibold text-amber-800">Hipótese Diagnóstica</h5>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-semibold">CID-11: 6B40</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-semibold">TEPT</span>
              </div>
            </div>
          </div>

          {/* Painel de Qualidade da Conexão */}
          <div className="p-4 bg-stone-50 border border-stone-200/50 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Qualidade da Conexão</span>
              {networkQuality === 'excellent' && <span className="text-emerald-600 font-semibold flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> Excelente</span>}
              {networkQuality === 'poor' && <span className="text-amber-600 font-semibold flex items-center gap-1"><Wifi className="w-3.5 h-3.5 animate-pulse" /> Instável</span>}
              {networkQuality === 'disconnected' && <span className="text-rose-600 font-semibold flex items-center gap-1"><WifiOff className="w-3.5 h-3.5 animate-bounce" /> Sem Sinal</span>}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 font-mono">
              <div className="bg-white p-2 rounded-lg border border-stone-200/60">
                <span className="block text-stone-400">Latência</span>
                <span className="font-semibold text-stone-700">{networkQuality === 'excellent' ? '42ms' : networkQuality === 'poor' ? '180ms' : '--'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-stone-200/60">
                <span className="block text-stone-400">Perda de Pacote</span>
                <span className="font-semibold text-stone-700">{networkQuality === 'excellent' ? '0.0%' : networkQuality === 'poor' ? '4.8%' : '--'}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. CENTRO ESQUERDA (40% largura) - VIDEOCHAMADA & CONTROLES & CHAT */}
      {/* ========================================================================= */}
      <main className="w-2/5 bg-stone-900 flex flex-col relative shadow-2xl z-20 overflow-hidden border-r border-stone-800">
        
        {/* Top Header Video */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-30">
          <div className="flex items-center gap-2 bg-teal-950/60 text-teal-400 backdrop-blur-md px-3 py-1.5 rounded-full border border-teal-800/40 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            E2EE Criptografado
          </div>
          <div className="flex items-center gap-2 text-stone-300 bg-stone-900/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            {formatTime(sessionTime)}
          </div>
        </div>

        {/* Video stream container */}
        <div className="flex-1 relative flex items-center justify-center bg-stone-950">
          {/* Main Remote Video Mock */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
            {networkQuality === 'disconnected' ? (
              <div className="flex flex-col items-center justify-center text-stone-400 max-w-xs space-y-4">
                <RefreshCw className="w-12 h-12 text-rose-500 animate-spin" />
                <h3 className="font-semibold text-rose-400">Conexão Perdida</h3>
                <p className="text-xs text-stone-500 leading-normal">
                  Sinal interrompido. Tentando restabelecer comunicação por meio de reconexão automática (ICE Restart)...
                </p>
              </div>
            ) : (
              <div className="relative flex flex-col items-center">
                {/* Simulated Webcam Feed (Premium aesthetics) */}
                <div className="w-40 h-40 rounded-full bg-stone-800 flex items-center justify-center mb-4 border-4 border-teal-600/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/20 to-stone-800 animate-pulse" />
                  <span className="text-4xl font-medium text-stone-300 z-10">AS</span>
                  
                  {/* Pulse visual activity */}
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                
                <h3 className="text-lg font-medium text-stone-200">Ana Silva Santos</h3>
                <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Feed de Vídeo HD (WebRTC P2P Ativo)
                </p>

                {/* Subtitle simulator to make telehealth feel super realistic */}
                <div className="mt-6 px-4 py-2.5 bg-black/60 backdrop-blur-sm border border-stone-800 rounded-xl max-w-sm text-xs text-stone-300 font-medium leading-relaxed shadow-lg">
                  <span className="text-teal-400 font-semibold block mb-0.5">Ana (Transcrição em tempo real):</span>
                  "Doutora, tenho me sentido um pouco melhor dormindo, mas o estresse no trabalho continua alto..."
                </div>
              </div>
            )}
          </div>

          {/* Self View (Picture-in-Picture) */}
          <motion.div 
            drag
            dragConstraints={{ left: -120, right: 120, top: -180, bottom: 180 }}
            className="absolute bottom-4 right-4 w-32 h-44 bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-stone-700/60 cursor-grab active:cursor-grabbing z-20 flex flex-col items-center justify-center"
          >
            {isVideoOff ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 text-stone-500">
                <VideoOff className="w-5 h-5 mb-1" />
                <span className="text-[10px]">Câmera Desativada</span>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 relative">
                <div className="absolute inset-0 bg-stone-800 flex items-center justify-center text-stone-500 font-semibold text-xs">
                  Sua Câmera
                </div>
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[8px] text-stone-300">
                  Dra. Roberta (Você)
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Video Control Bar */}
        <div className="h-20 bg-stone-950 border-t border-stone-900 flex items-center justify-center gap-4 px-6 shrink-0 pb-safe z-30">
          <button 
            onClick={() => {
              setIsMuted(!isMuted);
              addAuditLog('CONTROLE_MIDIA', `Microfone ${!isMuted ? 'desativado' : 'ativado'}.`, 'info');
            }}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all",
              isMuted ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 border border-rose-500/30" : "bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-800"
            )}
            title={isMuted ? "Ativar Microfone" : "Silenciar"}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => {
              setIsVideoOff(!isVideoOff);
              addAuditLog('CONTROLE_MIDIA', `Câmera ${!isVideoOff ? 'desativada' : 'ativada'}.`, 'info');
            }}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all",
              isVideoOff ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 border border-rose-500/30" : "bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-800"
            )}
            title={isVideoOff ? "Ativar Câmera" : "Desativar Câmera"}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => {
              setIsScreenSharing(!isScreenSharing);
              addAuditLog('COMPARTILHAMENTO_TELA', `Compartilhamento de tela ${!isScreenSharing ? 'iniciado' : 'interrompido'}.`, 'info');
            }}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all",
              isScreenSharing ? "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30" : "bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-800"
            )}
            title="Compartilhar Tela"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Botão de Gravação de Sessão (RN03) */}
          {recordingState === 'recording' ? (
            <button 
              onClick={handleStopRecording}
              className="px-4 h-11 bg-rose-600 text-white rounded-full flex items-center gap-2 hover:bg-rose-500 transition-colors animate-pulse border border-rose-500 font-medium text-xs shadow-lg shadow-rose-950/50"
            >
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
              Parar Gravação
            </button>
          ) : recordingState === 'requesting_consent' || recordingState === 'waiting_patient' ? (
            <button 
              disabled
              className="px-4 h-11 bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-2 font-medium text-xs"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              Aguardando Aceite...
            </button>
          ) : (
            <button 
              onClick={() => setRecordingState('requesting_consent')}
              className="px-4 h-11 bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded-full flex items-center gap-2 transition-colors font-medium text-xs"
            >
              <Shield className="w-4 h-4 text-teal-500" />
              Gravar Consulta
            </button>
          )}

          <button 
            onClick={() => {
              if (confirm("Encerrar o atendimento e fechar a sala de teleconsulta?")) {
                addAuditLog('SESSÃO_ENCERRADA', 'Profissional encerrou o atendimento clínico remoto.', 'info');
                navigate('/dashboard');
              }
            }}
            className="w-14 h-11 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center transition-colors ml-4 shadow-lg shadow-rose-950/40"
            title="Encerrar Consulta"
          >
            <PhoneMissed className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Modal de consentimento de gravação (RN03) inline para manter split visual */}
        <AnimatePresence>
          {recordingState === 'requesting_consent' && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute inset-x-4 bottom-24 p-5 bg-stone-900 border border-stone-800 rounded-2xl z-40 text-stone-200 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-teal-400" />
                <h4 className="text-sm font-semibold">Consentimento de Gravação (RN03)</h4>
              </div>
              <p className="text-xs text-stone-400 mb-4 leading-normal">
                Nenhuma sessão é gravada por padrão. Para gravar, insira o motivo ético/clínico que será apresentado ao beneficiário para consentimento digital imutável.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">Motivo / Justificativa Clínica</label>
                  <input 
                    type="text" 
                    value={recordingReason}
                    onChange={(e) => setRecordingReason(e.target.value)}
                    placeholder="Ex: Registro clínico para evolução continuada de quadro ansioso grave."
                    className="w-full text-xs bg-stone-950 border-stone-800 rounded-lg text-stone-100 placeholder:text-stone-600 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">Formato de Gravação</label>
                    <select 
                      value={recordingType} 
                      onChange={(e) => setRecordingType(e.target.value as any)}
                      className="w-full text-xs bg-stone-950 border-stone-800 rounded-lg text-stone-100 focus:ring-teal-500"
                    >
                      <option value="video_audio">Vídeo + Áudio completo</option>
                      <option value="audio_only">Apenas Áudio (Sem vídeo)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-800/50">
                  <button 
                    onClick={() => setRecordingState('idle')}
                    className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleRequestRecording}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    Enviar Solicitação
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* CHAT SEGURO E COMPARTILHAMENTO DE ARQUIVOS */}
        {/* ========================================================================= */}
        <section className="h-64 bg-stone-900 border-t border-stone-850 flex flex-col relative">
          <div className="px-4 py-2 border-b border-stone-850 bg-stone-950 flex justify-between items-center text-xs font-medium text-stone-400">
            <span>Conversa Criptografada (Chat Seguro)</span>
            {isUploading && (
              <span className="text-teal-400 animate-pulse flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Carregando arquivo... {uploadProgress}%
              </span>
            )}
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-950/40">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[85%] rounded-2xl p-3 text-xs",
                  msg.sender === 'professional' 
                    ? "ml-auto bg-teal-600/10 text-teal-100 border border-teal-500/20" 
                    : "mr-auto bg-stone-800 text-stone-200 border border-stone-750"
                )}
              >
                <div className="flex items-center justify-between gap-4 font-semibold text-[10px] text-stone-500 mb-1">
                  <span>{msg.senderName}</span>
                  <span>{msg.timestamp}</span>
                </div>
                
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Attachment display */}
                {msg.attachment && (
                  <div className="mt-2.5 p-2 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-950 flex items-center justify-center text-teal-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[11px] truncate text-stone-200">{msg.attachment.name}</p>
                        <p className="text-[9px] text-stone-500">{msg.attachment.size} • Ver. {msg.attachment.version}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => addAuditLog('DOWNLOAD_ANEXO', `Download de arquivo realizado: ${msg.attachment?.name}`, 'info')}
                      className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-stone-200 transition-colors"
                      title="Baixar Arquivo"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input footer */}
          <div className="p-3 bg-stone-950 border-t border-stone-900 flex items-center gap-2">
            {/* Attachment dropdown button simulation */}
            <div className="relative group">
              <button 
                className="p-2 bg-stone-850 border border-stone-800 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-stone-200 transition-colors"
                title="Enviar arquivo"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              {/* Floating menu on hover / click */}
              <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-56 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-2 z-50 text-xs text-stone-400 space-y-1">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-stone-600 border-b border-stone-800 mb-1">
                  Selecione um Arquivo
                </div>
                <button 
                  onClick={() => simulateFileUpload('laudo_neuropsicologico_previo.pdf')}
                  className="w-full text-left p-1.5 hover:bg-stone-800 hover:text-stone-200 rounded-lg transition-colors truncate"
                >
                  📄 laudo_neuropsicologico_previo.pdf
                </button>
                <button 
                  onClick={() => simulateFileUpload('hemograma_completo_paciente.pdf')}
                  className="w-full text-left p-1.5 hover:bg-stone-800 hover:text-stone-200 rounded-lg transition-colors truncate"
                >
                  📄 hemograma_completo_paciente.pdf
                </button>
                <button 
                  onClick={() => simulateFileUpload('relatorio_assistencia_social.pdf')}
                  className="w-full text-left p-1.5 hover:bg-stone-800 hover:text-stone-200 rounded-lg transition-colors truncate"
                >
                  📄 relatorio_assistencia_social.pdf
                </button>
              </div>
            </div>

            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite uma mensagem segura..."
              className="flex-1 text-xs bg-stone-850 border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:ring-teal-500 focus:border-teal-500"
            />
            
            <button 
              onClick={handleSendMessage}
              className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-all shadow-md shadow-teal-950/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </section>

      </main>

      {/* ========================================================================= */}
      {/* 3. CENTRO DIREITA (40% largura) - PAINEL CLÍNICO / PRONTUÁRIO / EMR */}
      {/* ========================================================================= */}
      <section className="w-2/5 bg-white flex flex-col border-l border-stone-200 z-10">
        
        {/* Editor Abas Navigation */}
        <header className="border-b border-stone-200 bg-stone-50/50 flex flex-col">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 text-sm">Prontuário de Atendimento</h3>
                <p className="text-[10px] text-stone-500">Ana Silva Santos</p>
              </div>
            </div>
            
            {/* Auto-save notification badge */}
            <div className="text-xs text-stone-500 flex items-center gap-1 font-mono">
              {isSaving ? (
                <span className="flex items-center gap-1 text-teal-600 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Auto-salvando...
                </span>
              ) : lastSaved ? (
                <span className="text-[10px] text-stone-400">
                  Salvo às {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              ) : (
                <span className="text-[10px] text-stone-300">Alterado</span>
              )}
            </div>
          </div>

          {/* Tabs bar */}
          <nav className="flex px-4 pt-1 bg-stone-100/50">
            <button 
              onClick={() => setActiveTab('evolution')}
              className={cn(
                "px-4 py-2 text-xs font-semibold border-b-2 transition-all",
                activeTab === 'evolution' 
                  ? "border-teal-600 text-teal-700" 
                  : "border-transparent text-stone-500 hover:text-stone-800"
              )}
            >
              Evolução Ativa
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={cn(
                "px-4 py-2 text-xs font-semibold border-b-2 transition-all",
                activeTab === 'documents' 
                  ? "border-teal-600 text-teal-700" 
                  : "border-transparent text-stone-500 hover:text-stone-800"
              )}
            >
              Documentos da Sessão
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-4 py-2 text-xs font-semibold border-b-2 transition-all",
                activeTab === 'history' 
                  ? "border-teal-600 text-teal-700" 
                  : "border-transparent text-stone-500 hover:text-stone-800"
              )}
            >
              Histórico Clínico
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={cn(
                "px-4 py-2 text-xs font-semibold border-b-2 transition-all",
                activeTab === 'audit' 
                  ? "border-teal-600 text-teal-700" 
                  : "border-transparent text-stone-500 hover:text-stone-800"
              )}
            >
              Auditoria
            </button>
          </nav>
        </header>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto p-5 relative">
          <AnimatePresence mode="wait">
            
            {/* TAPA 1: EVOLUÇÃO CLÍNICA COM COPILOT IA */}
            {activeTab === 'evolution' && (
              <motion.div 
                key="evolution"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="h-full flex flex-col gap-4"
              >
                <div className="flex-1 flex flex-col border border-stone-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all bg-stone-50/20">
                  <div className="px-4 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-500">
                    <span className="font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-stone-400" />
                      Editor de Anamnese & Evolução
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <Lock className="w-3.5 h-3.5" /> Assinado & Trancado
                      </span>
                    )}
                  </div>
                  
                  <textarea
                    value={evolutionText}
                    onChange={(e) => setEvolutionText(e.target.value)}
                    disabled={isLocked}
                    placeholder="Escreva a evolução clínica. Ex: Paciente relata melhora gradativa na qualidade do sono. Demonstra bom nível de introspecção na discussão sobre estressores do trabalho. Acordado plano terapêutico focado em exercícios de respiração..."
                    className="flex-1 w-full p-4 resize-none border-0 focus:ring-0 text-stone-800 placeholder:text-stone-400 text-sm leading-relaxed bg-transparent"
                  />
                </div>

                {/* Copiloto IA (Gemini API Integration) */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                      Copiloto IA — Apoio Clínico Integrado
                    </div>
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Gemini 3.5</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Converta suas anotações livres em um relatório estruturado no modelo clínico **SOAP** ou gere um **Resumo da Sessão** com um clique.
                  </p>

                  <div className="flex gap-2.5">
                    <button 
                      onClick={() => handleCallAI('soap')}
                      disabled={isAiLoading || isLocked}
                      className="flex-1 py-2 px-3 bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {isAiLoading && aiActionType === 'soap' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Estruturar SOAP
                    </button>
                    
                    <button 
                      onClick={() => handleCallAI('summary')}
                      disabled={isAiLoading || isLocked}
                      className="flex-1 py-2 px-3 bg-white hover:bg-stone-50 border border-indigo-200 disabled:opacity-50 text-indigo-700 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isAiLoading && aiActionType === 'summary' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      Resumir Sessão
                    </button>
                  </div>

                  {/* AI Output Window */}
                  {aiSuggestions && (
                    <div className="mt-3 bg-white border border-indigo-100 rounded-xl p-4 space-y-3 relative shadow-inner">
                      <div className="flex justify-between items-center text-[10px] text-indigo-600 font-bold border-b border-indigo-50 pb-2">
                        <span>SUGESTÃO DA INTELIGÊNCIA ARTIFICIAL:</span>
                        <span className="text-stone-400 font-medium">Revisão obrigatória pelo profissional</span>
                      </div>
                      
                      <div className="text-xs text-stone-700 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                        {aiSuggestions}
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                        <button 
                          onClick={() => setAiSuggestions(null)}
                          className="px-2.5 py-1 text-[11px] text-stone-500 hover:text-stone-700 font-semibold"
                        >
                          Descartar
                        </button>
                        <button 
                          onClick={handleApplyAiText}
                          className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-lg shadow-sm transition-all"
                        >
                          Aplicar ao Editor
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAPA 2: EMISSÃO DE DOCUMENTOS (RN04) */}
            {activeTab === 'documents' && (
              <motion.div 
                key="documents"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                {/* Form to issue a document */}
                <form onSubmit={handleIssueDocument} className="bg-stone-50 p-4 border border-stone-200 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                    <h4 className="text-xs font-bold text-stone-900 uppercase">Emitir Novo Documento Clínico</h4>
                    <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold">Assinatura Certificada</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">Tipo de Documento</label>
                      <select 
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as any)}
                        className="w-full bg-white border-stone-200 text-xs rounded-lg text-stone-800 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="receita">Receita Médica</option>
                        <option value="atestado">Atestado de Comparecimento</option>
                        <option value="laudo">Laudo Clínico/Psicológico</option>
                        <option value="encaminhamento">Encaminhamento Externo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">Validade do Documento</label>
                      <select 
                        value={docMetadata.validityDays}
                        onChange={(e) => setDocMetadata(prev => ({...prev, validityDays: e.target.value}))}
                        className="w-full bg-white border-stone-200 text-xs rounded-lg text-stone-800 focus:ring-teal-500"
                      >
                        <option value="15">15 Dias</option>
                        <option value="30">30 Dias</option>
                        <option value="60">60 Dias</option>
                        <option value="90">90 Dias</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">Conteúdo Clínico / Recomendações</label>
                    <textarea 
                      value={docText}
                      onChange={(e) => setDocText(e.target.value)}
                      placeholder={
                        docType === 'receita' ? 'Ex: Fluoxetina 20mg ----- Tomar 1 comprimido pela manhã diariamente. Uso contínuo.' :
                        docType === 'atestado' ? 'Ex: Atesto para os devidos fins que a paciente compareceu à sessão de psicoterapia individual no dia 28/06 das 14h às 15h.' :
                        docType === 'laudo' ? 'Ex: Declaro que a paciente foi submetida a avaliação psicológica, apresentando indicativos de Síndrome de Burnout.' :
                        'Ex: Encaminho a paciente a avaliação complementar psiquiátrica em decorrência de agravamento dos sintomas de ansiedade.'
                      }
                      className="w-full h-24 text-xs bg-white border-stone-200 rounded-lg text-stone-800 placeholder:text-stone-400 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-2 text-[10px] text-stone-500">
                    <div className="flex justify-between">
                      <span>Profissional Emissor:</span>
                      <span className="font-semibold text-stone-700">{docMetadata.professionalName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Registro de Classe:</span>
                      <span className="font-semibold text-stone-700">{docMetadata.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-100 pt-1.5 mt-1.5">
                      <span>Validação ICP-Brasil:</span>
                      <span className="font-mono text-teal-650">Geração automática de hash seguro</span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-teal-900/10"
                  >
                    <Shield className="w-4 h-4" />
                    Assinar e Emitir Documento
                  </button>
                </form>

                {/* List of issued documents in this session */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-900 uppercase">Documentos Emitidos Nesta Sessão ({issuedDocs.length})</h4>
                  
                  {issuedDocs.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-stone-200 rounded-2xl text-xs text-stone-400">
                      Nenhum documento emitido até o momento.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {issuedDocs.map((doc) => (
                        <div key={doc.id} className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-xs font-bold text-stone-900">{doc.title}</h5>
                              <p className="text-[10px] text-stone-400 font-mono mt-0.5">Hash: {doc.signatureHash.substring(0, 15)}...</p>
                            </div>
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Assinado
                            </span>
                          </div>

                          <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg font-mono line-clamp-2">
                            {doc.content}
                          </p>

                          <div className="flex gap-2 justify-end pt-1">
                            <button 
                              onClick={() => setSelectedDocForView(doc)}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Visualizar
                            </button>
                            <button 
                              onClick={() => handleDownloadDoc(doc)}
                              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Baixar PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAPA 3: HISTÓRICO CLÍNICO DA PACIENTE */}
            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4 text-xs"
              >
                <h4 className="text-xs font-bold text-stone-900 uppercase">Anotações Terapêuticas Anteriores</h4>
                
                <div className="space-y-3">
                  <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-stone-850">Sessão #4 — Psicoterapia</span>
                      <span className="text-stone-400 font-mono">14/06/2026</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                      Paciente reporta crises de ansiedade semanais disparadas por sobrecarga no trabalho. Refere dificuldades frequentes para manter o sono contínuo. Demonstrou cansaço físico. Focamos em discutir estratégias de limites nas horas extras de trabalho.
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-stone-200/50 flex justify-between items-center text-[10px] text-stone-400">
                      <span>Assinado por: Dra. Roberta (CRP 06/98765-SP)</span>
                      <span className="font-mono text-emerald-650 flex items-center gap-0.5"><Lock className="w-3 h-3" /> ICP-Brasil</span>
                    </div>
                  </div>

                  <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-stone-850">Sessão #3 — Acolhimento Social</span>
                      <span className="text-stone-400 font-mono">07/06/2026</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                      Realizado encaminhamento para assessoria jurídica e apoio psicossocial em decorrência do alerta de vulnerabilidade doméstica. Paciente manifestou receio e pediu sigilo absoluto sobre os atendimentos.
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-stone-200/50 flex justify-between items-center text-[10px] text-stone-400">
                      <span>Assinado por: Assistente Social Fernando (CRESS 1234)</span>
                      <span className="font-mono text-emerald-650 flex items-center gap-0.5"><Lock className="w-3 h-3" /> ICP-Brasil</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAPA 4: LOGS DE AUDITORIA IMUTÁVEIS (RN06) */}
            {activeTab === 'audit' && (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                  <h4 className="text-xs font-bold text-stone-900 uppercase">Trilha de Auditoria Digital (Enterprise)</h4>
                  <span className="text-[9px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">Imutável - LGPD</span>
                </div>
                
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Todos os eventos de controle de acesso, trocas de chaves de criptografia, assinaturas digitais, uploads/downloads de arquivos e acessos a mídia são registrados de forma permanente para integridade médico-legal.
                </p>

                <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-[10px]">
                  {auditLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "p-2.5 rounded-lg border flex flex-col gap-1",
                        log.type === 'security' ? "bg-rose-50 border-rose-100 text-rose-800" :
                        log.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                        log.type === 'warning' ? "bg-amber-50 border-amber-100 text-amber-800" :
                        "bg-stone-50 border-stone-200 text-stone-700"
                      )}
                    >
                      <div className="flex justify-between font-bold text-[9px] border-b border-black/5 pb-1">
                        <span>[{log.action}] {log.timestamp}</span>
                        <span className="uppercase text-[8px]">{log.type}</span>
                      </div>
                      <p className="leading-relaxed">{log.details}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Editor Footer Actions */}
        <footer className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="text-[10px] text-stone-500 max-w-[200px] leading-snug">
            {isLocked ? 'Documento trancado na base de dados.' : 'Salvo na base a cada 2s de inatividade.'}
          </div>
          
          <button 
            onClick={handleLockEvolution}
            disabled={isLocked || !evolutionText.trim()}
            className="flex items-center gap-1.5 bg-teal-650 hover:bg-teal-700 disabled:bg-stone-300 disabled:text-stone-500 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-sm shadow-teal-900/10 transition-all focus:outline-none"
          >
            <Lock className="w-3.5 h-3.5" />
            Assinar e Trancar Evolução
          </button>
        </footer>
      </section>

      {/* ========================================================================= */}
      {/* 4. PAINEL INTEGRADO DE SIMULAÇÃO (FLUTUANTE NO CANTO DA TELA) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-4 left-4 z-50 group">
        <div className="bg-stone-900 text-stone-100 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-stone-800 transition-colors shadow-2xl border border-stone-700">
          <SettingsIcon className="w-5 h-5 text-teal-400 group-hover:rotate-45 transition-transform duration-300" />
        </div>
        
        {/* Expanded simulation control board */}
        <div className="hidden group-hover:block absolute bottom-12 left-0 w-80 bg-stone-900 border border-stone-800 text-stone-200 rounded-2xl shadow-2xl p-4 space-y-4">
          <div className="border-b border-stone-800 pb-2 flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-teal-400 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Painel de Teste de Teleconsulta
            </span>
          </div>

          {/* Test Access Control Validation */}
          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase font-semibold text-stone-500">
              Validar Acesso à Sala (RN01, RN02)
            </label>
            <select 
              value={simulatedRule} 
              onChange={(e) => {
                const rule = e.target.value as any;
                setSimulatedRule(rule);
                if (rule !== 'valid') {
                  addAuditLog('VIOLAÇÃO_REGRA', `Simulação de erro de acesso ativada: ${rule}`, 'warning');
                } else {
                  addAuditLog('ACESSO_VALIDO', 'Simulador resetado para acesso válido.', 'success');
                }
              }}
              className="w-full text-xs bg-stone-950 border-stone-800 rounded-lg text-stone-300 focus:ring-teal-500"
            >
              <option value="valid">Acesso Permitido (Tudo OK)</option>
              <option value="invalid_time">Simular Sessão Inválida: Fora de Horário (RN01)</option>
              <option value="invalid_professional">Simular Sessão Inválida: Profissional Não Autorizado (RN02)</option>
              <option value="invalid_beneficiary">Simular Sessão Inválida: Beneficiário Incorreto (RN02)</option>
              <option value="invalid_status">Simular Sessão Inválida: Agendamento Cancelado</option>
            </select>
          </div>

          {/* Test Network Fluctuation */}
          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase font-semibold text-stone-500">
              Qualidade da Rede (Latência & Sinal)
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button 
                onClick={() => handleNetworkQualityChange('excellent')}
                className={cn(
                  "py-1 rounded text-[10px] font-semibold transition-colors",
                  networkQuality === 'excellent' ? "bg-emerald-600 text-white" : "bg-stone-950 text-stone-400 hover:bg-stone-800"
                )}
              >
                Excelente
              </button>
              <button 
                onClick={() => handleNetworkQualityChange('poor')}
                className={cn(
                  "py-1 rounded text-[10px] font-semibold transition-colors",
                  networkQuality === 'poor' ? "bg-amber-600 text-white" : "bg-stone-950 text-stone-400 hover:bg-stone-800"
                )}
              >
                Instável
              </button>
              <button 
                onClick={() => handleNetworkQualityChange('disconnected')}
                className={cn(
                  "py-1 rounded text-[10px] font-semibold transition-colors",
                  networkQuality === 'disconnected' ? "bg-rose-600 text-white" : "bg-stone-950 text-stone-400 hover:bg-stone-800"
                )}
              >
                Queda (4s)
              </button>
            </div>
          </div>

          <div className="p-3 bg-stone-950 rounded-xl text-[10px] text-stone-500 leading-normal border border-stone-800">
            Use estes controles para validar as regras e mecânicas descritas na documentação do projeto de maneira rápida e interativa.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL DE PRÉ-VISUALIZAÇÃO DE DOCUMENTOS EMITIDOS */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedDocForView && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full overflow-hidden shadow-2xl"
            >
              {/* Modal header */}
              <div className="px-6 py-4 bg-stone-50 border-b border-stone-250 flex justify-between items-center">
                <span className="text-xs font-bold text-stone-900 uppercase">Visualização de Documento Assinado</span>
                <button 
                  onClick={() => setSelectedDocForView(null)}
                  className="text-stone-400 hover:text-stone-600 font-bold text-sm"
                >
                  Fechar
                </button>
              </div>

              {/* Document Layout (Simulando folha timbrada) */}
              <div className="p-8 space-y-6">
                <div className="border border-stone-300 p-6 space-y-6 bg-white font-serif leading-relaxed text-xs">
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-[13px] tracking-wide text-stone-800 uppercase font-sans">Instituto Ser Melhor</h3>
                    <p className="text-[10px] font-sans text-stone-500">Plataforma Integrada Aura • Telemedicina & Cuidado Social</p>
                  </div>
                  
                  <div className="border-t border-b border-stone-300 py-3 text-center uppercase font-bold tracking-widest text-stone-800">
                    {selectedDocForView.title}
                  </div>

                  <div className="space-y-3 font-sans text-[11px] text-stone-700">
                    <div>
                      <span className="font-semibold text-stone-900">Profissional Emissor:</span> {selectedDocForView.professionalName}
                    </div>
                    <div>
                      <span className="font-semibold text-stone-900">Registro Profissional:</span> {selectedDocForView.licenseNumber}
                    </div>
                    <div>
                      <span className="font-semibold text-stone-900">Beneficiário:</span> Ana Silva Santos
                    </div>
                    <div>
                      <span className="font-semibold text-stone-900">Data de Emissão:</span> {selectedDocForView.issuedAt}
                    </div>
                  </div>

                  <div className="text-xs text-stone-800 py-4 leading-relaxed font-mono whitespace-pre-wrap bg-stone-50 p-4 border border-stone-200/80 rounded-xl">
                    {selectedDocForView.content}
                  </div>

                  <div className="border-t border-stone-250 pt-4 space-y-2 text-center text-[10px] font-sans text-stone-500">
                    <p className="font-semibold text-stone-800 uppercase">Assinatura Certificada Digitalmente</p>
                    <p className="font-mono text-emerald-650 font-bold">{selectedDocForView.signatureHash}</p>
                    <p>Este documento possui valor legal certificado conforme regulação ICP-Brasil.</p>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2">
                <button 
                  onClick={() => setSelectedDocForView(null)}
                  className="px-4 py-2 border border-stone-250 text-stone-600 text-xs font-semibold rounded-xl hover:bg-stone-100 transition-colors"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => {
                    handleDownloadDoc(selectedDocForView);
                    setSelectedDocForView(null);
                  }}
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-500 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Documento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
