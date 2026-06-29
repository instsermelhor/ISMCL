# ESPECIFICAÇÃO TÉCNICA — MÓDULO DE PRONTUÁRIO ELETRÔNICO (EMR) E SIGILO MULTIDISCIPLINAR
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Status:** DRAFT
**Foco:** Gestão Clínica, Evolução Multidisciplinar, Sigilo (LGPD/CFM/CRP) e UX Acolhedora.

---

## 1. CONCEITO E DIRETRIZES DO MÓDULO EMR
O Módulo de Prontuário Eletrônico (EMR - Electronic Medical Record) do Projeto Aura é o coração do cuidado assistencial. Ele foi desenhado para suportar atuação multidisciplinar (Psicologia, Psiquiatria, Serviço Social, Direito) mantendo **barreiras rigorosas de sigilo**.

*   **Humanização e Baixo Atrito:** A interface clínica não deve parecer um sistema de faturamento hospitalar. O foco visual da tela é a "História do Beneficiário" (Linha do Tempo) e a área de redação da evolução clínica.
*   **Sigilo por Padrão (Need-to-Know Basis):** O conteúdo da nota clínica de um psicólogo é invisível para o assistente social, a menos que o psicólogo gere um "Resumo Compartilhado" expressamente autorizado pelo paciente.
*   **Imutabilidade (Compliance CFM/CRP):** Uma evolução, após assinada e fechada, **nunca** pode ser apagada ou editada. Qualquer correção exige a emissão de uma "Errata" (Versionamento Apendicular).

---

## 2. ARQUITETURA FUNCIONAL

### 2.1. A Linha do Tempo Unificada (Timeline)
O coração da interface do EMR é uma Timeline cronológica do "Caso".
*   **O que aparece:** Eventos de acolhimento, agendamentos, teleconsultas realizadas, formulários respondidos, evoluções clínicas (filtradas por permissão) e anexos médicos.
*   **Visualização Multidisciplinar:** Profissionais diferentes enxergam a *mesma* Timeline, mas com **lentes diferentes**. O Psiquiatra verá a existência de uma sessão de Psicoterapia na data X, mas o *conteúdo* da evolução estará bloqueado com um ícone de cadeado.

### 2.2. Estrutura do Prontuário
O Prontuário é composto pelas seguintes sub-entidades lógicas:
1.  **Ficha de Rosto (SSOT):** Dados sociodemográficos consumidos em tempo real do Cadastro Mestre.
2.  **Anamnese e Avaliação Inicial:** Formulários estruturados aplicados no acolhimento (Histórico familiar, queixa principal, rastreio de risco estruturado - ex: ideação suicida).
3.  **Evolução Contínua (Notas de Sessão):** Onde o profissional redige o que aconteceu no encontro. Pode seguir o formato livre ou estruturado (SOAP - *Subjective, Objective, Assessment, Plan*).
4.  **Hipóteses Diagnósticas:** Gestão de quadros clínicos (CID-10, CID-11, DSM-5).
5.  **Anexos e Mídias:** Upload seguro (S3 com pre-signed URLs restritas e criptografia AES) de exames, laudos antigos, desenhos de crianças (terapia infantil), áudios autorizados.
6.  **Prescrições e Documentos:** Receitas, Atestados e Encaminhamentos emitidos com assinatura eletrônica.

---

## 3. REGRAS DE NEGÓCIO E SEGURANÇA (ABAC & ENCRYPTION)

### 3.1. Criptografia a Nível de Aplicação (Application-Level Encryption)
Para garantir que nem mesmo um Administrador de Banco de Dados (DBA) ou um Super Administrador da plataforma consiga ler o conteúdo de uma terapia:
*   Os campos de texto rico da evolução (`content_encrypted`) são criptografados pelo backend *antes* de serem salvos no PostgreSQL.
*   As chaves de criptografia são derivadas do contexto do "Caso" e gerenciadas pelo AWS KMS (Key Management Service).

### 3.2. Fluxo de Evolução e Assinatura Eletrônica
1.  **Rascunho (Draft):** Enquanto o profissional digita, o sistema realiza autosave a cada 10 segundos como "Rascunho". Apenas o autor enxerga.
2.  **Assinatura e Fechamento:** O profissional clica em "Assinar e Fechar Evolução". O sistema aplica um Hash SHA-256 no conteúdo, adiciona o Timestamp do servidor e a identificação do autor.
3.  **Assinatura Digital Avançada/Qualificada (ICP-Brasil):** Se o documento for um Laudo Psiquiátrico, Receita Branca Especial ou Receita Azul, o sistema exige o PIN/Token do certificado digital ICP-Brasil (A1/A3 ou Nuvem) do médico.

### 3.3. Compartilhamento Intra-Caso (Interconsulta)
*   **Regra de Ouro:** O compartilhamento não é da "Nota de Psicoterapia", mas sim de um "Sumário de Transferência de Cuidados".
*   O psicólogo redige um "Resumo para Equipe" e o marca como `VISIBILITY = MULTIDISCIPLINARY`.
*   O assistente social que atua no mesmo caso poderá ler este resumo para nortear sua intervenção, preservando o material bruto e sigiloso da terapia.

---

## 4. EXPERIÊNCIA DO USUÁRIO (UX/UI) NO PRONTUÁRIO

### 4.1. Redução de Carga Cognitiva
*   **Focus Mode:** Ao iniciar a digitação de uma evolução, a interface oculta menus laterais e barras de ferramentas complexas, deixando apenas o editor de texto rico no centro da tela.
*   **Prevenção de Perdas:** Sistema intercepta tentativas de fechar a aba do navegador ("Você tem alterações não salvas").
*   **Acessibilidade (Design Acolhedor):** Contrastes suaves, fontes grandes (Inter/Space Grotesk), zero uso de jargões técnicos complexos em botões de ação ("Salvar e Trancar" em vez de "Commit Evolution Data").

### 4.2. Fluxo de Teleconsulta + EMR Side-by-Side
O sistema prevê uma "Split View" (Tela Dividida):
*   **Esquerda:** O vídeo WebRTC rodando fluidamente (o paciente).
*   **Direita:** O editor de Evolução e a Linha do Tempo.
O profissional não precisa alternar janelas para ver o histórico do paciente durante a videochamada.
