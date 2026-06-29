# BACKLOG DO PRODUTO, ÉPICOS E ROADMAP (FASES DE ROLLOUT)
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Status:** DRAFT

---

## 1. PROPOSTA DE ROADMAP EM FASES (12 MESES)

### Fase 0: Discovery & Compliance Mapping (Mês 1)
*   Mapeamento de vulnerabilidades (LGPD, Marco Civil, Normativas de Telepsicologia CRP/CFM).
*   Design System (Aura UI) focado em WCAG AA e fluxos de tela para validação (Figma).
*   Provisionamento de Infraestrutura AWS (EKS, RDS, VPCs isoladas) com Terraform.

### Fase 1: MVP Social e Gestão Básica (Mês 2 ao Mês 4)
*   **Portal Administrativo:** Autenticação MFA, RBAC.
*   **Cadastro Mestre (SSOT):** Inserção de Beneficiários e Voluntários. Gestão do perfil social e rede de apoio.
*   **Gestão de Casos:** Criação de fluxos e alocação de profissionais.

### Fase 2: MVP Clínico e Telemedicina (Mês 5 ao Mês 8)
*   **Portal Clínico:** Ficha cega (sem finanças) para psicólogos/psiquiatras.
*   **Prontuário (EMR):** Rascunho, Assinatura Eletrônica, Criptografia, Erratas e Trilha de Auditoria (Break-Glass).
*   **Teleconsulta WebRTC:** Infra LiveKit com Split-view.
*   **Integração WhatsApp:** Lembretes de agendamento via Cloud API oficial + Fallbacks.

### Fase 3: EAD, Sustentabilidade e Dados (Mês 9 ao Mês 12)
*   **EAD/Projetos:** Portal de conteúdos para Beneficiários.
*   **Captação:** Módulo de gestão de Doadores e Emendas Parlamentares.
*   **Business Intelligence:** Painéis de Indicadores Sociais (Anonimizados).
*   **Assinatura Qualificada (ICP-Brasil):** Para receitas controladas de Psiquiatria (Tarja Preta/Azul).

---

## 2. BACKLOG - ÉPICOS E HISTÓRIAS DE USUÁRIO

### ÉPICO 1: GESTÃO E SEGURANÇA INSTITUCIONAL
*   **Feature:** Login e Controle de Acessos Isolado.
    *   *US 1.1:* Como Super Administrador, eu quero logar no Portal Admin usando MFA, para garantir acesso seguro e exclusivo aos dados institucionais.
    *   *US 1.2:* Como Psicólogo voluntário, eu quero logar no Portal Clínico, para acessar APENAS a minha agenda e os casos nos quais estou alocado.

### ÉPICO 2: CADASTRO SOCIAL E ACOLHIMENTO
*   **Feature:** Single Source of Truth do Beneficiário.
    *   *US 2.1:* Como Assistente Social, quero registrar os dados socioeconômicos, rede de apoio e medidas protetivas de um beneficiário na ficha mestre.
    *   *Critério de Aceite:* Ao cadastrar a vulnerabilidade como "Violência Doméstica", o botão de pânico é habilitado no portal do beneficiário.

### ÉPICO 3: PRONTUÁRIO ELETRÔNICO (EMR)
*   **Feature:** Evolução Clínica Sigilosa e Imutável.
    *   *US 3.1:* Como Psicólogo, eu quero redigir notas clínicas que salvam sozinhas (draft), para não perder minhas anotações na sessão.
    *   *US 3.2:* Como Psicólogo, eu quero assinar a evolução clínica de forma que o sistema aplique criptografia e bloqueie edição, garantindo o sigilo legal.
    *   *US 3.3:* Como Super Administrador, eu preciso abrir um prontuário sigiloso mediante ordem judicial. O sistema deve exigir justificativa e gerar alerta de auditoria inapagável.

### ÉPICO 4: TELEATENDIMENTO E MULTICANAL
*   **Feature:** Videochamada e WhatsApp.
    *   *US 4.1:* Como Paciente em zona de baixa conectividade, quero acessar a consulta por vídeo sem instalar aplicativos, a partir de um link seguro.
    *   *US 4.2:* Como Sistema, devo enviar links curtos temporários via WhatsApp Business API 5 minutos antes da consulta, avisando sobre a limitação do vídeo nativo.

### ÉPICO 5: RELATÓRIOS E IMPACTO SOCIAL
*   **Feature:** Painel de Indicadores.
    *   *US 5.1:* Como Diretor do Instituto, quero extrair um dashboard mostrando o total de atendimentos por vulnerabilidade sem expor nomes (anonimizado), para apresentar aos financiadores.
