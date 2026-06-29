export const phasesData = [
  {
    id: 'fase-1',
    number: 1,
    title: 'Requisitos e Escopo',
    status: 'completed',
    content: `
# Levantamento de Requisitos

A plataforma do Instituto Ser Melhor foi concebida para ser um ambiente digital seguro, acolhedor e altamente eficiente. Abaixo estão os requisitos fundamentais para garantir a excelência no cuidado humano e na gestão institucional.

## Requisitos Funcionais

### 1. Gestão de Identidade e Acessos
- **Perfis de Usuário:** Criação de perfis granulares (Super Admin, Admin, Coordenador, Gestor, Psicólogo, Psiquiatra, Assistente Social, Advogado, Médico, Pedagogo, Voluntário, Paciente/Beneficiário).
- **Controle de Acesso Baseado em Atributos (ABAC):** Acesso a prontuários estritamente limitado ao profissional responsável e mediante autenticação forte.

### 2. Módulo de Beneficiários e Casos
- **Cadastro Holístico:** Dados pessoais, contatos de emergência, histórico social, rede de apoio e vulnerabilidades.
- **Gestão de Casos (Case Management):** Visão multidisciplinar do assistido, permitindo que diferentes especialistas colaborem no mesmo "Caso" sem ferir o sigilo profissional de suas anotações específicas.
- **Plano Terapêutico e Social:** Acompanhamento de metas e evolução do beneficiário.

### 3. Prontuário Eletrônico de Saúde (PES)
- **Registro Clínico Completo:** Anamnese, avaliações, hipóteses diagnósticas (CID-11/DSM-5), evoluções e prescrições.
- **Imutabilidade e Versionamento:** Nenhuma evolução clínica pode ser apagada sem deixar rastro. Edições criam novas versões com trilha de auditoria completa.
- **Gestão Documental:** Upload seguro de exames, laudos e termos de consentimento.

### 4. Teleatendimento
- **Consultório Virtual:** Videochamadas integradas com sala de espera virtual, transmitindo segurança e tranquilidade.
- **Comunicação Assíncrona:** Chat seguro integrado, com retenção controlada de mensagens.
- **Notificações Humanizadas:** Lembretes via WhatsApp (API Oficial) com linguagem acolhedora.

### 5. Módulo de Voluntários e Profissionais
- **Onboarding e Credenciamento:** Verificação de registros profissionais (CRP, CRM, OAB).
- **Gestão de Escalas:** Controle de disponibilidade e alocação de horas voluntárias.

### 6. Inteligência Artificial e BI
- **IA de Apoio Clínico e Administrativo:** Ferramentas para OCR de documentos, sumarização de grandes históricos sociais, busca semântica em bases de conhecimento e sugestão estrutural de evoluções (sempre com validação humana).
- **Dashboards de Impacto:** Métricas em tempo real sobre atendimentos, demografia e horas doadas.

## Requisitos Não Funcionais

### 1. Segurança e Privacidade (Privacy by Design)
- **Criptografia:** AES-256 para dados em repouso (banco de dados e arquivos) e TLS 1.3 para dados em trânsito.
- **Anonimização e LGPD:** Mascaramento de dados sensíveis em ambientes de teste e relatórios. Gestão rigorosa de consentimentos.
- **Auditoria Contínua:** Logs imutáveis de todos os acessos a prontuários e exportações de dados.

### 2. Experiência do Usuário (UX/UI)
- **Acessibilidade:** Conformidade com WCAG 2.1 AA.
- **Design Emocional:** Interface desenhada para não parecer um "sistema hospitalar". Uso de tons pastéis, tipografia limpa, espaços em branco respiráveis e microinterações que transmitem calma.

### 3. Resiliência e Escalabilidade
- **Alta Disponibilidade:** Arquitetura em nuvem (Cloud-Native) com auto-scaling para absorver picos de demanda em campanhas do Instituto.
- **Recuperação de Desastres:** Backups automatizados georredundantes com RTO e RPO mínimos.
    `
  },
  {
    id: 'fase-2',
    number: 2,
    title: 'Arquitetura do Sistema',
    status: 'completed',
    content: `
# Definição de Arquitetura Enterprise

Para atender aos pilares de escalabilidade, segurança e impacto social, a arquitetura do projeto foi desenhada utilizando o padrão de **Monólito Modular Evolutivo**, preparado para uma transição fluida para Microsserviços no futuro.

## Por que Monólito Modular?
No momento inicial de uma organização do terceiro setor, gerenciar a complexidade de dezenas de microsserviços pode onerar a equipe técnica e infraestrutura. O Monólito Modular garante a separação estrita de domínios (Bounded Contexts) no código (ex: Módulo de Prontuário nunca acessa diretamente o banco do Módulo Financeiro), permitindo extração para serviços independentes quando a carga exigir, mantendo o custo operacional inicial baixo.

## Stack Tecnológica Recomendada

### 1. Frontend (Interface do Usuário)
- **Framework:** React com TypeScript.
- **Estilização:** Tailwind CSS para rápida prototipagem e consistência de design (Design System próprio).
- **Gerenciamento de Estado:** React Query para estado de servidor e Zustand para estado global local.
- **Performance:** Single Page Application (SPA) empacotada com Vite, com suporte a PWA (Progressive Web App) para funcionamento offline de recursos básicos (ex: leitura de cartilhas de apoio).

### 2. Backend (Core e APIs)
- **Framework:** Node.js com NestJS (TypeScript). O NestJS impõe uma arquitetura sólida, injeção de dependências e tipagem estrita, ideal para aplicações Enterprise críticas.
- **Comunicação:** API RESTful para o frontend e integrações padrão. GraphQL para dashboards complexos do BI.

### 3. Persistência de Dados
- **Banco de Dados Principal:** PostgreSQL. Excelente suporte a transações ACID, integridade referencial (essencial para prontuários) e recursos de JSONB para formulários dinâmicos.
- **Cache e Sessões:** Redis. Utilizado para controle de sessões, rate-limiting e cache de consultas pesadas de BI.
- **Armazenamento de Objetos:** AWS S3 (ou equivalente GCP Cloud Storage). Armazenamento de fotos, laudos em PDF e vídeos, configurado com políticas de acesso restrito (Pre-Signed URLs).

### 4. Arquitetura de Segurança
- **Zero Trust:** Nenhuma requisição é confiável por padrão. Validação de token JWT de curta duração com Refresh Tokens rotacionados.
- **Proteção de Camada 7:** WAF (Web Application Firewall) para mitigar ataques DDoS e injeções de SQL.

### 5. Infraestrutura e DevOps
- **Conteinerização:** Docker para padronização de ambientes de desenvolvimento e produção.
- **Orquestração:** AWS ECS (Fargate) ou Google Cloud Run (Serverless Containers). Reduz a necessidade de gestão de servidores, cobrando apenas pelo uso, ideal para a sustentabilidade financeira da ONG.
- **CI/CD:** GitHub Actions para testes automatizados, análise estática de segurança (SAST) e deploys contínuos.
    `
  },
  {
    id: 'fase-3',
    number: 3,
    title: 'Mapa de Módulos',
    status: 'completed',
    content: `
# Mapa Estrutural de Módulos (Bounded Contexts)

A plataforma será dividida logicamente nos seguintes módulos principais. Cada módulo possui responsabilidades únicas e comunica-se com os outros preferencialmente através de eventos ou interfaces bem definidas.

## 1. Core & IAM (Identity and Access Management)
Responsável pela segurança, controle de acesso e configurações sistêmicas.
- Gestão de Usuários, Senhas e MFA (Autenticação Multifator).
- Controle de Perfis (RBAC - Role-Based Access Control) e Permissões de contexto.
- Auditoria Global (Logs imutáveis de ações críticas).

## 2. Beneficiários & Gestão de Casos
O coração do acolhimento.
- Cadastro e Histórico Longitudinal.
- Matriz de Vulnerabilidade e Rede de Apoio.
- Gerenciamento de "Casos" (agrupamento de necessidades de um beneficiário ou família).

## 3. Prontuário Eletrônico de Saúde (PES)
Isolado com a mais alta camada de segurança.
- Anotações e Evoluções Clínicas.
- Assinatura Eletrônica e Certificação (ICP-Brasil).
- Gestão de CID/DSM, Prescrições e Receituários.

## 4. Voluntariado & Profissionais
- Portal de Onboarding do Voluntário.
- Validação de Credenciais (CRM, CRP, OAB).
- Gestão de Agendas, Plantões e Controle de Horas Doadas.

## 5. Telemedicina e Comunicação
- Gateway de Videochamadas Seguras (WebRTC).
- Mensageria Interna Criptografada.
- Integrações Omnichannel (WhatsApp API Oficial para lembretes transacionais e triagem via bot acolhedor).

## 6. Administrativo & Financeiro
- Gestão de Doações, Patrocínios e Editais.
- Fluxo de Caixa e Centros de Custos.
- Portal de Transparência e Prestação de Contas.

## 7. LMS (Learning Management System)
Capacitação e apoio psicoeducacional.
- Trilha de cursos para voluntários.
- Biblioteca de recursos e cartilhas para beneficiários (ex: material sobre ciclo de violência, autocuidado).

## 8. IA & Analytics
- Dashboards Gerenciais e Relatórios de Impacto Social.
- Serviços de IA Integrados (transcrição consentida, sumarização de histórico, busca inteligente).
    `
  },
  {
    id: 'fase-4',
    number: 4,
    title: 'Modelagem do Banco de Dados',
    status: 'completed',
    content: `
# Modelagem de Banco de Dados (PostgreSQL)

A modelagem de dados foi desenhada priorizando o **isolamento do dado clínico**, **integridade referencial** e **rastreabilidade**.

## Esquemas (Schemas)

Para garantir segurança e organização no monólito modular, o banco de dados utilizará *Schemas* lógicos do PostgreSQL:
- \`iam\`: Gestão de identidades, usuários, permissões e sessões.
- \`social\`: Dados de beneficiários, família, vulnerabilidades e gestão de casos.
- \`clinical\`: **Estritamente confidencial.** Prontuários, evoluções e laudos. Acesso restrito a profissionais de saúde.
- \`management\`: Voluntários, financeiro, projetos e doações.

## Principais Entidades

### Schema: \`iam\` (Identity)
- **Users**: \`id\`, \`email\`, \`password_hash\`, \`mfa_secret\`, \`status\`, \`created_at\`.
- **Roles**: \`id\`, \`name\`, \`description\`.
- **UserRoles**: Relacionamento N:N.
- **AuditLogs**: \`id\`, \`user_id\`, \`action\`, \`resource\`, \`ip_address\`, \`timestamp\`, \`diff_json\`. (Tabela *Append-Only*).

### Schema: \`social\` (Cuidado Social)
- **Beneficiaries**: \`id\`, \`full_name\`, \`cpf\`, \`birth_date\`, \`gender\`, \`address_jsonb\`, \`emergency_contact\`.
- **VulnerabilityAssessments**: \`id\`, \`beneficiary_id\`, \`risk_level\`, \`factors_jsonb\`, \`assessed_by\`, \`date\`.
- **SocialCases**: Agrupa o atendimento de um beneficiário ou família. \`id\`, \`beneficiary_id\`, \`status\` (Aberto, Em Acompanhamento, Encerrado).

### Schema: \`clinical\` (Saúde Mental - Sigilo)
- **MedicalRecords (Prontuário)**: \`id\`, \`beneficiary_id\`, \`created_at\`.
- **ClinicalEvolutions**: \`id\`, \`record_id\`, \`professional_id\`, \`content_encrypted\`, \`cid_11\`, \`timestamp\`, \`version\`. *Nunca sofre DELETE, apenas INSERT com nova versão.*
- **Prescriptions**: \`id\`, \`record_id\`, \`professional_id\`, \`medication_details\`, \`digital_signature_hash\`.

### Schema: \`management\` (Gestão)
- **Volunteers**: \`id\`, \`user_id\`, \`professional_registry\` (CRP, CRM), \`specialties\`, \`available_hours\`.
- **Appointments**: \`id\`, \`beneficiary_id\`, \`volunteer_id\`, \`scheduled_time\`, \`status\`, \`telehealth_url\`.

## Estratégia de Proteção (LGPD)
- **Soft Deletes**: Deleção lógica utilizando a coluna \`deleted_at\`.
- **Criptografia em Nível de Coluna**: O campo \`content_encrypted\` na tabela \`ClinicalEvolutions\` pode utilizar criptografia transparente (TDE) ou a nível de aplicação antes de persistir, protegendo contra vazamentos de dumps de banco de dados.
    `
  },
  {
    id: 'fase-5',
    number: 5,
    title: 'Diagramas de Arquitetura',
    status: 'completed',
    content: `
# Diagramas de Arquitetura (Modelo C4)

A arquitetura foi documentada seguindo o modelo C4 para clareza em diferentes níveis de abstração.

## 1. Contexto do Sistema (Level 1)
O Instituto Ser Melhor se posiciona como o orquestrador do ecossistema.

- **Usuários:** Beneficiários, Voluntários (Psicólogos, Assistentes Sociais), Administradores.
- **Sistema Principal:** *Projeto Aura*.
- **Sistemas Externos:**
  - *WhatsApp Business API*: Para notificações e lembretes de consultas.
  - *ICP-Brasil / Certificadora*: Para assinatura digital de laudos e receitas.
  - *AWS S3 / Cloud Storage*: Armazenamento de arquivos e documentos anexos.
  - *Gateway de Pagamento*: Para recebimento de doações.

## 2. Diagrama de Containers (Level 2)

A infraestrutura foi desenhada para rodar em nuvem de forma escalável.

1. **Web Application (SPA)**
   - *Tecnologia:* React + TypeScript + Vite.
   - *Responsabilidade:* Interface do usuário, renderizada no navegador.
2. **API Gateway / Load Balancer**
   - *Responsabilidade:* Roteamento, terminação TLS, Rate Limiting.
3. **Monólito Modular (Backend API)**
   - *Tecnologia:* Node.js (NestJS).
   - *Responsabilidade:* Lógica de negócios, validação de regras, autorização.
4. **Relational Database**
   - *Tecnologia:* PostgreSQL (AWS RDS ou Cloud SQL).
   - *Responsabilidade:* Armazenamento persistente estruturado.
5. **Cache & Fila (Message Broker)**
   - *Tecnologia:* Redis.
   - *Responsabilidade:* Gerenciamento de sessões, fila para envio assíncrono de e-mails e mensagens.

## 3. Segurança de Rede (VPC)
- **Public Subnet:** Apenas o Load Balancer tem IP público.
- **Private Subnet:** Containers do Backend e Banco de Dados não têm acesso direto à internet, protegendo os dados sensíveis contra acessos indevidos.
    `
  },
  {
    id: 'fase-6',
    number: 6,
    title: 'Design System',
    status: 'completed',
    content: `
# Design System: Acolhimento Digital

O Design System da plataforma, batizado de **"Aura"**, foi construído para transmitir segurança, leveza e profissionalismo. Evitamos qualquer semelhança com sistemas hospitalares ou ferramentas de cobrança.

## 1. Paleta de Cores
Cores suaves que reduzem a fadiga visual e promovem tranquilidade.

- **Primária (Acolhimento):** Teal / Turquesa Suave (Confiança, cura, calma).
  - *Base:* \`#0D9488\` (Teal 600)
  - *Fundo de Destaque:* \`#F0FDFA\` (Teal 50)
- **Secundária (Estabilidade):** Azul Ardósia / Slate (Seriedade, estrutura).
  - *Textos Principais:* \`#0F172A\` (Slate 900)
  - *Textos Secundários:* \`#64748B\` (Slate 500)
- **Estado (Alertas Humanizados):**
  - *Sucesso:* Emerald Green
  - *Atenção:* Amber (Usado para lembretes, nunca vermelho alarmante).
  - *Destrutivo:* Rose (Evitamos vermelho puro; usamos tons mais suaves de rosa/vermelho).

## 2. Tipografia
Focada em extrema legibilidade e acessibilidade.

- **Família Principal:** \`Inter\` (Sans-serif geométrica, excelente para interfaces densas de dados).
- **Hierarquia:**
  - *Headings:* Tracking levemente negativo (\`-0.02em\`) para sofisticação.
  - *Corpo de Texto:* Altura de linha generosa (\`1.6\`) para leitura confortável de prontuários extensos.

## 3. Espaçamento e Bordas
- **Bordas (Radii):** Utilização de bordas arredondadas (\`rounded-xl\`, \`rounded-2xl\`) em cards e botões para uma percepção mais amigável e menos "afiada/rígida".
- **Sombras (Shadows):** Sombras difusas e com baixa opacidade para criar profundidade sem pesar a interface (\`shadow-sm\`, \`shadow-md\` com 5% de opacidade negra).

## 4. Microinterações
- Transições suaves (\`200ms ease-in-out\`) em botões e modais.
- Entradas de tela em fade e leve deslocamento vertical, reduzindo a carga cognitiva de mudanças abruptas de contexto.
    `
  },
  {
    id: 'fase-7',
    number: 7,
    title: 'Protótipos de Alta Fidelidade',
    status: 'completed',
    content: `
# Especificação de Interfaces (Protótipos)

O planejamento de UX/UI priorizou a redução de cliques para ações críticas. As seguintes telas principais foram mapeadas para implementação na Fase 10:

## 1. Dashboard do Profissional (Psicólogo/Assistente Social)
- **Layout:** Barra lateral de navegação (minimalista) e área de trabalho ampla.
- **Widgets:**
  - "Meus atendimentos hoje" (Cards com nome abreviado, horário e botão para iniciar telechamada).
  - "Lembretes e Pendências" (Ex: Assinar evolução de ontem).
  - "Métricas de Impacto" (Quantas horas o voluntário doou este mês).

## 2. Prontuário Eletrônico (A Visão Central)
- **Layout Dividido:**
  - *Esquerda (1/3):* Resumo do Paciente (Foto, idade, alertas de vulnerabilidade, contatos).
  - *Direita (2/3):* Timeline de Evoluções (Feed cronológico, similar a uma rede social, mas estritamente clínico).
- **Ações:** Botão flutuante para "Nova Evolução" e "Prescrição". Abas para filtrar por tipo de documento.

## 3. Sala de Teleatendimento
- **Foco no Rosto:** Vídeo em tela cheia com controles discretos (mutar, câmera, chat) em uma barra translúcida inferior.
- **Painel Lateral Retrátil:** Permite ao profissional ler o resumo do prontuário ou fazer anotações rápidas (rascunho) durante a sessão sem sair da tela de vídeo.

## 4. Visão do Beneficiário
- **Mobile-First:** Acesso focado no celular.
- **Home:** Card de "Próxima Consulta", botão de "Emergência" (liga para CVV ou coordenador do projeto), e biblioteca de cartilhas em destaque.
    `
  },
  {
    id: 'fase-8',
    number: 8,
    title: 'Backlog Ágil',
    status: 'completed',
    content: `
# Backlog Ágil (Épicos e Features)

O escopo foi fatiado para garantir entregas de valor contínuas.

## Épico 1: Fundação e Segurança (IAM)
- **F1:** Autenticação JWT e RBAC (Controle de Perfis).
- **F2:** Trilha de Auditoria (Audit Logs) para ações de visualização.
- **F3:** Gestão de Consentimento e Termos de Uso (LGPD).

## Épico 2: Gestão de Beneficiários e Voluntários
- **F1:** Cadastro unificado de beneficiários.
- **F2:** Onboarding de Voluntários (Validação de CRP/OAB).
- **F3:** Agenda compartilhada e gestão de escalas.

## Épico 3: Prontuário Eletrônico e Teleatendimento
- **F1:** Timeline clínica imutável (Evoluções).
- **F2:** Sala de videochamada integrada (WebRTC).
- **F3:** Upload de anexos e laudos PDF.

## Épico 4: Administrativo e BI
- **F1:** Dashboards de demografia e impacto.
- **F2:** Controle de fluxo de caixa de doações.

## Épico 5: IA e Automações
- **F1:** Sumarizador de histórico social (IA).
- **F2:** Integração com WhatsApp para lembretes.
    `
  },
  {
    id: 'fase-9',
    number: 9,
    title: 'Plano de Sprints',
    status: 'completed',
    content: `
# Plano de Desenvolvimento

O projeto será executado em Sprints de 2 semanas, seguindo o framework Scrum.

- **Sprint 1:** Setup de Infraestrutura (Vite, React, Tailwind, Banco de Dados, CI/CD). Implementação do Épico 1 (IAM e Login).
- **Sprint 2:** CRUD de Beneficiários e Voluntários. Telas de perfil e listagens.
- **Sprint 3:** Motor de Agendamento. Definição de horários, cruzamento de disponibilidade entre voluntário e paciente.
- **Sprint 4:** Prontuário Eletrônico (Core Clínico). Timeline, formulário de evolução e assinatura. Auditoria ativa.
- **Sprint 5:** Teleatendimento. Integração de vídeo e chat. Painel lateral do profissional.
- **Sprint 6:** Dashboards (BI), Refinamentos Finais de UI/UX e Testes de Carga.

---

> **Aviso da Arquitetura:** Todas as fases de documentação estratégica, técnica e de design estão concluídas. O terreno está preparado, a arquitetura está sólida e os requisitos de segurança e humanização foram mapeados.
> 
> A próxima etapa (Fase 10) iniciará a **implementação do código** destas interfaces na prática.
    `
  },
  {
    id: 'fase-10',
    number: 10,
    title: 'Implementação e Código',
    status: 'pending',
    content: 'O ambiente está pronto. O desenvolvimento das interfaces e lógicas dos módulos começará a seguir, respeitando rigorosamente o Design System "Aura" e a arquitetura definida.'
  }
];
