# ESPECIFICAÇÃO TÉCNICA — MÓDULO DE TELEATENDIMENTO E INTEGRAÇÃO WHATSAPP
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Status:** DRAFT
**Foco:** WebRTC, Resiliência, Fallbacks e Integração Assistencial

---

## 1. ARQUITETURA DO TELEATENDIMENTO (VIDEOCHAMADA)

A teleconsulta psicológica e psiquiátrica exige alta fidelidade de áudio e privacidade rigorosa. 

### 1.1. Motor WebRTC (SFU)
A plataforma utilizará uma arquitetura SFU (Selective Forwarding Unit) via **LiveKit** ou **Mediasoup**.
*   **Por que SFU?** Diferente do Mesh (P2P clássico), o SFU roteia o tráfego por um servidor central, consumindo menos banda do dispositivo do beneficiário (vital para pessoas em vulnerabilidade social com planos de dados limitados).
*   **Qualidade de Serviço (QoS):** O servidor ajusta dinamicamente a resolução do vídeo (Simulcast) baseado na banda disponível do usuário, priorizando a manutenção do **áudio limpo**, que é fundamental no atendimento psicológico.

### 1.2. Recursos da Sala Segura
*   **Sala de Espera (Waiting Room):** O beneficiário entra em uma sala virtual e aguarda. O psicólogo recebe a notificação e autoriza a entrada, validando a identidade.
*   **Criptografia End-to-End (E2EE):** As streams de áudio e vídeo são criptografadas (SRTP) do browser do paciente até o servidor SFU, e do SFU até o profissional.
*   **Reconexão Automática (Ice Restart):** Quedas curtas de internet disparam reconexões invisíveis, sem necessidade de atualizar a página.
*   **Chat Efêmero:** O chat durante a consulta é volátil. Mensagens não são armazenadas no banco de dados pós-sessão por segurança, exceto links e arquivos que são migrados para o EMR (Prontuário).

---

## 2. A REGRA ESPECIAL: WHATSAPP BUSINESS API & FALLBACKS

O Instituto Ser Melhor utilizará a **WhatsApp Business API oficial (Cloud API)** para facilitar a comunicação, porém respeitando limitações contratuais e técnicas cruciais da Meta para saúde.

### 2.1. O que o WhatsApp FARÁ na plataforma:
*   **Notificações Transacionais:** Lembretes de agendamento (24h e 1h antes).
*   **Confirmação de Presença:** Botões interativos ("Sim, confirmo" / "Não, quero reagendar").
*   **Acolhimento Assíncrono:** Triagem automatizada (Chatbot NLP) para categorização inicial de risco e direcionamento de fila de espera.
*   **Envio de Links Seguros:** Entrega de convites para a videochamada e compartilhamento de receitas (com senha).

### 2.2. A Limitação (O que o WhatsApp NÃO fará):
*   **A API oficial do WhatsApp NÃO permite iniciar videochamadas programaticamente (via código)** entre a conta empresarial (Instituto) e o paciente, garantindo gravação nativa ou controles de prontuário simultâneo.

### 2.3. O Fallback Operacional Obrigatório (Fluxo de Contorno)
Como contornamos isso mantendo o baixo atrito para o beneficiário?
1. O sistema envia uma mensagem no WhatsApp: *"Olá [Nome], sua sessão com o psicólogo iniciará em 5 minutos. Clique no link seguro abaixo para entrar na sala."*
2. O beneficiário clica no link (ex: `meet.institutosermelhor.org.br/t/xyz123`).
3. O link abre o **Navegador Nativo** (Chrome/Safari) dentro do próprio celular (ou in-app browser do WhatsApp).
4. O WebRTC inicia perfeitamente no navegador, exigindo apenas a permissão de câmera/microfone, sem necessidade de baixar nenhum aplicativo (Zero-Install).
5. O Psicólogo atende pela plataforma Web desktop, tendo o Prontuário ao lado do vídeo.

---

## 3. FLUXO DE INCIDENTES (PLAYBOOK SRE PARA TELESAÚDE)

*   **Cenário A: Beneficiário sem internet para Vídeo.**
    *   *Ação do Sistema:* Detecta degradação de pacote (Packet Loss > 15%). O sistema sugere desligar a câmera para poupar banda ("Audio-only mode fallback").
*   **Cenário B: Falha cataclísmica no servidor WebRTC (LiveKit).**
    *   *Ação do Sistema:* O frontend exibe uma tela amigável e o backend dispara imediatamente um SMS com link de fallback para Google Meet (configurado emergencialmente via API do Workspace) ou um número 0800 de emergência psiquiátrica.
